export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody(event)

  if (!body.districtId || !body.initialDescription) {
    throw createError({
      statusCode: 400,
      message: 'District ID and initial description are required'
    })
  }

  const district = await useDrizzle()
    .select()
    .from(tables.districts)
    .where(eq(tables.districts.id, body.districtId))
    .get()

  if (!district) {
    throw createError({
      statusCode: 404,
      message: 'District not found'
    })
  }

  const chat = await useDrizzle()
    .insert(tables.chats)
    .values({
      districtId: body.districtId,
      patientId: session.user.id,
      initialDescription: body.initialDescription,
      status: 'queued'
    })
    .returning()
    .get()

  await useDrizzle()
    .insert(tables.auditLogs)
    .values({
      userId: session.user.id,
      action: 'chat_created',
      detail: { chatId: chat.id, districtId: body.districtId }
    })

  return chat
})
