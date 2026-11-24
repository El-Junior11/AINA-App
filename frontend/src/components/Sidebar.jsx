import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  LayoutDashboard, Users, UserCircle, Share2, ShieldCheck,
  GraduationCap, LogOut, Menu, Activity, MapPinned, X,
  UserCog, FileBarChart2, Settings2, ChevronDown
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40';

const mainItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' },
  { icon: Users, label: 'Membres', path: '/membres' },
  { icon: UserCircle, label: 'Groupes de solidarité', path: '/groupes' },
  { icon: Share2, label: 'Réseaux', path: '/reseaux' },
  { icon: ShieldCheck, label: 'Responsables', path: '/responsables' },
  { icon: GraduationCap, label: 'Formations', path: '/formations' }
];

const adminChildren = [
  { icon: FileBarChart2, label: 'Rapports & Statistiques', path: '/rapports' },
  { icon: MapPinned, label: 'Gestion des communes', path: '/admin/communes' },
  { icon: UserCog, label: 'Gestion des utilisateurs', path: '/admin/users' },
  { icon: Activity, label: 'Actions utilisateurs', path: '/admin/notifications' }
];

const itemClass = (active, collapsed = false) =>
  `relative flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${collapsed ? 'justify-center px-0' : ''} ${
    active ? 'bg-[#176B46] text-white font-semibold shadow-sm' :
    'text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-[#176B46] dark:hover:bg-slate-800 dark:hover:text-white'
  } ${focusRing}`;

const subItemClass = active =>
  `flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
    active ? 'bg-emerald-50 text-[#176B46] font-semibold dark:bg-emerald-950/50 dark:text-emerald-300' :
    'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
  } ${focusRing}`;

