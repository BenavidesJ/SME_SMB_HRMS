export const hasAnyRole = (userRoles: string[], itemRoles?: string[]) => {
  if (!itemRoles || itemRoles.length === 0) return true;
  return itemRoles.some((r) => userRoles.includes(r));
};