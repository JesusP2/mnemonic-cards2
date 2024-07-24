import { Outlet } from '@tanstack/react-router';

export default function AuthLayout() {
  return (
    <main className="grid place-items-center h-screen">
      <Outlet />
    </main>
  );
}
