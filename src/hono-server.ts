import { Hono } from 'hono'
import { createNodeWebSocket } from '@hono/node-ws'
import type { WebSocket } from 'ws'
import { prisma } from '@/utils/prisma'
import crypto from 'crypto'
import { compactDecrypt } from 'jose'
import { Kafka, Producer, Consumer } from 'kafkajs'

// Types
interface ChatMessage {
  group: string
  content: string
  creator: string
  creatorId: string | null
  creatorImage?: string
  time: string
}

interface WSUser {
  id: string
  name: string
}

interface WebSocketData {
  event: string
  [key: string]: any
}

interface KafkaMessage {
  groupId: string
  chatMessage?: ChatMessage
  deleteData?: {
    time: string
    creator: string
    content: string
  }
  instanceId?: string
}

// Utilities
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

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {}
  return Object.fromEntries(
    cookieHeader.split(';').map(cookie => {
      const [key, ...v] = cookie.trim().split('=')
      return [key, decodeURIComponent(v.join('='))]
    })
  )
}

// Kafka Configuration
const kafkaEnabled = process.env.KAFKA_BROKERS && process.env.KAFKA_CLIENT_ID
const CHAT_TOPIC = 'chat-messages'
const DELETE_CHAT_TOPIC = 'delete-chat-messages'

// WebSocket Connection Management
class WebSocketManager {
  private connections = new Set<WebSocket>()
  private wsGroups = new Map<WebSocket, string>()
  private wsUsers = new Map<WebSocket, WSUser>()

  addConnection(ws: WebSocket): void {
    this.connections.add(ws)
  }

  removeConnection(ws: WebSocket): void {
    this.connections.delete(ws)
    this.wsGroups.delete(ws)
    this.wsUsers.delete(ws)
  }

  setUserGroup(ws: WebSocket, groupId: string): void {
    this.wsGroups.set(ws, groupId)
  }

  setUserInfo(ws: WebSocket, user: WSUser): void {
    this.wsUsers.set(ws, user)
  }

  getUser(ws: WebSocket): WSUser | undefined {
    return this.wsUsers.get(ws)
  }

  getConnectionsInGroup(groupId: string): WebSocket[] {
    return Array.from(this.connections).filter(ws =>
      ws.readyState === 1 && this.wsGroups.get(ws) === groupId
    )
  }

  getConnectionCount(): number {
    return this.connections.size
  }

  broadcastToGroup(groupId: string, message: any): void {
    const clients = this.getConnectionsInGroup(groupId)
    const messageStr = JSON.stringify(message)

    clients.forEach(client => {
      try {
        client.send(messageStr)
      } catch (error) {
        console.error('Error sending message to client:', error)
        this.removeConnection(client)
      }
    })
  }
}

// Kafka Manager
class KafkaManager {
  private kafka: Kafka | null = null
  private producer: Producer | null = null
  private consumer: Consumer | null = null
  private wsManager: WebSocketManager

  constructor(wsManager: WebSocketManager) {
    this.wsManager = wsManager

    if (kafkaEnabled) {
      this.kafka = new Kafka({
        clientId: process.env.KAFKA_CLIENT_ID!,
        brokers: process.env.KAFKA_BROKERS!.split(',')
      })
      this.producer = this.kafka.producer()
      this.consumer = this.kafka.consumer({ groupId: 'chat-consumers' })
    }
  }

