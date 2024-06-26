import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryCache, QueryClient } from '@tanstack/react-query';
import { compress, decompress } from 'lz-string';
import { toast } from 'sonner';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: Number.POSITIVE_INFINITY,
    },
  },
  queryCache: new QueryCache({
    onError: (err, query) => {
      if (query.meta?.type === 'notification') {
        toast.error('Error', {
          description: err.message,
          duration: 10000,
        });
      }
    },
  }),
});

export const persister = createSyncStoragePersister({
  storage: window.localStorage,
  serialize: (data) => compress(JSON.stringify(data)),
  deserialize: (data) => JSON.parse(decompress(data)),
});
