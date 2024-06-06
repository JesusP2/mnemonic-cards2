import { QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
export const queryClient = new QueryClient({
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
