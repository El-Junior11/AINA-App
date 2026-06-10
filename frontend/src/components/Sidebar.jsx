import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  LayoutDashboard, Users, UserCircle, Share2, 
  ShieldCheck, GraduationCap, Plus, LogOut 
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Tableau de bord', path: '/dashboard' },
    { icon: <Users size={20} />, label: 'Membres', path: '/membres' },
    { icon: <UserCircle size={20} />, label: 'Groupes Solidarités', path: '/groupes' },
    { icon: <Share2 size={20} />, label: 'Réseaux', path: '/reseaux' },
    { icon: <ShieldCheck size={20} />, label: 'Responsables', path: '/responsables' },
    { icon: <GraduationCap size={20} />, label: 'Formations', path: '/formations' },
  ];

  const handleLogout = () => {
    const isDark = document.documentElement.classList.contains('dark');

    Swal.fire({
      title: 'Êtes-vous se déconnecter ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00bcd4',
      cancelButtonColor: '#6e7881',
      confirmButtonText: 'OK',
      cancelButtonText: 'Annuler',
      toast: true,
      position: 'top-end',
      background: isDark ? '#0f172a' : '#ffffff',
      customClass: {
        popup: `rounded-2xl shadow-2xl border ${isDark ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-800'}`,
        title: isDark ? '!text-white' : '!text-slate-800',
        htmlContainer: isDark ? '!text-slate-300' : '!text-slate-600',
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
          customClass: {
            popup: `rounded-2xl shadow-2xl border ${isDark ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-800'}`,
            title: isDark ? '!text-white' : '!text-slate-800',
          }
        });

        setTimeout(() => {
          navigate('/login'); 
        }, 1500);
      }
    });
  };

  return (
    <aside className="w-72 hidden md:flex flex-col p-3 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 transition-colors">
      <div className="px-2 mb-6">
        <button className="flex items-center gap-4 px-6 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-md hover:shadow-lg transition-all border border-slate-100 dark:border-slate-700 group active:scale-95 w-full">
          <Plus size={24} className="text-blue-600 dark:text-blue-400 group-hover:rotate-90 transition-transform" />
          <span className="font-bold">TAF</span>
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item, idx) => (
          <NavLink 
            key={idx}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-2.5 rounded-r-full cursor-pointer transition-all
              ${isActive 
                ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-black' 
                : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {item.icon}
                </div>
                <span className="text-sm">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pb-2">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-2.5 rounded-r-full cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">Se déconnecter</span>
        </button>
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <a 
          href="https://portfolio-elyse.vercel.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block hover:opacity-80 transition-opacity"
        >
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-widest text-center ">
            Par Elysé RANDRIANANTENAINA
          </p>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;