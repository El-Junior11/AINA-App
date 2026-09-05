import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Trash2, Edit2, UserPlus, X, Loader2, Save, CheckCircle2, Search, FileText, Download, BarChart3, Printer, Users, ShieldCheck, HeartHandshake } from 'lucide-react';
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
  didOpen: toast => {
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

  useEffect(() => {
    fetchMembres();
  }, []);

  const sortMembresByNumMenage = data => [...data].sort((a, b) => {
    const valA = String(a.num_menage || '');
    const valB = String(b.num_menage || '');
    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
  });

  useEffect(() => {
    const results = membres.filter(m => {
      const isChefStr = m.chef ? 'chef' : 'non';
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
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const sortedData = sortMembresByNumMenage(res.data);
      setMembres(sortedData);
      setFilteredMembres(sortedData);
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Connexion au serveur impossible' });
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const today = new Date().toLocaleDateString('fr-FR');

      const getCircularImage = url => new Promise(resolve => {
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

      const circularLogo = await getCircularImage(logo);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Liste des membres - ONG Tsinjo Aina', pageWidth / 2, 40, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date d'édition : ${today}`, pageWidth / 2, 47, { align: 'center' });
      doc.addImage(circularLogo, 'PNG', (pageWidth - 25) / 2, 10, 25, 25);

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

      doc.save('membres_tsinjo_aina.pdf');
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Membres');
      XLSX.writeFile(workbook, 'membres_tsinjo_aina.xlsx');
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export Excel réussi' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: "Impossible de générer l'Excel" });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = { ...formData, chef: formData.chef, annee_naissance: parseInt(formData.annee_naissance) || 0 };

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

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
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
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
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          fetchMembres();
          Toast.fire({ icon: 'success', title: 'Suppression réussie' });
        } catch (error) {
          console.error(error);
          Toast.fire({ icon: 'error', title: 'Impossible de supprimer' });
        }
      }
    });
  };

  const openEditModal = m => {
    setEditingId(m.nummembre);
    setFormData({ ...m, annee_naissance: m.annee_naissance || '' });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const totalHommes = filteredMembres.filter(m => m.sexe === 'Homme').length;
  const totalFemmes = filteredMembres.filter(m => m.sexe === 'Femme').length;
  const totalChefs = filteredMembres.filter(m => m.chef).length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 transition-colors font-body overflow-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
        .font-body{font-family:'DM Sans',sans-serif}.font-display{font-family:'Manrope',sans-serif}
      `}</style>

      <div className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-sky-500 text-white rounded-2xl shrink-0 shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-lg font-display font-extrabold text-slate-900 dark:text-white tracking-tight">Gestion des membres</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Base de données sécurisée et gestion centralisée des membres.</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="relative group flex-1 min-w-[240px] max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input type="text" placeholder="Rechercher un membre..." className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-gradient-to-r from-emerald-500 to-sky-500 hover:opacity-90 text-white px-3 py-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm hover:shadow-md shrink-0">
            <UserPlus size={16} />
            <span className="hidden sm:block">Ajouter</span>
          </button>

          <button onClick={() => setShowStats(true)} className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-950/50 px-3 py-2.5 rounded-xl transition-all font-bold text-xs border border-sky-100 dark:border-sky-900/40 shrink-0">
            <BarChart3 size={16} />
            <span className="hidden sm:block">Statistiques</span>
          </button>

          <div className="relative shrink-0">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm hover:shadow-md">
              <Printer size={16} />
              <span className="hidden md:block">Exporter</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 text-slate-900 dark:text-white overflow-hidden">
                <button onClick={exportPDF} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium border-b border-slate-100 dark:border-slate-800 transition-colors">
                  <FileText size={17} className="text-rose-500" />
                  Document PDF
                </button>
                <button onClick={exportExcel} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors">
                  <Download size={17} className="text-emerald-600" />
                  Feuille Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 md:px-6 pb-6">
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm h-full flex flex-col">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/90 text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4 w-16">N°</th>
                  <th className="px-5 py-4 min-w-[220px]">Membre</th>
                  <th className="px-5 py-4 text-center min-w-[100px]">Année</th>
                  <th className="px-5 py-4 text-center min-w-[110px]">Genre</th>
                  <th className="px-5 py-4 text-center min-w-[110px]">Statut</th>
                  <th className="px-5 py-4 min-w-[110px]">Ménage</th>
                  <th className="px-5 py-4 text-right w-24 sticky right-0 bg-slate-50 dark:bg-slate-800">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <Loader2 size={28} className="animate-spin inline text-emerald-500" />
                    </td>
                  </tr>
                ) : filteredMembres.map((m, index) => (
                  <tr key={m.nummembre} className="h-[58px] hover:bg-emerald-50/40 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-5 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 w-16">{index + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 text-sm truncate">
                        <span className="font-bold text-slate-900 dark:text-white capitalize truncate">{m.nom_membre}</span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium capitalize truncate">{m.prenom_membre}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center text-sm font-mono font-medium text-slate-800 dark:text-slate-200">{m.annee_naissance || '----'}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${m.sexe === 'Homme' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                        {m.sexe === 'Homme' ? 'Homme' : 'Femme'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {m.chef ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-3 py-1 rounded-lg inline-flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-900">
                          <CheckCircle2 size={13} />
                          Chef
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Membre</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-sky-600 dark:text-sky-400">{m.num_menage}</td>
                    <td className="px-5 py-3 text-right w-24 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-emerald-50/40 dark:group-hover:bg-slate-800/50">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(m)} className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(m.nummembre)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filteredMembres.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium text-sm">Aucune donnée trouvée</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-sky-500 text-white flex justify-between items-center">
              <div>
                <h2 className="text-sm font-display font-bold flex items-center gap-2"><BarChart3 size={17} />Aperçu des statistiques</h2>
                <p className="text-xs font-medium text-white/80 mt-1">Résumé global de la base de données</p>
              </div>
              <button onClick={() => setShowStats(false)} className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"><X size={18} /></button>
            </div>

            <div className="p-4 space-y-3">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total population</span>
                  <p className="text-xl font-display font-extrabold text-slate-900 dark:text-white mt-1">{filteredMembres.length}</p>
                </div>
                <div className="p-2 bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-950/40 dark:to-emerald-950/30 rounded-lg">
                  <Users size={19} className="text-sky-600 dark:text-sky-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Chefs de ménage</span>
                  <p className="text-xl font-display font-extrabold text-slate-900 dark:text-white mt-1">{totalChefs}</p>
                </div>
                <div className="p-2 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30 rounded-lg">
                  <ShieldCheck size={19} className="text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Répartition (Homme / Femme)</span>
                  <p className="text-xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                    {totalHommes}<span className="text-slate-400 text-xs font-normal mx-2">/</span>{totalFemmes}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-rose-50 to-sky-50 dark:from-rose-950/30 dark:to-sky-950/30 rounded-lg">
                  <HeartHandshake size={19} className="text-rose-500" />
                </div>
              </div>
            </div>

            <div className="px-4 pb-4 flex justify-end">
              <button onClick={() => setShowStats(false)} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-sky-500 text-white flex justify-between items-center">
              <div>
                <h2 className="text-sm font-display font-bold">{editingId ? 'Modifier un membre' : 'Nouveau membre'}</h2>
                <p className="text-xs font-medium text-white/80 mt-1">Fiche de saisie des données</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nom de famille *</label>
                  <input type="text" required className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium capitalize transition-all" value={formData.nom_membre} onChange={e => setFormData({ ...formData, nom_membre: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Prénoms</label>
                  <input type="text" className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium capitalize transition-all" value={formData.prenom_membre} onChange={e => setFormData({ ...formData, prenom_membre: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Année de naissance</label>
                  <input type="number" className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all" value={formData.annee_naissance} onChange={e => setFormData({ ...formData, annee_naissance: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sexe</label>
                  <select className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all" value={formData.sexe} onChange={e => setFormData({ ...formData, sexe: e.target.value })}>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">N° Ménage *</label>
                  <input type="text" required className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-bold transition-all" value={formData.num_menage} onChange={e => setFormData({ ...formData, num_menage: e.target.value })} />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer w-full">
                    <input type="checkbox" className="w-4 h-4 accent-emerald-600 rounded-sm" checked={formData.chef} onChange={e => setFormData({ ...formData, chef: e.target.checked })} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Chef de ménage ?</span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:opacity-90 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-all shadow-sm hover:shadow-md">
                  <Save size={16} />
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