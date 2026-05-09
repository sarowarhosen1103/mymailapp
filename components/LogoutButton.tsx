'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Failed to logout', error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
      ) : (
        <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
      )}
      Sign out
    </button>
  );
}
