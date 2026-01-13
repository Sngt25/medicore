// Note: db and schema are auto-imported by NuxtHub v0.10
// They are available globally in server-side code without explicit imports

import * as schemaImport from '../db/schema'

export { sql, eq, and, or } from 'drizzle-orm'

// Export schema as tables for backwards compatibility
export const tables = schemaImport

// Deprecated: use `db` directly instead of `useDrizzle()`
// The db instance is auto-imported on server-side
export function useDrizzle() {
  return db
}

// Type exports
export type User = typeof schemaImport.users.$inferSelect
export type District = typeof schemaImport.districts.$inferSelect
export type Chat = typeof schemaImport.chats.$inferSelect
export type Message = typeof schemaImport.messages.$inferSelect
export type Task = typeof schemaImport.tasks.$inferSelect
export type File = typeof schemaImport.files.$inferSelect
export type AuditLog = typeof schemaImport.auditLogs.$inferSelect
