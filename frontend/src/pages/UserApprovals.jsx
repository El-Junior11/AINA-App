import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import { UserPlus, Check, X, Bell, Loader2, Info } from 'lucide-react';

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
      confirmButtonColor: action === 'accepte' ? '#10b981' : '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      background: isDarkMode ? '#0f172a' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#0f172a',
      customClass: {
        popup: 'rounded-2xl border border-emerald-100 dark:border-slate-800 text-xs font-medium shadow-xl p-4',
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
        <Loader2 size={36} className="animate-spin text-emerald-500 mb-3" />
        <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm tracking-wide">Chargement des demandes...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full p-4 md:p-6 font-body space-y-8 text-black dark:text-white transition-colors">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
        .font-body { font-family: 'DM Sans', sans-serif; }
        .font-display { font-family: 'Manrope', sans-serif; }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-sky-500 text-white rounded-2xl shrink-0 shadow-sm">
            <Bell size={24} />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
                Approbation des inscriptions
              </h1>

              {pendingUsers.length > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              )}
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Gérez et validez les demandes d'accès des nouveaux utilisateurs sur la plateforme.
            </p>
          </div>
        </div>

        {pendingUsers.length > 0 && (
          <span className="text-sm font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-4 py-2 rounded-xl w-fit">
            {pendingUsers.length} en attente
          </span>
        )}
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/20 dark:to-sky-950/20 border border-emerald-200/50 dark:border-emerald-900/40 rounded-2xl p-5 text-emerald-900 dark:text-emerald-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/60 dark:bg-white/5 rounded-lg shrink-0">
            <Info size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="space-y-2 text-sm">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-100 font-display">
              Guide d'utilisation :
            </h4>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-emerald-800/90 dark:text-emerald-300/80 list-disc list-inside">
              <li>Examinez attentivement chaque demande d'inscription en attente.</li>
              <li>Cliquez sur <strong>Accepter</strong> pour autoriser l'accès de l'utilisateur à la plateforme.</li>
              <li>Cliquez sur <strong>Refuser</strong> pour rejeter la demande d'accès.</li>
              <li>Les actions sont immédiates et notifient le système en temps réel.</li>
            </ul>
          </div>
        </div>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/40 dark:bg-slate-900/10">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-slate-900 text-emerald-500 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-3">
            <Bell size={26} className="opacity-80" />
          </div>

          <p className="text-base font-bold text-slate-900 dark:text-white font-display">
            Aucune demande en attente
          </p>

          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Toutes les inscriptions ont été traitées avec succès.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pendingUsers.map((user) => (
            <div
              key={user.id || user.user_id}
              className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-400/40 dark:hover:border-emerald-500/30"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                  <UserPlus size={21} />
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Demande d'inscription de <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{user.name}</span>
                  </p>

                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleAction(user, 'refuse')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-xl transition-all border border-rose-100 dark:border-rose-900/40 cursor-pointer"
                >
                  <X size={17} />
                  Refuser
                </button>

                <button
                  onClick={() => handleAction(user, 'accepte')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
                >
                  <Check size={17} />
                  Accepter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default UserApprovals;