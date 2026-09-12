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
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 transition-colors font-body overflow-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
        .font-body{font-family:'DM Sans',sans-serif}
        .font-display{font-family:'Manrope',sans-serif}
      `}</style>

      <div className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-sky-500 text-white rounded-2xl shrink-0 shadow-sm">
            <Users size={24}/>
          </div>
          <div>
            <h1 className="text-lg font-display font-extrabold text-slate-900 dark:text-white tracking-tight">Gestion des responsables</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Attribution des postes du bureau</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="relative group flex-1 min-w-[240px] max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18}/>
          <input type="text" placeholder="Rechercher un responsable ou un groupe..." className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium transition-all" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
          {searchTerm&&<button onClick={()=>setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"><X size={17}/></button>}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={()=>setShowVoirPlusModal(true)} className="flex items-center gap-2 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-950/50 px-3 py-2.5 rounded-xl transition-all font-bold text-xs border border-sky-100 dark:border-sky-900/40 shrink-0">
            <Eye size={16}/>
            <span className="hidden sm:block">Voir plus</span>
          </button>

          <div className="relative shrink-0">
            <button onClick={()=>setShowExportMenu(!showExportMenu)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-bold shadow-sm hover:shadow-md">
              <Printer size={16}/>
              <span className="hidden md:block">Exporter</span>
            </button>

            {showExportMenu&&<div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 text-slate-900 dark:text-white overflow-hidden">
              <button onClick={exportPDF} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium border-b border-slate-100 dark:border-slate-800 transition-colors">
                <FileText size={17} className="text-rose-500"/>
                Document PDF
              </button>
              <button onClick={exportExcel} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium border-b border-slate-100 dark:border-slate-800 transition-colors">
                <Download size={17} className="text-emerald-600"/>
                Feuille Excel
              </button>
              <button onClick={exportBureauFemmesPDF} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium border-b border-slate-100 dark:border-slate-800 transition-colors">
                <FileText size={17} className="text-pink-500"/>
                Femmes bureau PDF
              </button>
              <button onClick={exportBureauFemmesExcel} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors">
                <Download size={17} className="text-pink-500"/>
                Femmes bureau Excel
              </button>
            </div>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 md:px-6 pb-6">
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm h-full flex flex-col">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full border-collapse text-left min-w-[850px]">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/90 text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4 w-16">N°</th>
                  <th className="px-5 py-4 min-w-[260px]">Responsable / Membre</th>
                  <th className="px-5 py-4 min-w-[220px]">Groupe GS</th>
                  <th className="px-5 py-4 min-w-[180px]">Poste / Fonction</th>
                  <th className="px-5 py-4 text-center w-24">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading?<tr><td colSpan={5} className="p-12 text-center"><Loader2 size={28} className="animate-spin inline text-emerald-500"/></td></tr>:filteredData.map((r,i)=>(
                  <tr key={`${r.nummembre||r.NumMembre||r.id}-${i}`} className="h-[64px] hover:bg-emerald-50/40 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-5 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 w-16">{i+1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-sky-500 text-white rounded-xl flex items-center justify-center text-sm font-bold shrink-0">{r.nom_complet?.charAt(0)?.toUpperCase()||'M'}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.nom_complet||'Nom non renseigné'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">N° {r.nummembre||r.NumMembre||r.id||'-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-1 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 rounded-lg text-xs font-bold inline-flex">{r.nomgs||'Aucun groupe'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex ${r.Poste==='Membres'?'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300':'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>{r.Poste}</span>
                    </td>
                    <td className="px-5 py-3 text-center w-24">
                      <button onClick={()=>{setFormData({NumMembre:r.nummembre||r.NumMembre||r.id||'',Poste:r.Poste||'',CodeRp:r.CodeRp||null,nom_complet:r.nom_complet||'',nomgs:r.nomgs||''});setShowModal(true)}} title="Modifier" className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <Edit2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading&&filteredData.length===0&&<tr><td colSpan={5} className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium text-sm">Aucun responsable trouvé</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="shrink-0 px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {filteredData.length} membre{filteredData.length>1?'s':''} affiché{filteredData.length>1?'s':''}
          </div>
        </div>
      </div>

      {showVoirPlusModal&&<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-emerald-500 to-sky-500 text-white flex justify-between items-center">
            <div>
              <h2 className="text-base font-display font-bold flex items-center gap-2"><Eye size={19}/>Vue d'ensemble des responsables</h2>
              <p className="text-sm font-medium text-white/80 mt-1">Résumé global du bureau</p>
            </div>
            <button onClick={()=>setShowVoirPlusModal(false)} className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"><X size={20}/></button>
          </div>

          <div className="p-5 grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total Bureau</span>
                <p className="text-xl font-display font-extrabold text-slate-900 dark:text-white mt-1">{totalBureau}</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30 rounded-lg"><ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400"/></div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Femmes au bureau</span>
                <p className="text-xl font-display font-extrabold text-pink-600 dark:text-pink-400 mt-1">{femmesBureau}</p>
              </div>
              <div className="p-2 bg-pink-50 dark:bg-pink-950/30 rounded-lg"><Users size={18} className="text-pink-600 dark:text-pink-400"/></div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Hommes &lt; 26 ans</span>
                <p className="text-xl font-display font-extrabold text-sky-600 dark:text-sky-400 mt-1">{hommesMoins26}</p>
              </div>
              <div className="p-2 bg-sky-50 dark:bg-sky-950/30 rounded-lg"><Users size={18} className="text-sky-600 dark:text-sky-400"/></div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Femmes &lt; 26 ans</span>
                <p className="text-xl font-display font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{femmesMoins26}</p>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg"><Users size={18} className="text-emerald-600 dark:text-emerald-400"/></div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button onClick={()=>setShowVoirPlusModal(false)} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">Fermer</button>
          </div>
        </div>
      </div>}

      {showModal&&<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-emerald-500 to-sky-500 text-white flex justify-between items-center">
            <div>
              <h2 className="text-base font-display font-bold flex items-center gap-2"><Edit2 size={18}/>Modifier le responsable</h2>
              <p className="text-sm font-medium text-white/80 mt-1">Attribution du poste</p>
            </div>
            <button onClick={()=>setShowModal(false)} className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"><X size={20}/></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Membre</label>
              <input type="text" value={formData.nom_complet} disabled className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 outline-none text-sm font-medium"/>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Groupe GS</label>
              <input type="text" value={formData.nomgs} disabled className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 outline-none text-sm font-medium"/>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Poste / Fonction</label>
              <select value={formData.Poste} onChange={e=>setFormData({...formData,Poste:e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all">
                {postesDisponibles.map(poste=><option key={poste} value={poste}>{poste}</option>)}
              </select>
            </div>

            <div className="pt-3 flex gap-3">
              <button type="button" onClick={()=>setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-bold text-sm transition-colors">Annuler</button>
              <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-emerald-500 to-sky-500 hover:opacity-90 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-60">
                {loading?<Loader2 size={17} className="animate-spin"/>:<Save size={17}/>}
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
};

export default ResponsablePage;