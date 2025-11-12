import { Flex } from "@chakra-ui/react";
import { AppNavigation } from "./components/navigation";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <Flex direction="row" >
      <AppNavigation />
      {children}
    </Flex>
  );
};
