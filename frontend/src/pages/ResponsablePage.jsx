import React,{useState,useEffect} from 'react';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import {Edit2,X,Loader2,Save,Search,Users,Printer,FileText,Download,ShieldCheck,Eye} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logo from '../assets/logo.png';

const Toast=Swal.mixin({
  toast:true,
  position:'top-end',
  showConfirmButton:false,
  timer:2500,
  timerProgressBar:true,
  didOpen:(toast)=>{
    toast.addEventListener('mouseenter',Swal.stopTimer);
    toast.addEventListener('mouseleave',Swal.resumeTimer);
  }
});

// Présentation uniquement : initiales affichées dans l'avatar de la liste
const getInitials=(nomComplet)=>{
  const parts=String(nomComplet||'').trim().split(/\s+/).filter(Boolean);
  if(parts.length===0)return 'M';
  return `${parts[0].charAt(0)}${parts[1]?parts[1].charAt(0):''}`.toUpperCase();
};

// Classes partagées pour garder des champs de formulaire cohérents (mêmes que les autres pages)
const fieldClass=
  'w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25';
const disabledFieldClass=
  'w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-sm text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed';
const labelClass='block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5';
const focusRing=
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900';

const ResponsablePage=()=>{
  const [responsables,setResponsables]=useState([]);
  const [filteredData,setFilteredData]=useState([]);
  const [searchTerm,setSearchTerm]=useState('');
  const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);
  const [showVoirPlusModal,setShowVoirPlusModal]=useState(false);
  const [showExportMenu,setShowExportMenu]=useState(false);
  const [formData,setFormData]=useState({NumMembre:'',Poste:'',CodeRp:null,nom_complet:'',nomgs:''});

  const postesDisponibles=['President','Tresorier','Secretaire','Conseiller','Membres'];

  useEffect(()=>{fetchData()},[]);

  useEffect(()=>{
    const results=responsables.filter(r=>`${r.nom_complet} ${r.nomgs} ${r.Poste}`.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredData(results);
  },[searchTerm,responsables]);

  const fetchData=async()=>{
    try{
      setLoading(true);
      const token=localStorage.getItem('token');
      const config={headers:{'Authorization':`Bearer ${token}`}};
      const [resMem,resRespo,resGroup]=await Promise.all([
        axios.get('/membres',config).catch(()=>({data:[]})),
        axios.get('/responsables',config).catch(()=>({data:[]})),
        axios.get('/groupes',config).catch(()=>({data:[]}))
      ]);
      const listMembres=Array.isArray(resMem.data)?resMem.data:(resMem.data.data||[]);
      const listRespos=Array.isArray(resRespo.data)?resRespo.data:(resRespo.data.data||[]);
      const listGroupes=Array.isArray(resGroup.data)?resGroup.data:(resGroup.data.groupes||resGroup.data.data||[]);
      const combinedData=listMembres.map(m=>{
        const idMembre=m.nummembre||m.NumMembre||m.id;
        const matchingRespo=listRespos.find(r=>String(r.NumMembre||r.nummembre)===String(idMembre));
        const idMenage=String(m.num_menage||m.nummenage||'').trim().toUpperCase();
        const matchingGroup=listGroupes.find(g=>{
          const rawMenages=g.nummenage||g.num_menage||'';
          const groupMenages=rawMenages.split(',').map(item=>item.trim().toUpperCase());
          return groupMenages.includes(idMenage);
        });
        return {
          ...m,
          nom_complet:`${m.nom_membre||''} ${m.prenom_membre||''}`.trim(),
          nomgs:matchingGroup?(matchingGroup.nomgs||'Groupe sans nom'):'Aucun groupe',
          Poste:matchingRespo?matchingRespo.Poste:'Membres',
          CodeRp:matchingRespo?(matchingRespo.CodeRp||matchingRespo.coderp):null,
          sexe:m.sexe||m.Sexe||'M'
        };
      });
      setResponsables(combinedData);
      setFilteredData(combinedData);
    }catch(err){
      console.error('Erreur lors de la fusion des données :',err);
      Toast.fire({icon:'error',title:'Erreur lors du chargement des données'});
    }finally{
      setLoading(false);
    }
  };

  const exportPDF=async()=>{
    try{
      const doc=new jsPDF();
      const pageWidth=doc.internal.pageSize.width;
      const today=new Date().toLocaleDateString('fr-FR');
      const getCircularImage=(url)=>new Promise(resolve=>{
        const img=new Image();
        img.onload=()=>{
          const canvas=document.createElement('canvas');
          const size=Math.min(img.width,img.height);
          canvas.width=size;
          canvas.height=size;
          const ctx=canvas.getContext('2d');
          ctx.beginPath();
          ctx.arc(size/2,size/2,size/2,0,Math.PI*2);
          ctx.clip();
          ctx.drawImage(img,(img.width-size)/2,(img.height-size)/2,size,size,0,0,size,size);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src=url;
      });
      const circularLogo=await getCircularImage(logo);
      doc.addImage(circularLogo,'PNG',(pageWidth-25)/2,10,25,25);
      doc.setFont('helvetica','bold');
      doc.setFontSize(16);
      doc.text('Liste des responsables - ONG Tsinjo Aina',pageWidth/2,40,{align:'center'});
      doc.setFontSize(10);
      doc.setFont('helvetica','normal');
      doc.text(`Date d'édition : ${today}`,pageWidth/2,46,{align:'center'});
      const tableData=filteredData.map((r,i)=>[i+1,r.nom_complet,r.nomgs,r.Poste]);
      autoTable(doc,{head:[['N°','Nom & Prénom','Groupe (GS)','Poste / Fonction']],body:tableData,startY:55});
      doc.save('responsables_tsinjo_aina.pdf');
      setShowExportMenu(false);
      Toast.fire({icon:'success',title:'Export PDF réussi'});
    }catch(error){
      console.error(error);
      Toast.fire({icon:'error',title:'Impossible de générer le fichier PDF'});
    }
  };

  const exportExcel=()=>{
    try{
      const dataExcel=filteredData.map(r=>({Nom_Prenom:r.nom_complet,Groupe:r.nomgs,Poste:r.Poste}));
      const worksheet=XLSX.utils.json_to_sheet(dataExcel);
      const workbook=XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook,worksheet,'Responsables');
      XLSX.writeFile(workbook,'responsables_tsinjo_aina.xlsx');
      setShowExportMenu(false);
      Toast.fire({icon:'success',title:'Export Excel réussi'});
    }catch(error){
      console.error(error);
      Toast.fire({icon:'error',title:'Impossible de générer le fichier Excel'});
    }
  };

  const exportBureauFemmesPDF=()=>{
    try{
      const bureauPostes=['President','Tresorier','Secretaire'];
      const dataBureauFemmes=responsables.filter(r=>bureauPostes.includes(r.Poste)&&(String(r.sexe).toUpperCase()==='FEMME'||String(r.sexe).toUpperCase()==='F'));
      const doc=new jsPDF();
      doc.text('Liste des femmes membres du bureau - ONG Tsinjo Aina',14,15);
      const tableData=dataBureauFemmes.map((r,i)=>[i+1,r.nom_complet,r.nomgs,r.Poste]);
      autoTable(doc,{head:[['N°','Nom & Prénom','Groupe','Poste']],body:tableData,startY:25});
      doc.save('femmes_bureau_tsinjo_aina.pdf');
      setShowExportMenu(false);
      Toast.fire({icon:'success',title:'Export PDF Femmes réussi'});
    }catch(error){
      console.error(error);
      Toast.fire({icon:'error',title:'Impossible de générer le fichier PDF'});
    }
  };

  const exportBureauFemmesExcel=()=>{
    try{
      const bureauPostes=['President','Tresorier','Secretaire'];
      const dataBureauFemmes=responsables.filter(r=>bureauPostes.includes(r.Poste)&&(String(r.sexe).toUpperCase()==='FEMME'||String(r.sexe).toUpperCase()==='F')).map(r=>({Nom_Prenom:r.nom_complet,Groupe:r.nomgs,Poste:r.Poste}));
      const worksheet=XLSX.utils.json_to_sheet(dataBureauFemmes);
      const workbook=XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook,worksheet,'Femmes Bureau');
      XLSX.writeFile(workbook,'femmes_bureau_tsinjo_aina.xlsx');
      setShowExportMenu(false);
      Toast.fire({icon:'success',title:'Export Excel Femmes réussi'});
    }catch(error){
      console.error(error);
      Toast.fire({icon:'error',title:'Impossible de générer le fichier Excel'});
    }
  };

  const handleSubmit=async(e)=>{
    e.preventDefault();
    try{
      setLoading(true);
      const token=localStorage.getItem('token');
      const userString=localStorage.getItem('user');
      const user=userString?JSON.parse(userString):null;
      if(!user||(!user.id&&!user.user_id)) return Toast.fire({icon:'error',title:"Erreur d'authentification"});
      const payload={NumMembre:Number(formData.NumMembre),Poste:formData.Poste,user_id:user.id||user.user_id};
      await axios.post('/responsables',payload,{headers:{'Authorization':`Bearer ${token}`}});
      setShowModal(false);
      fetchData();
      Toast.fire({icon:'success',title:'Enregistrement réussi'});
    }catch(err){
      console.error('Erreur serveur :',err.response?.data);
      Toast.fire({icon:'error',title:"Erreur lors de l'enregistrement"});
    }finally{
      setLoading(false);
    }
  };

  const totalBureau=responsables.filter(r=>['President','Tresorier','Secretaire'].includes(r.Poste)).length;
  const femmesBureau=responsables.filter(r=>['President','Tresorier','Secretaire'].includes(r.Poste)&&(String(r.sexe).toUpperCase()==='FEMME'||String(r.sexe).toUpperCase()==='F')).length;
  const hommesMoins26=responsables.filter(r=>Number(r.age)<26&&String(r.sexe).toUpperCase()!=='F'&&String(r.sexe).toUpperCase()!=='FEMME').length;
  const femmesMoins26=responsables.filter(r=>Number(r.age)<26&&(String(r.sexe).toUpperCase()==='F'||String(r.sexe).toUpperCase()==='FEMME')).length;

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
            <Users size={20} strokeWidth={2}/>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-display font-semibold text-slate-900 dark:text-white leading-tight">Gestion des responsables</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Attribution des postes du bureau</p>
          </div>
        </div>
      </header>

      {/* Barre d'outils */}
      <div className="px-4 md:px-6 pt-5 pb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={17}/>
          <input
            type="text"
            placeholder="Rechercher un responsable ou un groupe..."
            aria-label="Rechercher un responsable ou un groupe"
            className="w-full h-10 pl-10 pr-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25"
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
          />
          {searchTerm&&(
            <button
              onClick={()=>setSearchTerm('')}
              aria-label="Effacer la recherche"
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
            >
              <X size={15}/>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={()=>setShowVoirPlusModal(true)}
            className={`h-10 px-3.5 rounded-lg inline-flex items-center gap-2 text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0 ${focusRing}`}
          >
            <Eye size={16} className="text-slate-500 dark:text-slate-400"/>
            <span className="hidden sm:block">Voir plus</span>
          </button>

          <div className="relative shrink-0">
            <button
              onClick={()=>setShowExportMenu(!showExportMenu)}
              aria-haspopup="menu"
              aria-expanded={showExportMenu}
              className={`h-10 px-3.5 rounded-lg inline-flex items-center gap-2 text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
            >
              <Printer size={16} className="text-slate-500 dark:text-slate-400"/>
              <span className="hidden md:block">Exporter</span>
            </button>

            {showExportMenu&&(
              <div role="menu" className="absolute right-0 mt-2 w-56 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50 text-slate-900 dark:text-white">
                <button role="menuitem" onClick={exportPDF} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-left transition-colors">
                  <FileText size={16} className="text-rose-600 dark:text-rose-400"/>
                  Document PDF
                </button>
                <button role="menuitem" onClick={exportExcel} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-left transition-colors">
                  <Download size={16} className="text-emerald-700 dark:text-emerald-400"/>
                  Feuille Excel
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" role="separator"/>
                <button role="menuitem" onClick={exportBureauFemmesPDF} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-left transition-colors">
                  <FileText size={16} className="text-rose-600 dark:text-rose-400"/>
                  Femmes bureau PDF
                </button>
                <button role="menuitem" onClick={exportBureauFemmesExcel} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-left transition-colors">
                  <Download size={16} className="text-emerald-700 dark:text-emerald-400"/>
                  Femmes bureau Excel
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
            <table className="w-full border-collapse text-left min-w-[850px]">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-[13px] font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 w-16 font-semibold">N°</th>
                  <th className="px-5 py-3 min-w-[260px] font-semibold">Responsable / Membre</th>
                  <th className="px-5 py-3 min-w-[220px] font-semibold">Groupe GS</th>
                  <th className="px-5 py-3 min-w-[180px] font-semibold">Poste / Fonction</th>
                  <th className="px-5 py-3 text-center w-24 sticky right-0 bg-slate-50 dark:bg-slate-800 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading?(
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <Loader2 size={26} className="animate-spin inline text-emerald-600" aria-label="Chargement"/>
                    </td>
                  </tr>
                ):filteredData.map((r,i)=>(
                  <tr key={`${r.nummembre||r.NumMembre||r.id}-${i}`} className="h-[56px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-5 py-2.5 text-sm text-slate-500 dark:text-slate-400 tabular-nums w-16">{i+1}</td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-8 w-8 shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60" aria-hidden="true">
                          {getInitials(r.nom_complet)}
                        </span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{r.nom_complet||'Nom non renseigné'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      {r.nomgs&&r.nomgs!=='Aucun groupe'?(
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-md text-xs font-medium inline-flex">{r.nomgs}</span>
                      ):(
                        <span className="text-sm text-slate-400 dark:text-slate-500">Aucun groupe</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5">
                      {r.Poste==='Membres'?(
                        <span className="text-sm text-slate-500 dark:text-slate-400">{r.Poste}</span>
                      ):(
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium inline-flex bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900">{r.Poste}</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-center w-24 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors">
                      <button
                        onClick={()=>{setFormData({NumMembre:r.nummembre||r.NumMembre||r.id||'',Poste:r.Poste||'',CodeRp:r.CodeRp||null,nom_complet:r.nom_complet||'',nomgs:r.nomgs||''});setShowModal(true)}}
                        title="Modifier"
                        aria-label="Modifier le poste de ce membre"
                        className={`p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-700/60 transition-colors ${focusRing}`}
                      >
                        <Edit2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading&&filteredData.length===0&&(
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">Aucun responsable trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="shrink-0 px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[13px] text-slate-500 dark:text-slate-400 tabular-nums">
            {filteredData.length} membre{filteredData.length>1?'s':''} affiché{filteredData.length>1?'s':''}
          </div>
        </div>
      </div>

      {/* Fenêtre de vue d'ensemble */}
      {showVoirPlusModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="responsables-stats-title"
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl animate-in zoom-in-95 duration-150 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4">
              <div>
                <h2 id="responsables-stats-title" className="text-base font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye size={18} className="text-emerald-700 dark:text-emerald-400"/>
                  Vue d'ensemble des responsables
                </h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Résumé global du bureau</p>
              </div>
              <button
                onClick={()=>setShowVoirPlusModal(false)}
                aria-label="Fermer"
                className={`text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 -mr-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
              >
                <X size={18}/>
              </button>
            </div>

            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="h-8 w-8 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck size={17}/>
                </div>
                <p className="text-2xl font-display font-semibold text-slate-900 dark:text-white tabular-nums mt-3">{totalBureau}</p>
                <span className="text-[13px] text-slate-500 dark:text-slate-400">Total Bureau</span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="h-8 w-8 rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Users size={17}/>
                </div>
                <p className="text-2xl font-display font-semibold text-slate-900 dark:text-white tabular-nums mt-3">{femmesBureau}</p>
                <span className="text-[13px] text-slate-500 dark:text-slate-400">Femmes au bureau</span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="h-8 w-8 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 flex items-center justify-center">
                  <Users size={17}/>
                </div>
                <p className="text-2xl font-display font-semibold text-slate-900 dark:text-white tabular-nums mt-3">{hommesMoins26}</p>
                <span className="text-[13px] text-slate-500 dark:text-slate-400">Hommes &lt; 26 ans</span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="h-8 w-8 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <Users size={17}/>
                </div>
                <p className="text-2xl font-display font-semibold text-slate-900 dark:text-white tabular-nums mt-3">{femmesMoins26}</p>
                <span className="text-[13px] text-slate-500 dark:text-slate-400">Femmes &lt; 26 ans</span>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={()=>setShowVoirPlusModal(false)}
                className={`h-9 px-4 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors ${focusRing}`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fenêtre de modification du poste */}
      {showModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="responsable-title"
            className="w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl animate-in zoom-in-95 duration-150"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4">
              <div>
                <h2 id="responsable-title" className="text-base font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit2 size={17} className="text-emerald-700 dark:text-emerald-400"/>
                  Modifier le responsable
                </h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Attribution du poste</p>
              </div>
              <button
                onClick={()=>setShowModal(false)}
                aria-label="Fermer"
                className={`text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 -mr-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
              >
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4">
                <div>
                  <label htmlFor="resp-membre" className={labelClass}>Membre</label>
                  <input id="resp-membre" type="text" value={formData.nom_complet} disabled className={disabledFieldClass}/>
                </div>

                <div>
                  <label htmlFor="resp-groupe" className={labelClass}>Groupe GS</label>
                  <input id="resp-groupe" type="text" value={formData.nomgs} disabled className={disabledFieldClass}/>
                </div>

                <div>
                  <label htmlFor="resp-poste" className={labelClass}>Poste / Fonction</label>
                  <select id="resp-poste" value={formData.Poste} onChange={e=>setFormData({...formData,Poste:e.target.value})} className={fieldClass}>
                    {postesDisponibles.map(poste=><option key={poste} value={poste}>{poste}</option>)}
                  </select>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                <button
                  type="button"
                  onClick={()=>setShowModal(false)}
                  className={`h-10 px-5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors ${focusRing}`}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`h-10 px-5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`}
                >
                  {loading?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>}
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