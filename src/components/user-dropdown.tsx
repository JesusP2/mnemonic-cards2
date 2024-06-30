import { Link } from '@tanstack/react-router';
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
}: { user: { username: string; } }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="w-8 h-8 rounded-full">
          <Avatar className="w-8 h-8">
            <AvatarImage
              className="w-8 h-8"
              src="https://pbs.twimg.com/profile_images/864164353771229187/Catw6Nmh_400x400.jpg"
              alt="User avatar"
            />
            <AvatarFallback>J</AvatarFallback>
          </Avatar>
          <FiChevronRight size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{user.username}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link to="/settings/profile">
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </Link>
        <form action="/api/auth/signout" method="post">
          <DropdownMenuItem asChild>
            <button className="w-full">
              Log out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
