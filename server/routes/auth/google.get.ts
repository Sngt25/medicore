import { eq } from 'drizzle-orm'

export default defineOAuthGoogleEventHandler({
  // config: {
  //   scope: ['email', 'profile', 'openid'],
  //   authorizationParams: {
  //     access_type: 'offline',
  //     prompt: 'consent'
  //   }
  // },
  async onSuccess(event, { user }) {
    const config = useRuntimeConfig(event)

    // Check if user exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.googleSub, user.sub))
      .get()

    let dbUser = existingUser

    // Create user if doesn't exist
    if (!existingUser) {
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
          role: isAdmin ? 'admin' : 'patient',
          verified: true
        })
        .returning()
        .get()

      // Log user creation
      await db.insert(schema.auditLogs).values({
        userId: dbUser.id,
        action: 'user_created',
        detail: { method: 'google_oauth', role: dbUser.role }
      })
    }

    // Set user session
    await setUserSession(event, {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        districtId: dbUser.districtId,
        avatar: user.picture
      },
      loggedInAt: Date.now()
    })

    // Redirect based on role
    if (dbUser.role === 'admin') {
      return sendRedirect(event, '/admin')
    }
    else if (dbUser.role === 'healthcare_worker') {
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
