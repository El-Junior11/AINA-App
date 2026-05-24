import React, { useState, useEffect } from 'react';
import { getGroupes, getMenagesList, createGroupe, deleteGroupe, updateGroupe } from '../services/groupeService';
import Swal from 'sweetalert2';
import { 
  Trash2, Edit2, Users, X, Loader2, Save, CheckCircle2, 
  MapPin, Search, FileText, Download, Printer, Plus, BarChart3, Calendar
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

const GroupePage = () => {
  const [groupes, setGroupes] = useState([]);
  const [filteredGroupes, setFilteredGroupes] = useState([]);
  const [menagesDisponibles, setMenagesDisponibles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    nomgs: '',
    nummenage: [],
    commune: '',
    fokontany: '',
    village: '',
    date_creation: ''
  });

  useEffect(() => { fetchData(); }, []);

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
    } catch (error) {
      console.error(error);
      Toast.fire({ 
        icon: 'error', 
        title: 'Connexion au serveur impossible' 
      });
    } finally { setLoading(false); }
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("LISTE DES GROUPES SOLIDAIRES - ONG TSINJO AINA", 14, 15);
      const tableData = filteredGroupes.map((g, i) => [
        i + 1, g.nomgs, g.nummenage, g.village, g.fokontany, g.commune, g.date_creation ? new Date(g.date_creation).toLocaleDateString() : '-'
      ]);
      autoTable(doc, {
        head: [['N°', 'Nom GS', 'Ménages', 'Village', 'Fokontany', 'Commune', 'Date Création']],
        body: tableData,
        startY: 25,
      });
      doc.save("groupes_tsinjo_aina.pdf");
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export PDF réussi' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Impossible de générer le fichier PDF' });
    }
  };

  const exportExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(filteredGroupes);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Groupes");
      XLSX.writeFile(workbook, "groupes_tsinjo_aina.xlsx");
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export Excel réussi' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Impossible de générer le fichier Excel' });
    }
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
      const payload = {
        ...formData,
        nummenage: Array.isArray(formData.nummenage) ? formData.nummenage.join(', ') : formData.nummenage
      };

      if (editingId) {
        await updateGroupe(editingId, payload);
      } else {
        await createGroupe(payload);
      }
      setShowModal(false);
      resetForm();
      fetchData();
      Toast.fire({ icon: 'success', title: 'Enregistrement réussi avec succès' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: error.response?.data?.message || "Erreur lors de l'enregistrement" });
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Supprimer ce groupe ?',
      text: "Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          await deleteGroupe(id);
          fetchData();
          Toast.fire({ icon: 'success', title: 'Suppression réussie' });
        } catch (error) {
          console.error(error);
          Toast.fire({ icon: 'error', title: 'Impossible de supprimer le groupe' });
        } finally { setLoading(false); }
      }
    });
  };

  const openEditModal = (g) => {
    setEditingId(g.codegs);
    const menageArray = typeof g.nummenage === 'string' ? g.nummenage.split(', ') : (g.nummenage || []);
    const formattedDate = g.date_creation ? new Date(g.date_creation).toISOString().split('T')[0] : '';
    setFormData({ ...g, nummenage: menageArray, date_creation: formattedDate });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ nomgs: '', nummenage: [], commune: '', fokontany: '', village: '', date_creation: '' });
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 transition-colors font-sans overflow-hidden">
      
      <div className="p-6 flex flex-wrap justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-700 dark:text-blue-500 tracking-tighter uppercase">Groupes Solidaires</h1>
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Gestion communautaire</p>
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
                  <FileText size={16} className="text-red-500" /> Document PDF
                </button>
                <button onClick={exportExcel} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <Download size={16} className="text-emerald-600" /> Feuille Excel
                </button>
              </div>
            )}
          </div>
          <button onClick={() => setShowStats(!showStats)} className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-all font-black text-xs uppercase">
            <BarChart3 size={18} /><span className="hidden sm:block">{showStats ? 'Fermer' : 'Statistiques'}</span>
          </button>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
          >
            <Plus size={22} />
          </button>
        </div>
      </div>

      {showStats && (
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top duration-300">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-b-4 border-blue-600 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase">Total Groupes</span>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{filteredGroupes.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-b-4 border-emerald-600 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase">Ménages Couverts</span>
            <p className="text-3xl font-black text-slate-800 dark:text-white">
              {[...new Set(filteredGroupes.flatMap(g => g.nummenage?.split(',') || []))].length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-b-4 border-orange-500 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase">Zones (Communes)</span>
            <p className="text-3xl font-black text-slate-800 dark:text-white">
              {[...new Set(filteredGroupes.map(g => g.commune))].length}
            </p>
          </div>
        </div>
      )}

      <div className="px-6 py-4 flex items-center gap-4">
        <div className="relative group flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher un groupe, un ménage ou un lieu..." 
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

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <table className="w-full flex flex-col">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[14px] font-black tracking-widest text-slate-500 border-b dark:border-slate-800 w-full">
              <tr className="flex w-full">
                <th className="px-6 py-5 text-left w-20 flex-shrink-0">N°</th>
                <th className="px-6 py-5 text-left flex-1">Nom du GS</th>
                <th className="px-6 py-5 text-left flex-1">Ménages rattachés</th>
                <th className="px-6 py-5 text-left flex-1">Localisation</th>
                <th className="px-6 py-5 text-right w-32 flex-shrink-0">Actions</th>
              </tr>
            </thead>
            <tbody 
              className="flex flex-col w-full overflow-y-auto" 
              style={{ maxHeight: 'calc(75px * 3)' }} 
            >
              {loading ? (
                <tr className="w-full"><td className="p-20 text-center w-full"><Loader2 size={30} className="animate-spin inline text-blue-600" /></td></tr>
              ) : filteredGroupes.map((g, index) => (
                <tr key={g.codegs} className="flex w-full items-center hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <td className="px-6 py-4 text-xs font-black text-slate-400 w-20 flex-shrink-0">{index + 1}</td>
                  <td className="px-6 py-4 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                        <Users size={16} />
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase truncate block">{g.nomgs}</span>
                        {g.date_creation && (
                           <span className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                             <Calendar size={10} /> {new Date(g.date_creation).toLocaleDateString()}
                           </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 flex-1">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {g.nummenage?.split(',').map((m, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-[9px] font-black">
                          {m.trim()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 flex-1">
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold uppercase truncate">
                      <MapPin size={12} className="text-red-500 flex-shrink-0" />
                      <span className="truncate">{g.commune}, {g.village}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right w-32 flex-shrink-0">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(g)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(g.codegs)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredGroupes.length === 0 && (
                <tr className="w-full"><td className="p-20 text-center text-slate-300 font-black uppercase tracking-widest w-full">Aucun groupe trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in duration-300">
            <div className="px-10 py-8 bg-blue-600 flex justify-between items-center text-white">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Fiche du GS</h2>
                <p className="text-[10px] font-bold text-blue-200 uppercase">Configuration du groupe solidaire</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="bg-white/10 hover:bg-white/20 p-2 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="grid grid-cols-1 gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nom du Groupe</label>
                        <input 
                            type="text" required
                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 uppercase font-black text-slate-800 dark:text-white transition-all"
                            value={formData.nomgs} onChange={(e) => setFormData({...formData, nomgs: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Date de création</label>
                        <input 
                            type="date" required
                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-black text-slate-800 dark:text-white transition-all"
                            value={formData.date_creation} onChange={(e) => setFormData({...formData, date_creation: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commune</label>
                    <input type="text" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase text-xs" value={formData.commune} onChange={(e) => setFormData({...formData, commune: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fokontany</label>
                    <input type="text" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase text-xs" value={formData.fokontany} onChange={(e) => setFormData({...formData, fokontany: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Village</label>
                    <input type="text" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase text-xs" value={formData.village} onChange={(e) => setFormData({...formData, village: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                    Ménages sélectionnés ({formData.nummenage.length})
                  </label>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto custom-scrollbar">
                    {menagesDisponibles.map((m) => (
                      <div 
                        key={m.num_menage}
                        onClick={() => handleCheck(m.num_menage)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer border transition-all ${
                          formData.nummenage.includes(m.num_menage) 
                          ? 'border-blue-500 bg-white dark:bg-slate-800 shadow-md scale-[1.02]' 
                          : 'border-transparent bg-slate-200/30 dark:bg-slate-700/30 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <span className="text-[10px] font-black dark:text-slate-200">#{m.num_menage}</span>
                        {formData.nummenage.includes(m.num_menage) && (
                          <CheckCircle2 size={12} className="text-blue-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 transition-all uppercase tracking-widest mt-4">
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                {editingId ? 'Mettre à jour' : 'Enregistrer le groupe'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupePage;