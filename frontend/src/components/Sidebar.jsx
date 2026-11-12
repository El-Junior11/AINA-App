import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  LayoutDashboard, Users, UserCircle, Share2, ShieldCheck,
  GraduationCap, LogOut, Menu, Activity, MapPinned,
  UserCog, FileBarChart2, Settings2, ChevronDown
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900';

// Menus principaux (visibles par tous les utilisateurs)
const mainItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' },
  { icon: Users, label: 'Membres', path: '/membres' },
  { icon: UserCircle, label: 'Groupes de solidarité', path: '/groupes' },
  { icon: Share2, label: 'Réseaux', path: '/reseaux' },
  { icon: ShieldCheck, label: 'Responsables', path: '/responsables' },
  { icon: GraduationCap, label: 'Formations', path: '/formations' }
];

// Sous-menus du menu « Administrateur »
const adminChildren = [
  { icon: FileBarChart2, label: 'Rapports & Statistiques', path: '/rapports' },
  { icon: MapPinned, label: 'Gestion des communes', path: '/admin/communes' },
  { icon: UserCog, label: 'Gestion des utilisateurs', path: '/admin/users' }
];

// Menu réservé aux administrateurs, placé après le groupe « Administrateur »
const adminActionsItem = { icon: Activity, label: 'Actions utilisateurs', path: '/admin/notifications' };

const itemClass = (isActive, isCollapsed) =>
  `relative flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isCollapsed ? 'justify-center px-0' : ''
  } ${
    isActive
      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold'
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
  } ${focusRing}`;

