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

  const users = await useDrizzle()
    .select()
    .from(tables.users)
    .where(eq(tables.users.districtId, id))
    .all()

  const chats = await useDrizzle()
    .select()
    .from(tables.chats)
    .where(eq(tables.chats.districtId, id))
    .all()

  if (users.length > 0 || chats.length > 0) {
    throw createError({
      statusCode: 400,
      message: 'Cannot delete district with associated users or chats'
    })
  }

  await useDrizzle()
    .delete(tables.districts)
    .where(eq(tables.districts.id, id))
    .run()

  await useDrizzle()
    .insert(tables.auditLogs)
    .values({
      userId: session.user.id,
      action: 'district_deleted',
      detail: { districtId: id }
    })

  return { success: true }
})
