import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Trash2, Edit2, X, Loader2, Save, CheckCircle2, 
  Search, FileText, Download, BarChart3, Printer, Calendar, Plus
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
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      setReseaux(res.data);
      setFilteredReseaux(res.data);
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Connexion au serveur impossible' });
    } finally { setLoading(false); }
  };

  const fetchGroupes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/groupes');
      const data = Array.isArray(res.data) ? res.data : (res.data?.groupes || []);
      setGroupesDisponibles(data);
    } catch (err) { console.error(err); }
  };

  const handleCheckNomGS = (nom) => {
    setFormData(prev => ({
      ...prev,
      NomGS: prev.NomGS.includes(nom) ? prev.NomGS.filter(i => i !== nom) : [...prev.NomGS, nom]
    }));
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("LISTE DES RESEAUX - ONG TSINJO AINA", 14, 15);
      const tableData = filteredReseaux.map((r, i) => [
        i + 1, r.NomRS, r.DateCreation ? new Date(r.DateCreation).toLocaleDateString() : '-', r.NomGS, r.Activite, r.Plaidoyer, r.Plan, r.Autonomie
      ]);
      autoTable(doc, { head: [['N°', 'Nom Réseau', 'Date Création', 'Groupes', 'Act.', 'Plaid.', 'Plan', 'Auto.']], body: tableData, startY: 25 });
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
      const dataToSend = { ...formData, NomGS: formData.NomGS.join(', ') };
      
      if (editingId) { 
        await axios.put(`${API_URL}/${editingId}`, dataToSend, config); 
      } else { 
        await axios.post(API_URL, dataToSend, config); 
      }
      
      setShowModal(false); 
      resetForm(); 
      fetchReseaux();
      Toast.fire({ icon: 'success', title: 'Mise à jour réussie avec succès' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: "Erreur lors de l'enregistrement" });
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Supprimer ce réseau ?', 
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
    setFormData({ ...r, NomGS: r.NomGS ? r.NomGS.split(', ') : [], DateCreation: r.DateCreation ? r.DateCreation.split('T')[0] : initialForm.DateCreation });
    setShowModal(true);
  };

  const resetForm = () => { setEditingId(null); setFormData(initialForm); };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 transition-colors font-sans overflow-hidden">
      
      <div className="p-6 flex flex-wrap justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-700 dark:text-blue-500 tracking-tighter uppercase">Gestion des Réseaux</h1>
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Base de données communautaire</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
              <Printer size={20} />
              <span className="text-xs font-bold uppercase hidden md:block">Exporter</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-3 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <button onClick={exportPDF} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-800"><FileText size={16} className="text-red-500" /> Document PDF</button>
                <button onClick={exportExcel} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"><Download size={16} className="text-emerald-600" /> Feuille Excel</button>
              </div>
            )}
          </div>
          <button onClick={() => setShowStats(!showStats)} className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-all font-black text-xs uppercase">
            <BarChart3 size={18} /><span className="hidden sm:block">{showStats ? 'Fermer' : 'Statistiques'}</span>
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all">
            <Plus size={22} />
          </button>
        </div>
      </div>

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
            <span className="text-[10px] font-black text-slate-400 uppercase">En structuration</span>
            <p className="text-3xl font-black text-pink-500">{filteredReseaux.filter(r=>r.Autonomie==='Non').length}</p>
          </div>
        </div>
      )}

      <div className="px-6 py-4 flex items-center gap-4">
        <div className="relative group flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input type="text" placeholder="Rechercher un réseau..." className="w-full pl-12 pr-12 py-4 rounded-[1.5rem] border-none bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-100 hover:bg-red-100 p-1.5 rounded-full text-slate-400 hover:text-red-500 transition-all"><X size={16} /></button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <table className="w-full flex flex-col">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[13px] font-black tracking-widest text-slate-500 border-b dark:border-slate-800 w-full">
              <tr className="flex w-full">
                <th className="px-6 py-4 text-left w-16 flex-shrink-0">N°</th>
                <th className="px-6 py-4 text-left flex-1">Réseau / Date</th>
                <th className="px-6 py-4 text-left flex-1">Groupes</th>
                <th className="px-6 py-4 text-center w-24 flex-shrink-0">Activité</th>
                <th className="px-6 py-4 text-center w-24 flex-shrink-0">Plaidoyer</th>
                <th className="px-6 py-4 text-center w-24 flex-shrink-0">Plan Dev</th>
                <th className="px-6 py-4 text-center w-28 flex-shrink-0">Autonomie</th>
                <th className="px-6 py-4 text-right w-24 flex-shrink-0">Actions</th>
              </tr>
            </thead>
            <tbody className="flex flex-col w-full overflow-y-auto" style={{ maxHeight: 'calc(68px * 3)' }}>
              {loading ? (
                <tr className="w-full"><td className="p-20 text-center w-full"><Loader2 size={30} className="animate-spin inline text-blue-600" /></td></tr>
              ) : filteredReseaux.map((r, index) => (
                <tr key={r.codeRS} className="flex w-full items-center hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <td className="px-6 py-4 text-xs font-black text-slate-400 w-16 flex-shrink-0">{index + 1}</td>
                  <td className="px-6 py-4 flex-1">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase truncate">{r.NomRS}</span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5"><Calendar size={10} /> {r.DateCreation ? new Date(r.DateCreation).toLocaleDateString() : '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 flex-1">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {r.NomGS?.split(',').map((g, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-[9px] font-black uppercase">{g.trim()}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center w-24 flex-shrink-0">
                    <span className={`text-[10px] font-bold ${r.Activite === 'Oui' ? 'text-emerald-600' : 'text-slate-300'}`}>{r.Activite}</span>
                  </td>
                  <td className="px-6 py-4 text-center w-24 flex-shrink-0">
                    <span className={`text-[10px] font-bold ${r.Plaidoyer === 'Oui' ? 'text-emerald-600' : 'text-slate-300'}`}>{r.Plaidoyer}</span>
                  </td>
                  <td className="px-6 py-4 text-center w-24 flex-shrink-0">
                    <span className={`text-[10px] font-bold ${r.Plan === 'Oui' ? 'text-emerald-600' : 'text-slate-300'}`}>{r.Plan}</span>
                  </td>
                  <td className="px-6 py-4 text-center w-28 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${r.Autonomie === 'Oui' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {r.Autonomie === 'Oui' ? 'AUTONOME' : 'EN COURS'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right w-24 flex-shrink-0">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(r)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(r.codeRS)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredReseaux.length === 0 && (
                <tr className="w-full"><td className="p-20 text-center text-slate-300 font-black uppercase tracking-widest w-full">Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in duration-300">
            <div className="px-10 py-8 bg-blue-600 flex justify-between items-center text-white">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Fiche Réseau</h2>
                <p className="text-[10px] font-bold text-blue-200 uppercase">Paramètres de la structure</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="bg-white/10 hover:bg-white/20 p-2 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nom du Réseau</label>
                  <input type="text" required className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 uppercase font-black text-slate-800 dark:text-white" value={formData.NomRS} onChange={(e) => setFormData({...formData, NomRS: e.target.value})} />
                </div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Date Création</label>
                  <input type="date" required className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-black" value={formData.DateCreation} onChange={(e) => setFormData({...formData, DateCreation: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Groupes Membres ({formData.NomGS.length})</label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 max-h-32 overflow-y-auto">
                  {groupesDisponibles.map((g) => (
                    <div key={g.codegs || g.id} onClick={() => handleCheckNomGS(g.nomgs)} className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer border transition-all ${formData.NomGS.includes(g.nomgs) ? 'border-blue-500 bg-white dark:bg-slate-800 shadow-md' : 'border-transparent bg-slate-200/30'}`}>
                      <span className="text-[10px] font-black uppercase truncate">{g.nomgs}</span>
                      {formData.NomGS.includes(g.nomgs) && <CheckCircle2 size={12} className="text-blue-500" />}
                    </div>
                  ))}
                </div>
              </div>

              {editingId && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {[['Activite', 'Activités'], ['Plaidoyer', 'Plaidoyers'], ['Plan', 'Plan Dev']].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl">
                      <span className="text-[10px] font-black text-slate-500 uppercase">{label}</span>
                      <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-inner">
                        {['Oui', 'Non'].map(opt => (
                          <button key={opt} type="button" onClick={() => setFormData({...formData, [key]: opt})} className={`px-5 py-1 rounded-lg text-[10px] font-black transition-all ${formData[key] === opt ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{opt}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex justify-between items-center"><span className="text-[10px] font-black text-emerald-700 uppercase">Statut Autonomie</span><span className="text-[10px] font-black px-3 py-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm text-emerald-600">{formData.Autonomie}</span></div>
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 transition-all uppercase tracking-widest mt-4"><Save size={20} />{editingId ? 'Mettre à jour' : 'Enregistrer'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReseauPage;