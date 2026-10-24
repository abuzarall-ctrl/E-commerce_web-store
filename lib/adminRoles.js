export const SUPER_ADMIN_ROLE = 'super_admin'
export const ADMIN_ROLE = 'admin'
export const ADMIN_ROLES = [ADMIN_ROLE, SUPER_ADMIN_ROLE]

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(role)
}

export function isSuperAdminRole(role) {
  return role === SUPER_ADMIN_ROLE
}
