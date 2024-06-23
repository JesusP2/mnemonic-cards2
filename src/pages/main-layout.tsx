import { Outlet } from '@tanstack/react-router';
import { ThemeSwitch } from '../components/theme-switch';
import { UserDropdown } from '../components/user-dropdown';

export default function Layout() {
  return (
    <>
      <nav className="h-12 w-full flex items-center">
        <ThemeSwitch />
        <UserDropdown
          user={{ username: 'lotus', email: 'jesusperez@gmail.com' }}
        />
      </nav>
      <main className="bg-zinc-100">
        <Outlet />
      </main>
    </>
  );
}
