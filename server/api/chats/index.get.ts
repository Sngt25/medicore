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

    const conditions = [eq(schema.chats.districtId, session.user.districtId)]

    if (query.status) {
      conditions.push(eq(schema.chats.status, query.status as 'queued' | 'active' | 'closed'))

      // For active and closed chats, only show chats assigned to this worker
      if (query.status === 'active' || query.status === 'closed') {
        conditions.push(eq(schema.chats.assignedWorkerId, session.user.id))
      }
    }

    chats = await db
      .select()
      .from(schema.chats)
      .where(and(...conditions))
      .orderBy(schema.chats.createdAt)
      .all()
  }
  else if (session.user.role === 'patient') {
    const conditions = [eq(schema.chats.patientId, session.user.id)]

    if (query.districtId) {
      conditions.push(eq(schema.chats.districtId, query.districtId as string))
    }

    chats = await db
      .select()
      .from(schema.chats)
      .where(and(...conditions))
      .orderBy(schema.chats.createdAt)
      .all()
  }
  else if (session.user.role === 'admin') {
    const conditions = []
    if (query.status) {
      conditions.push(eq(schema.chats.status, query.status as 'queued' | 'active' | 'closed'))
    }

    chats = await db
      .select()
      .from(schema.chats)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(schema.chats.createdAt)
      .all()
  }
  else {
    throw createError({
      statusCode: 403,
      message: 'Forbidden'
    })
  }

  // Enrich chats with patient and district data
  const enrichedChats = await Promise.all(
    chats.map(async (chat) => {
      const [patient, district] = await Promise.all([
        db
          .select({
            id: schema.users.id,
            name: schema.users.name,
            email: schema.users.email,
            avatar: sql<string>`'https://avatar.vercel.sh/' || ${schema.users.email}`
          })
          .from(schema.users)
          .where(eq(schema.users.id, chat.patientId))
          .get(),
        db
          .select()
          .from(schema.districts)
          .where(eq(schema.districts.id, chat.districtId))
          .get()
      ])

      return {
        ...chat,
        patient,
        district
      }
    })
  )

  return enrichedChats
})
