import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import {
  Users, UserRound, ShieldCheck, Clock3, Search, MapPin,
  SlidersHorizontal, RefreshCw, Pencil, X, Check, Loader2,
  Mail, Building2, UserCheck, AlertCircle, ArrowRight
} from 'lucide-react';

const inputClass = 'w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10';
const statusConfig = {
  accepte: { label: 'Actif', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400', dot: 'bg-emerald-500' },
  en_attente: { label: 'En attente', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400', dot: 'bg-amber-500' },
  refuse: { label: 'Refusé', className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400', dot: 'bg-rose-500' }
};

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [communeFilter, setCommuneFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCommune, setSelectedCommune] = useState('');

  const toast = (icon, title) => Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    timer: 2800,
    timerProgressBar: true,
    showConfirmButton: false
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResponse, communesResponse] = await Promise.all([
        axios.get('/admin/users'),
        axios.get('/communes')
      ]);
      setUsers(Array.isArray(usersResponse.data?.users) ? usersResponse.data.users : []);
      setCommunes(Array.isArray(communesResponse.data?.communes) ? communesResponse.data.communes : []);
    } catch (err) {
      console.error('Erreur utilisateurs:', err);
      setError(err.response?.data?.message || 'Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => ({
    total: users.length,
    so: users.filter(user => user.role === 'user' && user.status === 'accepte').length,
    admins: users.filter(user => user.role === 'admin' && user.status === 'accepte').length,
    pending: users.filter(user => user.status === 'en_attente').length
  }), [users]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter(user => {
      const matchesSearch = [user.name, user.email, user.nom_commune].some(value => String(value || '').toLowerCase().includes(keyword));
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesCommune = communeFilter === 'all' || String(user.commune_id) === communeFilter;
      return matchesSearch && matchesRole && matchesStatus && matchesCommune;
    });
  }, [users, search, roleFilter, statusFilter, communeFilter]);

  const availableCommunes = useMemo(() => {
    if (!selectedUser) return [];
    return communes.filter(commune => {
      const occupied = users.some(user =>
        user.role === 'user' &&
        Number(user.commune_id) === Number(commune.id_commune) &&
        Number(user.user_id) !== Number(selectedUser.user_id)
      );
      return !occupied;
    });
  }, [communes, users, selectedUser]);

  const openEditModal = user => {
    if (user.role !== 'user' || user.status !== 'accepte') return;
    setSelectedUser(user);
    setSelectedCommune(String(user.commune_id || ''));
  };

  const closeModal = () => {
    if (saving) return;
    setSelectedUser(null);
    setSelectedCommune('');
  };

  const handleUpdateCommune = async event => {
    event.preventDefault();
    if (!selectedUser || !selectedCommune) {
      toast('warning', 'Veuillez sélectionner une commune.');
      return;
    }

    try {
      setSaving(true);
      const response = await axios.put(`/admin/users/${selectedUser.user_id}/commune`, {
        commune_id: Number(selectedCommune)
      });
      toast('success', response.data?.message || 'Affectation mise à jour.');
      setSelectedUser(null);
      setSelectedCommune('');
      await fetchData();
    } catch (err) {
      toast('error', err.response?.data?.message || "Impossible de modifier l'affectation.");
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    { label: 'Utilisateurs', value: stats.total, icon: Users, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40' },
    { label: 'SO actifs', value: stats.so, icon: UserCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Administrateurs', value: stats.admins, icon: ShieldCheck, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
    { label: 'En attente', value: stats.pending, icon: Clock3, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' }
  ];

  return (
    <div className="users-page flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap'); .users-page, .users-page button, .users-page input, .users-page select { font-family: 'Public Sans', system-ui, sans-serif; }`}</style>
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 md:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={23} className="text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Gestion des utilisateurs</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Consultez les comptes et gérez les affectations des SO.</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                <Icon size={21} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <SlidersHorizontal size={18} className="text-emerald-600" />
          <h2 className="text-sm font-semibold">Recherche et filtres</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Nom, email, commune..." className={`${inputClass} pl-9`} />
          </div>
          <select value={roleFilter} onChange={event => setRoleFilter(event.target.value)} className={inputClass}>
            <option value="all">Tous les rôles</option>
            <option value="admin">Administrateurs</option>
            <option value="user">SO</option>
          </select>
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className={inputClass}>
            <option value="all">Tous les statuts</option>
            <option value="accepte">Actifs</option>
            <option value="en_attente">En attente</option>
            <option value="refuse">Refusés</option>
          </select>
          <select value={communeFilter} onChange={event => setCommuneFilter(event.target.value)} className={inputClass}>
            <option value="all">Toutes les communes</option>
            {communes.map(commune => <option key={commune.id_commune} value={commune.id_commune}>{commune.nom_commune}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Comptes utilisateurs</h2>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{filteredUsers.length} résultat(s)</span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
          <Loader2 size={28} className="animate-spin text-emerald-600 mb-3" />
          <p className="text-sm">Chargement des utilisateurs...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center">
          <UserRound size={35} className="text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Aucun utilisateur trouvé</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Essayez de modifier vos critères de recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {filteredUsers.map(user => {
            const status = statusConfig[user.status] || statusConfig.en_attente;
            const isSO = user.role === 'user';
            const canEdit = isSO && user.status === 'accepte';

            return (
              <article key={user.user_id} className="group flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-md transition-all overflow-hidden">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                      <UserRound size={24} />
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.className}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate" title={user.name}>{user.name}</h3>
                  <p className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate" title={user.email}>
                    <Mail size={14} className="shrink-0" />
                    {user.email}
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Rôle</span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isSO ? 'text-sky-600 dark:text-sky-400' : 'text-violet-600 dark:text-violet-400'}`}>
                        {isSO ? <Users size={14} /> : <ShieldCheck size={14} />}
                        {isSO ? 'SO' : 'Administrateur'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Commune</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 text-right">
                        <MapPin size={14} className="text-emerald-600 shrink-0" />
                        {user.nom_commune || 'Non affectée'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Identifiant</span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">#{user.user_id}</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30">
                  {canEdit ? (
                    <button onClick={() => openEditModal(user)} className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors">
                      <Pencil size={15} />
                      Modifier l'affectation
                      <ArrowRight size={15} />
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 h-9 text-xs text-slate-400 dark:text-slate-500">
                      {user.status === 'en_attente' ? <Clock3 size={15} /> : <Building2 size={15} />}
                      {user.status === 'en_attente' ? 'Validation en attente' : 'Aucune action disponible'}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60" onMouseDown={event => { if (event.target === event.currentTarget) closeModal(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="edit-commune-title" className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 id="edit-commune-title" className="text-lg font-bold text-slate-900 dark:text-white">Modifier l'affectation</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{selectedUser.name}</p>
              </div>
              <button type="button" onClick={closeModal} disabled={saving} aria-label="Fermer" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={19} />
              </button>
            </div>
            <form onSubmit={handleUpdateCommune}>
              <div className="p-5 space-y-4">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
                  Le changement de commune sera refusé si cet utilisateur possède déjà des données enregistrées.
                </div>
                <div>
                  <label htmlFor="new-commune" className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Nouvelle commune</label>
                  <select id="new-commune" value={selectedCommune} onChange={event => setSelectedCommune(event.target.value)} required className={inputClass}>
                    <option value="">Sélectionner une commune</option>
                    {availableCommunes.map(commune => <option key={commune.id_commune} value={commune.id_commune}>{commune.nom_commune}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                <button type="button" onClick={closeModal} disabled={saving} className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300">Annuler</button>
                <button type="submit" disabled={saving || !selectedCommune || String(selectedUser.commune_id) === selectedCommune} className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </main>
    </div>
  );
};

export default UsersPage;