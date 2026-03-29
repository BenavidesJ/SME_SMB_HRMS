import { Box, Flex, List, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { Tooltip } from "../../../components/ui/tooltip";
import type { NavItem } from "./navItems";
import { useAuth } from "../../../context/AuthContext";
import { hasAnyRole } from "./helpers/hasAnyRole";


export const DesktopNavItem = ({ item, collapsed }: { item: NavItem; collapsed: boolean }) => {
  const { user } = useAuth();
  const roleName = user?.usuario?.rol ?? "";

  const [open, setOpen] = useState(false);

  const visibleChildren = useMemo(() => {
    const children = item.children ?? [];
    return children.filter((c: Omit<NavItem, "icon">) => hasAnyRole(roleName, c.roles));
  }, [item.children, roleName]);

  const canSeeChildren = useMemo(() => {
    if (!item.children || item.children.length === 0) return false;
    if (!item.childrenRoles) return visibleChildren.length > 0;
    return hasAnyRole(roleName, item.childrenRoles) && visibleChildren.length > 0;
  }, [item.children, item.childrenRoles, roleName, visibleChildren.length]);

  // Only show the dropdown when the user has more than one child option.
  // If there's only one visible child (e.g. EMPLEADO), navigate directly.
  const isExpandable = canSeeChildren && visibleChildren.length > 1;

  const parentHref = useMemo(() => {
    const behavior = item.parentClickBehavior;
    if (behavior?.defaultChildPathForRoles) {
      const hit = behavior.defaultChildPathForRoles[roleName];
      if (hit) return hit;
    }
    return item.path;
  }, [item.parentClickBehavior, item.path, roleName]);

  const sharedFlexProps = {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: "3" as const,
    px: "3" as const,
    py: "2" as const,
    borderRadius: "lg" as const,
    cursor: "pointer" as const,
    _hover: { bg: "brand.green.25" },
  };

  return (
    <List.Item listStyle="none">
      <Box>
        {isExpandable ? (
          // Multi-child: clicking toggles the dropdown, no routing on the parent
          <Tooltip content={item.label} showArrow positioning={{ placement: "right-end" }}>
            <Flex
              {...sharedFlexProps}
              onClick={() => setOpen((s) => !s)}
            >
              <Box fontSize="20px" color="gray.600">{item.icon}</Box>
              {!collapsed && (
                <Flex w="full" alignItems="center" justifyContent="space-between">
                  <Text fontSize="sm" fontWeight="medium">{item.label}</Text>
                  <Box fontSize="14px" color="gray.500">
                    {open ? <FiChevronUp /> : <FiChevronDown />}
                  </Box>
                </Flex>
              )}
            </Flex>
          </Tooltip>
        ) : (
          // Single destination: navigate directly (handles EMPLEADO single-child and no-child items)
          <RouterLink to={parentHref}>
            <Tooltip content={item.label} showArrow positioning={{ placement: "right-end" }}>
              <Flex {...sharedFlexProps}>
                <Box fontSize="20px" color="gray.600">{item.icon}</Box>
                {!collapsed && (
                  <Flex w="full" alignItems="center" justifyContent="space-between">
                    <Text fontSize="sm" fontWeight="medium">{item.label}</Text>
                  </Flex>
                )}
              </Flex>
            </Tooltip>
          </RouterLink>
        )}

        {isExpandable && !collapsed && (
          <Box overflow="hidden" transition="max-height 0.75s ease" maxH={open ? "400px" : "0"} ml="10">
            <List.Root mt="1" gap="1">
              {visibleChildren.map((child: Omit<NavItem, "icon">) => (
                <List.Item key={child.label} listStyle="none">
                  <RouterLink to={child.path}>
                    <Flex
                      px="3"
                      py="2"
                      ml="2"
                      borderRadius="md"
                      fontSize="sm"
                      color="gray.600"
                      _hover={{ bg: "gray.100", color: "black" }}
                    >
                      {child.label}
                    </Flex>
                  </RouterLink>
                </List.Item>
              ))}
            </List.Root>
          </Box>
        )}
      </Box>
    </List.Item>
  );
};
