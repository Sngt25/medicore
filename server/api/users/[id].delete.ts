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
      message: 'User ID is required'
    })
  }

  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .get()

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }

  if (user.role === 'admin') {
    throw createError({
      statusCode: 400,
      message: 'Cannot delete admin users'
    })
  }

  const chats = await db
    .select()
    .from(schema.chats)
    .where(eq(schema.chats.assignedWorkerId, id))
    .all()

  if (chats.length > 0) {
    throw createError({
      statusCode: 400,
      message:
        'Cannot delete user with active chats. Please reassign or close them first.'
    })
  }

  await db.delete(schema.users).where(eq(schema.users.id, id)).run()

  await db
    .insert(schema.auditLogs)
    .values({
      userId: session.user.id,
      action: 'user_deleted',
      detail: { deletedUserId: id, deletedUserEmail: user.email }
    })
    .run()

  return { success: true }
})
