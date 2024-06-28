import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { TypographyH3 } from '../components/ui/typography';
import { selectedCss, unselectedCss } from '../lib/constants';

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
            <Link
              className={unselectedCss}
              to="/home"
            >
              Go back
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
