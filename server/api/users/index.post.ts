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

  const existingUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, body.email))
    .get()

  if (existingUser) {
    if (existingUser.role === 'patient' && body.role === 'healthcare_worker') {
      const updatedUser = await db
        .update(schema.users)
        .set({
          role: 'healthcare_worker',
          districtId: body.districtId || null,
          verified: true
        })
        .where(eq(schema.users.id, existingUser.id))
        .returning()
        .get()

      await db
        .insert(schema.auditLogs)
        .values({
          userId: session.user.id,
          action: 'user_promoted',
          detail: { userId: updatedUser.id, role: updatedUser.role }
        })
        .run()

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        districtId: updatedUser.districtId,
        verified: updatedUser.verified,
        createdAt: updatedUser.createdAt
      }
    }

    throw createError({
      statusCode: 409,
      message: 'Email already exists'
    })
  }

  const googleSub = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const user = await db
    .insert(schema.users)
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

  await db
    .insert(schema.auditLogs)
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
