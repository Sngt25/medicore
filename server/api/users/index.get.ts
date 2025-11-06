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
      users = await useDrizzle()
        .select()
        .from(tables.users)
        .where(
          eq(tables.users.role, roleFilter as 'admin' | 'healthcare_worker' | 'patient')
        )
        .all()
    }
    else {
      users = await useDrizzle()
        .select()
        .from(tables.users)
        .all()
    }

    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      districtId: user.districtId,
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
