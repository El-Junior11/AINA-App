import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MapPin, ShieldCheck, BarChart3, PieChart, CalendarDays, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RePieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { getGroupes } from '../services/groupeService';

const COLORS = ['#059669', '#0284c7', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6', '#6366f1'];
const card = 'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm';
const field = 'h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/30';
const normalizeDate = value => { if (!value) return null; const d = new Date(value); return Number.isNaN(d.getTime()) ? null : d; };
const parseMenages = value => [...new Set(String(value || '').split(',').map(v => v.trim()).filter(Boolean))];
const formatMonth = key => { const [year, month] = key.split('-').map(Number); return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }); };
const ChartTooltip = ({ active, payload, label }) => active && payload?.length ? <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg text-slate-800">{label && <p className="font-semibold mb-1">{label}</p>}{payload.map((p, i) => <p key={i} style={{ color: p.color || p.fill }}>{p.name}: {p.value}</p>)}</div> : null;

export default function GroupeDetailsPage() {
  const navigate = useNavigate();
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getGroupes().then(res => { if (active) setGroupes(Array.isArray(res.data) ? res.data : []); })
      .catch(e => { if (active) setError(e.response?.data?.message || 'Impossible de charger les groupes'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => {
    const byCommune = new Map(), byMonth = new Map(), uniqueMenages = new Set();
    groupes.forEach(g => {
      const communeId = g.commune_id ?? g.commune ?? 'inconnue';
      const nom = String(g.commune || `Commune ${communeId}`);
      if (!byCommune.has(String(communeId))) byCommune.set(String(communeId), { name: nom, groupes: 0, menages: new Set() });
      const item = byCommune.get(String(communeId));
      item.groupes++;
      parseMenages(g.nummenage).forEach(n => { const key = `${communeId}:${n}`; uniqueMenages.add(key); item.menages.add(key); });
      const date = normalizeDate(g.date_creation);
      if (date) { const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; byMonth.set(month, (byMonth.get(month) || 0) + 1); }
    });
    const communes = [...byCommune.values()].map(c => ({ name: c.name, groupes: c.groupes, menages: c.menages.size })).sort((a, b) => b.groupes - a.groupes);
    const timeline = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, groupes]) => ({ month: formatMonth(month), groupes }));
    return { groupes: groupes.length, menages: uniqueMenages.size, communes: communes.length, communesData: communes, timeline };
  }, [groupes]);

  const cards = [
    { title: 'Groupes solidaires', value: stats.groupes, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { title: 'Ménages rattachés', value: stats.menages, icon: ShieldCheck, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/40' },
    { title: 'Communes couvertes', value: stats.communes, icon: MapPin, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/40' }
  ];

  return <div className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center"><BarChart3 size={20} /></span>
          <div><h1 className="text-lg font-semibold">Statistiques des groupes solidaires</h1><p className="text-sm text-slate-500 dark:text-slate-400">Analyse des groupes et des ménages</p></div>
        </div>
        <button type="button" onClick={() => navigate('/groupes')} className={`${field} flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800`}><ArrowLeft size={16} />Retour aux groupes</button>
      </div>
    </header>
    <main className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
      {loading ? <div className="py-16 flex justify-center items-center gap-2 text-slate-500"><Loader2 size={20} className="animate-spin" />Chargement...</div> : error ? <div role="alert" className="rounded-lg bg-rose-50 dark:bg-rose-950/30 p-4 text-rose-600">{error}</div> : <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{cards.map(({ title, value, icon: Icon, color, bg }) => <div key={title} className={`${card} p-5 flex items-center gap-4`}><div className={`h-12 w-12 shrink-0 rounded-lg ${bg} flex items-center justify-center`}><Icon size={24} className={color} /></div><div><p className="text-sm text-slate-500 dark:text-slate-400">{title}</p><p className="text-2xl font-semibold mt-1">{value}</p></div></div>)}</div>
        {stats.groupes === 0 ? <div className={`${card} p-12 text-center text-sm text-slate-500`}>Aucune donnée statistique disponible.</div> : <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <section className={`${card} p-4 md:p-5`}><div className="flex items-center gap-2 mb-5"><BarChart3 size={19} className="text-emerald-600" /><h2 className="font-semibold text-sm md:text-base">Groupes et ménages par commune</h2></div><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={stats.communesData} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}><CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} /><XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-20} textAnchor="end" interval={0} height={60} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} /><Tooltip content={<ChartTooltip />} /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="groupes" name="Groupes" fill="#059669" radius={[5, 5, 0, 0]} maxBarSize={38} /><Bar dataKey="menages" name="Ménages" fill="#0284c7" radius={[5, 5, 0, 0]} maxBarSize={38} /></BarChart></ResponsiveContainer></div></section>
            <section className={`${card} p-4 md:p-5`}><div className="flex items-center gap-2 mb-5"><PieChart size={19} className="text-sky-600" /><h2 className="font-semibold text-sm md:text-base">Répartition des groupes par commune</h2></div><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><RePieChart><Pie data={stats.communesData} dataKey="groupes" nameKey="name" cx="50%" cy="43%" innerRadius={58} outerRadius={90} paddingAngle={3} stroke="none">{stats.communesData.map((c, i) => <Cell key={c.name} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip content={<ChartTooltip />} /><Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} /></RePieChart></ResponsiveContainer></div></section>
          </div>
          <section className={`${card} p-4 md:p-5`}><div className="flex items-center gap-2 mb-5"><CalendarDays size={19} className="text-violet-600" /><h2 className="font-semibold text-sm md:text-base">Création des groupes par mois</h2></div>{stats.timeline.length ? <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={stats.timeline} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}><defs><linearGradient id="groupesGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#059669" stopOpacity={0.25} /><stop offset="95%" stopColor="#059669" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} /><XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="groupes" name="Groupes créés" stroke="#059669" strokeWidth={2.5} fill="url(#groupesGradient)" /></AreaChart></ResponsiveContainer></div> : <p className="py-12 text-center text-sm text-slate-500">Aucune date de création disponible.</p>}</section>
        </>}
      </>}
    </main>
  </div>;
}
