export default defineNuxtRouteMiddleware(async (to, from) => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value) {
    if (to.path !== '/') {
      return navigateTo('/')
    }
    return
  }

  if (loggedIn.value && user.value?.role === 'admin') {
    if (to.path !== '/admin') {
      return navigateTo('/admin')
    }
  }
  else if (loggedIn.value && user.value?.role === 'healthcare_worker' && user.value?.districtId) {
    if (to.path !== '/dashboard') {
      return navigateTo('/dashboard')
    }
  }
  else {
    if (to.path !== '/districts') {
      return navigateTo('/districts')
    }
  }
})
