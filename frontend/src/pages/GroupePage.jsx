import React, { useState, useEffect } from 'react';
import { getGroupes, getMenagesList, createGroupe, deleteGroupe, updateGroupe } from '../services/groupeService';
import Swal from 'sweetalert2';
import { 
  Trash2, Edit2, Users, X, Loader2, Save, CheckCircle2, 
  MapPin, Search, FileText, Download, Printer, FileSpreadsheet, Plus
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const GroupePage = () => {
  const [groupes, setGroupes] = useState([]);
  const [filteredGroupes, setFilteredGroupes] = useState([]);
  const [menagesDisponibles, setMenagesDisponibles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    nomgs: '',
    nummenage: [], // Tehirizina ho array eto ny selection
    commune: '',
    fokontany: '',
    village: ''
  });

  useEffect(() => { fetchData(); }, []);

  // RECHERCHE MULTI-CRITÈRES
  useEffect(() => {
    const results = groupes.filter(g => {
      const searchTarget = `${g.nomgs} ${g.nummenage} ${g.commune} ${g.fokontany} ${g.village}`.toLowerCase();
      return searchTarget.includes(searchTerm.toLowerCase());
    });
    setFilteredGroupes(results);
  }, [searchTerm, groupes]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resGroupes, resMenages] = await Promise.all([getGroupes(), getMenagesList()]);
      setGroupes(resGroupes.data);
      setFilteredGroupes(resGroupes.data);
      setMenagesDisponibles(resMenages.data);
    } catch {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Connexion au serveur impossible.' });
    } finally { setLoading(false); }
  };

  // EXPORT PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des Groupes Solidaires - ONG Tsinjo Aina", 14, 15);
    const tableData = filteredGroupes.map((g, i) => [
      i + 1, g.nomgs, g.nummenage, g.village, g.fokontany, g.commune
    ]);
    autoTable(doc, {
      head: [['N°', 'Nom GS', 'Ménages', 'Village', 'Fokontany', 'Commune']],
      body: tableData,
      startY: 20,
    });
    doc.save("groupes_tsinjo_aina.pdf");
  };

  // EXPORT EXCEL
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredGroupes);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Groupes");
    XLSX.writeFile(workbook, "groupes_tsinjo_aina.xlsx");
  };

  const handleCheck = (num) => {
    setFormData(prev => ({
      ...prev,
      nummenage: prev.nummenage.includes(num)
        ? prev.nummenage.filter(item => item !== num)
        : [...prev.nummenage, num]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingId) {
        await updateGroupe(editingId, formData);
      } else {
        await createGroupe(formData);
      }
      setShowModal(false);
      resetForm();
      fetchData();
      Swal.fire({ icon: 'success', title: 'Enregistré !', timer: 1500, showConfirmButton: false });
    } catch  {
      Swal.fire({ icon: 'error', title: 'Erreur', text: "Erreur lors de l'enregistrement" });
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Supprimer ?',
      text: "Voulez-vous vraiment supprimer ce groupe ?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Oui'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteGroupe(id);
          fetchData();
          Swal.fire({ icon: 'success', title: 'Supprimé', timer: 1000, showConfirmButton: false });
        } catch { Swal.fire('Erreur', 'Action impossible.', 'error'); }
      }
    });
  };

  const openEditModal = (g) => {
    setEditingId(g.codegs);
    // Raha string ny nummenage avy any amin'ny DB (M01, M02), ovaina array ho an'ny checklist
    const menageArray = typeof g.nummenage === 'string' ? g.nummenage.split(', ') : g.nummenage;
    setFormData({ ...g, nummenage: menageArray });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ nomgs: '', nummenage: [], commune: '', fokontany: '', village: '' });
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 transition-colors font-sans">
      
      {/* HEADER */}
      <div className="p-6 flex flex-wrap justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-700 dark:text-blue-500 tracking-tighter uppercase">Groupes Solidarités</h1>
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Organisation communautaire</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Printer size={20} />
              <span className="text-xs font-bold uppercase hidden md:block">Exporter</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-3 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <button onClick={exportPDF} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-800">
                  <FileText size={16} className="text-red-500" /> PDF Document
                </button>
                <button onClick={exportExcel} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <Download size={16} className="text-emerald-600" /> Excel Spreadsheet
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
          >
            <Plus size={22} />
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="px-6 py-4 flex items-center gap-4">
        <div className="relative group flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher ..." 
            className="w-full pl-12 pr-12 py-4 rounded-[1.5rem] border-none bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-100 hover:bg-red-100 p-1.5 rounded-full text-slate-400 hover:text-red-500 transition-all">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b dark:border-slate-800">
              <tr>
                <th className="px-6 py-5 text-left w-16">N°</th>
                <th className="px-6 py-5 text-left">Nom du GS</th>
                <th className="px-6 py-5 text-left">Ménages</th>
                <th className="px-6 py-5 text-left">Localisation</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center"><Loader2 size={30} className="animate-spin inline text-blue-600" /></td></tr>
              ) : filteredGroupes.map((g, index) => (
                <tr key={g.codegs} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                  <td className="px-6 py-4 text-xs font-black text-slate-400">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                        <Users size={16} />
                      </div>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase">{g.nomgs}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {g.nummenage?.split(',').map((m, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-[9px] font-black">
                          {m.trim()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold uppercase">
                      <MapPin size={12} className="text-red-500" />{g.commune}, {g.fokontany},{g.village}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(g)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(g.codegs)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredGroupes.length === 0 && (
            <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest">Aucun groupe trouvé</div>
          )}
        </div>
      </div>

      {/* MODAL CHECKLIST */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in duration-300">
            <div className="px-10 py-8 bg-blue-600 flex justify-between items-center text-white">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Fiche du GS</h2>
                <p className="text-[10px] font-bold text-blue-200 uppercase">Configuration du groupe solidaire</p>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nom du Groupe</label>
                  <input 
                    type="text" required
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 uppercase font-black text-slate-800 dark:text-white transition-all"
                    value={formData.nomgs} onChange={(e) => setFormData({...formData, nomgs: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Commune</label>
                    <input type="text" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase text-xs" value={formData.commune} onChange={(e) => setFormData({...formData, commune: e.target.value})} />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Fokontany</label>
                    <input type="text" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase text-xs" value={formData.fokontany} onChange={(e) => setFormData({...formData, fokontany: e.target.value})} />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Village</label>
                    <input type="text" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase text-xs" value={formData.village} onChange={(e) => setFormData({...formData, village: e.target.value})} />
                  </div>
                </div>

                {/* CHECKLIST MÉNAGES */}
                <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                    Sélectionner les Ménages ({formData.nummenage.length})
                </label>
                
                {/* Ny container dia manana haavo raikitra 1.5cm ary misy scrollbar */}
                <div 
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-y-auto custom-scrollbar"
                    style={{ height: '1.5cm' }}
                >
                    {menagesDisponibles.map((m) => (
                    <div 
                        key={m.num_menage}
                        onClick={() => handleCheck(m.num_menage)}
                        className={`flex items-center justify-between px-3 py-1 rounded-lg cursor-pointer border transition-all ${
                        formData.nummenage.includes(m.num_menage) 
                        ? 'border-blue-500 bg-white dark:bg-slate-800 shadow-sm' 
                        : 'border-transparent bg-slate-200/30 dark:bg-slate-700/30 opacity-70'
                        }`}
                        style={{ height: '0.8cm' }} // Isaky ny item dia kely kokoa mba ho antonona ao anatin'ilay 1.5cm
                    >
                        <span className="text-[9px] font-black dark:text-slate-200">#{m.num_menage}</span>
                        {formData.nummenage.includes(m.num_menage) && (
                        <CheckCircle2 size={10} className="text-blue-500" />
                        )}
                    </div>
                    ))}
                </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 transition-all uppercase tracking-widest mt-4">
                <Save size={20} />
                {editingId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupePage;