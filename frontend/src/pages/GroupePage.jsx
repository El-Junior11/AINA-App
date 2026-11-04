import React,{useState,useEffect} from 'react';
import {getGroupes,createGroupe,deleteGroupe,updateGroupe} from '../services/groupeService';
import Swal from 'sweetalert2';
import {Trash2,Edit2,Users,X,Loader2,Save,Eye,MapPin,Search,FileText,Download,Printer,Plus,Calendar,ShieldCheck} from 'lucide-react';
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

const fieldClass =
  'w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25';
const labelClass = 'block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5';
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900';

const GroupePage=()=>{
  const [groupes,setGroupes]=useState([]);
  const [filteredGroupes,setFilteredGroupes]=useState([]);
  const [searchTerm,setSearchTerm]=useState('');
  const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);
  const [showVoirPlusModal,setShowVoirPlusModal]=useState(false);
  const [showExportMenu,setShowExportMenu]=useState(false);
  const [editingId,setEditingId]=useState(null);

  const [formData,setFormData]=useState({
    nomgs:'',
    nummenage:'',
    commune:'',
    fokontany:'',
    village:'',
    date_creation:''
  });

  useEffect(()=>{fetchData()},[]);

  // Recherche toute colonne (recherche globale sur tous les champs de l'objet)
  useEffect(()=>{
    const results=groupes.filter(g=>{
      const searchTarget=Object.values(g).join(' ').toLowerCase();
      return searchTarget.includes(searchTerm.toLowerCase());
    });
    setFilteredGroupes(results);
  },[searchTerm,groupes]);

  const fetchData=async()=>{
    try{
      setLoading(true);
      const resGroupes=await getGroupes();
      setGroupes(resGroupes.data);
      setFilteredGroupes(resGroupes.data);
    }catch(error){
      console.error(error);
      Toast.fire({icon:'error',title:'Connexion au serveur impossible'});
    }finally{
      setLoading(false);
    }
  };

  const exportPDF=async()=>{
    try{
      const doc=new jsPDF();
      const pageWidth=doc.internal.pageSize.width;
      const today=new Date().toLocaleDateString('fr-FR');

      const getCircularImage=(url)=>{
        return new Promise(resolve=>{
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
      };

      const circularLogo=await getCircularImage(logo);

      const addCenteredHeader=yOffset=>{
        doc.setFont('helvetica','bold');
        doc.setFontSize(16);
        doc.text("Liste des groupes solidaires - ONG Tsinjo Aina",pageWidth/2,yOffset,{align:'center'});
        doc.setFontSize(10);
        doc.setFont('helvetica','normal');
        doc.text(`Date d'édition : ${today}`,pageWidth/2,yOffset+7,{align:'center'});
      };

      doc.addImage(circularLogo,'PNG',(pageWidth-25)/2,10,25,25);
      addCenteredHeader(40);

      const tableData=filteredGroupes.map((g,i)=>[
        i+1,
        g.nomgs,
        g.nummenage,
        g.village,
        g.fokontany,
        g.commune,
        g.date_creation?new Date(g.date_creation).toLocaleDateString():'-'
      ]);

      autoTable(doc,{
        head:[['N°','Nom GS','Ménages','Village','Fokontany','Commune','Date création']],
        body:tableData,
        startY:50
      });

      doc.save("groupes_tsinjo_aina.pdf");
      setShowExportMenu(false);
      Toast.fire({icon:'success',title:'Export PDF réussi'});
    }catch(error){
      console.error(error);
      Toast.fire({icon:'error',title:'Impossible de générer le fichier PDF'});
    }
  };

  const exportExcel=()=>{
    try{
      const worksheet=XLSX.utils.json_to_sheet(filteredGroupes);
      const workbook=XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook,worksheet,"Groupes");
      XLSX.writeFile(workbook,"groupes_tsinjo_aina.xlsx");
      setShowExportMenu(false);
      Toast.fire({icon:'success',title:'Export Excel réussi'});
    }catch(error){
      console.error(error);
      Toast.fire({icon:'error',title:'Impossible de générer le fichier Excel'});
    }
  };

  // Gestion de la saisie des ménages pour accepter uniquement des chiffres séparés par des virgules (ex: 1, 2, 12 sans zéros superflus au début)
  const handleMenageChange = (e) => {
    const rawValue = e.target.value;
    // Autoriser uniquement les chiffres et les virgules
    const filtered = rawValue.replace(/[^0-9,]/g, '');
    
    // Nettoyer chaque nombre pour enlever les zéros initiaux (ex: "01" -> "1")
    const cleaned = filtered
      .split(',')
      .map(item => {
        const trimmed = item.trim();
        return trimmed === '' ? '' : String(Number(trimmed));
      })
      .join(', ');

    setFormData({...formData, nummenage: cleaned});
  };

  const handleSubmit=async(e)=>{
    e.preventDefault();

    const inputMenages=formData.nummenage.split(',').map(m=>m.trim()).filter(m=>m!=='');
    const existingMenages=new Set();

    groupes.forEach(g=>{
      if(editingId&&g.codegs===editingId)return;
      if(g.nummenage){
        g.nummenage.split(',').forEach(m=>{
          const cleaned=m.trim();
          if(cleaned)existingMenages.add(cleaned);
        });
      }
    });

    const duplicates=inputMenages.filter(m=>existingMenages.has(m));

    if(duplicates.length>0){
      Toast.fire({icon:'error',title:`Ménage(s) déjà attribué(s) : ${duplicates.join(', ')}`});
      return;
    }

    try{
      setLoading(true);

      if(editingId){
        await updateGroupe(editingId,formData);
      }else{
        await createGroupe(formData);
      }

      setShowModal(false);
      resetForm();
      fetchData();
      Toast.fire({icon:'success',title:'Enregistrement réussi'});
    }catch(error){
      console.error(error);
      Toast.fire({icon:'error',title:error.response?.data?.message||"Erreur lors de l'enregistrement"});
    }finally{
      setLoading(false);
    }
  };

  const handleDelete=async(id)=>{
    Swal.fire({
      toast:true,
      position:'top-end',
      title:'Supprimer ce groupe ?',
      icon:'warning',
      showCancelButton:true,
      confirmButtonColor:'#ef4444',
      cancelButtonColor:'#64748b',
      confirmButtonText:'Oui',
      cancelButtonText:'Non',
      reverseButtons:true
    }).then(async result=>{
      if(result.isConfirmed){
        try{
          setLoading(true);
          await deleteGroupe(id);
          fetchData();
          Toast.fire({icon:'success',title:'Suppression réussie'});
        }catch(error){
          console.error(error);
          Toast.fire({icon:'error',title:'Impossible de supprimer le groupe'});
        }finally{
          setLoading(false);
        }
      }
    });
  };

  const openEditModal=g=>{
    setEditingId(g.codegs);
    const formattedDate=g.date_creation?new Date(g.date_creation).toISOString().split('T')[0]:'';
    setFormData({...g,nummenage:g.nummenage||'',date_creation:formattedDate});
    setShowModal(true);
  };

  const resetForm=()=>{
    setEditingId(null);
    setFormData({nomgs:'',nummenage:'',commune:'',fokontany:'',village:'',date_creation:''});
  };

  return(
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
            <h1 className="text-lg font-display font-semibold text-slate-900 dark:text-white leading-tight">Groupes solidaires</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Gestion communautaire et organisation des ménages.</p>
          </div>
        </div>
      </header>

      {/* Barre d'outils */}
      <div className="px-4 md:px-6 pt-5 pb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={17}/>
          <input
            type="text"
            placeholder="Recherche globale sur toutes les colonnes..."
            aria-label="Recherche globale sur toutes les colonnes"
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
            onClick={()=>{resetForm();setShowModal(true)}}
            className={`h-10 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center gap-2 text-sm font-medium shadow-sm transition-colors shrink-0 ${focusRing}`}
          >
            <Plus size={16}/>
            <span className="hidden sm:block">Ajouter</span>
          </button>

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
              <div role="menu" className="absolute right-0 mt-2 w-52 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50 text-slate-900 dark:text-white">
                <button
                  role="menuitem"
                  onClick={exportPDF}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-left transition-colors"
                >
                  <FileText size={16} className="text-rose-600 dark:text-rose-400"/>
                  Document PDF
                </button>
                <button
                  role="menuitem"
                  onClick={exportExcel}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-left transition-colors"
                >
                  <Download size={16} className="text-emerald-700 dark:text-emerald-400"/>
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
                  <th className="px-5 py-3 min-w-[200px] font-semibold">Nom du groupe</th>
                  <th className="px-5 py-3 min-w-[160px] font-semibold">Date de création</th>
                  <th className="px-5 py-3 min-w-[200px] font-semibold">Ménages rattachés</th>
                  <th className="px-5 py-3 min-w-[240px] font-semibold">Localisation</th>
                  <th className="px-5 py-3 text-right w-24 sticky right-0 bg-slate-50 dark:bg-slate-800 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading?(
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <Loader2 size={26} className="animate-spin inline text-emerald-600" aria-label="Chargement"/>
                    </td>
                  </tr>
                ):filteredGroupes.map((g,index)=>(
                  <tr key={g.codegs} className="h-[64px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-5 py-3 text-sm text-slate-500 dark:text-slate-400 tabular-nums w-16">{index+1}</td>

                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-9 w-9 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60" aria-hidden="true">
                          <Users size={16}/>
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize truncate">{g.nomgs}</p>
                        </div>
                      </div>
                    </td>

                    {/* Colonne Date de création séparée */}
                    <td className="px-5 py-3">
                      {g.date_creation?(
                        <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5 tabular-nums">
                          <Calendar size={14} className="text-slate-400"/>
                          {new Date(g.date_creation).toLocaleDateString()}
                        </span>
                      ):(
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {g.nummenage?.split(',').map((m,i)=>(
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-md text-xs font-medium tabular-nums">{m.trim()}</span>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <MapPin size={16} className="text-slate-400 dark:text-slate-500 shrink-0"/>
                        <span className="capitalize">{g.commune}, {g.fokontany}, {g.village}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3 text-right w-24 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={()=>openEditModal(g)}
                          title="Modifier"
                          aria-label="Modifier ce groupe"
                          className={`p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-700/60 transition-colors ${focusRing}`}
                        >
                          <Edit2 size={16}/>
                        </button>
                        <button
                          onClick={()=>handleDelete(g.codegs)}
                          title="Supprimer"
                          aria-label="Supprimer ce groupe"
                          className={`p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-slate-700/60 transition-colors ${focusRing}`}
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading&&filteredGroupes.length===0&&(
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">Aucun groupe trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fenêtre de vue d'ensemble */}
      {showVoirPlusModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="groupes-stats-title"
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl animate-in zoom-in-95 duration-150 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4">
              <div>
                <h2 id="groupes-stats-title" className="text-base font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye size={18} className="text-emerald-700 dark:text-emerald-400"/>
                  Vue d'ensemble des groupes
                </h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Résumé global des groupes solidaires</p>
              </div>
              <button
                onClick={()=>setShowVoirPlusModal(false)}
                aria-label="Fermer"
                className={`text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 -mr-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
              >
                <X size={18}/>
              </button>
            </div>

            <div className="px-5 py-2 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="py-4 flex items-center gap-3.5">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 flex items-center justify-center">
                  <Users size={19}/>
                </div>
                <span className="flex-1 text-sm text-slate-600 dark:text-slate-300">Total groupes</span>
                <p className="text-2xl font-display font-semibold text-slate-900 dark:text-white tabular-nums">{filteredGroupes.length}</p>
              </div>

              <div className="py-4 flex items-center gap-3.5">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck size={19}/>
                </div>
                <span className="flex-1 text-sm text-slate-600 dark:text-slate-300">Ménages rattachés</span>
                <p className="text-2xl font-display font-semibold text-slate-900 dark:text-white tabular-nums">
                  {[...new Set(filteredGroupes.flatMap(g=>g.nummenage?.split(',')||[]))].length}
                </p>
              </div>

              <div className="py-4 flex items-center gap-3.5">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <MapPin size={19}/>
                </div>
                <span className="flex-1 text-sm text-slate-600 dark:text-slate-300">Communes couvertes</span>
                <p className="text-2xl font-display font-semibold text-slate-900 dark:text-white tabular-nums">
                  {[...new Set(filteredGroupes.map(g=>g.commune))].length}
                </p>
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

      {/* Fenêtre d'ajout / modification */}
      {showModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="groupe-title"
            className="w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl animate-in zoom-in-95 duration-150"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4">
              <div>
                <h2 id="groupe-title" className="text-base font-display font-semibold text-slate-900 dark:text-white">{editingId?'Modifier un groupe':'Nouveau groupe'}</h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Fiche de saisie des données</p>
              </div>
              <button
                onClick={()=>{setShowModal(false);resetForm()}}
                aria-label="Fermer"
                className={`text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 -mr-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
              >
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <label htmlFor="g-nom" className={labelClass}>Nom du groupe *</label>
                  <input id="g-nom" type="text" required className={`${fieldClass} capitalize`} value={formData.nomgs} onChange={e=>setFormData({...formData,nomgs:e.target.value})}/>
                </div>

                <div>
                  <label htmlFor="g-date" className={labelClass}>Date de création *</label>
                  <input id="g-date" type="date" required className={fieldClass} value={formData.date_creation} onChange={e=>setFormData({...formData,date_creation:e.target.value})}/>
                </div>

                <div>
                  <label htmlFor="g-commune" className={labelClass}>Commune</label>
                  <input id="g-commune" type="text" className={`${fieldClass} capitalize`} value={formData.commune} onChange={e=>setFormData({...formData,commune:e.target.value})}/>
                </div>

                <div>
                  <label htmlFor="g-fokontany" className={labelClass}>Fokontany</label>
                  <input id="g-fokontany" type="text" className={`${fieldClass} capitalize`} value={formData.fokontany} onChange={e=>setFormData({...formData,fokontany:e.target.value})}/>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="g-village" className={labelClass}>Village</label>
                  <input id="g-village" type="text" className={`${fieldClass} capitalize`} value={formData.village} onChange={e=>setFormData({...formData,village:e.target.value})}/>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="g-menages" className={labelClass}>Ménages rattachés * (Chiffres uniquement, séparés par des virgules)</label>
                  <input 
                    id="g-menages" 
                    type="text" 
                    required 
                    placeholder="Ex: 1, 2, 3" 
                    className={`${fieldClass} font-medium tabular-nums`} 
                    value={formData.nummenage} 
                    onChange={handleMenageChange}
                  />
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className={`w-full sm:w-auto h-10 px-5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-colors ${focusRing}`}
                >
                  <Save size={16}/>
                  {editingId?'Mettre à jour':'Enregistrer'}
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