import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const AdminLayout = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className="aina-admin flex h-screen h-[100dvh] flex-col bg-[#F8FAFC] dark:bg-slate-950 overflow-hidden font-body antialiased transition-colors duration-300">

      <Navbar darkMode={darkMode} setDarkMode={setDarkMode}
        mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>

      <div className="relative flex flex-1 min-h-0 min-w-0 overflow-hidden">

        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}
          mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>

        <main className="flex flex-1 flex-col min-w-0 min-h-0 bg-[#F8FAFC] dark:bg-slate-950 overflow-hidden transition-colors duration-300">
          <div className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
            <Outlet/>
          </div>

          <div className="shrink-0 min-w-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <Footer/>
          </div>
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;