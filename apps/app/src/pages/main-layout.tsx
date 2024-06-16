import { Outlet, useLocation } from '@tanstack/react-router';
import { Sidebar } from '../components/sidebar';

export default function Layout() {
  const location = useLocation();
  return (
    <div>
      <Sidebar pathname={location.pathname} user={{ username: 'Jesus' }} />
      <Outlet />
    </div>
  );
}