  async initialize(): Promise<void> {
    if (!kafkaEnabled || !this.producer || !this.consumer) {
      console.log('ℹ️ Kafka is niet ingeschakeld. Kafka is alleen voor productieomgevingen nodig, dus maak je geen zorgen :)')
      return
    }

    try {
      await this.producer.connect()
      await this.consumer.connect()

      await this.consumer.subscribe({ topic: CHAT_TOPIC })
      await this.consumer.subscribe({ topic: DELETE_CHAT_TOPIC })

      await this.consumer.run({
        eachMessage: async ({ topic, message }) => {
          try {
            const messageData: KafkaMessage = JSON.parse(message.value?.toString() || '{}')
            this.handleKafkaMessage(topic, messageData)
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

  private handleKafkaMessage(topic: string, messageData: KafkaMessage): void {
    const { groupId } = messageData

    if (topic === CHAT_TOPIC && messageData.chatMessage) {
      this.wsManager.broadcastToGroup(groupId, {
        type: "chat-message",
        message: messageData.chatMessage,
      })
    } else if (topic === DELETE_CHAT_TOPIC && messageData.deleteData) {
      this.wsManager.broadcastToGroup(groupId, {
        type: "chat-message-deleted",
        ...messageData.deleteData
      })
    }
  }

  async publishChatMessage(groupId: string, chatMessage: ChatMessage): Promise<boolean> {
    if (!this.producer) {
      return false
    }

    try {
      await this.producer.send({
        topic: CHAT_TOPIC,
        messages: [{
          value: JSON.stringify({
            groupId,
            chatMessage,
            instanceId: process.env.INSTANCE_ID || 'unknown'
          } as KafkaMessage)
        }]
      })
      return true
    } catch (error) {
      console.error('Failed to publish chat message to Kafka:', error)
      return false
    }
  }

  async publishDeleteMessage(groupId: string, deleteData: { time: string, creator: string, content: string }): Promise<boolean> {
    if (!this.producer) {
      return false
    }

    try {
      await this.producer.send({
        topic: DELETE_CHAT_TOPIC,
        messages: [{
          value: JSON.stringify({
            groupId,
            deleteData,
            instanceId: process.env.INSTANCE_ID || 'unknown'
          } as KafkaMessage)
        }]
      })
      return true
    } catch (error) {
      console.error('Failed to publish delete message to Kafka:', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.producer) await this.producer.disconnect()
      if (this.consumer) await this.consumer.disconnect()
      if (this.producer || this.consumer) {
        console.log('✅ Kafka connections closed')
      }
    } catch (error) {
      console.error('Error closing Kafka connections:', error)
    }
  }

  getStatus() {
    return kafkaEnabled ? {
      enabled: true,
      producer: this.producer ? 'connected' : 'disconnected',
      consumer: this.consumer ? 'connected' : 'disconnected'
    } : {
      enabled: false,
      reason: 'KAFKA_BROKERS and KAFKA_CLIENT_ID environment variables not set'
    }
  }
}

// Chat Service
class ChatService {
  private wsManager: WebSocketManager
  private kafkaManager: KafkaManager

  constructor(wsManager: WebSocketManager, kafkaManager: KafkaManager) {
    this.wsManager = wsManager
    this.kafkaManager = kafkaManager
  }

  async handleChatMessage(ws: WebSocket, data: any): Promise<void> {
    const groupId = data.group
    const user = this.wsManager.getUser(ws)

    if (!groupId || !user) {
      console.error('Missing groupId or user for chat message')
      return
    }

    let creatorImage: string | undefined

    // Fetch user image if available
    if (user.id) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { image: true },
        })
        if (dbUser?.image) {
          creatorImage = dbUser.image
        }
      } catch (error) {
        console.error('Error fetching user image:', error)
      }
    }

    const chatMessage: ChatMessage = {
      group: groupId,
      content: data.message,
      creator: user.name,
      creatorId: user.id,
      time: new Date().toISOString(),
      ...(creatorImage && { creatorImage })
    }

    // Save to database
    try {
      await prisma.group.update({
        where: { groupId },
        data: {
          chatContent: {
            push: chatMessage as any, // Cast to satisfy Prisma's InputJsonValue
          },
        },
      })
    } catch (error) {
      console.error('Error saving chat message to database:', error)
      return
    }

    // Broadcast message
    const published = await this.kafkaManager.publishChatMessage(groupId, chatMessage)

    if (!published) {
      // Fallback to local broadcasting if Kafka fails
      this.wsManager.broadcastToGroup(groupId, {
        type: "chat-message",
        message: chatMessage,
      })
    }
  }

  async handleDeleteChatMessage(ws: WebSocket, data: any): Promise<void> {
    const groupId = data.group
    const user = this.wsManager.getUser(ws)

    if (!groupId || !user) {
      console.error('Missing groupId or user for delete message')
      return
    }

    // Authorization check
    const isAuthorized = await this.checkDeleteAuthorization(user.id, groupId)
    if (!isAuthorized) {
      try {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Je hebt geen rechten om dit bericht te verwijderen.'
        }))
      } catch (error) {
        console.error('Error sending authorization error:', error)
      }
      return
    }

    // Remove message from database
    try {
      const group = await prisma.group.findUnique({ where: { groupId } })
      if (!group || !Array.isArray(group.chatContent)) {
        return
      }

      const filteredChatContent = group.chatContent.filter(
        (msg: any) =>
          msg &&
          !(msg.time === data.time && msg.creator === data.creator && msg.content === data.content)
      ) as any[]

      await prisma.group.update({
        where: { groupId },
        data: { chatContent: filteredChatContent }
      })
    } catch (error) {
      console.error('Error deleting chat message from database:', error)
      return
    }

