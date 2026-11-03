import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { getGroupes } from '../services/groupeService';
import Swal from 'sweetalert2';
import { Trash2, Edit2, X, Loader2, Save, Network, ShieldCheck, Search, FileText, Download, BarChart3, Printer, Calendar, Plus, Eye, MapPin } from 'lucide-react';
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

// Classes partagées pour garder des champs de formulaire cohérents (mêmes que MembresList / GroupePage)
const fieldClass =
  'w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25';
const labelClass = 'block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5';
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900';

// Badge Oui / Non
const yesBadge = 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900';
const noBadge = 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700';

const ReseauPage = () => {
  const [reseaux, setReseaux] = useState([]);
  const [filteredReseaux, setFilteredReseaux] = useState([]);
  const [groupes, setGroupes] = useState([]);
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
    Autonomie: 'Non'
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchReseaux();
    fetchGroupes();
  }, []);

  useEffect(() => {
    const results = reseaux.filter(r => `${r.NomRS || ''} ${r.NomGS || ''}`.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredReseaux(results);
  }, [searchTerm, reseaux]);

  useEffect(() => {
    const autonomie = formData.Activite === 'Oui' && formData.Plaidoyer === 'Oui' && formData.Plan === 'Oui' ? 'Oui' : 'Non';
    if (formData.Autonomie !== autonomie) {
      setFormData(prev => ({ ...prev, Autonomie: autonomie }));
    }
  }, [formData.Activite, formData.Plaidoyer, formData.Plan]);

  const fetchReseaux = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/reseaux', config);
      setReseaux(res.data);
      setFilteredReseaux(res.data);
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Connexion au serveur impossible' });
    } finally {
      setLoading(false);
    }
  };

  // Récupère les groupes solidaires pour retrouver la commune de chaque groupe membre
  const fetchGroupes = async () => {
    try {
      const res = await getGroupes();
      setGroupes(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  // nom du groupe (minuscule, sans espaces autour) -> commune
  const communeParGroupe = new Map(
    groupes.map(g => [String(g.nomgs || '').trim().toLowerCase(), String(g.commune || '').trim()])
  );

  // Communes distinctes des groupes membres d'un réseau
  const getCommunes = (r) => {
    const vues = new Set();
    const communes = [];
    (r.NomGS || '')
      .split(',')
      .map(g => g.trim().toLowerCase())
      .filter(Boolean)
      .forEach(g => {
        const commune = communeParGroupe.get(g);
        if (commune && !vues.has(commune.toLowerCase())) {
          vues.add(commune.toLowerCase());
          communes.push(commune);
        }
      });
    return communes;
  };

  const exportPDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const today = new Date().toLocaleDateString('fr-FR');

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
          img.onerror = () => resolve(null);
          img.src = url;
        });
      };

      const circularLogo = await getCircularImage(logo);

      if (circularLogo) {
        doc.addImage(circularLogo, 'PNG', (pageWidth - 25) / 2, 10, 25, 25);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text("Liste des réseaux - ONG Tsinjo Aina", pageWidth / 2, 40, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date d'édition : ${today}`, pageWidth / 2, 47, { align: 'center' });

      const tableData = filteredReseaux.map((r, i) => [
        i + 1,
        r.NomRS || '-',
        r.DateCreation ? new Date(r.DateCreation).toLocaleDateString('fr-FR') : '-',
        r.NomGS || '-',
        getCommunes(r).join(', ') || '-',
        r.Activite || 'Non',
        r.Plaidoyer || 'Non',
        r.Plan || 'Non',
        r.Autonomie === 'Oui' ? 'Autonome' : 'En cours'
      ]);

      autoTable(doc, {
        head: [['N°', 'Nom Réseau', 'Date création', 'Groupes', 'Localisation', 'Activité', 'Plaidoyer', 'Plan', 'Autonomie']],
        body: tableData,
        startY: 55,
        styles: { fontSize: 8 },
        headStyles: { fontStyle: 'bold' }
      });

      doc.save('reseaux_tsinjo_aina.pdf');
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export PDF réussi' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Impossible de générer le fichier PDF' });
    }
  };

  const exportExcel = () => {
    try {
      const data = filteredReseaux.map((r, i) => ({
        'N°': i + 1,
        'Nom Réseau': r.NomRS || '',
        'Date création': r.DateCreation ? new Date(r.DateCreation).toLocaleDateString('fr-FR') : '',
        'Groupes': r.NomGS || '',
        'Localisation': getCommunes(r).join(', '),
        'Activité': r.Activite || 'Non',
        'Plaidoyer': r.Plaidoyer || 'Non',
        'Plan': r.Plan || 'Non',
        'Autonomie': r.Autonomie === 'Oui' ? 'Autonome' : 'En cours'
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Réseaux');
      XLSX.writeFile(workbook, 'reseaux_tsinjo_aina.xlsx');

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
        await axios.put(`/reseaux/${editingId}`, formData, config);
      } else {
        await axios.post('/reseaux', formData, config);
      }

      setShowModal(false);
      resetForm();
      await fetchReseaux();

      Toast.fire({
        icon: 'success',
        title: editingId ? 'Mise à jour réussie' : 'Enregistrement réussi'
      });
    } catch (error) {
      console.error(error);
      Toast.fire({
        icon: 'error',
        title: error.response?.data?.message || "Erreur lors de l'enregistrement"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      title: 'Supprimer ce réseau ?',
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
          const token = localStorage.getItem('token');

          await axios.delete(`/reseaux/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          await fetchReseaux();
          Toast.fire({ icon: 'success', title: 'Suppression réussie' });
        } catch (error) {
          console.error(error);
          Toast.fire({ icon: 'error', title: 'Impossible de supprimer le réseau' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const openEditModal = (r) => {
    setEditingId(r.codeRS);
    setFormData({
      ...initialForm,
      ...r,
      DateCreation: r.DateCreation ? new Date(r.DateCreation).toISOString().split('T')[0] : initialForm.DateCreation
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      NomRS: '',
      NomGS: '',
      DateCreation: new Date().toISOString().split('T')[0],
      Activite: 'Non',
      Plaidoyer: 'Non',
      Plan: 'Non',
      Autonomie: 'Non'
    });
  };

  const totalGroupes = [...new Set(
    filteredReseaux
      .flatMap(r => (r.NomGS || '').split(','))
      .map(g => g.trim())
      .filter(Boolean)
  )].length;

  const reseauxAutonomes = filteredReseaux.filter(r => r.Autonomie === 'Oui').length;
  const reseauxEnCours = filteredReseaux.filter(r => r.Autonomie !== 'Oui').length;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors font-body text-slate-900 dark:text-slate-100 overflow-hidden relative antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body { font-family: 'Public Sans', system-ui, -apple-system, 'Segoe UI', sans-serif; }
        .font-display { font-family: 'Public Sans', system-ui, -apple-system, 'Segoe UI', sans-serif; letter-spacing: -0.01em; }
        @media (prefers-reduced-motion: reduce) { .animate-in { animation: none !important; } }
      `}</style>

      {/* En-tête de page */}
      <header className="px-4 md:px-6 py-4 md:py-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60">
            <Network size={20} strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <h1 className="text-lg font-display font-semibold text-slate-900 dark:text-white leading-tight">Réseaux communautaires</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Gestion, structuration et suivi des réseaux communautaires.</p>
          </div>
        </div>
      </header>

      {/* Barre d'outils */}
      <div className="px-4 md:px-6 pt-5 pb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={17} />

          <input
            type="text"
            placeholder="Rechercher un réseau ou un groupe..."
            aria-label="Rechercher un réseau ou un groupe"
            className="w-full h-10 pl-10 pr-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className={`h-10 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center gap-2 text-sm font-medium shadow-sm transition-colors shrink-0 ${focusRing}`}
          >
            <Plus size={16} />
            <span className="hidden sm:block">Ajouter</span>
          </button>

          <button
            onClick={() => setShowVoirPlusModal(true)}
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
                  <th className="px-5 py-3 min-w-[220px] font-semibold">Réseau</th>
                  <th className="px-5 py-3 min-w-[240px] font-semibold">Groupes membres</th>
                  <th className="px-5 py-3 min-w-[180px] font-semibold">Localisation</th>
                  <th className="px-5 py-3 text-center min-w-[100px] font-semibold">Activité</th>
                  <th className="px-5 py-3 text-center min-w-[100px] font-semibold">Plaidoyer</th>
                  <th className="px-5 py-3 text-center min-w-[100px] font-semibold">Plan</th>
                  <th className="px-5 py-3 text-center min-w-[130px] font-semibold">Autonomie</th>
                  <th className="px-5 py-3 text-right w-24 sticky right-0 bg-slate-50 dark:bg-slate-800 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center">
                      <Loader2 size={26} className="animate-spin inline text-emerald-600" aria-label="Chargement" />
                    </td>
                  </tr>
                ) : filteredReseaux.map((r, index) => {
                  const communes = getCommunes(r);

                  return (
                    <tr
                      key={r.codeRS}
                      className="h-[64px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="px-5 py-3 text-sm text-slate-500 dark:text-slate-400 tabular-nums w-16">
                        {index + 1}
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="h-9 w-9 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60" aria-hidden="true">
                            <Network size={16} />
                          </span>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize truncate">
                              {r.NomRS}
                            </p>

                            {r.DateCreation && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 tabular-nums">
                                <Calendar size={11} />
                                {new Date(r.DateCreation).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {(r.NomGS || '').split(',').filter(Boolean).map((g, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-md text-xs font-medium capitalize"
                            >
                              {g.trim()}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        {communes.length > 0 ? (
                          <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <MapPin size={16} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                            <span className="capitalize">{communes.join(', ')}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${r.Activite === 'Oui' ? yesBadge : noBadge}`}>
                          {r.Activite || 'Non'}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${r.Plaidoyer === 'Oui' ? yesBadge : noBadge}`}>
                          {r.Plaidoyer || 'Non'}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${r.Plan === 'Oui' ? yesBadge : noBadge}`}>
                          {r.Plan || 'Non'}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1.5 ring-1 ring-inset ${r.Autonomie === 'Oui' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900' : 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900'}`}>
                          <ShieldCheck size={13} />
                          {r.Autonomie === 'Oui' ? 'Autonome' : 'En cours'}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-right w-24 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEditModal(r)}
                            title="Modifier"
                            aria-label="Modifier ce réseau"
                            className={`p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-700/60 transition-colors ${focusRing}`}
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            onClick={() => handleDelete(r.codeRS)}
                            title="Supprimer"
                            aria-label="Supprimer ce réseau"
                            className={`p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-slate-700/60 transition-colors ${focusRing}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && filteredReseaux.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                      Aucun réseau trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fenêtre de vue d'ensemble */}
      {showVoirPlusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reseaux-stats-title"
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl animate-in zoom-in-95 duration-150 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4">
              <div>
                <h2 id="reseaux-stats-title" className="text-base font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye size={18} className="text-emerald-700 dark:text-emerald-400" />
                  Vue d'ensemble des réseaux
                </h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Résumé global des réseaux communautaires</p>
              </div>

              <button
                onClick={() => setShowVoirPlusModal(false)}
                aria-label="Fermer"
                className={`text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 -mr-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="h-8 w-8 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 flex items-center justify-center">
                  <Network size={17} />
                </div>
                <p className="text-2xl font-display font-semibold text-slate-900 dark:text-white tabular-nums mt-3">{filteredReseaux.length}</p>
                <span className="text-[13px] text-slate-500 dark:text-slate-400">Total réseaux</span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="h-8 w-8 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <MapPin size={17} />
                </div>
                <p className="text-2xl font-display font-semibold text-slate-900 dark:text-white tabular-nums mt-3">{totalGroupes}</p>
                <span className="text-[13px] text-slate-500 dark:text-slate-400">Groupes membres</span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="h-8 w-8 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck size={17} />
                </div>
                <p className="text-2xl font-display font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums mt-3">{reseauxAutonomes}</p>
                <span className="text-[13px] text-slate-500 dark:text-slate-400">Réseaux autonomes</span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="h-8 w-8 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <BarChart3 size={17} />
                </div>
                <p className="text-2xl font-display font-semibold text-amber-700 dark:text-amber-400 tabular-nums mt-3">{reseauxEnCours}</p>
                <span className="text-[13px] text-slate-500 dark:text-slate-400">En structuration</span>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowVoirPlusModal(false)}
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
            aria-labelledby="reseau-title"
            className="w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl animate-in zoom-in-95 duration-150"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4">
              <div>
                <h2 id="reseau-title" className="text-base font-display font-semibold text-slate-900 dark:text-white">
                  {editingId ? 'Modifier un réseau' : 'Nouveau réseau'}
                </h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Fiche de saisie des données</p>
              </div>

              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                aria-label="Fermer"
                className={`text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 -mr-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                  <div>
                    <label htmlFor="r-nom" className={labelClass}>Nom du réseau *</label>
                    <input
                      id="r-nom"
                      type="text"
                      required
                      className={`${fieldClass} capitalize`}
                      value={formData.NomRS}
                      onChange={(e) => setFormData({ ...formData, NomRS: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="r-date" className={labelClass}>Date de création *</label>
                    <input
                      id="r-date"
                      type="date"
                      required
                      className={fieldClass}
                      value={formData.DateCreation}
                      onChange={(e) => setFormData({ ...formData, DateCreation: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="r-groupes" className={labelClass}>Groupes membres</label>
                  <input
                    id="r-groupes"
                    type="text"
                    placeholder="Nom du groupe"
                    className={`${fieldClass} font-medium`}
                    value={formData.NomGS}
                    onChange={(e) => setFormData({ ...formData, NomGS: e.target.value })}
                  />
                </div>

                {editingId && (
                  <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-slate-800">
                    {[
                      ['Activite', 'Activités'],
                      ['Plaidoyer', 'Plaidoyers'],
                      ['Plan', 'Plan de développement']
                    ].map(([key, label]) => (
                      <div
                        key={key}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>

                        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg self-start sm:self-auto" role="group" aria-label={label}>
                          {['Oui', 'Non'].map(opt => (
                            <button
                              key={opt}
                              type="button"
                              aria-pressed={formData[key] === opt}
                              onClick={() => setFormData({ ...formData, [key]: opt })}
                              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${focusRing} ${formData[key] === opt ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="px-3.5 py-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg flex justify-between items-center gap-3 border border-emerald-200 dark:border-emerald-900">
                      <div>
                        <span className="text-sm font-medium text-emerald-900 dark:text-emerald-300 block">
                          Statut d'autonomie
                        </span>
                        <span className="text-xs text-emerald-700 dark:text-emerald-400">
                          Calculé automatiquement selon les critères
                        </span>
                      </div>

                      <span className={`px-3 py-1 rounded-md text-sm font-medium shrink-0 ${formData.Autonomie === 'Oui' ? 'bg-emerald-700 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
                        {formData.Autonomie === 'Oui' ? 'Autonome' : 'En cours'}
                      </span>
                    </div>
                  </div>
                )}
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

export default ReseauPage;