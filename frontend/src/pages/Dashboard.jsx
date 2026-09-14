import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import domtoimage from 'dom-to-image-more';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, AreaChart, Area
} from 'recharts';
import {
  Users, Home, Network, ShieldCheck, GraduationCap,
  Target, Activity, Loader2, CalendarDays, Download,
  AlertTriangle, RefreshCw, Inbox
} from 'lucide-react';

const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];

const TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  fontSize: '12px',
  background: '#ffffff',
  color: '#0f172a'
};

const KPI_CONFIG = [
  { key: 'membres', label: 'Membres', icon: Users, col: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40', bar: 'from-sky-400 to-sky-600' },
  { key: 'groupes', label: 'Groupes GS', icon: Home, col: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', bar: 'from-emerald-400 to-emerald-600' },
  { key: 'reseaux', label: 'Réseaux', icon: Network, col: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', bar: 'from-amber-400 to-amber-600' },
  { key: 'responsables', label: 'Responsables', icon: ShieldCheck, col: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40', bar: 'from-violet-400 to-violet-600' },
  { key: 'formations', label: 'Formations', icon: GraduationCap, col: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40', bar: 'from-rose-400 to-rose-600' }
];

// --- Reusable pieces -------------------------------------------------

const DownloadButton = ({ id, filename, downloading, onDownload }) => (
  <button
    type="button"
    data-download-button
    onClick={() => onDownload(id, filename)}
    disabled={downloading === id}
    aria-label={`Télécharger le graphique "${filename}" en image`}
    className="absolute top-4 right-4 z-20 w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-200 dark:hover:border-emerald-900/60 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
    title="Télécharger en image"
  >
    {downloading === id
      ? <Loader2 size={17} className="animate-spin" aria-hidden="true" />
      : <Download size={17} aria-hidden="true" />}
  </button>
);

const ChartCard = ({ id, filename, title, icon: Icon, iconWrapClass, iconClass, downloading, onDownload, isEmpty, children }) => (
  <div
    id={id}
    className="relative bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-sm"
  >
    {!isEmpty && <DownloadButton id={id} filename={filename} downloading={downloading} onDownload={onDownload} />}

    <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm mb-5 flex items-center gap-3">
      <span className={`p-2 bg-gradient-to-br ${iconWrapClass} rounded-xl ${iconClass}`}>
        <Icon size={17} aria-hidden="true" />
      </span>
      {title}
    </h3>

    {isEmpty ? (
      <div className="h-[280px] w-full flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
        <Inbox size={28} aria-hidden="true" />
        <p className="text-sm font-medium">Pas encore de données</p>
      </div>
    ) : (
      <div className="h-[280px] w-full">{children}</div>
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
        <Loader2 size={36} className="animate-spin text-emerald-500 mb-3" aria-hidden="true" />
        <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm tracking-wide">
          Chargement des données...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 gap-4 px-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <AlertTriangle size={22} aria-hidden="true" />
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm max-w-sm">{error}</p>
        <button
          type="button"
          onClick={() => fetchDashboardData()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
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
    <div className="w-full min-h-full p-4 md:p-6 font-body space-y-8 text-black dark:text-white transition-colors">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
        .font-body { font-family: 'DM Sans', sans-serif; }
        .font-display { font-family: 'Manrope', sans-serif; }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-sky-500 text-white rounded-2xl shrink-0 shadow-sm">
            <Target size={24} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
              Tableau de bord & Statistiques
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Vue d'ensemble des performances et indicateurs clés de la plateforme.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {KPI_CONFIG.map((item) => (
          <div
            key={item.key}
            className="relative bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-400/40 dark:hover:border-emerald-500/30 overflow-hidden flex items-center gap-4"
          >
            <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.bar}`} />
            <div className={`${item.bg} ${item.col} w-12 h-12 flex items-center justify-center rounded-xl shrink-0`}>
              <item.icon size={22} aria-hidden="true" />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-none mb-2">
                {item.label}
              </p>
              <p className="text-2xl font-display font-extrabold text-slate-900 dark:text-white leading-none">
                {stats.kpis[item.key] ?? 0}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          id="chart-equilibre" filename="equilibre-programme" title="Équilibre du programme"
          icon={Target} iconWrapClass="from-sky-50 to-emerald-50 dark:from-sky-950/40 dark:to-emerald-950/30" iconClass="text-sky-600 dark:text-sky-400"
          downloading={downloading} onDownload={downloadChart}
          isEmpty={!stats.resumeData?.length}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={stats.resumeData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: '600', fill: '#64748b' }} />
              <Radar name="ONG" dataKey="A" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.35} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          id="chart-modules" filename="taux-maitrise-modules" title="Taux de maîtrise par module"
          icon={Activity} iconWrapClass="from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30" iconClass="text-emerald-600 dark:text-emerald-400"
          downloading={downloading} onDownload={downloadChart}
          isEmpty={!stats.moduleStats?.length}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.moduleStats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: '500' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="valeur" fill="#10B981" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          id="chart-croissance" filename="croissance-groupes" title="Croissance des groupes (% par année)"
          icon={CalendarDays} iconWrapClass="from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30" iconClass="text-emerald-600 dark:text-emerald-400"
          downloading={downloading} onDownload={downloadChart}
          isEmpty={!stats.evolutionGS?.length}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.evolutionGS}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: '500' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(value) => [`${value}%`, 'Répartition']} contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="pourcentage" fill="#10B981" radius={[6, 6, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          id="chart-ages" filename="pyramide-ages" title="Pyramide des âges"
          icon={Users} iconWrapClass="from-sky-50 to-emerald-50 dark:from-sky-950/40 dark:to-emerald-950/30" iconClass="text-sky-600 dark:text-sky-400"
          downloading={downloading} onDownload={downloadChart}
          isEmpty={!stats.ageData?.length}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.ageData}>
              <defs>
                <linearGradient id="colorAge" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: '500' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="value" stroke="#0EA5E9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAge)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          id="chart-reseaux" filename="maturite-reseaux" title="Maturité des réseaux"
          icon={Network} iconWrapClass="from-amber-50 to-emerald-50 dark:from-amber-950/30 dark:to-emerald-950/30" iconClass="text-amber-600 dark:text-amber-400"
          downloading={downloading} onDownload={downloadChart}
          isEmpty={!stats.kpis.reseaux}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie
                    data={[
                      { value: stats.kpis.reseauxAutonomes },
                      { value: stats.kpis.reseaux - stats.kpis.reseauxAutonomes }
                    ]}
                    innerRadius={75} outerRadius={92} startAngle={180} endAngle={0}
                    dataKey="value" stroke="none"
                  >
                    <Cell fill="#F59E0B" />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                <span className="text-3xl font-display font-extrabold text-slate-900 dark:text-white">
                  {reseauxAutonomesPct}%
                </span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Autonomes
                </span>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-3">
              {stats.kpis.reseauxAutonomes} sur {stats.kpis.reseaux} réseaux
            </p>
          </div>
        </ChartCard>

        <ChartCard
          id="chart-postes" filename="repartition-postes" title="Répartition des postes"
          icon={ShieldCheck} iconWrapClass="from-violet-50 to-sky-50 dark:from-violet-950/30 dark:to-sky-950/30" iconClass="text-violet-600 dark:text-violet-400"
          downloading={downloading} onDownload={downloadChart}
          isEmpty={!stats.respData?.length}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats.respData} innerRadius={70} outerRadius={92} paddingAngle={4} dataKey="valeur">
                {stats.respData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;