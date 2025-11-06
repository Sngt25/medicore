export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value) {
    if (to.path !== '/') {
      return navigateTo('/')
    }
    return
  }

  if (loggedIn.value && user.value?.role === 'healthcare_worker') {
    if (to.path !== '/dashboard') {
      return navigateTo('/dashboard')
    }
  }
})
