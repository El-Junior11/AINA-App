import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, 
  PolarAngleAxis, Radar, AreaChart, Area
} from 'recharts';
import { 
  Users, Home, Network, ShieldCheck, GraduationCap, 
  Target, Activity, Loader2, CalendarDays
} from 'lucide-react';

const COLORS = ["#0284c7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = "http://localhost:5000/api";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        const response = await axios.get(`${API_BASE}/dashboard/stats`, config);
        
        if (response.data && response.data.success) {
          setStats(response.data);
        }
      } catch (err) {
        console.error("Erreur chargement Dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading || !stats) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950">
      <Loader2 size={32} className="animate-spin text-sky-500 mb-2" />
      <p className="font-medium text-slate-500 dark:text-slate-400 text-xs tracking-wide">Chargement des données...</p>
    </div>
  );

  return (
    <div className="w-full min-h-full p-4 md:p-6 font-sans space-y-6 text-black dark:text-white transition-colors">
      
      {/* SECTION EN-TÊTE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl shrink-0">
            <Target size={24} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Tableau de bord & Statistiques
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Vue d'ensemble des performances et indicateurs clés de la plateforme.
            </p>
          </div>
        </div>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Membres', val: stats.kpis.membres, icon: Users, col: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40' },
          { label: 'Groupes GS', val: stats.kpis.groupes, icon: Home, col: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Réseaux', val: stats.kpis.reseaux, icon: Network, col: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
          { label: 'Responsables', val: stats.kpis.responsables, icon: ShieldCheck, col: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
          { label: 'Formations', val: stats.kpis.formations, icon: GraduationCap, col: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 transition-all hover:border-sky-500/40 dark:hover:border-sky-500/30 flex items-center gap-3 shadow-xs">
            <div className={`${item.bg} ${item.col} w-10 h-10 flex items-center justify-center rounded-lg shrink-0 border border-sky-100/50 dark:border-slate-800`}>
              <item.icon size={20} />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-none mb-1">{item.label}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white leading-none">{item.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- SECTION 1: PERFORMANCE ET MODULES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-4 flex items-center gap-2">
            <Target size={15} className="text-sky-600 dark:text-sky-400"/> Équilibre du programme
          </h3>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={stats.resumeData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{fontSize: 11, fontWeight: '600', fill: '#64748b'}} />
                <Radar name="ONG" dataKey="A" stroke="#0284c7" fill="#0284c7" fillOpacity={0.4} />
                <Tooltip contentStyle={{borderRadius: '8px', fontSize: '11px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#0f172a'}} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-4 flex items-center gap-2">
            <Activity size={15} className="text-emerald-600 dark:text-emerald-400"/> Taux de maîtrise par module
          </h3>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.moduleStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: '500'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', background: '#ffffff', color: '#0f172a'}} />
                <Bar dataKey="valeur" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- SECTION 2: ANALYSE GS ET ÂGES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
              <CalendarDays size={15} className="text-emerald-600 dark:text-emerald-400"/> Croissance des groupes (% par année)
            </h3>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.evolutionGS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: '500'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11}} unit="%" />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Répartition']}
                  contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', background: '#ffffff', color: '#0f172a'}} 
                />
                <Bar dataKey="pourcentage" fill="#10b981" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-4">Pyramide des âges</h3>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.ageData}>
                <defs>
                  <linearGradient id="colorAge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: '500'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', background: '#ffffff', color: '#0f172a'}} />
                <Area type="monotone" dataKey="value" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorAge)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- SECTION 3: RÉSEAUX ET RESPONSABLES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-4">Maturité des réseaux</h3>
          <div className="flex flex-col items-center justify-center h-[260px]">
            <div className="relative">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie 
                    data={[
                      { value: stats.kpis.reseauxAutonomes }, 
                      { value: stats.kpis.reseaux - stats.kpis.reseauxAutonomes }
                    ]} 
                    innerRadius={70} outerRadius={85} startAngle={180} endAngle={0} dataKey="value" stroke="none"
                  >
                    <Cell fill="#f59e0b" />
                    <Cell fill="#e2e8f0" className="dark:fill-slate-800" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.kpis.reseaux > 0 ? Math.round((stats.kpis.reseauxAutonomes / stats.kpis.reseaux) * 100) : 0}%
                </span>
                <span className="text-[11px] font-medium text-slate-500">Autonomes</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2">
              {stats.kpis.reseauxAutonomes} sur {stats.kpis.reseaux} réseaux
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-4">Répartition des postes</h3>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.respData} innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="valeur">
                  {stats.respData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', background: '#ffffff', color: '#0f172a'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: '500'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;