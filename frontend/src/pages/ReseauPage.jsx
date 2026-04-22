import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Trash2, Edit2, Network, X, Loader2, Save, CheckCircle2, 
  Search, FileText, Download, BarChart3, Printer, FileSpreadsheet, PlusCircle, Calendar
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ReseauPage = () => {
  const [reseaux, setReseaux] = useState([]);
  const [groupesDisponibles, setGroupesDisponibles] = useState([]);
  const [filteredReseaux, setFilteredReseaux] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    NomRS: '',
    NomGS: [], 
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
    fetchGroupes();
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
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReseaux(res.data);
      setFilteredReseaux(res.data);
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Connexion au serveur impossible.' });
    } finally { setLoading(false); }
  };

  const fetchGroupes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/groupes');
      if (Array.isArray(res.data)) {
        setGroupesDisponibles(res.data);
      } else if (res.data && Array.isArray(res.data.groupes)) {
        setGroupesDisponibles(res.data.groupes);
      }
    } catch (err) { 
      console.error("Erreur de fetchGroupes:", err); 
    }
  };

  const handleCheckNomGS = (nom) => {
    const exists = formData.NomGS.includes(nom);
    setFormData({
      ...formData,
      NomGS: exists ? formData.NomGS.filter(i => i !== nom) : [...formData.NomGS, nom]
    });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des Réseaux - ONG Tsinjo Aina", 14, 15);
    const tableData = filteredReseaux.map((r, i) => [
      i + 1, r.NomRS, r.DateCreation, r.NomGS, r.Activite, r.Plaidoyer, r.Plan, r.Autonomie
    ]);
    autoTable(doc, {
      head: [['N°', 'Nom Réseau', 'Créé le', 'Groupes', 'Activité', 'Plaidoyer', 'Plan', 'Autonomie']],
      body: tableData,
      startY: 20,
    });
    doc.save("reseaux_tsinjo_aina.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredReseaux);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reseaux");
    XLSX.writeFile(workbook, "reseaux_tsinjo_aina.xlsx");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const dataToSend = { ...formData, NomGS: formData.NomGS.join(', ') };
      
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, dataToSend, config);
      } else {
        await axios.post(API_URL, dataToSend, config);
      }
  
      setShowModal(false);
      resetForm();
      fetchReseaux();
      Swal.fire({ icon: 'success', title: 'Enregistré !', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Erreur', text: error.response?.data?.message || "Erreur d'enregistrement" });
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Supprimer ?',
      text: "Voulez-vous vraiment supprimer ce réseau ?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          const config = { headers: { Authorization: `Bearer ${token}` } };
          await axios.delete(`${API_URL}/${id}`, config);
          fetchReseaux();
          Swal.fire({ icon: 'success', title: 'Supprimé !', timer: 1500, showConfirmButton: false });
        } catch (error) {
          console.error(error);
          Swal.fire('Erreur', error.response?.data?.message || 'Impossible de supprimer.', 'error');
        } finally { setLoading(false); }
      }
    });
  };

  const openEditModal = (r) => {
    setEditingId(r.codeRS);
    setFormData({ 
      ...r, 
      NomGS: r.NomGS ? r.NomGS.split(', ') : [],
      DateCreation: r.DateCreation ? r.DateCreation.split('T')[0] : initialForm.DateCreation,
      Activite: r.Activite || 'Non',
      Plaidoyer: r.Plaidoyer || 'Non',
      Plan: r.Plan || 'Non',
      Autonomie: r.Autonomie || 'Non'
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 transition-colors font-sans">
      
      {/* HEADER */}
      <div className="p-6 flex flex-wrap justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-700 dark:text-blue-500 tracking-tighter uppercase">Gestion des Réseaux</h1>
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Structuration des groupes</p>
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
            onClick={() => setShowStats(!showStats)} 
            className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-4 py-2.5 rounded-xl transition-all font-black text-xs uppercase"
          >
            <BarChart3 size={18} />
            <span className="hidden sm:block">{showStats ? 'Fermer' : 'Statistiques'}</span>
          </button>
          
          <button 
            onClick={() => { resetForm(); setShowModal(true); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
          >
            <PlusCircle size={22} />
          </button>
        </div>
      </div>

      {/* STATS SECTION */}
      {showStats && (
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top duration-300">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-b-4 border-blue-600 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase">Total Réseaux</span>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{filteredReseaux.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-b-4 border-emerald-600 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase">Autonomes</span>
            <p className="text-3xl font-black text-emerald-600">{filteredReseaux.filter(r=>r.Autonomie==='Oui').length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-b-4 border-pink-500 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase">En cours</span>
            <p className="text-3xl font-black text-pink-500">{filteredReseaux.filter(r=>r.Autonomie==='Non').length}</p>
          </div>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="px-6 py-4 flex items-center gap-4">
        <div className="relative group flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" placeholder="Rechercher un réseau ou groupe..." 
            className="w-full pl-12 pr-12 py-4 rounded-[1.5rem] border-none bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium transition-all"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full text-slate-400 hover:text-red-500 transition-all">
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
                <th className="px-6 py-5 text-left">Réseau / Date</th>
                <th className="px-6 py-5 text-left">Groupes</th>
                <th className="px-6 py-5 text-center">Activite</th>
                <th className="px-6 py-5 text-center">Plaidoyer</th>
                <th className="px-6 py-5 text-center">Plan dev</th>
                <th className="px-6 py-5 text-center">Autonomie</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="8" className="p-20 text-center"><Loader2 size={30} className="animate-spin inline text-blue-600" /></td></tr>
              ) : filteredReseaux.map((r, index) => (
                <tr key={r.codeRS} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                  <td className="px-6 py-4 text-xs font-black text-slate-400">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-800 dark:text-slate-200 uppercase text-sm">{r.NomRS}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-bold">
                      <Calendar size={10} /> {r.DateCreation ? new Date(r.DateCreation).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 max-w-xs truncate">{r.NomGS}</td>
                  <td className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">{r.Activite || 'Non'}</td>
                  <td className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">{r.Plaidoyer || 'Non'}</td>
                  <td className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">{r.Plan || 'Non'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black ${r.Autonomie === 'Oui' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                      {r.Autonomie || 'Non'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(r)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(r.codeRS)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredReseaux.length === 0 && (
            <div className="p-20 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-widest">Aucune donnée</div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden animate-in zoom-in duration-300">
            <div className="px-10 py-8 bg-blue-600 flex justify-between items-center text-white">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Fiche Réseau</h2>
                <p className="text-[10px] font-bold text-blue-200 uppercase">{editingId ? 'Modification' : 'Nouveau Réseau'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nom du Réseau</label>
                  <input 
                    type="text" required
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 uppercase font-black text-slate-800 dark:text-white transition-all"
                    value={formData.NomRS} onChange={(e) => setFormData({...formData, NomRS: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Date de Création</label>
                  <input 
                    type="date" required
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-black text-slate-800 dark:text-white transition-all"
                    value={formData.DateCreation} onChange={(e) => setFormData({...formData, DateCreation: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Séléctionner Groupes</label>
                <div className="grid grid-cols-2 gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                    {groupesDisponibles.length > 0 ? (
                      groupesDisponibles.map((g) => (
                        <div 
                          key={g.codeGS || g.id}
                          onClick={() => handleCheckNomGS(g.nomgs)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
                            formData.NomGS.includes(g.nomgs) 
                              ? 'bg-blue-600 text-white shadow-lg scale-95' 
                              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800'
                          }`}
                        >
                          <span className="text-[10px] font-black truncate">{g.nomgs}</span>
                          {formData.NomGS.includes(g.nomgs) && <CheckCircle2 size={12}/>}
                        </div>
                      ))
                    ) : (
                      <p className="col-span-2 text-center py-4 text-[10px] text-slate-400 font-black uppercase">Aucun groupe disponible</p>
                    )}
                </div>
              </div>

              {/* TSY MISEHO RAHA TSY REHEFA MODIFICATION IHANY (EDITINGID) */}
              {editingId && (
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom duration-300">
                  {['Activite', 'Plaidoyer', 'Plan'].map((field) => (
                    <div key={field} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{field}</span>
                      <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-inner">
                        {['Oui', 'Non'].map(opt => (
                          <button
                            key={opt} type="button"
                            onClick={() => setFormData({...formData, [field]: opt})}
                            className={`px-6 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                              formData[field] === opt ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                    <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase">Statut Autonomie (Calculé)</span>
                    <span className={`text-xs font-black px-3 py-1 rounded-lg ${formData.Autonomie === 'Oui' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 dark:text-slate-600'}`}>
                      {formData.Autonomie}
                    </span>
                  </div>
                </div>
              )}

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

export default ReseauPage;