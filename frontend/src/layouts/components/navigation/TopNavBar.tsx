import { Box, Flex, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react';

interface TopNavBarProps {
  leftContent?: ReactNode;
  middleContent?: ReactNode;
  rightContent?: ReactNode;
}

export const TopNavBar = ({ leftContent, middleContent, rightContent }: TopNavBarProps) => {
  return (
    <Box
      w="full"
      h="30px"
      borderBottom="1px solid #0000001a"
      backgroundColor="white"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      p="30px"
    >
      <Flex alignItems="center">
        {leftContent}
      </Flex>
      <Text alignItems="center">
        {middleContent}
      </Text>
      <Text alignItems="center">
        {rightContent}
      </Text>
    </Box>
  )
}
