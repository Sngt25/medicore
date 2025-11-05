import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const chats = sqliteTable(
  'chats',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    districtId: text('district_id').notNull(),
    patientId: text('patient_id').notNull(),
    assignedWorkerId: text('assigned_worker_id'),
    status: text('status', { enum: ['queued', 'active', 'closed'] })
      .default('queued')
      .notNull(),
    initialDescription: text('initial_description').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    closedAt: integer('closed_at', { mode: 'timestamp' })
  },
  table => ({
    districtStatusIdx: index('chat_district_status_idx').on(
      table.districtId,
      table.status
    ),
    patientIdx: index('chat_patient_idx').on(table.patientId),
    workerIdx: index('chat_worker_idx').on(table.assignedWorkerId)
  })
)
