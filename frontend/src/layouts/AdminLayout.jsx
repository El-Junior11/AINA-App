import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const AdminLayout = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 rounded-tl-2xl border-t border-l border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden">
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <Outlet />
          </div>
          
          <div className="flex-none shadow-2xl">
            <Footer />
          </div>

        </main>
      </div>
    </div>
  );
};

export default AdminLayout;