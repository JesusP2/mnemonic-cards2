/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as AuthImport } from './routes/auth'
import { Route as MainImport } from './routes/_main'

// Create Virtual Routes

const IndexLazyImport = createFileRoute('/')()
const AuthSignupLazyImport = createFileRoute('/auth/signup')()
const AuthSigninLazyImport = createFileRoute('/auth/signin')()
const AuthMagicLinkLazyImport = createFileRoute('/auth/magic-link')()
const AuthForgotPasswordLazyImport = createFileRoute('/auth/forgot-password')()
const MainSettingsLazyImport = createFileRoute('/_main/settings')()
const MainMeLazyImport = createFileRoute('/_main/me')()
const AuthResetPasswordTokenLazyImport = createFileRoute(
  '/auth/reset-password/$token',
)()
const MainSettingsProfileLazyImport = createFileRoute(
  '/_main/settings/profile',
)()
const MainSettingsAccountLazyImport = createFileRoute(
  '/_main/settings/account',
)()
const MainDeckDeckIdStudyLazyImport = createFileRoute(
  '/_main/deck/$deckId/study',
)()
const MainDeckDeckIdCardLazyImport = createFileRoute(
  '/_main/deck/$deckId/card',
)()

// Create/Update Routes

const AuthRoute = AuthImport.update({
  path: '/auth',
  getParentRoute: () => rootRoute,
} as any)

const MainRoute = MainImport.update({
  id: '/_main',
  getParentRoute: () => rootRoute,
} as any)

const IndexLazyRoute = IndexLazyImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/index.lazy').then((d) => d.Route))

const AuthSignupLazyRoute = AuthSignupLazyImport.update({
  path: '/signup',
  getParentRoute: () => AuthRoute,
} as any).lazy(() => import('./routes/auth.signup.lazy').then((d) => d.Route))

const AuthSigninLazyRoute = AuthSigninLazyImport.update({
  path: '/signin',
  getParentRoute: () => AuthRoute,
} as any).lazy(() => import('./routes/auth.signin.lazy').then((d) => d.Route))

const AuthMagicLinkLazyRoute = AuthMagicLinkLazyImport.update({
  path: '/magic-link',
  getParentRoute: () => AuthRoute,
} as any).lazy(() =>
  import('./routes/auth.magic-link.lazy').then((d) => d.Route),
)

const AuthForgotPasswordLazyRoute = AuthForgotPasswordLazyImport.update({
  path: '/forgot-password',
  getParentRoute: () => AuthRoute,
} as any).lazy(() =>
  import('./routes/auth.forgot-password.lazy').then((d) => d.Route),
)

const MainSettingsLazyRoute = MainSettingsLazyImport.update({
  path: '/settings',
  getParentRoute: () => MainRoute,
} as any).lazy(() =>
  import('./routes/_main.settings.lazy').then((d) => d.Route),
)

const MainMeLazyRoute = MainMeLazyImport.update({
  path: '/me',
  getParentRoute: () => MainRoute,
} as any).lazy(() => import('./routes/_main.me.lazy').then((d) => d.Route))

const AuthResetPasswordTokenLazyRoute = AuthResetPasswordTokenLazyImport.update(
  {
    path: '/reset-password/$token',
    getParentRoute: () => AuthRoute,
  } as any,
).lazy(() =>
  import('./routes/auth.reset-password.$token.lazy').then((d) => d.Route),
)

const MainSettingsProfileLazyRoute = MainSettingsProfileLazyImport.update({
  path: '/profile',
  getParentRoute: () => MainSettingsLazyRoute,
} as any).lazy(() =>
  import('./routes/_main.settings.profile.lazy').then((d) => d.Route),
)

const MainSettingsAccountLazyRoute = MainSettingsAccountLazyImport.update({
  path: '/account',
  getParentRoute: () => MainSettingsLazyRoute,
} as any).lazy(() =>
  import('./routes/_main.settings.account.lazy').then((d) => d.Route),
)

const MainDeckDeckIdStudyLazyRoute = MainDeckDeckIdStudyLazyImport.update({
  path: '/deck/$deckId/study',
  getParentRoute: () => MainRoute,
} as any).lazy(() =>
  import('./routes/_main.deck.$deckId.study.lazy').then((d) => d.Route),
)

