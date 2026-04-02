import { Box, Button, HStack, Text } from "@chakra-ui/react";
import { FiArrowDown, FiArrowUp } from "react-icons/fi";

export type SortDir = "asc" | "desc";

interface SortHeaderProps<TField extends string> {
  label: string;
  field: TField;
  currentSortBy: TField;
  currentSortDir: SortDir;
  // eslint-disable-next-line no-unused-vars
  onChange: (field: TField) => void;
}

export function SortHeader<TField extends string>({
  label,
  field,
  currentSortBy,
  currentSortDir,
  onChange,
}: SortHeaderProps<TField>) {
  const isActive = currentSortBy === field;

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      px="0"
      justifyContent="flex-start"
      onClick={() => onChange(field)}
      aria-label={`Ordenar por ${label}`}
    >
      <HStack gap="1">
        <Text>{label}</Text>
        {isActive && (
          <Box color="brand.blue.600" display="inline-flex" alignItems="center">
            {currentSortDir === "asc" ? <FiArrowUp /> : <FiArrowDown />}
          </Box>
        )}
      </HStack>
    </Button>
  );
}
