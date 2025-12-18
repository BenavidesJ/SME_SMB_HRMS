import { Box, Button, Flex, Heading, Image } from "@chakra-ui/react";

import logo from "../assets/logo.jpg"
import { TopNavBar } from "./components/navigation/TopNavBar";
import { FiLogOut } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

import { DesktopNav } from "./components/navigation/DesktopNav";

interface LayoutProps {
  pageTitle: string;
  children: React.ReactNode;
}

export const Layout = ({ children, pageTitle }: LayoutProps) => {
  const { logout } = useAuth();

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <TopNavBar
        leftContent={
          <>
            <Image src={logo} height="50px" alt="Logo" />
            <Heading as="h1">BioAlquimia</Heading>
          </>}

        rightContent={
          <Button
            onClick={logout}
            backgroundColor="semantic.danger"
            size="xs"
          >
            <FiLogOut />
            Cerrar Sesión
          </Button>
        }
      />
      <Flex w="full" h="100vh" bg="gray.50">
        <DesktopNav />
        <Box as="section" m="20px" flex={1} overflow="auto">
          <Heading as="h1" size="2xl">
            {pageTitle}
          </Heading>
          {children}
        </Box>
      </Flex>
    </Box>
  );
};
