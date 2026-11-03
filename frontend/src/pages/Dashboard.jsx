import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import domtoimage from 'dom-to-image-more';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import {
  Users, Building2, Network, ShieldCheck, GraduationCap,
  PieChart as PieIcon, Activity, Loader2, CalendarDays, Download,
  AlertTriangle, RefreshCw, Inbox
} from 'lucide-react';

const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E'];

const TOOLTIP_STYLE = {
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '12px',
  background: '#ffffff',
  color: '#0f172a',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
};

const KPI_CONFIG = [
  { key: 'membres', label: 'Membres', icon: Users },
  { key: 'groupes', label: 'Groupes GS', icon: Building2 },
  { key: 'reseaux', label: 'Réseaux', icon: Network },
  { key: 'responsables', label: 'Responsables', icon: ShieldCheck },
  { key: 'formations', label: 'Formations', icon: GraduationCap }
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900';

// --- Reusable pieces -------------------------------------------------

const DownloadButton = ({ id, filename, downloading, onDownload }) => (
  <button
    type="button"
    data-download-button
    onClick={() => onDownload(id, filename)}
    disabled={downloading === id}
    aria-label={`Télécharger le graphique "${filename}" en image`}
    className={`absolute top-3.5 right-3.5 z-20 h-8 w-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${focusRing}`}
    title="Télécharger en image"
  >
    {downloading === id
      ? <Loader2 size={15} className="animate-spin" aria-hidden="true" />
      : <Download size={15} aria-hidden="true" />}
  </button>
);

const ChartCard = ({ id, filename, title, icon: Icon, downloading, onDownload, isEmpty, children }) => (
  <div
    id={id}
    className="relative bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[350px]"
  >
    {!isEmpty && <DownloadButton id={id} filename={filename} downloading={downloading} onDownload={onDownload} />}

    <h3 className="font-display font-semibold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60 shrink-0">
        <Icon size={16} strokeWidth={2} aria-hidden="true" />
      </div>
      <span className="truncate">{title}</span>
    </h3>

    {isEmpty ? (
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
        <Inbox size={24} aria-hidden="true" />
        <p className="text-xs font-medium">Pas encore de données</p>
      </div>
    ) : (
      <div className="flex-1 w-full min-h-0">{children}</div>
    )}
  </div>
);

// --- Main component ----------------------------------------------------

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const fetchDashboardData = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/dashboard/stats', { signal });

      if (response.data && response.data.success) {
        setStats(response.data);
      } else {
        setError("Les données reçues sont incomplètes.");
      }
    } catch (err) {
      if (axios.isCancel?.(err) || err.name === 'CanceledError') return;
      console.error('Erreur chargement Dashboard:', err);
      setError("Impossible de charger le tableau de bord. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboardData(controller.signal);
    return () => controller.abort();
  }, [fetchDashboardData]);

  const downloadChart = async (id, filename) => {
    const element = document.getElementById(id);
    if (!element || downloading) return;

    const button = element.querySelector('[data-download-button]');

    try {
      setDownloading(id);
      if (button) button.style.visibility = 'hidden';

      const dataUrl = await domtoimage.toPng(element, {
        quality: 1,
        bgcolor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
        width: element.offsetWidth * 2,
        height: element.offsetHeight * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: `${element.offsetWidth}px`,
          height: `${element.offsetHeight}px`
        }
      });

      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erreur téléchargement:', err);
    } finally {
      if (button) button.style.visibility = 'visible';
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 size={32} className="animate-spin text-emerald-600 mb-3" aria-hidden="true" />
        <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">
          Chargement des données...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 gap-4 px-6 text-center">
        <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <AlertTriangle size={20} aria-hidden="true" />
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm max-w-sm">{error}</p>
        <button
          type="button"
          onClick={() => fetchDashboardData()}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium transition-colors ${focusRing}`}
        >
          <RefreshCw size={15} aria-hidden="true" />
          Réessayer
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const reseauxAutonomesPct = stats.kpis.reseaux > 0
    ? Math.round((stats.kpis.reseauxAutonomes / stats.kpis.reseaux) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors font-body text-slate-900 dark:text-slate-100 overflow-hidden relative antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
        .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
        @media (prefers-reduced-motion: reduce){.animate-in{animation:none!important}}
      `}</style>

      {/* En-tête de page */}
      <header className="px-4 md:px-6 py-4 md:py-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60">
            <Activity size={20} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-display font-semibold text-slate-900 dark:text-white leading-tight">
              Tableau de bord & Statistiques
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Vue d'ensemble des performances et indicateurs clés de la plateforme.
            </p>
          </div>
        </div>
      </header>

      {/* Contenu principal défilable */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {KPI_CONFIG.map((item) => (
            <div
              key={item.key}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5"
            >
              <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60">
                <item.icon size={18} strokeWidth={2} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                  {item.label}
                </p>
                <p className="text-xl font-display font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {stats.kpis[item.key] ?? 0}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1. Équilibre du programme */}
          <ChartCard
            id="chart-equilibre" filename="equilibre-programme" title="Équilibre du programme"
            icon={PieIcon} downloading={downloading} onDownload={downloadChart}
            isEmpty={!stats.resumeData?.length}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.resumeData}
                  dataKey="A"
                  nameKey="subject"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  label
                >
                  {stats.resumeData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 2. Taux de maîtrise par module */}
          <ChartCard
            id="chart-modules" filename="taux-maitrise-modules" title="Taux de maîtrise par module"
            icon={Activity} downloading={downloading} onDownload={downloadChart}
            isEmpty={!stats.moduleStats?.length}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.moduleStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="valeur" fill="#047857" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 3. Croissance des groupes */}
          <ChartCard
            id="chart-croissance" filename="croissance-groupes" title="Croissance des groupes (% par année)"
            icon={CalendarDays} downloading={downloading} onDownload={downloadChart}
            isEmpty={!stats.evolutionGS?.length}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={stats.evolutionGS}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <YAxis dataKey="year" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Répartition']} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="pourcentage" fill="#0284c7" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 4. Pyramide des âges */}
          <ChartCard
            id="chart-ages" filename="pyramide-ages" title="Pyramide des âges"
            icon={Users} downloading={downloading} onDownload={downloadChart}
            isEmpty={!stats.ageData?.length}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.ageData}>
                <defs>
                  <linearGradient id="colorAge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="value" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorAge)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-2">
          {/* 5. Maturité des réseaux */}
          <ChartCard
            id="chart-reseaux" filename="maturite-reseaux" title="Maturité des réseaux"
            icon={Network} downloading={downloading} onDownload={downloadChart}
            isEmpty={!stats.kpis.reseaux}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative">
                <ResponsiveContainer width={200} height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { value: stats.kpis.reseauxAutonomes },
                        { value: stats.kpis.reseaux - stats.kpis.reseauxAutonomes }
                      ]}
                      innerRadius={65} outerRadius={80} startAngle={180} endAngle={0}
                      dataKey="value" stroke="none"
                    >
                      <Cell fill="#f59e0b" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
                  <span className="text-2xl font-display font-bold text-slate-900 dark:text-white tabular-nums">
                    {reseauxAutonomesPct}%
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Autonomes
                  </span>
                </div>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
                {stats.kpis.reseauxAutonomes} sur {stats.kpis.reseaux} réseaux
              </p>
            </div>
          </ChartCard>

          {/* 6. Répartition des postes */}
          <ChartCard
            id="chart-postes" filename="repartition-postes" title="Répartition des postes"
            icon={ShieldCheck} downloading={downloading} onDownload={downloadChart}
            isEmpty={!stats.respData?.length}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.respData} innerRadius={0} outerRadius={75} paddingAngle={2} dataKey="valeur" label>
                  {stats.respData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;