import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Trash2, Edit2, UserPlus, X, Loader2, Save, CheckCircle2, 
  Search, FileText, Download, BarChart3, Printer
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

const MembresList = () => {
  const [membres, setMembres] = useState([]);
  const [filteredMembres, setFilteredMembres] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    nom_membre: '',
    prenom_membre: '',
    annee_naissance: '',
    sexe: 'Homme', 
    chef: false, 
    num_menage: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const API_URL = 'http://localhost:5000/api/membres';

  useEffect(() => { fetchMembres(); }, []);

  useEffect(() => {
    const results = membres.filter(m => {
      const isChefStr = m.chef ? "chef" : "non";
      const searchTarget = `${m.nom_membre} ${m.prenom_membre} ${m.annee_naissance} ${m.sexe} ${isChefStr} ${m.num_menage}`.toLowerCase();
      return searchTarget.includes(searchTerm.toLowerCase());
    });
    setFilteredMembres(results);
  }, [searchTerm, membres]);

  const fetchMembres = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); 
      
      if (!token) {
        Toast.fire({ 
          icon: 'warning', 
          title: 'Votre session a expiré. Veuillez vous reconnecter.' 
        });
        setLoading(false);
        return;
      }

      const res = await axios.get(API_URL, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });

      setMembres(res.data);
      setFilteredMembres(res.data);
    } catch (error) {
      console.error(error);
      Toast.fire({ 
        icon: 'error', 
        title: 'Connexion au serveur impossible' 
      });
    } finally { 
      setLoading(false); 
    }
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("LISTE DES MEMBRES - ONG TSINJO AINA", 14, 15);
      const tableData = filteredMembres.map((m, i) => [
        i + 1, m.nom_membre, m.prenom_membre, m.annee_naissance || '-', m.sexe, m.chef ? 'CHEF' : 'NON', m.num_menage
      ]);
      autoTable(doc, { head: [['N°', 'Nom', 'Prénom', 'Année', 'Sexe', 'Statut', 'Ménage']], body: tableData, startY: 25 });
      doc.save("membres_tsinjo_aina.pdf");
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export PDF réussi' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Impossible de générer le fichier PDF' });
    }
  };

  const exportExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(filteredMembres);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Membres");
      XLSX.writeFile(workbook, "membres_tsinjo_aina.xlsx");
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export Excel réussi' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Impossible de générer le fichier Excel' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, chef: formData.chef, annee_naissance: parseInt(formData.annee_naissance) || 0 };
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); 
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, payload, config);
      } else {
        await axios.post(API_URL, payload, config);
      }
      
      setShowModal(false);
      resetForm();
      fetchMembres();
      Toast.fire({ icon: 'success', title: 'Mise à jour réussie avec succès' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: "Erreur lors de l'enregistrement" });
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Supprimer ce membre ?', 
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
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
          fetchMembres();
          Toast.fire({ icon: 'success', title: 'Suppression réussie' });
        } catch (error) {
          console.error(error);
          Toast.fire({ icon: 'error', title: 'Impossible de supprimer le membre' });
        } finally { setLoading(false); }
      }
    });
  };

  const openEditModal = (m) => {
    setEditingId(m.nummembre);
    setFormData({ ...m, annee_naissance: m.annee_naissance || '' });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 transition-colors font-sans overflow-hidden">
      
      <div className="p-6 flex flex-wrap justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-700 dark:text-blue-500 tracking-tighter uppercase ">Gestion des Membres</h1>
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Base de données sécurisée</p>
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
            <UserPlus size={22} />
          </button>
        </div>
      </div>

      {showStats && (
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top duration-300">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-b-4 border-blue-600 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase">Population</span>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{filteredMembres.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-b-4 border-emerald-600 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase">Chefs Ménage</span>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{filteredMembres.filter(m=>m.chef).length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-b-4 border-pink-500 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase">Mixité (H/F)</span>
            <p className="text-3xl font-black text-slate-800 dark:text-white">
              {filteredMembres.filter(m=>m.sexe==='Homme').length}/{filteredMembres.filter(m=>m.sexe==='Femme').length}
            </p>
          </div>
        </div>
      )}

      <div className="px-6 py-4 flex items-center gap-4">
        <div className="relative group flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input type="text" placeholder="Rechercher un membre..." className="w-full pl-12 pr-12 py-4 rounded-[1.5rem] border-none bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                <th className="px-6 py-5 text-left w-20 flex-shrink-0">N°</th>
                <th className="px-6 py-5 text-left flex-1">Membre</th>
                <th className="px-6 py-5 text-center w-24 flex-shrink-0">Année</th>
                <th className="px-6 py-5 text-center w-32 flex-shrink-0">Genre</th>
                <th className="px-6 py-5 text-center w-32 flex-shrink-0">Statut</th>
                <th className="px-6 py-5 text-left w-32 flex-shrink-0">Ménage</th>
                <th className="px-6 py-5 text-right w-32 flex-shrink-0">Actions</th>
              </tr>
            </thead>
            <tbody 
              className="flex flex-col w-full overflow-y-auto" 
              style={{ maxHeight: 'calc(68px * 3)' }}
            >
              {loading ? (
                <tr className="w-full"><td className="p-20 text-center w-full"><Loader2 size={30} className="animate-spin inline text-blue-600" /></td></tr>
              ) : filteredMembres.map((m, index) => (
                <tr key={m.nummembre} className="flex w-full items-center hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <td className="px-6 py-4 text-xs font-black text-slate-400 w-20 flex-shrink-0">{index + 1}</td>
                  <td className="px-6 py-4 flex-1">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase truncate">{m.nom_membre}</span>
                      <span className="text-[11px] text-slate-500 font-bold capitalize truncate">{m.prenom_membre}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-mono font-bold w-24 flex-shrink-0">{m.annee_naissance || '----'}</td>
                  <td className="px-6 py-4 text-center w-32 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black ${m.sexe === 'Homme' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                      {m.sexe === 'Homme' ? 'HOMME' : 'FEMME'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center w-32 flex-shrink-0">
                    {m.chef ? ( 
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md inline-flex items-center gap-1"><CheckCircle2 size={12} /> CHEF</span>
                    ) : (
                      <span className="text-[9px] font-black text-slate-400 uppercase">MEMBRE</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-blue-600 w-32 flex-shrink-0">#{m.num_menage}</td>
                  <td className="px-6 py-4 text-right w-32 flex-shrink-0">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(m)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(m.nummembre)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredMembres.length === 0 && (
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
                <h2 className="text-xl font-black uppercase tracking-tighter">Fiche Membre</h2>
                <p className="text-[10px] font-bold text-blue-200 uppercase">Information de l'adhérent</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="bg-white/10 hover:bg-white/20 p-2 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nom de famille</label>
                  <input type="text" required className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 uppercase font-black text-slate-800 dark:text-white transition-all" value={formData.nom_membre} onChange={(e) => setFormData({...formData, nom_membre: e.target.value})} />
                </div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Prénoms</label>
                  <input type="text" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 dark:text-white transition-all" value={formData.prenom_membre} onChange={(e) => setFormData({...formData, prenom_membre: e.target.value})} />
                </div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Année Naissance</label>
                  <input type="number" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" value={formData.annee_naissance} onChange={(e) => setFormData({...formData, annee_naissance: e.target.value})} />
                </div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Sexe</label>
                  <select className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white transition-all" value={formData.sexe} onChange={(e) => setFormData({...formData, sexe: e.target.value})}><option value="Homme">Homme</option><option value="Femme">Femme</option></select>
                </div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">N° Identification Ménage</label>
                  <input type="text" required className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-black text-blue-600" value={formData.num_menage} onChange={(e) => setFormData({...formData, num_menage: e.target.value})} />
                </div>
                <div className="flex items-end pb-1"><label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl cursor-pointer w-full hover:bg-emerald-50 transition-colors group">
                    <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={formData.chef} onChange={(e) => setFormData({...formData, chef: e.target.checked})} /><span className="text-[10px] font-black uppercase group-hover:text-emerald-700 transition-colors">Chef de ménage ?</span></label>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 transition-all uppercase tracking-widest mt-4"><Save size={20} />{editingId ? 'Mettre à jour' : 'Enregistrer'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembresList;