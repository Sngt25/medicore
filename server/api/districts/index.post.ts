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

  const district = await useDrizzle()
    .insert(tables.districts)
    .values({
      name: body.name,
      address: body.address || null,
      contactInfo: body.contactInfo || null
    })
    .returning()
    .get()

  await useDrizzle()
    .insert(tables.auditLogs)
    .values({
      userId: session.user.id,
      action: 'district_created',
      detail: { districtId: district.id, name: district.name }
    })

  return district
})
