export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session.user || session.user.role !== 'healthcare_worker') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Healthcare worker access required'
    })
  }
})
