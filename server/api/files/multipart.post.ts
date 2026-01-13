import { blob } from 'hub:blob'

// Handle multipart upload
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  // This will handle the multipart upload flow
  return await blob.handleMultipartUpload(event)
})
