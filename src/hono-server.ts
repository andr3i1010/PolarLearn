import { Hono } from 'hono'
import { createNodeWebSocket } from '@hono/node-ws'
import type { WebSocket } from 'ws'
import { prisma } from '@/utils/prisma'
import crypto from 'crypto'
import { compactDecrypt } from 'jose'
import { Kafka, Producer, Consumer } from 'kafkajs'

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

// Initialize Kafka only if environment variables are set
let kafka: Kafka | null = null
let producer: Producer | null = null
let consumer: Consumer | null = null

// Check if Kafka should be enabled
const kafkaEnabled = process.env.KAFKA_BROKERS && process.env.KAFKA_CLIENT_ID

if (kafkaEnabled) {
  kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID!,
    brokers: process.env.KAFKA_BROKERS!.split(',')
  })
  producer = kafka.producer()
  consumer = kafka.consumer({ groupId: 'chat-consumers' })
}

// Topics
const CHAT_TOPIC = 'chat-messages'
const DELETE_CHAT_TOPIC = 'delete-chat-messages'

// Store for WebSocket connections
const connections = new Set<WebSocket>()
// Map to track group subscriptions: WebSocket -> groupId
const wsGroups = new Map<WebSocket, string>()
// Map to store user info from session: WebSocket -> { id, name, role? }
const wsUsers = new Map<WebSocket, { id: string, name: string, role?: string }>()

// Initialize Kafka producer and consumer
async function initKafka() {
  if (!kafkaEnabled || !producer || !consumer) {
    console.log('ℹ️ Kafka is niet ingeschakeld. Kafka is alleen voor productieomgevingen nodig, dus maak je geen zorgen :)')
    return
  }

  try {
    await producer.connect()
    await consumer.connect()

    await consumer.subscribe({ topic: CHAT_TOPIC })
    await consumer.subscribe({ topic: DELETE_CHAT_TOPIC })

    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const messageData = JSON.parse(message.value?.toString() || '{}')

          if (topic === CHAT_TOPIC) {
            // Broadcast chat message to all connected clients in the group
            const { groupId, chatMessage } = messageData
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
          } else if (topic === DELETE_CHAT_TOPIC) {
            // Broadcast delete message to all connected clients in the group
            const { groupId, deleteData } = messageData
            for (const client of connections) {
              if (
                client.readyState === 1 &&
                wsGroups.get(client) === groupId
              ) {
                client.send(JSON.stringify({
                  type: "chat-message-deleted",
                  time: deleteData.time,
                  creator: deleteData.creator,
                  content: deleteData.content
                }));
              }
            }
          }
        } catch (error) {
          console.error('Error processing Kafka message:', error)
        }
      },
    })
    console.log('✅ Met succes met Kafka verbonden!')
  } catch (error) {
    console.error('❌ Failed to initialize Kafka:', error)
  }
}

// Initialize Kafka on startup
initKafka()

