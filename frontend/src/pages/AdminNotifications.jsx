
import React,{useEffect,useState} from 'react';
import {io} from 'socket.io-client';
import axios from '../api/axios';
import {Trash2,RotateCcw,ShieldCheck,ChevronDown,ChevronUp,Search,RefreshCw,Clock,User,Layers,Info,CheckSquare,Square,Mail} from 'lucide-react';
import Swal from 'sweetalert2';

const Toast=Swal.mixin({
  toast:true,
  position:'top-end',
  showConfirmButton:false,
  timer:2500,
  timerProgressBar:true,
  didOpen:t=>{
    t.addEventListener('mouseenter',Swal.stopTimer);
    t.addEventListener('mouseleave',Swal.resumeTimer);
  }
});

const AdminNotifications=()=>{
  const [logs,setLogs]=useState([]);
  const [filteredLogs,setFilteredLogs]=useState([]);
  const [searchTerm,setSearchTerm]=useState('');
  const [expanded,setExpanded]=useState(null);
  const [selected,setSelected]=useState([]);
  const [loading,setLoading]=useState(true);
  const [deleting,setDeleting]=useState(false);

  const fetchHistory=async()=>{
    try{
      setLoading(true);
      const response=await axios.get('/audit-logs');
      const data=Array.isArray(response.data)?response.data:[];
      setLogs(data);
      setFilteredLogs(data);
      setSelected([]);
    }catch(error){
      setLogs([]);
      setFilteredLogs([]);
      Toast.fire({icon:'error',title:'Erreur de chargement des logs'});
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{
    fetchHistory();
    const socket=io(import.meta.env.VITE_SOCKET_URL,{transports:['websocket']});
    socket.on('admin_alert',newData=>{
      setLogs(prev=>[newData,...prev].slice(0,50));
    });
    return()=>socket.disconnect();
  },[]);

  useEffect(()=>{
    const results=logs.filter(log=>{
      const userName=log.User?.name||'Administrateur';
      const tableName=log.table_name?.split('/')[2]||'inconnu';
      const action=log.action_type||'';
      return `${userName} ${tableName} ${action}`.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredLogs(results);
  },[searchTerm,logs]);

  const formatKey=key=>key.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase());

  const parseDetails=details=>{
    if(!details)return{};
    if(typeof details==='object')return details;
    try{return JSON.parse(details)}catch{return{}}
  };

  const formatValue=value=>{
    if(value===null||value===undefined||value==='')return'vide';
    if(typeof value==='boolean')return value?'Oui':'Non';
    if(typeof value==='object'){
      try{return JSON.stringify(value)}catch{return String(value)}
    }
    return String(value);
  };

  const getEntityName=(details,log)=>details.entity||details.nom||details.name||details.message||`ID: ${log.target_id}`;

  const getChanges=details=>{
    if(details.changes&&typeof details.changes==='object')return details.changes;
    const result={};
    Object.entries(details).forEach(([key,value])=>{
      if(!['nom','message','entity','changes','data','deleted_data'].includes(key)&&value&&typeof value==='object'&&('old'in value||'new'in value))result[key]=value;
    });
    return result;
  };

  const getDeletedData=details=>details.deleted_data&&typeof details.deleted_data==='object'?details.deleted_data:{};
  const getCreatedData=details=>details.data&&typeof details.data==='object'?details.data:{};

  const toggleSelect=id=>{
    setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  };

  const selectAll=()=>{
    if(selected.length===filteredLogs.length)setSelected([]);
    else setSelected(filteredLogs.map(log=>log.id));
  };

  const handleAction=async(actionType,log,e)=>{
    e.stopPropagation();
    const isDark=document.documentElement.classList.contains('dark');

    const result=await Swal.fire({
      title:'Confirmer ?',
      text:actionType==='delete'?"Voulez-vous supprimer cette trace ?":"Voulez-vous restaurer cet élément ?",
      icon:'question',
      showCancelButton:true,
      confirmButtonColor:actionType==='delete'?'#ef4444':'#0284c7',
      cancelButtonColor:'#64748b',
      confirmButtonText:'Oui, confirmer',
      cancelButtonText:'Annuler',
      background:isDark?'#0f172a':'#ffffff',
      color:isDark?'#ffffff':'#0f172a',
      customClass:{popup:'rounded-2xl border border-emerald-100 dark:border-slate-800 text-sm font-medium shadow-xl p-4'}
    });

    if(!result.isConfirmed)return;

    try{
      await axios.post(`/audit-logs/${actionType}/${log.id}`);
      Toast.fire({icon:'success',title:actionType==='delete'?'Trace supprimée avec succès':'Élément restauré avec succès'});

      if(actionType==='delete'){
        setLogs(prev=>prev.filter(l=>l.id!==log.id));
        setSelected(prev=>prev.filter(id=>id!==log.id));
      }
    }catch(error){
      Toast.fire({icon:'error',title:error.response?.data?.message||'Une erreur est survenue'});
    }
  };

  const deleteSelected=async()=>{
    if(!selected.length)return;

    const isDark=document.documentElement.classList.contains('dark');

    const result=await Swal.fire({
      title:'Supprimer la sélection ?',
      text:`Vous êtes sur le point de supprimer ${selected.length} trace(s).`,
      icon:'warning',
      showCancelButton:true,
      confirmButtonColor:'#ef4444',
      cancelButtonColor:'#64748b',
      confirmButtonText:'Oui, supprimer',
      cancelButtonText:'Annuler',
      background:isDark?'#0f172a':'#ffffff',
      color:isDark?'#ffffff':'#0f172a',
      customClass:{popup:'rounded-2xl border border-rose-100 dark:border-slate-800 text-sm font-medium shadow-xl p-4'}
    });

    if(!result.isConfirmed)return;

    try{
      setDeleting(true);
      await Promise.all(selected.map(id=>axios.post(`/audit-logs/delete/${id}`)));
      setLogs(prev=>prev.filter(log=>!selected.includes(log.id)));
      setSelected([]);
      Toast.fire({icon:'success',title:'Sélection supprimée avec succès'});
    }catch(error){
      Toast.fire({icon:'error',title:'Erreur lors de la suppression'});
    }finally{
      setDeleting(false);
    }
  };

  const actionLabel={
    POST:'Ajout',
    PUT:'Modification',
    DELETE:'Suppression'
  };

  return(
    <div className="w-full min-h-full p-4 md:p-6 font-body space-y-6 text-black dark:text-white transition-colors">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');.font-body{font-family:'DM Sans',sans-serif}.font-display{font-family:'Manrope',sans-serif}`}</style>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-sky-500 text-white rounded-2xl shadow-sm">
            <ShieldCheck size={24}/>
          </div>
          <div>
            <h1 className="text-lg font-display font-extrabold text-slate-900 dark:text-white">Journal d'Audit</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Suivi des modifications et activités de la plateforme.</p>
          </div>
        </div>

        <button onClick={fetchHistory} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-sm border border-emerald-100 dark:border-emerald-900/40 transition-all w-fit">
          <RefreshCw size={17} className={loading?'animate-spin':''}/>
          Actualiser
        </button>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/20 dark:to-sky-950/20 border border-emerald-200/50 dark:border-emerald-900/40 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/60 dark:bg-white/5 rounded-lg shrink-0">
            <Info size={18} className="text-emerald-600 dark:text-emerald-400"/>
          </div>
          <div className="space-y-2 text-sm">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-100 font-display">Guide d'utilisation</h4>
            <p className="text-emerald-800/90 dark:text-emerald-300/80">Sélectionnez les messages à supprimer, ou utilisez « Sélectionner tout ». Cliquez sur un message pour afficher ses détails.</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18}/>
        <input
          type="text"
          placeholder="Rechercher par utilisateur, table ou action..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium transition-all"
          value={searchTerm}
          onChange={e=>setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-4 md:px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 flex flex-wrap items-center justify-between gap-3">
          <button onClick={selectAll} className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            {selected.length===filteredLogs.length&&filteredLogs.length>0?<CheckSquare size={19} className="text-emerald-500"/>:<Square size={19}/>}
            {selected.length===filteredLogs.length&&filteredLogs.length>0?'Désélectionner tout':'Sélectionner tout'}
          </button>

          <div className="flex items-center gap-3">
            {selected.length>0&&(
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {selected.length} sélectionné(s)
              </span>
            )}
            <button
              onClick={deleteSelected}
              disabled={!selected.length||deleting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Trash2 size={16}/>
              {deleting?'Suppression...':'Supprimer la sélection'}
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading?(
            <div className="p-14 text-center text-emerald-500"><RefreshCw size={30} className="animate-spin inline"/></div>
          ):filteredLogs.length===0?(
            <div className="p-14 text-center text-slate-500 dark:text-slate-400 font-medium text-sm">Aucun journal d'audit disponible</div>
          ):(
            filteredLogs.map((log,index)=>{
              const details=parseDetails(log.details);
              const changes=getChanges(details);
              const deletedData=getDeletedData(details);
              const createdData=getCreatedData(details);
              const isExpanded=expanded===index;
              const isSelected=selected.includes(log.id);
              const userName=log.User?.name||'Administrateur';
              const tableName=log.table_name?.split('/')[2]||'inconnu';
              const entityName=getEntityName(details,log);

              return(
                <div key={log.id||index} className={`transition-all ${isSelected?'bg-emerald-50/60 dark:bg-emerald-950/20':'bg-white dark:bg-slate-900/40'} hover:bg-slate-50 dark:hover:bg-slate-800/50`}>
                  <div className="flex items-start gap-3 px-4 md:px-5 py-4">
                    <button onClick={e=>{e.stopPropagation();toggleSelect(log.id)}} className="mt-1 shrink-0 text-slate-400 hover:text-emerald-500 transition-colors">
                      {isSelected?<CheckSquare size={19} className="text-emerald-500"/>:<Square size={19}/>}
                    </button>

                    <button onClick={()=>setExpanded(isExpanded?null:index)} className="flex-1 min-w-0 text-left">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white shrink-0">
                          <Mail size={17}/>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{userName}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${log.action_type==='DELETE'?'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400':'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'}`}>
                                {actionLabel[log.action_type]||log.action_type}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                              <Clock size={13}/>
                              {new Date(log.created_at).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Layers size={14}/>
                            <span className="capitalize">{tableName}</span>
                            <span>•</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{entityName}</span>
                          </div>

                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 truncate">
                            {log.action_type==='DELETE'?'Élément supprimé':log.action_type==='POST'?'Nouvel élément ajouté':'Élément modifié'} dans la table {tableName}.
                          </p>
                        </div>

                        <div className="shrink-0 mt-2 text-slate-400">
                          {isExpanded?<ChevronUp size={18}/>:<ChevronDown size={18}/>}
                        </div>
                      </div>
                    </button>
                  </div>

                  {isExpanded&&(
                    <div className="px-5 md:px-16 pb-5">
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 space-y-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          <strong className="text-emerald-600 dark:text-emerald-400">{userName}</strong> a effectué une action de <strong className="uppercase text-slate-900 dark:text-white">{actionLabel[log.action_type]||log.action_type}</strong> sur <strong className="text-slate-900 dark:text-white">{tableName}</strong> : <strong className="text-emerald-600 dark:text-emerald-400">"{entityName}"</strong>.
                        </p>

                        {log.action_type==='PUT'&&Object.keys(changes).length>0&&(
                          <div className="space-y-2">
                            {Object.entries(changes).map(([key,value])=>(
                              <div key={key} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:justify-between gap-2 text-sm">
                                <span className="text-slate-500 dark:text-slate-400 font-semibold">{formatKey(key)}</span>
                                <div className="flex flex-wrap items-center gap-2 font-mono">
                                  <span className="text-rose-500 line-through break-all">{formatValue(value?.old)}</span>
                                  <span className="text-slate-400">→</span>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold break-all">{formatValue(value?.new)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {log.action_type==='DELETE'&&Object.keys(deletedData).length>0&&(
                          <div className="space-y-2">
                            <h4 className="font-bold text-rose-600 dark:text-rose-400">Informations supprimées</h4>
                            {Object.entries(deletedData).map(([key,value])=>['createdAt','updatedAt','created_at','updated_at'].includes(key)?null:(
                              <div key={key} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40 flex flex-col md:flex-row md:justify-between gap-2 text-sm">
                                <span className="text-slate-500 dark:text-slate-400 font-semibold">{formatKey(key)}</span>
                                <span className="text-rose-600 dark:text-rose-400 font-mono break-all">{formatValue(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {log.action_type==='POST'&&Object.keys(createdData).length>0&&(
                          <div className="space-y-2">
                            <h4 className="font-bold text-emerald-600 dark:text-emerald-400">Informations ajoutées</h4>
                            {Object.entries(createdData).map(([key,value])=>['createdAt','updatedAt','created_at','updated_at','user_id'].includes(key)?null:(
                              <div key={key} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex flex-col md:flex-row md:justify-between gap-2 text-sm">
                                <span className="text-slate-500 dark:text-slate-400 font-semibold">{formatKey(key)}</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-mono break-all">{formatValue(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {log.action_type==='PUT'&&Object.keys(changes).length===0&&(
                          <div className="text-slate-500 dark:text-slate-400">Aucune modification détaillée disponible pour cette trace.</div>
                        )}

                        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
                          {log.action_type==='DELETE'&&(
                            <button onClick={e=>handleAction('restore',log,e)} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-sm rounded-xl border border-emerald-100 dark:border-emerald-900/40 transition-all">
                              <RotateCcw size={16}/>Restaurer
                            </button>
                          )}
                          <button onClick={e=>handleAction('delete',log,e)} className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold text-sm rounded-xl border border-rose-100 dark:border-rose-900/40 transition-all">
                            <Trash2 size={16}/>Supprimer la trace
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
