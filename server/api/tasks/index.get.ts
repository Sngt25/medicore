export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user.role !== 'healthcare_worker') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Healthcare worker access required'
    })
  }

  const query = getQuery(event)

  const conditions = [eq(tables.tasks.createdByWorkerId, session.user.id)]

  if (query.status) {
    conditions.push(
      eq(tables.tasks.status, query.status as 'todo' | 'in_progress' | 'done')
    )
  }

  if (query.patientId) {
    conditions.push(eq(tables.tasks.linkedPatientId, query.patientId as string))
  }

  const tasks = await useDrizzle()
    .select()
    .from(tables.tasks)
    .where(and(...conditions))
    .orderBy(tables.tasks.dueAt, tables.tasks.priority)
    .all()

  return tasks
})