const Sidebar = ({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAdmin } = useContext(AuthContext);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const collapsed = isCollapsed && !isMobile;
  const isAdminActive = adminChildren.some(child => location.pathname === child.path || location.pathname.startsWith(`${child.path}/`));
  const [adminOpen, setAdminOpen] = useState(isAdminActive);
  const [flyout, setFlyout] = useState(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const handleResize = () => {
      setIsMobile(media.matches);
      setFlyout(null);
      if (!media.matches) setMobileOpen(false);
    };
    handleResize();
    media.addEventListener('change', handleResize);
    return () => media.removeEventListener('change', handleResize);
  }, [setMobileOpen]);

  useEffect(() => {
    if (isAdminActive) setAdminOpen(true);
    setMobileOpen(false);
    setFlyout(null);
  }, [location.pathname, isAdminActive, setMobileOpen]);

  useEffect(() => {
    setFlyout(null);
  }, [collapsed]);

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

  useEffect(() => () => cancelClose(), [cancelClose]);

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setFlyout(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setMobileOpen]);

  const openFlyout = (e, type, label) => {
    if (!collapsed) return;
    cancelClose();
    const rect = e.currentTarget.getBoundingClientRect();
    setFlyout({ type, label, top: rect.top, height: rect.height, left: rect.right + 8 });
  };

  const hoverProps = (type, label) => collapsed ? {
    onMouseEnter: e => openFlyout(e, type, label),
    onMouseLeave: scheduleClose,
    onFocus: e => openFlyout(e, type, label),
    onBlur: scheduleClose
  } : {};

  const closeMobile = () => {
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = async () => {
    closeMobile();
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

  const renderItem = item => {
    const Icon = item.icon;
    return (
      <NavLink key={item.path} to={item.path} aria-label={item.label} onClick={closeMobile}
        className={({ isActive }) => itemClass(isActive, collapsed)} {...hoverProps('tip', item.label)}>
        {({ isActive }) => (
          <>
            <Icon size={19} strokeWidth={1.9} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}/>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </>
        )}
      </NavLink>
    );
  };

  const renderAdminChildren = () => adminChildren.map(child => {
    const ChildIcon = child.icon;
    return (
      <NavLink key={child.path} to={child.path} onClick={() => { closeMobile(); setFlyout(null); }}
        tabIndex={collapsed || adminOpen ? 0 : -1}
        className={({ isActive }) => subItemClass(isActive)}>
        <ChildIcon size={16} strokeWidth={1.9} className="shrink-0"/>
        <span className="truncate">{child.label}</span>
      </NavLink>
    );
  });

  return (
    <>
      {mobileOpen && isMobile && (
        <div aria-hidden="true" onClick={() => setMobileOpen(false)}
          className="fixed inset-x-0 top-16 bottom-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"/>
      )}

      <aside id="aina-sidebar" aria-hidden={isMobile && !mobileOpen} inert={isMobile && !mobileOpen ? true : undefined}
        className={`fixed top-16 bottom-0 left-0 z-[45] lg:relative lg:inset-auto lg:z-auto flex flex-col shrink-0 min-h-0 p-3 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 font-body transition-[transform,width,visibility] duration-300 motion-reduce:transition-none
        ${collapsed ? 'w-[68px]' : 'w-64 max-w-[85vw]'}
        ${mobileOpen ? 'translate-x-0 visible' : '-translate-x-full invisible'} lg:translate-x-0 lg:visible`}>

        <div className={`flex items-center gap-2 mb-3 min-h-9 ${collapsed ? 'justify-center' : 'px-1'}`}>
          <button type="button" onClick={() => isMobile ? setMobileOpen(false) : setIsCollapsed(!isCollapsed)}
            aria-label={isMobile ? 'Fermer le menu' : collapsed ? 'Développer le menu' : 'Réduire le menu'}
            className={`p-2 rounded-lg text-[#176B46] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 ${focusRing}`}
            {...hoverProps('tip', 'Développer le menu')}>
            {isMobile ? <X size={20}/> : <Menu size={20}/>}
          </button>
          {!collapsed && <h2 className="font-display text-lg font-bold text-[#103F30] dark:text-white">Menu</h2>}
        </div>

        <nav aria-label="Menu principal" className="flex-1 min-h-0 w-full space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {mainItems.map(renderItem)}

          {isAdmin && (
            <>
              <div className="my-3 border-t border-slate-200 dark:border-slate-800"/>
              {!collapsed && <p className="px-3 pb-2 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Administration</p>}

              <button type="button" onClick={e => collapsed ? openFlyout(e, 'menu', 'Administrateur') : setAdminOpen(!adminOpen)}
                aria-label="Administrateur" aria-expanded={collapsed ? flyout?.type === 'menu' : adminOpen}
                className={`${itemClass(isAdminActive && (collapsed || !adminOpen), collapsed)} cursor-pointer`}
                {...hoverProps('menu', 'Administrateur')}>
                <Settings2 size={19} strokeWidth={1.9} className="shrink-0"/>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">Administrateur</span>
                    <ChevronDown size={16} className={`shrink-0 transition-transform ${adminOpen ? 'rotate-180' : ''}`}/>
                  </>
                )}
              </button>

              {!collapsed && (
                <div className={`grid transition-[grid-template-rows] duration-200 ${adminOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden" inert={!adminOpen ? true : undefined}>
                    <div className="ml-5 pl-3 mt-1 space-y-1 border-l border-slate-200 dark:border-slate-800">
                      {renderAdminChildren()}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </nav>

        <div className="w-full pt-3 mt-3 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={handleLogout} aria-label="Se déconnecter"
            className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-[13px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors ${collapsed ? 'justify-center px-0' : ''} ${focusRing}`}
            {...hoverProps('tip', 'Se déconnecter')}>
            <LogOut size={19} className="shrink-0"/>
            {!collapsed && <span>Se déconnecter</span>}
          </button>

          {!collapsed && (
            <a href="https://portfolio-elyse.vercel.app/" target="_blank" rel="noopener noreferrer"
              className="block mt-3 text-center text-[10px] text-slate-400 dark:text-slate-500 hover:text-[#176B46] transition-colors">
              Par Elysé RANDRIANANTENAINA
            </a>
          )}
        </div>

        {collapsed && flyout && createPortal(
          flyout.type === 'tip' ? (
            <div role="tooltip" style={{ position: 'fixed', top: flyout.top + flyout.height / 2, left: flyout.left, transform: 'translateY(-50%)' }}
              className="pointer-events-none z-[60] whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium font-body bg-white text-slate-800 border border-slate-200 shadow-md dark:bg-slate-900 dark:text-white dark:border-slate-800">
              {flyout.label}
            </div>
          ) : (
            <div style={{ position: 'fixed', top: Math.max(8, Math.min(flyout.top, window.innerHeight - 210)), left: flyout.left - 8 }}
              className="z-[60] pl-2 font-body" onMouseEnter={cancelClose} onMouseLeave={scheduleClose} onFocus={cancelClose} onBlur={scheduleClose}>
              <div className="w-60 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
                <p className="px-2.5 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Administrateur</p>
                {renderAdminChildren()}
              </div>
            </div>
          ), document.body
        )}
      </aside>
    </>
  );
};

export default Sidebar;