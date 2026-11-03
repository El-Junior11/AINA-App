import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import { UserPlus, Check, X, Bell, Loader2, Info } from 'lucide-react';

// Classes partagées pour garder des boutons/champs cohérents
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900';

const UserApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  const fetchPendingUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/auth/admin/pending-users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setPendingUsers(response.data);
    } catch (error) {
      console.error("Erreur fetching users:", error);
      Toast.fire({
        icon: 'error',
        title: "Erreur lors du chargement des demandes."
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  const handleAction = async (user, action) => {
    const userId = user.id || user.user_id;

    if (!userId) {
      Toast.fire({
        icon: 'error',
        title: "Erreur: ID de l'utilisateur introuvable."
      });
      return;
    }

    const isDarkMode = document.documentElement.classList.contains('dark');

    const result = await Swal.fire({
      toast: true,
      position: 'top-end',
      title: 'Êtes-vous sûr ?',
      text: `Voulez-vous vraiment ${action === 'accepte' ? 'accepter' : 'refuser'} cet utilisateur ?`,
      icon: 'question',
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonColor: action === 'accepte' ? '#047857' : '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      background: isDarkMode ? '#0f172a' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#0f172a',
      customClass: {
        popup: 'rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium shadow-xl p-4',
        confirmButton: 'text-xs px-4 py-2 rounded-lg font-bold cursor-pointer',
        cancelButton: 'text-xs px-4 py-2 rounded-lg font-bold cursor-pointer',
      }
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `/auth/admin/user-status/${userId}`,
        { action },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setPendingUsers(prevUsers => prevUsers.filter(u => (u.id || u.user_id) !== userId));

      Toast.fire({
        icon: 'success',
        title: response.data.message
      });

    } catch (error) {
      console.error("Erreur action:", error);
      Toast.fire({
        icon: 'error',
        title: error.response?.data?.message || "Une erreur est survenue."
      });
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 size={32} className="animate-spin text-emerald-600 mb-3" />
        <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">Chargement des demandes...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors font-body text-slate-900 dark:text-slate-100 overflow-hidden relative antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
        .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
        @media (prefers-reduced-motion: reduce){.animate-in{animation:none!important}}
      `}</style>

      {/* En-tête de page */}
      <header className="px-4 md:px-6 py-4 md:py-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60">
            <Bell size={20} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-display font-semibold text-slate-900 dark:text-white leading-tight">
                Approbation des inscriptions
              </h1>
              {pendingUsers.length > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Gérez et validez les demandes d'accès des nouveaux utilisateurs.</p>
          </div>
        </div>

        {pendingUsers.length > 0 && (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 px-3 py-1.5 rounded-md ring-1 ring-inset ring-emerald-200 dark:ring-emerald-900 shrink-0">
            {pendingUsers.length} en attente
          </span>
        )}
      </header>

      {/* Contenu principal défilable */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {/* Guide d'utilisation */}
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 text-sm flex items-start gap-3">
          <Info size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Guide d'utilisation</span>
            <p className="text-emerald-800/90 dark:text-emerald-300/80 text-[13px] leading-relaxed">
              Examinez chaque demande, puis utilisez les actions rapides pour accepter ou refuser l'accès de l'utilisateur à la plateforme.
            </p>
          </div>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-center">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-3 ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60">
              <Bell size={22} />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Aucune demande en attente</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Toutes les inscriptions ont été traitées avec succès.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingUsers.map((user) => (
              <div
                key={user.id || user.user_id}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60">
                    <UserPlus size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Boutons modernes avec Tooltip au survol (hover) */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Bouton Refuser */}
                  <div className="relative group">
                    <button
                      onClick={() => handleAction(user, 'refuse')}
                      aria-label="Refuser"
                      className={`h-9 w-9 rounded-lg bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-slate-300 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-slate-800 inline-flex items-center justify-center transition-colors ${focusRing}`}
                    >
                      <X size={16} />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium rounded shadow-md whitespace-nowrap z-20 pointer-events-none">
                      Refuser
                    </div>
                  </div>

                  {/* Bouton Accepter */}
                  <div className="relative group">
                    <button
                      onClick={() => handleAction(user, 'accepte')}
                      aria-label="Accepter"
                      className={`h-9 w-9 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center justify-center shadow-sm transition-colors ${focusRing}`}
                    >
                      <Check size={16} />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium rounded shadow-md whitespace-nowrap z-20 pointer-events-none">
                      Accepter
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserApprovals;