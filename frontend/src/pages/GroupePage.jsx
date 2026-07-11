import React, { useState, useEffect } from 'react';
import { getGroupes, createGroupe, deleteGroupe, updateGroupe } from '../services/groupeService';
import Swal from 'sweetalert2';
import { 
  Trash2, Edit2, Users, X, Loader2, Save, Eye,
  MapPin, Search, FileText, Download, Printer, Plus, Calendar, ShieldCheck
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

const GroupePage = () => {
  const [groupes, setGroupes] = useState([]);
  const [filteredGroupes, setFilteredGroupes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showVoirPlusModal, setShowVoirPlusModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    nomgs: '',
    nummenage: '',
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
      const resGroupes = await getGroupes();
      setGroupes(resGroupes.data);
      setFilteredGroupes(resGroupes.data);
    } catch (error) {
      console.error(error);
      Toast.fire({ 
        icon: 'error', 
        title: 'Connexion au serveur impossible' 
      });
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

        // Header Helper
        const addCenteredHeader = (yOffset) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text("Liste des groupes solidaires - ONG Tsinjo Aina", pageWidth / 2, yOffset, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Date d'édition : ${today}`, pageWidth / 2, yOffset + 7, { align: 'center' });
        };

        // Ampidiro ilay logo boribory
        doc.addImage(circularLogo, 'PNG', (pageWidth - 25) / 2, 10, 25, 25);
        addCenteredHeader(40);

        const tableData = filteredGroupes.map((g, i) => [
            i + 1, 
            g.nomgs, 
            g.nummenage, 
            g.village, 
            g.fokontany, 
            g.commune, 
            g.date_creation ? new Date(g.date_creation).toLocaleDateString() : '-'
        ]);

        autoTable(doc, {
            head: [['N°', 'Nom GS', 'Ménages', 'Village', 'Fokontany', 'Commune', 'Date création']],
            body: tableData,
            startY: 50,
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

const handleSubmit = async (e) => {
    e.preventDefault();

    const inputMenages = formData.nummenage
      .split(',')
      .map(m => m.trim().toUpperCase())
      .filter(m => m !== '');

    const existingMenages = new Set();
    groupes.forEach(g => {
      if (editingId && g.codegs === editingId) return;

      if (g.nummenage) {
        g.nummenage.split(',').forEach(m => {
          const cleaned = m.trim().toUpperCase();
          if (cleaned) existingMenages.add(cleaned);
        });
      }
    });

    const duplicates = inputMenages.filter(m => existingMenages.has(m));

    if (duplicates.length > 0) {
      Toast.fire({
        icon: 'error',
        title: `Ménage(s) déjà attribué(s) : ${duplicates.join(', ')}`
      });
      return;
    }

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
      Toast.fire({ icon: 'success', title: 'Enregistrement réussi' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: error.response?.data?.message || "Erreur lors de l'enregistrement" });
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      title: 'Supprimer ce groupe ?', 
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
    const formattedDate = g.date_creation ? new Date(g.date_creation).toISOString().split('T')[0] : '';
    setFormData({ ...g, nummenage: g.nummenage || '', date_creation: formattedDate });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ nomgs: '', nummenage: '', commune: '', fokontany: '', village: '', date_creation: '' });
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 transition-colors font-sans overflow-hidden relative">
      
      {/* HEADER WITH ICON */}
      <div className="p-4 px-6 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-900/50">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-700 dark:text-blue-500 tracking-tight">Groupes solidaires</h1>
            <p className="text-xs text-emerald-600 font-medium">Gestion communautaire</p>
          </div>
        </div>
      </div>

      {/* SEARCH BAR + ACTIONS (EXPORTER, VOIR PLUS, AJOUTER) */}
      <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="relative group flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher un groupe, un ménage ou un lieu..." 
            className="w-full pl-10 pr-10 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X size={14} /></button>
          )}
        </div>

        {/* ACTIONS BOUTONS AMIN'NY ANKAVANA */}
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

          {/* BOUTON VOIR PLUS AU LIEU DE STATISTIQUES */}
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

      {/* TABLE */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full flex flex-col">
            <thead className="bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 w-full sticky top-0 z-10">
              <tr className="flex w-full">
                <th className="px-4 py-2.5 text-left w-16 flex-shrink-0">N°</th>
                <th className="px-4 py-2.5 text-left flex-1">Nom du groupe</th>
                <th className="px-4 py-2.5 text-left flex-1">Ménages rattachés</th>
                <th className="px-4 py-2.5 text-left flex-1">Localisation</th>
                <th className="px-4 py-2.5 text-right w-24 flex-shrink-0">Actions</th>
              </tr>
            </thead>
            <tbody 
              className="flex flex-col w-full overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80" 
              style={{ maxHeight: '290px' }}
            >
              {loading ? (
                <tr className="w-full"><td className="p-8 text-center w-full"><Loader2 size={24} className="animate-spin inline text-blue-600" /></td></tr>
              ) : filteredGroupes.map((g, index) => (
                <tr key={g.codegs} className="flex w-full items-center h-[48px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 w-16 flex-shrink-0">{index + 1}</td>
                  <td className="px-4 py-2 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-md">
                        <Users size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate">{g.nomgs}</span>
                        {g.date_creation && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                            <Calendar size={10} /> {new Date(g.date_creation).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 flex-1">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {g.nummenage?.split(',').map((m, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded text-[10px] font-bold">
                          {m.trim()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2 flex-1">
                    <div className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 font-medium truncate">
                      <MapPin size={12} className="text-red-500 flex-shrink-0" />
                      <span className="truncate capitalize">{g.commune}, {g.fokontany}, {g.village}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right w-24 flex-shrink-0">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEditModal(g)} title="Modifier" className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(g.codegs)} title="Supprimer" className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-md transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredGroupes.length === 0 && (
                <tr className="w-full"><td className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium text-xs w-full">Aucun groupe trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL "VOIR PLUS" (AU CENTRE TOY NY FORMULAIRE) */}
      {showVoirPlusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-lg animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-3.5 bg-blue-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Eye size={16} />
                <h2 className="text-xs font-bold">Vue d'ensemble des groupes</h2>
              </div>
              <button onClick={() => setShowVoirPlusModal(false)} className="text-white/80 hover:text-white p-1 rounded-md"><X size={18} /></button>
            </div>
            
            <div className="p-5 space-y-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-l-4 border-blue-600 rounded-md flex justify-between items-center">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Total groupes solidaires</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{filteredGroupes.length}</p>
                </div>
                <Users size={20} className="text-blue-600" />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-l-4 border-emerald-600 rounded-md flex justify-between items-center">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Ménages couverst / rattachés</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {[...new Set(filteredGroupes.flatMap(g => g.nummenage?.split(',') || []))].length}
                  </p>
                </div>
                <ShieldCheck size={20} className="text-emerald-600" />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-l-4 border-amber-500 rounded-md flex justify-between items-center">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Zones couvertes (Communes)</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {[...new Set(filteredGroupes.map(g => g.commune))].length}
                  </p>
                </div>
                <MapPin size={20} className="text-amber-500" />
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
                <h2 className="text-xs font-bold">{editingId ? 'Modifier un groupe' : 'Nouveau groupe'}</h2>
                <p className="text-[11px] font-normal text-blue-100">Fiche de saisie des données</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-white/80 hover:text-white p-1 rounded-md"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nom du groupe *</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs font-medium capitalize" 
                    value={formData.nomgs} 
                    onChange={(e) => setFormData({...formData, nomgs: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date de création *</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs font-medium" 
                    value={formData.date_creation} 
                    onChange={(e) => setFormData({...formData, date_creation: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Commune</label>
                  <input 
                    type="text" 
                    className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs font-medium capitalize" 
                    value={formData.commune} 
                    onChange={(e) => setFormData({...formData, commune: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Fokontany</label>
                  <input 
                    type="text" 
                    className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs font-medium capitalize" 
                    value={formData.fokontany} 
                    onChange={(e) => setFormData({...formData, fokontany: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Village</label>
                  <input 
                    type="text" 
                    className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs font-medium capitalize" 
                    value={formData.village} 
                    onChange={(e) => setFormData({...formData, village: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ménages rattachés *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: M001, M002, M003" 
                    className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 outline-none focus:border-blue-600 text-xs font-bold placeholder:font-normal placeholder:text-slate-400" 
                    value={formData.nummenage} 
                    onChange={(e) => setFormData({...formData, nummenage: e.target.value})} 
                  />
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

export default GroupePage;