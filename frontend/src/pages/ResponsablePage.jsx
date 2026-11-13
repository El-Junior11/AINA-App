import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import { Users, Search, Edit2, X, Save, Loader2, Download, FileText, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logo from '../assets/logo.png';

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
const field = 'w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-600/30';
const btn = 'inline-flex items-center justify-center gap-2 h-10 px-3 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 text-sm hover:bg-slate-100 dark:hover:bg-[#1e293b]';
const card = 'bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#263449] rounded-xl shadow-sm';
const postes = ['Membre', 'President', 'Tresorier', 'Secretaire', 'Conseiller'];
const list = data => Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.groupes) ? data.groupes : Array.isArray(data?.membres) ? data.membres : [];
const message = e => e.response?.data?.message || e.response?.data?.error || 'Une erreur est survenue.';
const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const fullName = m => `${m.nom_membre || ''} ${m.prenom_membre || ''}`.trim();
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function ResponsablePage() {
  const navigate = useNavigate();
  const [groupes, setGroupes] = useState([]);
  const [membres, setMembres] = useState([]);
  const [communeId, setCommuneId] = useState('');
  const [codegs, setCodegs] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [poste, setPoste] = useState('Membre');
  const [exportOpen, setExportOpen] = useState(false);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState('');
  const [user] = useState(() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } });
  const admin = user.role === 'admin';

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const { data } = await axios.get('/groupes', auth());
        const all = list(data);
        const permitted = admin ? all : all.filter(g => !user.commune_id || String(g.commune_id) === String(user.commune_id));
        if (!active) return;
        setGroupes(permitted);
        // Le backend expose les membres par groupe : agréger tous les groupes pour la vue par défaut.
        const results = [];
        const failed = [];
        for (let i = 0; i < permitted.length; i += 6) {
          if (!active) return;
          const batch = await Promise.allSettled(permitted.slice(i, i + 6).map(g => axios.get(`/groupes/${g.codegs}/membres`, auth())));
          batch.forEach((result, index) => {
            const g = permitted[i + index];
            if (result.status === 'rejected') { failed.push(g.nomgs); return; }
            list(result.value.data).forEach(m => results.push({ ...m, codegs: g.codegs, nomgs: g.nomgs, commune_id: g.commune_id, commune: g.commune || g.nom_commune || '' }));
          });
        }
        if (!active) return;
        const unique = new Map();
        results.forEach(m => unique.set(`${m.codegs}:${m.nummembre ?? m.NumMembre ?? fullName(m)}`, m));
        setMembres([...unique.values()]);
        if (failed.length) setError(`Chargement incomplet : ${failed.length} groupe(s) inaccessible(s).`);
      } catch (e) {
        if (active) { setError(message(e)); setGroupes([]); setMembres([]); }
      } finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [admin, user.commune_id, reload]);

  const communes = useMemo(() => {
    const map = new Map();
    groupes.forEach(g => { if (g.commune_id != null) map.set(String(g.commune_id), g.commune || g.nom_commune || `Commune ${g.commune_id}`); });
    return [...map].map(([id, nom]) => ({ id, nom })).sort((a, b) => a.nom.localeCompare(b.nom));
  }, [groupes]);
  const groupesFiltres = useMemo(() => groupes.filter(g => !communeId || String(g.commune_id) === communeId), [groupes, communeId]);
  const filtered = useMemo(() => membres.filter(m => {
    if (communeId && String(m.commune_id) !== communeId) return false;
    if (codegs && String(m.codegs) !== codegs) return false;
    return norm([fullName(m), m.Poste, m.numero_menage ?? m.num_menage, m.nomgs, m.commune].join(' ')).includes(norm(search));
  }), [membres, communeId, codegs, search]);
  const openModal = m => { setModal(m); setPoste(m.Poste || 'Membre'); };
  const save = async e => {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    try {
      const payload = { NumMembre: Number(modal.nummembre ?? modal.NumMembre), codegs: Number(modal.codegs), Poste: poste };
      if (modal.CodeRp) await axios.put(`/responsables/${modal.CodeRp}`, { Poste: poste }, auth());
      else await axios.post('/responsables', payload, auth());
      setModal(null); setReload(n => n + 1);
      Toast.fire({ icon: 'success', title: 'Poste enregistré' });
    } catch (e) { Toast.fire({ icon: 'error', title: message(e) }); }
    finally { setSaving(false); }
  };
  const exportData = type => {
    if (!filtered.length) return Toast.fire({ icon: 'warning', title: 'Aucune donnée à exporter' });
    const head = ['N°', 'Nom complet', 'Ménage', 'Groupe', 'Commune', 'Poste'];
    const rows = filtered.map((m, i) => [i + 1, fullName(m), m.numero_menage ?? m.num_menage ?? '', m.nomgs || '', m.commune || '', m.Poste || 'Membre']);
    try {
      if (type === 'pdf') {
        const doc = new jsPDF();
        try { doc.addImage(logo, 'PNG', 14, 10, 18, 18); } catch (e) { console.warn('Logo PDF non disponible', e); }
        doc.setFontSize(14); doc.text('ONG TSINJO AINA - Responsables', 38, 20);
        doc.setFontSize(9); doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')}`, 14, 36);
        autoTable(doc, { startY: 42, head: [head], body: rows, styles: { fontSize: 8 } });
        doc.save('responsables_tsinjo_aina.pdf');
      } else {
        const sheet = XLSX.utils.aoa_to_sheet([head, ...rows]);
        sheet['!cols'] = [6, 28, 12, 24, 22, 18].map(wch => ({ wch }));
        const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, 'Responsables');
        XLSX.writeFile(book, 'responsables_tsinjo_aina.xlsx');
      }
      setExportOpen(false);
    } catch (e) { console.error(e); Toast.fire({ icon: 'error', title: "Erreur lors de l'export" }); }
  };

  return (
    <div className="responsables-page flex flex-col h-full min-h-0 overflow-hidden bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white antialiased">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap'); .responsables-page { font-family: 'Public Sans', system-ui, sans-serif; }`}</style>
      <header className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-4 md:py-5 space-y-4">
        <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center"><Users size={20}/></div>
        <div><h1 className="text-lg font-semibold">Gestion des responsables</h1><p className="text-sm text-slate-500 dark:text-slate-400">Gestion des postes par groupe et commune</p></div>
        </div>
        <section className="flex flex-wrap items-center gap-2">
        <div className="relative flex-[2_1_260px] min-w-[190px]"><Search size={17} className="absolute left-3 top-3 text-slate-400"/><input className={`${field} pl-10`} placeholder="Rechercher dans toutes les colonnes..." value={search} onChange={e => setSearch(e.target.value)}/></div>
        {admin && <select aria-label="Commune" className={`${field} w-full sm:w-auto sm:min-w-[165px]`} value={communeId} onChange={e => { setCommuneId(e.target.value); setCodegs(''); }}><option value="">Toutes les communes</option>{communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>}
        <select aria-label="Groupe" className={`${field} w-full sm:w-auto sm:min-w-[165px]`} value={codegs} onChange={e => setCodegs(e.target.value)}><option value="">Tous les groupes</option>{groupesFiltres.map(g => <option key={g.codegs} value={g.codegs}>{g.nomgs}</option>)}</select>
        <button type="button" onClick={() => navigate('/responsables/details', { state: { communeId, codegs } })} className={btn}><Eye size={17}/> Voir plus</button>
        <div className="relative"><button type="button" className={btn} onClick={() => setExportOpen(v => !v)} aria-expanded={exportOpen}><Download size={17}/> Exporter</button>
          {exportOpen && <div className={`${card} absolute right-0 top-12 z-20 w-40 p-2 space-y-1`}><button type="button" className={`${btn} w-full`} onClick={() => exportData('pdf')}><FileText size={16}/> PDF</button><button type="button" className={`${btn} w-full`} onClick={() => exportData('excel')}><Download size={16}/> Excel</button></div>}
        </div>
        </section>
      </header>
      <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
      <section className={`${card} overflow-hidden max-w-[1600px] mx-auto`}>
        {error && <p role="alert" className="px-4 py-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">{error}</p>}
        <div className="overflow-x-auto"><table className="w-full min-w-[880px] text-sm text-left">
          <thead className="bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300"><tr>{['N°', 'Membre', 'Ménage', 'Groupe', 'Commune', 'Poste', 'Action'].map(t => <th key={t} className="px-5 py-3.5 font-medium">{t}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#263449]">
            {loading ? <tr><td colSpan={7} className="text-center p-10"><Loader2 className="animate-spin inline text-emerald-600"/></td></tr> : filtered.map((m, i) => (
              <tr key={`${m.codegs}:${m.nummembre ?? m.NumMembre ?? i}`} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/70">
                <td className="px-5 py-4">{i + 1}</td><td className="px-5 py-4 font-medium">{fullName(m)}</td>
                <td className="px-5 py-4">{m.numero_menage ?? m.num_menage ?? '—'}</td><td className="px-5 py-4">{m.nomgs || '—'}</td><td className="px-5 py-4">{m.commune || '—'}</td>
                <td className="px-5 py-4"><span className="px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">{m.Poste || 'Membre'}</span></td>
                <td className="px-5 py-4"><button type="button" onClick={() => openModal(m)} className="p-2 rounded-lg hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-700" title="Modifier le poste"><Edit2 size={17}/></button></td>
              </tr>
            ))}
            {!loading && !filtered.length && <tr><td colSpan={7} className="text-center p-10 text-slate-500">Aucun membre trouvé</td></tr>}
          </tbody>
        </table></div>
      </section>
      </main>
      {modal && <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
        <form onSubmit={save} className={`${card} w-full max-w-md p-5 space-y-4`}>
          <div className="flex justify-between items-center"><h2 className="font-bold text-lg">Modifier le poste</h2><button type="button" onClick={() => setModal(null)} aria-label="Fermer"><X size={20}/></button></div>
          <div><label className="text-sm">Membre</label><input className={field} value={fullName(modal)} disabled/></div>
          <div><label className="text-sm">Groupe</label><input className={field} value={modal.nomgs || ''} disabled/></div>
          <div><label className="text-sm">Poste / Fonction</label><select className={field} value={poste} onChange={e => setPoste(e.target.value)}>{postes.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          <div className="flex justify-end gap-2"><button type="button" className={btn} onClick={() => setModal(null)}>Annuler</button><button disabled={saving} className={`${btn} !bg-emerald-700 !text-white !border-emerald-700`}>{saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Enregistrer</button></div>
        </form>
      </div>}
    </div>
  );
}
