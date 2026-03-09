import { Box, Flex } from '@chakra-ui/react'
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
      <Flex alignItems="center" justifyContent="center" flex="1" px="4">
        {middleContent}
      </Flex>
      <Flex alignItems="center" gap="2">
        {rightContent}
      </Flex>
    </Box>
  )
}
