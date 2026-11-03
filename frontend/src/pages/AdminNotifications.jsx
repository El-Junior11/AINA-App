import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from '../api/axios';
import { Trash2, RotateCcw, ShieldCheck, ChevronDown, ChevronUp, Search, RefreshCw, Clock, Layers, Info, CheckSquare, Square, Mail } from 'lucide-react';
import Swal from 'sweetalert2';

// Toast natao manokana hiseho any an-tampony havanana misy bokotra fanamarinana
const ConfirmToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: true,
  confirmButtonText: 'Confirmer',
  showCancelButton: true,
  cancelButtonText: 'Annuler',
  timer: 10000,
  timerProgressBar: true,
  didOpen: t => {
    t.addEventListener('mouseenter', Swal.stopTimer);
    t.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

// Classes partagées pour garder des champs de formulaire cohérents
const fieldClass =
  'w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25';
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900';

const AdminNotifications = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/audit-logs');
      const data = Array.isArray(response.data) ? response.data : [];
      setLogs(data);
      setFilteredLogs(data);
      setSelected([]);
    } catch (error) {
      setLogs([]);
      setFilteredLogs([]);
      ConfirmToast.fire({ icon: 'error', title: 'Erreur de chargement des logs', showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, { transports: ['websocket'] });
    socket.on('admin_alert', newData => {
      setLogs(prev => [newData, ...prev].slice(0, 50));
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const results = logs.filter(log => {
      const userName = log.User?.name || 'Administrateur';
      const tableName = log.table_name?.split('/')[2] || 'inconnu';
      const action = log.action_type || '';
      return `${userName} ${tableName} ${action}`.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredLogs(results);
  }, [searchTerm, logs]);

  const formatKey = key => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const parseDetails = details => {
    if (!details) return {};
    if (typeof details === 'object') return details;
    try { return JSON.parse(details); } catch { return {}; }
  };

  const formatValue = value => {
    if (value === null || value === undefined || value === '') return 'vide';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (typeof value === 'object') {
      try { return JSON.stringify(value); } catch { return String(value); }
    }
    return String(value);
  };

  const getEntityName = (details, log) => details.entity || details.nom || details.name || details.message || `ID: ${log.target_id}`;

  const getChanges = details => {
    if (details.changes && typeof details.changes === 'object') return details.changes;
    const result = {};
    Object.entries(details).forEach(([key, value]) => {
      if (!['nom', 'message', 'entity', 'changes', 'data', 'deleted_data'].includes(key) && value && typeof value === 'object' && ('old' in value || 'new' in value)) result[key] = value;
    });
    return result;
  };

  const getDeletedData = details => details.deleted_data && typeof details.deleted_data === 'object' ? details.deleted_data : {};
  const getCreatedData = details => details.data && typeof details.data === 'object' ? details.data : {};

  const toggleSelect = id => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selected.length === filteredLogs.length) setSelected([]);
    else setSelected(filteredLogs.map(log => log.id));
  };

  const handleAction = async (actionType, log, e) => {
    e.stopPropagation();

    const result = await ConfirmToast.fire({
      icon: 'question',
      title: actionType === 'delete' ? "Voulez-vous supprimer cette trace ?" : "Voulez-vous restaurer cet élément ?",
      confirmButtonColor: actionType === 'delete' ? '#ef4444' : '#047857',
    });

    if (!result.isConfirmed) return;

    try {
      await axios.post(`/audit-logs/${actionType}/${log.id}`);
      ConfirmToast.fire({
        icon: 'success',
        title: actionType === 'delete' ? 'Trace supprimée avec succès' : 'Élément restauré avec succès',
        showConfirmButton: false,
        timer: 2500
      });

      if (actionType === 'delete') {
        setLogs(prev => prev.filter(l => l.id !== log.id));
        setSelected(prev => prev.filter(id => id !== log.id));
      }
    } catch (error) {
      ConfirmToast.fire({
        icon: 'error',
        title: error.response?.data?.message || 'Une erreur est survenue',
        showConfirmButton: false,
        timer: 2500
      });
    }
  };

  const restoreSelected = async () => {
    if (!selected.length) return;

    const result = await ConfirmToast.fire({
      icon: 'question',
      title: `Restaurer ${selected.length} élément(s) ?`,
      confirmButtonColor: '#047857',
    });

    if (!result.isConfirmed) return;

    try {
      setRestoring(true);
      await Promise.all(selected.map(id => axios.post(`/audit-logs/restore/${id}`)));
      setSelected([]);
      ConfirmToast.fire({
        icon: 'success',
        title: 'Sélection restaurée avec succès',
        showConfirmButton: false,
        timer: 2500
      });
      fetchHistory();
    } catch (error) {
      ConfirmToast.fire({
        icon: 'error',
        title: error.response?.data?.message || 'Erreur lors de la restauration',
        showConfirmButton: false,
        timer: 2500
      });
    } finally {
      setRestoring(false);
    }
  };

  const deleteSelected = async () => {
    if (!selected.length) return;

    const result = await ConfirmToast.fire({
      icon: 'warning',
      title: `Supprimer ${selected.length} trace(s) ?`,
      confirmButtonColor: '#ef4444',
    });

    if (!result.isConfirmed) return;

    try {
      setDeleting(true);
      await Promise.all(selected.map(id => axios.post(`/audit-logs/delete/${id}`)));
      setLogs(prev => prev.filter(log => !selected.includes(log.id)));
      setSelected([]);
      ConfirmToast.fire({
        icon: 'success',
        title: 'Sélection supprimée avec succès',
        showConfirmButton: false,
        timer: 2500
      });
    } catch (error) {
      ConfirmToast.fire({
        icon: 'error',
        title: 'Erreur lors de la suppression',
        showConfirmButton: false,
        timer: 2500
      });
    } finally {
      setDeleting(false);
    }
  };

  const actionLabel = {
    POST: 'Ajout',
    PUT: 'Modification',
    DELETE: 'Suppression'
  };

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
            <ShieldCheck size={20} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-display font-semibold text-slate-900 dark:text-white leading-tight">Journal d'Audit</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Suivi des modifications et activités de la plateforme.</p>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          className={`h-10 px-3.5 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2 text-sm font-medium shadow-sm transition-colors shrink-0 ${focusRing}`}
        >
          <RefreshCw size={16} className={`text-slate-500 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:block">Actualiser</span>
        </button>
      </header>

      {/* Contenu principal défilable */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {/* Guide d'utilisation */}
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 text-sm flex items-start gap-3">
          <Info size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Guide d'utilisation</span>
            <p className="text-emerald-800/90 dark:text-emerald-300/80 text-[13px] leading-relaxed">
              Sélectionnez les messages à supprimer ou à restaurer, ou utilisez « Sélectionner tout ». Cliquez sur un message pour afficher ses détails. Seules les traces de suppression peuvent être restaurées.
            </p>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={17} />
          <input
            type="text"
            placeholder="Rechercher par utilisateur, table ou action..."
            aria-label="Rechercher par utilisateur, table ou action"
            className={fieldClass + " pl-10 pr-10"}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Liste / Tableau des logs */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-4 md:px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={selectAll}
              className={`flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors ${focusRing} rounded-md p-1 -m-1`}
            >
              {selected.length === filteredLogs.length && filteredLogs.length > 0 ? (
                <CheckSquare size={17} className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Square size={17} className="text-slate-400" />
              )}
              {selected.length === filteredLogs.length && filteredLogs.length > 0 ? 'Désélectionner tout' : 'Sélectionner tout'}
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {selected.length > 0 && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-2">
                  {selected.length} sélectionné(s)
                </span>
              )}

              <button
                onClick={restoreSelected}
                disabled={!selected.length || restoring}
                className={`h-9 px-3 rounded-lg inline-flex items-center gap-2 text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${focusRing}`}
              >
                <RotateCcw size={14} className={restoring ? 'animate-spin' : ''} />
                <span>Restaurer la sélection</span>
              </button>

              <button
                onClick={deleteSelected}
                disabled={!selected.length || deleting}
                className={`h-9 px-3 rounded-lg inline-flex items-center gap-2 text-xs font-medium bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-slate-300 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${focusRing}`}
              >
                <Trash2 size={14} />
                <span>Supprimer la sélection</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <div className="p-12 text-center text-emerald-600">
                <RefreshCw size={24} className="animate-spin inline" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">Aucun journal d'audit disponible</div>
            ) : (
              filteredLogs.map((log, index) => {
                const details = parseDetails(log.details);
                const changes = getChanges(details);
                const deletedData = getDeletedData(details);
                const createdData = getCreatedData(details);
                const isExpanded = expanded === index;
                const isSelected = selected.includes(log.id);
                const userName = log.User?.name || 'Administrateur';
                const tableName = log.table_name?.split('/')[2] || 'inconnu';
                const entityName = getEntityName(details, log);

                return (
                  <div key={log.id || index} className={`transition-colors ${isSelected ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : 'bg-white dark:bg-slate-900'} hover:bg-slate-50 dark:hover:bg-slate-800/50`}>
                    <div className="flex items-start gap-3 px-4 md:px-5 py-4">
                      <button
                        onClick={e => { e.stopPropagation(); toggleSelect(log.id); }}
                        className={`mt-1 shrink-0 text-slate-400 hover:text-emerald-600 transition-colors ${focusRing} rounded-md`}
                      >
                        {isSelected ? <CheckSquare size={17} className="text-emerald-600 dark:text-emerald-400" /> : <Square size={17} />}
                      </button>

                      <button onClick={() => setExpanded(isExpanded ? null : index)} className="flex-1 min-w-0 text-left">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60">
                            <Mail size={16} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">{userName}</span>
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium uppercase shrink-0 ${log.action_type === 'DELETE' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'}`}>
                                  {actionLabel[log.action_type] || log.action_type}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                                <Clock size={13} />
                                {new Date(log.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <Layers size={13} />
                              <span className="capitalize">{tableName}</span>
                              <span>•</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{entityName}</span>
                            </div>

                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 truncate">
                              {log.action_type === 'DELETE' ? 'Élément supprimé' : log.action_type === 'POST' ? 'Nouvel élément ajouté' : 'Élément modifié'} dans la table {tableName}.
                            </p>
                          </div>

                          <div className="shrink-0 mt-2 text-slate-400">
                            {isExpanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                          </div>
                        </div>
                      </button>

                      {log.action_type === 'DELETE' && (
                        <button
                          onClick={e => handleAction('restore', log, e)}
                          title="Restaurer cet élément"
                          className={`mt-1 shrink-0 p-2 rounded-lg bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${focusRing}`}
                        >
                          <RotateCcw size={15} />
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="px-5 md:px-14 pb-5">
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 space-y-4">
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            <strong className="text-emerald-700 dark:text-emerald-400">{userName}</strong> a effectué une action de <strong className="uppercase text-slate-900 dark:text-white">{actionLabel[log.action_type] || log.action_type}</strong> sur <strong className="text-slate-900 dark:text-white">{tableName}</strong> : <strong className="text-emerald-700 dark:text-emerald-400">"{entityName}"</strong>.
                          </p>

                          {log.action_type === 'PUT' && Object.keys(changes).length > 0 && (
                            <div className="space-y-2">
                              {Object.entries(changes).map(([key, value]) => (
                                <div key={key} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:justify-between gap-2 text-sm">
                                  <span className="text-slate-500 dark:text-slate-400 font-medium">{formatKey(key)}</span>
                                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                                    <span className="text-rose-500 line-through break-all">{formatValue(value?.old)}</span>
                                    <span className="text-slate-400">→</span>
                                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold break-all">{formatValue(value?.new)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {log.action_type === 'DELETE' && Object.keys(deletedData).length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-semibold text-rose-600 dark:text-rose-400 text-sm">Informations supprimées</h4>
                              {Object.entries(deletedData).map(([key, value]) => ['createdAt', 'updatedAt', 'created_at', 'updated_at'].includes(key) ? null : (
                                <div key={key} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-rose-200/60 dark:border-rose-900/40 flex flex-col md:flex-row md:justify-between gap-2 text-sm">
                                  <span className="text-slate-500 dark:text-slate-400 font-medium">{formatKey(key)}</span>
                                  <span className="text-rose-600 dark:text-rose-400 font-mono text-xs break-all">{formatValue(value)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {log.action_type === 'POST' && Object.keys(createdData).length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">Informations ajoutées</h4>
                              {Object.entries(createdData).map(([key, value]) => ['createdAt', 'updatedAt', 'created_at', 'updated_at', 'user_id'].includes(key) ? null : (
                                <div key={key} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 flex flex-col md:flex-row md:justify-between gap-2 text-sm">
                                  <span className="text-slate-500 dark:text-slate-400 font-medium">{formatKey(key)}</span>
                                  <span className="text-emerald-700 dark:text-emerald-400 font-mono text-xs break-all">{formatValue(value)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {log.action_type === 'PUT' && Object.keys(changes).length === 0 && (
                            <div className="text-sm text-slate-500 dark:text-slate-400">Aucune modification détaillée disponible pour cette trace.</div>
                          )}

                          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
                            {log.action_type === 'DELETE' && (
                              <button
                                onClick={e => handleAction('restore', log, e)}
                                className={`h-9 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center gap-2 text-xs font-medium shadow-sm transition-colors ${focusRing}`}
                              >
                                <RotateCcw size={14} /> Restaurer
                              </button>
                            )}
                            <button
                              onClick={e => handleAction('delete', log, e)}
                              className={`h-9 px-3.5 rounded-lg bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-slate-300 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-slate-800 inline-flex items-center gap-2 text-xs font-medium transition-colors ${focusRing}`}
                            >
                              <Trash2 size={14} /> Supprimer la trace
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;