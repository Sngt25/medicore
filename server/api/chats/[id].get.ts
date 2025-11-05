export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Chat ID is required'
    })
  }

  const chat = await useDrizzle()
    .select()
    .from(tables.chats)
    .where(eq(tables.chats.id, id))
    .get()

  if (!chat) {
    throw createError({
      statusCode: 404,
      message: 'Chat not found'
    })
  }

  const canAccess
    = session.user.role === 'admin'
      || chat.patientId === session.user.id
      || (session.user.role === 'healthcare_worker'
        && chat.districtId === session.user.districtId)

  if (!canAccess) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden'
    })
  }

  const messages = await useDrizzle()
    .select()
    .from(tables.messages)
    .where(eq(tables.messages.chatId, id))
    .orderBy(tables.messages.createdAt)
    .all()

  return {
    ...chat,
    messages
  }
})
