import React,{useState,useEffect,useMemo,useCallback} from 'react';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import {Search,Save,X,Loader2,FileText,Download,RefreshCw,Sheet,Pencil,GraduationCap,Eye,ClipboardCheck} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {useNavigate} from 'react-router-dom';
import logo from '../assets/logo.png';
const Toast=Swal.mixin({toast:true,position:'top-end',showConfirmButton:false,timer:2500,timerProgressBar:true,didOpen:(toast)=>{toast.addEventListener('mouseenter',Swal.stopTimer);toast.addEventListener('mouseleave',Swal.resumeTimer)}});

// Présentation uniquement : initiales affichées dans l'avatar de la liste
const getInitials=(m)=>`${(m?.nom_membre||'').trim().charAt(0)}${(m?.prenom_membre||'').trim().charAt(0)}`.toUpperCase()||'?';

// Classes partagées pour garder des champs de formulaire cohérents (mêmes que les autres pages)
const textareaClass=
  'w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25 min-h-[96px] resize-y';
const labelClass='block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5';
const focusRing=
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900';
const outlineBtn=
  'h-10 px-3.5 rounded-lg inline-flex items-center gap-2 text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors';

const FormationPage=()=>{
  const [data,setData]=useState([]);
  const [searchTerm,setSearchTerm]=useState('');
  const navigate=useNavigate();
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [showModal,setShowModal]=useState(false);
  const [showExportMenu,setShowExportMenu]=useState(false);
  const [selectedMembre,setSelectedMembre]=useState(null);
  const [communeId,setCommuneId]=useState('');
  const [communes,setCommunes]=useState([]);
  const [isAdmin,setIsAdmin]=useState(false);
  const [loadError,setLoadError]=useState('');

  const modules=[
    {id:'gestionsimplifiee',label:'Gestion'},
    {id:'agrosol',label:'Agro-sol'},
    {id:'agroeau',label:'Agro-eau'},
    {id:'agrovegetaux',label:'Végétaux'},
    {id:'agroeco',label:'Agro-éco',isAuto:true},
    {id:'productionsemence',label:'Semences'},
    {id:'nutritioneau',label:'Nutri-eau'},
    {id:'nutritionalimentaire',label:'Alimentaire'},
    {id:'nutrition',label:'Nutrition',isAuto:true},
    {id:'conservationproduit',label:'Conservation'},
    {id:'transformationproduit',label:'Transformation'},
    {id:'genre',label:'Genre'},
    {id:'epracc',label:'Epracc'},
    {id:'autonomie',label:'Autonomie',isAuto:true}
  ];

  const initialForm={nummembre:'',autre:'',...modules.reduce((acc,m)=>({...acc,[m.id]:m.id==='autonomie'?0:false}),{})};
  const [formData,setFormData]=useState(initialForm);
  const getNomComplet=(membre)=>`${membre?.nom_membre||''} ${membre?.prenom_membre||''}`.trim();
  const getStoredUser=()=>{try{return JSON.parse(localStorage.getItem('user')||'{}')}catch{return {}}};
  useEffect(()=>{setIsAdmin(getStoredUser().role==='admin')},[]);
  const fetchData=useCallback(async()=>{
    try{
      setLoading(true);setLoadError('');
      const params=communeId?{commune_id:communeId}:{};
      const res=await axios.get('/formations',{params});
      setData(Array.isArray(res.data)?res.data:[]);
    }catch(err){
      console.error(err);setData([]);
      setLoadError(err.response?.data?.message||'Erreur lors du chargement des formations');
      Toast.fire({icon:'error',title:'Erreur lors du chargement des données'});
    }finally{setLoading(false)}
  },[communeId]);
  useEffect(()=>{fetchData()},[fetchData]);
  useEffect(()=>{
    if(!isAdmin)return;
    axios.get('/communes').then(res=>{
      const list=Array.isArray(res.data)?res.data:res.data?.communes||res.data?.data||[];
      if(Array.isArray(list))setCommunes(list);
    }).catch(()=>{});
  },[isAdmin]);
  const communeOptions=useMemo(()=>{
    const map=new Map();
    communes.forEach(c=>{const key=c.id_commune??c.commune_id??c.id;if(key!=null)map.set(String(key),c.nom_commune||c.nom||`Commune ${key}`)});
    data.forEach(m=>{const key=m.commune_id;if(key!=null&&!map.has(String(key)))map.set(String(key),m.commune?.nom_commune||m.Commune?.nom_commune||`Commune ${key}`)});
    return [...map].map(([id,name])=>({id,name})).sort((x,y)=>x.name.localeCompare(y.name));
  },[communes,data]);
  const filteredData=useMemo(()=>{
    const search=searchTerm.toLowerCase().trim();
    return data.filter(m=>{
      const name=`${m.nom_membre||''} ${m.prenom_membre||''} ${m.nummembre||''}`.toLowerCase();
      const reverse=`${m.prenom_membre||''} ${m.nom_membre||''}`.toLowerCase();
      return name.includes(search)||reverse.includes(search);
    });
  },[data,searchTerm]);
  const currentCommune=communeOptions.find(c=>c.id===communeId)?.name||'Toutes les communes';

  const exportToPDF=async()=>{
    try{
      const doc=new jsPDF('landscape');
      const pageWidth=doc.internal.pageSize.width;
      const today=new Date().toLocaleDateString('fr-FR');
      const getCircularImage=(url)=>new Promise((resolve,reject)=>{
        const img=new Image();
        img.onload=()=>{
          try{
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
          }catch(error){reject(error)}
        };
        img.onerror=()=>reject(new Error('Impossible de charger le logo'));
        img.src=url;
      });

      const circularLogo=await getCircularImage(logo);
      doc.addImage(circularLogo,'PNG',(pageWidth-20)/2,5,20,20);
      doc.setFont('helvetica','bold');
      doc.setFontSize(16);
      doc.text('Suivi des formations - ONG Tsinjo Aina',pageWidth/2,30,{align:'center'});
      doc.setFontSize(10);
      doc.setFont('helvetica','normal');
      doc.text(`Date d'édition : ${today} | ${isAdmin?currentCommune:'Ma commune'}`,pageWidth/2,36,{align:'center'});
      const tableColumn=['N°','Membre','Gestion','Agro-éco','Nutrition','Conservation','Transformation','Genre','Epracc','Autonomie'];
      const tableRows=filteredData.map((m,i)=>[i+1,getNomComplet(m),m.formation?.gestionsimplifiee?'Oui':'Non',m.formation?.agroeco?'Oui':'Non',m.formation?.nutrition?'Oui':'Non',m.formation?.conservationproduit?'Oui':'Non',m.formation?.transformationproduit?'Oui':'Non',m.formation?.genre?'Oui':'Non',m.formation?.epracc?'Oui':'Non',Number(m.formation?.autonomie)>0?'Oui':'Non']);
      autoTable(doc,{head:[tableColumn],body:tableRows,startY:40,styles:{fontSize:8}});
      doc.save('suivi_formations_filtre.pdf');
      setShowExportMenu(false);
      Toast.fire({icon:'success',title:'Export PDF réussi'});
    }catch(error){
      console.error(error);
      Toast.fire({icon:'error',title:'Impossible de générer le fichier PDF'});
    }
  };

  const exportToExcel=()=>{
    try{
      const excelData=filteredData.map((m,i)=>{
        const row={'N°':i+1,'Prénom':m.prenom_membre||'','Nom':m.nom_membre||'','Membre':getNomComplet(m),'ID':m.nummembre};
        modules.forEach(mod=>{row[mod.label]=mod.id==='autonomie'?(Number(m.formation?.autonomie)>0?'Oui':'Non'):(m.formation?.[mod.id]?'Oui':'Non')});
        row.Autre=m.formation?.autre||'';row.Commune=isAdmin?(communeOptions.find(c=>c.id===String(m.commune_id))?.name||`Commune ${m.commune_id}`):'Ma commune';
        return row;
      });
      const ws=XLSX.utils.json_to_sheet(excelData);
      const wb=XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb,ws,'Formations');
      XLSX.writeFile(wb,'suivi_formations.xlsx');
      setShowExportMenu(false);
      Toast.fire({icon:'success',title:'Export Excel réussi'});
    }catch(error){
      console.error(error);
      Toast.fire({icon:'error',title:'Impossible de générer le fichier Excel'});
    }
  };

  const handleCheckboxChange=(modId,isChecked)=>{
    const newFormData={...formData,[modId]:isChecked};
    newFormData.agroeco=newFormData.agroeau&&newFormData.agrosol&&newFormData.agrovegetaux;
    newFormData.nutrition=newFormData.nutritioneau&&newFormData.nutritionalimentaire;
    const manualModules=modules.filter(m=>!m.isAuto&&m.id!=='autonomie');
    newFormData.autonomie=manualModules.every(m=>newFormData[m.id]===true)?1:0;
    setFormData(newFormData);
  };

  const openEditModal=(m)=>{
    setSelectedMembre(m);
    setFormData({...initialForm,...(m.formation||{}),autonomie:Number(m.formation?.autonomie)||0,nummembre:m.nummembre});
    setShowModal(true);
  };

  const handleSubmit=async(e)=>{
    e.preventDefault();
    try{
      setSaving(true);
      const token=localStorage.getItem('token');
      const config={headers:{'Authorization':`Bearer ${token}`}};
      const {codeformation,user_id,deleted_at,...dataToSave}={...formData,autonomie:Number(formData.autonomie)?1:0};
      const res=await axios.post('/formations/save',dataToSave,config);
      if(res.status===200||res.status===201){
        setShowModal(false);
        setSelectedMembre(null);
        setFormData(initialForm);
        await fetchData();
        Toast.fire({icon:'success',title:'Enregistrement réussi'});
      }
    }catch(err){
      console.error(err);
      Toast.fire({icon:'error',title:"Erreur lors de l'enregistrement"});
    }finally{
      setSaving(false);
    }
  };
  
  const formatText=(text)=>text?text.charAt(0).toUpperCase()+text.slice(1).toLowerCase():'';
  const totalMembres=filteredData.length;
  const totalFormations=filteredData.reduce((total,m)=>total+modules.filter(mod=>!mod.isAuto&&m.formation?.[mod.id]).length,0);
  const membresAutonomes=filteredData.filter(m=>Number(m.formation?.autonomie)>0).length;
  const membresNutrition=filteredData.filter(m=>m.formation?.nutrition).length;
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
            <GraduationCap size={20} strokeWidth={2}/>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-display font-semibold text-slate-900 dark:text-white leading-tight">Suivi des formations</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Capacités, compétences et accompagnement des membres.</p>
          </div>
        </div>
      </header>

      {/* Barre d'outils */}
      <div className="px-4 md:px-6 pt-5 pb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={17}/>
          <input
            type="text"
            placeholder="Rechercher un membre par prénom, nom ou ID..."
            aria-label="Rechercher un membre par prénom, nom ou ID"
            className="w-full h-10 pl-10 pr-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25"
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
          />
          {searchTerm&&(
            <button
              type="button"
              onClick={()=>setSearchTerm('')}
              aria-label="Effacer la recherche"
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
            >
              <X size={15}/>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin&&<select aria-label="Filtrer par commune" value={communeId} onChange={e=>setCommuneId(e.target.value)} className={`${outlineBtn} max-w-[220px]`}>
            <option value="">Toutes les communes</option>
            {communeOptions.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>}
          <button type="button" onClick={fetchData} disabled={loading} className={`${outlineBtn} shrink-0 disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`}>
            <RefreshCw size={16} className={`text-slate-500 dark:text-slate-400 ${loading?'animate-spin':''}`}/>
            <span className="hidden sm:block">Actualiser</span>
          </button>

          <button type="button" onClick={()=>navigate(`/formation-stats${isAdmin&&communeId?`?commune_id=${encodeURIComponent(communeId)}`:''}`)} className={`${outlineBtn} shrink-0 ${focusRing}`}>
            <Eye size={16} className="text-slate-500 dark:text-slate-400"/>
            <span className="hidden sm:block">Voir plus</span>
          </button>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={()=>setShowExportMenu(!showExportMenu)}
              aria-haspopup="menu"
              aria-expanded={showExportMenu}
              className={`${outlineBtn} ${focusRing}`}
            >
              <Download size={16} className="text-slate-500 dark:text-slate-400"/>
              <span className="hidden md:block">Exporter</span>
            </button>

            {showExportMenu&&(
              <div role="menu" className="absolute right-0 mt-2 w-52 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50 text-slate-900 dark:text-white">
                <button type="button" role="menuitem" onClick={exportToPDF} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-left transition-colors">
                  <FileText size={16} className="text-rose-600 dark:text-rose-400"/>
                  Document PDF
                </button>
                <button type="button" role="menuitem" onClick={exportToExcel} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-left transition-colors">
                  <Sheet size={16} className="text-emerald-700 dark:text-emerald-400"/>
                  Feuille Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {loadError&&<p role="alert" className="px-6 pb-3 text-sm text-red-600">{loadError}</p>}
      {/* Tableau */}
      <div className="flex-1 overflow-hidden px-4 md:px-6 pb-5">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm h-full flex flex-col">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full border-collapse text-left min-w-[1450px]">
              <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 text-[13px] font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 w-16 min-w-[4rem] max-w-[4rem] sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 font-semibold">N°</th>
                  <th className="px-5 py-3 min-w-[220px] sticky left-16 z-20 bg-slate-50 dark:bg-slate-800 border-rborder-slate-200 dark:border-slate-700 font-semibold">Membre</th>
                  {modules.map(mod=><th key={mod.id} className="px-3 py-3 text-center min-w-[100px] font-semibold">{formatText(mod.label)}</th>)}
                  <th className="px-5 py-3 min-w-[150px] font-semibold">Autre</th>
                  <th className="px-5 py-3 text-right w-24 sticky right-0 bg-slate-50 dark:bg-slate-800 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading?(
                  <tr>
                    <td colSpan={modules.length+4} className="p-12 text-center">
                      <Loader2 size={26} className="animate-spin inline text-emerald-600" aria-label="Chargement"/>
                    </td>
                  </tr>
                ):filteredData.map((m,index)=>(
                  <tr key={m.nummembre} className="h-[56px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-5 py-2.5 text-sm text-slate-500 dark:text-slate-400 tabular-nums w-16 min-w-[4rem] max-w-[4rem] sticky left-0 z-[1] bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors">{index+1}</td>
                    <td className="px-5 py-2.5 sticky left-16 z-[1] bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 border-r border-slate-100 dark:border-slate-800 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-8 w-8 shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60" aria-hidden="true">
                          {getInitials(m)}
                        </span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize truncate">{getNomComplet(m)}</p>
                      </div>
                    </td>
                    {modules.map(mod=>(
                      <td key={mod.id} className="px-3 py-2.5 text-center">
                        {(mod.id==='autonomie'?Number(m.formation?.autonomie)>0:m.formation?.[mod.id])?(
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium inline-flex bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900">Oui</span>
                        ):(
                          <span className="text-xs text-slate-400 dark:text-slate-500">Non</span>
                        )}
                      </td>
                    ))}
                    <td className="px-5 py-2.5">
                      <span className="text-sm text-slate-600 dark:text-slate-300 truncate block max-w-[150px]">{m.formation?.autre||'-'}</span>
                    </td>
                    <td className="px-5 py-2.5 text-right w-24 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors">
                      <button
                        type="button"
                        onClick={()=>openEditModal(m)}
                        title="Modifier"
                        aria-label="Modifier la fiche de formation"
                        className={`p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-700/60 transition-colors ${focusRing}`}
                      >
                        <Pencil size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading&&filteredData.length===0&&(
                  <tr>
                    <td colSpan={modules.length+4} className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">Aucune formation trouvée</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fenêtre de la fiche individuelle */}
      {showModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="formation-title"
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl animate-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4 shrink-0">
              <div>
                <h2 id="formation-title" className="text-base font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap size={18} className="text-emerald-700 dark:text-emerald-400"/>
                  Fiche individuelle de formation
                </h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 capitalize">{getNomComplet(selectedMembre)}</p>
              </div>
              <button
                type="button"
                onClick={()=>setShowModal(false)}
                aria-label="Fermer"
                className={`text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 -mr-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
              >
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
              <div className="p-5 space-y-5 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {modules.filter(m=>!m.isAuto).map(mod=>(
                    <div
                      key={mod.id}
                      role="checkbox"
                      aria-checked={!!formData[mod.id]}
                      tabIndex={0}
                      onClick={()=>handleCheckboxChange(mod.id,!formData[mod.id])}
                      onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();handleCheckboxChange(mod.id,!formData[mod.id])}}}
                      className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg cursor-pointer border transition-colors ${focusRing} ${formData[mod.id]?'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30':'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      <span className="text-[13px] font-medium text-slate-800 dark:text-slate-200">{formatText(mod.label)}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${formData[mod.id]?'bg-emerald-700 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>{formData[mod.id]?'Oui':'Non'}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">Ces trois statuts sont calculés automatiquement à partir des modules cochés.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="px-3.5 py-3 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center gap-2">
                      <div>
                        <span className="text-[13px] text-slate-500 dark:text-slate-400 block">Agro-éco</span>
                        <p className={`text-lg font-display font-semibold mt-0.5 ${formData.agroeco?'text-emerald-700 dark:text-emerald-400':'text-slate-400 dark:text-slate-500'}`}>{formData.agroeco?'Oui':'Non'}</p>
                      </div>
                      <div className="h-8 w-8 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0"><ClipboardCheck size={17}/></div>
                    </div>

                    <div className="px-3.5 py-3 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center gap-2">
                      <div>
                        <span className="text-[13px] text-slate-500 dark:text-slate-400 block">Nutrition</span>
                        <p className={`text-lg font-display font-semibold mt-0.5 ${formData.nutrition?'text-emerald-700 dark:text-emerald-400':'text-slate-400 dark:text-slate-500'}`}>{formData.nutrition?'Oui':'Non'}</p>
                      </div>
                      <div className="h-8 w-8 rounded-md bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0"><ClipboardCheck size={17}/></div>
                    </div>

                    <div className="px-3.5 py-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 flex justify-between items-center gap-2">
                      <div>
                        <span className="text-[13px] text-emerald-800 dark:text-emerald-400 block">Autonomie</span>
                        <p className={`text-lg font-display font-semibold mt-0.5 ${formData.autonomie?'text-emerald-700 dark:text-emerald-400':'text-slate-400 dark:text-slate-500'}`}>{formData.autonomie?'Oui':'Non'}</p>
                      </div>
                      <div className="h-8 w-8 rounded-md bg-white/80 dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0"><ShieldCheckIcon size={17}/></div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="formation-autre" className={labelClass}>Observations / Autres</label>
                    <textarea id="formation-autre" className={textareaClass} value={formData.autre||''} onChange={e=>setFormData({...formData,autre:e.target.value})} placeholder="Saisir des remarques ou détails supplémentaires..."/>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full sm:w-auto h-10 px-5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`}
                >
                  {saving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>}
                  {saving?'Enregistrement...':'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
const ShieldCheckIcon=({size=18,className=''})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
export default FormationPage;
