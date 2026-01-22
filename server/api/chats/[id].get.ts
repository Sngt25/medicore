export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Chat ID is required'
    })
  }

  const chat = await db
    .select()
    .from(schema.chats)
    .where(eq(schema.chats.id, id))
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
        && chat.districtId === session.user.districtId
        && (chat.status === 'queued' || chat.assignedWorkerId === session.user.id))

  if (!canAccess) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden'
    })
  }

  const district = await db
    .select()
    .from(schema.districts)
    .where(eq(schema.districts.id, chat.districtId))
    .get()

  const patient = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, chat.patientId))
    .get()

  let assignedWorker = null
  if (chat.assignedWorkerId) {
    assignedWorker = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, chat.assignedWorkerId))
      .get()
  }

  const messages = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.chatId, id))
    .orderBy(schema.messages.createdAt)
    .all()

  const messagesWithSender = await Promise.all(
    messages.map(async (message) => {
      const sender = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, message.senderId))
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
