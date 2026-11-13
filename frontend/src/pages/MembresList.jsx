import React,{useState,useEffect,useContext} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import {Trash2,Edit2,UserPlus,X,Loader2,Save,Eye,CheckCircle2,Search,FileText,Download,Users} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {AuthContext} from '../context/AuthContext';

const Toast=Swal.mixin({toast:true,position:'top-end',showConfirmButton:false,timer:2500,timerProgressBar:true});
const fieldClass='w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25';
const labelClass='block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5';
const initialForm={nom_membre:'',prenom_membre:'',annee_naissance:'',sexe:'Homme',chef:false,commune_id:'',mode_menage:'nouveau',num_menage:''};
const sortMembres=data=>[...data].sort((a,b)=>Number(a.commune_id||0)-Number(b.commune_id||0)||String(a.num_menage||'').localeCompare(String(b.num_menage||''),undefined,{numeric:true}));

const MembresList=()=>{
  const navigate=useNavigate();
  const {user}=useContext(AuthContext);
  const isAdmin=user?.role==='admin';
  const [membres,setMembres]=useState([]),[communes,setCommunes]=useState([]);
  const [searchTerm,setSearchTerm]=useState(''),[communeFilter,setCommuneFilter]=useState('all');
  const [loading,setLoading]=useState(true),[loadingCommunes,setLoadingCommunes]=useState(false);
  const [showModal,setShowModal]=useState(false),[showExportMenu,setShowExportMenu]=useState(false);
  const [editingId,setEditingId]=useState(null),[formData,setFormData]=useState({...initialForm});
  const getConfig=()=>({headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}});
  const updateForm=(key,value)=>setFormData(f=>({...f,[key]:value}));
  const notify=(icon,title)=>Toast.fire({icon,title});

  const fetchMembres=async()=>{
    try{
      setLoading(true);
      const {data}=await axios.get('/membres',getConfig());
      if(!Array.isArray(data))throw new Error('Format de données invalide');
      setMembres(sortMembres(data));
    }catch(error){console.error(error);notify('error',error.response?.data?.message||'Impossible de charger les membres');}
    finally{setLoading(false);}
  };
  const fetchCommunes=async()=>{
    if(!isAdmin)return;
    try{
      setLoadingCommunes(true);
      const {data}=await axios.get('/auth/admin/communes',getConfig());
      setCommunes(Array.isArray(data)?data:[]);
    }catch(error){console.error(error);notify('error','Impossible de charger les communes');}
    finally{setLoadingCommunes(false);}
  };
  useEffect(()=>{fetchMembres();},[]);
  useEffect(()=>{if(isAdmin)fetchCommunes();},[isAdmin]);

  const filteredMembres=sortMembres(membres.filter(m=>{
    const text=[m.nom_membre,m.prenom_membre,m.annee_naissance,m.sexe,m.num_menage,m.chef?'chef':'membre'].join(' ').toLowerCase();
    return text.includes(searchTerm.toLowerCase())&&(!isAdmin||communeFilter==='all'||String(m.commune_id)===communeFilter);
  }));
  const getCommuneName=id=>{const c=communes.find(c=>String(c.id??c.id_commune)===String(id));return c?.nom??c?.nom_commune??'Non définie';};
  const resetForm=()=>{setEditingId(null);setFormData({...initialForm});};
  const openAddModal=()=>{resetForm();setShowModal(true);};
  const openEditModal=m=>{
    setEditingId(m.nummembre);
    setFormData({...initialForm,...m,annee_naissance:m.annee_naissance??'',commune_id:m.commune_id??'',num_menage:m.num_menage??''});
    setShowModal(true);
  };
  const closeModal=()=>{setShowModal(false);resetForm();};
  const handleSubmit=async e=>{
    e.preventDefault();
    const isEditing=editingId!==null;
    const payload={nom_membre:formData.nom_membre.trim(),prenom_membre:(formData.prenom_membre||'').trim(),annee_naissance:formData.annee_naissance===''?null:Number(formData.annee_naissance),sexe:formData.sexe,chef:Boolean(formData.chef)};
    if(!payload.nom_membre)return notify('warning','Le nom est obligatoire');
    if(!isEditing){
      if(isAdmin){
        const id=Number(formData.commune_id);
        if(!Number.isSafeInteger(id)||id<=0)return notify('warning','Veuillez sélectionner une commune');
        payload.commune_id=id;
      }
      if(formData.mode_menage==='existant'){
        const numero=Number(formData.num_menage);
        if(!Number.isSafeInteger(numero)||numero<=0)return notify('warning','Numéro de ménage invalide');
        payload.num_menage=numero;
      }
    }
    try{
      setLoading(true);
      if(isEditing)await axios.put(`/membres/${editingId}`,payload,getConfig());
      else await axios.post('/membres',payload,getConfig());
      closeModal();await fetchMembres();
      notify('success',isEditing?'Membre modifié avec succès':'Membre ajouté avec succès');
    }catch(error){console.error(error);notify('error',error.response?.data?.message||error.response?.data?.error||"Erreur lors de l'enregistrement");}
    finally{setLoading(false);}
  };
  const handleDelete=async id=>{
    const result=await Swal.fire({title:'Supprimer ce membre ?',text:'Cette action est irréversible.',icon:'warning',showCancelButton:true,confirmButtonText:'Oui, supprimer',cancelButtonText:'Annuler',confirmButtonColor:'#dc2626'});
    if(!result.isConfirmed)return;
    try{await axios.delete(`/membres/${id}`,getConfig());await fetchMembres();notify('success','Membre supprimé avec succès');}
    catch(error){console.error(error);notify('error',error.response?.data?.message||'Impossible de supprimer ce membre');}
  };
  const exportPDF=()=>{
    try{
      const doc=new jsPDF(),width=doc.internal.pageSize.width;
      doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text('Liste des membres - ONG TSINJO AINA',width/2,20,{align:'center'});
      doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`,width/2,28,{align:'center'});
      const headers=['N°','Membre','Année','Sexe','Statut','Ménage'];
      if(isAdmin)headers.push('Commune');
      const rows=filteredMembres.map((m,i)=>[i+1,`${m.nom_membre||''} ${m.prenom_membre||''}`,m.annee_naissance||'-',m.sexe||'-',m.chef?'Chef':'Membre',m.num_menage||'-',...(isAdmin?[getCommuneName(m.commune_id)]:[])]);
      autoTable(doc,{head:[headers],body:rows,startY:35,styles:{fontSize:8},headStyles:{fillColor:[4,120,87]}});
      doc.save('membres_tsinjo_aina.pdf');setShowExportMenu(false);notify('success','Export PDF réussi');
    }catch(error){console.error(error);notify('error','Erreur export PDF');}
  };
  const exportExcel=()=>{
    try{
      const data=filteredMembres.map((m,i)=>({Numero:i+1,Nom:m.nom_membre,Prenoms:m.prenom_membre||'',Annee_naissance:m.annee_naissance||'',Sexe:m.sexe,Statut:m.chef?'Chef':'Membre',Numero_menage:m.num_menage||'',...(isAdmin?{Commune:getCommuneName(m.commune_id)}:{})}));
      const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data),'Membres');
      XLSX.writeFile(wb,'membres_tsinjo_aina.xlsx');setShowExportMenu(false);notify('success','Export Excel réussi');
    }catch(error){console.error(error);notify('error','Erreur export Excel');}
  };

  return(
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      <header className="px-4 md:px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 flex items-center justify-center"><Users size={20}/></div>
          <div><h1 className="text-lg font-semibold">Gestion des membres</h1><p className="text-sm text-slate-500 dark:text-slate-400">Base de données sécurisée et gestion des membres</p></div>
        </div>
      </header>
      <div className="px-4 md:px-6 py-5 flex flex-wrap lg:flex-nowrap items-center gap-2 w-full">
        <div className="relative flex-1 min-w-[180px] w-full sm:w-auto">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input type="text" placeholder="Rechercher un membre..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className={`${fieldClass} pl-10`}/>
        </div>
        {isAdmin&&<select value={communeFilter} onChange={e=>setCommuneFilter(e.target.value)} className={`${fieldClass} !w-44 shrink-0`} aria-label="Filtrer par commune">
          <option value="all">Toutes les communes</option>
          {communes.map(c=><option key={c.id??c.id_commune} value={String(c.id??c.id_commune)}>{c.nom??c.nom_commune}</option>)}
        </select>}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
          <button type="button" onClick={openAddModal} className="h-10 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-2 text-sm font-medium whitespace-nowrap"><UserPlus size={16}/>Ajouter</button>
          <button type="button" onClick={()=>navigate('/membres/statistiques')} className="h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"><Eye size={16}/>Voir plus</button>
          <div className="relative">
            <button type="button" onClick={()=>setShowExportMenu(v=>!v)} aria-expanded={showExportMenu} className="h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"><Download size={16}/>Exporter</button>
            {showExportMenu&&<div className="absolute right-0 top-12 z-50 w-48 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg p-1">
              <button type="button" onClick={exportPDF} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"><FileText size={16}/>Document PDF</button>
              <button type="button" onClick={exportExcel} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"><Download size={16}/>Feuille Excel</button>
            </div>}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden px-4 md:px-6 pb-5">
        <div className="h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-300"><tr>
              <th className="px-5 py-3">N°</th><th className="px-5 py-3">Membre</th><th className="px-5 py-3 text-center">Année</th><th className="px-5 py-3 text-center">Genre</th><th className="px-5 py-3 text-center">Statut</th><th className="px-5 py-3">Ménage</th>
              {isAdmin&&<th className="px-5 py-3">Commune</th>}<th className="px-5 py-3 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading?<tr><td colSpan={isAdmin?8:7} className="p-12 text-center"><Loader2 size={26} className="animate-spin inline text-emerald-600"/></td></tr>:
              filteredMembres.length===0?<tr><td colSpan={isAdmin?8:7} className="p-12 text-center text-slate-500">Aucune donnée trouvée</td></tr>:
              filteredMembres.map((m,index)=><tr key={m.nummembre} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-5 py-3 text-sm">{index+1}</td>
                <td className="px-5 py-3"><div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 flex items-center justify-center text-xs font-semibold">{`${(m.nom_membre||'').charAt(0)}${(m.prenom_membre||'').charAt(0)}`.toUpperCase()}</div>
                  <div className="text-sm"><span className="font-semibold capitalize">{m.nom_membre}</span>{' '}<span className="capitalize text-slate-600 dark:text-slate-300">{m.prenom_membre}</span></div>
                </div></td>
                <td className="px-5 py-3 text-center text-sm">{m.annee_naissance||'----'}</td>
                <td className="px-5 py-3 text-center text-sm">{m.sexe}</td>
                <td className="px-5 py-3 text-center">{m.chef?<span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-400"><CheckCircle2 size={13}/>Chef</span>:<span className="text-sm text-slate-500">Membre</span>}</td>
                <td className="px-5 py-3 text-sm">{m.num_menage||'-'}</td>
                {isAdmin&&<td className="px-5 py-3 text-sm">{getCommuneName(m.commune_id)}</td>}
                <td className="px-5 py-3"><div className="flex justify-end gap-2">
                  <button type="button" onClick={()=>openEditModal(m)} title="Modifier" className="p-2 rounded-md text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800"><Edit2 size={17}/></button>
                  <button type="button" onClick={()=>handleDelete(m.nummembre)} title="Supprimer" className="p-2 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"><Trash2 size={17}/></button>
                </div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>
      {showModal&&<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
        <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div><h2 className="text-lg font-semibold">{editingId!==null?'Modifier un membre':'Nouveau membre'}</h2><p className="text-sm text-slate-500">Fiche de saisie des données</p></div>
            <button type="button" onClick={closeModal} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18}/></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelClass}>Nom de famille *</label><input type="text" required className={fieldClass} value={formData.nom_membre} onChange={e=>updateForm('nom_membre',e.target.value)}/></div>
              <div><label className={labelClass}>Prénoms</label><input type="text" className={fieldClass} value={formData.prenom_membre} onChange={e=>updateForm('prenom_membre',e.target.value)}/></div>
              <div><label className={labelClass}>Année de naissance</label><input type="number" className={fieldClass} value={formData.annee_naissance} onChange={e=>updateForm('annee_naissance',e.target.value)}/></div>
              <div><label className={labelClass}>Sexe</label><select className={fieldClass} value={formData.sexe} onChange={e=>updateForm('sexe',e.target.value)}><option value="Homme">Homme</option><option value="Femme">Femme</option></select></div>
              {isAdmin&&editingId===null&&<div className="sm:col-span-2"><label className={labelClass}>Commune *</label>
                <select required className={fieldClass} value={formData.commune_id} disabled={loadingCommunes} onChange={e=>setFormData(f=>({...f,commune_id:e.target.value,num_menage:''}))}>
                  <option value="">Sélectionner une commune</option>
                  {communes.map(c=><option key={c.id??c.id_commune} value={c.id??c.id_commune}>{c.nom??c.nom_commune}</option>)}
                </select>
              </div>}
              <div className="sm:col-span-2"><label className={labelClass}>Gestion du ménage</label>
                {editingId!==null?<div><input type="text" disabled value={formData.num_menage||''} className={`${fieldClass} opacity-70`}/><p className="text-xs text-slate-500 mt-1">Le numéro du ménage ne peut pas être modifié ici.</p></div>:
                <div className="space-y-3">
                  <select className={fieldClass} value={formData.mode_menage} onChange={e=>setFormData(f=>({...f,mode_menage:e.target.value,num_menage:''}))}>
                    <option value="nouveau">Nouveau ménage — Numéro automatique</option><option value="existant">Ménage existant</option>
                  </select>
                  {formData.mode_menage==='existant'?<div><label className={labelClass}>Numéro du ménage existant *</label><input type="number" min="1" step="1" required className={fieldClass} value={formData.num_menage} onChange={e=>updateForm('num_menage',e.target.value)} placeholder="Exemple : 12"/></div>:
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">Le numéro du nouveau ménage sera généré automatiquement.</p>}
                </div>}
              </div>
              <div className="sm:col-span-2"><label className="flex items-center gap-3 h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer">
                <input type="checkbox" checked={Boolean(formData.chef)} onChange={e=>updateForm('chef',e.target.checked)} className="w-4 h-4 accent-emerald-700"/><span className="text-sm">Chef de ménage ?</span>
              </label></div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="h-10 px-4 border border-slate-300 dark:border-slate-700 rounded-lg text-sm">Annuler</button>
              <button type="submit" disabled={loading} className="h-10 px-5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-lg flex items-center gap-2 text-sm font-medium"><Save size={16}/>{editingId!==null?'Mettre à jour':'Enregistrer'}</button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
};
export default MembresList;
