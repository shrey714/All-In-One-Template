export type UserRole = "admin" | "member"

export interface AuthUser {
  id: number
  username: string
  displayName: string
  role: UserRole
  mustChangePassword: boolean
}

export interface ManagedUser extends AuthUser {
  isActive: boolean
  createdAt: string
}
