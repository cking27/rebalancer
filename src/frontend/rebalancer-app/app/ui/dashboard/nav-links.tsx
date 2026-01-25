'use client';

import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  BuildingLibraryIcon,
  ChartPieIcon,
  TagIcon,
  CubeIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'People', href: '/dashboard/people', icon: UserGroupIcon },
  { name: 'Institutions', href: '/dashboard/institutions', icon: BuildingLibraryIcon },
  { name: 'Accounts', href: '/dashboard/accounts', icon: DocumentDuplicateIcon },
  { name: 'Categories', href: '/dashboard/categories', icon: TagIcon },
  { name: 'Models', href: '/dashboard/models', icon: CubeIcon },
  { name: 'Compare', href: '/dashboard/compare', icon: ScaleIcon },
  { name: 'Allocation', href: '/dashboard/allocation', icon: ChartPieIcon },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3',
              {
                'bg-sky-100 text-blue-600': pathname === link.href || pathname?.startsWith(link.href + '/'),
              },
            )}
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
