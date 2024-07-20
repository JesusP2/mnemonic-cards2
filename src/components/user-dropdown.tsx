import { Link } from '@tanstack/react-router';
import { Home, LogOut, Settings } from 'lucide-react';
import { FiChevronRight } from 'react-icons/fi';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function UserDropdown({
  user,
}: {
  user: { username: string; email: string | null; avatar: string | null };
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="w-8 h-8 rounded-full">
          <Avatar className="w-8 h-8">
            {user.avatar && (
              <AvatarImage
                className="w-8 h-8"
                src={user.avatar}
                alt="User avatar"
              />
            )}
            <AvatarFallback>{user.username.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <FiChevronRight size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{user.username}</DropdownMenuLabel>
        <p className="text-muted-foreground text-xs px-2">{user.email}</p>
        <DropdownMenuSeparator />
        <Link to="/home">
          <DropdownMenuItem className="flex gap-x-2">
            <Home size={15} />
            Home
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </Link>
        <Link to="/settings/profile">
          <DropdownMenuItem className="flex gap-x-2">
            <Settings size={15} />
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </Link>
        <form action="/api/auth/signout" method="post">
          <DropdownMenuItem asChild>
            <button className="w-full flex gap-x-2">
              <LogOut size={15} />
              Log out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
