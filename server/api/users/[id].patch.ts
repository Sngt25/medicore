export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  // Healthcare workers can update their own district
  const isUpdatingSelf = session.user.id === id
  const isHealthcareWorker = session.user.role === 'healthcare_worker'
  const isAdmin = session.user.role === 'admin'

  if (!isAdmin && !(isHealthcareWorker && isUpdatingSelf)) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Admin access required'
    })
  }

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'User ID is required'
    })
  }

  const existingUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .get()

  if (!existingUser) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }

  const updateData: Partial<typeof schema.users.$inferInsert> = {}

  if (body.name !== undefined && isAdmin) {
    updateData.name = body.name
  }

  if (body.districtId !== undefined) {
    // Healthcare workers can update their own district
    // Admins can update any user's district
    if (isAdmin || (isHealthcareWorker && isUpdatingSelf)) {
      updateData.districtId = body.districtId
    }
  }

  if (body.role !== undefined && isAdmin) {
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

  const user = await db
    .update(schema.users)
    .set(updateData)
    .where(eq(schema.users.id, id))
    .returning()
    .get()

  await db
    .insert(schema.auditLogs)
    .values({
      userId: session.user.id,
      action: 'user_updated',
      detail: { updatedUserId: user.id, email: user.email, changes: updateData }
    })
    .run()

  // Update the session if the user is updating their own district
  if (isHealthcareWorker && isUpdatingSelf && updateData.districtId) {
    await setUserSession(event, {
      user: {
        ...session.user,
        districtId: user.districtId
      }
    })
  }

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
