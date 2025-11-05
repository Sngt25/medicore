export default defineEventHandler(async () => {
  const districts = await useDrizzle()
    .select()
    .from(tables.districts)
    .orderBy(tables.districts.name)
    .all()

  return districts
})
