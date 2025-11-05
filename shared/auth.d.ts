declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string
    avatar?: string
    role?: 'admin' | 'healthcare_worker' | 'patient'
    districtId?: string
  }
}

export {}
