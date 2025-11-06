export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    if (to.path !== '/') {
      return navigateTo('/')
    }
    return
  }
})
