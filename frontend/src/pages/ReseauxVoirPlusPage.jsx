import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from '../api/axios';
import { ArrowLeft, Network, UsersRound, ShieldCheck, BarChart3, MapPin, Loader2 } from 'lucide-react';
const card = 'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm';
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
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [r, c] = await Promise.all([
          axios.get('/reseaux', config),
          isAdmin ? axios.get('/communes', config) : Promise.resolve({ data: [] })
        ]);
        if (!active) return;
        setReseaux(Array.isArray(r.data) ? r.data : Array.isArray(r.data?.data) ? r.data.data : []);
        setCommunes(Array.isArray(c.data) ? c.data : Array.isArray(c.data?.data) ? c.data.data : []);
      } catch (e) {
        if (active) setError(e.response?.data?.message || 'Impossible de charger les réseaux.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [isAdmin]);
  const visible = useMemo(() => reseaux.filter(r => {
    const communeId = Number(r.commune_id);
    if (!isAdmin && communeId !== Number(user?.commune_id)) return false;
    return !isAdmin || !communeFilter || communeId === Number(communeFilter);
  }), [reseaux, isAdmin, user?.commune_id, communeFilter]);
  const totalGroupes = useMemo(() => {
    const ids = new Set();
    visible.forEach(r => {
      const linked = Array.isArray(r.groupes_ids) ? r.groupes_ids :
        Array.isArray(r.groupes) ? r.groupes.map(g => g.codegs) : [];
      linked.forEach(id => { if (id != null) ids.add(Number(id)); });
    });
    return ids.size;
  }, [visible]);
  const autonomes = visible.filter(r => r.Autonomie === 'Oui').length;
  const enCours = visible.length - autonomes;
  const taux = visible.length ? Math.round(autonomes / visible.length * 100) : 0;
  const communeName = r => r.NomCommune || communes.find(c => Number(c.id_commune) === Number(r.commune_id))?.nom_commune || '—';
  const stats = [
    { label: 'Total réseaux', value: visible.length, icon: Network, color: 'text-sky-700 dark:text-sky-400' },
    { label: 'Groupes liés (identifiants)', value: totalGroupes, icon: UsersRound, color: 'text-indigo-700 dark:text-indigo-400' },
    { label: 'Réseaux autonomes', value: autonomes, icon: ShieldCheck, color: 'text-emerald-700 dark:text-emerald-400' },
    { label: 'En structuration', value: enCours, icon: BarChart3, color: 'text-amber-700 dark:text-amber-400' }
  ];
  return (
    <main className="min-h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/reseaux')} aria-label="Retour aux réseaux" className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowLeft size={19} /></button>
          <div>
            <h1 className="text-xl font-semibold">Vue d'ensemble des réseaux</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Statistiques des réseaux communautaires</p>
          </div>
        </div>
        {isAdmin && <label className="flex items-center gap-2 text-sm"><MapPin size={16} />
          <select value={communeFilter} onChange={e => setCommuneFilter(e.target.value)} className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3">
            <option value="">Toutes les communes</option>
            {communes.map(c => <option key={c.id_commune} value={c.id_commune}>{c.nom_commune}</option>)}
          </select>
        </label>}
      </header>
      {loading ? <div className="flex items-center gap-2 text-slate-500"><Loader2 className="animate-spin" /> Chargement...</div> : error ?
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : <>
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Indicateurs des réseaux">
            {stats.map(s => <article key={s.label} className={card}>
              <s.icon className={s.color} size={22} />
              <p className="text-3xl font-semibold mt-4 tabular-nums">{s.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
            </article>)}
          </section>
          <section className={card}>
            <div className="flex justify-between items-center gap-3 mb-3"><h2 className="font-semibold">Taux d'autonomie</h2><strong>{taux} %</strong></div>
            <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full bg-emerald-600 rounded-full" style={{ width: `${taux}%` }} /></div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">{autonomes} réseau(x) autonome(s) sur {visible.length}.</p>
          </section>
          <section className={`${card} overflow-x-auto`}>
            <h2 className="font-semibold mb-4">Détail des réseaux</h2>
            <table className="w-full min-w-[700px] text-sm text-left">
              <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-500"><tr><th className="py-3 pr-4">Réseau</th><th className="py-3 pr-4">Commune</th><th className="py-3 pr-4">Activité</th><th className="py-3 pr-4">Plaidoyer</th><th className="py-3 pr-4">Plan</th><th className="py-3">Autonomie</th></tr></thead>
              <tbody>{visible.map(r => <tr key={r.codeRS} className="border-b border-slate-100 dark:border-slate-800"><td className="py-3 pr-4 font-medium">{r.NomRS}</td><td className="py-3 pr-4">{communeName(r)}</td><td className="py-3 pr-4">{r.Activite || 'Non'}</td><td className="py-3 pr-4">{r.Plaidoyer || 'Non'}</td><td className="py-3 pr-4">{r.Plan || 'Non'}</td><td className="py-3">{r.Autonomie === 'Oui' ? 'Autonome' : 'En cours'}</td></tr>)}</tbody>
            </table>
            {!visible.length && <p className="text-sm text-slate-500 py-5">Aucun réseau disponible.</p>}
          </section>
        </>}
    </main>
  );
}
