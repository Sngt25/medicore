import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  let pathname = getRouterParam(event, 'pathname')

  if (!pathname) {
    throw createError({ statusCode: 400, message: 'Pathname is required' })
  }

  pathname = decodeURIComponent(pathname)

  const file = await db
    .select()
    .from(schema.files)
    .where(eq(schema.files.pathname, pathname))
    .get()

  if (!file) {
    throw createError({ statusCode: 404, message: 'File not found' })
  }

  // Check permissions
  if (file.chatId) {
    const chat = await db
      .select()
      .from(schema.chats)
      .where(eq(schema.chats.id, file.chatId))
      .get()

    if (!chat) {
      throw createError({ statusCode: 404, message: 'Chat not found' })
    }

    const canAccess
      = session.user.role === 'admin'
        || chat.patientId === session.user.id
        || file.ownerId === session.user.id
        || (session.user.role === 'healthcare_worker'
          && chat.districtId === session.user.districtId)

    if (!canAccess) {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }
  }
  else {
    // Non-chat file, only owner can access
    if (file.ownerId !== session.user.id && session.user.role !== 'admin') {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }
  }

  // Set security header
  setHeader(event, 'Content-Security-Policy', 'default-src \'none\'')

  // Serve the blob
  return blob.serve(event, pathname)
})
