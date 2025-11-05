import { eq } from 'drizzle-orm'
import * as tables from '../../database/schema'

// WebSocket handler for real-time messaging
export default defineWebSocketHandler({
  async upgrade(request) {
    // Require authentication before upgrade
    await requireUserSession(request)
  },

  async open(peer) {
    const { user } = await requireUserSession(peer)
    console.log('[ws] User connected:', user.id, user.email)

    // Store user info in peer context
    peer.ctx = { userId: user.id, role: user.role, districtId: user.districtId }
  },

  async message(peer, message) {
    try {
      const data = JSON.parse(
        typeof message === 'string' ? message : await message.text()
      )
      console.log('[ws] Message received:', data)

      const db = useDrizzle()

      if (data.action === 'subscribe_chat') {
        const chatId = data.chatId

        if (!chatId) {
          peer.send(JSON.stringify({ error: 'Chat ID required' }))
          return
        }

        // Verify access to chat
        const chat = await db
          .select()
          .from(tables.chats)
          .where(eq(tables.chats.id, chatId))
          .get()

        if (!chat) {
          peer.send(JSON.stringify({ error: 'Chat not found' }))
          return
        }

        const canAccess
          = peer.ctx.role === 'admin'
            || chat.patientId === peer.ctx.userId
            || (peer.ctx.role === 'healthcare_worker'
              && chat.districtId === peer.ctx.districtId)

        if (!canAccess) {
          peer.send(JSON.stringify({ error: 'Forbidden' }))
          return
        }

        // Subscribe to chat channel
        peer.subscribe(`chat:${chatId}`)
        peer.send(
          JSON.stringify({
            type: 'subscribed',
            chatId,
            timestamp: new Date().toISOString()
          })
        )
      }
      else if (data.action === 'unsubscribe_chat') {
        const chatId = data.chatId
        if (chatId) {
          peer.unsubscribe(`chat:${chatId}`)
          peer.send(
            JSON.stringify({
              type: 'unsubscribed',
              chatId,
              timestamp: new Date().toISOString()
            })
          )
        }
      }
      else if (data.action === 'subscribe_district_queue') {
        // Healthcare workers subscribe to their district queue
        if (peer.ctx.role !== 'healthcare_worker' || !peer.ctx.districtId) {
          peer.send(
            JSON.stringify({
              error: 'Must be healthcare worker with assigned district'
            })
          )
          return
        }

        peer.subscribe(`district:${peer.ctx.districtId}:queue`)
        peer.send(
          JSON.stringify({
            type: 'subscribed_queue',
            districtId: peer.ctx.districtId,
            timestamp: new Date().toISOString()
          })
        )
      }
      else if (data.action === 'broadcast_message') {
        // Broadcast message to chat channel (called after message is persisted)
        const chatId = data.chatId
        const messageData = data.message

        if (chatId && messageData) {
          peer.publish(
            `chat:${chatId}`,
            JSON.stringify({
              type: 'new_message',
              chatId,
              message: messageData,
              timestamp: new Date().toISOString()
            })
          )
        }
      }
    }
    catch (error) {
      console.error('[ws] Error processing message:', error)
      peer.send(JSON.stringify({ error: 'Internal server error' }))
    }
  },

  close(peer) {
    console.log('[ws] User disconnected:', peer.ctx?.userId)
  },

  error(peer, error) {
    console.error('[ws] WebSocket error for user', peer.ctx?.userId, ':', error)
  }
})
