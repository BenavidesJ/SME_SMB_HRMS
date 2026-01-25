import { Box, Button, Flex, Heading, Image } from "@chakra-ui/react";

import logo from "../../assets/LogoColor.svg";
import css from "../../styles/global.module.css";
import { TopNavBar } from "./navigation/TopNavBar";
import { FiLogOut } from "react-icons/fi";

import { AppBreadcrumb } from "./breadcrumb/AppBreadcrumb";
import { DesktopNav } from "./navigation";
import { useAuth } from "../../context/AuthContext";

interface LayoutProps {
  pageTitle: string;
  children: React.ReactNode;
}

export const Layout = ({ children, pageTitle }: LayoutProps) => {
  const { logout } = useAuth();

  return (
    <>
      <Box h="100vh" display="flex" flexDirection="column" overflow="hidden">
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
          <Box as="section" flex={1} overflow="auto">
            <section className={css.layoutFrame}>
              <AppBreadcrumb />
              <Heading as="h1" size="2xl">
                {pageTitle}
              </Heading>
              {children}
            </section>
          </Box>
        </Flex>
      </Box>
    </>
  );
};
