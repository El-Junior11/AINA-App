import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import { ArrowLeft, Users, UserRound, ShieldCheck, Venus, Mars, Percent, Loader2, RefreshCw, ChartNoAxesCombined, MapPin } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

const COLORS = ['#059669', '#0284c7', '#f59e0b', '#8b5cf6', '#e11d48', '#64748b'];
const field = 'h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-emerald-600/30';
const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm';
const normalize = data => Array.isArray(data) ? data : data?.groupes || data?.data || [];
const femme = v => ['F', 'FEMME', 'FEMININ', 'FÉMININ'].includes(String(v || '').trim().toUpperCase());
const homme = v => ['M', 'H', 'HOMME', 'MASCULIN'].includes(String(v || '').trim().toUpperCase());
const bureau = v => ['president', 'tresorier', 'secretaire'].includes(String(v || '').toLowerCase());
const age = m => {
  const annee = Number(m.annee_naissance), actuel = new Date().getFullYear();
  return Number.isInteger(annee) && annee >= 1900 && annee <= actuel ? actuel - annee : null;
};

const ChartTooltip = ({ active, payload, label }) => active && payload?.length ? <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xl"><p className="mb-1 font-semibold">{label || payload[0]?.payload?.name}</p>{payload.map((p, i) => <p key={i} style={{ color: p.color || p.fill || '#059669' }}>{p.name}: <strong>{p.value}</strong></p>)}</div> : null;
const tick = { fontSize: 11, fill: '#64748b', fontFamily: 'Public Sans, sans-serif' };
const Kpi = ({ title, value, icon: Icon, color = 'emerald' }) => {
  const colors = { emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400', blue: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400', rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400', amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' };
  return <article className={`${card} flex min-w-0 items-center gap-4 p-4 md:p-5`}><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}><Icon size={22}/></div><div className="min-w-0"><p className="text-sm text-slate-500 dark:text-slate-400">{title}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p></div></article>;
};
const Diagramme = ({ title, subtitle, icon: Icon = ChartNoAxesCombined, children, height = 310 }) => <section className={`${card} min-w-0 p-4 md:p-5`}><div className="mb-5 flex items-start gap-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"><Icon size={17}/></div><div><h2 className="text-sm font-semibold md:text-base">{title}</h2>{subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}</div></div><div className="w-full min-w-0" style={{ height }}>{children}</div></section>;

