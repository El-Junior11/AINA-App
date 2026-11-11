import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import {
  UserPlus, Check, X, Bell, Loader2, Search, MapPin,
  ShieldCheck, Users, Mail, Clock3, RefreshCw,
  AlertCircle, UserRound, ChevronRight
} from 'lucide-react';

const inputClass = 'w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';

const UserApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [assignedCommunes, setAssignedCommunes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [role, setRole] = useState('user');
  const [communeId, setCommuneId] = useState('');

  const toast = (icon, title) => Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer: 2800,
    timerProgressBar: true
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResponse, communesResponse, allUsersResponse] = await Promise.all([
        axios.get('/auth/admin/pending-users'),
        axios.get('/auth/admin/communes'),
        axios.get('/admin/users')
      ]);

      const users = Array.isArray(usersResponse.data) ? usersResponse.data : usersResponse.data?.users || [];
      const communeList = Array.isArray(communesResponse.data) ? communesResponse.data : [];
      const allUsers = Array.isArray(allUsersResponse.data?.users) ? allUsersResponse.data.users : [];

      setPendingUsers(users);
      setCommunes(communeList);
      setAssignedCommunes(new Set(
        allUsers
          .filter(user => user.role === 'user' && user.commune_id != null)
          .map(user => Number(user.commune_id))
      ));
    } catch (err) {
      console.error('Erreur chargement inscriptions:', err);
      setError(err.response?.data?.message || 'Impossible de charger les demandes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return pendingUsers.filter(user =>
      [user.name, user.email].some(value => String(value || '').toLowerCase().includes(keyword))
    );
  }, [pendingUsers, search]);

  const availableCommunes = useMemo(() => {
    return communes.filter(commune => !assignedCommunes.has(Number(commune.id)));
  }, [communes, assignedCommunes]);

  const openAcceptModal = user => {
    setSelectedUser(user);
    setRole('user');
    setCommuneId('');
  };

  const closeModal = () => {
    if (processing) return;
    setSelectedUser(null);
    setRole('user');
    setCommuneId('');
  };

  const handleAccept = async event => {
    event.preventDefault();
    if (!selectedUser) return;

    if (role === 'user' && !communeId) {
      toast('warning', 'Veuillez sélectionner une commune.');
      return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const confirmation = await Swal.fire({
      title: "Confirmer l'approbation",
      text: `Voulez-vous accepter ${selectedUser.name} en tant que ${role === 'admin' ? 'Administrateur' : 'SO'} ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#059669',
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#ffffff' : '#0f172a'
    });

    if (!confirmation.isConfirmed) return;

    try {
      setProcessing(true);
      const userId = selectedUser.user_id || selectedUser.id;
      const payload = {
        action: 'accepte',
        role,
        commune_id: role === 'user' ? Number(communeId) : null
      };

      const response = await axios.put(`/auth/admin/user-status/${userId}`, payload);
      setSelectedUser(null);
      setRole('user');
      setCommuneId('');
      toast('success', response.data?.message || 'Inscription approuvée.');
      await fetchData();
    } catch (err) {
      toast('error', err.response?.data?.message || "Impossible d'approuver l'inscription.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRefuse = async user => {
    const isDark = document.documentElement.classList.contains('dark');
    const confirmation = await Swal.fire({
      title: "Refuser l'inscription ?",
      text: `Voulez-vous refuser la demande de ${user.name} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Refuser',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#e11d48',
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#ffffff' : '#0f172a'
    });

    if (!confirmation.isConfirmed) return;

    try {
      setProcessing(true);
      const userId = user.user_id || user.id;
      const response = await axios.put(`/auth/admin/user-status/${userId}`, { action: 'refuse' });
      toast('success', response.data?.message || 'Inscription refusée.');
      await fetchData();
    } catch (err) {
      toast('error', err.response?.data?.message || "Impossible de refuser l'inscription.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full min-h-full p-4 sm:p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell size={23} className="text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Approbation des inscriptions</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Examinez les demandes et attribuez les accès à la plateforme.</p>
        </div>
        <button onClick={fetchData} disabled={loading || processing} className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Demandes en attente</span>
            <Clock3 size={20} className="text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{pendingUsers.length}</p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Communes disponibles</span>
            <MapPin size={20} className="text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{availableCommunes.length}</p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Communes affectées</span>
            <Users size={20} className="text-sky-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{assignedCommunes.size}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search size={17} className="absolute left-3 top-3 text-slate-400" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher un utilisateur..." className={`${inputClass} pl-10`} />
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{filteredUsers.length} demande(s)</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
          <Loader2 size={28} className="animate-spin text-emerald-600 mb-3" />
          <p className="text-sm">Chargement des demandes...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center">
          <UserRound size={35} className="text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Aucune demande trouvée</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Toutes les inscriptions ont été traitées ou aucun résultat ne correspond à votre recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {filteredUsers.map(user => (
            <article key={user.user_id || user.id} className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-md transition-all overflow-hidden">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <UserPlus size={23} />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                    <Clock3 size={13} />
                    En attente
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{user.name}</h3>
                <p className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                  <Mail size={14} className="shrink-0" />
                  {user.email}
                </p>
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Demande d'accès à la plateforme ONG TSINJO AINA</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30">
                <button onClick={() => handleRefuse(user)} disabled={processing} className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-sm font-semibold disabled:opacity-50">
                  <X size={16} />
                  Refuser
                </button>
                <button onClick={() => openAcceptModal(user)} disabled={processing} className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50">
                  <Check size={16} />
                  Accepter
                  <ChevronRight size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60" onMouseDown={event => { if (event.target === event.currentTarget) closeModal(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="approval-modal-title" className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 id="approval-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">Approuver une inscription</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{selectedUser.name}</p>
              </div>
              <button onClick={closeModal} disabled={processing} aria-label="Fermer" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={19} />
              </button>
            </div>
            <form onSubmit={handleAccept}>
              <div className="p-5 space-y-4">
                <div>
                  <label htmlFor="approval-role" className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Rôle de l'utilisateur</label>
                  <select id="approval-role" value={role} onChange={event => { setRole(event.target.value); setCommuneId(''); }} className={inputClass}>
                    <option value="user">SO — Responsable communal</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
                {role === 'user' && (
                  <div>
                    <label htmlFor="approval-commune" className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Commune d'affectation</label>
                    <select id="approval-commune" value={communeId} onChange={event => setCommuneId(event.target.value)} required className={inputClass}>
                      <option value="">Sélectionner une commune</option>
                      {availableCommunes.map(commune => <option key={commune.id} value={commune.id}>{commune.nom}</option>)}
                    </select>
                    {availableCommunes.length === 0 && (
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">Aucune commune disponible. Toutes les communes possèdent déjà un SO.</p>
                    )}
                  </div>
                )}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 text-xs leading-relaxed">
                  <ShieldCheck size={17} className="shrink-0" />
                  <span>Le compte sera activé après validation. Les SO accèdent uniquement aux données de leur commune.</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                <button type="button" onClick={closeModal} disabled={processing} className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300">Annuler</button>
                <button type="submit" disabled={processing || (role === 'user' && !communeId)} className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50">
                  {processing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserApprovals;