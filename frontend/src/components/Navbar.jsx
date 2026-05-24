import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Menu, 
  Settings, 
  Bell, 
  Moon, 
  Sun 
} from 'lucide-react';

const Navbar = ({ darkMode, setDarkMode }) => {
  // Fakana ny mombamomba ny mpampiasa avy amin'ny localStorage
  // Rehefa login dia tokony hotehirizinao ao ny 'user_name' sy 'user_role'
  const userName = localStorage.getItem('user_name') || "Utilisateur";
  const userRole = localStorage.getItem('user_role') || "user";
  
  // Fakana ny litera voalohany amin'ny anarana (ohatra: Santana Velice -> SV)
  const userInitial = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <header className="h-16 flex items-center justify-between px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
      
      {/* --- ANKAVIA: Logo sy Anarana --- */}
      <div className="flex items-center gap-3 min-w-[280px]">
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <Menu size={22} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200 dark:shadow-none italic">
            O
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg text-slate-800 dark:text-white font-bold tracking-tight uppercase">
              ONG TSINJO AINA
            </span>
            <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase mt-0.5">
              Fianarantsoa
            </span>
          </div>
        </div>
      </div>

      {/* --- ANKAVANANA: Icons sy User --- */}
      <div className="flex items-center gap-1 sm:gap-2">
        
        {/* Mode Sombre Toggle */}
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-all active:scale-90"
          title="Mode Sombre/Clair"
        >
          {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
        </button>

        {/* Pejy Notifications */}
        <Link 
          to="/notifications" 
          className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 relative group"
        >
          <Bell size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </Link>

        {/* Pejy Paramètres */}
        <Link 
          to="/settings" 
          className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 group"
        >
          <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
        </Link>

        {/* User Profile (Dynamic araka ny Database) */}
        <Link 
          to="/profile"
          className="ml-2 flex items-center gap-3 p-1 pr-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md border-2 border-white dark:border-slate-700">
            {userInitial}
          </div>
          <div className="hidden lg:flex flex-col items-start leading-none">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {userName}
            </span>
            <span className="text-[10px] font-medium text-slate-400 capitalize">
              {userRole}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;