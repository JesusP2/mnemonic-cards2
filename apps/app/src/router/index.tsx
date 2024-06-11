import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { queryClient } from '../lib/query-client';
import { pingRoute } from '@repo/api/client';

const rootRoute = createRootRoute({
  beforeLoad: async () => {
    const data = await queryClient.ensureQueryData({
      queryKey: ['ping'],
      queryFn: () => pingRoute.api.ping.$get({ query: { message: 'ping' } }),
    });
    console.log(data)
  },
});
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'home',
  component: () => <div>hi</div>,
});
const routeTree = rootRoute.addChildren([homeRoute]);
export const router = createRouter({ routeTree, defaultPreload: 'intent' });

// Register your router for maximum type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
