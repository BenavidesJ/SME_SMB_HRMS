import type { ReactNode } from "react";
import { Card, ScrollArea, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { EmptyStateIndicator } from "../feedback/EmptyState";

interface SolicitudesBoardColumn {
  key: string;
  title: string;
}

interface SolicitudesBoardProps<TItem> {
  columns: readonly SolicitudesBoardColumn[];
  items: TItem[];
  isLoading?: boolean;
  emptyTitle?: string;
  getStatus: (item: TItem) => string | null | undefined;
  getKey: (item: TItem) => string | number;
  renderItem: (item: TItem) => ReactNode;
}

const normalizeStatus = (value?: string | null) => String(value ?? "").trim().toUpperCase();

export function SolicitudesBoard<TItem>({
  columns,
  items,
  isLoading = false,
  emptyTitle = "Esta lista está vacía",
  getStatus,
  getKey,
  renderItem,
}: SolicitudesBoardProps<TItem>) {
  return (
    <SimpleGrid columns={{ base: 1, lg: 3 }} gap="4" alignItems="stretch">
      {columns.map((column) => {
        const columnItems = items.filter((item) => normalizeStatus(getStatus(item)) === column.key);

        return (
          <Card.Root
            key={column.key}
            display="flex"
            flexDirection="column"
            minH={{ base: "auto", lg: "calc(100vh - 18rem)" }}
            maxH={{ base: "none", lg: "calc(100vh - 18rem)" }}
          >
            <Card.Header pb="3">
              <Card.Title>{column.title}</Card.Title>
              <Text color="fg.muted" textStyle="sm">
                {columnItems.length} {columnItems.length === 1 ? "solicitud" : "solicitudes"}
              </Text>
            </Card.Header>

            <Card.Body pt="0" display="flex" flexDirection="column" minH="0">
              <ScrollArea.Root flex="1" minH="0" variant="hover">
                <ScrollArea.Viewport>
                  <Stack gap="3" pb="6" pr="2">
                    {!isLoading && columnItems.length === 0 && (
                      <EmptyStateIndicator title={emptyTitle} variant="compact" />
                    )}

                    {columnItems.map((item) => (
                      <div key={getKey(item)}>{renderItem(item)}</div>
                    ))}
                  </Stack>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar orientation="vertical" />
              </ScrollArea.Root>
            </Card.Body>
          </Card.Root>
        );
      })}
    </SimpleGrid>
  );
}