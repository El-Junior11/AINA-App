import React, {
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import {
  ArrowLeft,
  Users,
  House,
  ShieldCheck,
  UserRound,
  RefreshCw,
  Loader2,
  ChartNoAxesCombined,
  MapPin
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList
} from 'recharts';
const COLORS = ['#0284c7', '#e11d48'];
const panel =
  'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm';
const field =
  'h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/30';
const StatistiquesMembres = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  const [membres, setMembres] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [communeId, setCommuneId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [communesError, setCommunesError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      setCommunesError('');
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        const [membresResult, communesResult] =
          await Promise.all([
            axios.get('/membres', config),
            isAdmin
              ? axios
                  .get('/auth/admin/communes', config)
                  .catch(err => {
                    console.error(
                      'Chargement des communes:',
                      err
                    );
                    return null;
                  })
              : Promise.resolve(null)
          ]);
        if (!active) return;
        if (!Array.isArray(membresResult.data)) {
          throw new Error(
            'Format de réponse membres inattendu'
          );
        }
        setMembres(membresResult.data);
        if (isAdmin) {
          if (
            communesResult &&
            Array.isArray(communesResult.data)
          ) {
            setCommunes(communesResult.data);
          } else {
            setCommunes([]);
            setCommunesError(
              'Liste des communes indisponible.'
            );
          }
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setError(
            err.response?.data?.message ||
            'Impossible de charger les membres.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [isAdmin, refreshKey]);
  // Membres visibles selon la commune sélectionnée
  const visible = useMemo(() => {
    if (!isAdmin || communeId === 'all') {
      return membres;
    }
    return membres.filter(
      m => String(m.commune_id) === communeId
    );
  }, [membres, isAdmin, communeId]);
  // Calcul des statistiques
  const stats = useMemo(() => {
    const hommes = visible.filter(
      m => m.sexe === 'Homme'
    ).length;
    const femmes = visible.filter(
      m => m.sexe === 'Femme'
    ).length;
    const chefs = visible.filter(
      m => m.chef === true
    ).length;
    // Identification des ménages
    // L'identifiant id_menage est prioritaire.
    const menages = new Set(
      visible
        .map(m => {
          if (m.id_menage != null) {
            return `id:${m.id_menage}`;
          }
          if (
            m.num_menage == null ||
            String(m.num_menage).trim() === ''
          ) {
            return null;
          }
          return `legacy:${m.commune_id ?? 'inconnue'}:${String(
            m.num_menage
          ).trim()}`;
        })
        .filter(Boolean)
    ).size;
    // Répartition par décennie de naissance
    const annees = new Map();
    visible.forEach(m => {
      const annee = Number(m.annee_naissance);
      if (
        !Number.isInteger(annee) ||
        annee < 1900 ||
        annee > new Date().getFullYear()
      ) {
        return;
      }
      const debut = Math.floor(annee / 10) * 10;
      const tranche = `${debut}–${debut + 9}`;
      annees.set(
        tranche,
        (annees.get(tranche) || 0) + 1
      );
    });
    return {
      total: visible.length,
      hommes,
      femmes,
      chefs,
      menages,
      genre: [
        {
          name: 'Hommes',
          value: hommes
        },
        {
          name: 'Femmes',
          value: femmes
        }
      ],
      naissances: [...annees]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([periode, total]) => ({
          periode,
          total
        }))
    };
  }, [visible]);
  // Statistiques par commune
  const communesStats = useMemo(() => {
    if (!isAdmin) return [];
    return communes.map(c => {
      const id = c.id ?? c.id_commune;
      return {
        nom:
          c.nom ??
          c.nom_commune ??
          `Commune ${id}`,
        membres: membres.filter(
          m => String(m.commune_id) === String(id)
        ).length
      };
    });
  }, [communes, membres, isAdmin]);
  const cards = [
    {
      title: 'Total des membres',
      value: stats.total,
      Icon: Users,
      color: 'text-sky-700 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/40'
    },
    {
      title: 'Ménages représentés',
      value: stats.menages,
      Icon: House,
      color: 'text-violet-700 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/40'
    },
    {
      title: 'Chefs de ménage',
      value: stats.chefs,
      Icon: ShieldCheck,
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40'
    },
    {
      title: 'Hommes / Femmes',
      value: `${stats.hommes} / ${stats.femmes}`,
      Icon: UserRound,
      color: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40'
    }
  ];
  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap'); .stats-membres{font-family:'Public Sans',system-ui,sans-serif} .stats-membres .recharts-wrapper text{font-family:'Public Sans',system-ui,sans-serif}`}</style>
      <header className="shrink-0 px-4 md:px-6 py-4 md:py-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3.5">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center"><ChartNoAxesCombined size={20} /></span>
            <div className="min-w-0"><h1 className="text-lg font-semibold text-slate-900 dark:text-white">Statistiques des membres</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Analyse des membres et des ménages</p></div>
          </div>
          <div className="flex flex-wrap items-end gap-2 lg:ml-auto">
            {isAdmin && <label className="flex flex-col gap-1 min-w-[170px] flex-1 sm:flex-none"><span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300"><MapPin size={13} /> Commune</span><select aria-label="Filtrer par commune" className={`${field} w-full sm:min-w-[205px]`} value={communeId} onChange={e => setCommuneId(e.target.value)}><option value="all">Toutes les communes</option>{communes.map(c => <option key={c.id ?? c.id_commune} value={String(c.id ?? c.id_commune)}>{c.nom ?? c.nom_commune}</option>)}</select></label>}
            <button type="button" onClick={() => setRefreshKey(k => k + 1)} className={`${field} flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800`}><RefreshCw size={16} /> Actualiser</button>
            <button type="button" onClick={() => navigate('/membres')} className={`${field} flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800`}><ArrowLeft size={16} /> Retour aux membres</button>
          </div>
        </div>
      </header>
      <main className="stats-membres flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto space-y-5">
          {communesError && <p className="text-sm text-amber-700 dark:text-amber-400">{communesError}</p>}
          {error && <div role="alert" className={`${panel} p-5 text-rose-700 dark:text-rose-400`}>{error}</div>}
          {loading ? <div className={`${panel} p-12 flex items-center justify-center gap-3 text-sm text-slate-500`}><Loader2 size={20} className="animate-spin text-emerald-600" /> Chargement des statistiques...</div> : !error && <>
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Indicateurs des membres">
              {cards.map(({ title, value, Icon }) => <div key={title} className={`${panel} p-4 flex items-center gap-3.5 min-w-0`}><span className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center"><Icon size={18} /></span><div className="min-w-0"><p className="text-xs text-slate-500 dark:text-slate-400">{title}</p><p className="text-xl font-semibold tabular-nums mt-0.5">{value}</p></div></div>)}
            </section>
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <article className={`${panel} p-5 min-w-0`}><div className="flex items-center gap-2.5 mb-4"><span className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center"><UserRound size={16} /></span><div><h2 className="text-sm font-semibold">Répartition par sexe</h2><p className="text-xs text-slate-500 dark:text-slate-400">Composition des membres enregistrés</p></div></div>
                {stats.hommes + stats.femmes > 0 ? <div className="h-[290px] w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.genre} dataKey="value" nameKey="name" cx="50%" cy="46%" innerRadius="53%" outerRadius="75%" paddingAngle={3} stroke="none" label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>{stats.genre.map((item, index) => <Cell key={item.name} fill={COLORS[index]} />)}</Pie><Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12, color: '#0f172a' }} /><Legend verticalAlign="bottom" iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} /></PieChart></ResponsiveContainer></div> : <p className="text-sm text-slate-500 py-16 text-center">Aucune donnée disponible.</p>}
              </article>
              <article className={`${panel} p-5 min-w-0`}><div className="flex items-center gap-2.5 mb-4"><span className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center"><Users size={16} /></span><div><h2 className="text-sm font-semibold">Répartition par décennie de naissance</h2><p className="text-xs text-slate-500 dark:text-slate-400">Nombre de membres par période</p></div></div>
                {stats.naissances.length ? <div className="h-[290px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={stats.naissances} margin={{ top: 20, right: 12, left: -18, bottom: 6 }}><defs><linearGradient id="membres-decenie" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#047857" /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.22} /><XAxis dataKey="periode" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} /><Tooltip cursor={{ fill: '#94a3b8', fillOpacity: 0.08 }} contentStyle={{ borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12, color: '#0f172a' }} /><Bar dataKey="total" name="Membres" fill="url(#membres-decenie)" maxBarSize={44} radius={[6, 6, 0, 0]}><LabelList dataKey="total" position="top" style={{ fill: '#64748b', fontSize: 11 }} /></Bar></BarChart></ResponsiveContainer></div> : <p className="text-sm text-slate-500 py-16 text-center">Aucune année de naissance exploitable.</p>}
              </article>
            </section>
            {isAdmin && communeId === 'all' && <section className={`${panel} p-5 min-w-0`}><div className="flex items-center gap-2.5 mb-4"><span className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center"><MapPin size={16} /></span><div><h2 className="text-sm font-semibold">Membres par commune</h2><p className="text-xs text-slate-500 dark:text-slate-400">Répartition des membres entre les communes</p></div></div>
              {communesStats.length ? <div className="w-full" style={{ height: Math.max(280, communesStats.length * 44 + 65) }}><ResponsiveContainer width="100%" height="100%"><BarChart data={communesStats} layout="vertical" margin={{ top: 8, right: 38, left: 4, bottom: 8 }}><defs><linearGradient id="membres-commune" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#0284c7" /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" opacity={0.22} /><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} /><YAxis type="category" dataKey="nom" width={125} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} /><Tooltip cursor={{ fill: '#94a3b8', fillOpacity: 0.08 }} contentStyle={{ borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12, color: '#0f172a' }} /><Bar dataKey="membres" name="Membres" fill="url(#membres-commune)" maxBarSize={24} radius={[0, 5, 5, 0]}><LabelList dataKey="membres" position="right" style={{ fill: '#64748b', fontSize: 11 }} /></Bar></BarChart></ResponsiveContainer></div> : <p className="text-sm text-slate-500">Aucune commune disponible.</p>}
            </section>}
            <p className="text-xs text-slate-500 dark:text-slate-400 pb-2">Les statistiques sont calculées à partir des membres accessibles via l'API. Les ménages sont comptés parmi les membres affichés.</p>
          </>}
        </div>
      </main>
    </div>
  );
};
export default StatistiquesMembres;
