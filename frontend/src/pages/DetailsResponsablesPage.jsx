import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import { ArrowLeft, Users, UserRound, ShieldCheck, Venus, Mars, Percent, Loader2, RefreshCw, ChartNoAxesCombined, MapPin } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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

const Kpi = ({ title, value, icon: Icon, color = 'emerald' }) => {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    blue: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
  };
  return (
    <div className={`${card} p-4 flex items-center gap-4`}>
      <div className={`p-3 rounded-xl ${colors[color]}`}><Icon size={22}/></div>
      <div><p className="text-sm text-slate-500 dark:text-slate-400">{title}</p><p className="text-2xl font-bold">{value}</p></div>
    </div>
  );
};

const Diagramme = ({ title, children }) => (
  <div className={`${card} p-4 md:p-5 min-w-0`}>
    <h2 className="font-semibold mb-5">{title}</h2>
    <div className="h-[300px] w-full">{children}</div>
  </div>
);

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
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center"><ChartNoAxesCombined size={20}/></span>
            <div className="min-w-0"><h1 className="text-lg font-semibold">Détails des responsables</h1><p className="text-sm text-slate-500 dark:text-slate-400">Statistiques des responsables · tous les groupes par défaut</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {admin && <label className="flex items-center gap-2 text-sm"><MapPin size={16} className="text-emerald-700"/><select aria-label="Filtrer par commune" className={`${field} max-w-[230px]`} value={communeId} onChange={e => { setCommuneId(e.target.value); setCodegs(''); }}><option value="">Toutes les communes</option>{communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></label>}
            <select aria-label="Filtrer par groupe" className={`${field} max-w-[230px]`} value={codegs} onChange={e => setCodegs(e.target.value)}><option value="">Tous les groupes</option>{groupesFiltres.map(g => <option key={g.codegs} value={g.codegs}>{g.nomgs}</option>)}</select>
            <button type="button" onClick={() => setRefresh(v => v + 1)} className={`${field} flex items-center gap-2`}><RefreshCw size={17}/>Actualiser</button>
            <button type="button" onClick={() => navigate(-1)} className={`${field} flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800`}><ArrowLeft size={17}/>Retour</button>
          </div>
        </div>
      </header>
      <main className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-emerald-600"/></div>
      ) : (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <Kpi title="Total membres" value={total} icon={Users}/>
            <Kpi title="Total bureau" value={totalBureau} icon={ShieldCheck} color="blue"/>
            <Kpi title="Femmes au bureau" value={femmesBureau} icon={Venus} color="rose"/>
            <Kpi title="Hommes de moins de 26 ans" value={hommesJeunes} icon={Mars} color="blue"/>
            <Kpi title="Femmes de moins de 26 ans" value={femmesJeunes} icon={UserRound} color="rose"/>
            <Kpi title="Participation féminine" value={taux} icon={Percent} color="amber"/>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Diagramme title="Répartition par sexe">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={repartitionSexe} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={2}>
                    {repartitionSexe.map((x, i) => <Cell key={x.name} fill={COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip/><Legend/>
                </PieChart>
              </ResponsiveContainer>
            </Diagramme>

            <Diagramme title="Répartition par poste">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={repartitionPostes} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={55}/>
                  <YAxis allowDecimals={false}/><Tooltip/>
                  <Bar dataKey="total" name="Membres" fill="#059669" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Diagramme>

            <Diagramme title="Répartition hommes / femmes par groupe">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={repartitionGroupes} margin={{ top: 10, right: 10, left: -20, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={75}/>
                  <YAxis allowDecimals={false}/><Tooltip/><Legend/>
                  <Bar dataKey="femmes" name="Femmes" fill="#059669" radius={[4, 4, 0, 0]}/>
                  <Bar dataKey="hommes" name="Hommes" fill="#0284c7" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Diagramme>

            <Diagramme title="Répartition des membres par commune">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={repartitionCommunes} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                  <XAxis type="number" allowDecimals={false}/>
                  <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }}/>
                  <Tooltip/>
                  <Bar dataKey="total" name="Membres" fill="#0284c7" radius={[0, 4, 4, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Diagramme>
          </section>

          {!total && <p className="text-center text-sm text-slate-500">Aucune donnée disponible pour les filtres sélectionnés.</p>}
        </>
      )}
      </main>
    </div>
  );
}