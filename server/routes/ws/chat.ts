import { eq } from 'drizzle-orm'

export default defineWebSocketHandler({
  async open(peer) {
    const { user } = await requireUserSession(peer)
    console.log('[ws] User connected:', user.id, user.email)
    // @ts-expect-error - Attach user to peer
    peer.user = user
  },

  async message(peer, message) {
    try {
      const data = JSON.parse(
        typeof message === 'string' ? message : await message.text()
      )
      console.log('[ws] Message received:', data)

      if (data.action === 'subscribe_chat') {
        const chatId = data.chatId

        if (!chatId) {
          peer.send(JSON.stringify({ error: 'Chat ID required' }))
          return
        }

        // Verify access to chat
        const chat = await db
          .select()
          .from(schema.chats)
          .where(eq(schema.chats.id, chatId))
          .get()

        if (!chat) {
          peer.send(JSON.stringify({ error: 'Chat not found' }))
          return
        }

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
        const { user } = await requireUserSession(peer)

        if (user.role !== 'healthcare_worker' || !user.districtId) {
          peer.send(
            JSON.stringify({
              error: 'Must be healthcare worker with assigned district'
            })
          )
          return
        }

        peer.subscribe(`district:${user.districtId}:queue`)
        peer.send(
          JSON.stringify({
            type: 'subscribed_queue',
            districtId: user.districtId,
            timestamp: new Date().toISOString()
          })
        )
      }
      else if (data.action === 'broadcast_message') {
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
    // @ts-expect-error - User attached in open
    console.log('[ws] User disconnected:', peer.user?.id)
  },

  error(peer, error) {
    // @ts-expect-error - User attached in open
    console.error('[ws] WebSocket error for user', peer.user?.id, ':', error)
  }
})
