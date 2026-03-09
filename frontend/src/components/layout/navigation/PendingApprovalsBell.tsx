import {
  Badge,
  Box,
  Flex,
  IconButton,
  Link as ChakraLink,
  Popover as ChakraPopover,
  Portal,
  ScrollArea,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router";
import { FiBell } from "react-icons/fi";
import { usePendientesAprobacion } from "../../../context/PendientesAprobacionContext";
import { Tooltip } from "../../ui/tooltip";

export const PendingApprovalsBell = () => {
  const { items, totalPendientes, isLoading, canViewPendingApprovals } = usePendientesAprobacion();
  const hasPendingItems = totalPendientes > 0;

  if (!canViewPendingApprovals) return null;

  return (
    <ChakraPopover.Root positioning={{ placement: "bottom-end", gutter: 8 }}>
      <ChakraPopover.Trigger asChild>
        <Box position="relative">
          <Tooltip content="Notificaciones" showArrow>
            <IconButton
              aria-label="Notificaciones de aprobación"
              variant="outline"
              size="md"
              minW="11"
              h="11"
              borderRadius="md"
              color={hasPendingItems ? "orange.600" : "gray.600"}
              bg="transparent"
              borderWidth="1px"
              borderColor={hasPendingItems ? "orange.600" : "gray.600"}
              _hover={{
                bg: hasPendingItems ? "orange.50" : "gray.50",
              }}
              _expanded={{
                bg: hasPendingItems ? "orange.50" : "gray.50",
              }}
            >
              <Box as={FiBell} boxSize="5.5" />
            </IconButton>
          </Tooltip>
          {hasPendingItems && (
            <Badge
              position="absolute"
              top="-1.5"
              right="-1.5"
              minW="5"
              h="5"
              px="1.5"
              borderRadius="full"
              colorPalette="red"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
              boxShadow="sm"
            >
              {totalPendientes}
            </Badge>
          )}
        </Box>
      </ChakraPopover.Trigger>

      <Portal>
        <ChakraPopover.Positioner>
          <ChakraPopover.Content w="380px" p="0" overflow="hidden">
            <Box px="4" py="3" borderBottomWidth="1px">
              <Flex align="center" justify="space-between" gap="3">
                <Text fontWeight="semibold">Solicitudes pendientes</Text>
                <Badge colorPalette={totalPendientes > 0 ? "red" : "gray"} variant="subtle">
                  {totalPendientes}
                </Badge>
              </Flex>
            </Box>

            {isLoading ? (
              <Flex py="8" justify="center" align="center">
                <Spinner size="sm" />
              </Flex>
            ) : items.length === 0 ? (
              <Flex px="4" py="8" justify="center" align="center">
                <Text fontSize="sm" color="gray.500">
                  No hay notificaciones para mostrar
                </Text>
              </Flex>
            ) : (
              <ScrollArea.Root variant="hover" maxH="360px">
                <ScrollArea.Viewport>
                  <Stack gap="0">
                    {items.map((item) => (
                      <ChakraLink key={`${item.tipo_solicitud}-${item.id_solicitud}`} asChild _hover={{ textDecoration: "none" }}>
                        <RouterLink to={item.ruta_destino}>
                          <Box px="4" py="3" borderBottomWidth="1px" _hover={{ bg: "gray.50" }}>
                            <Flex justify="space-between" align="flex-start" gap="3">
                              <Stack gap="1" flex="1">
                                <Text fontSize="sm" fontWeight="semibold" lineClamp={1}>
                                  {item.nombre_solicitante}
                                </Text>
                                <Text fontSize="xs" color="gray.600">
                                  {item.tipo_label}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {item.descripcion}
                                </Text>
                              </Stack>
                              <Badge colorPalette="yellow" variant="subtle">
                                Pendiente
                              </Badge>
                            </Flex>
                          </Box>
                        </RouterLink>
                      </ChakraLink>
                    ))}
                  </Stack>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar orientation="vertical" />
              </ScrollArea.Root>
            )}
          </ChakraPopover.Content>
        </ChakraPopover.Positioner>
      </Portal>
    </ChakraPopover.Root>
  );
};
