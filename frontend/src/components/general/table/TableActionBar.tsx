import { ActionBar, Portal } from '@chakra-ui/react'
import type { DataTableActionBar } from './types';

interface TableActionBarProps {
  hasSelection: boolean;
  selectedKeys: string[];
  actionBar: DataTableActionBar | undefined;
  selectionEnabled: boolean;
}

export const TableActionBar = (props: TableActionBarProps) => {
  const { hasSelection, selectedKeys, actionBar, selectionEnabled } = props;

  if (!selectionEnabled && !actionBar?.enabled) return null;

  return (
    <ActionBar.Root open={hasSelection}>
      <Portal>
        <ActionBar.Positioner>
          <ActionBar.Content>
            <ActionBar.SelectionTrigger>
              {selectedKeys.length} seleccionados
            </ActionBar.SelectionTrigger>
            <ActionBar.Separator />
            {actionBar!.renderActions!(selectedKeys.length)}
          </ActionBar.Content>
        </ActionBar.Positioner>
      </Portal>
    </ActionBar.Root>
  )
}
