import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Edit2, X, Loader2, Save, Search, Users,
  Printer, FileText, Download, ShieldCheck, Eye
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

const ResponsablePage = () => {
  const [responsables, setResponsables] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showVoirPlusModal, setShowVoirPlusModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [formData, setFormData] = useState({ NumMembre: '', Poste: '', CodeRp: null, nom_complet: '', nomgs: '' });

  const API_URL = 'http://localhost:5000/api/responsables';
  const postesDisponibles = ['President', 'Tresorier', 'Secretaire', 'Conseiller', 'Membres'];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const results = responsables.filter(r =>
      `${r.nom_complet} ${r.nomgs} ${r.Poste}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(results);
  }, [searchTerm, responsables]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      const [resMem, resRespo, resGroup] = await Promise.all([
        axios.get('http://localhost:5000/api/membres', config).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/responsables', config).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/groupes', config).catch(() => ({ data: [] }))
      ]);

      const listMembres = Array.isArray(resMem.data) ? resMem.data : (resMem.data.data || []);
      const listRespos = Array.isArray(resRespo.data) ? resRespo.data : (resRespo.data.data || []);
      const listGroupes = Array.isArray(resGroup.data) ? resGroup.data : (resGroup.data.groupes || resGroup.data.data || []);

      const combinedData = listMembres.map(m => {
        const idMembre = m.nummembre || m.NumMembre || m.id;
        const matchingRespo = listRespos.find(r =>
          String(r.NumMembre || r.nummembre) === String(idMembre)
        );

        const idMenage = String(m.num_menage || m.nummenage || '').trim().toUpperCase();

        const matchingGroup = listGroupes.find(g => {
          const rawMenages = g.nummenage || g.num_menage || '';
          const groupMenages = rawMenages.split(',').map(item => item.trim().toUpperCase());
          return groupMenages.includes(idMenage);
        });

        return {
          ...m,
          nom_complet: `${m.nom_membre || ''} ${m.prenom_membre || ''}`.trim(),
          nomgs: matchingGroup ? (matchingGroup.nomgs || "Groupe sans nom") : 'Aucun groupe',
          Poste: matchingRespo ? matchingRespo.Poste : 'Membres',
          CodeRp: matchingRespo ? (matchingRespo.CodeRp || matchingRespo.coderp) : null,
          sexe: m.sexe || m.Sexe || 'M'
        };
      });

      setResponsables(combinedData);
      setFilteredData(combinedData);
    } catch (err) {
      console.error("Erreur lors de la fusion des données :", err);
      Toast.fire({ icon: 'error', title: 'Erreur lors du chargement des données' });
    } finally {
      setLoading(false);
    }
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
          img.src = url;
        });
      };

      const circularLogo = await getCircularImage(logo);
      doc.addImage(circularLogo, 'PNG', (pageWidth - 25) / 2, 10, 25, 25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text("Liste des responsables - ONG Tsinjo Aina", pageWidth / 2, 40, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date d'édition : ${today}`, pageWidth / 2, 46, { align: 'center' });

      const tableData = filteredData.map((r, i) => [i + 1, r.nom_complet, r.nomgs, r.Poste]);
      autoTable(doc, {
        head: [['N°', 'Nom & Prénom', 'Groupe (GS)', 'Poste / Fonction']],
        body: tableData,
        startY: 55,
      });

      doc.save("responsables_tsinjo_aina.pdf");
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export PDF réussi' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Impossible de générer le fichier PDF' });
    }
  };

  const exportExcel = () => {
    try {
      const dataExcel = filteredData.map(r => ({ Nom_Prenom: r.nom_complet, Groupe: r.nomgs, Poste: r.Poste }));
      const worksheet = XLSX.utils.json_to_sheet(dataExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Responsables");
      XLSX.writeFile(workbook, "responsables_tsinjo_aina.xlsx");
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export Excel réussi' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Impossible de générer le fichier Excel' });
    }
  };

  const exportBureauFemmesPDF = () => {
    try {
      const bureauPostes = ['President', 'Tresorier', 'Secretaire'];
      const dataBureauFemmes = responsables.filter(r =>
        bureauPostes.includes(r.Poste) &&
        (String(r.sexe).toUpperCase() === 'FEMME' || String(r.sexe).toUpperCase() === 'F')
      );

      const doc = new jsPDF();
      doc.text("Liste des femmes membres du bureau - ONG Tsinjo Aina", 14, 15);
      const tableData = dataBureauFemmes.map((r, i) => [i + 1, r.nom_complet, r.nomgs, r.Poste]);

      autoTable(doc, {
        head: [['N°', 'Nom & Prénom', 'Groupe', 'Poste']],
        body: tableData,
        startY: 25,
      });

      doc.save("femmes_bureau_tsinjo_aina.pdf");
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export PDF Femmes réussi' });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: 'Impossible de générer le fichier PDF' });
    }
  };

  const exportBureauFemmesExcel = () => {
    try {
      const bureauPostes = ['President', 'Tresorier', 'Secretaire'];
      const dataBureauFemmes = responsables
        .filter(r =>
          bureauPostes.includes(r.Poste) &&
          (String(r.sexe).toUpperCase() === 'FEMME' || String(r.sexe).toUpperCase() === 'F')
        )
        .map(r => ({ Nom_Prenom: r.nom_complet, Groupe: r.nomgs, Poste: r.Poste }));

      const worksheet = XLSX.utils.json_to_sheet(dataBureauFemmes);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Femmes Bureau");
      XLSX.writeFile(workbook, "femmes_bureau_tsinjo_aina.xlsx");
      setShowExportMenu(false);
      Toast.fire({ icon: 'success', title: 'Export Excel Femmes réussi' });
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
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;

      if (!user || (!user.id && !user.user_id)) {
        return Toast.fire({ icon: 'error', title: "Erreur d'authentification" });
      }

      const payload = {
        NumMembre: Number(formData.NumMembre),
        Poste: formData.Poste,
        user_id: user.id || user.user_id
      };

      await axios.post(API_URL, payload, { headers: { 'Authorization': `Bearer ${token}` } });
      setShowModal(false);
      fetchData();
      Toast.fire({ icon: 'success', title: 'Enregistrement réussi' });
    } catch (err) {
      console.error("Erreur serveur :", err.response?.data);
      Toast.fire({ icon: 'error', title: "Erreur lors de l'enregistrement" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 transition-colors font-sans overflow-hidden relative">
      <div className="p-4 px-6 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-900/50">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-700 dark:text-blue-500 tracking-tight">Gestion des responsables</h1>
            <p className="text-xs text-blue-600 font-medium">Attribution des postes du bureau</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="relative group flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Rechercher par nom, groupe ou poste..."
            className="w-full pl-10 pr-10 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500"><X size={14} /></button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md transition-all flex items-center gap-2 text-xs font-semibold"
            >
              <Printer size={15} />
              <span className="hidden sm:block">Exporter</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg z-50 text-slate-900 dark:text-white overflow-hidden">
                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">Export global</div>
                <button onClick={exportPDF} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium border-b dark:border-slate-800"><FileText size={15} className="text-blue-500" /> Document PDF</button>
                <button onClick={exportExcel} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium border-b dark:border-slate-800"><Download size={15} className="text-blue-600" /> Feuille Excel</button>
                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">Femmes du bureau</div>
                <button onClick={exportBureauFemmesPDF} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium border-b dark:border-slate-800"><ShieldCheck size={15} className="text-blue-600" /> Bureau femmes (PDF)</button>
                <button onClick={exportBureauFemmesExcel} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium"><Download size={15} className="text-blue-600" /> Bureau femmes (Excel)</button>
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
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full flex flex-col">
            <thead className="bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 w-full sticky top-0 z-10">
              <tr className="flex w-full">
                <th className="px-4 py-2.5 text-left w-16 flex-shrink-0">N°</th>
                <th className="px-4 py-2.5 text-left flex-1">Responsable / Membre</th>
                <th className="px-4 py-2.5 text-left flex-1">Groupe GS</th>
                <th className="px-4 py-2.5 text-center w-36 flex-shrink-0">Poste / Fonction</th>
                <th className="px-4 py-2.5 text-right w-24 flex-shrink-0">Actions</th>
              </tr>
            </thead>
            <tbody
              className="flex flex-col w-full overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80"
              style={{ maxHeight: '290px' }}
            >
              {loading ? (
                <tr className="w-full"><td className="p-8 text-center w-full"><Loader2 size={24} className="animate-spin inline text-blue-600" /></td></tr>
              ) : filteredData.map((r, index) => (
                <tr key={r.nummembre} className="flex w-full items-center h-[48px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 w-16 flex-shrink-0">{index + 1}</td>
                  <td className="px-4 py-2 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-md">
                        <Users size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate">{r.nom_complet}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 flex-1">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize truncate">{r.nomgs}</span>
                  </td>
                  <td className="px-4 py-2 text-center w-36 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.Poste === 'Membres'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                    }`}>
                      {r.Poste}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right w-24 flex-shrink-0">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setFormData({
                            NumMembre: r.nummembre,
                            Poste: r.Poste === 'Membres' ? '' : r.Poste,
                            CodeRp: r.CodeRp,
                            nom_complet: r.nom_complet,
                            nomgs: r.nomgs
                          });
                          setShowModal(true);
                        }}
                        title="Attribuer un poste"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredData.length === 0 && (
                <tr className="w-full"><td className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium text-xs w-full">Aucun responsable trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

{showVoirPlusModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
    <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-lg overflow-hidden">
      <div className="p-3.5 bg-blue-600 text-white flex justify-between items-center">
        <h2 className="text-xs font-bold">Statistiques Détaillées</h2>
        <button onClick={() => setShowVoirPlusModal(false)} className="text-white/80 hover:text-white"><X size={18} /></button>
      </div>

      <div className="p-5 space-y-4">
        {/* Bureau Stats (P/S/T) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">TOTAL BUREAU (P/S/T)</span>
            <p className="text-lg font-bold">{responsables.filter(r => ['President', 'Secretaire', 'Tresorier'].includes(r.Poste)).length}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200">
            <span className="text-[10px] font-bold text-blue-600 block">FEMMES AU BUREAU</span>
            <p className="text-lg font-bold">
              {responsables.filter(r => 
                ['President', 'Secretaire', 'Tresorier'].includes(r.Poste) && 
                String(r.sexe).trim() === 'Femme'
              ).length}
            </p>
          </div>
        </div>

        {/* < 26 ans dynamique */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Responsables &lt; 26 ans</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded border border-emerald-200">
              <span className="text-[10px] text-emerald-600 font-bold block">HOMMES &lt; 26</span>
              <p className="text-lg font-bold">
                {responsables.filter(r => {
                  const age = new Date().getFullYear() - Number(r.annee_naissance);
                  return r.Poste !== 'Membres' && age < 26 && String(r.sexe).trim() === 'Homme';
                }).length}
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200">
              <span className="text-[10px] text-amber-600 font-bold block">FEMMES &lt; 26</span>
              <p className="text-lg font-bold">
                {responsables.filter(r => {
                  const age = new Date().getFullYear() - Number(r.annee_naissance);
                  return r.Poste !== 'Membres' && age < 26 && String(r.sexe).trim() === 'Femme';
                }).length}
              </p>
            </div>
          </div>
        </div>

        <button onClick={() => setShowVoirPlusModal(false)} className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded mt-2">Fermer</button>
      </div>
    </div>
  </div>
)}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-lg animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-3.5 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xs font-bold">Attribuer un poste</h2>
                <p className="text-[11px] font-normal text-blue-100">Définir les fonctions au sein du bureau</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white p-1 rounded-md"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nom et Prénom</label>
                <input
                  type="text"
                  disabled
                  readOnly
                  className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none text-xs font-bold capitalize cursor-not-allowed"
                  value={formData.nom_complet}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Groupe Solidarité (GS)</label>
                <input
                  type="text"
                  disabled
                  readOnly
                  className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none text-xs font-bold capitalize cursor-not-allowed"
                  value={formData.nomgs}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sélectionner la fonction *</label>
                <select
                  required
                  className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs font-medium"
                  value={formData.Poste}
                  onChange={(e) => setFormData({...formData, Poste: e.target.value})}
                >
                  <option value="" disabled>Choisir un poste...</option>
                  {postesDisponibles.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
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

export default ResponsablePage;