export default function DetailsResponsablesPage() {
  const navigate = useNavigate();
  const [groupes, setGroupes] = useState([]);
  const [membres, setMembres] = useState([]);
  const [communeId, setCommuneId] = useState('');
  const [codegs, setCodegs] = useState('');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  });

  const admin = user.role === 'admin';
  const ownCommune = String(user.commune_id || '');
  const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  useEffect(() => {
    let active = true;
    setLoading(true);

    const load = async () => {
      try {
        const { data } = await axios.get('/groupes', auth());
        const gs = normalize(data).filter(g => admin || !ownCommune || String(g.commune_id) === ownCommune);
        const results = await Promise.all(gs.map(async g => {
          try {
            const response = await axios.get(`/groupes/${g.codegs}/membres`, auth());
            return normalize(response.data).map(m => ({
              ...m, codegs: g.codegs, nomgs: g.nomgs, commune_id: g.commune_id,
              nom_commune: g.commune || g.nom_commune || `Commune ${g.commune_id}`
            }));
          } catch (e) {
            console.error(`Groupe ${g.codegs}:`, e);
            throw e;
          }
        }));

        if (active) { setGroupes(gs); setMembres(results.flat()); }
      } catch (e) {
        if (active) Swal.fire({ icon: 'error', title: 'Chargement impossible', text: e.response?.data?.message || e.message });
      } finally { if (active) setLoading(false); }
    };

    load();
    return () => { active = false; };
  }, [refresh]);

  const communes = useMemo(() => {
    const map = new Map();
    groupes.forEach(g => {
      if (g.commune_id) map.set(String(g.commune_id), g.commune || g.nom_commune || `Commune ${g.commune_id}`);
    });
    return [...map].map(([id, nom]) => ({ id, nom })).sort((a, b) => a.nom.localeCompare(b.nom));
  }, [groupes]);

  const groupesFiltres = useMemo(() =>
    groupes.filter(g => !communeId || String(g.commune_id) === communeId),
    [groupes, communeId]
  );

  const filtered = useMemo(() => membres.filter(m =>
    (!communeId || String(m.commune_id) === communeId) &&
    (!codegs || String(m.codegs) === codegs)
  ), [membres, communeId, codegs]);

  const uniques = useMemo(() => [...new Map(filtered.map(m => [`${m.commune_id}-${m.nummembre}`, m])).values()], [filtered]);
  const femmes = uniques.filter(m => femme(m.sexe)).length;
  const hommes = uniques.filter(m => homme(m.sexe)).length;
  const total = uniques.length;
  const femmesBureau = new Set(filtered.filter(m => femme(m.sexe) && bureau(m.Poste)).map(m => `${m.commune_id}-${m.nummembre}`)).size;
  const totalBureau = new Set(filtered.filter(m => bureau(m.Poste)).map(m => `${m.commune_id}-${m.nummembre}`)).size;
  const hommesJeunes = uniques.filter(m => homme(m.sexe) && age(m) !== null && age(m) < 26).length;
  const femmesJeunes = uniques.filter(m => femme(m.sexe) && age(m) !== null && age(m) < 26).length;
  const taux = total ? `${(femmes / total * 100).toFixed(1)}%` : '0%';

  const repartitionSexe = [
    { name: 'Femmes', value: femmes },
    { name: 'Hommes', value: hommes },
    { name: 'Non renseigné', value: Math.max(0, total - femmes - hommes) }
  ].filter(x => x.value > 0);

  const postes = ['President', 'Tresorier', 'Secretaire', 'Conseiller', 'Membre'];
  const repartitionPostes = postes.map(p => ({
    name: p, total: uniques.filter(m => String(m.Poste || 'Membre').toLowerCase() === p.toLowerCase()).length
  }));

  const repartitionGroupes = groupesFiltres.filter(g => !codegs || String(g.codegs) === codegs).map(g => {
    const list = filtered.filter(m => String(m.codegs) === String(g.codegs));
    return { name: g.nomgs, femmes: list.filter(m => femme(m.sexe)).length, hommes: list.filter(m => homme(m.sexe)).length };
  });

  const repartitionCommunes = communes.filter(c => !communeId || c.id === communeId).map(c => ({
    name: c.nom,
    total: new Set(membres.filter(m => String(m.commune_id) === c.id && (!codegs || String(m.codegs) === codegs)).map(m => `${m.commune_id}-${m.nummembre}`)).size
  }));

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100" style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}>
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 md:px-6 md:py-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3.5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"><ChartNoAxesCombined size={20}/></span><div className="min-w-0"><h1 className="text-lg font-semibold text-slate-900 dark:text-white">Détails des responsables</h1><p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Statistiques des responsables · tous les groupes par défaut</p></div></div>
          <div className="flex flex-wrap items-center gap-2">
            {admin && <label className="flex items-center gap-2 text-sm"><MapPin size={16} className="shrink-0 text-emerald-700"/><select aria-label="Filtrer par commune" className={`${field} max-w-[210px]`} value={communeId} onChange={e => { setCommuneId(e.target.value); setCodegs(''); }}><option value="">Toutes les communes</option>{communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></label>}
            <select aria-label="Filtrer par groupe" className={`${field} max-w-[210px]`} value={codegs} onChange={e => setCodegs(e.target.value)}><option value="">Tous les groupes</option>{groupesFiltres.map(g => <option key={g.codegs} value={g.codegs}>{g.nomgs}</option>)}</select>
            <button type="button" onClick={() => setRefresh(v => v + 1)} className={`${field} flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700`}><RefreshCw size={16}/>Actualiser</button>
            <button type="button" onClick={() => navigate(-1)} className={`${field} flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700`}><ArrowLeft size={16}/>Retour</button>
          </div>
        </div>
      </header>
      <main className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-[1600px] space-y-5">
          {loading ? <div className="flex h-64 items-center justify-center gap-2 text-slate-500"><Loader2 size={24} className="animate-spin text-emerald-600"/>Chargement...</div> : <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Indicateurs des responsables">
              <Kpi title="Total membres" value={total} icon={Users}/><Kpi title="Total bureau" value={totalBureau} icon={ShieldCheck} color="blue"/><Kpi title="Femmes au bureau" value={femmesBureau} icon={Venus} color="rose"/>
              <Kpi title="Hommes de moins de 26 ans" value={hommesJeunes} icon={Mars} color="blue"/><Kpi title="Femmes de moins de 26 ans" value={femmesJeunes} icon={UserRound} color="rose"/><Kpi title="Participation féminine" value={taux} icon={Percent} color="amber"/>
            </section>
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Diagramme title="Répartition par sexe" subtitle="Proportion des femmes, hommes et non renseignés">
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={repartitionSexe} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={66} outerRadius={98} paddingAngle={3} stroke="none">{repartitionSexe.map((x, i) => <Cell key={x.name} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip content={<ChartTooltip/>}/><Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12, fontFamily: 'Public Sans, sans-serif' }}/></PieChart></ResponsiveContainer>
              </Diagramme>
              <Diagramme title="Répartition par poste" subtitle="Effectifs selon la fonction occupée">
                <ResponsiveContainer width="100%" height="100%"><BarChart data={repartitionPostes} margin={{ top: 18, right: 12, left: -18, bottom: 25 }}><defs><linearGradient id="respPostesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="#047857"/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} vertical={false}/><XAxis dataKey="name" tick={tick} angle={-15} textAnchor="end" height={55} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={tick} axisLine={false} tickLine={false}/><Tooltip content={<ChartTooltip/>}/><Bar dataKey="total" name="Membres" fill="url(#respPostesFill)" radius={[6, 6, 0, 0]} maxBarSize={46}><LabelList dataKey="total" position="top" style={{ fontSize: 11, fill: '#64748b' }}/></Bar></BarChart></ResponsiveContainer>
              </Diagramme>
              <Diagramme title="Répartition hommes / femmes par groupe" subtitle="Comparaison des effectifs par groupe" height={Math.max(310, repartitionGroupes.length * 42 + 65)}>
                <ResponsiveContainer width="100%" height="100%"><BarChart data={repartitionGroupes} layout="vertical" margin={{ top: 5, right: 14, left: 5, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} horizontal={false}/><XAxis type="number" allowDecimals={false} tick={tick} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" width={110} tick={tick} axisLine={false} tickLine={false}/><Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{ fontSize: 12 }}/><Bar dataKey="femmes" name="Femmes" fill="#059669" radius={[0, 5, 5, 0]} maxBarSize={16}/><Bar dataKey="hommes" name="Hommes" fill="#0284c7" radius={[0, 5, 5, 0]} maxBarSize={16}/></BarChart></ResponsiveContainer>
              </Diagramme>
              <Diagramme title="Répartition des membres par commune" subtitle="Nombre de membres uniques par commune" height={Math.max(310, repartitionCommunes.length * 42 + 65)}>
                <ResponsiveContainer width="100%" height="100%"><BarChart data={repartitionCommunes} layout="vertical" margin={{ top: 5, right: 38, left: 5, bottom: 5 }}><defs><linearGradient id="respCommunesFill" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#0284c7"/><stop offset="100%" stopColor="#38bdf8"/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} horizontal={false}/><XAxis type="number" allowDecimals={false} tick={tick} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" width={110} tick={tick} axisLine={false} tickLine={false}/><Tooltip content={<ChartTooltip/>}/><Bar dataKey="total" name="Membres" fill="url(#respCommunesFill)" radius={[0, 6, 6, 0]} maxBarSize={26}><LabelList dataKey="total" position="right" style={{ fontSize: 11, fill: '#64748b' }}/></Bar></BarChart></ResponsiveContainer>
              </Diagramme>
            </section>
            {!total && <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Aucune donnée disponible pour les filtres sélectionnés.</p>}
          </>}
        </div>
      </main>
    </div>
  );
}
