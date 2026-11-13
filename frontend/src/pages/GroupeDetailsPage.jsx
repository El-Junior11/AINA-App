import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MapPin, ShieldCheck, BarChart3, PieChart, CalendarDays, Loader2, Inbox, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RePieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { getGroupes } from '../services/groupeService';

const COLORS = ['#059669', '#0284c7', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6', '#6366f1'];
const card = 'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm';
const field = 'h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/30';
const normalizeDate = value => { if (!value) return null; const d = new Date(value); return Number.isNaN(d.getTime()) ? null : d; };
const parseMenages = value => [...new Set(String(value || '').split(',').map(v => v.trim()).filter(Boolean))];
const formatMonth = key => { const [year, month] = key.split('-').map(Number); return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }); };
const ChartTooltip = ({ active, payload, label }) => active && payload?.length ? (
  <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs shadow-lg text-slate-800 dark:text-slate-100">
    {label != null && <p className="font-semibold mb-1">{label}</p>}
    {payload.map((p, i) => <p key={i} className="py-0.5" style={{ color: p.color || p.fill || '#059669' }}>{p.name}: <strong>{p.value}</strong></p>)}
  </div>
) : null;
const EmptyChart = ({ text = 'Aucune donnée disponible.' }) => <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500"><Inbox size={24} /><p className="text-xs text-center">{text}</p></div>;
const ChartPanel = ({ title, icon: Icon, children, className = '' }) => (
  <section className={`${card} p-4 md:p-5 min-w-0 ${className}`}>
    <h2 className="flex items-center gap-2.5 text-sm font-semibold text-slate-900 dark:text-white mb-5">
      <span className="h-8 w-8 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center"><Icon size={16} /></span>
      <span>{title}</span>
    </h2>
    {children}
  </section>
);

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
    { title: 'Groupes solidaires', value: stats.groupes, icon: Users },
    { title: 'Ménages rattachés', value: stats.menages, icon: ShieldCheck },
    { title: 'Communes couvertes', value: stats.communes, icon: MapPin }
  ];
  const axis = { fontSize: 11, fill: '#94a3b8' };
  const grid = '#cbd5e1';

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap'); .groupes-stats{font-family:'Public Sans',system-ui,sans-serif} .groupes-stats .recharts-wrapper text{font-family:'Public Sans',system-ui,sans-serif}`}</style>
      <header className="shrink-0 px-4 md:px-6 py-4 md:py-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 groupes-stats">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center"><BarChart3 size={20} /></span>
            <div className="min-w-0"><h1 className="text-lg font-semibold text-slate-900 dark:text-white">Statistiques des groupes solidaires</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Analyse des groupes, des ménages et de leur répartition territoriale.</p></div>
          </div>
          <button type="button" onClick={() => navigate('/groupes')} className={`${field} flex items-center justify-center gap-2 sm:ml-auto shrink-0 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer`}><ArrowLeft size={16} /> Retour aux groupes</button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 groupes-stats">
        <div className="w-full max-w-[1600px] mx-auto space-y-5">
          {loading ? <div className={`${card} p-12 flex items-center justify-center gap-2 text-sm text-slate-500`}><Loader2 size={19} className="animate-spin text-emerald-600" /> Chargement des statistiques...</div> : error ? (
            <div role="alert" className={`${card} p-5 flex items-center gap-3 text-sm text-rose-600 dark:text-rose-400`}><AlertTriangle size={19} />{error}</div>
          ) : <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {cards.map(({ title, value, icon: Icon }) => (
                <div key={title} className={`${card} p-4 flex items-center gap-3.5 min-w-0`}>
                  <span className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center"><Icon size={18} /></span>
                  <div className="min-w-0"><p className="text-xs text-slate-500 dark:text-slate-400 truncate">{title}</p><p className="text-xl font-semibold tabular-nums mt-0.5">{value}</p></div>
                </div>
              ))}
            </div>

            {stats.groupes === 0 ? <div className={`${card} p-12`}><EmptyChart text="Aucune donnée statistique disponible." /></div> : <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <ChartPanel title="Groupes et ménages par commune" icon={BarChart3}>
                  <div className="h-[320px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.communesData} layout="vertical" margin={{ top: 4, right: 22, left: 10, bottom: 2 }} barGap={3}>
                        <defs><linearGradient id="gs-groupes" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#047857" /></linearGradient><linearGradient id="gs-menages" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7dd3fc" /><stop offset="1" stopColor="#0284c7" /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={grid} opacity={0.4} />
                        <XAxis type="number" allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={112} tick={axis} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                        <Bar dataKey="groupes" name="Groupes" fill="url(#gs-groupes)" radius={[0, 5, 5, 0]} maxBarSize={16} />
                        <Bar dataKey="menages" name="Ménages" fill="url(#gs-menages)" radius={[0, 5, 5, 0]} maxBarSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartPanel>

                <ChartPanel title="Répartition des groupes par commune" icon={PieChart}>
                  <div className="h-[320px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie data={stats.communesData} dataKey="groupes" nameKey="name" cx="50%" cy="44%" innerRadius={65} outerRadius={100} paddingAngle={2} stroke="none" cornerRadius={4}>
                          {stats.communesData.map((c, i) => <Cell key={`${c.name}-${i}`} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11, lineHeight: '20px' }} />
                        <text x="50%" y="44%" textAnchor="middle" dominantBaseline="central" fill="#64748b" fontSize="13" fontWeight="600">{stats.groupes} groupes</text>
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartPanel>
              </div>

              <ChartPanel title="Création des groupes par mois" icon={CalendarDays}>
                {stats.timeline.length ? <div className="h-[300px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.timeline} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="gs-timeline" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.4} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.02} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} opacity={0.45} />
                      <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} minTickGap={15} />
                      <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} width={30} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="groupes" name="Groupes créés" stroke="#059669" strokeWidth={3} fill="url(#gs-timeline)" dot={{ r: 3, fill: '#059669', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div> : <div className="h-48"><EmptyChart text="Aucune date de création disponible." /></div>}
              </ChartPanel>
            </>}
          </>}
        </div>
      </main>
    </div>
  );
}
