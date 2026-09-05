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

  useEffect(()=>{
    const results=groupes.filter(g=>{
      const searchTarget=`${g.nomgs} ${g.nummenage} ${g.commune} ${g.fokontany} ${g.village}`.toLowerCase();
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

  const handleSubmit=async(e)=>{
    e.preventDefault();

    const inputMenages=formData.nummenage.split(',').map(m=>m.trim().toUpperCase()).filter(m=>m!=='');
    const existingMenages=new Set();

    groupes.forEach(g=>{
      if(editingId&&g.codegs===editingId)return;
      if(g.nummenage){
        g.nummenage.split(',').forEach(m=>{
          const cleaned=m.trim().toUpperCase();
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
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 transition-colors font-body overflow-hidden relative">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');.font-body{font-family:'DM Sans',sans-serif}.font-display{font-family:'Manrope',sans-serif}`}</style>

      <div className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-sky-500 text-white rounded-2xl shrink-0 shadow-sm">
            <Users size={24}/>
          </div>
          <div>
            <h1 className="text-lg font-display font-extrabold text-slate-900 dark:text-white tracking-tight">Groupes solidaires</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Gestion communautaire et organisation des ménages.</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="relative group flex-1 min-w-[240px] max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18}/>
          <input type="text" placeholder="Rechercher un groupe, un ménage ou un lieu..." className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium transition-all" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
          {searchTerm&&(
            <button onClick={()=>setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors">
              <X size={17}/>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={()=>{resetForm();setShowModal(true)}} className="bg-gradient-to-r from-emerald-500 to-sky-500 hover:opacity-90 text-white px-3 py-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm hover:shadow-md shrink-0">
            <Plus size={16}/>
            <span className="hidden sm:block">Ajouter</span>
          </button>

          <button onClick={()=>setShowVoirPlusModal(true)} className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-950/50 px-3 py-2.5 rounded-xl transition-all font-bold text-xs border border-sky-100 dark:border-sky-900/40 shrink-0">
            <Eye size={16}/>
            <span className="hidden sm:block">Voir plus</span>
          </button>

          <div className="relative shrink-0">
            <button onClick={()=>setShowExportMenu(!showExportMenu)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm hover:shadow-md">
              <Printer size={16}/>
              <span className="hidden md:block">Exporter</span>
            </button>

            {showExportMenu&&(
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 text-slate-900 dark:text-white overflow-hidden">
                <button onClick={exportPDF} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold border-b border-slate-100 dark:border-slate-800 transition-colors">
                  <FileText size={16} className="text-rose-500"/>
                  Document PDF
                </button>
                <button onClick={exportExcel} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors">
                  <Download size={16} className="text-emerald-600"/>
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
                  <th className="px-5 py-4 min-w-[200px]">Nom du groupe</th>
                  <th className="px-5 py-4 min-w-[220px]">Ménages rattachés</th>
                  <th className="px-5 py-4 min-w-[260px]">Localisation</th>
                  <th className="px-5 py-4 text-right w-24 sticky right-0 bg-slate-50 dark:bg-slate-800">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading?(
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <Loader2 size={28} className="animate-spin inline text-emerald-500"/>
                    </td>
                  </tr>
                ):filteredGroupes.map((g,index)=>(
                  <tr key={g.codegs} className="h-[64px] hover:bg-emerald-50/40 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-5 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 w-16">{index+1}</td>

                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-950/40 dark:to-emerald-950/30 text-sky-600 dark:text-sky-400 rounded-xl shrink-0">
                          <Users size={17}/>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white capitalize truncate">{g.nomgs}</p>
                          {g.date_creation&&(
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1">
                              <Calendar size={11}/>
                              {new Date(g.date_creation).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {g.nummenage?.split(',').map((m,i)=>(
                          <span key={i} className="px-2.5 py-1 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 rounded-lg text-xs font-bold">{m.trim()}</span>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        <MapPin size={16} className="text-rose-500 shrink-0"/>
                        <span className="capitalize">{g.commune}, {g.fokontany}, {g.village}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3 text-right w-24 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-emerald-50/40 dark:group-hover:bg-slate-800/50">
                      <div className="flex justify-end gap-2">
                        <button onClick={()=>openEditModal(g)} title="Modifier" className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <Edit2 size={16}/>
                        </button>
                        <button onClick={()=>handleDelete(g.codegs)} title="Supprimer" className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading&&filteredGroupes.length===0&&(
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium text-sm">Aucun groupe trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showVoirPlusModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-sky-500 text-white flex justify-between items-center">
              <div>
                <h2 className="text-sm font-display font-bold flex items-center gap-2">
                  <Eye size={18}/>
                  Vue d'ensemble des groupes
                </h2>
                <p className="text-xs font-medium text-white/80 mt-1">Résumé global des groupes solidaires</p>
              </div>
              <button onClick={()=>setShowVoirPlusModal(false)} className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={19}/>
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">Total groupes</span>
                    <p className="text-xl font-display font-extrabold text-slate-900 dark:text-white mt-1">{filteredGroupes.length}</p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-950/40 dark:to-emerald-950/30 rounded-lg shrink-0">
                    <Users size={18} className="text-sky-600 dark:text-sky-400"/>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">Ménages rattachés</span>
                    <p className="text-xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                      {[...new Set(filteredGroupes.flatMap(g=>g.nummenage?.split(',')||[]))].length}
                    </p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30 rounded-lg shrink-0">
                    <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400"/>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">Communes couvertes</span>
                    <p className="text-xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                      {[...new Set(filteredGroupes.map(g=>g.commune))].length}
                    </p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-amber-50 to-sky-50 dark:from-amber-950/30 dark:to-sky-950/30 rounded-lg shrink-0">
                    <MapPin size={18} className="text-amber-500"/>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 pb-4 flex justify-end">
              <button onClick={()=>setShowVoirPlusModal(false)} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-emerald-500 to-sky-500 text-white flex justify-between items-center">
              <div>
                <h2 className="text-base font-display font-bold">{editingId?'Modifier un groupe':'Nouveau groupe'}</h2>
                <p className="text-sm font-medium text-white/80 mt-1">Fiche de saisie des données</p>
              </div>
              <button onClick={()=>{setShowModal(false);resetForm()}} className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nom du groupe *</label>
                  <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium capitalize transition-all" value={formData.nomgs} onChange={e=>setFormData({...formData,nomgs:e.target.value})}/>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Date de création *</label>
                  <input type="date" required className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all" value={formData.date_creation} onChange={e=>setFormData({...formData,date_creation:e.target.value})}/>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Commune</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium capitalize transition-all" value={formData.commune} onChange={e=>setFormData({...formData,commune:e.target.value})}/>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Fokontany</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium capitalize transition-all" value={formData.fokontany} onChange={e=>setFormData({...formData,fokontany:e.target.value})}/>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Village</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium capitalize transition-all" value={formData.village} onChange={e=>setFormData({...formData,village:e.target.value})}/>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Ménages rattachés *</label>
                  <input type="text" required placeholder="Ex: M001, M002, M003" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-bold placeholder:font-normal placeholder:text-slate-400 transition-all" value={formData.nummenage} onChange={e=>setFormData({...formData,nummenage:e.target.value})}/>
                </div>
              </div>

              <div className="pt-3">
                <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:opacity-90 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all shadow-sm hover:shadow-md">
                  <Save size={17}/>
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