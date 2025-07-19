import { Hono } from 'hono'
import { createNodeWebSocket } from '@hono/node-ws'
import type { WebSocket } from 'ws'

const app = new Hono()

// Store for WebSocket connections
const connections = new Set<WebSocket>()

// Create WebSocket upgrade handler
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

// WebSocket endpoint
app.get('/ws', upgradeWebSocket((c) => {
  return {
    onOpen(_evt, ws) {
      connections.add(ws.raw as WebSocket)
    },
    onMessage(event, ws) {

    },
    onClose: (_evt, ws) => {
      connections.delete(ws.raw as WebSocket)
    },
    onError: (err, ws) => {
      console.error('❌ Hono WebSocket error:', err)
      connections.delete(ws.raw as WebSocket)
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