'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  Home,
  Mail,
  LayoutTemplate,
  Server,
  Users,
  Settings,
  Mailbox
} from 'lucide-react';
import LogoutButton from './LogoutButton';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: Mail },
  { name: 'Templates', href: '/dashboard/templates', icon: LayoutTemplate },
  { name: 'SMTP Accounts', href: '/dashboard/smtp', icon: Server },
  { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-950 px-6 ring-1 ring-white/10">
      <div className="flex h-16 shrink-0 items-center gap-2 mt-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
          <Mailbox className="h-5 w-5 text-indigo-500" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">MailDash</span>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={clsx(
                        isActive
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                      )}
                    >
                      <item.icon
                        className={clsx(
                          isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
          <li className="mt-auto -mx-2 mb-6">
            <LogoutButton />
          </li>
        </ul>
      </nav>
    </div>
  );
}
