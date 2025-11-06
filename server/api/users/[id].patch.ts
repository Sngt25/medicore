export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Admin access required'
    })
  }

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'User ID is required'
    })
  }

  const existingUser = await useDrizzle()
    .select()
    .from(tables.users)
    .where(eq(tables.users.id, id))
    .get()

  if (!existingUser) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }

  const updateData: Partial<typeof tables.users.$inferInsert> = {}

  if (body.name !== undefined) {
    updateData.name = body.name
  }

  if (body.districtId !== undefined) {
    updateData.districtId = body.districtId
  }

  if (body.role !== undefined) {
    const validRoles = ['admin', 'healthcare_worker', 'patient']
    if (!validRoles.includes(body.role)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid role'
      })
    }
    updateData.role = body.role
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No fields to update'
    })
  }

  const user = await useDrizzle()
    .update(tables.users)
    .set(updateData)
    .where(eq(tables.users.id, id))
    .returning()
    .get()

  await useDrizzle()
    .insert(tables.auditLogs)
    .values({
      userId: session.user.id,
      action: 'user_updated',
      detail: { updatedUserId: user.id, email: user.email, changes: updateData }
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
