import { createFileRoute, redirect } from '@tanstack/react-router'
import { Outlet } from '@tanstack/react-router';
import { queryClient } from '../lib/query-client';
import { profileQueryOptions } from '../lib/queries';

export const Route = createFileRoute('/auth')({
  component: AuthLayout,
  beforeLoad: async () => {
    const profile = await queryClient.fetchQuery(profileQueryOptions);
    if (profile) {
      throw redirect({ to: '/me' });
    }
  },
})

function AuthLayout() {
  return (
    <main className="grid place-items-center h-screen">
      <Outlet />
    </main>
  );
}
