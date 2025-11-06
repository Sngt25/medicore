export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string | undefined

  if (id) {
    const district = await useDrizzle()
      .select()
      .from(tables.districts)
      .where(eq(tables.districts.id, id))
      .get()

    return district
  }

  const districts = await useDrizzle()
    .select()
    .from(tables.districts)
    .orderBy(tables.districts.name)
    .all()

  return districts
})
