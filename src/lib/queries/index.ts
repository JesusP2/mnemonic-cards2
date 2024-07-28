import { queryOptions } from '@tanstack/react-query';
import type { Profile, UserDeckDashboard } from '../types';

export const profileQueryOptions = queryOptions({
  queryKey: ['profile'],
  queryFn: async () => {
    console.log('profile query')
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
    console.log('user-decks query')
    const res = await fetch('/api/deck');
    if (!res.ok) {
      throw new Error('Could not validate user');
    }
    const json = await res.json();
    return json as UserDeckDashboard[];
  },
});
