/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Checkbox,
  Table,
} from "@chakra-ui/react";
import { TableEmptyState } from "./TableEmptyState";
import { stickyCss } from "./sticky";
import type { DataTableProps } from "./types";
import { TablePagination } from "./TablePagination";
import { TableActionBar } from "./TableActionBar";
import { isInteractiveTarget } from "./isInteractiveTarget";

export function DataTable<T>(props: DataTableProps<T>) {
  const {
    columns,
    data,

    stickyHeader = false,
    enableStickyColumns = false,

    striped = false,
    variant = "outline",
    size,

    selection,
    pagination,
    actionBar,

    getRowProps,
    isDataLoading,
    css,
    ...tableRootProps
  } = props;

  const visibleColumns = React.useMemo(
    () => columns.filter((c) => !c.isHidden),
    [columns],
  );

  const selectionEnabled = Boolean(selection?.enabled);
  const rowKey = selection?.getRowKey;

  const selectedKeys = selection?.selectedKeys ?? [];
  const hasSelection = selectionEnabled && selectedKeys.length > 0;
  const indeterminate =
    selectionEnabled && selectedKeys.length > 0 && selectedKeys.length < data.length;

  const toggleAll = (checked: boolean) => {
    if (!selectionEnabled || !selection || !rowKey) return;

    const keys = data
      .map((r) => rowKey(r))
      .filter((k): k is string => Boolean(k));

    selection.onChange(checked ? keys : []);
  };


  const toggleOne = (key: string, checked: boolean) => {
    if (!selectionEnabled || !selection) return;
    const next = checked
      ? Array.from(new Set([...selectedKeys, key]))
      : selectedKeys.filter((k) => k !== key);
    selection.onChange(next);
  };

  const showStickyCss = stickyHeader && enableStickyColumns;

  const bodyRows =
    data.length === 0 ? (
      <Table.Row>
        <Table.Cell colSpan={visibleColumns.length + (selectionEnabled ? 1 : 0)} height="460px">
          <TableEmptyState isLoading={isDataLoading} />
        </Table.Cell>
      </Table.Row>
    ) : (
      data.map((row) => {
        const key = rowKey ? rowKey(row) : undefined;
        const isSelected = key ? selectedKeys.includes(key) : false;

        const handleRowToggle = () => {
          if (!selectionEnabled || !selection || !key) return;
          toggleOne(String(key), !isSelected);
        };

        return (
          <Table.Row
            _hover={{
              bg: "brand.blue.25",
            }}
            css={{
              '&[data-selected]': {
                bg: "brand.blue.50",
              },
              '&[data-selected]:hover': {
                bg: "brand.blue.75",
              },
            }}
            key={key ?? String((row as any)?.id ?? Math.random())}
            data-selected={isSelected ? "" : undefined}
            {...(getRowProps?.(row) ?? {})}
            onClick={(e) => {
              (getRowProps?.(row) as any)?.onClick?.(e);

              if (e.defaultPrevented) return;
              if (!selectionEnabled) return;
              if (isInteractiveTarget(e.target)) return;

              handleRowToggle();
            }}

            onKeyDown={(e) => {
              (getRowProps?.(row) as any)?.onKeyDown?.(e);

              if (e.defaultPrevented) return;
              if (!selectionEnabled) return;

              if (e.key === "Enter" || e.key === " ") {
                if (isInteractiveTarget(e.target)) return;
                e.preventDefault();
                handleRowToggle();
              }
            }}
            tabIndex={selectionEnabled ? 0 : undefined}
            style={{
              cursor: selectionEnabled ? "pointer" : undefined,
              ...(getRowProps?.(row)?.style ?? {}),
            }}
          >
            {selectionEnabled && (
              <Table.Cell w="6">
                <Checkbox.Root
                  size="sm"
                  mt="0.5"
                  aria-label="Seleccionar fila"
                  colorPalette="blue"
                  checked={isSelected}
                  onCheckedChange={(changes) => {
                    toggleOne(String(key), Boolean(changes.checked));
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                </Checkbox.Root>
              </Table.Cell>
            )}

            {visibleColumns.map((col) => {
              const sticky = col.sticky;
              const stickyOffset = col.stickyOffset ?? 0;

              return (
                <Table.Cell
                  key={col.id}
                  textAlign={col.textAlign}
                  {...(sticky
                    ? {
                      "data-sticky": sticky,
                      ...(sticky === "start" ? { left: stickyOffset } : { right: stickyOffset }),
                    }
                    : {})}
                >
                  {col.cell(row)}
                </Table.Cell>
              );
            })}
          </Table.Row>
        );
      })
    );

  const table = (
    <Table.Root
      size={size}
      variant={variant}
      striped={striped}
      stickyHeader
      interactive
      css={{
        ...(showStickyCss ? stickyCss : {}),
        ...(css as any),
      }}
      {...tableRootProps}
    >
      <Table.Header>
        <Table.Row>
          {selectionEnabled && (
            <Table.ColumnHeader w="6">
              <Checkbox.Root
                size="sm"
                mt="0.5"
                aria-label="Seleccionar todas"
                colorPalette="blue"
                checked={indeterminate ? "indeterminate" : hasSelection}
                onCheckedChange={(changes) => {
                  toggleAll(Boolean(changes.checked));
                }}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
              </Checkbox.Root>
            </Table.ColumnHeader>
          )}

          {visibleColumns.map((col) => {
            const sticky = enableStickyColumns ? col.sticky : undefined;
            const stickyOffset = col.stickyOffset ?? 0;

            return (
              <Table.ColumnHeader
                key={col.id}
                w={col.w}
                minW={col.minW}
                textAlign={col.textAlign}
                {...(sticky
                  ? {
                    "data-sticky": sticky,
                    ...(sticky === "start" ? { left: stickyOffset } : { right: stickyOffset }),
                  }
                  : {})}
              >
                {col.header}
              </Table.ColumnHeader>
            );
          })}
        </Table.Row>
      </Table.Header>

      <Table.Body>{bodyRows}</Table.Body>
    </Table.Root>
  );

  return (
    <>
      <Table.ScrollArea
        borderWidth="1px"
        rounded="md"
        maxW="full"
      >
        {table}
      </Table.ScrollArea>

      {/* Pagination */}
      <TablePagination pagination={pagination} />

      {/* Action bar */}
      <TableActionBar
        hasSelection={hasSelection}
        selectedKeys={selectedKeys}
        selectionEnabled={selectionEnabled}
        actionBar={actionBar}
      />
    </>
  );
}
