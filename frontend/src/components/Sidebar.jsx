
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  LayoutDashboard, Users, UserCircle, Share2, ShieldCheck,
  GraduationCap, LogOut, Menu, Activity
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const savedUser = localStorage.getItem('user');
  const userRole = savedUser ? JSON.parse(savedUser).role?.toLowerCase() : 'user';

  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Tableau de bord', path: '/dashboard' },
    { icon: <Users size={18} />, label: 'Membres', path: '/membres' },
    { icon: <UserCircle size={18} />, label: 'Groupes de solidarité', path: '/groupes' },
    { icon: <Share2 size={18} />, label: 'Réseaux', path: '/reseaux' },
    { icon: <ShieldCheck size={18} />, label: 'Responsables', path: '/responsables' },
    { icon: <GraduationCap size={18} />, label: 'Formations', path: '/formations' },
    ...(userRole === 'admin'
      ? [{ icon: <Activity size={18} />, label: 'Actions utilisateurs', path: '/admin/notifications' }]
      : [])
  ];

  const handleLogout = async () => {
    const isDark = document.documentElement.classList.contains('dark');

    const result = await Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'question',
      title: 'Se déconnecter ?',
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#ffffff' : '#0f172a',
      customClass: {
        popup: 'rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold shadow-xl p-3',
        confirmButton: 'text-sm px-3 py-1.5 rounded-lg font-black cursor-pointer',
        cancelButton: 'text-sm px-3 py-1.5 rounded-lg font-bold cursor-pointer'
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
        popup: 'rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold shadow-xl'
      }
    });

    navigate('/Home');
  };

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 relative p-3 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out font-body ${
        isCollapsed ? 'w-16 items-center' : 'w-64'
      }`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
        .font-body{font-family:'DM Sans',sans-serif}
        .font-display{font-family:'Manrope',sans-serif}
      `}</style>

      <div className={`w-full ${isCollapsed ? 'mb-3' : 'mb-4'}`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
          className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
            isCollapsed
              ? 'justify-center px-0 bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30 text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400 hover:bg-emerald-50/70 dark:hover:bg-slate-800/70 hover:text-emerald-600 dark:hover:text-white'
          }`}
        >
          <Menu size={18} className="shrink-0" />
          {!isCollapsed && <span>Menu</span>}
        </button>
      </div>

      <nav className="flex-1 w-full space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={isCollapsed ? item.label : ''}
            className={({ isActive }) =>
              `relative flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                isCollapsed ? 'justify-center px-0' : ''
              } ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-50/50 dark:hover:bg-slate-800/60 hover:text-emerald-600 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !isCollapsed && (
                  <span className="absolute left-0 top-1/2 w-1 h-5 -translate-y-1/2 rounded-full bg-gradient-to-b from-emerald-500 to-sky-500" />
                )}

                <span
                  className={`shrink-0 ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {item.icon}
                </span>

                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="w-full pt-3 space-y-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Se déconnecter' : ''}
          className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span>Se déconnecter</span>}
        </button>

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
