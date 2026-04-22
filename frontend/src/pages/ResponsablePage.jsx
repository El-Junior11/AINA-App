import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Edit2, X, Loader2, Save, Search, 
  Users, Printer, FileText, Download, BarChart3
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
      const [resMem, resRespo, resGroup] = await Promise.all([
        axios.get('http://localhost:5000/api/membres'),
        axios.get('http://localhost:5000/api/responsables'),
        axios.get('http://localhost:5000/api/groupes')
      ]);
  
      // 1. Raisina ny array (na aiza na aiza misy azy)
      const rawMembres = Array.isArray(resMem.data) ? resMem.data : (resMem.data.data || []);
      const rawGroupes = Array.isArray(resGroup.data) ? resGroup.data : (resGroup.data.data || []);
      const rawRespos = Array.isArray(resRespo.data) ? resRespo.data : (resRespo.data.data || []);
  
      const combinedData = rawMembres.map(m => {
        // 2. Mitady Poste
        const matchingRespo = rawRespos.find(r => 
          String(r.NumMembre || r.nummembre || "").trim() === String(m.nummembre || "").trim()
        );
        
        // 3. Mitady Groupe (Lojika mahery vaika: trim + case insensitive)
        const matchingGroup = rawGroupes.find(g => {
          // Hamarino ny anarana rehetra mety hisy (num_menage, nummenage, numMenage)
          const m_id = String(m.num_menage || m.nummenage || m.numMenage || "").trim();
          const g_id = String(g.nummenage || g.num_menage || g.numMenage || "").trim();
          
          return m_id !== "" && m_id === g_id;
        });
  
        return {
          ...m,
          nom_complet: `${m.nom_membre} ${m.prenom_membre || ''}`,
          // Jereo tsara ny anaran'ny saha 'nomgs' ato
          nomgs: matchingGroup ? (matchingGroup.nomgs || matchingGroup.nomGs || "Sans nom") : 'N/A', 
          Poste: matchingRespo ? matchingRespo.Poste : 'Membres',
          CodeRp: matchingRespo ? matchingRespo.CodeRp : null 
        };
      });
  
      setResponsables(combinedData);
      setFilteredData(combinedData);
    } catch (err) {
      console.error("Olana:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("LISTE DES RESPONSABLES - ONG TSINJO AINA", 14, 15);
    const tableData = filteredData.map((r, i) => [
      i + 1, 
      r.nom_complet, 
      r.nomgs, 
      r.Poste
    ]);
    autoTable(doc, {
      head: [['N°', 'Nom & Prénom', 'Groupe (GS)', 'Poste / Fonction']],
      body: tableData,
      startY: 25,
    });
    doc.save("responsables_tsinjo_aina.pdf");
  };

  const exportExcel = () => {
    const dataExcel = filteredData.map(r => ({
      Nom_Prenom: r.nom_complet,
      Groupe: r.nomgs,
      Poste: r.Poste
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Responsables");
    XLSX.writeFile(workbook, "responsables_tsinjo_aina.xlsx");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, {
        NumMembre: formData.NumMembre,
        Poste: formData.Poste
      });
      
      setShowModal(false);
      fetchData();
      Swal.fire({ icon: 'success', title: 'Mis à jour !', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({
        title: 'Erreur',
        text: "Une erreur est survenue : " + (err.response?.data?.message || err.message),
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 transition-colors font-sans">
      
      {/* HEADER */}
      <div className="p-6 flex flex-wrap justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-700 dark:text-blue-500 tracking-tighter uppercase">Responsables</h1>
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Attribution des postes du bureau</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2">
              <Printer size={20} />
              <span className="text-xs font-bold uppercase hidden md:block">Exporter</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-3 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-left">
                <button onClick={exportPDF} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-800">
                  <FileText size={16} className="text-red-500" /> PDF Document
                </button>
                <button onClick={exportExcel} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <Download size={16} className="text-emerald-600" /> Excel Spreadsheet
                </button>
              </div>
            )}
          </div>

          <button onClick={() => setShowStats(!showStats)} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-4 py-2.5 rounded-xl transition-all font-black text-xs uppercase">
            <BarChart3 size={18} />
            <span className="hidden sm:block">Statistiques</span>
          </button>
        </div>
      </div>

      {/* STATS SECTION */}
      {showStats && (
        <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in slide-in-from-top duration-300">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-b-4 border-blue-600 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase">Membres Total</span>
            <p className="text-2xl font-black text-slate-800 dark:text-white">{responsables.length}</p>
          </div>
          {['President', 'Tresorier', 'Secretaire'].map(p => (
            <div key={p} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-b-4 border-emerald-500 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase">{p}</span>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{responsables.filter(r => r.Poste === p).length}</p>
            </div>
          ))}
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="px-6 py-4 flex items-center gap-4">
        <div className="relative group flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" placeholder="Rechercher par nom, groupe ou poste..." 
            className="w-full pl-12 pr-12 py-4 rounded-[1.5rem] border-none bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium transition-all"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b dark:border-slate-800">
              <tr>
                <th className="px-8 py-5 text-left">Membre / GS</th>
                <th className="px-8 py-5 text-left">Poste Actuel</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="3" className="py-20 text-center"><Loader2 className="animate-spin inline text-blue-600" /></td></tr>
              ) : filteredData.map((r) => (
                <tr key={r.nummembre} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><Users size={18}/></div>
                      <div>
                        <div className="font-black text-slate-800 dark:text-slate-200 uppercase text-sm">
                          {r.nom_complet}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">
                          {r.nomgs}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm ${
                      r.Poste === 'Membres' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-blue-600 text-white shadow-blue-500/20'
                    }`}>
                      {r.Poste}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                    onClick={() => { 
                        setFormData({ 
                          NumMembre: r.nummembre, 
                          Poste: r.Poste === 'Membres' ? '' : r.Poste, 
                          CodeRp: r.CodeRp,
                          nom_complet: r.nom_complet
                        }); 
                        setShowModal(true); 
                    }}
                      className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Edit2 size={18}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL MODIFICATION */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Attribuer un Poste</h2>
                <p className="text-[10px] font-bold text-blue-200 uppercase">{formData.nom_complet}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Séléctionner le Poste</label>
                <select 
                  required 
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border-none outline-none focus:ring-2 focus:ring-blue-500 font-black text-sm transition-all" 
                  value={formData.Poste} 
                  onChange={(e) => setFormData({...formData, Poste: e.target.value})}
                >
                  <option value="" disabled>Choisir un poste...</option>
                  {postesDisponibles.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 transition-all">
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