/* eslint-disable no-unused-vars */
import type { Table, TableRootProps } from "@chakra-ui/react";

export type Sticky = "start" | "end";

export type DataTableColumn<T> = {
  /** Unique id for column */
  id: string;
  /** Header label or node */
  header: React.ReactNode;
  /** Cell renderer */
  cell: (row: T) => React.ReactNode;
  /** Optional: width / minWidth */
  w?: Table.ColumnHeaderProps["w"];
  minW?: Table.ColumnHeaderProps["minW"];
  /** Optional: align */
  textAlign?: Table.CellProps["textAlign"];
  /** Optional: sticky column (requires scrollArea + stickyHeader usually) */
  sticky?: Sticky;
  /** Sticky offset in px (e.g. 0) */
  stickyOffset?: number;
  /** Optional: disable column */
  isHidden?: boolean;
};

export type DataTablePagination = {
  enabled?: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (nextPage: number) => void;
};

export type DataTableSelection<T> = {
  enabled?: boolean;
  /** Controlled selected keys */
  selectedKeys: string[];
  /** Called when selection changes */
  onChange: (nextKeys: string[]) => void;
  /** Unique key per row */
  getRowKey: (row: T) => string;
};

export type DataTableActionBar = {
  enabled?: boolean;
  /** Render custom actions when there is selection */
  renderActions?: (selectionCount: number) => React.ReactNode;
};

export type DataTableActionColumn<T> = {
  /** Header label or node (defaults to "Acciones") */
  header?: React.ReactNode;
  /** Cell renderer — receives the row and returns action buttons / icons */
  cell: (row: T) => React.ReactNode;
  /** Fixed width for the column (defaults to "140px") */
  w?: Table.ColumnHeaderProps["w"];
};

export interface DataTableProps<T> extends Omit<TableRootProps, "children" | "columns"> {
  columns: Array<DataTableColumn<T>>;
  data: T[];

  /** Scroll container and sticky behavior */
  scrollAreaHeight?: string | number;
  stickyHeader?: boolean;
  enableStickyColumns?: boolean;

  /** Visual variants */
  striped?: boolean;
  variant?: TableRootProps["variant"];
  size?: TableRootProps["size"];

  /** Selection */
  selection?: DataTableSelection<T>;

  /** Pagination */
  pagination?: DataTablePagination;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRowClick?: (row: any) => void

  /** Action bar (works with selection) — cannot coexist with actionColumn */
  actionBar?: DataTableActionBar;

  /**
   * Per-row actions column, sticky to the right edge.
   * Cannot coexist with actionBar.
   */
  actionColumn?: DataTableActionColumn<T>;

  /** Empty state */
  emptyState?: React.ReactNode;

  /** Row props */
  getRowProps?: (row: T) => Partial<Table.RowProps>;

  isDataLoading: boolean
}