const app = new Hono()

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
        if (session && session.userId) {
          user = await prisma.user.findUnique({ where: { id: session.userId } })
        }
        if (user) {
          // Store id, name and role to use for permission checks in message handler
          wsUsers.set(ws.raw as WebSocket, { id: user.id, name: user.name ?? 'onbekend', role: user.role || "" })
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
          if (!groupId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Ongeldige groepspagina.' }))
            return
          }
          const user = wsUsers.get(ws.raw as WebSocket)
          if (!user) {
            ws.send(JSON.stringify({ type: 'error', message: 'Je moet ingelogd zijn om de groepschat te bekijken.' }))
            return
          }

          // Verify the user is allowed to subscribe to this group
          const group = await prisma.group.findUnique({ where: { groupId } })
          if (!group) {
            ws.send(JSON.stringify({ type: 'error', message: 'Groep niet gevonden.' }))
            return
          }

          const members = Array.isArray(group.members) ? group.members as string[] : []
          const isCreator = group.creator === user.id || group.creator === user.name
          const isAdmin = Array.isArray(group.admins) && user ? group.admins.includes(user.id) : false
          const isMember = members.includes(user.id) || members.includes(user.name) || isCreator
          const isPlatformAdmin = user.role === 'admin'

          if (!(isMember || isAdmin || isPlatformAdmin)) {
            ws.send(JSON.stringify({ type: 'error', message: 'Je bent geen lid van deze groep.' }))
            return
          }

          wsGroups.set(ws.raw as WebSocket, groupId)
          ws.send(JSON.stringify({ type: 'subscribed', groupId }))
        }
        if (data.event === "unsubscribe") {
          // Remove the WebSocket from group subscription
          wsGroups.delete(ws.raw as WebSocket)
        }
        if (data.event === "chat") {
          const groupId = data.group;
          if (!groupId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Ongeldige groep.' }))
            return
          }

          const user = wsUsers.get(ws.raw as WebSocket)
          if (!user) {
            ws.send(JSON.stringify({ type: 'error', message: 'Je moet ingelogd zijn om berichten te plaatsen.' }))
            return
          }

          // Fetch group to verify membership/permissions
          const group = await prisma.group.findUnique({ where: { groupId } })
          if (!group) {
            ws.send(JSON.stringify({ type: 'error', message: 'Groep niet gevonden.' }))
            return
          }

          const members = Array.isArray(group.members) ? group.members as string[] : []
          const isCreator = group.creator === user.id || group.creator === user.name
          const isAdmin = Array.isArray(group.admins) && user ? group.admins.includes(user.id) : false

          // Check platform admin, prefer role stored from onOpen but verify with DB if missing
          let isPlatformAdmin = user.role === 'admin'
          if (!isPlatformAdmin) {
            const roleCheck = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
            if (roleCheck && roleCheck.role === 'admin') isPlatformAdmin = true
          }

          const isMember = members.includes(user.id) || members.includes(user.name) || isCreator
          if (!(isMember || isAdmin || isPlatformAdmin)) {
            ws.send(JSON.stringify({ type: 'error', message: 'Je hebt geen toestemming om in deze groep te chatten.' }))
            return
          }

          // Fetch user details (for image/name) and sanitize message
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { image: true, id: true, name: true },
          })

          const messageText = typeof data.message === 'string' ? data.message.trim() : ''
          if (!messageText) {
            ws.send(JSON.stringify({ type: 'error', message: 'Leeg bericht.' }))
            return
          }
          const truncatedMessage = messageText.length > 2000 ? messageText.slice(0, 2000) : messageText
          const creatorImage = dbUser?.image

          const chatMessage: any = {
            group: groupId,
            content: truncatedMessage,
            creator: dbUser?.name || user.name || "?",
            creatorId: user.id,
            time: new Date().toISOString(),
          }
          if (creatorImage) {
            chatMessage.creatorImage = creatorImage
          }

          // Push message to group's chatContent array in DB
          await prisma.group.update({
            where: { groupId },
            data: {
              chatContent: {
                push: chatMessage,
              },
            },
          })

          // Publish message to Kafka for broadcasting to all instances
          if (producer) {
            try {
              await producer.send({
                topic: CHAT_TOPIC,
                messages: [
                  {
                    value: JSON.stringify({
                      groupId,
                      chatMessage,
                      instanceId: process.env.INSTANCE_ID || 'unknown' // Optional: for debugging
                    })
                  }
                ]
              })
            } catch (error) {
              console.error('Failed to publish chat message to Kafka:', error)
              // Fallback to local broadcasting if Kafka fails
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
          } else {
            // No Kafka - use local broadcasting only
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

            // Publish delete message to Kafka for broadcasting to all instances
            if (producer) {
              try {
                await producer.send({
                  topic: DELETE_CHAT_TOPIC,
                  messages: [
                    {
                      value: JSON.stringify({
                        groupId,
                        deleteData: {
                          time: data.time,
                          creator: data.creator,
                          content: data.content
                        },
                        instanceId: process.env.INSTANCE_ID || 'unknown'
                      })
                    }
                  ]
                })
              } catch (error) {
                console.error('Failed to publish delete message to Kafka:', error)
                // Fallback to local broadcasting if Kafka fails
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
            } else {
              // No Kafka - use local broadcasting only
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
  const kafkaStatus = kafkaEnabled ? {
    enabled: true,
    producer: producer ? 'connected' : 'disconnected',
    consumer: consumer ? 'connected' : 'disconnected'
  } : {
    enabled: false,
    reason: 'KAFKA_BROKERS and KAFKA_CLIENT_ID environment variables not set'
  }

  return c.json({
    status: 'ok',
    server: 'hono',
    connections: connections.size,
    kafka: kafkaStatus,
    timestamp: new Date().toISOString()
  })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...')
  try {
    if (producer) await producer.disconnect()
    if (consumer) await consumer.disconnect()
    if (producer || consumer) {
      console.log('✅ Kafka connections closed')
    }
  } catch (error) {
    console.error('Error closing Kafka connections:', error)
  }
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...')
  try {
    if (producer) await producer.disconnect()
    if (consumer) await consumer.disconnect()
    if (producer || consumer) {
      console.log('✅ Kafka connections closed')
    }
  } catch (error) {
    console.error('Error closing Kafka connections:', error)
  }
  process.exit(0)
})

export { app as honoApp, injectWebSocket }