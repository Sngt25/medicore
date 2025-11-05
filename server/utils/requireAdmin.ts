export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session.user || session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Admin access required'
    })
  }
})
