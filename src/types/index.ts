// Shared TypeScript types for Resumo

export type UserRole = 'CANDIDATE' | 'RECRUITER' | 'ADMIN'

export interface User {
  id: string
  email: string
  name?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}
