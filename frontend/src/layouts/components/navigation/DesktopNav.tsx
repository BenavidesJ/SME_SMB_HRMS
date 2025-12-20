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
import { useCallback, useRef, useState } from "react";
import { NAV_MAIN, NAV_SETTINGS } from "./navItems";
import { FiSearch } from "react-icons/fi";


export const DesktopNav = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [modules, setModules] = useState(NAV_MAIN);
  const debounceRef = useRef<number | null>(null);

  const handleCollapseBar = useCallback(() => {
    setCollapsed((state) => !state)
  }, []);

  const filterModules = (query: string) => {
    if (!query) {
      setModules(NAV_MAIN);
      return;
    }
    const q = query.toLowerCase();
    setModules(
      NAV_MAIN.filter((item) =>
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
    []
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
      padding="20px"
    >
      <Flex justifyContent="space-between" alignItems="center" mb="32px">
        {!collapsed && (
          <InputGroup flex={1} startElement={<FiSearch />}>
            <Input
              name="find"
              placeholder="Buscar módulos"
              onChange={searchModule}
              _focus={{ outlineColor: "blue.600" }}
            />
          </InputGroup>
        )}
        <IconButton
          aria-label="collapse sidebar"
          variant="ghost"
          size="md"
          ml={!collapsed ? 1 : 0}
          onClick={handleCollapseBar}
          _hover={{ bg: "brand.green.25" }}
        >
          {collapsed ? <GoSidebarCollapse /> : <GoSidebarExpand />}
        </IconButton>
      </Flex>

      <Box mb="30px">
        {!collapsed && (
          <Text
            fontSize="md"
            fontWeight="medium"
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
            fontWeight="medium"
            color="brand.text"
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
