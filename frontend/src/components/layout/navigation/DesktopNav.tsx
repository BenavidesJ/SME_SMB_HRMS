/* eslint-disable react-hooks/exhaustive-deps */
import {
  Box,
  Flex,
  List,
  IconButton,
  Text,
  InputGroup,
  Input,
} from "@chakra-ui/react";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import { DesktopNavItem } from "./DesktopNavItem";
import { useCallback, useRef, useState, useMemo, useEffect } from "react";
import { NAV_MAIN, NAV_SETTINGS } from "./navItems";
import { FiSearch } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";

export const DesktopNav = () => {
  const [collapsed, setCollapsed] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const { user } = useAuth();

  const userRoles = user?.usuario?.rol;

  const rolesArray = useMemo(
    () => (Array.isArray(userRoles) ? userRoles : [userRoles]),
    [userRoles]
  );

  const filteredMainNav = useMemo(() => {
    return NAV_MAIN.filter(item => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.some(role => rolesArray.includes(role));
    });
  }, [rolesArray]);

  const filteredSettingsNav = useMemo(() => {
    return NAV_SETTINGS.filter(item => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.some(role => rolesArray.includes(role));
    });
  }, [rolesArray]);

  const [modules, setModules] = useState(filteredMainNav);

  useEffect(() => {
    setModules(filteredMainNav);
  }, [filteredMainNav]);

  const handleCollapseBar = useCallback(() => {
    setCollapsed((state) => !state)
  }, []);

  const filterModules = (query: string) => {
    if (!query) {
      setModules(filteredMainNav);
      return;
    }
    const q = query.toLowerCase();
    setModules(
      filteredMainNav.filter((item) =>
        item.label.toLowerCase().includes(q)
      )
    );
  };

  const searchModule = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = window.setTimeout(() => {
        filterModules(value);
      }, 300);
    },
    [filteredMainNav]
  );

  return (
    <Flex
      as="aside"
      h="full"
      overflowY="auto"
      w={collapsed ? "80px" : "260px"}
      flexShrink={0}
      bg="white"
      borderRight="1px solid #0000001a"
      flexDirection="column"
      justifyContent="flex-start"
      borderBottomRightRadius={15}
      transition="width 0.075s ease"
      padding="1rem"
    >
      <Flex justifyContent="space-between" alignItems="center" mb="0.75rem">
        {!collapsed && (
          <InputGroup flex={1} startElement={<FiSearch />}>
            <Input
              name="find"
              placeholder="Buscar módulos"
              onChange={searchModule}
              size="md"
              _focus={{ outlineColor: "blue.600" }}
            />
          </InputGroup>
        )}
        <IconButton
          aria-label="collapse sidebar"
          variant="ghost"
          size="md"
          ml={1}
          onClick={handleCollapseBar}
          _hover={{ bg: "brand.green.25" }}
        >
          {collapsed ? <GoSidebarCollapse /> : <GoSidebarExpand />}
        </IconButton>
      </Flex>

      <Box mb="0.75rem">
        {!collapsed && (
          <Text
            fontSize="md"
            fontWeight="bold"
            color="brand.text"
            mb="2"
            letterSpacing="wide"
          >
            Módulos
          </Text>
        )}

        <List.Root gap="2">
          {modules.map((item) => (
            <DesktopNavItem key={item.label} item={item} collapsed={collapsed} />
          ))}
        </List.Root>
      </Box>

      <Box mb="20px">
        {!collapsed && (
          <Text
            fontSize="md"
            fontWeight="bold"
            color="brand.text"
            mb="1"
            letterSpacing="wide"
          >
            Configuraciones
          </Text>
        )}

        <List.Root gap="2">
          {filteredSettingsNav.map((item) => (
            <DesktopNavItem key={item.label} item={item} collapsed={collapsed} />
          ))}
        </List.Root>
      </Box>
    </Flex>
  );
};