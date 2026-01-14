export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user.role !== 'healthcare_worker') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Healthcare worker access required'
    })
  }

  const query = getQuery(event)

  const conditions = [eq(schema.tasks.createdByWorkerId, session.user.id)]

  if (query.status) {
    conditions.push(
      eq(schema.tasks.status, query.status as 'todo' | 'in_progress' | 'done')
    )
  }

  if (query.patientId) {
    conditions.push(eq(schema.tasks.linkedPatientId, query.patientId as string))
  }

  if (query.chatId) {
    conditions.push(eq(schema.tasks.linkedChatId, query.chatId as string))
  }

  const tasks = await db
    .select({
      id: schema.tasks.id,
      title: schema.tasks.title,
      description: schema.tasks.description,
      dueAt: schema.tasks.dueAt,
      priority: schema.tasks.priority,
      status: schema.tasks.status,
      linkedPatientId: schema.tasks.linkedPatientId,
      linkedChatId: schema.tasks.linkedChatId,
      createdByWorkerId: schema.tasks.createdByWorkerId,
      createdAt: schema.tasks.createdAt,
      updatedAt: schema.tasks.updatedAt,
      patient: {
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email
      }
    })
    .from(schema.tasks)
    .leftJoin(schema.users, eq(schema.tasks.linkedPatientId, schema.users.id))
    .where(and(...conditions))
    .orderBy(schema.tasks.dueAt, schema.tasks.priority)
    .all()

  return tasks
})
