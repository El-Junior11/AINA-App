import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import domtoimage from 'dom-to-image-more';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Users, Home, Network, ShieldCheck, GraduationCap,
  Target, Activity, Loader2, CalendarDays, Download,
  AlertTriangle, RefreshCw, Inbox
} from 'lucide-react';

const CHART_COLORS = ['#059669', '#64748B', '#94A3B8', '#CBD5E1', '#475569'];

const TOOLTIP_STYLE = {
  borderRadius: '8px',
  border: '1px solid #E2E8F0',
  fontSize: '12px',
  background: '#FFFFFF',
  color: '#172033',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)'
};

const KPI_CONFIG = [
  { key: 'membres', label: 'Membres', icon: Users },
  { key: 'groupes', label: 'Groupes GS', icon: Home },
  { key: 'reseaux', label: 'Réseaux', icon: Network },
  { key: 'responsables', label: 'Responsables', icon: ShieldCheck },
  { key: 'formations', label: 'Formations', icon: GraduationCap }
];

// --- Reusable components ---------------------------------------------

const DownloadButton = ({ id, filename, downloading, onDownload }) => (
  <button
    type="button"
    data-download-button
    onClick={() => onDownload(id, filename)}
    disabled={downloading === id}
    aria-label={`Télécharger le graphique "${filename}" en image`}
    className="absolute top-5 right-5 z-20 w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-emerald-700 hover:bg-slate-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
    title="Télécharger en image"
  >
    {downloading === id
      ? <Loader2 size={17} className="animate-spin" aria-hidden="true" />
      : <Download size={17} aria-hidden="true" />}
  </button>
);

const ChartCard = ({
  id,
  filename,
  title,
  icon: Icon,
  downloading,
  onDownload,
  isEmpty,
  children
}) => (
  <section
    id={id}
    className="relative bg-white p-6 rounded-xl border border-slate-200 transition-shadow hover:shadow-sm"
  >
    {!isEmpty && (
      <DownloadButton
        id={id}
        filename={filename}
        downloading={downloading}
        onDownload={onDownload}
      />
    )}

    <h3 className="font-display font-semibold text-slate-800 text-sm mb-6 flex items-center gap-3 pr-12">
      <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
        <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
      </span>
      {title}
    </h3>

    {isEmpty ? (
      <div className="h-[280px] w-full flex flex-col items-center justify-center gap-3 text-slate-400">
        <Inbox size={26} strokeWidth={1.5} aria-hidden="true" />
        <p className="text-sm font-medium">Pas encore de données</p>
      </div>
    ) : (
      <div className="h-[280px] w-full">
        {children}
      </div>
    )}
  </section>
);

