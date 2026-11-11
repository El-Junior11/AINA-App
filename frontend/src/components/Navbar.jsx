import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Bell, Moon, Sun, HelpCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import axios from '../api/axios';
import logoOng from '../assets/logo.png';

const Tooltip = ({ children }) => (
  <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 z-50 bg-white text-slate-800 border border-slate-200 shadow-md dark:bg-slate-900 dark:text-white dark:border-slate-800">
    {children}
  </span>
);

const Navbar = ({ darkMode, setDarkMode }) => {
  const { user, isAdmin } = useContext(AuthContext);
  const [time, setTime] = useState(new Date());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setPendingCount(0);
      return;
    }

    let active = true;

    const fetchPendingUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get('/auth/admin/pending-users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data;
        const users = Array.isArray(data) ? data : data.users || data.pendingUsers || [];
        if (active) setPendingCount(users.length);
      } catch (error) {
        console.error('Erreur de chargement des inscriptions :', error);
      }
    };

    fetchPendingUsers();
    const interval = setInterval(fetchPendingUsers, 60000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isAdmin]);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const hourDegrees = (hours % 12) * 30 + minutes * 0.5;
  const minuteDegrees = minutes * 6 + seconds * 0.1;
  const secondDegrees = seconds * 6;

  const userName = user?.name || 'Utilisateur';
  const userRole = user?.role?.trim().toLowerCase() || 'user';
  const userInitial = userName.split(' ').filter(Boolean).map(name => name[0]).join('').toUpperCase().substring(0, 2) || 'U';
  const communeName = user?.nom_commune || user?.commune?.nom_commune || null;
  const roleLabel = isAdmin ? 'Administrateur' : 'SO';

  const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900';

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors font-body">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
        .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
      `}</style>

      <div className="flex items-center gap-3.5 min-w-0">
        <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60 overflow-hidden p-0.5">
          <img src={logoOng} alt="Logo Tsinjo Aina" className="h-full w-full object-cover rounded-full" />
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-sm font-display font-semibold text-slate-900 dark:text-white tracking-tight truncate">ONG TSINJO AINA</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Fianarantsoa</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="relative group w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 mr-1 hidden sm:flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm">
          <div className="absolute bottom-1/2 left-1/2 w-0.5 h-1.5 bg-slate-700 dark:bg-slate-200 origin-bottom rounded-full" style={{ transform: `translateX(-50%) rotate(${hourDegrees}deg)` }} />
          <div className="absolute bottom-1/2 left-1/2 w-0.5 h-2.5 bg-emerald-700 dark:bg-emerald-400 origin-bottom rounded-full" style={{ transform: `translateX(-50%) rotate(${minuteDegrees}deg)` }} />
          <div className="absolute bottom-1/2 left-1/2 w-[1px] h-2.5 bg-sky-500 origin-bottom" style={{ transform: `translateX(-50%) rotate(${secondDegrees}deg)` }} />
          <div className="absolute w-1 h-1 bg-slate-800 dark:bg-white rounded-full" />
          <Tooltip>{`Heure : ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`}</Tooltip>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          aria-label={darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
          className={`relative group p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
        >
          {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          <Tooltip>{darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}</Tooltip>
        </button>

        <Link
          to="/notifications"
          aria-label="Aide"
          className={`relative group p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
        >
          <HelpCircle size={18} />
          <Tooltip>Aide</Tooltip>
        </Link>

        <Link
          to="/settings"
          aria-label="Paramètres du compte"
          className={`relative group p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
        >
          <Settings size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <Tooltip>Paramètres du compte</Tooltip>
        </Link>

        {isAdmin && (
          <Link
            to="/admin/approvals"
            aria-label="Approbation des inscriptions"
            className={`relative group p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
          >
            <Bell size={18} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full ring-2 ring-white dark:ring-slate-900">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
            <Tooltip>{pendingCount > 0 ? `${pendingCount} inscription(s) en attente` : 'Aucune inscription en attente'}</Tooltip>
          </Link>
        )}

        <div className="flex items-center gap-3 ml-2 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60 shrink-0">
            {userInitial}
          </div>
          <div className="hidden sm:flex flex-col leading-none min-w-0">
            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">{userName}</span>
            <span className={`text-[11px] font-medium mt-1 ${isAdmin ? 'text-sky-600 dark:text-sky-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{roleLabel}</span>
            {!isAdmin && communeName && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px] mt-1">{communeName}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;