const subItemClass = (isActive) =>
  `flex items-center gap-2.5 w-full rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
    isActive
      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold'
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
  } ${focusRing}`;

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAdmin } = useContext(AuthContext);

  // --- Menu Administrateur (sous-menus) ---
  const isAdminActive = adminChildren.some(
    (child) => location.pathname === child.path || location.pathname.startsWith(`${child.path}/`)
  );
  const [adminOpen, setAdminOpen] = useState(isAdminActive);

  // Ouvre automatiquement le groupe quand on navigue vers l'un de ses sous-menus
  useEffect(() => {
    if (isAdminActive) setAdminOpen(true);
  }, [isAdminActive, location.pathname]);

  // --- Infobulles et sous-menu flottant en mode réduit (affichés hors de la barre pour ne pas être coupés) ---
  const [flyout, setFlyout] = useState(null);
  const closeTimer = useRef(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setFlyout(null), 120);
  }, [cancelClose]);

  const openFlyout = (e, type, label) => {
    if (!isCollapsed) return;
    cancelClose();
    const rect = e.currentTarget.getBoundingClientRect();
    setFlyout({ type, label, top: rect.top, height: rect.height, left: rect.right + 8 });
  };

  const hoverProps = (type, label) =>
    isCollapsed
      ? {
          onMouseEnter: (e) => openFlyout(e, type, label),
          onMouseLeave: scheduleClose,
          onFocus: (e) => openFlyout(e, type, label),
          onBlur: scheduleClose
        }
      : {};

  useEffect(() => {
    setFlyout(null);
  }, [location.pathname, isCollapsed]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setFlyout(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLogout = async () => {
    const isDark = document.documentElement.classList.contains('dark');
    const result = await Swal.fire({
      toast: true, position: 'top-end', icon: 'question', title: 'Se déconnecter ?',
      showConfirmButton: true, showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui', cancelButtonText: 'Non',
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#ffffff' : '#0f172a',
      customClass: {
        popup: 'rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium shadow-xl p-3',
        confirmButton: 'text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer',
        cancelButton: 'text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer'
      }
    });
    if (!result.isConfirmed) return;
    logout();
    navigate('/', { replace: true });
    await Swal.fire({
      toast: true, position: 'top-end', icon: 'success',
      title: 'Déconnexion réussie', showConfirmButton: false,
      timer: 1500, timerProgressBar: true,
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#ffffff' : '#0f172a',
      customClass: {
        popup: 'rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium shadow-xl'
      }
    });
  };

  // Lien de navigation d'un menu principal
  const renderItem = (item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        aria-label={item.label}
        className={({ isActive }) => itemClass(isActive, isCollapsed)}
        {...hoverProps('tip', item.label)}
      >
        {({ isActive }) => (
          <>
            {isActive && !isCollapsed && (
              <span aria-hidden="true" className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            )}
            <span className={`shrink-0 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
              <Icon size={18} strokeWidth={2} />
            </span>
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </>
        )}
      </NavLink>
    );
  };

  const adminGroupActiveStyle = isAdminActive && (isCollapsed || !adminOpen);

  return (
    <aside className={`hidden md:flex flex-col shrink-0 relative p-3 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out motion-reduce:transition-none font-body ${isCollapsed ? 'w-16 items-center' : 'w-64'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
        .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
      `}</style>

      {/* Bouton ouvrir / réduire */}
      <div className={`w-full ${isCollapsed ? 'mb-2.5' : 'mb-3'}`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
          className={`flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-semibold transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 ${isCollapsed ? 'justify-center px-0' : ''} ${focusRing}`}
          {...hoverProps('tip', 'Ouvrir le menu')}
        >
          <Menu size={18} className="shrink-0 text-slate-500 dark:text-slate-400" />
          {!isCollapsed && <span className="truncate">Menu</span>}
        </button>
      </div>

      <nav aria-label="Menu principal" className="flex-1 w-full space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {mainItems.map(renderItem)}

        {isAdmin && (
          <>
            <div className="my-2 border-t border-slate-200 dark:border-slate-800" role="separator" />

            {/* Groupe « Administrateur » avec sous-menus */}
            <div className="w-full">
              <button
                type="button"
                onClick={() => !isCollapsed && setAdminOpen(!adminOpen)}
                aria-expanded={isCollapsed ? undefined : adminOpen}
                aria-controls="submenu-admin"
                aria-haspopup={isCollapsed ? 'menu' : undefined}
                aria-label="Administrateur"
                className={`flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${isCollapsed ? 'justify-center px-0' : ''} ${
                  adminGroupActiveStyle
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold'
                    : isAdminActive
                      ? 'text-emerald-800 dark:text-emerald-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                } ${focusRing}`}
                {...hoverProps('menu', 'Administrateur')}
              >
                <span className={`shrink-0 ${isAdminActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  <Settings2 size={18} strokeWidth={2} />
                </span>
                {!isCollapsed && (
                  <>
                    <span className="truncate flex-1 text-left">Administrateur</span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200 motion-reduce:transition-none ${adminOpen ? 'rotate-180' : ''}`}
                    />
                  </>
                )}
              </button>

              {/* Sous-menus (menu déplié) */}
              {!isCollapsed && (
                <div
                  id="submenu-admin"
                  className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${adminOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <ul className="mt-1 ml-5 pl-3 space-y-0.5 border-l border-slate-200 dark:border-slate-800">
                      {adminChildren.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <li key={child.path}>
                            <NavLink
                              to={child.path}
                              tabIndex={adminOpen ? 0 : -1}
                              className={({ isActive }) => subItemClass(isActive)}
                            >
                              {({ isActive }) => (
                                <>
                                  <span className={`shrink-0 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                    <ChildIcon size={16} strokeWidth={2} />
                                  </span>
                                  <span className="truncate">{child.label}</span>
                                </>
                              )}
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {renderItem(adminActionsItem)}
          </>
        )}
      </nav>

      <div className="w-full pt-3 space-y-2 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handleLogout}
          aria-label="Se déconnecter"
          className={`flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ${isCollapsed ? 'justify-center px-0' : ''} ${focusRing}`}
          {...hoverProps('tip', 'Se déconnecter')}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span className="truncate">Se déconnecter</span>}
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

      {/* Infobulle / sous-menu flottant du mode réduit */}
      {isCollapsed && flyout && createPortal(
        flyout.type === 'tip' ? (
          <div
            role="tooltip"
            style={{ position: 'fixed', top: flyout.top + flyout.height / 2, left: flyout.left, transform: 'translateY(-50%)' }}
            className="pointer-events-none z-[60] whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium font-body bg-white text-slate-800 border border-slate-200 shadow-md dark:bg-slate-900 dark:text-white dark:border-slate-800"
          >
            {flyout.label}
          </div>
        ) : (
          <div
            style={{ position: 'fixed', top: Math.max(8, Math.min(flyout.top, window.innerHeight - 190)), left: flyout.left - 8 }}
            className="z-[60] pl-2 font-body"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            onFocus={cancelClose}
            onBlur={scheduleClose}
          >
            <div
              id="submenu-admin"
              role="menu"
              aria-label="Administrateur"
              className="w-60 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg"
            >
              <p className="px-2.5 pt-1 pb-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Administrateur</p>
              {adminChildren.map((child) => {
                const ChildIcon = child.icon;
                return (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    role="menuitem"
                    className={({ isActive }) => subItemClass(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`shrink-0 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          <ChildIcon size={16} strokeWidth={2} />
                        </span>
                        <span className="truncate">{child.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ),
        document.body
      )}
    </aside>
  );
};

export default Sidebar;