export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Admin access required'
    })
  }

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'District ID is required'
    })
  }

  const users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.districtId, id))
    .all()

  const chats = await db
    .select()
    .from(schema.chats)
    .where(eq(schema.chats.districtId, id))
    .all()

  if (users.length > 0 || chats.length > 0) {
    throw createError({
      statusCode: 400,
      message: 'Cannot delete district with associated users or chats'
    })
  }

  await db
    .delete(schema.districts)
    .where(eq(schema.districts.id, id))
    .run()

  await db
    .insert(schema.auditLogs)
    .values({
      userId: session.user.id,
      action: 'district_deleted',
      detail: { districtId: id }
    })

  return { success: true }
})
