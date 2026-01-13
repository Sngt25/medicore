import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id'),
    action: text('action').notNull(),
    detail: text('detail', { mode: 'json' }).$type<Record<string, unknown>>(),
    timestamp: integer('timestamp', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  table => ({
    userIdx: index('audit_user_idx').on(table.userId),
    timestampIdx: index('audit_timestamp_idx').on(table.timestamp),
    actionIdx: index('audit_action_idx').on(table.action)
  })
)
