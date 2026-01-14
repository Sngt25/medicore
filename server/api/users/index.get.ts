export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (!session.user.role) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized: User role not found'
    })
  }

  if (session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Admin access required'
    })
  }

  try {
    const query = getQuery(event)
    const roleFilter = query.role as string | undefined

    let users

    if (roleFilter) {
      users = await db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          name: schema.users.name,
          role: schema.users.role,
          districtId: schema.users.districtId,
          districtName: schema.districts.name,
          verified: schema.users.verified,
          createdAt: schema.users.createdAt
        })
        .from(schema.users)
        .leftJoin(
          schema.districts,
          eq(schema.users.districtId, schema.districts.id)
        )
        .where(
          eq(schema.users.role, roleFilter as 'admin' | 'healthcare_worker' | 'patient')
        )
        .all()
    }
    else {
      users = await db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          name: schema.users.name,
          role: schema.users.role,
          districtId: schema.users.districtId,
          districtName: schema.districts.name,
          verified: schema.users.verified,
          createdAt: schema.users.createdAt
        })
        .from(schema.users)
        .leftJoin(
          schema.districts,
          eq(schema.users.districtId, schema.districts.id)
        )
        .all()
    }

    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      districtId: user.districtId,
      districtName: user.districtName,
      verified: user.verified,
      createdAt: user.createdAt
    }))
  }
  catch (error) {
    console.error('Error fetching users:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch users'
    })
  }
})
