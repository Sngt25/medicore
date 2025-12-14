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

  if (query.chatId) {
    conditions.push(eq(tables.tasks.linkedChatId, query.chatId as string))
  }

  const tasks = await useDrizzle()
    .select({
      id: tables.tasks.id,
      title: tables.tasks.title,
      description: tables.tasks.description,
      dueAt: tables.tasks.dueAt,
      priority: tables.tasks.priority,
      status: tables.tasks.status,
      linkedPatientId: tables.tasks.linkedPatientId,
      linkedChatId: tables.tasks.linkedChatId,
      createdByWorkerId: tables.tasks.createdByWorkerId,
      createdAt: tables.tasks.createdAt,
      updatedAt: tables.tasks.updatedAt,
      patient: {
        id: tables.users.id,
        name: tables.users.name,
        email: tables.users.email
      }
    })
    .from(tables.tasks)
    .leftJoin(tables.users, eq(tables.tasks.linkedPatientId, tables.users.id))
    .where(and(...conditions))
    .orderBy(tables.tasks.dueAt, tables.tasks.priority)
    .all()

  return tasks
})
