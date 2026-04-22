import React from 'react';
import { 
  Menu, 
  Search, 
  Settings, 
  Bell, 
  Moon, 
  Sun, 
  Grid 
} from 'lucide-react';

const Navbar = ({ darkMode, setDarkMode }) => {
  return (
    <header className="h-16 flex items-center justify-between px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
      
      {/* --- ANKAVIA: Logo sy Anarana --- */}
      <div className="flex items-center gap-3 min-w-[280px]">
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <Menu size={22} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div className="flex items-center gap-2">
          {/* Icon Logo kely */}
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200 dark:shadow-none italic">
            T
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg text-slate-800 dark:text-white font-bold tracking-tight">
             ONG TSINJO AINA FIANARANTSOA
            </span>

          </div>
        </div>
      </div>



      {/* --- ANKAVANANA: Icons sy User --- */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Dark Mode Toggle */}
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-all active:scale-90"
          title="Mode Sombre/Clair"
        >
          {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 relative">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

        {/* Paramètres */}
        <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
          <Settings size={20} />
        </button>

        {/* User Connecté Profile */}
        <div className="ml-2 flex items-center gap-2 p-1 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
            AD
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 hidden lg:block">
            Admin
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;