// Re-export db and schema from hub:db (auto-imported in NuxtHub v0.10)
// The db instance is auto-imported on server-side, but we keep these exports for type safety
export { db, schema } from 'hub:db'

export { sql, eq, and, or } from 'drizzle-orm'

// For backwards compatibility, export schema as tables
export { schema as tables } from 'hub:db'

// Deprecated: use `db` directly instead of `useDrizzle()`
// The db instance is auto-imported on server-side
export function useDrizzle() {
  return db
}

// Type exports - update path from database to db
export type User = typeof schema.users.$inferSelect
export type District = typeof schema.districts.$inferSelect
export type Chat = typeof schema.chats.$inferSelect
export type Message = typeof schema.messages.$inferSelect
export type Task = typeof schema.tasks.$inferSelect
export type File = typeof schema.files.$inferSelect
export type AuditLog = typeof schema.auditLogs.$inferSelect
