import React from 'react';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-black/40 backdrop-blur border-b border-white/10">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="text-lg text-white/70">Welcome back</div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="px-3 py-1.5 rounded-md text-sm bg-white/10 hover:bg-white/20"
          >Home</a>
          <a
            href="/auth/logout"
            className="px-3 py-1.5 rounded-md text-sm bg-red-500/80 hover:bg-red-500"
          >Logout</a>
        </div>
      </div>
    </header>
  );
}


