import { createFileRoute, redirect } from '@tanstack/react-router';
import { Outlet } from '@tanstack/react-router';
import { profileQueryOptions } from '../lib/queries';
import { queryClient } from '../lib/query-client';

export const Route = createFileRoute('/auth')({
  component: AuthLayout,
  beforeLoad: async () => {
    const profile = await queryClient.ensureQueryData(profileQueryOptions);
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
