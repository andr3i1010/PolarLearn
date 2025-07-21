import { Hono } from 'hono'
import { createNodeWebSocket } from '@hono/node-ws'
import type { WebSocket } from 'ws'
import { prisma } from '@/utils/prisma'
import crypto from 'crypto'
import { compactDecrypt } from 'jose'

async function decodeCookieHono(cookie: string): Promise<string | null> {
  try {
    const secret = crypto.createHash('sha256').update(process.env.SECRET as string).digest();
    const { plaintext } = await compactDecrypt(cookie, secret);
    const decoded = JSON.parse(new TextDecoder().decode(plaintext)) as { sessionId: string; exp: number };
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded.sessionId;
  } catch (error) {
    console.error("Failed to decode cookie:", error)
    return null
  }
}

const app = new Hono()

// Store for WebSocket connections
const connections = new Set<WebSocket>()
// Map to track group subscriptions: WebSocket -> groupId
const wsGroups = new Map<WebSocket, string>()
// Map to store user info from session: WebSocket -> { id, name }
const wsUsers = new Map<WebSocket, { id: string, name: string }>()

// Create WebSocket upgrade handler
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

// Cookie parsing utility
function parseCookies(cookieHeader?: string) {
  if (!cookieHeader) return {}
  return Object.fromEntries(
    cookieHeader.split(';').map(cookie => {
      const [key, ...v] = cookie.trim().split('=')
      return [key, decodeURIComponent(v.join('='))]
    })
  )
}

// WebSocket endpoint
app.get('/ws', upgradeWebSocket((c) => {
  return {
    async onOpen(_evt, ws) {
      connections.add(ws.raw as WebSocket)
      // Parse session cookie and fetch user info
      try {
        const cookies = parseCookies(c.req.header('cookie'))
        const sessionId = cookies['polarlearn.session-id']
        if (!sessionId) {
          return
        }
        const sessionDecoded = await decodeCookieHono(sessionId)
        const session = await prisma.session.findFirst({
          where: {
            sessionID: sessionDecoded as string
          }
        })
        let user = null
        if (session && session.id) {
          user = await prisma.user.findUnique({ where: { id: session.userId } })
        }
        if (user) {
          wsUsers.set(ws.raw as WebSocket, { id: user.id, name: user.name ?? 'anonymous' })
        }
      } catch (err) {
        console.error('Failed to fetch user for websocket:', err)
      }
    },
    async onMessage(event, ws) {
      try {
        const data = JSON.parse(event.data as string)
        if (data.event === "subscribe") {
          // Extract groupId from the page path (e.g., /learn/group/[id])
          const groupId = typeof data.page === "string" ? data.page.split("/")[3] : undefined
          if (groupId) {
            wsGroups.set(ws.raw as WebSocket, groupId)
          }
        }
        if (data.event === "chat") {
          const groupId = data.group;
          const user = wsUsers.get(ws.raw as WebSocket);
          let creatorImage: string | undefined = undefined;
          if (user?.id) {
            // Fetch user from DB to get image if available
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: { image: true, id: true, name: true },
            });
            console.log('dbUser for chat message:', dbUser);
            if (dbUser && dbUser.image) {
              creatorImage = dbUser.image;
            }
          }
          // Use the creator from the client message
          const chatMessage: any = {
            group: groupId,
            content: data.message,
            creator: user?.name || "anonymous",
            creatorId: user?.id || null,
            time: new Date().toISOString(),
          };
          if (creatorImage) {
            chatMessage.creatorImage = creatorImage;
          }
          // Push message to group's chatContent array in DB
          await prisma.group.update({
            where: { groupId },
            data: {
              chatContent: {
                push: chatMessage,
              },
            },
          });
          // Broadcast only to connections subscribed to this group
          for (const client of connections) {
            if (
              client.readyState === 1 && // 1 = OPEN
              wsGroups.get(client) === groupId
            ) {
              client.send(
                JSON.stringify({
                  type: "chat-message",
                  message: chatMessage,
                })
              );
            }
          }
        }
        if (data.event === "delete-chat-message") {
          const groupId = data.group;
          const user = wsUsers.get(ws.raw as WebSocket);
          if (!user) return;
          // Fetch group info
          const group = await prisma.group.findUnique({ where: { groupId } });
          if (!group) return;
          // RBAC: Only group creator, group admins, or platform admins can delete
          const isCreator = group.creator === user.id || group.creator === user.name;
          const isAdmin = Array.isArray(group.admins) && group.admins.includes(user.id);
          // Platform admin check (user.role === 'admin')
          let isPlatformAdmin = false;
          const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
          if (dbUser && dbUser.role === 'admin') isPlatformAdmin = true;
          if (!(isCreator || isAdmin || isPlatformAdmin)) {
            // Not authorized
            ws.send(JSON.stringify({ type: 'error', message: 'Je hebt geen rechten om dit bericht te verwijderen.' }));
            return;
          }
          if (Array.isArray(group.chatContent)) {
            // Filter out nulls to avoid Prisma type errors
            const filteredChatContent = group.chatContent.filter(
              (msg: any) =>
                msg &&
                !(msg.time === data.time && msg.creator === data.creator && msg.content === data.content)
            ) as any[]; // Cast to any[] to satisfy Prisma's InputJsonValue[]
            await prisma.group.update({
              where: { groupId },
              data: { chatContent: filteredChatContent }
            });
            // Broadcast deletion to all clients in the group
            for (const client of connections) {
              if (
                client.readyState === 1 &&
                wsGroups.get(client) === groupId
              ) {
                client.send(JSON.stringify({
                  type: "chat-message-deleted",
                  time: data.time,
                  creator: data.creator,
                  content: data.content
                }));
              }
            }
          }
        }
        // Optionally handle other events here
      } catch (err) {
        console.error("Error handling WebSocket message:", err)
      }
    },
    onClose: (_evt, ws) => {
      connections.delete(ws.raw as WebSocket)
      wsGroups.delete(ws.raw as WebSocket)
      wsUsers.delete(ws.raw as WebSocket)
    },
    onError: (err, ws) => {
      console.error('❌ Hono WebSocket error:', err)
      connections.delete(ws.raw as WebSocket)
      wsGroups.delete(ws.raw as WebSocket)
      wsUsers.delete(ws.raw as WebSocket)
    }
  }
}))

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    server: 'hono',
    connections: connections.size,
    timestamp: new Date().toISOString()
  })
})

export { app as honoApp, injectWebSocket }