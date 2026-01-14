import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const form = await readFormData(event)
  const file = form.get('file') as File
  const chatId = form.get('chatId') as string | null

  if (!file || !file.size) {
    throw createError({ statusCode: 400, message: 'No file provided' })
  }

  // Validate file (8MB max, images and PDFs only)
  ensureBlob(file, {
    maxSize: '8MB',
    types: ['image', 'application/pdf']
  })

  // If chatId provided, verify access
  if (chatId) {
    const chat = await db
      .select()
      .from(schema.chats)
      .where(eq(schema.chats.id, chatId))
      .get()

    if (!chat) {
      throw createError({ statusCode: 404, message: 'Chat not found' })
    }

    const canAccess
      = session.user.role === 'admin'
        || chat.patientId === session.user.id
        || (session.user.role === 'healthcare_worker'
          && chat.districtId === session.user.districtId)

    if (!canAccess) {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }
  }

  // Upload to blob storage
  const uploadedBlob = await blob.put(file.name, file, {
    addRandomSuffix: true,
    prefix: chatId ? `chats/${chatId}` : `users/${session.user.id}`
  })

  // Store file metadata in database
  const fileRecord = await db
    .insert(schema.files)
    .values({
      ownerId: session.user.id,
      chatId: chatId || null,
      pathname: uploadedBlob.pathname,
      filename: file.name,
      mimeType: file.type,
      size: file.size
    })
    .returning()
    .get()

  return fileRecord
})
