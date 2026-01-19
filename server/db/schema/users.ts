import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role', {
    enum: ['admin', 'healthcare_worker', 'patient']
  }).default('patient'),
  districtId: text('district_id'),
  googleSub: text('google_sub').notNull().unique(),
  avatar: text('avatar'),
  verified: integer('verified', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
})
