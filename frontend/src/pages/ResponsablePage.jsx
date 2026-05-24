import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Edit2, X, Loader2, Save, Search, Users, 
  Printer, FileText, Download, BarChart3, CheckCircle2, ShieldCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

const ResponsablePage = () => {
  const [responsables, setResponsables] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const [formData, setFormData] = useState({ NumMembre: '', Poste: '', CodeRp: null, nom_complet: '' });

  const API_URL = 'http://localhost:5000/api/responsables';
  const postesDisponibles = ['President', 'Tresorier', 'Secretaire', 'Conseiller', 'Animateur', 'Membres'];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const results = responsables.filter(r => 
      `${r.nom_complet} ${r.nomgs} ${r.Poste}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(results);
  }, [searchTerm, responsables]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      const [resMem, resRespo, resGroup] = await Promise.all([
        axios.get('http://localhost:5000/api/membres', config).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/responsables', config).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/groupes', config).catch(() => ({ data: [] }))
      ]);

      const listMembres = Array.isArray(resMem.data) ? resMem.data : (resMem.data.data || []);
      const listRespos = Array.isArray(resRespo.data) ? resRespo.data : (resRespo.data.data || []);
      const listGroupes = Array.isArray(resGroup.data) ? resGroup.data : (resGroup.data.groupes || resGroup.data.data || []);

      const combinedData = listMembres.map(m => {
        const idMembre = m.nummembre || m.NumMembre || m.id;
        const matchingRespo = listRespos.find(r => 
          String(r.NumMembre || r.nummembre) === String(idMembre)
        );
        
        const idMenage = m.num_menage || m.nummenage;
        const matchingGroup = listGroupes.find(g => 
          String(g.nummenage || g.num_menage) === String(idMenage)
        );

        return {
          ...m,
          nom_complet: `${m.nom_membre || ''} ${m.prenom_membre || ''}`.trim(),
          nomgs: matchingGroup ? (matchingGroup.nomgs || "Groupe sans nom") : 'Aucun groupe',
          Poste: matchingRespo ? matchingRespo.Poste : 'Membres', 
          CodeRp: matchingRespo ? (matchingRespo.CodeRp || matchingRespo.coderp) : null,
          sexe: m.sexe || m.Sexe || 'M'
        };
      });

      setResponsables(combinedData);
      setFilteredData(combinedData);
    } catch (err) {
      console.error("Erreur lors de la fusion des données :", err);
      Toast.fire({ icon: 'error', title: 'Erreur lors du chargement des données' });
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("LISTE DES RESPONSABLES - ONG TSINJO AINA", 14, 15);
      const tableData = filteredData.map((r, i) => [i + 1, r.nom_complet, r.nomgs, r.Poste]);
      autoTable(doc, {
        head: [['N°', 'Nom & Prénom', 'Groupe (GS)', 'Poste / Fonction']],
        body: tableData,
        startY: 25,
      });
      doc.save("responsables_tsinjo_aina.pdf");
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export PDF réussi' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Impossible de générer le fichier PDF' });
    }
  };

  const exportExcel = () => {
    try {
      const dataExcel = filteredData.map(r => ({ Nom_Prenom: r.nom_complet, Groupe: r.nomgs, Poste: r.Poste }));
      const worksheet = XLSX.utils.json_to_sheet(dataExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Responsables");
      XLSX.writeFile(workbook, "responsables_tsinjo_aina.xlsx");
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export Excel réussi' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Impossible de générer le fichier Excel' });
    }
  };

  const exportBureauFemmesPDF = () => {
    try {
      const bureauPostes = ['President', 'Tresorier', 'Secretaire'];
      const dataBureauFemmes = responsables.filter(r => 
        bureauPostes.includes(r.Poste) && 
        (String(r.sexe).toUpperCase() === 'FEMME' || String(r.sexe).toUpperCase() === 'F')
      );
      
      const doc = new jsPDF();
      doc.setTextColor(0, 150, 255); 
      doc.setFontSize(16);
      doc.text("LISTE DES FEMMES AUX MEMBRES DU BUREAU", 14, 15);
      
      const tableData = dataBureauFemmes.map((r, i) => [i + 1, r.nom_complet, r.nomgs, r.Poste]);

      autoTable(doc, {
        head: [['N°', 'Nom & Prénom', 'Groupe', 'Poste']],
        body: tableData,
        startY: 25,
        headStyles: { fillColor: [135, 206, 250] } 
      });
      
      doc.save("femmes_bureau_tsinjo_aina.pdf");
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export PDF Femmes réussi' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Impossible de générer le fichier PDF' });
    }
  };

  const exportBureauFemmesExcel = () => {
    try {
      const bureauPostes = ['President', 'Tresorier', 'Secretaire'];
      
      const dataBureauFemmes = responsables
        .filter(r => 
          bureauPostes.includes(r.Poste) && 
          (String(r.sexe).toUpperCase() === 'FEMME' || String(r.sexe).toUpperCase() === 'F')
        )
        .map(r => ({ 
          Nom_Prenom: r.nom_complet, 
          Groupe: r.nomgs, 
          Poste: r.Poste 
        }));

      const worksheet = XLSX.utils.json_to_sheet(dataBureauFemmes);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Femmes Bureau");
      XLSX.writeFile(workbook, "femmes_bureau_tsinjo_aina.xlsx");
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export Excel Femmes réussi' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Impossible de générer le fichier Excel' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userString = localStorage.getItem('user'); 
      const user = userString ? JSON.parse(userString) : null;

      if (!user || (!user.id && !user.user_id)) {
        return Toast.fire({
          icon: 'error',
          title: "Erreur d'authentification"
        });
      }

      const payload = {
        NumMembre: Number(formData.NumMembre),
        Poste: formData.Poste,
        user_id: user.id || user.user_id 
      };

      await axios.post(API_URL, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setShowModal(false);
      fetchData();
      Toast.fire({ icon: 'success', title: 'Mise à jour réussie avec succès' });

    } catch (err) {
      console.error("Erreur serveur :", err.response?.data);
      Toast.fire({
        icon: 'error',
        title: "Erreur lors de l'enregistrement"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 transition-colors font-sans">
      
      <div className="p-6 flex flex-wrap justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-700 dark:text-blue-500 tracking-tighter uppercase ">Gestion des Responsables</h1>
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Attribution des postes du bureau</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
              <Printer size={20} />
              <span className="text-xs font-bold uppercase hidden md:block">Exporter</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-widest">Global</div>
                <button onClick={exportPDF} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-800"><FileText size={16} className="text-red-500" /> Document PDF</button>
                <button onClick={exportExcel} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-800"><Download size={16} className="text-emerald-600" /> Feuille Excel</button>
                
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-widest">Femmes Bureau</div>
                <button onClick={exportBureauFemmesPDF} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-blue-700 dark:text-blue-400 border-b dark:border-slate-800"><ShieldCheck size={16} /> Bureau Femmes (PDF)</button>
                <button onClick={exportBureauFemmesExcel} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-blue-700 dark:text-blue-400"><Download size={16} /> Bureau Femmes (Excel)</button>
              </div>
            )}
          </div>
          <button onClick={() => setShowStats(!showStats)} className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-all font-black text-xs uppercase">
            <BarChart3 size={18} /><span className="hidden sm:block">{showStats ? 'Fermer' : 'Statistiques'}</span>
          </button>
        </div>
      </div>

      {showStats && (
        <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in slide-in-from-top duration-300">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-b-4 border-blue-600 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase">Total Membres</span>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{responsables.length}</p>
          </div>
          {['President', 'Tresorier', 'Secretaire'].map((p, idx) => (
            <div key={p} className={`bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-b-4 ${idx === 0 ? 'border-emerald-600' : idx === 1 ? 'border-pink-500' : 'border-amber-500'} shadow-sm`}>
              <span className="text-[10px] font-black text-slate-400 uppercase">{p}</span>
              <p className="text-3xl font-black text-slate-800 dark:text-white">{responsables.filter(r => r.Poste === p).length}</p>
            </div>
          ))}
        </div>
      )}

      <div className="px-6 py-4 flex items-center gap-4">
        <div className="relative group flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input type="text" placeholder="Rechercher par nom, groupe ou poste..." className="w-full pl-12 pr-12 py-4 rounded-[1.5rem] border-none bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-100 hover:bg-red-100 p-1.5 rounded-full text-slate-400 hover:text-red-500 transition-all"><X size={16} /></button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <table className="w-full flex flex-col">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[14px] font-black tracking-widest text-slate-500 border-b dark:border-slate-800 w-full">
              <tr className="flex w-full">
                <th className="px-6 py-5 text-left w-20 flex-shrink-0">N°</th>
                <th className="px-6 py-5 text-left flex-1">Responsable / Membre</th>
                <th className="px-6 py-5 text-center w-48 flex-shrink-0">Groupe GS</th>
                <th className="px-6 py-5 text-center w-48 flex-shrink-0">Poste / Fonction</th>
                <th className="px-6 py-5 text-right w-32 flex-shrink-0">Actions</th>
              </tr>
            </thead>
            <tbody 
              className="flex flex-col w-full overflow-y-auto" 
              style={{ maxHeight: 'calc(68px * 3)' }}
            >
              {loading ? (
                <tr className="w-full"><td className="p-20 text-center w-full"><Loader2 size={30} className="animate-spin inline text-blue-600" /></td></tr>
              ) : filteredData.map((r, index) => (
                <tr key={r.nummembre} className="flex w-full items-center hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <td className="px-6 py-4 text-xs font-black text-slate-400 w-20 flex-shrink-0">{index + 1}</td>
                  <td className="px-6 py-4 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Users size={16}/></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase truncate">{r.nom_complet}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">ID: #{r.nummembre}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center w-48 flex-shrink-0">
                    <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md uppercase">{r.nomgs}</span>
                  </td>
                  <td className="px-6 py-4 text-center w-48 flex-shrink-0">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm ${
                      r.Poste === 'Membres' ? 'bg-slate-100 text-slate-500' : 'bg-blue-600 text-white shadow-blue-500/20'
                    }`}>
                      {r.Poste}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right w-32 flex-shrink-0">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { 
                            setFormData({ NumMembre: r.nummembre, Poste: r.Poste === 'Membres' ? '' : r.Poste, CodeRp: r.CodeRp, nom_complet: r.nom_complet }); 
                            setShowModal(true); 
                        }} 
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredData.length === 0 && (
                <tr className="w-full"><td className="p-20 text-center text-slate-300 font-black uppercase tracking-widest w-full">Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in duration-300">
            <div className="px-10 py-8 bg-blue-600 flex justify-between items-center text-white">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Attribuer un Poste</h2>
                <p className="text-[10px] font-bold text-blue-200 uppercase">{formData.nom_complet}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Sélectionner la fonction</label>
                <select 
                  required 
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-black text-slate-800 dark:text-white transition-all" 
                  value={formData.Poste} 
                  onChange={(e) => setFormData({...formData, Poste: e.target.value})}
                >
                  <option value="" disabled>Choisir un poste...</option>
                  {postesDisponibles.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 transition-all uppercase tracking-widest mt-4">
                <Save size={20} /> Enregistrer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsablePage;