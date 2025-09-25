import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-h-screen">
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}


