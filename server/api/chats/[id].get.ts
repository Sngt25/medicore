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

  const district = await useDrizzle()
    .select()
    .from(tables.districts)
    .where(eq(tables.districts.id, chat.districtId))
    .get()

  const patient = await useDrizzle()
    .select()
    .from(tables.users)
    .where(eq(tables.users.id, chat.patientId))
    .get()

  let assignedWorker = null
  if (chat.assignedWorkerId) {
    assignedWorker = await useDrizzle()
      .select()
      .from(tables.users)
      .where(eq(tables.users.id, chat.assignedWorkerId))
      .get()
  }

  const messages = await useDrizzle()
    .select()
    .from(tables.messages)
    .where(eq(tables.messages.chatId, id))
    .orderBy(tables.messages.createdAt)
    .all()

  const messagesWithSender = await Promise.all(
    messages.map(async (message) => {
      const sender = await useDrizzle()
        .select()
        .from(tables.users)
        .where(eq(tables.users.id, message.senderId))
        .get()
      return {
        ...message,
        sender
      }
    })
  )

  return {
    ...chat,
    district,
    patient,
    assignedWorker,
    messages: messagesWithSender
  }
})
