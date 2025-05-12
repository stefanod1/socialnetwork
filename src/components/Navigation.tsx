'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, UserIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/"
            className={`flex flex-col items-center space-y-1 ${
              isActive('/') ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <HomeIcon className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </Link>

          <Link
            href="/profile"
            className={`flex flex-col items-center space-y-1 ${
              isActive('/profile') ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <UserIcon className="h-6 w-6" />
            <span className="text-xs">Profile</span>
          </Link>

          <Link
            href="/create"
            className={`flex flex-col items-center space-y-1 ${
              isActive('/create') ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <PlusCircleIcon className="h-6 w-6" />
            <span className="text-xs">Create</span>
          </Link>
        </div>
      </div>
    </nav>
  );
} 