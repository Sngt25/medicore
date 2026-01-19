export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

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

  // Authorization check
  const canUpdate
    = session.user.role === 'admin'
      || (session.user.role === 'healthcare_worker'
        && chat.districtId === session.user.districtId)

  if (!canUpdate) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden'
    })
  }

  const updateData: Partial<typeof schema.chats.$inferInsert> = {}

  // Healthcare workers can update status and assign themselves
  if (body.status !== undefined) {
    const validStatuses = ['queued', 'active', 'closed']
    if (!validStatuses.includes(body.status)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid status'
      })
    }
    updateData.status = body.status

    // When accepting a chat, assign it to the worker
    if (body.status === 'active' && session.user.role === 'healthcare_worker') {
      updateData.assignedWorkerId = session.user.id
    }

    // When closing a chat, set the closedAt timestamp
    if (body.status === 'closed') {
      updateData.closedAt = new Date()
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No fields to update'
    })
  }

  const updatedChat = await db
    .update(schema.chats)
    .set(updateData)
    .where(eq(schema.chats.id, id))
    .returning()
    .get()

  await db
    .insert(schema.auditLogs)
    .values({
      userId: session.user.id,
      action: 'chat_updated',
      detail: { chatId: updatedChat.id, changes: updateData }
    })
    .run()

  await pusherServer.trigger(`chat-${updatedChat.id}`, 'chat_updated', updatedChat)

  if (updatedChat.districtId) {
    await pusherServer.trigger(`district-${updatedChat.districtId}-queue`, 'chat_updated', updatedChat)
  }

  return updatedChat
})
