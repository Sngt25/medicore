import { drizzle } from 'drizzle-orm/d1'

import * as schema from '../database/schema'

export { sql, eq, and, or } from 'drizzle-orm'

export const tables = schema

export function useDrizzle() {
  return drizzle(hubDatabase(), { schema })
}

export type User = typeof schema.users.$inferSelect
export type District = typeof schema.districts.$inferSelect
export type Chat = typeof schema.chats.$inferSelect
export type Message = typeof schema.messages.$inferSelect
export type Task = typeof schema.tasks.$inferSelect
export type File = typeof schema.files.$inferSelect
export type AuditLog = typeof schema.auditLogs.$inferSelect