// --- Main component --------------------------------------------------

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
      setError(
        "Impossible de charger le tableau de bord. Vérifiez votre connexion et réessayez."
      );
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

      const isDarkMode = document.documentElement.classList.contains('dark');

      const dataUrl = await domtoimage.toPng(element, {
        quality: 1,
        bgcolor: isDarkMode ? '#0F172A' : '#FFFFFF',
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
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2
          size={32}
          className="animate-spin text-emerald-600 mb-3"
          aria-hidden="true"
        />
        <p className="font-medium text-slate-500 text-sm">
          Chargement des données...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 px-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertTriangle size={22} aria-hidden="true" />
        </div>

        <p className="font-medium text-slate-700 text-sm max-w-sm">
          {error}
        </p>

        <button
          type="button"
          onClick={() => fetchDashboardData()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          <RefreshCw size={15} aria-hidden="true" />
          Réessayer
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="w-full min-h-full p-4 md:p-6 font-body space-y-7 text-slate-900 bg-slate-50/50 transition-colors">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');

        .font-body {
          font-family: 'DM Sans', sans-serif;
        }

        .font-display {
          font-family: 'Manrope', sans-serif;
        }
      `}</style>

      {/* Page heading */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
            <Target size={21} strokeWidth={1.8} aria-hidden="true" />
          </div>

          <div>
            <h1 className="text-lg font-display font-bold text-slate-900 tracking-tight">
              Tableau de bord & Statistiques
            </h1>

            <p className="text-sm text-slate-500 font-medium mt-1">
              Vue d'ensemble des performances et indicateurs clés de la plateforme.
            </p>
          </div>
        </div>
      </div>

      {/* KPI cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {KPI_CONFIG.map((item) => (
          <div
            key={item.key}
            className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 transition-shadow hover:shadow-sm"
          >
            <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <item.icon size={21} strokeWidth={1.8} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500 leading-tight mb-2">
                {item.label}
              </p>

              <p className="text-2xl font-display font-bold text-slate-900 leading-none">
                {stats.kpis[item.key] ?? 0}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid of 6 Pie Charts - based on image_0.png */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Chart 1: Équilibre (Radar data -> Pie) */}
        <ChartCard
          id="chart-equilibre"
          filename="equilibre-programme"
          title="Équilibre du programme"
          icon={Target}
          downloading={downloading}
          onDownload={downloadChart}
          isEmpty={!stats.resumeData?.length}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.resumeData}
                dataKey="A"
                nameKey="subject"
                cx="50%" cy="50%"
                outerRadius={90}
                label
              >
                {stats.resumeData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 2: Taux Maîtrise (Bar data -> Pie) */}
        <ChartCard
          id="chart-modules"
          filename="taux-maitrise-modules"
          title="Taux de maîtrise par module"
          icon={Activity}
          downloading={downloading}
          onDownload={downloadChart}
          isEmpty={!stats.moduleStats?.length}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.moduleStats}
                dataKey="valeur"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={90}
                label
              >
                {stats.moduleStats?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 3: Croissance (Bar data -> Pie) */}
        <ChartCard
          id="chart-croissance"
          filename="croissance-groupes"
          title="Croissance des groupes"
          icon={CalendarDays}
          downloading={downloading}
          onDownload={downloadChart}
          isEmpty={!stats.evolutionGS?.length}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.evolutionGS}
                dataKey="pourcentage"
                nameKey="year"
                cx="50%" cy="50%"
                outerRadius={90}
                label
              >
                {stats.evolutionGS?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} contentStyle={TOOLTIP_STYLE} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 4: Pyramide des âges (Area data -> Pie) */}
        <ChartCard
          id="chart-ages"
          filename="pyramide-ages"
          title="Pyramide des âges"
          icon={Users}
          downloading={downloading}
          onDownload={downloadChart}
          isEmpty={!stats.ageData?.length}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.ageData}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={90}
                label
              >
                {stats.ageData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 5: Maturité des réseaux (Original Pie, kept as is) */}
        <ChartCard
          id="chart-reseaux"
          filename="maturite-reseaux"
          title="Maturité des réseaux"
          icon={Network}
          downloading={downloading}
          onDownload={downloadChart}
          isEmpty={!stats.kpis.reseaux}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Autonomes', valeur: stats.kpis.reseauxAutonomes },
                    { name: 'Autres', valeur: stats.kpis.reseaux - stats.kpis.reseauxAutonomes }
                  ]}
                  dataKey="valeur"
                  nameKey="name"
                  cx="50%" cy="50%"
                  outerRadius={90}
                  label
                >
                  <Cell fill="#059669" />
                  <Cell fill="#E2E8F0" />
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 6: Répartition postes (Original Pie, kept as is) */}
        <ChartCard
          id="chart-postes"
          filename="repartition-postes"
          title="Répartition des postes"
          icon={ShieldCheck}
          downloading={downloading}
          onDownload={downloadChart}
          isEmpty={!stats.respData?.length}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.respData}
                dataKey="valeur"
                nameKey="nom"
                cx="50%" cy="50%"
                outerRadius={90}
                label
              >
                {stats.respData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  );
};

export default Dashboard;