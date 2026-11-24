import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import { MapPin, Plus, Search, Edit3, RefreshCw, Building2, UserRound, CalendarDays, AlertCircle, Loader2 } from 'lucide-react';

const CommunesPage = () => {
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCommune, setEditingCommune] = useState(null);
  const [nomCommune, setNomCommune] = useState('');
  const [error, setError] = useState('');

  const fetchCommunes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/communes');
      const data = response.data?.communes;
      setCommunes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur communes :', err);
      setError(err.response?.data?.message || 'Impossible de charger les communes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunes();
  }, [fetchCommunes]);

  const filteredCommunes = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return communes;
    return communes.filter(commune => [commune.nom_commune, commune.so_name, commune.so_email].some(value => String(value || '').toLowerCase().includes(keyword)));
  }, [communes, search]);

  const openCreateModal = () => {
    setEditingCommune(null);
    setNomCommune('');
    setShowModal(true);
  };

  const openEditModal = commune => {
    setEditingCommune(commune);
    setNomCommune(commune.nom_commune || '');
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingCommune(null);
    setNomCommune('');
  };

  const showToast = (icon, title) => {
    Swal.fire({ toast: true, position: 'top-end', icon, title, showConfirmButton: false, timer: 2500, timerProgressBar: true });
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const name = nomCommune.trim().replace(/\s+/g, ' ');
    if (name.length < 2 || name.length > 255) {
      showToast('warning', 'Le nom doit contenir entre 2 et 255 caractères.');
      return;
    }

    try {
      setSaving(true);
      const payload = { nom_commune: name };
      const response = editingCommune
        ? await axios.put(`/communes/${editingCommune.id_commune}`, payload)
        : await axios.post('/communes', payload);

      setShowModal(false);
      setEditingCommune(null);
      setNomCommune('');
      showToast('success', response.data?.message || 'Opération effectuée avec succès.');
      await fetchCommunes();
    } catch (err) {
      showToast('error', err.response?.data?.message || "Une erreur s'est produite.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = value => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 w-full overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 font-body">
      <header className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 md:px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={22} className="text-emerald-600 dark:text-emerald-400" />
            <h1 className="font-display text-lg sm:text-xl font-bold text-[#103F30] dark:text-white">Gestion des communes</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Administration et suivi des communes de l'ONG TSINJO AINA.</p>
        </div>
        <button onClick={openCreateModal} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#176B46] hover:bg-[#103F30] text-white text-sm font-semibold transition-colors">
          <Plus size={17} />
          Ajouter une commune
        </button>
      </header>

      <main className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden p-3 md:p-5">
      <div className="flex flex-col flex-1 min-h-0 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 shrink-0 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Liste des communes</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{filteredCommunes.length} commune(s) affichée(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher une commune..." className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
            </div>
            <button onClick={fetchCommunes} disabled={loading} title="Actualiser" className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50">
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {error && (
          <div className="shrink-0 m-3 p-3 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-auto overscroll-contain custom-scrollbar">
          <table className="w-full min-w-[850px] text-sm text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Commune</th>
                <th className="px-4 py-3 font-semibold">SO responsable</th>
                <th className="px-4 py-3 font-semibold text-center">Membres</th>
                <th className="px-4 py-3 font-semibold text-center">Ménages</th>
                <th className="px-4 py-3 font-semibold text-center">Groupes</th>
                <th className="px-4 py-3 font-semibold">Création</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-slate-500 dark:text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-emerald-600" />
                    Chargement des communes...
                  </td>
                </tr>
              ) : filteredCommunes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-slate-500 dark:text-slate-400">
                    <Building2 size={30} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    {search ? 'Aucune commune ne correspond à votre recherche.' : 'Aucune commune enregistrée.'}
                  </td>
                </tr>
              ) : filteredCommunes.map(commune => (
                <tr key={commune.id_commune} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        <MapPin size={17} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{commune.nom_commune}</p>
                        <p className="text-xs text-slate-400">ID : {commune.id_commune}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {commune.so_name ? (
                      <div className="flex items-center gap-2">
                        <UserRound size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{commune.so_name}</p>
                          <p className="text-xs text-slate-400">{commune.so_email || '—'}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-medium">Non affecté</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-slate-700 dark:text-slate-300">{commune.total_membres || 0}</td>
                  <td className="px-4 py-3 text-center font-medium text-slate-700 dark:text-slate-300">{commune.total_menages || 0}</td>
                  <td className="px-4 py-3 text-center font-medium text-slate-700 dark:text-slate-300">{commune.total_groupes || 0}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{formatDate(commune.created_at)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEditModal(commune)} title="Modifier" className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors">
                      <Edit3 size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      </main>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60" onMouseDown={event => { if (event.target === event.currentTarget) closeModal(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="commune-modal-title" className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 id="commune-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">{editingCommune ? 'Modifier une commune' : 'Ajouter une commune'}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Renseignez le nom officiel de la commune.</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-5">
                <label htmlFor="nom_commune" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nom de la commune <span className="text-rose-500">*</span></label>
                <input id="nom_commune" type="text" value={nomCommune} onChange={event => setNomCommune(event.target.value)} maxLength={255} required autoFocus placeholder="Ex. : Soatanana" className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              </div>
              <div className="px-5 py-4 flex justify-end gap-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={closeModal} disabled={saving} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50">Annuler</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#176B46] hover:bg-[#103F30] text-white text-sm font-semibold disabled:opacity-50">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editingCommune ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunesPage;