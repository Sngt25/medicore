export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user.role !== 'healthcare_worker') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Healthcare worker access required'
    })
  }

  const body = await readBody(event)

  if (!body.title) {
    throw createError({
      statusCode: 400,
      message: 'Task title is required'
    })
  }

  const task = await useDrizzle()
    .insert(tables.tasks)
    .values({
      title: body.title,
      description: body.description || null,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      priority: body.priority || 'medium',
      status: body.status || 'todo',
      linkedPatientId: body.linkedPatientId || null,
      linkedChatId: body.linkedChatId || null,
      createdByWorkerId: session.user.id
    })
    .returning()
    .get()

  return task
})
