import React,{useState,useEffect} from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {Search,Save,X,Loader2,FileText,Download,RefreshCw,Sheet,ArrowRight,Pencil,GraduationCap,Eye,BarChart3,ClipboardCheck} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {useNavigate} from 'react-router-dom';
import logo from '../assets/logo.png';

const Toast=Swal.mixin({toast:true,position:'top-end',showConfirmButton:false,timer:2500,timerProgressBar:true,didOpen:(toast)=>{toast.addEventListener('mouseenter',Swal.stopTimer);toast.addEventListener('mouseleave',Swal.resumeTimer)}});

const FormationPage=()=>{
  const [data,setData]=useState([]);
  const [filteredData,setFilteredData]=useState([]);
  const [searchTerm,setSearchTerm]=useState('');
  const navigate=useNavigate();
  const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);
  const [showExportMenu,setShowExportMenu]=useState(false);
  const [selectedMembre,setSelectedMembre]=useState(null);

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

  const initialForm={nummembre:'',autre:'',...modules.reduce((acc,m)=>({...acc,[m.id]:false}),{})};
  const [formData,setFormData]=useState(initialForm);
  const API_BASE='http://localhost:5000/api';

  useEffect(()=>{fetchData()},[]);

  useEffect(()=>{
    const results=data.filter(m=>`${m.nom_membre} ${m.nummembre}`.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredData(results);
  },[searchTerm,data]);

  const fetchData=async()=>{
    try{
      setLoading(true);
      const token=localStorage.getItem('token');
      const res=await axios.get(`${API_BASE}/formations`,{headers:{'Authorization':`Bearer ${token}`}});
      setData(res.data);
      setFilteredData(res.data);
    }catch(err){
      console.error(err);
      Toast.fire({icon:'error',title:'Erreur lors du chargement des données'});
    }finally{
      setLoading(false);
    }
  };

  const exportToPDF=async()=>{
    try{
      const doc=new jsPDF('landscape');
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
      doc.addImage(circularLogo,'PNG',(pageWidth-20)/2,5,20,20);
      doc.setFont('helvetica','bold');
      doc.setFontSize(16);
      doc.text('Suivi des formations - ONG Tsinjo Aina',pageWidth/2,30,{align:'center'});
      doc.setFontSize(10);
      doc.setFont('helvetica','normal');
      doc.text(`Date d'édition : ${today}`,pageWidth/2,36,{align:'center'});
      const tableColumn=['N°','Membre','Gestion','Agro-éco','Nutrition','Conservation','Transformation','Genre','Epracc','Autonomie'];
      const tableRows=filteredData.map((m,i)=>[
        i+1,
        m.nom_membre,
        m.formation?.gestionsimplifiee?'Oui':'Non',
        m.formation?.agroeco?'Oui':'Non',
        m.formation?.nutrition?'Oui':'Non',
        m.formation?.conservationproduit?'Oui':'Non',
        m.formation?.transformationproduit?'Oui':'Non',
        m.formation?.genre?'Oui':'Non',
        m.formation?.epracc?'Oui':'Non',
        m.formation?.autonomie?'Oui':'Non'
      ]);
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
        const row={'N°':i+1,'Membre':m.nom_membre,'ID':m.nummembre};
        modules.forEach(mod=>{row[mod.label]=m.formation?.[mod.id]?'Oui':'Non'});
        row.Autre=m.formation?.autre||'';
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
    newFormData.autonomie=manualModules.every(m=>newFormData[m.id]===true);
    setFormData(newFormData);
  };

  const openEditModal=(m)=>{
    setSelectedMembre(m);
    setFormData(m.formation?{...m.formation}:{...initialForm,nummembre:m.nummembre});
    setShowModal(true);
  };

  const handleSubmit=async(e)=>{
    e.preventDefault();
    try{
      setLoading(true);
      const token=localStorage.getItem('token');
      const storedUser=JSON.parse(localStorage.getItem('user'));
      const userId=storedUser?.user_id||storedUser?.id;
      const dataToSave={...formData,user_id:userId,autonomie:formData.autonomie?1:0};
      const res=await axios.post(`${API_BASE}/formations/save`,dataToSave,{headers:{'Authorization':`Bearer ${token}`}});
      if(res.status===200||res.status===201){
        setShowModal(false);
        fetchData();
        Toast.fire({icon:'success',title:'Enregistrement réussi'});
      }
    }catch(err){
      console.error(err);
      Toast.fire({icon:'error',title:"Erreur lors de l'enregistrement"});
    }finally{
      setLoading(false);
    }
  };

  const formatText=(text)=>text?text.charAt(0).toUpperCase()+text.slice(1).toLowerCase():'';

  const totalMembres=filteredData.length;
  const totalFormations=filteredData.reduce((total,m)=>total+modules.filter(mod=>!mod.isAuto&&m.formation?.[mod.id]).length,0);
  const membresAutonomes=filteredData.filter(m=>m.formation?.autonomie).length;
  const membresNutrition=filteredData.filter(m=>m.formation?.nutrition).length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 transition-colors font-body overflow-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
        .font-body{font-family:'DM Sans',sans-serif}
        .font-display{font-family:'Manrope',sans-serif}
      `}</style>

      <div className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-sky-500 text-white rounded-2xl shrink-0 shadow-sm"><GraduationCap size={24}/></div>
          <div>
            <h1 className="text-lg font-display font-extrabold text-slate-900 dark:text-white tracking-tight">Suivi des formations</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Capacités, compétences et accompagnement des membres.</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="relative group flex-1 min-w-[240px] max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18}/>
          <input type="text" placeholder="Rechercher un membre par nom ou ID..." className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium transition-all" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
          {searchTerm&&<button onClick={()=>setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"><X size={17}/></button>}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchData} className="bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-950/50 px-3 py-2.5 rounded-xl transition-all font-bold text-xs border border-sky-100 dark:border-sky-900/40 shrink-0 flex items-center gap-2">
            <RefreshCw size={16} className={loading?'animate-spin':''}/>
            <span className="hidden sm:block">Actualiser</span>
          </button>

          <button onClick={()=>navigate('/formation-stats')} className="flex items-center gap-2 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-950/50 px-3 py-2.5 rounded-xl transition-all font-bold text-xs border border-sky-100 dark:border-sky-900/40 shrink-0">
            <Eye size={16}/>
            <span className="hidden sm:block">Voir plus</span>
          </button>

          <div className="relative shrink-0">
            <button onClick={()=>setShowExportMenu(!showExportMenu)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-bold shadow-sm hover:shadow-md">
              <Download size={16}/>
              <span className="hidden md:block">Exporter</span>
            </button>

            {showExportMenu&&<div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 text-slate-900 dark:text-white overflow-hidden">
              <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium border-b border-slate-100 dark:border-slate-800 transition-colors"><FileText size={17} className="text-rose-500"/>Document PDF</button>
              <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors"><Sheet size={17} className="text-emerald-600"/>Feuille Excel</button>
            </div>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 md:px-6 pb-6">
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm h-full flex flex-col">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full border-collapse text-left min-w-[1450px]">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/90 text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4 w-16">N°</th>
                  <th className="px-5 py-4 min-w-[220px]">Membre</th>
                  {modules.map(mod=><th key={mod.id} className="px-3 py-4 text-center min-w-[100px]">{formatText(mod.label)}</th>)}
                  <th className="px-5 py-4 min-w-[150px]">Autre</th>
                  <th className="px-5 py-4 text-right w-24 sticky right-0 bg-slate-50 dark:bg-slate-800">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading?<tr><td colSpan={modules.length+4} className="p-12 text-center"><Loader2 size={28} className="animate-spin inline text-emerald-500"/></td></tr>:filteredData.map((m,index)=>(
                  <tr key={m.nummembre} className="h-[64px] hover:bg-emerald-50/40 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-5 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 w-16">{index+1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-950/40 dark:to-emerald-950/30 text-sky-600 dark:text-sky-400 rounded-xl shrink-0"><GraduationCap size={17}/></div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white capitalize truncate">{m.nom_membre}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">N° {m.nummembre||'-'}</p>
                        </div>
                      </div>
                    </td>

                    {modules.map(mod=>(
                      <td key={mod.id} className="px-3 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${m.formation?.[mod.id]?'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300':'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {m.formation?.[mod.id]?'Oui':'Non'}
                        </span>
                      </td>
                    ))}

                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate block max-w-[150px]">{m.formation?.autre||'-'}</span>
                    </td>

                    <td className="px-5 py-3 text-right w-24 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-emerald-50/40 dark:group-hover:bg-slate-800/50">
                      <button onClick={()=>openEditModal(m)} title="Modifier" className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors"><Pencil size={16}/></button>
                    </td>
                  </tr>
                ))}

                {!loading&&filteredData.length===0&&<tr><td colSpan={modules.length+4} className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium text-sm">Aucune formation trouvée</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal&&<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[85vh]">
          <div className="p-5 bg-gradient-to-r from-emerald-500 to-sky-500 text-white flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-base font-display font-bold flex items-center gap-2"><GraduationCap size={19}/>Fiche individuelle de formation</h2>
              <p className="text-sm font-medium text-white/80 mt-1 capitalize">{selectedMembre?.nom_membre}</p>
            </div>
            <button onClick={()=>setShowModal(false)} className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"><X size={20}/></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {modules.filter(m=>!m.isAuto).map(mod=>(
                <div key={mod.id} onClick={()=>handleCheckboxChange(mod.id,!formData[mod.id])} className={`flex items-center justify-between gap-2 p-3 rounded-xl cursor-pointer border transition-all ${formData[mod.id]?'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30':'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'}`}>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatText(mod.label)}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${formData[mod.id]?'bg-gradient-to-r from-emerald-500 to-sky-500 text-white':'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>{formData[mod.id]?'Oui':'Non'}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
                  <div><span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Agro-éco</span><p className={`text-xl font-display font-extrabold mt-1 ${formData.agroeco?'text-emerald-600 dark:text-emerald-400':'text-slate-500'}`}>{formData.agroeco?'Oui':'Non'}</p></div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg"><ClipboardCheck size={18} className="text-emerald-600 dark:text-emerald-400"/></div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
                  <div><span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Nutrition</span><p className={`text-xl font-display font-extrabold mt-1 ${formData.nutrition?'text-emerald-600 dark:text-emerald-400':'text-slate-500'}`}>{formData.nutrition?'Oui':'Non'}</p></div>
                  <div className="p-2 bg-sky-50 dark:bg-sky-950/30 rounded-lg"><ClipboardCheck size={18} className="text-sky-600 dark:text-sky-400"/></div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 flex justify-between items-center">
                  <div><span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">Autonomie</span><p className={`text-xl font-display font-extrabold mt-1 ${formData.autonomie?'text-emerald-600 dark:text-emerald-400':'text-slate-500'}`}>{formData.autonomie?'Oui':'Non'}</p></div>
                  <div className="p-2 bg-white/70 dark:bg-slate-900 rounded-lg"><ShieldCheckIcon size={18} className="text-emerald-600 dark:text-emerald-400"/></div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Observations / Autres</label>
                <textarea className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium min-h-[90px] transition-all" value={formData.autre||''} onChange={e=>setFormData({...formData,autre:e.target.value})} placeholder="Saisir des remarques ou détails supplémentaires..."/>
              </div>
            </div>

            <div className="pt-3">
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:opacity-90 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-60">
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

const ShieldCheckIcon=({size=18,className=''})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;

export default FormationPage;