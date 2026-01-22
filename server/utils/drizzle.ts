import type * as schema from '../db/schema'

export { sql, eq, and, or, desc } from 'drizzle-orm'

export type User = typeof schema.users.$inferSelect
export type District = typeof schema.districts.$inferSelect
export type Chat = typeof schema.chats.$inferSelect
export type Message = typeof schema.messages.$inferSelect
export type Task = typeof schema.tasks.$inferSelect
export type File = typeof schema.files.$inferSelect
export type AuditLog = typeof schema.auditLogs.$inferSelect
