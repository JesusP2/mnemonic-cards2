import { Link, Outlet } from '@tanstack/react-router';
import { ModeToggle } from '../components/theme-switch';
import { UserDropdown } from '../components/user-dropdown';

export default function Layout() {
  return (
    <>
      <nav className="h-12 w-full">
        <div className="flex items-center justify-between gap-x-4 max-w-7xl h-12 mx-auto px-6">
          <Link to="/home">
            <img src="/vite.svg" alt="icon" />
          </Link>
          <div className="flex items-center gap-6">
            <ModeToggle />
            <UserDropdown
              user={{ username: 'lotus', email: 'jesusperez@gmail.com' }}
            />
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
