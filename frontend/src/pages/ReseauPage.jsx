import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Trash2, Edit2, X, Loader2, Save, Network, ShieldCheck,
  Search, FileText, Download, BarChart3, Printer, Calendar, Plus, Eye
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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

const ReseauPage = () => {
  const [reseaux, setReseaux] = useState([]);
  const [filteredReseaux, setFilteredReseaux] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showVoirPlusModal, setShowVoirPlusModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    NomRS: '',
    NomGS: '', 
    DateCreation: new Date().toISOString().split('T')[0],
    Activite: 'Non',
    Plaidoyer: 'Non',
    Plan: 'Non',
    Autonomie: 'Non',
  };

  const [formData, setFormData] = useState(initialForm);
  const API_URL = 'http://localhost:5000/api/reseaux';

  useEffect(() => { 
    fetchReseaux(); 
  }, []);

  useEffect(() => {
    if (formData.Activite === 'Oui' && formData.Plaidoyer === 'Oui' && formData.Plan === 'Oui') {
      setFormData(prev => ({ ...prev, Autonomie: 'Oui' }));
    } else {
      setFormData(prev => ({ ...prev, Autonomie: 'Non' }));
    }
  }, [formData.Activite, formData.Plaidoyer, formData.Plan]);

  useEffect(() => {
    const results = reseaux.filter(r => 
      `${r.NomRS} ${r.NomGS}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredReseaux(results);
  }, [searchTerm, reseaux]);

  const fetchReseaux = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      setReseaux(res.data);
      setFilteredReseaux(res.data);
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Connexion au serveur impossible' });
    } finally { setLoading(false); }
  };

const exportPDF = async () => {
  try {
    const doc = new jsPDF();
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
    doc.addImage(circularLogo, 'PNG', (pageWidth - 25) / 2, 10, 25, 25);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text("Liste des réseaux - ONG Tsinjo Aina", pageWidth / 2, 40, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date d'édition : ${today}`, pageWidth / 2, 46, { align: 'center' });

    const tableData = filteredReseaux.map((r, i) => [
      i + 1, 
      r.NomRS, 
      r.DateCreation ? new Date(r.DateCreation).toLocaleDateString() : '-', 
      r.NomGS, 
      r.Activite, 
      r.Plaidoyer, 
      r.Plan, 
      r.Autonomie
    ]);

    autoTable(doc, { 
      head: [['N°', 'Nom Réseau', 'Date création', 'Groupes', 'Act.', 'Plaid.', 'Plan', 'Auto.']], 
      body: tableData, 
      startY: 55,
      styles: { fontSize: 9 }
    });

    doc.save("reseaux_tsinjo_aina.pdf");
    setShowExportMenu(false);
    Toast.fire({ icon: 'success', title: 'Export PDF réussi' });

  } catch (error) {
    console.error(error);
    Toast.fire({ icon: 'error', title: 'Impossible de générer le fichier PDF' });
  }
};

  const exportExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(filteredReseaux);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reseaux");
      XLSX.writeFile(workbook, "reseaux_tsinjo_aina.xlsx");
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export Excel réussi' });
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
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (editingId) { 
        await axios.put(`${API_URL}/${editingId}`, formData, config); 
      } else { 
        await axios.post(API_URL, formData, config); 
      }
      
      setShowModal(false); 
      resetForm(); 
      fetchReseaux();
      Toast.fire({ icon: 'success', title: 'Mise à jour réussie' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: "Erreur lors de l'enregistrement" });
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      title: 'Voulez-vous supprimer ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          fetchReseaux();
          Toast.fire({ icon: 'success', title: 'Suppression réussie' });
        } catch (error) { 
          console.error(error);
          Toast.fire({ icon: 'error', title: 'Impossible de supprimer le réseau' });
        }
      }
    });
  };

  const openEditModal = (r) => {
    setEditingId(r.codeRS);
    setFormData({ ...r, DateCreation: r.DateCreation ? r.DateCreation.split('T')[0] : initialForm.DateCreation });
    setShowModal(true);
  };

  const resetForm = () => { setEditingId(null); setFormData(initialForm); };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 transition-colors font-sans overflow-hidden relative">
      
      {/* HEADER WITH ICON */}
      <div className="p-4 px-6 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-900/50">
            <Network size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-700 dark:text-blue-500 tracking-tight">Gestion des réseaux</h1>
            <p className="text-xs text-emerald-600 font-medium">Base de données communautaire</p>
          </div>
        </div>
      </div>

      {/* SEARCH BAR & BUTTONS */}
      <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="relative group flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher un réseau..." 
            className="w-full pl-10 pr-10 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X size={14} /></button>
          )}
        </div>

        {/* ACTIONS BOUTONS */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md transition-all flex items-center gap-2 text-xs font-semibold"
            >
              <Printer size={15} />
              <span className="hidden sm:block">Exporter</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg z-50 text-slate-900 dark:text-white overflow-hidden">
                <button onClick={exportPDF} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium border-b dark:border-slate-800"><FileText size={15} className="text-red-500" /> Document PDF</button>
                <button onClick={exportExcel} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium"><Download size={15} className="text-emerald-600" /> Feuille Excel</button>
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowVoirPlusModal(true)} 
            className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-2 rounded-md transition-all font-semibold text-xs"
          >
            <Eye size={15} />
            <span className="hidden sm:block">Voir plus</span>
          </button>

          <button 
            onClick={() => { resetForm(); setShowModal(true); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-all"
          >
            <Plus size={16} />
            <span className="hidden sm:block">Ajouter</span>
          </button>
        </div>
      </div>

      {/* TABLE FLEXIBLE & RESPONSIVE */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs h-full flex flex-col">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5 w-14">N°</th>
                  <th className="px-4 py-2.5 min-w-[160px]">Réseau / Date</th>
                  <th className="px-4 py-2.5 min-w-[200px]">Groupes</th>
                  <th className="px-4 py-2.5 text-center min-w-[80px]">Activité</th>
                  <th className="px-4 py-2.5 text-center min-w-[80px]">Plaidoyer</th>
                  <th className="px-4 py-2.5 text-center min-w-[80px]">P. Dev</th>
                  <th className="px-4 py-2.5 text-center min-w-[110px]">Autonomie</th>
                  <th className="px-4 py-2.5 text-right w-20 sticky right-0 bg-slate-100 dark:bg-slate-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center"><Loader2 size={24} className="animate-spin inline text-blue-600" /></td>
                  </tr>
                ) : filteredReseaux.map((r, index) => (
                  <tr key={r.codeRS} className="h-[48px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-4 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 w-14">{index + 1}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate">{r.NomRS}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                          <Calendar size={10} /> {r.DateCreation ? new Date(r.DateCreation).toLocaleDateString() : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {r.NomGS?.split(',').map((g, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded text-[10px] font-bold capitalize">
                            {g.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs font-semibold ${r.Activite === 'Oui' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{r.Activite}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs font-semibold ${r.Plaidoyer === 'Oui' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{r.Plaidoyer}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs font-semibold ${r.Plan === 'Oui' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{r.Plan}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${r.Autonomie === 'Oui' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                        {r.Autonomie === 'Oui' ? 'Autonome' : 'En cours'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right w-20 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEditModal(r)} title="Modifier" className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(r.codeRS)} title="Supprimer" className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-md transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredReseaux.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium text-xs">Aucun réseau trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL "VOIR PLUS" */}
      {showVoirPlusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-lg animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-3.5 bg-blue-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Eye size={16} />
                <h2 className="text-xs font-bold">Vue d'ensemble des réseaux</h2>
              </div>
              <button onClick={() => setShowVoirPlusModal(false)} className="text-white/80 hover:text-white p-1 rounded-md"><X size={18} /></button>
            </div>
            
            <div className="p-5 space-y-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-l-4 border-blue-600 rounded-md flex justify-between items-center">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Total réseaux</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{filteredReseaux.length}</p>
                </div>
                <Network size={20} className="text-blue-600" />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-l-4 border-emerald-600 rounded-md flex justify-between items-center">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Réseaux autonomes</span>
                  <p className="text-xl font-bold text-emerald-600">{filteredReseaux.filter(r => r.Autonomie === 'Oui').length}</p>
                </div>
                <ShieldCheck size={20} className="text-emerald-600" />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-l-4 border-pink-500 rounded-md flex justify-between items-center">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">En structuration</span>
                  <p className="text-xl font-bold text-pink-500">{filteredReseaux.filter(r => r.Autonomie === 'Non').length}</p>
                </div>
                <BarChart3 size={20} className="text-pink-500" />
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  onClick={() => setShowVoirPlusModal(false)} 
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-semibold text-xs transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORMULAIRE - ROUNDED MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-lg animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-3.5 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xs font-bold">{editingId ? 'Modifier le réseau' : 'Nouveau réseau'}</h2>
                <p className="text-[11px] font-normal text-blue-100">Fiche de saisie des données</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-white/80 hover:text-white p-1 rounded-md"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nom du réseau *</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs font-medium capitalize" 
                    value={formData.NomRS} 
                    onChange={(e) => setFormData({...formData, NomRS: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date de création *</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs font-medium" 
                    value={formData.DateCreation} 
                    onChange={(e) => setFormData({...formData, DateCreation: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Groupes membres</label>
                <input 
                  type="text" 
                  placeholder="Ex: GS001, GS002, GS003" 
                  className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 outline-none focus:border-blue-600 text-xs font-bold placeholder:font-normal placeholder:text-slate-400" 
                  value={formData.NomGS} 
                  onChange={(e) => setFormData({...formData, NomGS: e.target.value})} 
                />
              </div>

              {editingId && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  {[
                    ['Activite', 'Activités'], 
                    ['Plaidoyer', 'Plaidoyers'], 
                    ['Plan', 'Plan Dev']
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2 rounded-md border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
                      <div className="flex bg-slate-200 dark:bg-slate-700 p-0.5 rounded">
                        {['Oui', 'Non'].map(opt => (
                          <button 
                            key={opt} 
                            type="button" 
                            onClick={() => setFormData({...formData, [key]: opt})} 
                            className={`px-3 py-1 rounded text-xs font-bold transition-all ${formData[key] === opt ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-md flex justify-between items-center border border-emerald-200 dark:border-emerald-900">
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Statut d'autonomie</span>
                    <span className="text-xs font-bold px-2 py-0.5 bg-white dark:bg-slate-900 rounded text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                      {formData.Autonomie}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold flex items-center justify-center gap-2 text-xs transition-all"
                >
                  <Save size={15} />
                  {editingId ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReseauPage;