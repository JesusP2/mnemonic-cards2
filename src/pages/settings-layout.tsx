import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { TypographyH3 } from '../components/ui/typography';

const selectedCss = "inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 px-4 py-2 bg-muted hover:bg-muted justify-start"
const unselectedCss = "inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 px-4 py-2 hover:bg-transparent hover:underline justify-start"
export default function Settings() {
  const location = useLocation()
  return (
    <>
      <TypographyH3>Settings</TypographyH3>
      <p className="text-muted-foreground mt-2">Manage your account settings</p>
      <div
        data-orientation="horizontal"
        className="shrink-0 bg-border h-[1px] w-full my-6"
      />
      <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-12">
        <aside className="-mx-4 md:w-1/5">
          <nav className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1">
            <Link
              className={location.pathname === "/settings/profile" ? selectedCss : unselectedCss}
              to="/settings/profile"
            >
              Profile
            </Link>
            <Link
              className={location.pathname === "/settings/account" ? selectedCss : unselectedCss}
              to="/settings/account"
            >
              Account
            </Link>
          </nav>
        </aside>
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </>
  );
}
