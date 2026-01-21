import { eq } from 'drizzle-orm'

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }) {
    const config = useRuntimeConfig(event)

    // Check if user exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.googleSub, user.sub))
      .get()

    let dbUser = existingUser

    if (!dbUser) {
      const existingUserByEmail = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, user.email))
        .get()

      if (existingUserByEmail) {
        dbUser = await db
          .update(schema.users)
          .set({
            googleSub: user.sub,
            avatar: user.picture,
            verified: true
          })
          .where(eq(schema.users.id, existingUserByEmail.id))
          .returning()
          .get()
      }
      else {
        const adminEmailsStr = String(config.public.adminEmails || '')
        const adminEmails = adminEmailsStr
          .split(',')
          .map((e: string) => e.trim())
          .filter(Boolean)

        const isAdmin = adminEmails.includes(user.email)

        dbUser = await db
          .insert(schema.users)
          .values({
            email: user.email,
            name: user.name || user.email,
            googleSub: user.sub,
            avatar: user.picture,
            role: isAdmin ? 'admin' : 'patient',
            verified: true
          })
          .returning()
          .get()

        await db.insert(schema.auditLogs).values({
          userId: dbUser.id,
          action: 'user_created',
          detail: { method: 'google_oauth', role: dbUser.role }
        })
      }
    }
    else {
      await db
        .update(schema.users)
        .set({ avatar: user.picture })
        .where(eq(schema.users.id, existingUser.id))
        .run()
    }

    // Set user session
    await setUserSession(event, {
      user: {
        id: dbUser?.id,
        email: dbUser?.email,
        name: dbUser?.name,
        role: dbUser?.role,
        districtId: dbUser?.districtId,
        avatar: user.picture
      },
      loggedInAt: Date.now()
    })

    // Redirect based on role
    if (dbUser?.role === 'admin') {
      return sendRedirect(event, '/admin')
    }
    else if (dbUser?.role === 'healthcare_worker' && dbUser?.districtId) {
      return sendRedirect(event, '/dashboard')
    }
    else {
      return sendRedirect(event, '/districts')
    }
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/?error=oauth_failed')
  }
})
