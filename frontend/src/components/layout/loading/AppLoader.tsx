import { Portal, Spinner, Text, VStack, Box } from "@chakra-ui/react";

type AppLoaderProps = {
  label?: string;
};

export function AppLoader({ label = "Cargando..." }: AppLoaderProps) {
  return (
    <Portal>
      <Box
        position="fixed"
        inset="0"
        zIndex="overlay"
        bg="blackAlpha.400"
        backdropFilter="blur(1px)"
        display="grid"
        placeItems="center"
        pointerEvents="all"
      >
        <VStack gap="3">
          <Spinner size="xl" />
          <Text fontWeight="semibold">{label}</Text>
        </VStack>
      </Box>
    </Portal>
  );
}
