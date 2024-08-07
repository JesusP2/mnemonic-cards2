import { createFileRoute, redirect } from '@tanstack/react-router';
import { Outlet } from '@tanstack/react-router';
import { profileQueryOptions } from '../lib/queries';
import { queryClient } from '../lib/query-client';

export const Route = createFileRoute('/auth')({
  component: AuthLayout,
  beforeLoad: async () => {
    // artificial delay to avoid race condition.
    // queryClient doesnt hydrate from localStorage fast enough causing the profileQueryOptions to fire.
    await new Promise(resolve => setTimeout(resolve, 1))
    const profile = await queryClient.fetchQuery(profileQueryOptions);
    if (profile) {
      throw redirect({ to: '/me' });
    }
  },
});

function AuthLayout() {
  return (
    <main className="grid place-items-center h-screen">
      <Outlet />
    </main>
  );
}
