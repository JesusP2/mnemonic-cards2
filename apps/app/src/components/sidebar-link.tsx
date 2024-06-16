import { cn } from '@repo/ui/utils';
import { buttonVariants } from '@repo/ui/button';
import { forwardRef } from 'react';
import { Link } from '@tanstack/react-router';

export const SidebarLink = forwardRef<
  HTMLAnchorElement,
  { href: string; children: React.ReactNode; pathname: string }
>(({ href, children, pathname }, ref) => {
  const isActive = pathname === href;
  const className = isActive
    ? 'justify-start w-full gap-x-3 px-3'
    : 'justify-start w-full gap-x-3 bg-white font-normal px-3';
  return (
    <Link
      to={href}
      ref={ref}
      className={cn(
        buttonVariants({ variant: isActive ? 'default' : 'secondary' }),
        'hover:bg-zinc-100',
        className,
      )}
    >
      {children}
    </Link>
  );
});

SidebarLink.displayName = 'SidebarLink';
