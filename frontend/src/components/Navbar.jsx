import React from 'react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50">
      <nav className="mx-auto mt-4 w-[min(1100px,96%)] rounded-2xl px-5 py-3 flex items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[conic-gradient(from_90deg,#00ffe0,#7c3aed,#00d4ff,#00ffe0)]" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            <span className="bg-clip-text text-transparent bg-[linear-gradient(90deg,#00ffe0,#7c3aed)]">NeonWave</span>
            <span className="text-white/70 ml-1 hidden sm:inline">Music</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="hidden sm:inline text-white/80 hover:text-white transition-colors">Home</a>
          <a href="/upload" className="hidden sm:inline text-white/80 hover:text-white transition-colors">Upload</a>
          <a href="http://localhost:5000/auth/google">
            <button className="relative overflow-hidden rounded-lg px-4 py-2 font-medium text-white shadow bg-[linear-gradient(90deg,#00ffe0,#7c3aed,#00d4ff)] bg-[length:200%_200%] animate-[shimmer_4s_linear_infinite] [text-shadow:0_0_8px_rgba(0,255,224,0.35)]">
              Login
            </button>
          </a>
        </div>
      </nav>
    </header>
  );
}
