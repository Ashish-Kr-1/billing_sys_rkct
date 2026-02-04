import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbarr';

export default function Layout() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Navbar />
            {/* 
          Add padding top to account for fixed navbar (h-16 = 4rem = 64px)
          Adding a bit more for spacing (pt-20)
      */}
            <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-8xl mx-auto">
                <Outlet />
            </main>
        </div>
    );
}
