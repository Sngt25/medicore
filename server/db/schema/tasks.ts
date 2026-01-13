import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text('title').notNull(),
    description: text('description'),
    dueAt: integer('due_at', { mode: 'timestamp' }),
    priority: text('priority', { enum: ['low', 'medium', 'high'] })
      .default('medium')
      .notNull(),
    status: text('status', { enum: ['todo', 'in_progress', 'done'] })
      .default('todo')
      .notNull(),
    linkedPatientId: text('linked_patient_id'),
    linkedChatId: text('linked_chat_id'),
    createdByWorkerId: text('created_by_worker_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
  },
  table => ({
    workerIdx: index('task_worker_idx').on(table.createdByWorkerId),
    statusIdx: index('task_status_idx').on(table.status),
    patientIdx: index('task_patient_idx').on(table.linkedPatientId)
  })
)
