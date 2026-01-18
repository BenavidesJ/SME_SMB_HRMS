import { ButtonGroup, IconButton, Pagination } from '@chakra-ui/react';
import type { DataTablePagination } from './types';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface TablePaginationProps {
  pagination: DataTablePagination | undefined;
}

export const TablePagination = (props: TablePaginationProps) => {
  const { pagination } = props;

  if (!pagination || !pagination.enabled) return null;

  return (
    <Pagination.Root
      count={pagination.totalCount}
      pageSize={pagination.pageSize}
      page={pagination.page}
      onPageChange={(d) => pagination.onPageChange(d.page)}
    >
      <ButtonGroup variant="ghost" size="sm" wrap="wrap" mt="4">
        <Pagination.PrevTrigger asChild>
          <IconButton aria-label="Página anterior">
            <FiChevronLeft />
          </IconButton>
        </Pagination.PrevTrigger>

        <Pagination.Items
          render={(page) => (
            <IconButton
              aria-label={`Página ${page.value}`}
              variant={{ base: "ghost", _selected: "outline" }}
            >
              {page.value}
            </IconButton>
          )}
        />

        <Pagination.NextTrigger asChild>
          <IconButton aria-label="Página siguiente">
            <FiChevronRight />
          </IconButton>
        </Pagination.NextTrigger>
      </ButtonGroup>
    </Pagination.Root>
  )
}
