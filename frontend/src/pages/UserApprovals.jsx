import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import { UserPlus, Check, X, Bell, Loader2 } from 'lucide-react';

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
      confirmButtonColor: action === 'accepte' ? '#2563eb' : '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      background: isDarkMode ? '#0f172a' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#0f172a',
      customClass: {
        popup: 'rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium'
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
        <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
        <p className="font-medium text-slate-500 dark:text-slate-400 text-xs tracking-wide">Chargement des demandes...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-white dark:bg-slate-950 p-6 font-sans overflow-y-auto text-black dark:text-white transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-bold text-black dark:text-white tracking-tight">
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
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-100 dark:border-slate-800">
              {pendingUsers.length} en attente
            </span>
          )}
        </div>

        {pendingUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-900/10">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center mb-3 border border-slate-200/40 dark:border-slate-800/60">
              <Bell size={22} className="opacity-60" />
            </div>
            <p className="text-sm font-bold text-black dark:text-white">Aucune demande en attente</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Toutes les inscriptions ont été traitées avec succès.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingUsers.map((user) => (
              <div 
                key={user.id || user.user_id} 
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-blue-500/30 dark:hover:border-blue-500/20 shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-black dark:text-white rounded-xl shrink-0 border border-slate-200/40 dark:border-slate-700/60">
                    <UserPlus size={18} />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-black dark:text-white leading-tight">
                      Demande d'inscription de <span className="text-blue-600 dark:text-blue-400 font-extrabold">{user.name}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleAction(user, 'refuse')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all border border-rose-100 dark:border-rose-900/40"
                  >
                    <X size={14} />
                    Refuser
                  </button>
                  <button
                    onClick={() => handleAction(user, 'accepte')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm border border-blue-500"
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
    </div>
  );
};

export default UserApprovals;