import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router';
import { profileQueryOptions } from '../lib/queries';
import { queryClient } from '../lib/query-client';

const rootRoute = createRootRoute({});

const mainLayout = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async () => {
    const profile = await queryClient.fetchQuery(profileQueryOptions);
    if (!profile) {
      throw redirect({ to: '/auth/signin' });
    }
  },
  component: lazyRouteComponent(() => import('../pages/main-layout')),
});

const homeRoute = createRoute({
  getParentRoute: () => mainLayout,
  path: 'home',
  component: lazyRouteComponent(() => import('../pages/home')),
});

const settingsRoute = createRoute({
  getParentRoute: () => mainLayout,
  path: 'settings',
  component: lazyRouteComponent(() => import('../pages/settings-layout')),
});

const profileRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: 'profile',
  component: lazyRouteComponent(() => import('../pages/profile')),
});

const authLayout = createRoute({
  getParentRoute: () => rootRoute,
  path: 'auth',
  beforeLoad: async () => {
    const profile = await queryClient.fetchQuery(profileQueryOptions);
    if (profile) {
      throw redirect({ to: '/home' });
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

export const emailVerificationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'email-verification',
  component: lazyRouteComponent(
    () => import('../pages/auth/email-verification'),
  ),
});

const routeTree = rootRoute.addChildren([
  emailVerificationRoute,
  mainLayout.addChildren([
    homeRoute,
    settingsRoute.addChildren([profileRoute]),
  ]),
  authLayout.addChildren([
    signinRoute,
    signupRoute,
   forgotPasswordRoute
  ]),
]);
export const router = createRouter({ routeTree, defaultPreload: 'intent' });

// Register your router for maximum type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
