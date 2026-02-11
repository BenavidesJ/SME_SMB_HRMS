export const hasAnyRole = (roleName: string, allowedRoles?: string[]) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!roleName) return false;
  return allowedRoles.includes(roleName);
};