import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { Link, Outlet } from '@tanstack/react-router';
import { ModeToggle } from '../components/theme-switch';
import { UserDropdown } from '../components/user-dropdown';
import { profileQueryOptions } from '../lib/queries';
import { queryClient } from '../lib/query-client';

export const Route = createFileRoute('/_main')({
  component: Layout,
  beforeLoad: async () => {
    const profile = await queryClient.fetchQuery(profileQueryOptions);
    if (!profile) {
      throw redirect({ to: '/auth/signin' });
    }
  },
})


function Layout() {
  const profile = useQuery(profileQueryOptions);
  return (
    <>
      <nav className="h-12 w-full">
        <div className="flex items-center justify-between gap-x-4 max-w-7xl h-12 mx-auto px-6">
          <Link to="/me">
            <img src="/vite.svg" alt="icon" />
          </Link>
          <div className="flex items-center gap-6">
            <ModeToggle />
            {profile.isLoading || !profile.data ? null : (
              <UserDropdown
                user={{
                  username: profile.data.username,
                  email: profile.data.email,
                  avatar: profile.data.avatar,
                }}
              />
            )}
          </div>
        </div>
      </nav>
      <div
        data-orientation="horizontal"
        className="shrink-0 bg-border h-[1px]"
      />
      <main className="max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </>
  );
}
