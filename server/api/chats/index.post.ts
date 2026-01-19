export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody(event)

  if (!body.districtId || !body.initialDescription) {
    throw createError({
      statusCode: 400,
      message: 'District ID and initial description are required'
    })
  }

  const district = await db
    .select()
    .from(schema.districts)
    .where(eq(schema.districts.id, body.districtId))
    .get()

  if (!district) {
    throw createError({
      statusCode: 404,
      message: 'District not found'
    })
  }

  const chat = await db
    .insert(schema.chats)
    .values({
      districtId: body.districtId,
      patientId: session.user.id,
      initialDescription: body.initialDescription,
      status: 'queued'
    })
    .returning()
    .get()

  await db
    .insert(schema.auditLogs)
    .values({
      userId: session.user.id,
      action: 'chat_created',
      detail: { chatId: chat.id, districtId: body.districtId }
    })

  await pusherServer.trigger(`district-${body.districtId}-queue`, 'new_chat', {
    ...chat,
    type: 'new_chat'
  })

  return chat
})
