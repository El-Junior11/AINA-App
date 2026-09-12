import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import domtoimage from 'dom-to-image-more';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, AreaChart, Area
} from 'recharts';
import {
  Users, Home, Network, ShieldCheck, GraduationCap,
  Target, Activity, Loader2, CalendarDays, Download
} from 'lucide-react';

const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const response = await axios.get('/dashboard/stats');

        if (response.data && response.data.success) {
          setStats(response.data);
        }
      } catch (err) {
        console.error('Erreur chargement Dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const downloadChart = async (id, filename) => {
    const element = document.getElementById(id);

    if (!element || downloading) return;

    try {
      setDownloading(id);

      const button = element.querySelector('[data-download-button]');

      if (button) {
        button.style.visibility = 'hidden';
      }

      const dataUrl = await domtoimage.toPng(element, {
        quality: 1,
        bgcolor: document.documentElement.classList.contains('dark')
          ? '#0f172a'
          : '#ffffff',
        width: element.offsetWidth * 2,
        height: element.offsetHeight * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: `${element.offsetWidth}px`,
          height: `${element.offsetHeight}px`
        }
      });

      if (button) {
        button.style.visibility = 'visible';
      }

      const link = document.createElement('a');

      link.download = `${filename}.png`;
      link.href = dataUrl;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur téléchargement:', error);

      const button = element.querySelector('[data-download-button]');

      if (button) {
        button.style.visibility = 'visible';
      }
    } finally {
      setDownloading(null);
    }
  };

  const DownloadButton = ({ id, filename }) => (
    <button
      data-download-button
      onClick={() => downloadChart(id, filename)}
      disabled={downloading === id}
      className="absolute top-4 right-4 z-20 w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-200 dark:hover:border-emerald-900/60 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      title="Télécharger en image"
    >
      {downloading === id
        ? <Loader2 size={17} className="animate-spin" />
        : <Download size={17} />
      }
    </button>
  );

  if (loading || !stats) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 size={36} className="animate-spin text-emerald-500 mb-3" />
        <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm tracking-wide">
          Chargement des données...
        </p>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Membres',
      val: stats.kpis.membres,
      icon: Users,
      col: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      bar: 'from-sky-400 to-sky-600'
    },
    {
      label: 'Groupes GS',
      val: stats.kpis.groupes,
      icon: Home,
      col: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      bar: 'from-emerald-400 to-emerald-600'
    },
    {
      label: 'Réseaux',
      val: stats.kpis.reseaux,
      icon: Network,
      col: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      bar: 'from-amber-400 to-amber-600'
    },
    {
      label: 'Responsables',
      val: stats.kpis.responsables,
      icon: ShieldCheck,
      col: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
      bar: 'from-violet-400 to-violet-600'
    },
    {
      label: 'Formations',
      val: stats.kpis.formations,
      icon: GraduationCap,
      col: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      bar: 'from-rose-400 to-rose-600'
    }
  ];

  return (
    <div className="w-full min-h-full p-4 md:p-6 font-body space-y-8 text-black dark:text-white transition-colors">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');

        .font-body {
          font-family: 'DM Sans', sans-serif;
        }

        .font-display {
          font-family: 'Manrope', sans-serif;
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-sky-500 text-white rounded-2xl shrink-0 shadow-sm">
            <Target size={24} />
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
        {kpiCards.map((item, i) => (
          <div
            key={i}
            className="relative bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-400/40 dark:hover:border-emerald-500/30 overflow-hidden flex items-center gap-4"
          >
            <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.bar}`} />

            <div className={`${item.bg} ${item.col} w-12 h-12 flex items-center justify-center rounded-xl shrink-0`}>
              <item.icon size={22} />
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-none mb-2">
                {item.label}
              </p>

              <p className="text-2xl font-display font-extrabold text-slate-900 dark:text-white leading-none">
                {item.val}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div id="chart-equilibre" className="relative bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-sm">
          <DownloadButton id="chart-equilibre" filename="equilibre-programme" />

          <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm mb-5 flex items-center gap-3">
            <span className="p-2 bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-950/40 dark:to-emerald-950/30 rounded-xl text-sky-600 dark:text-sky-400">
              <Target size={17} />
            </span>
            Équilibre du programme
          </h3>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={stats.resumeData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{
                    fontSize: 12,
                    fontWeight: '600',
                    fill: '#64748b'
                  }}
                />
                <Radar
                  name="ONG"
                  dataKey="A"
                  stroke="#0EA5E9"
                  fill="#0EA5E9"
                  fillOpacity={0.35}
                />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#0f172a' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div id="chart-modules" className="relative bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-sm">
          <DownloadButton id="chart-modules" filename="taux-maitrise-modules" />

          <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm mb-5 flex items-center gap-3">
            <span className="p-2 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Activity size={17} />
            </span>
            Taux de maîtrise par module
          </h3>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.moduleStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: '500' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', background: '#ffffff', color: '#0f172a' }} />
                <Bar dataKey="valeur" fill="#10B981" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div id="chart-croissance" className="relative bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-sm">
          <DownloadButton id="chart-croissance" filename="croissance-groupes" />

          <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm mb-5 flex items-center gap-3">
            <span className="p-2 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CalendarDays size={17} />
            </span>
            Croissance des groupes (% par année)
          </h3>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.evolutionGS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: '500' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip formatter={(value) => [`${value}%`, 'Répartition']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', background: '#ffffff', color: '#0f172a' }} />
                <Bar dataKey="pourcentage" fill="#10B981" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div id="chart-ages" className="relative bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-sm">
          <DownloadButton id="chart-ages" filename="pyramide-ages" />

          <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm mb-5 flex items-center gap-3">
            <span className="p-2 bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-950/40 dark:to-emerald-950/30 rounded-xl text-sky-600 dark:text-sky-400">
              <Users size={17} />
            </span>
            Pyramide des âges
          </h3>

          <div className="h-[280px] w-full">
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

                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', background: '#ffffff', color: '#0f172a' }} />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0EA5E9"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorAge)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div id="chart-reseaux" className="relative bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-sm">
          <DownloadButton id="chart-reseaux" filename="maturite-reseaux" />

          <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm mb-5 flex items-center gap-3">
            <span className="p-2 bg-gradient-to-br from-amber-50 to-emerald-50 dark:from-amber-950/30 dark:to-emerald-950/30 rounded-xl text-amber-600 dark:text-amber-400">
              <Network size={17} />
            </span>
            Maturité des réseaux
          </h3>

          <div className="flex flex-col items-center justify-center h-[280px]">
            <div className="relative">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie
                    data={[
                      { value: stats.kpis.reseauxAutonomes },
                      { value: stats.kpis.reseaux - stats.kpis.reseauxAutonomes }
                    ]}
                    innerRadius={75}
                    outerRadius={92}
                    startAngle={180}
                    endAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#F59E0B" />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                <span className="text-3xl font-display font-extrabold text-slate-900 dark:text-white">
                  {stats.kpis.reseaux > 0
                    ? Math.round((stats.kpis.reseauxAutonomes / stats.kpis.reseaux) * 100)
                    : 0}%
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
        </div>

        <div id="chart-postes" className="relative bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-sm">
          <DownloadButton id="chart-postes" filename="repartition-postes" />

          <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm mb-5 flex items-center gap-3">
            <span className="p-2 bg-gradient-to-br from-violet-50 to-sky-50 dark:from-violet-950/30 dark:to-sky-950/30 rounded-xl text-violet-600 dark:text-violet-400">
              <ShieldCheck size={17} />
            </span>
            Répartition des postes
          </h3>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.respData}
                  innerRadius={70}
                  outerRadius={92}
                  paddingAngle={4}
                  dataKey="valeur"
                >
                  {stats.respData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', background: '#ffffff', color: '#0f172a' }} />

                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;