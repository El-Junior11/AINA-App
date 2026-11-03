import React, { useState, useEffect } from 'react';
import axios from '../api/axios'
import Swal from 'sweetalert2';
import { Trash2, Edit2, UserPlus, X, Loader2, Save,Eye, CheckCircle2, Search, FileText, Download, BarChart3, Printer, Users, ShieldCheck, HeartHandshake } from 'lucide-react';
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

// Présentation uniquement : initiales affichées dans l'avatar de la liste
const getInitials = m =>
  `${(m.nom_membre || '').trim().charAt(0)}${(m.prenom_membre || '').trim().charAt(0)}`.toUpperCase() || '?';

// Classes partagées pour garder des champs de formulaire cohérents
const fieldClass =
  'w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25';
const labelClass = 'block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5';
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900';

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
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/membres', config);
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
        await axios.put(`/membres/${editingId}`, payload, config);
      } else {
        await axios.post('/membres', payload, config);
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
          await axios.delete(`/membres/${id}`, { headers: { Authorization: `Bearer ${token}` } });
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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors font-body text-slate-900 dark:text-slate-100 overflow-hidden relative antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
        .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
        @media (prefers-reduced-motion: reduce){.animate-in{animation:none!important}}
      `}</style>

      {/* En-tête de page */}
      <header className="px-4 md:px-6 py-4 md:py-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60">
            <Users size={20} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-display font-semibold text-slate-900 dark:text-white leading-tight">Gestion des membres</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Base de données sécurisée et gestion centralisée des membres.</p>
          </div>
        </div>
      </header>

      {/* Barre d'outils */}
      <div className="px-4 md:px-6 pt-5 pb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={17} />
          <input
            type="text"
            placeholder="Rechercher un membre..."
            aria-label="Rechercher un membre"
            className="w-full h-10 pl-10 pr-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              aria-label="Effacer la recherche"
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className={`h-10 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center gap-2 text-sm font-medium shadow-sm transition-colors shrink-0 ${focusRing}`}
          >
            <UserPlus size={16} />
            <span className="hidden sm:block">Ajouter</span>
          </button>

          <button
            onClick={() => setShowStats(true)}
            className={`h-10 px-3.5 rounded-lg inline-flex items-center gap-2 text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0 ${focusRing}`}
          >
            <Eye size={16} className="text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:block">Voir plus</span>
          </button>

          <div className="relative shrink-0">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              aria-haspopup="menu"
              aria-expanded={showExportMenu}
              className={`h-10 px-3.5 rounded-lg inline-flex items-center gap-2 text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
            >
              <Printer size={16} className="text-slate-500 dark:text-slate-400" />
              <span className="hidden md:block">Exporter</span>
            </button>

            {showExportMenu && (
              <div role="menu" className="absolute right-0 mt-2 w-52 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50 text-slate-900 dark:text-white">
                <button
                  role="menuitem"
                  onClick={exportPDF}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-left transition-colors"
                >
                  <FileText size={16} className="text-rose-600 dark:text-rose-400" />
                  Document PDF
                </button>
                <button
                  role="menuitem"
                  onClick={exportExcel}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-left transition-colors"
                >
                  <Download size={16} className="text-emerald-700 dark:text-emerald-400" />
                  Feuille Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="flex-1 overflow-hidden px-4 md:px-6 pb-5">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm h-full flex flex-col">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-[13px] font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 w-16 font-semibold">N°</th>
                  <th className="px-5 py-3 min-w-[220px] font-semibold">Membre</th>
                  <th className="px-5 py-3 text-center min-w-[100px] font-semibold">Année</th>
                  <th className="px-5 py-3 text-center min-w-[110px] font-semibold">Genre</th>
                  <th className="px-5 py-3 text-center min-w-[110px] font-semibold">Statut</th>
                  <th className="px-5 py-3 min-w-[110px] font-semibold">Ménage</th>
                  <th className="px-5 py-3 text-right w-24 sticky right-0 bg-slate-50 dark:bg-slate-800 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <Loader2 size={26} className="animate-spin inline text-emerald-600" aria-label="Chargement" />
                    </td>
                  </tr>
                ) : filteredMembres.map((m, index) => (
                  <tr key={m.nummembre} className="h-[56px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-5 py-2.5 text-sm text-slate-500 dark:text-slate-400 tabular-nums w-16">{index + 1}</td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-8 w-8 shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60" aria-hidden="true">
                          {getInitials(m)}
                        </span>
                        <div className="flex items-center gap-1.5 text-sm min-w-0">
                          <span className="font-semibold text-slate-900 dark:text-white capitalize truncate">{m.nom_membre}</span>
                          <span className="text-slate-600 dark:text-slate-300 capitalize truncate">{m.prenom_membre}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-center text-sm text-slate-700 dark:text-slate-200 tabular-nums">{m.annee_naissance || '----'}</td>
                    <td className="px-5 py-2.5 text-center">
                      <span className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <span className={`h-2 w-2 rounded-full ${m.sexe === 'Homme' ? 'bg-sky-500' : 'bg-rose-400'}`} aria-hidden="true" />
                        {m.sexe === 'Homme' ? 'Homme' : 'Femme'}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-center">
                      {m.chef ? (
                        <span className="text-xs font-medium text-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-900">
                          <CheckCircle2 size={13} />
                          Chef
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500 dark:text-slate-400">Membre</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100 tabular-nums bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{m.num_menage}</span>
                    </td>
                    <td className="px-5 py-2.5 text-right w-24 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEditModal(m)}
                          title="Modifier"
                          aria-label="Modifier ce membre"
                          className={`p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-700/60 transition-colors ${focusRing}`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.nummembre)}
                          title="Supprimer"
                          aria-label="Supprimer ce membre"
                          className={`p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-slate-700/60 transition-colors ${focusRing}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filteredMembres.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">Aucune donnée trouvée</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fenêtre de statistiques */}
      {showStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="stats-title"
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl animate-in zoom-in-95 duration-150 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4">
              <div>
                <h2 id="stats-title" className="text-base font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 size={18} className="text-emerald-700 dark:text-emerald-400" />
                  Aperçu des statistiques
                </h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Résumé global de la base de données</p>
              </div>
              <button
                onClick={() => setShowStats(false)}
                aria-label="Fermer"
                className={`text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 -mr-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-2 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="py-4 flex items-center gap-3.5">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 flex items-center justify-center">
                  <Users size={19} />
                </div>
                <span className="flex-1 text-sm text-slate-600 dark:text-slate-300">Total population</span>
                <p className="text-2xl font-display font-semibold text-slate-900 dark:text-white tabular-nums">{filteredMembres.length}</p>
              </div>

              <div className="py-4 flex items-center gap-3.5">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck size={19} />
                </div>
                <span className="flex-1 text-sm text-slate-600 dark:text-slate-300">Chefs de ménage</span>
                <p className="text-2xl font-display font-semibold text-slate-900 dark:text-white tabular-nums">{totalChefs}</p>
              </div>

              <div className="py-4 flex items-center gap-3.5">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <HeartHandshake size={19} />
                </div>
                <span className="flex-1 text-sm text-slate-600 dark:text-slate-300">Répartition (Homme / Femme)</span>
                <p className="text-2xl font-display font-semibold text-slate-900 dark:text-white tabular-nums">
                  {totalHommes}<span className="text-slate-300 dark:text-slate-600 text-lg font-normal mx-1.5">/</span>{totalFemmes}
                </p>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowStats(false)}
                className={`h-9 px-4 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors ${focusRing}`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fenêtre d'ajout / modification */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="membre-title"
            className="w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl animate-in zoom-in-95 duration-150"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4">
              <div>
                <h2 id="membre-title" className="text-base font-display font-semibold text-slate-900 dark:text-white">{editingId ? 'Modifier un membre' : 'Nouveau membre'}</h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Fiche de saisie des données</p>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                aria-label="Fermer"
                className={`text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 -mr-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <label htmlFor="f-nom" className={labelClass}>Nom de famille *</label>
                  <input id="f-nom" type="text" required className={`${fieldClass} capitalize`} value={formData.nom_membre} onChange={e => setFormData({ ...formData, nom_membre: e.target.value })} />
                </div>

                <div>
                  <label htmlFor="f-prenom" className={labelClass}>Prénoms</label>
                  <input id="f-prenom" type="text" className={`${fieldClass} capitalize`} value={formData.prenom_membre} onChange={e => setFormData({ ...formData, prenom_membre: e.target.value })} />
                </div>

                <div>
                  <label htmlFor="f-annee" className={labelClass}>Année de naissance</label>
                  <input id="f-annee" type="number" className={`${fieldClass} tabular-nums`} value={formData.annee_naissance} onChange={e => setFormData({ ...formData, annee_naissance: e.target.value })} />
                </div>

                <div>
                  <label htmlFor="f-sexe" className={labelClass}>Sexe</label>
                  <select id="f-sexe" className={fieldClass} value={formData.sexe} onChange={e => setFormData({ ...formData, sexe: e.target.value })}>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="f-menage" className={labelClass}>N° Ménage *</label>
                  <input id="f-menage" type="text" required className={`${fieldClass} font-medium tabular-nums`} value={formData.num_menage} onChange={e => setFormData({ ...formData, num_menage: e.target.value })} />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-3 h-10 px-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg cursor-pointer w-full hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
                    <input type="checkbox" className="w-4 h-4 accent-emerald-700 rounded" checked={formData.chef} onChange={e => setFormData({ ...formData, chef: e.target.checked })} />
                    <span className="text-sm text-slate-800 dark:text-slate-200">Chef de ménage ?</span>
                  </label>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className={`w-full sm:w-auto h-10 px-5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-colors ${focusRing}`}
                >
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