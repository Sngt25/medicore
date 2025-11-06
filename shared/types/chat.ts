export interface ChatX {
  id: string
  districtId: string
  patientId: string
  assignedWorkerId: string | null
  status: 'queued' | 'active' | 'closed'
  initialDescription: string
  createdAt: Date
  closedAt: Date | null
  district?: District
  patient?: User
  assignedWorker?: User | null
  messages?: Message[]
}
