export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Admin access required'
    })
  }

  const body = await readBody(event)

  if (!body.email) {
    throw createError({
      statusCode: 400,
      message: 'Email is required'
    })
  }

  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: 'Name is required'
    })
  }

  if (!body.role) {
    throw createError({
      statusCode: 400,
      message: 'Role is required'
    })
  }

  const validRoles = ['admin', 'healthcare_worker', 'patient']
  if (!validRoles.includes(body.role)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid role'
    })
  }

  const existingUser = await useDrizzle()
    .select()
    .from(tables.users)
    .where(eq(tables.users.email, body.email))
    .get()

  if (existingUser) {
    throw createError({
      statusCode: 409,
      message: 'Email already exists'
    })
  }

  const googleSub = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const user = await useDrizzle()
    .insert(tables.users)
    .values({
      email: body.email,
      name: body.name,
      role: body.role,
      districtId: body.districtId || null,
      googleSub,
      verified: false
    })
    .returning()
    .get()

  await useDrizzle()
    .insert(tables.auditLogs)
    .values({
      userId: session.user.id,
      action: 'user_created',
      detail: { createdUserId: user.id, email: user.email, role: user.role }
    })
    .run()

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    districtId: user.districtId,
    verified: user.verified,
    createdAt: user.createdAt
  }
})
