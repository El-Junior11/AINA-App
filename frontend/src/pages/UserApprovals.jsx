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
      title: 'Êtes-vous sûr ?',
      text: `Voulez-vous vraiment ${action === 'accepte' ? 'accepter' : 'refuser'} cet utilisateur ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: action === 'accepte' ? '#0284c7' : '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      background: isDarkMode ? '#0f172a' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#0f172a',
      customClass: {
        popup: 'rounded-xl border border-sky-100 dark:border-slate-800 text-xs font-medium'
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
        <Loader2 size={32} className="animate-spin text-sky-500 mb-2" />
        <p className="font-medium text-slate-500 dark:text-slate-400 text-xs tracking-wide">Chargement des demandes...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full p-4 md:p-6 font-sans space-y-8 text-black dark:text-white transition-colors">
      
      {/* SECTION EN-TÊTE (FLAT - SANS CARD) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl shrink-0">
            <Bell size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Approbation des inscriptions
              </h1>
              {pendingUsers.length > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Gérez et validez les demandes d'accès des nouveaux utilisateurs sur la plateforme.
            </p>
          </div>
        </div>
        
        {pendingUsers.length > 0 && (
          <span className="text-xs font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400 px-3 py-1.5 rounded-lg border border-sky-100 dark:border-slate-800 w-fit">
            {pendingUsers.length} en attente
          </span>
        )}
      </div>

      {/* SECTION INSTRUCTIONS / GUIDE D'UTILISATION */}
      <div className="bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-900/50 rounded-xl p-4 text-sky-900 dark:text-sky-200">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-sky-500 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-sky-900 dark:text-sky-100">Guide d'utilisation :</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sky-800/90 dark:text-sky-300/80 list-disc list-inside">
              <li>Examinez attentivement chaque demande d'inscription en attente.</li>
              <li>Cliquez sur <strong>Accepter</strong> pour autoriser l'accès de l'utilisateur à la plateforme.</li>
              <li>Cliquez sur <strong>Refuser</strong> pour rejeter la demande d'accès.</li>
              <li>Les actions sont immédiates et notifient le système en temps réel.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* LISTE DES UTILISATEURS (ÉPURÉE - SANS CONTENEUR CARD GLOBAL) */}
      {pendingUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 border border-dashed border-sky-200/60 dark:border-slate-800 rounded-2xl bg-sky-50/20 dark:bg-slate-900/10">
          <div className="w-12 h-12 bg-sky-50 dark:bg-slate-900 text-sky-500 dark:text-sky-400 rounded-xl flex items-center justify-center mb-3 border border-sky-100 dark:border-slate-800">
            <Bell size={22} className="opacity-80" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">Aucune demande en attente</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Toutes les inscriptions ont été traitées avec succès.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pendingUsers.map((user) => (
            <div 
              key={user.id || user.user_id} 
              className="bg-white dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-sky-500/40 dark:hover:border-sky-500/30 shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 rounded-xl shrink-0 border border-sky-100 dark:border-slate-700/60">
                  <UserPlus size={18} />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    Demande d'inscription de <span className="text-sky-600 dark:text-sky-400 font-extrabold">{user.name}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleAction(user, 'refuse')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg transition-all border border-rose-100 dark:border-rose-900/40 cursor-pointer"
                >
                  <X size={14} />
                  Refuser
                </button>
                <button
                  onClick={() => handleAction(user, 'accepte')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white text-xs font-bold rounded-lg transition-all shadow-sm shadow-sky-500/20 border border-sky-400 cursor-pointer"
                >
                  <Check size={14} />
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