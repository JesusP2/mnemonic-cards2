import { queryOptions } from '@tanstack/react-query';
import type { ClientSideCard } from '../../server/db/types';
import { queryClient } from '../query-client';
import type { Profile, UserDeckDashboard } from '../types';

export const profileQueryOptions = queryOptions({
  queryKey: ['profile'],
  queryFn: async () => {
    const res = await fetch('/api/profile');
    if (!res.ok) {
      throw new Error('Could not validate user');
    }
    const json = await res.json();
    return json as Profile | null;
  },
});

export const userDecksQueryOptions = () => {
  const profile = queryClient.getQueryData(['profile']) as Profile;
  return queryOptions({
    queryKey: ['user-decks-', profile.username],
    queryFn: async () => {
      const res = await fetch('/api/deck');
      if (!res.ok) {
        throw new Error('Could not validate user');
      }
      const json = await res.json();
      return json as UserDeckDashboard[];
    },
  });
};

export const deckReviewQueryOptions = (deckId: string) =>
  queryOptions({
    queryKey: ['deck-review-', deckId],
    queryFn: async () => {
      const res = await fetch(`/api/deck/${deckId}/review`);
      if (!res.ok) {
        throw new Error('Could not validate user');
      }
      const json = await res.json();
      return json as ClientSideCard[];
    },
  });
