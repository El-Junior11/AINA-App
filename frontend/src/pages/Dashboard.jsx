import React, { useState, useEffect, useMemo } from 'react';
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

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const Dashboard = () => {
  const [data, setData] = useState({ membres: [], gs: [], reseaux: [], responsables: [], formations: [] });
  const [loading, setLoading] = useState(true);

  const API_BASE = "http://localhost:5000/api";

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        const [resM, resG, resR, resP, resF] = await Promise.all([
          axios.get(`${API_BASE}/membres`, config).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/groupes`, config).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/reseaux`, config).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/responsables`, config).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/formations`, config).catch(() => ({ data: [] }))
        ]);

        setData({
          membres: Array.isArray(resM.data) ? resM.data : (resM.data?.data || []),
          gs: Array.isArray(resG.data) ? resG.data : (resG.data?.groupes || []),
          reseaux: Array.isArray(resR.data) ? resR.data : (resR.data?.data || []),
          responsables: Array.isArray(resP.data) ? resP.data : (resP.data?.data || []),
          formations: Array.isArray(resF.data) ? resF.data : (resF.data?.data || [])
        });
      } catch (err) {
        console.error("Erreur Dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRealData();
  }, []);

  const stats = useMemo(() => {
    const { membres, gs, responsables, formations, reseaux } = data;
    const anio = new Date().getFullYear();

    // 1. Radar Performance
    const resumeData = [
      { subject: 'Membres', A: membres.length },
      { subject: 'Groupes GS', A: gs.length },
      { subject: 'Formations', A: formations.length },
      { subject: 'Réseaux', A: reseaux.length },
      { subject: 'Responsables', A: responsables.length },
    ];

    // 2. Démographie
    const ageData = [
      { name: 'Jeunes (<25)', value: membres.filter(m => (anio - parseInt(m.ann_naiss || 2000)) < 25).length },
      { name: 'Adultes (25-45)', value: membres.filter(m => {
          const a = anio - parseInt(m.ann_naiss || 2000); return a >= 25 && a <= 45;
      }).length },
      { name: 'Aînés (>45)', value: membres.filter(m => (anio - parseInt(m.ann_naiss || 2000)) > 45).length }
    ];

    // 3. NOBAREHANA : POURCENTAGE DES GROUPES PAR AN (Fivoaran'ny famoronana GS)
    const distributionGS = gs.reduce((acc, g) => {
      const year = g.date_creation ? new Date(g.date_creation).getFullYear() : 'Inconnu';
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});

    const totalGS = gs.length;
    const evolutionGS = Object.keys(distributionGS).map(year => ({
      year: year,
      pourcentage: totalGS > 0 ? parseFloat(((distributionGS[year] / totalGS) * 100).toFixed(1)) : 0,
      count: distributionGS[year]
    })).sort((a, b) => a.year - b.year);

    // 4. Expertise par Module
    const modules = [
      { id: 'gestionsimplifiee', label: 'Gestion' },
      { id: 'agroeco', label: 'Agro-Éco' },
      { id: 'nutrition', label: 'Nutrition' },
      { id: 'genre', label: 'Genre' },
      { id: 'autonomie', label: 'Autonome' }
    ];
    const moduleStats = modules.map(mod => ({
      name: mod.label,
      valeur: formations.filter(f => f.formation?.[mod.id] === true || f.formation?.[mod.id] === 1).length
    }));

    // 5. Responsables
    const normalizePoste = (txt) => txt ? txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
    const respData = [
      { name: 'Président(e)', valeur: responsables.filter(r => normalizePoste(r?.Poste || r?.poste).includes("presid")).length },
      { name: 'Secrétaire', valeur: responsables.filter(r => normalizePoste(r?.Poste || r?.poste).includes("secr")).length },
      { name: 'Trésorier(e)', valeur: responsables.filter(r => normalizePoste(r?.Poste || r?.poste).includes("treso")).length },
      { name: 'Conseiller(e)', valeur: responsables.filter(r => normalizePoste(r?.Poste || r?.poste).includes("conseil")).length },
      { name: 'Membres', valeur: responsables.filter(r => normalizePoste(r?.Poste || r?.poste).includes("membre")).length }
    ];

    const resAuto = reseaux.filter(r => r.Autonomie === 'Oui').length;

    return { resumeData, ageData, moduleStats, evolutionGS, respData, resAuto };
  }, [data]);

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
      <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Chargement des données...</p>
    </div>
  );

  return (
    <div className="h-full bg-[#f8fafc] dark:bg-slate-950 overflow-y-auto font-sans">
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        
        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: 'Membres', val: data.membres.length, icon: Users, col: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Groupes GS', val: data.gs.length, icon: Home, col: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Réseaux', val: data.reseaux.length, icon: Network, col: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Responsables', val: data.responsables.length, icon: ShieldCheck, col: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Formations', val: data.formations.length, icon: GraduationCap, col: 'text-rose-600', bg: 'bg-rose-50' },
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 transition-transform hover:scale-105">
              <div className={`${item.bg} dark:bg-slate-800 ${item.col} w-10 h-10 flex items-center justify-center rounded-2xl mb-4`}><item.icon size={20} /></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{item.val}</p>
            </div>
          ))}
        </div>

        {/* --- SECTION 1: PERFORMANCE ET MODULES --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-slate-800 dark:text-white uppercase text-[10px] mb-6 tracking-widest flex items-center gap-2">
              <Target size={16} className="text-indigo-600"/> Équilibre du Programme
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.resumeData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{fontSize: 9, fontWeight: '900', fill: '#94a3b8'}} />
                  <Radar name="ONG" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                  <Tooltip contentStyle={{borderRadius: '15px', fontSize: '10px'}} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-slate-800 dark:text-white uppercase text-[10px] mb-6 tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-emerald-600"/> Taux de Maîtrise par Module
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.moduleStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', fontSize: '10px'}} />
                  <Bar dataKey="valeur" fill="#10b981" radius={[8, 8, 8, 8]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: ANALYSE GS ET ÂGES --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* FIZARANA NASOLO: DISTRIBUTION DES GS PAR ANNEE */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border-t-[8px] border-emerald-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-emerald-600 uppercase text-[10px] tracking-widest flex items-center gap-2">
                <CalendarDays size={14}/> Croissance des Groupes (% par année)
              </h3>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.evolutionGS}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9}} unit="%" />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Répartition']}
                    contentStyle={{borderRadius: '12px', border: 'none', fontSize: '10px'}} 
                  />
                  <Bar dataKey="pourcentage" fill="#10b981" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border-t-[8px] border-blue-500">
            <h3 className="font-black text-blue-500 uppercase text-[10px] mb-4 tracking-widest">Pyramide des Âges</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.ageData}>
                  <defs>
                    <linearGradient id="colorAge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAge)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* --- SECTION 3: RÉSEAUX ET RESPONSABLES --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border-t-[8px] border-amber-500">
            <h3 className="font-black text-amber-500 uppercase text-[10px] mb-4 tracking-widest">Maturité des Réseaux</h3>
            <div className="flex flex-col items-center justify-center h-[220px]">
              <div className="relative">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie 
                      data={[{ value: stats.resAuto }, { value: data.reseaux.length - stats.resAuto }]} 
                      innerRadius={65} outerRadius={80} startAngle={180} endAngle={0} dataKey="value" stroke="none"
                    >
                      <Cell fill="#f59e0b" />
                      <Cell fill="#f1f5f9" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                  <span className="text-3xl font-black text-slate-800 dark:text-white">
                    {data.reseaux.length > 0 ? Math.round((stats.resAuto / data.reseaux.length) * 100) : 0}%
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Autonome</span>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-500 mt-2 uppercase">{stats.resAuto} sur {data.reseaux.length} réseaux</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border-t-[8px] border-purple-500">
            <h3 className="font-black text-purple-500 uppercase text-[10px] mb-4 tracking-widest">Répartition des Postes</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.respData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="valeur">
                    {stats.respData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '15px', border: 'none', fontSize: '10px'}} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: '900', textTransform: 'uppercase'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;