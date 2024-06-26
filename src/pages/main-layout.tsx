import { Outlet } from '@tanstack/react-router';
import { ModeToggle } from '../components/theme-switch';
import { UserDropdown } from '../components/user-dropdown';

export default function Layout() {
  return (
    <>
      <nav className="h-12 w-full bg-secondary">
        <div className="flex items-center justify-end gap-x-4 max-w-7xl h-12 mx-auto px-6">
          <ModeToggle />
          <UserDropdown
            user={{ username: 'lotus', email: 'jesusperez@gmail.com' }}
          />
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </>
  );
}
