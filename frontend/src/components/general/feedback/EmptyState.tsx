import type { ReactNode } from "react";
import { EmptyState, VStack } from "@chakra-ui/react";

interface EmptyStateIndicatorProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}

export const EmptyStateIndicator = ({ title, subtitle, icon, action }: EmptyStateIndicatorProps) => {
  return (
    <EmptyState.Root
      colorPalette="blue"
      h="500px"
      border="0.15rem dashed"
      borderColor="blue.600"
      alignContent="center"
      mt="2rem"
    >
      <EmptyState.Content>
        <EmptyState.Indicator>
          {icon}
        </EmptyState.Indicator>
        <VStack textAlign="center">
          <EmptyState.Title>
            {title}
          </EmptyState.Title>
          <EmptyState.Description>
            {subtitle}
          </EmptyState.Description>
        </VStack>
        {action}
      </EmptyState.Content>
    </EmptyState.Root>
  )
}
