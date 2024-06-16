import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';

const rootRoute = createRootRoute({
  beforeLoad: async () => {},
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
