export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user.role !== 'healthcare_worker') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Healthcare worker access required'
    })
  }

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Task ID is required'
    })
  }

  const existingTask = await useDrizzle()
    .select()
    .from(tables.tasks)
    .where(
      and(
        eq(tables.tasks.id, id),
        eq(tables.tasks.createdByWorkerId, session.user.id)
      )
    )
    .get()

  if (!existingTask) {
    throw createError({
      statusCode: 404,
      message: 'Task not found'
    })
  }

  const task = await useDrizzle()
    .update(tables.tasks)
    .set({
      title: body.title,
      description: body.description,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      priority: body.priority,
      status: body.status
    })
    .where(eq(tables.tasks.id, id))
    .returning()
    .get()

  return task
})
