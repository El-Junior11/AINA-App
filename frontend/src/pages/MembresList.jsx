import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Trash2, Edit2, UserPlus, X, Loader2, Save, CheckCircle2, 
  Search, FileText, Download, BarChart3, Printer, Users, ShieldCheck, HeartHandshake
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

  // Fandaharana miakatra (croissant) araka ny num_menage
  const sortMembresByNumMenage = (data) => {
    return [...data].sort((a, b) => {
      const valA = String(a.num_menage || '');
      const valB = String(b.num_menage || '');
      return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
    });
  };

  useEffect(() => {
    const results = membres.filter(m => {
      const isChefStr = m.chef ? "chef" : "non";
      const searchTarget = `${m.nom_membre} ${m.prenom_membre} ${m.annee_naissance} ${m.sexe} ${isChefStr} ${m.num_menage}`.toLowerCase();
      return searchTarget.includes(searchTerm.toLowerCase());
    });
    setFilteredMembres(sortMembresByNumMenage(results));
  }, [searchTerm, membres]);

  const fetchMembres = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); 
      if (!token) {
        Toast.fire({ icon: 'warning', title: 'Votre session a expiré.' });
        setLoading(false);
        return;
      }
      const res = await axios.get(API_URL, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      
      const sortedData = sortMembresByNumMenage(res.data);
      setMembres(sortedData);
      setFilteredMembres(sortedData);
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

        // Fonction hanovana sary ho boribory (Circular Clip)
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

        // Header Helper
        const addCenteredHeader = (yOffset) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text("Liste des membres - ONG Tsinjo Aina", pageWidth / 2, yOffset, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Date d'édition : ${today}`, pageWidth / 2, yOffset + 7, { align: 'center' });
        };

        // Ampidiro ilay logo efa boribory
        doc.addImage(circularLogo, 'PNG', (pageWidth - 25) / 2, 10, 25, 25);
        addCenteredHeader(40);

        const tableData = filteredMembres.map((m, i) => [
            i + 1, 
            `${m.nom_membre} ${m.prenom_membre || ''}`, 
            m.annee_naissance || '-', 
            m.sexe, 
            m.chef ? 'Chef' : 'Membre', 
            m.num_menage
        ]);

        autoTable(doc, { 
            head: [['N°', 'Membre', 'Année', 'Sexe', 'Statut', 'Ménage']], 
            body: tableData, 
            startY: 50 
        });

        doc.save("membres_tsinjo_aina.pdf");
        setShowExportMenu(false);
        Toast.fire({ icon: 'success', title: 'Export PDF réussi' });

    } catch (error) {
        console.error(error);
        Toast.fire({ icon: 'error', title: 'Impossible de générer le PDF' });
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
      Toast.fire({ icon: 'error', title: 'Impossible de générer l\'Excel' });
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
      title: 'Supprimer ce membre ?', 
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
          await axios.delete(`${API_URL}/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
          fetchMembres();
          Toast.fire({ icon: 'success', title: 'Suppression réussie' });
        } catch (error) {
          console.error(error);
          Toast.fire({ icon: 'error', title: 'Impossible de supprimer' });
        }
      }
    });
  };

  const openEditModal = (m) => {
    setEditingId(m.nummembre);
    setFormData({ ...m, annee_naissance: m.annee_naissance || '' });
    setShowModal(true);
  };

  const resetForm = () => { setEditingId(null); setFormData(initialForm); };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 transition-colors font-sans overflow-hidden relative">
      
      {/* HEADER SIMPLE */}
      <div className="p-4 px-6 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-blue-700 dark:text-blue-500 tracking-tight flex items-center gap-2">
            <Users size={22} className="text-blue-600 dark:text-blue-400" />
            Gestion des membres
          </h1>
          <p className="text-xs text-emerald-600 font-medium">Base de données sécurisée</p>
        </div>
      </div>

      {/* SEARCH BAR WITH BUTTONS INLINE */}
      <div className="px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="relative group flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher un membre..." 
            className="w-full pl-10 pr-10 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X size={14} /></button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => { resetForm(); setShowModal(true); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-all shadow-xs shrink-0"
          >
            <UserPlus size={16} />
            <span className="hidden sm:block">Ajouter</span>
          </button>

          <button 
            onClick={() => setShowStats(true)} 
            className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-2 rounded-md transition-all font-semibold text-xs shrink-0"
          >
            <BarChart3 size={15} />
            <span className="hidden sm:block">Voir plus</span>
          </button>

          <div className="relative shrink-0">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md transition-all flex items-center gap-2 text-xs font-semibold shadow-xs"
            >
              <Printer size={15} />
              <span className="hidden md:block">Exporter</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg z-50 text-slate-900 dark:text-white overflow-hidden">
                <button onClick={exportPDF} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium border-b dark:border-slate-800"><FileText size={15} className="text-red-500" /> Document PDF</button>
                <button onClick={exportExcel} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium"><Download size={15} className="text-emerald-600" /> Feuille Excel</button>
              </div>
            )}
          </div>
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
                  <th className="px-4 py-2.5 min-w-[200px]">Membre</th>
                  <th className="px-4 py-2.5 text-center min-w-[90px]">Année</th>
                  <th className="px-4 py-2.5 text-center min-w-[100px]">Genre</th>
                  <th className="px-4 py-2.5 text-center min-w-[100px]">Statut</th>
                  <th className="px-4 py-2.5 min-w-[100px]">Ménage</th>
                  <th className="px-4 py-2.5 text-right w-20 sticky right-0 bg-slate-100 dark:bg-slate-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center"><Loader2 size={24} className="animate-spin inline text-blue-600" /></td>
                  </tr>
                ) : filteredMembres.map((m, index) => (
                  <tr key={m.nummembre} className="h-[48px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-4 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 w-14">{index + 1}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5 text-xs truncate">
                        <span className="font-bold text-slate-900 dark:text-white capitalize truncate">{m.nom_membre}</span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium capitalize truncate">{m.prenom_membre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center text-xs font-mono font-medium text-slate-800 dark:text-slate-200">{m.annee_naissance || '----'}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold inline-block ${m.sexe === 'Homme' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300'}`}>
                        {m.sexe === 'Homme' ? 'Homme' : 'Femme'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {m.chef ? ( 
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-emerald-200 dark:border-emerald-900"><CheckCircle2 size={11} /> Chef</span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Membre</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400">{m.num_menage}</td>
                    <td className="px-4 py-2 text-right w-20 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEditModal(m)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(m.nummembre)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-md"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredMembres.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium text-xs">Aucune donnée trouvée</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* STATISTIQUES (VOIR PLUS) */}
      {showStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-lg animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-3.5 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xs font-bold flex items-center gap-2">
                  <BarChart3 size={16} /> Aperçu des statistiques
                </h2>
                <p className="text-[11px] font-normal text-blue-100">Résumé global de la base de données</p>
              </div>
              <button onClick={() => setShowStats(false)} className="text-white/80 hover:text-white p-1 rounded-md"><X size={18} /></button>
            </div>
            
            <div className="p-5 space-y-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-l-4 border-blue-600 rounded-md flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Total population</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{filteredMembres.length}</p>
                </div>
                <Users size={20} className="text-blue-600" />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-l-4 border-emerald-600 rounded-md flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Chefs de ménage</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{filteredMembres.filter(m => m.chef).length}</p>
                </div>
                <ShieldCheck size={20} className="text-emerald-600" />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-l-4 border-pink-500 rounded-md flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Répartition (Homme / Femme)</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {filteredMembres.filter(m => m.sexe === 'Homme').length} <span className="text-slate-400 text-xs font-normal">/</span> {filteredMembres.filter(m => m.sexe === 'Femme').length}
                  </p>
                </div>
                <HeartHandshake size={20} className="text-pink-500" />
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={() => setShowStats(false)} 
                className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-4 py-1.5 rounded-md text-xs font-semibold transition-colors"
              >
                Fermer
              </button>
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
                <h2 className="text-xs font-bold">{editingId ? 'Modifier un membre' : 'Nouveau membre'}</h2>
                <p className="text-[11px] font-normal text-blue-100">Fiche de saisie des données</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-white/80 hover:text-white p-1 rounded-md"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nom de famille *</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs font-medium capitalize" 
                    value={formData.nom_membre} 
                    onChange={(e) => setFormData({...formData, nom_membre: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Prénoms</label>
                  <input 
                    type="text" 
                    className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs font-medium capitalize" 
                    value={formData.prenom_membre} 
                    onChange={(e) => setFormData({...formData, prenom_membre: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Année de naissance</label>
                  <input 
                    type="number" 
                    className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs font-medium" 
                    value={formData.annee_naissance} 
                    onChange={(e) => setFormData({...formData, annee_naissance: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sexe</label>
                  <select 
                    className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs font-medium" 
                    value={formData.sexe} 
                    onChange={(e) => setFormData({...formData, sexe: e.target.value})}
                  >
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">N° Ménage *</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 outline-none focus:border-blue-600 text-xs font-bold" 
                    value={formData.num_menage} 
                    onChange={(e) => setFormData({...formData, num_menage: e.target.value})} 
                  />
                </div>

                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2 border border-slate-200 dark:border-slate-700 rounded-md cursor-pointer w-full">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 accent-emerald-600 rounded-sm" 
                      checked={formData.chef} 
                      onChange={(e) => setFormData({...formData, chef: e.target.checked})} 
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Chef de ménage ?</span>
                  </label>
                </div>
              </div>

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

export default MembresList;