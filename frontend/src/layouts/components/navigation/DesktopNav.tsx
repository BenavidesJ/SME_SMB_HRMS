/* eslint-disable react-hooks/exhaustive-deps */
import {
  Box,
  Flex,
  List,
  IconButton,
  Text,
} from "@chakra-ui/react";

import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";

import { DesktopNavItem } from "./DesktopNavItem";
import { useCallback, useState } from "react";
import { NAV_MAIN, NAV_SETTINGS } from "./navItems";


export const DesktopNav = () => {
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapseBar = useCallback(() => {
    setCollapsed((state) => !state)
  }, [collapsed]);

  return (
    <Flex
      as="aside"
      height="100vh"
      w={collapsed ? "80px" : "260px"}
      flexShrink={0}
      bg="white"
      borderRight="1px solid #0000001a"
      flexDirection="column"
      justifyContent="flex-start"
      borderBottomRightRadius={15}
      transition="width 0.075s ease"
      padding="20px"
    >
      <Flex justifyContent="space-between" alignItems="center" mb="32px">
        <IconButton
          aria-label="collapse sidebar"
          variant="ghost"
          size="md"
          onClick={handleCollapseBar}
          _hover={{ bg: "#84ed6c79" }}
        >
          {collapsed ? <GoSidebarCollapse /> : <GoSidebarExpand />}
        </IconButton>
      </Flex>

      <Box mb="30px">
        {!collapsed && (
          <Text
            fontSize="md"
            fontWeight="medium"
            color="gray.500"
            mb="2"
            letterSpacing="wide"
          >
            Módulos
          </Text>
        )}

        <List.Root gap="2">
          {NAV_MAIN.map((item) => (
            <DesktopNavItem key={item.label} item={item} collapsed={collapsed} />
          ))}
        </List.Root>
      </Box>

      <Box mb="20px">
        {!collapsed && (
          <Text
            fontSize="md"
            fontWeight="medium"
            color="gray.500"
            mb="2"
            letterSpacing="wide"
          >
            Configuraciones
          </Text>
        )}

        <List.Root gap="2">
          {NAV_SETTINGS.map((item) => (
            <DesktopNavItem key={item.label} item={item} collapsed={collapsed} />
          ))}
        </List.Root>
      </Box>
    </Flex>
  );
};
