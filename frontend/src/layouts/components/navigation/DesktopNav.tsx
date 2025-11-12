import { Avatar, Flex, Heading, IconButton, Spacer, Text } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { TfiShiftRightAlt, TfiClose } from "react-icons/tfi";

interface DesktopNavProps { }

const DesktopNav = ({ }: DesktopNavProps) => {
  const [size, setSize] = useState("large");

  const toggleSize = useCallback(() => {
    if (size === "small") {
      setSize("large")
    } else {
      setSize("small")
    }
  }, [size]);

  return (
    <Flex
      pos="sticky"
      h="100vh"
      boxShadow="0 4px 12px 0 rgba(0, 0, 0, 0.125)"
      w={size === "small" ? "75px" : "200px"}
      flexDir="column"
      justifyContent="space-between"
    >
      <Flex
        p="8px"
        flexDir="column"
        alignItems="flex-start"
        as="nav"
      >
        <IconButton
          background="none"
          mt={5}
          marginLeft="45%"
          _hover={{ background: "red" }}
          onClick={toggleSize}
        >
          {
            size !== "large" ? <TfiShiftRightAlt color="000000" /> : <TfiClose color="000000" />
          }
        </IconButton>
      </Flex>
      <Flex
        p="8px"
        flexDir="column"
        w="100%"
        alignItems="flex-start"
        mb={4}
      >
        <Spacer />
        <Flex mt={4} align="center" justifyContent="center" ml={4}>
          <Avatar.Root size="sm">
            <Avatar.Fallback name="User" />
          </Avatar.Root>
          <Flex flexDir="column" ml={4}>
            <Heading as="h3" size="md" >Test User</Heading>
            <Text color="gray">Empleado</Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default DesktopNav;