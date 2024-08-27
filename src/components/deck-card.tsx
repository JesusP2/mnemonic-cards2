import { useMutation, useQuery } from '@tanstack/react-query';
import { profileQueryOptions } from '../lib/queries';
import { cn } from './ui/utils';
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
} from './ui/dropdown-menu';
import { Button, buttonVariants } from './ui/button';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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

export function DeckCard({ title, id }: { title: string; id: string }) {
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

