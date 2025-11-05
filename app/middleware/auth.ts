export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value) {
    if (to.path !== '/admin/login') {
      return navigateTo('/admin/login')
    }
    return
  }

  if (loggedIn.value) {
    if (to.path !== '/admin') {
      return navigateTo('/admin')
    }
  }

  if (to.path.startsWith('/admin') && !user.value) {
    if (to.path !== '/') {
      return navigateTo('/')
    }
    return
  }
})
