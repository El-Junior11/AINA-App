import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Bell, Moon, Sun, HelpCircle } from 'lucide-react';
import logoOng from '../assets/logo.png';

const Navbar = ({ darkMode, setDarkMode }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourDegrees = ((hours % 12) * 30) + (minutes * 0.5);
  const minuteDegrees = (minutes * 6) + (seconds * 0.1);
  const secondDegrees = seconds * 6;

  const savedUser = localStorage.getItem('user');
  const userObj = savedUser ? JSON.parse(savedUser) : null;
  const userName = userObj?.name || "Utilisateur";
  const userRole = (userObj?.role || "user").trim().toLowerCase();

  const userInitial = userName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || "U";

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
      
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full border-2 border-blue-600 p-0.5 overflow-hidden bg-white shrink-0 flex items-center justify-center shadow-sm">
          <img 
            src={logoOng} 
            alt="Logo Tsinjo Aina"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-xs font-bold text-black dark:text-white tracking-tight">
            ONG TSINJO AINA
          </span>
          <span className="text-[10px] font-medium text-blue-600 dark:text-slate-400 mt-0.5">
            Fianarantsoa
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        
        <div 
          className="relative w-[22px] h-[22px] rounded-full border-2 border-black dark:border-white mr-1 flex items-center justify-center bg-white dark:bg-slate-800 shadow-inner"
          title={`Heure : ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`}
        >
          <div 
            className="absolute bottom-1/2 left-1/2 w-0.5 h-1.5 bg-black dark:bg-white origin-bottom rounded-full"
            style={{ transform: `translateX(-50%) rotate(${hourDegrees}deg)` }}
          />
          <div 
            className="absolute bottom-1/2 left-1/2 w-0.5 h-2 bg-blue-600 dark:bg-slate-300 origin-bottom rounded-full"
            style={{ transform: `translateX(-50%) rotate(${minuteDegrees}deg)` }}
          />
          <div 
            className="absolute bottom-1/2 left-1/2 w-[1px] h-2 bg-rose-500 origin-bottom"
            style={{ transform: `translateX(-50%) rotate(${secondDegrees}deg)` }}
          />
          <div className="absolute w-0.5 h-0.5 bg-black dark:bg-white rounded-full"></div>
        </div>

        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-black dark:text-white transition-colors"
          title={darkMode ? "Activer le mode clair" : "Activer le mode sombre"}
        >
          {darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-black" />}
        </button>

        <Link 
          to="/notifications" 
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-black dark:text-white group transition-colors"
          title="Notifications"
        >
          <HelpCircle size={20} className="group-hover:scale-105 transition-transform" />
        </Link>

        <Link 
          to="/settings" 
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-black dark:text-white group transition-colors"
          title="Paramètres du compte"
        >
          <Settings size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        </Link>

        {userRole === 'admin' && (
          <Link 
            to="/admin/approvals" 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-black dark:text-white relative group transition-colors"
            title="Approbation des inscriptions"
          >
            <Bell size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900"></span>
          </Link>
        )}

        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm border border-blue-400 dark:border-slate-700">
            {userInitial}
          </div>
          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-xs font-semibold text-black dark:text-white">
              {userName}
            </span>
            <span className="text-[10px] font-medium text-blue-600 dark:text-slate-400 capitalize mt-0.5">
              {userRole}
            </span>
          </div>
        </div>
      
      </div>
    </header>
  );
};

export default Navbar;