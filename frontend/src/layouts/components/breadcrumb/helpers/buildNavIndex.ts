import type { NavItem } from "../../navigation/navItems";

type NavIndexItem = {
  label: string;
  path: string;
  parentPath?: string;
  roles?: string[];
};

export type NavIndex = {
  byPath: Record<string, NavIndexItem>;
  parentOf: Record<string, string | undefined>;
  allPathsSortedDesc: string[];
};

const canAccess = (userRoles: string[], itemRoles?: string[]) => {
  if (!itemRoles || itemRoles.length === 0) return true;
  return itemRoles.some((r) => userRoles.includes(r));
};

export const buildNavIndex = (nav: NavItem[], userRoles: string[]): NavIndex => {
  const byPath: Record<string, NavIndexItem> = {};
  const parentOf: Record<string, string | undefined> = {};

  const walk = (items: NavItem[], parentPath?: string) => {
    for (const item of items) {
      if (!canAccess(userRoles, item.roles)) continue;

      byPath[item.path] = {
        label: item.label,
        path: item.path,
        parentPath,
        roles: item.roles,
      };
      parentOf[item.path] = parentPath;

      if (item.children && item.children.length > 0) {
        const normalizedChildren = item.children.map((c) => ({
          label: c.label,
          path: c.path,
          roles: c.roles,
          icon: item.icon,
        })) as unknown as NavItem[];

        walk(normalizedChildren, item.path);
      }
    }
  };

  walk(nav);

  const allPathsSortedDesc = Object.keys(byPath).sort((a, b) => b.length - a.length);

  return { byPath, parentOf, allPathsSortedDesc };
};