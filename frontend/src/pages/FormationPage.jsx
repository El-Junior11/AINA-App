import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Search, Save, X, Loader2, ClipboardCheck, FileText, 
  Download, RefreshCw, Sheet, ArrowRight, Pencil, GraduationCap 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

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

  const exportToPDF = async () => {
  try {
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.width;
    const today = new Date().toLocaleDateString('fr-FR');

    // Fonction hanovana sary ho boribory
    const getCircularImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = Math.min(img.width, img.height);
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, size, size);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = url;
      });
    };

    const circularLogo = await getCircularImage(logo);

    // Header afovoany
    doc.addImage(circularLogo, 'PNG', (pageWidth - 20) / 2, 5, 20, 20); // Logo boribory 20x20
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text("Suivi des formations - ONG Tsinjo Aina", pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date d'édition : ${today}`, pageWidth / 2, 36, { align: 'center' });

    const tableColumn = [
      "N°", "Membre", "Gestion", "Agro-éco", "Nutrition", 
      "Conservation", "Transformation", "Genre", "Epracc", "Autonomie"
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
      startY: 40,
      styles: { fontSize: 8 },
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
        Toast.fire({ icon: 'success', title: 'Enregistrement réussi' });
      }
    } catch (err) {
      console.error(err);
      Toast.fire({ icon: 'error', title: "Erreur lors de l'enregistrement" });
    } finally { setLoading(false); }
  };

  const formatText = (text) => text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : "";

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 transition-colors font-sans overflow-hidden relative">
      
      {/* HEADER */}
      <div className="p-4 px-6 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-700 dark:text-blue-400 tracking-tight">Suivi des formations</h1>
            <p className="text-xs text-emerald-600 font-medium">Capacités & compétences</p>
          </div>
        </div>
      </div>

      {/* SEARCH BAR, EXPORT, REFRESH & SEE MORE */}
      <div className="px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative group w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher un membre par nom ou ID..." 
            className="w-full pl-10 pr-10 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 text-xs font-medium transition-all" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X size={14} /></button>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md transition-all flex items-center gap-2 text-xs font-semibold"
            >
              <Download size={15}/>
              <span>Exporter</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg z-50 text-slate-900 dark:text-white overflow-hidden">
                <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium border-b dark:border-slate-800">
                  <Sheet size={15} className="text-emerald-600"/> Feuille Excel
                </button>
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium">
                  <FileText size={15} className="text-rose-600"/> Document PDF
                </button>
              </div>
            )}
          </div>

          <button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-all">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''}/>
          </button>

          <button 
            onClick={() => navigate('/formation-stats')} 
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all whitespace-nowrap"
          >
            Voir plus
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs h-full flex flex-col">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5 text-left w-14">N°</th>
                  <th className="px-4 py-2.5 text-left min-w-[180px]">Membre</th>
                  {modules.map(mod => (
                    <th key={mod.id} className="px-3 py-2.5 text-center min-w-[90px]">{formatText(mod.label)}</th>
                  ))}
                  <th className="px-4 py-2.5 text-left min-w-[140px]">Autre</th>
                  <th className="px-4 py-2.5 text-right w-20 sticky right-0 bg-slate-100 dark:bg-slate-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <tr><td colSpan={modules.length + 4} className="p-8 text-center"><Loader2 size={24} className="animate-spin inline text-blue-600" /></td></tr>
                ) : (
                  filteredData.map((m, index) => (
                    <tr key={m.nummembre} className="h-[48px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-4 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 w-14">{index + 1}</td>
                      <td className="px-4 py-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate block min-w-[180px]">{m.nom_membre}</span>
                      </td>
                      {modules.map(mod => (
                        <td key={mod.id} className="px-3 py-2 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            m.formation?.[mod.id] 
                              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900' 
                              : 'text-slate-400 dark:text-slate-600'
                          }`}>
                            {m.formation?.[mod.id] ? 'Oui' : 'Non'}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[140px]">{m.formation?.autre || "-"}</td>
                      <td className="px-4 py-2 text-right w-20 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50">
                        <button 
                          onClick={() => openEditModal(m)} 
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {!loading && filteredData.length === 0 && (
                  <tr><td colSpan={modules.length + 4} className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium text-xs">Aucune formation trouvée</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FORMULAIRE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-lg animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-3.5 bg-blue-600 text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xs font-bold">Fiche individuelle de formation</h2>
                <p className="text-[11px] font-normal text-blue-100 capitalize">{selectedMembre?.nom_membre}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white p-1 rounded-md"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {modules.filter(m => !m.isAuto).map(mod => (
                  <div 
                    key={mod.id} 
                    onClick={() => handleCheckboxChange(mod.id, !formData[mod.id])} 
                    className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer border transition-all ${
                      formData[mod.id] 
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{formatText(mod.label)}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      formData[mod.id] ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {formData[mod.id] ? 'Oui' : 'Non'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-md text-center border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Agro-éco</p>
                    <p className={`text-xs font-bold ${formData.agroeco ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>{formData.agroeco ? 'Oui' : 'Non'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-md text-center border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Nutrition</p>
                    <p className={`text-xs font-bold ${formData.nutrition ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>{formData.nutrition ? 'Oui' : 'Non'}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-md text-center border border-blue-200 dark:border-blue-900">
                    <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">Autonomie</p>
                    <p className={`text-xs font-bold ${formData.autonomie ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>{formData.autonomie ? 'Oui' : 'Non'}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Observations / Autres</label>
                  <textarea 
                    className="w-full p-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs font-medium min-h-[80px]" 
                    value={formData.autre || ''} 
                    onChange={(e) => setFormData({...formData, autre: e.target.value})} 
                    placeholder="Saisir des remarques ou détails supplémentaires..."
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold flex items-center justify-center gap-2 text-xs transition-all"
                >
                  <Save size={15} />
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FormationPage;