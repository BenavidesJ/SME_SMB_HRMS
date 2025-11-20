import {
  Box,
  Flex,
  List,
  Text,
} from "@chakra-ui/react";
import { useState, } from "react";
import { Link as RouterLink } from "react-router";
import { Tooltip } from "../../../components/ui/tooltip";
import type { NavItem } from "./navItems";

export const DesktopNavItem = ({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) => {
  const { children, path, label, icon } = item;
  const [open, setOpen] = useState(false);
  const isExpandable = Array.isArray(item.children);

  return (
    <List.Item listStyle="none">
      <RouterLink key={label} to={path}>
        <Tooltip content={label} >
          <Flex
            alignItems="center"
            justifyContent="center"
            gap="3"
            px="3"
            py="2"
            borderRadius="lg"
            cursor="pointer"
            _hover={{ bg: "#84ed6c79" }}
            onClick={isExpandable ? () => setOpen(!open) : undefined}
          >
            <Box fontSize="20px" color="gray.600">
              {icon}
            </Box>

            {!collapsed && (
              <Flex w="full" alignItems="center" justifyContent="space-between">
                <Text fontSize="sm" fontWeight="medium">
                  {label}
                </Text>
              </Flex>
            )}
          </Flex>
        </Tooltip>
      </RouterLink>

      {isExpandable && (
        <Box
          overflow="hidden"
          transition="height 0.1s ease"
          height={open ? "auto" : "0"}
          ml={collapsed ? "0" : "10"}
        >
          <List.Root mt="1" gap="1">
            {children && children.map((child: NavItem) => {
              const { label, path } = child;
              return (
                <List.Item listStyle="none">
                  <RouterLink key={label} to={path}>
                    <Flex
                      px="3"
                      py="2"
                      ml="2"
                      borderRadius="md"
                      fontSize="sm"
                      color="gray.600"
                      _hover={{ bg: "gray.100", color: "black" }}
                    >
                      {label}
                    </Flex>
                  </RouterLink>
                </List.Item>
              )
            }
            )}
          </List.Root>
        </Box>
      )}
    </List.Item>
  );
};
