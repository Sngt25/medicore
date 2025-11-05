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
      message: 'District ID is required'
    })
  }

  const district = await useDrizzle()
    .update(tables.districts)
    .set({
      name: body.name,
      address: body.address,
      contactInfo: body.contactInfo
    })
    .where(eq(tables.districts.id, id))
    .returning()
    .get()

  if (!district) {
    throw createError({
      statusCode: 404,
      message: 'District not found'
    })
  }

  await useDrizzle()
    .insert(tables.auditLogs)
    .values({
      userId: session.user.id,
      action: 'district_updated',
      detail: { districtId: district.id, name: district.name }
    })

  return district
})
