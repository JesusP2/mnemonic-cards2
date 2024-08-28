import { createLazyFileRoute } from '@tanstack/react-router';
import { Input } from '../components/ui/input';
import { useState } from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { userDecksQueryOptions } from '../lib/queries';
import type { UserDeckDashboard } from '../lib/types';
import { CreateDeck } from '../components/create-deck';
import { DeckCard } from '../components/deck-card';
import { Button } from '../components/ui/button';
import { RefreshCw } from 'lucide-react';
import { queryClient } from '../lib/query-client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';

export const Route = createLazyFileRoute('/_main/me')({
  component: Me,
});

export const columns: ColumnDef<UserDeckDashboard>[] = [
  {
    accessorKey: 'name',
  },
  {
    accessorKey: 'easy',
  },
  {
    accessorKey: 'good',
  },
  {
    accessorKey: 'hard',
  },
  {
    accessorKey: 'again',
  },
];

function Me() {
  const userDecksQuery = useQuery(userDecksQueryOptions());
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: userDecksQuery.data || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <div className="container mx-auto py-10">
      <h1 className="font-bold text-2xl">Decks</h1>
      <div className="my-4 flex gap-x-4">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <CreateDeck />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={async () => {
                  await queryClient.invalidateQueries();
                }}
                variant="outline"
              >
                <RefreshCw size={15} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sync</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,_minmax(22rem,_1fr))] gap-4">
        {table.getRowModel().rows?.length
          ? table
              .getRowModel()
              .rows.map((row) => (
                <DeckCard
                  {...row.original}
                  title={row.original.name}
                  id={row.original.id}
                  key={row.id}
                />
              ))
          : null}
      </div>
    </div>
  );
}
