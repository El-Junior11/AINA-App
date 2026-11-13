import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from '../api/axios';
import { ArrowLeft, Network, UsersRound, ShieldCheck, BarChart3, MapPin, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const card = 'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 md:p-5 shadow-sm min-w-0';
const COLORS = ['#059669', '#f59e0b', '#0284c7', '#6366f1', '#a855f7', '#ef4444'];
const yes = v => String(v || '').trim().toLowerCase() === 'oui';
const list = d => Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
const monthKey = value => { if (!value) return ''; const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const formatMonth = key => { const [y, m] = key.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }); };
const chartTooltip = { contentStyle: { borderRadius: 10, border: '1px solid #cbd5e1', color: '#0f172a', fontSize: 12 } };

export default function ReseauxVoirPlusPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useContext(AuthContext);
  const [reseaux, setReseaux] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [communeFilter, setCommuneFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError('');
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        const [r, c] = await Promise.all([axios.get('/reseaux', config), axios.get('/communes', config).catch(() => ({ data: [] }))]);
        if (!active) return;
        setReseaux(list(r.data)); setCommunes(list(c.data));
      } catch (e) { if (active) setError(e.response?.data?.message || 'Impossible de charger les réseaux.'); }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => reseaux.filter(r => {
    const id = Number(r.commune_id);
    if (!isAdmin && user?.commune_id && id !== Number(user.commune_id)) return false;
    return !isAdmin || !communeFilter || id === Number(communeFilter);
  }), [reseaux, isAdmin, user?.commune_id, communeFilter]);

  const communeName = r => r.NomCommune || r.nom_commune || communes.find(c => Number(c.id_commune) === Number(r.commune_id))?.nom_commune || (Number(r.commune_id) === Number(user?.commune_id) ? user?.commune?.nom_commune : '') || (r.commune_id ? `Commune ${r.commune_id}` : 'Non renseignée');
  const totalGroupes = useMemo(() => {
    const ids = new Set();
    visible.forEach(r => {
      const linked = Array.isArray(r.groupes_ids) ? r.groupes_ids : Array.isArray(r.groupes) ? r.groupes.map(g => g.codegs) : [];
      linked.forEach(id => { if (id != null && id !== '') ids.add(String(id)); });
    });
    return ids.size;
  }, [visible]);
  const autonomes = visible.filter(r => yes(r.Autonomie)).length;
  const enCours = visible.length - autonomes;
  const taux = visible.length ? Math.round(autonomes / visible.length * 100) : 0;
  const stats = [
    { label: 'Total réseaux', value: visible.length, icon: Network, color: 'text-sky-700 dark:text-sky-400' },
    { label: 'Groupes liés (identifiants)', value: totalGroupes, icon: UsersRound, color: 'text-indigo-700 dark:text-indigo-400' },
    { label: 'Réseaux autonomes', value: autonomes, icon: ShieldCheck, color: 'text-emerald-700 dark:text-emerald-400' },
    { label: 'En structuration', value: enCours, icon: BarChart3, color: 'text-amber-700 dark:text-amber-400' }
  ];
  const criteres = [
    { name: 'Activité', Oui: visible.filter(r => yes(r.Activite)).length, Non: visible.filter(r => !yes(r.Activite)).length },
    { name: 'Plaidoyer', Oui: visible.filter(r => yes(r.Plaidoyer)).length, Non: visible.filter(r => !yes(r.Plaidoyer)).length },
    { name: 'Plan', Oui: visible.filter(r => yes(r.Plan)).length, Non: visible.filter(r => !yes(r.Plan)).length }
  ];
  const autonomieData = [{ name: 'Autonomes', value: autonomes }, { name: 'En structuration', value: enCours }].filter(x => x.value > 0);
  const parCommune = useMemo(() => {
    const counts = new Map();
    visible.forEach(r => { const name = communeName(r); counts.set(name, (counts.get(name) || 0) + 1); });
    return [...counts].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  }, [visible, communes, user?.commune_id]);
  const evolution = useMemo(() => {
    const counts = new Map();
    visible.forEach(r => { const key = monthKey(r.DateCreation); if (key) counts.set(key, (counts.get(key) || 0) + 1); });
    let cumul = 0;
    return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([key, total]) => ({ mois: formatMonth(key), total, cumul: cumul += total }));
  }, [visible]);

  return (
    <main className="min-h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-6 space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-6 py-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center"><Network size={20}/></span>
          <div className="min-w-0"><h1 className="text-lg font-semibold">Vue d'ensemble des réseaux</h1><p className="text-sm text-slate-500 dark:text-slate-400">Statistiques des réseaux communautaires</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && <label className="flex items-center gap-2 text-sm"><MapPin size={16} className="text-emerald-700"/><select aria-label="Filtrer par commune" value={communeFilter} onChange={e=>setCommuneFilter(e.target.value)} className="h-10 max-w-[230px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"><option value="">Toutes les communes</option>{communes.map(c=><option key={c.id_commune} value={c.id_commune}>{c.nom_commune}</option>)}</select></label>}
          <button type="button" onClick={()=>navigate('/reseaux')} className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"><ArrowLeft size={16}/>Retour aux réseaux</button>
        </div>
      </header>
      {loading ? <div className="flex items-center gap-2 text-slate-500"><Loader2 className="animate-spin" /> Chargement...</div> : error ?
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : <>
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Indicateurs des réseaux">
            {stats.map(s => <article key={s.label} className={card}><s.icon className={s.color} size={22} /><p className="text-3xl font-semibold mt-3 tabular-nums">{s.value}</p><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{s.label}</p></article>)}
          </section>
          <section className={card}>
            <div className="flex justify-between items-center gap-3 mb-3"><h2 className="font-semibold">Taux d'autonomie</h2><strong>{taux} %</strong></div>
            <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" role="progressbar" aria-label="Taux d'autonomie" aria-valuenow={taux} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-emerald-600 rounded-full" style={{ width: `${taux}%` }} /></div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">{autonomes} réseau(x) autonome(s) sur {visible.length}.</p>
          </section>
          {!visible.length ? <section className={`${card} text-center text-sm text-slate-500 py-12`}>Aucun réseau disponible pour cette sélection.</section> : <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <section className={card}><h2 className="font-semibold mb-1">Critères de structuration</h2><p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Réseaux ayant validé chaque critère</p><div className="h-[280px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={criteres} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" opacity={0.35} /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={78} tick={{ fontSize: 12 }} /><Tooltip {...chartTooltip} /><Legend /><Bar dataKey="Oui" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} /><Bar dataKey="Non" stackId="a" fill="#cbd5e1" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div></section>
            <section className={card}><h2 className="font-semibold mb-1">Répartition par autonomie</h2><p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Autonomes et en structuration</p><div className="h-[280px] w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={autonomieData} cx="50%" cy="47%" innerRadius="50%" outerRadius="72%" dataKey="value" nameKey="name" paddingAngle={3} label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>{autonomieData.map((x, i) => <Cell key={x.name} fill={i === 0 && x.name === 'Autonomes' ? COLORS[0] : x.name === 'En structuration' ? COLORS[1] : COLORS[0]} />)}</Pie><Tooltip {...chartTooltip} /><Legend verticalAlign="bottom" /></PieChart></ResponsiveContainer></div></section>
            <section className={card}><h2 className="font-semibold mb-1">Réseaux par commune</h2><p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Nombre de réseaux communautaires</p><div className="w-full" style={{ height: Math.max(270, parCommune.length * 42 + 70) }}><ResponsiveContainer width="100%" height="100%"><BarChart data={parCommune} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" opacity={0.35} /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} /><Tooltip {...chartTooltip} /><Bar dataKey="total" name="Réseaux" fill="#0284c7" radius={[0, 5, 5, 0]} maxBarSize={24} /></BarChart></ResponsiveContainer></div></section>
            <section className={card}><h2 className="font-semibold mb-1">Évolution des créations</h2><p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Nombre cumulé de réseaux par mois</p>{evolution.length ? <div className="h-[280px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={evolution} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}><defs><linearGradient id="reseauxEvolutionFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} /><XAxis dataKey="mois" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip {...chartTooltip} /><Area type="monotone" dataKey="cumul" name="Réseaux cumulés" stroke="#6366f1" strokeWidth={2.5} fill="url(#reseauxEvolutionFill)" dot={{ r: 3 }} /></AreaChart></ResponsiveContainer></div> : <p className="text-sm text-slate-500 py-10 text-center">Aucune date de création exploitable.</p>}</section>
          </div>}
        </>}
    </main>
  );
}
