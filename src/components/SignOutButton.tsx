'use client';

import { useAuth } from '@/lib/hooks/useAuth';

export default function SignOutButton() {
  const { signOut } = useAuth();

  return (
    <button
      onClick={signOut}
      className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
    >
      Sign Out
    </button>
  );
} 