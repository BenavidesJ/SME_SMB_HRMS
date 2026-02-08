import { Box, Flex, List, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router";
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

  const parentBehavior = item.parentClickBehavior;

  const parentShouldNavigate = useMemo(() => {
    if (!parentBehavior) return true;
    return true;
  }, [parentBehavior]);

  const parentHref = useMemo(() => {
    if (!parentBehavior) return item.path;

    if (parentBehavior.defaultChildPathForRoles) {
      const hit = parentBehavior.defaultChildPathForRoles[roleName];
      if (hit) return hit;
    }
    return item.path;
  }, [parentBehavior, item.path, roleName]);

  const isExpandable = canSeeChildren;

  return (
    <List.Item listStyle="none">
      <Box
        onMouseEnter={isExpandable && !collapsed ? () => setOpen(true) : undefined}
        onMouseLeave={isExpandable && !collapsed ? () => setOpen(false) : undefined}
      >
        {parentShouldNavigate ? (
          <RouterLink to={parentHref}>
            <Tooltip content={item.label} showArrow positioning={{ placement: "right-end" }}>
              <Flex
                alignItems="center"
                justifyContent="center"
                gap="3"
                px="3"
                py="2"
                borderRadius="lg"
                cursor="pointer"
                _hover={{ bg: "brand.green.25" }}
                onClick={!parentShouldNavigate && isExpandable ? () => setOpen((s) => !s) : undefined}
              >
                <Box fontSize="20px" color="gray.600">{item.icon}</Box>
                {!collapsed && (
                  <Flex w="full" alignItems="center" justifyContent="space-between">
                    <Text fontSize="sm" fontWeight="medium">{item.label}</Text>
                  </Flex>
                )}
              </Flex>
            </Tooltip>
          </RouterLink>
        ) : (
          <Box>
            <Tooltip content={item.label} showArrow positioning={{ placement: "right-end" }}>
              <Flex
                alignItems="center"
                justifyContent="center"
                gap="3"
                px="3"
                py="2"
                borderRadius="lg"
                cursor="pointer"
                _hover={{ bg: "brand.green.25" }}
                onClick={!parentShouldNavigate && isExpandable ? () => setOpen((s) => !s) : undefined}
              >
                <Box fontSize="20px" color="gray.600">{item.icon}</Box>
                {!collapsed && (
                  <Flex w="full" alignItems="center" justifyContent="space-between">
                    <Text fontSize="sm" fontWeight="medium">{item.label}</Text>
                  </Flex>
                )}
              </Flex>
            </Tooltip>
          </Box>
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
