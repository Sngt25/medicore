export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user.role !== 'healthcare_worker') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Healthcare worker access required'
    })
  }

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Task ID is required'
    })
  }

  const existingTask = await db
    .select()
    .from(schema.tasks)
    .where(
      and(
        eq(schema.tasks.id, id),
        eq(schema.tasks.createdByWorkerId, session.user.id)
      )
    )
    .get()

  if (!existingTask) {
    throw createError({
      statusCode: 404,
      message: 'Task not found'
    })
  }

  await db.delete(schema.tasks).where(eq(schema.tasks.id, id)).run()

  return { success: true }
})