const MainDeckDeckIdCardLazyRoute = MainDeckDeckIdCardLazyImport.update({
  path: '/deck/$deckId/card',
  getParentRoute: () => MainRoute,
} as any).lazy(() =>
  import('./routes/_main.deck.$deckId.card.lazy').then((d) => d.Route),
)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/_main': {
      id: '/_main'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof MainImport
      parentRoute: typeof rootRoute
    }
    '/auth': {
      id: '/auth'
      path: '/auth'
      fullPath: '/auth'
      preLoaderRoute: typeof AuthImport
      parentRoute: typeof rootRoute
    }
    '/_main/me': {
      id: '/_main/me'
      path: '/me'
      fullPath: '/me'
      preLoaderRoute: typeof MainMeLazyImport
      parentRoute: typeof MainImport
    }
    '/_main/settings': {
      id: '/_main/settings'
      path: '/settings'
      fullPath: '/settings'
      preLoaderRoute: typeof MainSettingsLazyImport
      parentRoute: typeof MainImport
    }
    '/auth/forgot-password': {
      id: '/auth/forgot-password'
      path: '/forgot-password'
      fullPath: '/auth/forgot-password'
      preLoaderRoute: typeof AuthForgotPasswordLazyImport
      parentRoute: typeof AuthImport
    }
    '/auth/magic-link': {
      id: '/auth/magic-link'
      path: '/magic-link'
      fullPath: '/auth/magic-link'
      preLoaderRoute: typeof AuthMagicLinkLazyImport
      parentRoute: typeof AuthImport
    }
    '/auth/signin': {
      id: '/auth/signin'
      path: '/signin'
      fullPath: '/auth/signin'
      preLoaderRoute: typeof AuthSigninLazyImport
      parentRoute: typeof AuthImport
    }
    '/auth/signup': {
      id: '/auth/signup'
      path: '/signup'
      fullPath: '/auth/signup'
      preLoaderRoute: typeof AuthSignupLazyImport
      parentRoute: typeof AuthImport
    }
    '/_main/settings/account': {
      id: '/_main/settings/account'
      path: '/account'
      fullPath: '/settings/account'
      preLoaderRoute: typeof MainSettingsAccountLazyImport
      parentRoute: typeof MainSettingsLazyImport
    }
    '/_main/settings/profile': {
      id: '/_main/settings/profile'
      path: '/profile'
      fullPath: '/settings/profile'
      preLoaderRoute: typeof MainSettingsProfileLazyImport
      parentRoute: typeof MainSettingsLazyImport
    }
    '/auth/reset-password/$token': {
      id: '/auth/reset-password/$token'
      path: '/reset-password/$token'
      fullPath: '/auth/reset-password/$token'
      preLoaderRoute: typeof AuthResetPasswordTokenLazyImport
      parentRoute: typeof AuthImport
    }
    '/_main/deck/$deckId/card': {
      id: '/_main/deck/$deckId/card'
      path: '/deck/$deckId/card'
      fullPath: '/deck/$deckId/card'
      preLoaderRoute: typeof MainDeckDeckIdCardLazyImport
      parentRoute: typeof MainImport
    }
    '/_main/deck/$deckId/study': {
      id: '/_main/deck/$deckId/study'
      path: '/deck/$deckId/study'
      fullPath: '/deck/$deckId/study'
      preLoaderRoute: typeof MainDeckDeckIdStudyLazyImport
      parentRoute: typeof MainImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
  IndexLazyRoute,
  MainRoute: MainRoute.addChildren({
    MainMeLazyRoute,
    MainSettingsLazyRoute: MainSettingsLazyRoute.addChildren({
      MainSettingsAccountLazyRoute,
      MainSettingsProfileLazyRoute,
    }),
    MainDeckDeckIdCardLazyRoute,
    MainDeckDeckIdStudyLazyRoute,
  }),
  AuthRoute: AuthRoute.addChildren({
    AuthForgotPasswordLazyRoute,
    AuthMagicLinkLazyRoute,
    AuthSigninLazyRoute,
    AuthSignupLazyRoute,
    AuthResetPasswordTokenLazyRoute,
  }),
})

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/_main",
        "/auth"
      ]
    },
    "/": {
      "filePath": "index.lazy.tsx"
    },
    "/_main": {
      "filePath": "_main.tsx",
      "children": [
        "/_main/me",
        "/_main/settings",
        "/_main/deck/$deckId/card",
        "/_main/deck/$deckId/study"
      ]
    },
    "/auth": {
      "filePath": "auth.tsx",
      "children": [
        "/auth/forgot-password",
        "/auth/magic-link",
        "/auth/signin",
        "/auth/signup",
        "/auth/reset-password/$token"
      ]
    },
    "/_main/me": {
      "filePath": "_main.me.lazy.tsx",
      "parent": "/_main"
    },
    "/_main/settings": {
      "filePath": "_main.settings.lazy.tsx",
      "parent": "/_main",
      "children": [
        "/_main/settings/account",
        "/_main/settings/profile"
      ]
    },
    "/auth/forgot-password": {
      "filePath": "auth.forgot-password.lazy.tsx",
      "parent": "/auth"
    },
    "/auth/magic-link": {
      "filePath": "auth.magic-link.lazy.tsx",
      "parent": "/auth"
    },
    "/auth/signin": {
      "filePath": "auth.signin.lazy.tsx",
      "parent": "/auth"
    },
    "/auth/signup": {
      "filePath": "auth.signup.lazy.tsx",
      "parent": "/auth"
    },
    "/_main/settings/account": {
      "filePath": "_main.settings.account.lazy.tsx",
      "parent": "/_main/settings"
    },
    "/_main/settings/profile": {
      "filePath": "_main.settings.profile.lazy.tsx",
      "parent": "/_main/settings"
    },
    "/auth/reset-password/$token": {
      "filePath": "auth.reset-password.$token.lazy.tsx",
      "parent": "/auth"
    },
    "/_main/deck/$deckId/card": {
      "filePath": "_main.deck.$deckId.card.lazy.tsx",
      "parent": "/_main"
    },
    "/_main/deck/$deckId/study": {
      "filePath": "_main.deck.$deckId.study.lazy.tsx",
      "parent": "/_main"
    }
  }
}
ROUTE_MANIFEST_END */
