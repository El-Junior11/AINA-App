import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  LayoutDashboard, Users, UserCircle, Share2, ShieldCheck,
  GraduationCap, LogOut, Menu, Activity
} from 'lucide-react';

const Tooltip = ({ children }) => (
  <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 z-50 bg-white text-slate-800 border border-slate-200 shadow-md dark:bg-slate-900 dark:text-white dark:border-slate-800">
    {children}
  </span>
);

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const savedUser = localStorage.getItem('user');
  const userRole = savedUser ? JSON.parse(savedUser).role?.toLowerCase() : 'user';

  const menuItems = [
    { icon: <LayoutDashboard size={18} strokeWidth={2} />, label: 'Tableau de bord', path: '/dashboard' },
    { icon: <Users size={18} strokeWidth={2} />, label: 'Membres', path: '/membres' },
    { icon: <UserCircle size={18} strokeWidth={2} />, label: 'Groupes de solidarité', path: '/groupes' },
    { icon: <Share2 size={18} strokeWidth={2} />, label: 'Réseaux', path: '/reseaux' },
    { icon: <ShieldCheck size={18} strokeWidth={2} />, label: 'Responsables', path: '/responsables' },
    { icon: <GraduationCap size={18} strokeWidth={2} />, label: 'Formations', path: '/formations' },
    ...(userRole === 'admin'
      ? [{ icon: <Activity size={18} strokeWidth={2} />, label: 'Actions utilisateurs', path: '/admin/notifications' }]
      : [])
  ];

  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900';

  const handleLogout = async () => {
    const isDark = document.documentElement.classList.contains('dark');

    const result = await Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'question',
      title: 'Se déconnecter ?',
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#ffffff' : '#0f172a',
      customClass: {
        popup: 'rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium shadow-xl p-3',
        confirmButton: 'text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer',
        cancelButton: 'text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer'
      }
    });

    if (!result.isConfirmed) return;

    await Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Déconnexion réussie',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#ffffff' : '#0f172a',
      customClass: {
        popup: 'rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium shadow-xl'
      }
    });

    navigate('/Home');
  };

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 relative p-3 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out font-body ${
        isCollapsed ? 'w-16 items-center' : 'w-64'
      }`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
        .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
      `}</style>

      {/* Bouton de réduction / ouverture du menu */}
      <div className={`relative group w-full ${isCollapsed ? 'mb-2.5' : 'mb-3'}`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
          className={`flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-semibold transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 ${
            isCollapsed ? 'justify-center px-0' : ''
          } ${focusRing}`}
        >
          <Menu size={18} className="shrink-0 text-slate-500 dark:text-slate-400" />
          {!isCollapsed && <span className="truncate">Menu</span>}
        </button>
        {isCollapsed && <Tooltip>Ouvrir le menu</Tooltip>}
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 w-full space-y-1">
        {menuItems.map((item) => (
          <div key={item.path} className="relative group w-full">
            <NavLink
              to={item.path}
              aria-label={item.label}
              className={({ isActive }) =>
                `relative flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isCollapsed ? 'justify-center px-0' : ''
                } ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                } ${focusRing}`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`shrink-0 ${
                      isActive
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {item.icon}
                  </span>

                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
            {isCollapsed && <Tooltip>{item.label}</Tooltip>}
          </div>
        ))}
      </nav>

      {/* Pied de sidebar (Déconnexion et signature) */}
      <div className="w-full pt-3 space-y-2 border-t border-slate-200 dark:border-slate-800">
        <div className="relative group w-full">
          <button
            onClick={handleLogout}
            aria-label="Se déconnecter"
            className={`flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            } ${focusRing}`}
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span className="truncate">Se déconnecter</span>}
          </button>
          {isCollapsed && <Tooltip>Se déconnecter</Tooltip>}
        </div>

        {!isCollapsed && (
          <a
            href="https://portfolio-elyse.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="block pt-1 text-center hover:opacity-80 transition-opacity"
          >
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-tight truncate">
              Par Elysé RANDRIANANTENAINA
            </p>
          </a>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;