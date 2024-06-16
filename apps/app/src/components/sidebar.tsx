import { buttonVariants } from '@repo/ui/button';
import { cn } from '@repo/ui/utils';
import { IoStatsChartOutline } from "react-icons/io5";
import { VscGroupByRefType } from 'react-icons/vsc';
import { MdAddCircleOutline } from "react-icons/md";
import { FiChevronDown } from 'react-icons/fi';
import { IoIosSearch } from 'react-icons/io';
import { GoGear } from 'react-icons/go';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@repo/ui/collapsible';
import { UserDropdown } from './user-dropdown';
import { SidebarLink } from './sidebar-link';
import { IoLogInOutline } from 'react-icons/io5';

export function Sidebar({
  pathname,
  user,
}: {
  pathname: string;
  user: { username?: string };
}) {
  return (
    <aside
      className={cn(
        'bg-white rounded-md delay-100 duration-200 h-screen overflow-hidden p-4 px-2 text-black flex flex-col justify-between group shadow-lg shadow-neutral-400 sidebar',
      )}
    >
      <div>
        <div className="flex justify-between items-start">
          <div className="flex gap-x-0">
            <span
              className={cn(
                'text-3xl font-bold text-left ml-3 mb-4 font-bungee',
              )}
            >
              M
            </span>
            <span
              className={cn(
                'text-3xl font-bold text-left w-full mb-4 whitespace-nowrap duration-200 sidebar-text delay-200 font-bungee',
              )}
            >
              cards
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-y-2">
          <Collapsible>
            <CollapsibleTrigger
              className={cn(
                buttonVariants({ variant: 'secondary' }),
                'justify-between w-full gap-x-3 bg-white font-normal px-3 hover:bg-zinc-100',
              )}
            >
              <span className="flex gap-x-3">
                <VscGroupByRefType
                  size={20}
                  className="min-w-[20px] min-h-[20px]"
                />
                <span className="sidebar-text delay-200">Decks</span>
              </span>
              <FiChevronDown
                size={18}
                className={cn('rotate-180 sidebar-text delay-200')}
              />
            </CollapsibleTrigger>
            <CollapsibleContent
              className={cn(
                'border-l-[2px] border-slate-200 pl-4 ml-[1.3rem] sidebar-text delay-200',
              )}
            >
              <SidebarLink pathname={pathname} href="/create-deck">
                <MdAddCircleOutline
                  size={20}
                  className="min-w-[20px]"
                />
                <span className="sidebar-text delay-200">Create new deck</span>
              </SidebarLink>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <div className="border-t border-dashed border-stone-300 mt-4 pt-4">
          <SidebarLink pathname="1" href="/organization/1/overview">
            <GoGear size={20} className="min-w-[20px]" />
            <span className="sidebar-text delay-200">Settings</span>
          </SidebarLink>
        </div>
      </div>
      {user?.username ? (
        <div className="border-t border-dashed border-stone-300 mt-4 pt-4 child">
          <UserDropdown />
        </div>
      ) : (
        <a
          href="/auth/signin"
          title="Log in"
          className={cn(
            buttonVariants({
              variant: 'secondary',
            }),
            'text-white',
          )}
        >
          <IoLogInOutline
            size={20}
            className="min-w-[20px] relative right-[2px]"
          />
        </a>
      )}
    </aside>
  );
}
