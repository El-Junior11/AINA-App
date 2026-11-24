import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Moon, Sun, HelpCircle, Menu, X, ChevronDown, UserRound, LogOut, Mail, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import axios from '../api/axios';
import logoOng from '../assets/logo.png';

const Tooltip = ({ children }) => (
  <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity z-50 bg-white text-slate-800 border border-slate-200 shadow-md dark:bg-slate-900 dark:text-white dark:border-slate-800">
    {children}
  </span>
);

const Navbar = ({ darkMode, setDarkMode, mobileOpen, setMobileOpen }) => {
  const { user, isAdmin, logout } = useContext(AuthContext);
  const [time, setTime] = useState(new Date());
  const [pendingCount, setPendingCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const profileButtonRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  useEffect(() => {
    if (!profileOpen) return;
    const handleOutside = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    const handleEscape = e => {
      if (e.key === 'Escape') {
        setProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [profileOpen]);

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname, mobileOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
    const result = await Swal.fire({
      toast: true, position: 'top-end', icon: 'question',
      title: 'Se déconnecter ?',
      showConfirmButton: true, showCancelButton: true,
      confirmButtonText: 'Oui', cancelButtonText: 'Non',
      confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b',
      background: darkMode ? '#0f172a' : '#ffffff',
      color: darkMode ? '#ffffff' : '#0f172a',
      customClass: {
        popup: 'rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium shadow-xl',
        confirmButton: 'text-xs px-3 py-1.5 rounded-lg font-semibold',
        cancelButton: 'text-xs px-3 py-1.5 rounded-lg font-semibold'
      }
    });
    if (!result.isConfirmed) return;
    logout();
    navigate('/', { replace: true });
    await Swal.fire({
      toast: true, position: 'top-end', icon: 'success',
      title: 'Déconnexion réussie',
      showConfirmButton: false, timer: 1500, timerProgressBar: true,
      background: darkMode ? '#0f172a' : '#ffffff',
      color: darkMode ? '#ffffff' : '#0f172a'
    });
  };

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const hourDegrees = (hours % 12) * 30 + minutes * 0.5;
  const minuteDegrees = minutes * 6 + seconds * 0.1;
  const secondDegrees = seconds * 6;
  const userName = user?.name || 'Utilisateur';
  const userEmail = user?.email || '';
  const userInitial = userName.split(' ').filter(Boolean).map(name => name[0]).join('').toUpperCase().substring(0, 2) || 'U';
  const communeName = user?.nom_commune || user?.commune?.nom_commune || null;
  const roleLabel = isAdmin ? 'Administrateur' : 'SO';

  const actionClass = 'relative group shrink-0 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-[#176B46] hover:bg-emerald-50 dark:hover:bg-slate-800 dark:hover:text-emerald-400 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40';

  return (
    <header className="relative z-50 flex h-16 shrink-0 items-center justify-between gap-2 px-2 sm:px-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-body">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={mobileOpen} aria-controls="aina-sidebar" className={`${actionClass} lg:hidden`}>
          {mobileOpen ? <X size={22}/> : <Menu size={22}/>}
        </button>

        <div className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full bg-white flex items-center justify-center ring-1 ring-emerald-100 overflow-hidden p-0.5">
          <img src={logoOng} alt="Logo Tsinjo Aina" className="h-full w-full object-contain rounded-full"/>
        </div>

        <div className="hidden sm:flex flex-col leading-tight min-w-0">
          <span className="font-display text-[15px] font-bold text-[#103F30] dark:text-white truncate">ONG TSINJO AINA</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Fianarantsoa</span>
        </div>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
        {/* Horloge */}
        <div className="relative group w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 mr-2 hidden md:flex items-center justify-center bg-white dark:bg-slate-800">
          <div className="absolute bottom-1/2 left-1/2 w-0.5 h-2 bg-slate-700 dark:bg-white origin-bottom rounded-full" style={{ transform: `translateX(-50%) rotate(${hourDegrees}deg)` }}/>
          <div className="absolute bottom-1/2 left-1/2 w-0.5 h-3 bg-[#176B46] dark:bg-emerald-400 origin-bottom rounded-full" style={{ transform: `translateX(-50%) rotate(${minuteDegrees}deg)` }}/>
          <div className="absolute bottom-1/2 left-1/2 w-px h-3 bg-sky-500 origin-bottom" style={{ transform: `translateX(-50%) rotate(${secondDegrees}deg)` }}/>
          <div className="absolute w-1 h-1 bg-slate-800 dark:bg-white rounded-full"/>
          <Tooltip>{`Heure : ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`}</Tooltip>
        </div>

        {/* Mode clair / sombre */}
        <button type="button" onClick={() => setDarkMode(!darkMode)} aria-label={darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'} className={actionClass}>
          {darkMode ? <Sun size={19} className="text-amber-400"/> : <Moon size={19}/>}
          <Tooltip>{darkMode ? 'Mode clair' : 'Mode sombre'}</Tooltip>
        </button>

        {/* Aide */}
        <Link to="/notifications" aria-label="Aide" className={actionClass}>
          <HelpCircle size={19}/>
          <Tooltip>Aide</Tooltip>
        </Link>

        {/* Notifications administrateur */}
        {isAdmin && (
          <Link to="/admin/approvals" aria-label="Approbation des inscriptions" className={actionClass}>
            <Bell size={19}/>
            {pendingCount > 0 && (
              <span className="absolute top-0 right-0 min-w-4 h-4 px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full ring-2 ring-white dark:ring-slate-900">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
            <Tooltip>{pendingCount > 0 ? `${pendingCount} inscription(s) en attente` : 'Aucune inscription en attente'}</Tooltip>
          </Link>
        )}

        {/* Profil utilisateur */}
        <div ref={profileRef} className="relative ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
          <button ref={profileButtonRef} type="button" onClick={() => setProfileOpen(prev => !prev)}
            aria-label="Menu du profil" aria-expanded={profileOpen} aria-controls="profile-dropdown"
            className={`flex items-center gap-2 sm:gap-2.5 rounded-lg p-1.5 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 ${profileOpen ? 'bg-emerald-50 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#176B46] text-white font-semibold text-xs flex items-center justify-center shrink-0">
              {userInitial}
            </div>

            <div className="hidden md:flex flex-col text-left leading-tight min-w-0">
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">{userName}</span>
              <span className={`text-[11px] font-medium ${isAdmin ? 'text-sky-600 dark:text-sky-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{roleLabel}</span>
              {!isAdmin && communeName && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{communeName}</span>
              )}
            </div>

            <ChevronDown size={15} className={`text-slate-400 shrink-0 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}/>
          </button>

          {/* Menu déroulant du profil */}
          {profileOpen && (
            <div id="profile-dropdown" className="absolute right-0 top-full mt-3 w-64 max-w-[calc(100vw-24px)] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-[0_8px_30px_rgba(15,23,42,0.12)] z-[70] overflow-hidden">

              {/* Informations utilisateur */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-[#176B46] text-white flex items-center justify-center font-semibold text-sm shrink-0">
                    {userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{userName}</p>
                    <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${isAdmin ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'}`}>
                      {roleLabel}
                    </span>
                  </div>
                </div>

                {userEmail && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
                    <Mail size={14} className="shrink-0"/>
                    <span className="truncate" title={userEmail}>{userEmail}</span>
                  </div>
                )}

                {!isAdmin && communeName && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin size={14} className="shrink-0 text-emerald-600"/>
                    <span className="truncate">{communeName}</span>
                  </div>
                )}
              </div>

              {/* Mon compte */}
              <div className="p-1.5">
                <Link to="/settings" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-[#176B46] dark:hover:bg-slate-800 dark:hover:text-emerald-400 transition-colors">
                  <UserRound size={17} strokeWidth={1.8}/>
                  <span>Mon compte</span>
                </Link>
              </div>

              {/* Déconnexion */}
              <div className="p-1.5 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors">
                  <LogOut size={17} strokeWidth={1.8}/>
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;