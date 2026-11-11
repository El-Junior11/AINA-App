import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import { Users, Search, Edit2, X, Save, Loader2, Download, FileText, Eye, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logo from '../assets/logo.png';

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
const field = 'w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-emerald-600/30';
const btn = 'inline-flex items-center justify-center gap-2 h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-sm hover:bg-slate-100 dark:hover:bg-slate-800';
const postes = ['Membre', 'President', 'Tresorier', 'Secretaire', 'Conseiller'];
const normalize = data => Array.isArray(data) ? data : data?.groupes || data?.data || [];
const getError = e => e.response?.data?.message || e.response?.data?.error || 'Une erreur est survenue.';
const femme = v => ['F', 'FEMME', 'FEMININ', 'FÉMININ'].includes(String(v || '').toUpperCase());
const bureau = v => ['president', 'tresorier', 'secretaire'].includes(String(v || '').toLowerCase());

export default function ResponsablePage() {
  const navigate = useNavigate();
  const [groupes, setGroupes] = useState([]);
  const [communeId, setCommuneId] = useState('');
  const [codegs, setCodegs] = useState('');
  const [membres, setMembres] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [poste, setPoste] = useState('Membre');
  const [exportOpen, setExportOpen] = useState(false);

  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  });

  const admin = user.role === 'admin';
  const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  useEffect(() => {
    let active = true;
    axios.get('/groupes', auth()).then(({ data }) => {
      if (active) setGroupes(normalize(data));
    }).catch(e => Toast.fire({ icon: 'error', title: getError(e) }));
    return () => { active = false; };
  }, []);

  const communes = useMemo(() => {
    const map = new Map();
    groupes.forEach(g => {
      if (g.commune_id) map.set(String(g.commune_id), g.commune || `Commune ${g.commune_id}`);
    });
    return [...map].map(([id, nom]) => ({ id, nom })).sort((a, b) => a.nom.localeCompare(b.nom));
  }, [groupes]);

  const groupesFiltres = useMemo(() => groupes.filter(g =>
    !communeId || String(g.commune_id) === communeId
  ), [groupes, communeId]);

  useEffect(() => {
    if (!codegs) { setMembres([]); return; }
    let active = true;
    setLoading(true);
    setMembres([]);

    axios.get(`/groupes/${codegs}/membres`, auth()).then(({ data }) => {
      if (active) setMembres(normalize(data));
    }).catch(e => {
      if (active) Toast.fire({ icon: 'error', title: getError(e) });
    }).finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [codegs]);

  const filtered = useMemo(() => membres.filter(m =>
    `${m.nom_membre} ${m.prenom_membre} ${m.Poste} ${m.numero_menage}`.toLowerCase().includes(search.toLowerCase())
  ), [membres, search]);

  const nom = m => `${m.nom_membre || ''} ${m.prenom_membre || ''}`.trim();
  const groupe = groupes.find(g => String(g.codegs) === codegs);

  const openModal = m => {
    setModal(m);
    setPoste(m.Poste || 'Membre');
  };

  const save = async e => {
    e.preventDefault();
    if (!modal || !codegs) return;
    setSaving(true);

    try {
      const payload = { NumMembre: Number(modal.nummembre), codegs: Number(codegs), Poste: poste };
      if (modal.CodeRp) await axios.put(`/responsables/${modal.CodeRp}`, { Poste: poste }, auth());
      else await axios.post('/responsables', payload, auth());

      const { data } = await axios.get(`/groupes/${codegs}/membres`, auth());
      setMembres(normalize(data));
      setModal(null);
      Toast.fire({ icon: 'success', title: 'Poste enregistré' });
    } catch (e) {
      Toast.fire({ icon: 'error', title: getError(e) });
    } finally { setSaving(false); }
  };

  const exportData = type => {
    if (!filtered.length) return Toast.fire({ icon: 'warning', title: 'Aucune donnée à exporter' });
    const rows = filtered.map((m, i) => [i + 1, nom(m), m.numero_menage, groupe?.nomgs || '', m.Poste || 'Membre']);

    try {
      if (type === 'pdf') {
        const doc = new jsPDF();
        doc.addImage(logo, 'PNG', 14, 10, 18, 18);
        doc.setFontSize(14);
        doc.text('ONG TSINJO AINA - Responsables', 38, 20);
        doc.setFontSize(9);
        doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')}`, 14, 36);
        autoTable(doc, { startY: 42, head: [['N°', 'Nom complet', 'Ménage', 'Groupe', 'Poste']], body: rows });
        doc.save('responsables_tsinjo_aina.pdf');
      } else {
        const sheet = XLSX.utils.aoa_to_sheet([['N°', 'Nom complet', 'Ménage', 'Groupe', 'Poste'], ...rows]);
        const book = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(book, sheet, 'Responsables');
        XLSX.writeFile(book, 'responsables_tsinjo_aina.xlsx');
      }
      setExportOpen(false);
    } catch (e) {
      console.error(e);
      Toast.fire({ icon: 'error', title: "Erreur lors de l'export" });
    }
  };

  const input = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm';

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 md:p-6 space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950 rounded-xl text-emerald-700"><Users size={22}/></div>
          <div>
            <h1 className="text-xl font-bold">Gestion des responsables</h1>
            <p className="text-sm text-slate-500">Gestion des postes par groupe et commune</p>
          </div>
        </div>
        <button onClick={() => navigate('/responsables/details', { state: { communeId, codegs } })} className={`${btn} bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800`}>
          <Eye size={17}/> Voir plus
        </button>
      </header>

      <section className={`${input} p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`}>
        {admin && (
          <select className={field} value={communeId} onChange={e => { setCommuneId(e.target.value); setCodegs(''); }}>
            <option value="">Toutes les communes</option>
            {communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        )}
        <select className={field} value={codegs} onChange={e => setCodegs(e.target.value)}>
          <option value="">Sélectionner un groupe</option>
          {groupesFiltres.map(g => <option key={g.codegs} value={g.codegs}>{g.nomgs}</option>)}
        </select>
        <div className="relative">
          <Search size={17} className="absolute left-3 top-3 text-slate-400"/>
          <input className={`${field} pl-10`} placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="relative">
          <button className={`${btn} w-full`} onClick={() => setExportOpen(!exportOpen)}><Printer size={17}/> Exporter</button>
          {exportOpen && (
            <div className={`${input} absolute right-0 top-12 z-20 w-full p-2 space-y-1`}>
              <button className={`${btn} w-full`} onClick={() => exportData('pdf')}><FileText size={16}/> PDF</button>
              <button className={`${btn} w-full`} onClick={() => exportData('excel')}><Download size={16}/> Excel</button>
            </div>
          )}
        </div>
      </section>

      <section className={`${input} overflow-hidden`}>
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold">Liste des membres</h2>
          <span className="text-sm text-slate-500">{filtered.length} membre(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <tr>{['N°', 'Membre', 'Ménage', 'Groupe', 'Poste', 'Action'].map(t => <th key={t} className="px-4 py-3">{t}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="text-center p-10"><Loader2 className="animate-spin inline text-emerald-600"/></td></tr>
              ) : filtered.map((m, i) => (
                <tr key={m.nummembre} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{nom(m)}</td>
                  <td className="px-4 py-3">{m.numero_menage}</td>
                  <td className="px-4 py-3">{m.nomgs}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">{m.Poste || 'Membre'}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => openModal(m)} className="p-2 rounded-lg hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-700" title="Modifier le poste"><Edit2 size={17}/></button>
                  </td>
                </tr>
              ))}
              {!loading && !filtered.length && (
                <tr><td colSpan={6} className="text-center p-10 text-slate-500">{codegs ? 'Aucun membre trouvé' : 'Sélectionnez un groupe'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form onSubmit={save} className={`${input} w-full max-w-md p-5 space-y-4`}>
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">Modifier le poste</h2>
              <button type="button" onClick={() => setModal(null)}><X size={20}/></button>
            </div>
            <div><label className="text-sm">Membre</label><input className={field} value={nom(modal)} disabled/></div>
            <div><label className="text-sm">Groupe</label><input className={field} value={modal.nomgs || ''} disabled/></div>
            <div>
              <label className="text-sm">Poste / Fonction</label>
              <select className={field} value={poste} onChange={e => setPoste(e.target.value)}>
                {postes.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className={btn} onClick={() => setModal(null)}>Annuler</button>
              <button disabled={saving} className={`${btn} bg-emerald-700 text-white border-emerald-700`}>
                {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}