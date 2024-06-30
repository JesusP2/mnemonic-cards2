import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router';
import { profileQueryOptions } from './lib/queries';
import { queryClient } from './lib/query-client';

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
  component: lazyRouteComponent(() => import('./pages/main-layout')),
});

const homeRoute = createRoute({
  getParentRoute: () => mainLayout,
  path: 'home',
  component: lazyRouteComponent(() => import('./pages/home')),
});

const settingsRoute = createRoute({
  getParentRoute: () => mainLayout,
  path: 'settings',
  component: lazyRouteComponent(() => import('./pages/settings-layout')),
});

const profileRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: 'profile',
  component: lazyRouteComponent(() => import('./pages/profile')),
});

const accountRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: 'account',
  component: lazyRouteComponent(() => import('./pages/account')),
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
  component: lazyRouteComponent(() => import('./pages/auth-layout')),
});

const signinRoute = createRoute({
  getParentRoute: () => authLayout,
  path: 'signin',
  component: lazyRouteComponent(() => import('./pages/auth/signin')),
});

const magicLinkRoute = createRoute({
  getParentRoute: () => authLayout,
  path: 'magic-link',
  component: lazyRouteComponent(() => import('./pages/auth/magic-link')),
});

const signupRoute = createRoute({
  getParentRoute: () => authLayout,
  path: 'signup',
  component: lazyRouteComponent(() => import('./pages/auth/signup')),
});

export const forgotPasswordRoute = createRoute({
  getParentRoute: () => authLayout,
  path: 'forgot-password',
  component: lazyRouteComponent(() => import('./pages/auth/forgot-password')),
});

export const resetPasswordRoute = createRoute({
  getParentRoute: () => authLayout,
  path: 'reset-password/$token',
  beforeLoad: async (idk) => {
    console.log(idk.params.token);
  },
  component: lazyRouteComponent(
    () => import('./pages/auth/reset-password-token'),
  ),
});

const routeTree = rootRoute.addChildren([
  mainLayout.addChildren([
    homeRoute,
    settingsRoute.addChildren([profileRoute, accountRoute]),
  ]),
  authLayout.addChildren([
    signinRoute,
    signupRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
    magicLinkRoute,
  ]),
]);
export const router = createRouter({ routeTree, defaultPreload: 'intent' });

// Register your router for maximum type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
