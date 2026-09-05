
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import {
  Trash2, RotateCcw, ShieldCheck, ChevronDown, ChevronUp,
  Search, RefreshCw, Clock, User, Layers, Info
} from 'lucide-react';
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

const AdminNotifications = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/audit-logs');
      const data = await response.json();
      const logsArray = Array.isArray(data) ? data : [];
      setLogs(logsArray);
      setFilteredLogs(logsArray);
    } catch (error) {
      setLogs([]);
      setFilteredLogs([]);
      Toast.fire({ icon: 'error', title: 'Erreur de chargement des logs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const socket = io('http://localhost:5000', { transports: ['websocket'] });
    socket.on('admin_alert', (newData) => {
      setLogs((prev) => {
        const updated = [newData, ...prev].slice(0, 50);
        return updated;
      });
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

  const formatKey = (key) => key.replace(/_/g, ' ').toUpperCase();

  const handleAction = async (actionType, log, e) => {
    e.stopPropagation();

    const isDark = document.documentElement.classList.contains('dark');

    const result = await Swal.fire({
      title: 'Confirmer ?',
      text: actionType === 'delete' ? "Voulez-vous supprimer cette trace ?" : "Voulez-vous restaurer cet élément ?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: actionType === 'delete' ? '#ef4444' : '#0284c7',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui, confirmer',
      cancelButtonText: 'Annuler',
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#ffffff' : '#0f172a',
      customClass: {
        popup: 'rounded-2xl border border-emerald-100 dark:border-slate-800 text-sm font-medium shadow-xl p-4'
      }
    });

    if (result.isConfirmed) {
      try {
        await fetch(`http://localhost:5000/api/audit-logs/${actionType}/${log.target_id}`, { method: 'POST' });
        Toast.fire({ icon: 'success', title: 'Action effectuée avec succès' });

        if (actionType === 'delete') {
          setLogs((prev) => prev.filter(l => l.target_id !== log.target_id));
        }
      } catch (error) {
        Toast.fire({ icon: 'error', title: 'Une erreur est survenue' });
      }
    }
  };

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
            <ShieldCheck size={24} />
          </div>

          <div>
            <h1 className="text-lg font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
              Journal d'Audit
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Suivi détaillé des modifications & activités de la plateforme.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl transition-all font-bold text-sm border border-emerald-100 dark:border-emerald-900/40 cursor-pointer w-fit"
          title="Rafraîchir"
        >
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          <span>Actualiser</span>
        </button>
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
              <li>Utilisez la barre de recherche pour filtrer les logs par utilisateur, table ou action.</li>
              <li>Cliquez sur une ligne pour afficher ou masquer les détails approfondis des modifications.</li>
              <li>Vous pouvez restaurer des éléments ou supprimer des traces selon les besoins de sécurité.</li>
              <li>Les alertes en temps réel s'actualisent automatiquement via les web sockets.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="relative group w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />

        <input
          type="text"
          placeholder="Rechercher par utilisateur, table ou action..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">

        <div className="bg-slate-50 dark:bg-slate-800/80 text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 px-5 py-4 grid grid-cols-12 gap-4 items-center">
          <span className="col-span-3">Utilisateur</span>
          <span className="col-span-2 text-center">Action</span>
          <span className="col-span-3">Table concernée</span>
          <span className="col-span-3 text-right">Date</span>
          <span className="col-span-1 text-right">Détails</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {loading ? (
            <div className="p-14 text-center text-emerald-500">
              <RefreshCw size={30} className="animate-spin inline" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-14 text-center text-slate-500 dark:text-slate-400 font-medium text-sm">
              Aucun journal d'audit disponible
            </div>
          ) : (
            filteredLogs.map((log, index) => {
              const actionLabels = { 'POST': 'ajout', 'PUT': 'modification', 'DELETE': 'suppression' };
              const rawDetails = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
              const details = rawDetails || {};

              const isExpanded = expanded === index;
              const userName = log.User?.name || 'Administrateur';
              const tableName = log.table_name?.split('/')[2] || 'inconnu';
              const entityName = details.nom || details.message || `ID: ${log.target_id}`;

              return (
                <div key={index} className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/40 transition-colors">
                  <div
                    className="px-5 py-4 grid grid-cols-12 gap-4 items-center cursor-pointer text-sm"
                    onClick={() => setExpanded(isExpanded ? null : index)}
                  >
                    <div className="col-span-3 flex items-center gap-3 truncate">
                      <div className="p-2 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                        <User size={16} />
                      </div>

                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {userName}
                      </span>
                    </div>

                    <div className="col-span-2 text-center">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase inline-block border ${
                        log.action_type === 'DELETE'
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                      }`}>
                        {actionLabels[log.action_type] || log.action_type}
                      </span>
                    </div>

                    <div className="col-span-3 text-slate-700 dark:text-slate-300 font-medium capitalize truncate flex items-center gap-2">
                      <Layers size={16} className="text-slate-400 shrink-0" />
                      <span className="truncate">{tableName}</span>
                    </div>

                    <div className="col-span-3 text-right text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center justify-end gap-2">
                      <Clock size={15} className="text-slate-400 shrink-0" />
                      {new Date(log.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>

                    <div className="col-span-1 text-right flex justify-end">
                      {isExpanded ? (
                        <ChevronUp size={19} className="text-emerald-500" />
                      ) : (
                        <ChevronDown size={19} className="text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-7 py-5 bg-gradient-to-br from-emerald-50/50 to-sky-50/40 dark:from-slate-950/60 dark:to-slate-900/50 border-t border-slate-100 dark:border-slate-800/80 text-sm space-y-4">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{userName}</span> a effectué une action de
                        <strong className="mx-1 text-slate-900 dark:text-white uppercase">{actionLabels[log.action_type] || log.action_type}</strong>
                        sur la table <strong className="text-slate-900 dark:text-white">{tableName}</strong> :
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">"{entityName}"</span>.
                      </p>

                      {log.action_type === 'PUT' && Object.keys(details).length > 0 && (
                        <div className="space-y-2 my-4">
                          {Object.entries(details).map(([key, val]) => {
                            if (['nom', 'message'].includes(key)) return null;
                            const isDiff = val && typeof val === 'object' && ('old' in val || 'new' in val);

                            return (
                              <div key={key} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm">
                                <span className="text-slate-500 dark:text-slate-400 font-semibold">
                                  {formatKey(key)}
                                </span>

                                {isDiff ? (
                                  <div className="flex items-center gap-2 font-mono">
                                    <span className="text-rose-500 line-through">{String(val.old ?? 'vide')}</span>
                                    <span className="text-slate-400">→</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{String(val.new ?? 'vide')}</span>
                                  </div>
                                ) : (
                                  <span className="text-sky-600 dark:text-sky-400 font-mono">
                                    {String(val)}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="pt-4 flex items-center gap-3 border-t border-slate-200/60 dark:border-slate-800">
                        <button
                          onClick={(e) => handleAction('restore', log, e)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-sm rounded-xl transition-all border border-emerald-100 dark:border-emerald-900/40 cursor-pointer"
                        >
                          <RotateCcw size={16} />
                          Restaurer
                        </button>

                        <button
                          onClick={(e) => handleAction('delete', log, e)}
                          className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold text-sm rounded-xl transition-all border border-rose-100 dark:border-rose-900/40 cursor-pointer"
                        >
                          <Trash2 size={16} />
                          Supprimer la trace
                        </button>
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
  );
};

export default AdminNotifications;
