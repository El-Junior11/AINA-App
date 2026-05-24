import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Search, Save, X, Loader2, ClipboardCheck, FileText, 
  Download, BarChart3, RefreshCw, Users, CheckCircle, PieChart,
  FileSpreadsheet, File as FilePdf, ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import { useNavigate } from 'react-router-dom';

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

const FormationPage = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedMembre, setSelectedMembre] = useState(null);

  const modules = [
    { id: 'gestionsimplifiee', label: 'Gestion' },
    { id: 'agrosol', label: 'Agro-sol' },
    { id: 'agroeau', label: 'Agro-eau' },
    { id: 'agrovegetaux', label: 'Végétaux' },
    { id: 'agroeco', label: 'Agro-éco', isAuto: true },
    { id: 'productionsemence', label: 'Semences' },
    { id: 'nutritioneau', label: 'Nutri-eau' },
    { id: 'nutritionalimentaire', label: 'Alimentaire' },
    { id: 'nutrition', label: 'Nutrition', isAuto: true },
    { id: 'conservationproduit', label: 'Conservation' },
    { id: 'transformationproduit', label: 'Transformation' },
    { id: 'genre', label: 'Genre' },
    { id: 'epracc', label: 'Epracc' },
    { id: 'autonomie', label: 'Autonomie', isAuto: true }
  ];

  const initialForm = {
    nummembre: '',
    autre: '',
    ...modules.reduce((acc, m) => ({ ...acc, [m.id]: false }), {})
  };

  const [formData, setFormData] = useState(initialForm);
  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const results = data.filter(m => 
      `${m.nom_membre} ${m.nummembre}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(results);
  }, [searchTerm, data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/formations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setData(res.data);
      setFilteredData(res.data);
    } catch (err) {
      console.error(err);
      Toast.fire({ icon: 'error', title: 'Erreur lors du chargement des données' });
    } finally { setLoading(false); }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF('landscape'); 
      doc.text("Suivi des Formations (Sélection) - ONG Tsinjo Aina", 14, 15);
      
      const tableColumn = [
        "N°", 
        "Membre", 
        "Gestion", 
        "Agro-éco", 
        "Nutrition", 
        "Conservation", 
        "Transformation", 
        "Genre", 
        "Epracc", 
        "Autonomie"
      ];

      const tableRows = filteredData.map((m, i) => [
        i + 1,
        m.nom_membre,
        m.formation?.gestionsimplifiee ? 'Oui' : 'Non',
        m.formation?.agroeco ? 'Oui' : 'Non',
        m.formation?.nutrition ? 'Oui' : 'Non',
        m.formation?.conservationproduit ? 'Oui' : 'Non',
        m.formation?.transformationproduit ? 'Oui' : 'Non',
        m.formation?.genre ? 'Oui' : 'Non',
        m.formation?.epracc ? 'Oui' : 'Non',
        m.formation?.autonomie ? 'Oui' : 'Non'
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        styles: { fontSize: 8 }, 
        headStyles: { fillColor: [79, 70, 229] }
      });

      doc.save("suivi_formations_filtre.pdf");
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export PDF réussi' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Impossible de générer le fichier PDF' });
    }
  };

  const exportToExcel = () => {
    try {
      const excelData = filteredData.map((m, i) => {
        const row = { 'N°': i + 1, 'Membre': m.nom_membre, 'ID': m.nummembre };
        modules.forEach(mod => { row[mod.label] = m.formation?.[mod.id] ? 'Oui' : 'Non'; });
        row['Autre'] = m.formation?.autre || '';
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Formations");
      XLSX.writeFile(wb, "suivi_formations.xlsx");
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export Excel réussi' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Impossible de générer le fichier Excel' });
    }
  };

  const globalStats = {
    totalMembres: data.length,
    totalAutonomie: data.filter(m => m.formation?.autonomie).length,
    pourcentage: data.length > 0 
      ? Math.round((data.filter(m => m.formation?.autonomie).length / data.length) * 100) 
      : 0
  };

  const handleCheckboxChange = (modId, isChecked) => {
    const newFormData = { ...formData, [modId]: isChecked };
    newFormData.agroeco = newFormData.agroeau && newFormData.agrosol && newFormData.agrovegetaux;
    newFormData.nutrition = newFormData.nutritioneau && newFormData.nutritionalimentaire;
    const manualModules = modules.filter(m => !m.isAuto && m.id !== 'autonomie');
    newFormData.autonomie = manualModules.every(m => newFormData[m.id] === true);
    setFormData(newFormData);
  };

  const openEditModal = (m) => {
    setSelectedMembre(m);
    setFormData(m.formation ? { ...m.formation } : { ...initialForm, nummembre: m.nummembre });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const storedUser = JSON.parse(localStorage.getItem('user')); 
      const userId = storedUser?.user_id || storedUser?.id; 

      const dataToSave = { ...formData, user_id: userId, autonomie: formData.autonomie ? 1 : 0 };

      const res = await axios.post(`${API_BASE}/formations/save`, dataToSave, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 200 || res.status === 201) {
        setShowModal(false);
        fetchData();
        Toast.fire({ icon: 'success', title: 'Enregistrement réussi avec succès' });
      }
    } catch (err) {
      console.error(err);
      Toast.fire({ icon: 'error', title: "Erreur lors de l'enregistrement" });
    } finally { setLoading(false); }
  };

  const formatText = (text) => text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : "";

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 transition-colors font-sans overflow-hidden">
      
      <div className="p-6 flex flex-wrap justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-700 dark:text-indigo-400 tracking-tighter uppercase">Suivi formations</h1>
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Capacités & compétences</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowStats(!showStats)} className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg"><BarChart3 size={18}/> Stats</button>
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg"><Download size={18}/> Exporter</button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border z-50">
                <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700"><FileSpreadsheet size={16} className="text-emerald-600"/> Excel</button>
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700"><FilePdf size={16} className="text-rose-600"/> PDF</button>
              </div>
            )}
          </div>
          <button onClick={fetchData} className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg active:scale-95"><RefreshCw size={22} className={loading ? 'animate-spin' : ''}/></button>
        </div>
      </div>

      {showStats && (
        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top duration-300">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600"><Users size={24}/></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase">Membres</p><p className="text-2xl font-black dark:text-white">{globalStats.totalMembres}</p></div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600"><CheckCircle size={24}/></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase">Autonomie</p><p className="text-2xl font-black dark:text-white">{globalStats.totalAutonomie}</p></div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-2xl text-amber-600"><PieChart size={24}/></div>
            <div className="flex-1"><p className="text-[10px] font-black text-slate-400 uppercase">Taux Autonomie</p><p className="text-2xl font-black dark:text-white">{globalStats.pourcentage}%</p></div>
          </div>
        </div>
      )}

      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative group w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="w-full pl-12 pr-12 py-4 rounded-[1.5rem] bg-white dark:bg-slate-900 dark:text-white outline-none shadow-sm font-bold border border-transparent focus:border-indigo-500 transition-all" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <button 
          onClick={() => navigate('/formation-stats')} 
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-wider shadow-md shadow-indigo-500/20 transition-all active:scale-95 whitespace-nowrap"
        >
          Voir plus
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-[11px] font-black text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-5 text-left w-16">N°</th>
                  <th className="px-6 py-5 text-left min-w-[200px]">Membre</th>
                  {modules.map(mod => (<th key={mod.id} className="px-4 py-5 text-center min-w-[100px]">{formatText(mod.label)}</th>))}
                  <th className="px-6 py-5 text-left min-w-[150px]">Autre</th>
                  <th className="px-6 py-5 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={modules.length + 4} className="p-20 text-center"><Loader2 size={30} className="animate-spin inline text-indigo-600" /></td></tr>
                ) : (
                  filteredData.map((m, index) => (
                    <tr key={m.nummembre} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                      <td className="px-6 py-4 text-xs font-black text-slate-500">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">{m.nom_membre}</span>
                          <span className="text-[10px] text-slate-500 font-bold">{m.nummembre}</span>
                        </div>
                      </td>
                      {modules.map(mod => (
                        <td key={mod.id} className="px-4 py-4 text-center">
                          <span className={`text-[10px] font-black ${m.formation?.[mod.id] ? 'text-emerald-600 border border-transparent dark:border-emerald-800 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30' : 'text-rose-500'}`}>{m.formation?.[mod.id] ? 'Oui' : 'Non'}</span>
                        </td>
                      ))}
                      <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{m.formation?.autre || "-"}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEditModal(m)} className="p-2 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"><ClipboardCheck size={18} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
            <div className="px-10 py-8 bg-indigo-600 flex justify-between items-center text-white shrink-0">
              <div><h2 className="text-xl font-black uppercase tracking-tighter">Fiche individuelle</h2><p className="text-[10px] font-bold text-indigo-100 uppercase">{selectedMembre?.nom_membre}</p></div>
              <button onClick={() => setShowModal(false)} className="bg-white/10 p-2 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {modules.filter(m => !m.isAuto).map(mod => (
                  <div key={mod.id} onClick={() => handleCheckboxChange(mod.id, !formData[mod.id])} className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer border-2 ${formData[mod.id] ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent bg-slate-50 dark:bg-slate-800'}`}>
                    <span className="text-[10px] font-black dark:text-white">{formatText(mod.label)}</span>
                    <span className={`text-[10px] font-black ${formData[mod.id] ? 'text-indigo-600' : 'text-slate-400'}`}>{formData[mod.id] ? 'OUI' : 'NON'}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center"><p className="text-[9px] font-bold text-slate-500 uppercase">Agro-éco</p><p className={`text-xs font-black ${formData.agroeco ? 'text-emerald-600' : 'text-slate-400'}`}>{formData.agroeco ? 'OUI' : 'NON'}</p></div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center"><p className="text-[9px] font-bold text-slate-500 uppercase">Nutrition</p><p className={`text-xs font-black ${formData.nutrition ? 'text-emerald-600' : 'text-slate-400'}`}>{formData.nutrition ? 'OUI' : 'NON'}</p></div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl text-center"><p className="text-[9px] font-bold text-indigo-400 uppercase">Autonomie</p><p className={`text-xs font-black ${formData.autonomie ? 'text-indigo-600' : 'text-slate-400'}`}>{formData.autonomie ? 'OUI' : 'NON'}</p></div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Observations</label>
                  <textarea className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs min-h-[100px]" value={formData.autre || ''} onChange={(e) => setFormData({...formData, autre: e.target.value})} placeholder="Saisir note..."/>
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white p-5 rounded-[1.5rem] font-black shadow-xl shadow-indigo-500/30 uppercase tracking-widest shrink-0"><Save size={20} className="inline mr-2"/> Enregistrer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormationPage;