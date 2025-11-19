export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const query = getQuery(event)

  let chats

  if (session.user.role === 'healthcare_worker') {
    if (!session.user.districtId) {
      throw createError({
        statusCode: 400,
        message: 'Healthcare worker must be assigned to a district'
      })
    }

    const conditions = [eq(tables.chats.districtId, session.user.districtId)]

    if (query.status) {
      conditions.push(eq(tables.chats.status, query.status as 'queued' | 'active' | 'closed'))
    }

    chats = await useDrizzle()
      .select()
      .from(tables.chats)
      .where(and(...conditions))
      .orderBy(tables.chats.createdAt)
      .all()
  }
  else if (session.user.role === 'patient') {
    const conditions = [eq(tables.chats.patientId, session.user.id)]

    if (query.districtId) {
      conditions.push(eq(tables.chats.districtId, query.districtId as string))
    }

    chats = await useDrizzle()
      .select()
      .from(tables.chats)
      .where(and(...conditions))
      .orderBy(tables.chats.createdAt)
      .all()
  }
  else if (session.user.role === 'admin') {
    const conditions = []
    if (query.status) {
      conditions.push(eq(tables.chats.status, query.status as 'queued' | 'active' | 'closed'))
    }

    chats = await useDrizzle()
      .select()
      .from(tables.chats)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(tables.chats.createdAt)
      .all()
  }
  else {
    throw createError({
      statusCode: 403,
      message: 'Forbidden'
    })
  }

  return chats
})
