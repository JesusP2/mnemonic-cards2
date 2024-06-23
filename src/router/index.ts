import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router';
import { queryClient } from '../lib/query-client';
import { profileQueryOptions } from '../lib/queries';

const rootRoute = createRootRoute({
  beforeLoad: async () => queryClient.ensureQueryData(profileQueryOptions)
});

const mainLayout = createRoute({
  getParentRoute: () => rootRoute,
  path: '',
  beforeLoad: async () => {
    const profile = await queryClient.ensureQueryData(profileQueryOptions)
    if (!profile) {
      throw redirect({ to: '/auth/signin'})
    }
  },
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
  beforeLoad: async () => {
    const profile = await queryClient.ensureQueryData(profileQueryOptions)
    if (profile) {
      throw redirect({ to: '/main/home'})
    }
  },
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

export const forgotPasswordRoute = createRoute({
  getParentRoute: () => authLayout,
  path: 'forgot-password',
  component: lazyRouteComponent(() => import('../pages/auth/forgot-password')),
});

const routeTree = rootRoute.addChildren([
  mainLayout.addChildren([homeRoute]),
  authLayout.addChildren([signinRoute, signupRoute, forgotPasswordRoute]),
]);
export const router = createRouter({ routeTree, defaultPreload: 'intent' });

// Register your router for maximum type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
