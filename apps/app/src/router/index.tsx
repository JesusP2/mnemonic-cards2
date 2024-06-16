import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from '@tanstack/react-router';

const rootRoute = createRootRoute({
  beforeLoad: async () => { },
});

const mainLayout = createRoute({
  getParentRoute: () => rootRoute,
  path: 'main',
  component: lazyRouteComponent(() => import('../pages/main-layout')),
});

const homeRoute = createRoute({
  getParentRoute: () => mainLayout,
  path: 'home',
  component: lazyRouteComponent(() => import('../pages/home')),
});

const authLayout = createRoute({
  getParentRoute: () => rootRoute,
  path: 'auth',
  component: lazyRouteComponent(() => import('../pages/auth-layout')),
});

const signinRoute = createRoute({
  getParentRoute: () => authLayout,
  path: 'signin',
  component: lazyRouteComponent(() => import('../pages/auth/signin')),
});

const signupRoute = createRoute({
  getParentRoute: () => authLayout,
  path: 'signup',
  component: lazyRouteComponent(() => import('../pages/auth/signup')),
});

const routeTree = rootRoute.addChildren([
  mainLayout.addChildren([homeRoute]),
  authLayout.addChildren([signinRoute, signupRoute]),
]);
export const router = createRouter({ routeTree, defaultPreload: 'intent' });

// Register your router for maximum type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
