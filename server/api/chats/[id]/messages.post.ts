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

  const chat = await useDrizzle()
    .select()
    .from(tables.chats)
    .where(eq(tables.chats.id, chatId))
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
    await useDrizzle()
      .update(tables.chats)
      .set({
        assignedWorkerId: session.user.id,
        status: 'active'
      })
      .where(eq(tables.chats.id, chatId))
      .run()

    await useDrizzle()
      .insert(tables.auditLogs)
      .values({
        userId: session.user.id,
        action: 'chat_assigned',
        detail: { chatId, workerId: session.user.id }
      })
  }

  const message = await useDrizzle()
    .insert(tables.messages)
    .values({
      chatId,
      senderId: session.user.id,
      body: body.body,
      attachments: body.attachments || null
    })
    .returning()
    .get()

  return message
})
