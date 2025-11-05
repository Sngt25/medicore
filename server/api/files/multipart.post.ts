// Handle multipart upload
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  // This will handle the multipart upload flow
  return await hubBlob().handleMultipartUpload(event)
})
