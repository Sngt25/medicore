export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string | undefined

  if (id) {
    const district = await db
      .select()
      .from(schema.districts)
      .where(eq(schema.districts.id, id))
      .get()

    return district
  }

  const districts = await db
    .select()
    .from(schema.districts)
    .orderBy(schema.districts.name)
    .all()

  return districts
})
