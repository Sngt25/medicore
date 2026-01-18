export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user, fetch } = useUserSession()

  await fetch()

  if (!loggedIn.value) {
    if (to.path !== '/') {
      return navigateTo('/')
    }
    return
  }

  if (loggedIn.value && user.value?.role !== 'admin') {
    if (to.path !== '/') {
      return navigateTo('/')
    }
    return
  }
})
