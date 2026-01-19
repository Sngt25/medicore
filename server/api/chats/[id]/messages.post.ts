export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const chatId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!chatId) {
    throw createError({
      statusCode: 400,
      message: 'Chat ID is required'
    })
  }

  if (!body.body) {
    throw createError({
      statusCode: 400,
      message: 'Message body is required'
    })
  }

  const chat = await db
    .select()
    .from(schema.chats)
    .where(eq(schema.chats.id, chatId))
    .get()

  if (!chat) {
    throw createError({
      statusCode: 404,
      message: 'Chat not found'
    })
  }

  const canSend
    = chat.patientId === session.user.id
      || (session.user.role === 'healthcare_worker'
        && (chat.assignedWorkerId === session.user.id
          || chat.districtId === session.user.districtId))

  if (!canSend) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden'
    })
  }

  if (
    session.user.role === 'healthcare_worker'
    && !chat.assignedWorkerId
    && chat.status === 'queued'
  ) {
    await db
      .update(schema.chats)
      .set({
        assignedWorkerId: session.user.id,
        status: 'active'
      })
      .where(eq(schema.chats.id, chatId))
      .run()

    await db
      .insert(schema.auditLogs)
      .values({
        userId: session.user.id,
        action: 'chat_assigned',
        detail: { chatId, workerId: session.user.id }
      })
  }

  const message = await db
    .insert(schema.messages)
    .values({
      chatId,
      senderId: session.user.id,
      body: body.body,
      attachments: body.attachments || null
    })
    .returning()
    .get()

  await pusherServer.trigger(`chat-${chatId}`, 'new_message', {
    ...message,
    type: 'new_message'
  })

  return message
})
