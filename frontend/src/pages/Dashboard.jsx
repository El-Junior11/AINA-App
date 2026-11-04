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

// Palette sobre, alignée sur le reste de l'application
const COLORS = ['#0284c7', '#16a34a', '#f59e0b', '#6366f1', '#e11d48'];

// Couleurs des graphiques selon le thème clair / sombre
const getChartTheme = (isDark) => isDark
  ? { grid: '#334155', tick: '#94a3b8', legend: '#cbd5e1', tooltipBg: '#0f172a', tooltipBorder: '#334155', tooltipText: '#f1f5f9', cursor: 'rgba(255,255,255,0.05)' }
  : { grid: '#e2e8f0', tick: '#64748b', legend: '#475569', tooltipBg: '#ffffff', tooltipBorder: '#cbd5e1', tooltipText: '#0f172a', cursor: 'rgba(0,0,0,0.03)' };

const getTooltipStyle = (theme) => ({
  borderRadius: '8px',
  border: `1px solid ${theme.tooltipBorder}`,
  fontSize: '12px',
  background: theme.tooltipBg,
  color: theme.tooltipText,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
});

const KPI_CONFIG = [
  { key: 'membres', label: 'Membres', icon: Users },
  { key: 'groupes', label: 'Groupes GS', icon: Building2 },
  { key: 'reseaux', label: 'Réseaux', icon: Network },
  { key: 'responsables', label: 'Responsables', icon: ShieldCheck },
  { key: 'formations', label: 'Formations', icon: GraduationCap }
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900';

// Suit le thème sombre de l'application (classe "dark" sur <html>)
const useIsDark = () => {
  const read = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const [isDark, setIsDark] = useState(read);

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
};

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

    <h3 className="font-display font-semibold text-slate-900 dark:text-white text-sm mb-4 pr-10 flex items-center gap-2.5">
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

// Camembert en perspective (3D) : pourcentages dans les parts, tranche visible sur le bord avant
const Pie3D = ({ slices }) => {
  const cx = 130;
  const cy = 78;
  const rx = 108;
  const ry = 64;
  const depth = 24;

  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  const visible = slices.filter((s) => s.value > 0);

  // Point sur l'ellipse (angle en radians, 0 = droite, sens horaire à l'écran)
  const point = (angle, dy = 0, k = 1) => [
    cx + rx * k * Math.cos(angle),
    cy + ry * k * Math.sin(angle) + dy
  ];

  let angle = -Math.PI / 2; // départ à midi
  const arcs = visible.map((s) => {
    const sweep = (s.value / total) * Math.PI * 2;
    const arc = { ...s, a1: angle, a2: angle + sweep };
    angle += sweep;
    return arc;
  });

  const isFull = arcs.length === 1;

  return (
    <svg
      viewBox="0 0 260 180"
      className="w-full max-w-[300px] h-auto"
      role="img"
      aria-label={slices.map((s) => `${s.label} : ${s.pct}%`).join(', ')}
    >
      <defs>
        {slices.map((s, i) => (
          <linearGradient key={s.label} id={`pie3d-grad-${i}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={s.top1} />
            <stop offset="1" stopColor={s.top2} />
          </linearGradient>
        ))}
      </defs>

      {/* Ombre portée */}
      <ellipse cx={cx} cy={cy + depth + 8} rx={rx * 0.92} ry={ry * 0.42} fill="#0f172a" opacity="0.1" />

      {/* Tranche (bord avant) */}
      {isFull ? (
        <path
          d={`M ${cx - rx} ${cy} L ${cx - rx} ${cy + depth} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy + depth} L ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy} Z`}
          fill={arcs[0].side}
        />
      ) : (
        arcs.map((s) => {
          const start = Math.max(s.a1, 0);
          const end = Math.min(s.a2, Math.PI);
          if (start >= end) return null;
          const [xs, ys] = point(start);
          const [xe, ye] = point(end);
          return (
            <path
              key={`wall-${s.label}`}
              d={`M ${xs} ${ys} L ${xs} ${ys + depth} A ${rx} ${ry} 0 0 1 ${xe} ${ye + depth} L ${xe} ${ye} A ${rx} ${ry} 0 0 0 ${xs} ${ys} Z`}
              fill={s.side}
            />
          );
        })
      )}

      {/* Dessus du camembert */}
      {arcs.map((s) => {
        const index = slices.findIndex((x) => x.label === s.label);
        if (isFull) {
          return <ellipse key={`top-${s.label}`} cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#pie3d-grad-${index})`} />;
        }
        const [x1, y1] = point(s.a1);
        const [x2, y2] = point(s.a2);
        const large = s.a2 - s.a1 > Math.PI ? 1 : 0;
        return (
          <path
            key={`top-${s.label}`}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${rx} ${ry} 0 ${large} 1 ${x2} ${y2} Z`}
            fill={`url(#pie3d-grad-${index})`}
            stroke="#ffffff"
            strokeOpacity="0.55"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        );
      })}

      {/* Pourcentages */}
      {arcs.map((s) => {
        if (s.pct < 3) return null;
        const [lx, ly] = isFull ? [cx, cy] : point((s.a1 + s.a2) / 2, 0, 0.6);
        return (
          <text
            key={`label-${s.label}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="16"
            fontWeight="700"
            fill="#ffffff"
            stroke="rgba(15,23,42,0.35)"
            strokeWidth="3"
            paintOrder="stroke"
          >
            {s.pct}%
          </text>
        );
      })}
    </svg>
  );
};

// --- Main component ----------------------------------------------------

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const isDark = useIsDark();

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
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 size={32} className="animate-spin text-emerald-600 mb-3" aria-hidden="true" />
        <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">
          Chargement des données...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4 px-6 text-center">
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

  const theme = getChartTheme(isDark);
  const tooltipStyle = getTooltipStyle(theme);
  const axisTick = { fontSize: 11, fill: theme.tick };
  const legendFormatter = (value) => <span style={{ color: theme.legend }}>{value}</span>;

  const reseauxTotal = stats.kpis.reseaux || 0;
  const reseauxAutonomes = stats.kpis.reseauxAutonomes || 0;
  const reseauxEnStructuration = Math.max(reseauxTotal - reseauxAutonomes, 0);
  const reseauxAutonomesPct = reseauxTotal > 0
    ? Math.round((reseauxAutonomes / reseauxTotal) * 100)
    : 0;

  // Parts du camembert « Maturité des réseaux » (haut du dégradé, bas du dégradé, couleur de la tranche)
  const maturiteSlices = [
    { label: 'Autonomes', value: reseauxAutonomes, pct: reseauxAutonomesPct, top1: '#22c55e', top2: '#16a34a', side: '#166534' },
    { label: 'En structuration', value: reseauxEnStructuration, pct: reseauxTotal > 0 ? 100 - reseauxAutonomesPct : 0, top1: '#fbbf24', top2: '#d97706', side: '#92400e' }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors font-body text-slate-900 dark:text-slate-100 overflow-hidden relative antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
        .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
        .recharts-wrapper text, .recharts-legend-wrapper{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
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
                  paddingAngle={2}
                  stroke={isDark ? "#0f172a" : "#ffffff"}
                  strokeWidth={2}
                  label={{ fill: theme.tick, fontSize: 12 }}
                >
                  {stats.resumeData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: theme.tooltipText }} labelStyle={{ color: theme.tooltipText }} />
                <Legend iconType="circle" formatter={legendFormatter} wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} />
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                <Tooltip cursor={{ fill: theme.cursor }} contentStyle={tooltipStyle} itemStyle={{ color: theme.tooltipText }} labelStyle={{ color: theme.tooltipText }} />
                <Bar dataKey="valeur" fill="#16a34a" fillOpacity={1} radius={[5, 5, 0, 0]} barSize={28} />
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
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.grid} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={axisTick} unit="%" />
                <YAxis dataKey="year" type="category" axisLine={false} tickLine={false} tick={axisTick} />
                <Tooltip cursor={{ fill: theme.cursor }} formatter={(value) => [`${value}%`, 'Répartition']} contentStyle={tooltipStyle} itemStyle={{ color: theme.tooltipText }} labelStyle={{ color: theme.tooltipText }} />
                <Bar dataKey="pourcentage" fill="#0284c7" fillOpacity={1} radius={[0, 5, 5, 0]} barSize={20} />
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: theme.tooltipText }} labelStyle={{ color: theme.tooltipText }} />
                <Area type="monotone" dataKey="value" stroke="#0369a1" strokeWidth={2} fillOpacity={1} fill="#0284c7" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-2">
          {/* 5. Maturité des réseaux : camembert 3D avec légende à droite */}
          <ChartCard
            id="chart-reseaux" filename="maturite-reseaux" title="Maturité des réseaux"
            icon={Network} downloading={downloading} onDownload={downloadChart}
            isEmpty={!stats.kpis.reseaux}
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 min-h-0 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                <Pie3D slices={maturiteSlices} />

                <ul className="flex sm:flex-col flex-wrap justify-center gap-x-5 gap-y-2.5 shrink-0">
                  {maturiteSlices.map((s) => (
                    <li key={s.label} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span
                        className="h-3 w-3 rounded-sm shrink-0"
                        style={{ background: `linear-gradient(135deg, ${s.top1}, ${s.top2})` }}
                        aria-hidden="true"
                      />
                      <span className="font-medium">{s.label}</span>
                      <span className="text-slate-400 dark:text-slate-500 tabular-nums">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center mt-2 tabular-nums">
                {reseauxAutonomes} sur {reseauxTotal} réseaux autonomes
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
                <Pie data={stats.respData} innerRadius={0} outerRadius={75} paddingAngle={2} dataKey="valeur" stroke={isDark ? "#0f172a" : "#ffffff"} strokeWidth={2} label={{ fill: theme.tick, fontSize: 12 }}>
                  {stats.respData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: theme.tooltipText }} labelStyle={{ color: theme.tooltipText }} />
                <Legend iconType="circle" formatter={legendFormatter} wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;