    // Broadcast delete message
    const deleteData = {
      time: data.time,
      creator: data.creator,
      content: data.content
    }

    const published = await this.kafkaManager.publishDeleteMessage(groupId, deleteData)

    if (!published) {
      // Fallback to local broadcasting if Kafka fails
      this.wsManager.broadcastToGroup(groupId, {
        type: "chat-message-deleted",
        ...deleteData
      })
    }
  }

  private async checkDeleteAuthorization(userId: string, groupId: string): Promise<boolean> {
    try {
      const [group, user] = await Promise.all([
        prisma.group.findUnique({ where: { groupId } }),
        prisma.user.findUnique({ where: { id: userId }, select: { role: true, name: true } })
      ])

      if (!group || !user) {
        return false
      }

      // Platform admin check
      if (user.role === 'admin') {
        return true
      }

      // Group creator check
      if (group.creator === userId || group.creator === user.name) {
        return true
      }

      // Group admin check
      if (Array.isArray(group.admins) && group.admins.includes(userId)) {
        return true
      }

      return false
    } catch (error) {
      console.error('Error checking delete authorization:', error)
      return false
    }
  }

  handleSubscribe(ws: WebSocket, data: any): void {
    const groupId = typeof data.page === "string" ? data.page.split("/")[3] : undefined
    if (groupId) {
      this.wsManager.setUserGroup(ws, groupId)
    }
  }
}

// Initialize managers
const wsManager = new WebSocketManager()
const kafkaManager = new KafkaManager(wsManager)
const chatService = new ChatService(wsManager, kafkaManager)

// Initialize Kafka on startup
kafkaManager.initialize()

const app = new Hono()

// Create WebSocket upgrade handler
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

// WebSocket endpoint
app.get('/ws', upgradeWebSocket((c) => {
  return {
    async onOpen(_evt, ws) {
      wsManager.addConnection(ws.raw as WebSocket)

      // Parse session cookie and fetch user info
      try {
        const cookies = parseCookies(c.req.header('cookie'))
        const sessionId = cookies['polarlearn.session-id']

        if (sessionId) {
          const sessionDecoded = await decodeCookieHono(sessionId)
          if (sessionDecoded) {
            const session = await prisma.session.findFirst({
              where: { sessionID: sessionDecoded }
            })

            if (session?.userId) {
              const user = await prisma.user.findUnique({
                where: { id: session.userId },
                select: { id: true, name: true }
              })

              if (user) {
                wsManager.setUserInfo(ws.raw as WebSocket, {
                  id: user.id,
                  name: user.name ?? 'anonymous'
                })
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch user for websocket:', err)
      }
    },

    async onMessage(event, ws) {
      try {
        const data: WebSocketData = JSON.parse(event.data as string)

        switch (data.event) {
          case "subscribe":
            chatService.handleSubscribe(ws.raw as WebSocket, data)
            break
          case "chat":
            await chatService.handleChatMessage(ws.raw as WebSocket, data)
            break
          case "delete-chat-message":
            await chatService.handleDeleteChatMessage(ws.raw as WebSocket, data)
            break
          default:
            console.warn('Unknown WebSocket event:', data.event)
        }
      } catch (err) {
        console.error("Error handling WebSocket message:", err)
      }
    },

    onClose: (_evt, ws) => {
      wsManager.removeConnection(ws.raw as WebSocket)
    },

    onError: (err, ws) => {
      console.error('❌ Hono WebSocket error:', err)
      wsManager.removeConnection(ws.raw as WebSocket)
    }
  }
}))

// Health check endpoint
app.get('/health', (c) => {
  const kafkaStatus = kafkaManager.getStatus()

  return c.json({
    status: 'ok',
    server: 'hono',
    connections: wsManager.getConnectionCount(),
    kafka: kafkaStatus,
    timestamp: new Date().toISOString()
  })
})

// Graceful shutdown
async function gracefulShutdown() {
  console.log('Shutting down gracefully...')
  try {
    await kafkaManager.disconnect()
  } catch (error) {
    console.error('Error during graceful shutdown:', error)
  }
  process.exit(0)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

export { app as honoApp, injectWebSocket }