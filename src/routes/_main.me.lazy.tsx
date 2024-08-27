import { createLazyFileRoute, Link } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button, buttonVariants } from '../components/ui/button';
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
import { useMutation, useQuery } from '@tanstack/react-query';
import { profileQueryOptions, userDecksQueryOptions } from '../lib/queries';
import type { UserDeckDashboard } from '../lib/types';
import { cn } from '../components/ui/utils';
import { queryClient } from '../lib/query-client';
import { toast } from 'sonner';
import { EllipsisVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { CreateDeck } from '../components/create-deck';

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

function OptionsDropdown({ deckId }: { deckId: string }) {
  const profileQuery = useQuery(profileQueryOptions);
  const deleteMutation = useMutation({
    meta: {
      type: 'notification',
    },
    mutationFn: async (deckId: string) => {
      const response = await fetch(`/api/deck/${deckId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete deck');
      }
      return response.json();
    },
  });
  async function handleDeleteDeck() {
    queryClient.removeQueries({
      queryKey: ['deck-review-', deckId],
    });
    queryClient.setQueryData(
      ['user-decks-', profileQuery.data?.username],
      (oldData: Record<string, unknown>[]) => {
        return oldData.filter((record) => record.id !== deckId);
      },
    );
    toast.success('Deck deleted');
    await queryClient.invalidateQueries({
      queryKey: ['deck-review-', deckId],
    });
    await deleteMutation.mutateAsync(deckId);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 absolute right-2 top-0">
          <EllipsisVertical size={15} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem>Rename deck</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/deck/$deckId/card" params={{ deckId: deckId }}>
            Add card
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleDeleteDeck}>
          Delete deck
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DeckCard({ title, id }: { title: string; id: string }) {
  return (
    <Card className="w-[16rem] rounded-md border-foreground/20 mx-auto">
      <CardHeader className="space-y-2 relative">
        <CardTitle className="text-lg font-bold text-center truncate px-2">{title}</CardTitle>
        <OptionsDropdown deckId={id} />
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-4">
        <Link
          to="/deck/$deckId/review"
          params={{ deckId: id }}
          className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
        >
          GO
        </Link>
      </CardContent>
    </Card>
  );
}

export const Route = createLazyFileRoute('/_main/me')({
  component: Me,
});

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
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,_minmax(16rem,_1fr))] gap-4">
        {table.getRowModel().rows?.length
          ? table
              .getRowModel()
              .rows.map((row) => (
                <DeckCard
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
