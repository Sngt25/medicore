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

      // For active and closed chats, only show chats assigned to this worker
      if (query.status === 'active' || query.status === 'closed') {
        conditions.push(eq(tables.chats.assignedWorkerId, session.user.id))
      }
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

  // Enrich chats with patient and district data
  const enrichedChats = await Promise.all(
    chats.map(async (chat) => {
      const [patient, district] = await Promise.all([
        useDrizzle()
          .select({
            id: tables.users.id,
            name: tables.users.name,
            email: tables.users.email,
            avatar: sql<string>`'https://avatar.vercel.sh/' || ${tables.users.email}`
          })
          .from(tables.users)
          .where(eq(tables.users.id, chat.patientId))
          .get(),
        useDrizzle()
          .select()
          .from(tables.districts)
          .where(eq(tables.districts.id, chat.districtId))
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
