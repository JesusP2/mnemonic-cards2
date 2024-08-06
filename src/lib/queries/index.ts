import { queryOptions } from '@tanstack/react-query';
import type { Profile, UserDeckDashboard } from '../types';
import type { SelectCard } from '../../server/db/types';

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

export const userDecksQueryOptions = queryOptions({
  queryKey: ['user-decks'],
  queryFn: async () => {
    const res = await fetch('/api/deck');
    if (!res.ok) {
      throw new Error('Could not validate user');
    }
    const json = await res.json();
    return json as UserDeckDashboard[];
  },
});

export const deckReviewQueryOptions = (deckId: string) => queryOptions({
  queryKey: ['deck-review-', deckId],
  queryFn: async () => {
    const res = await fetch(`/api/deck/${deckId}/review`);
    if (!res.ok) {
      throw new Error('Could not validate user');
    }
    const json = await res.json();
    return json as SelectCard[];
  }
})
