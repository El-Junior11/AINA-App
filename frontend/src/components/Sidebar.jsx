import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  LayoutDashboard, Users, UserCircle, Share2, 
  ShieldCheck, GraduationCap, LogOut, Menu, Activity
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
    ...(userRole === 'admin' ? [{ icon: <Activity size={18} />, label: 'Actions utilisateurs', path: '/admin/notifications' }] : []),
  ];

  const handleLogout = () => {
    const isDark = document.documentElement.classList.contains('dark');

    Swal.fire({
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
        popup: 'rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-xl p-3',
        confirmButton: 'text-xs px-3 py-1.5 rounded-xl font-black',
        cancelButton: 'text-xs px-3 py-1.5 rounded-xl font-bold',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
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
            popup: 'rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-xl',
          }
        });

        setTimeout(() => {
          navigate('/Home'); 
        }, 1500);
      }
    });
  };

  return (
    <aside 
      className={`
        hidden md:flex flex-col p-3 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
        transition-all duration-300 ease-in-out shrink-0 relative
        ${isCollapsed ? 'w-16 items-center' : 'w-60'}
      `}
    >
      
      <div className={`w-full ${isCollapsed ? 'mb-2' : 'mb-3'}`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Ouvrir le menu" : "Réduire le menu"}
          className={`
            flex items-center gap-3 px-3 py-2 rounded-md transition-all w-full
            text-xs font-bold uppercase tracking-wider
            ${isCollapsed 
              ? 'justify-center px-0 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'}
          `}
        >
          <div className={`shrink-0 ${isCollapsed ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
            <Menu size={18} />
          </div>
          {!isCollapsed && <span className="truncate">Menu</span>}
        </button>
      </div>

      <nav className="flex-1 space-y-1 w-full">
        {menuItems.map((item, idx) => (
          <NavLink 
            key={idx}
            to={item.path}
            title={isCollapsed ? item.label : ''}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-semibold w-full
              ${isCollapsed ? 'justify-center px-0' : ''}
              ${isActive 
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {item.icon}
                </div>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 w-full">
        <button 
          onClick={handleLogout}
          title={isCollapsed ? 'Se déconnecter' : ''}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold text-rose-600 dark:text-rose-400 
            hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors
            ${isCollapsed ? 'justify-center px-0' : ''}
          `}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span className="truncate">Se déconnecter</span>}
        </button>

        {!isCollapsed && (
          <a 
            href="https://portfolio-elyse.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block pt-1 hover:opacity-80 transition-opacity text-center"
          >
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-tight truncate">
              Par Elysé RANDRIANANTENAINA
            </p>
          </a>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;