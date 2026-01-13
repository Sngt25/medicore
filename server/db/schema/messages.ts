import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const messages = sqliteTable(
  'messages',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    chatId: text('chat_id').notNull(),
    senderId: text('sender_id').notNull(),
    body: text('body').notNull(),
    // Store attachment references as JSON array
    attachments: text('attachments', { mode: 'json' }).$type<string[]>(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  table => ({
    chatIdx: index('message_chat_idx').on(table.chatId),
    createdAtIdx: index('message_created_at_idx').on(table.createdAt)
  })
)
