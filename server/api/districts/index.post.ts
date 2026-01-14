export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Admin access required'
    })
  }

  const body = await readBody(event)

  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: 'District name is required'
    })
  }

  const district = await db
    .insert(schema.districts)
    .values({
      name: body.name,
      address: body.address || null,
      contactInfo: body.contactInfo || null
    })
    .returning()
    .get()

  await db
    .insert(schema.auditLogs)
    .values({
      userId: session.user.id,
      action: 'district_created',
      detail: { districtId: district.id, name: district.name }
    })

  return district
})
