import type { ReactNode } from "react";
import { EmptyState, VStack } from "@chakra-ui/react";
import { FiFileMinus } from "react-icons/fi";

interface EmptyStateIndicatorProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  variant?: "page" | "compact";
}

export const EmptyStateIndicator = ({
  title,
  subtitle,
  icon,
  action,
  variant = "page",
}: EmptyStateIndicatorProps) => {
  const isCompact = variant === "compact";

  return (
    <EmptyState.Root
      colorPalette="blue"
      h={isCompact ? "220px" : "500px"}
      border="0.15rem dashed"
      borderColor="blue.600"
      alignContent="center"
      mt={isCompact ? "0" : "2rem"}
      px={isCompact ? "3" : undefined}
    >
      <EmptyState.Content>
        <EmptyState.Indicator>
          {icon ?? <FiFileMinus />}
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
