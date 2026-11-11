import React,{useEffect,useState,useCallback,useMemo} from 'react';
import axios from '../api/axios';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,Legend,ResponsiveContainer} from 'recharts';
import {FileSpreadsheet,FileText,RefreshCw,Save,BarChart3,MapPin} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const now=new Date();
const n=v=>v==null?'—':Number(v).toLocaleString('fr-FR');
const percent=v=>v==null?'—':`${n(v)} %`;

export default function RapportsPage(){
  const [annee,setAnnee]=useState(now.getFullYear()),[mois,setMois]=useState(now.getMonth()+1),[commune,setCommune]=useState('');
  const [data,setData]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState(''),[saving,setSaving]=useState('');

  const load=useCallback(async signal=>{
    try{
      setLoading(true);setError('');
      const {data:d}=await axios.get('/rapports',{
        params:{annee,mois,...(commune?{commune_id:commune}:{})},signal
      });
      if(!signal?.aborted)setData(d);
    }catch(e){
      if(!signal?.aborted)setError(e.response?.data?.message||'Impossible de charger le rapport');
    }finally{
      if(!signal?.aborted)setLoading(false);
    }
  },[annee,mois,commune]);

  useEffect(()=>{
    const c=new AbortController();
    load(c.signal);
    return()=>c.abort();
  },[load]);

  const rows=useMemo(()=>data?.rapports?.flatMap(r=>r.indicateurs.map(i=>({commune:r.commune,...i})))||[],[data]);

  const totals=useMemo(()=>{
    const keys=['gsf','membres_total','reseaux','genre_total','epracc_total'];
    return keys.map(key=>{
      const items=rows.filter(r=>r.key===key);
      const obj=items.length&&items.every(x=>x.objectif!=null)?items.reduce((s,x)=>s+x.objectif,0):null;
      const resultat=items.reduce((s,x)=>s+x.resultat,0);
      return {key,label:items[0]?.label||key,objectif:obj,resultat,taux:obj>0?Math.round(resultat/obj*10000)/100:null};
    });
  },[rows]);

  const chart=totals.map(t=>({name:t.label.replace(' - Total',''),Objectif:t.objectif,Actuel:t.resultat}));
  const exportRows=rows.map(r=>({
    Commune:r.commune,Indicateur:r.label,Objectif:r.objectif??'',
    'Résultat actuel':r.resultat,'Taux (%)':r.taux??''
  }));

  const excel=()=>{
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(exportRows),'Quantitatif');
    const q=(data?.qualitatifs||[]).map(x=>({
      Commune:data.communes.find(c=>c.id_commune===x.commune_id)?.nom_commune||x.commune_id,
      Catégorie:x.categorie,Description:x.description
    }));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(q.length?q:[{Information:'Aucune donnée qualitative saisie'}]),'Qualitatif');
    XLSX.writeFile(wb,`Rapport_ONG_${annee}_${mois}.xlsx`);
  };

  const pdf=()=>{
    const doc=new jsPDF({orientation:'landscape'});
    doc.setFontSize(17);
    doc.text('ONG TSINJO AINA - Rapport de suivi',14,17);
    doc.setFontSize(10);
    doc.text(`Année : ${annee} | Mois qualitatif : ${mois} | Résultats : état actuel de la base`,14,25);
    autoTable(doc,{
      startY:31,
      head:[['Commune','Indicateur','Objectif','Actuel','Taux']],
      body:rows.map(r=>[r.commune,r.label,n(r.objectif),n(r.resultat),percent(r.taux)]),
      styles:{fontSize:8},headStyles:{fillColor:[5,120,94]}
    });
    let y=doc.lastAutoTable.finalY+12;
    if(y>175){doc.addPage();y=18;}
    doc.setFontSize(11);
    doc.text('Résultats qualitatifs',14,y);
    y+=7;
    const q=(data?.qualitatifs||[]).map(x=>[
      data.communes.find(c=>c.id_commune===x.commune_id)?.nom_commune||String(x.commune_id),
      x.categorie,x.description
    ]);
    autoTable(doc,{
      startY:y,
      head:[['Commune','Catégorie','Description']],
      body:q.length?q:[['—','—','Aucune saisie']],
      styles:{fontSize:8},headStyles:{fillColor:[5,120,94]}
    });
    doc.save(`Rapport_ONG_${annee}_${mois}.pdf`);
  };

  const saveObjectif=async(r,i)=>{
    const input=window.prompt(`Objectif ${annee} - ${r.commune} - ${i.label}`,i.objectif??'0');
    if(input===null)return;
    const valeur=Number(input.replace(',','.'));
    if(!Number.isFinite(valeur)||valeur<0){alert('Valeur invalide');return;}
    try{
      setSaving(`${r.commune_id}:${i.key}`);
      await axios.put('/rapports/objectifs',{annee,commune_id:r.commune_id,indicateur:i.key,valeur});
      await load();
    }catch(e){
      alert(e.response?.data?.message||'Erreur enregistrement');
    }finally{setSaving('');}
  };

  const saveQualitatif=async(r,category)=>{
    const previous=data.qualitatifs.find(x=>x.commune_id===r.commune_id&&x.categorie===category.key)?.description||'';
    const description=window.prompt(`${r.commune} - ${category.label}`,previous);
    if(description===null)return;
    try{
      setSaving(`${r.commune_id}:${category.key}`);
      await axios.put('/rapports/qualitatifs',{
        annee,mois,commune_id:r.commune_id,categorie:category.key,description
      });
      await load();
    }catch(e){
      alert(e.response?.data?.message||'Erreur enregistrement');
    }finally{setSaving('');}
  };

  const card='bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm';

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 p-4 md:p-6 text-slate-900 dark:text-white space-y-5">
      <div className="flex flex-wrap justify-between gap-4 items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="text-emerald-600"/> Rapports & Statistiques
          </h1>
          <p className="text-sm text-slate-500 mt-1">Indicateurs automatiques et suivi des objectifs</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>load()} className="btn" title="Actualiser"><RefreshCw size={17}/></button>
          <button onClick={pdf} disabled={!rows.length} className="btn"><FileText size={16}/> PDF</button>
          <button onClick={excel} disabled={!rows.length} className="btn"><FileSpreadsheet size={16}/> Excel</button>
        </div>
      </div>

      <div className={`${card} p-4 flex flex-wrap gap-3 items-end`}>
        <label className="text-xs">Année
          <input type="number" min="2020" max="2100" value={annee}
            onChange={e=>setAnnee(Number(e.target.value))} className="field w-28"/>
        </label>
        <label className="text-xs">Mois (qualitatif)
          <select value={mois} onChange={e=>setMois(Number(e.target.value))} className="field">
            {Array.from({length:12},(_,i)=><option key={i} value={i+1}>
              {new Date(2026,i,1).toLocaleString('fr-FR',{month:'long'})}
            </option>)}
          </select>
        </label>
        {data?.isAdmin&&(
          <label className="text-xs flex-1 min-w-48">
            <span className="flex items-center gap-1"><MapPin size={12}/> Commune</span>
            <select value={commune} onChange={e=>setCommune(e.target.value)} className="field">
              <option value="">Toutes les communes</option>
              {data.communes.map(c=><option key={c.id_commune} value={c.id_commune}>{c.nom_commune}</option>)}
            </select>
          </label>
        )}
      </div>

      {error&&<div className="rounded-lg bg-red-50 text-red-700 p-3">{error}</div>}
      {data?.avertissement&&(
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 p-3 text-sm">
          {data.avertissement}
        </div>
      )}
      {loading&&<p className="text-sm text-emerald-600">Chargement…</p>}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {totals.map(t=>(
          <div key={t.key} className={`${card} p-4`}>
            <p className="text-xs text-slate-500">{t.label}</p>
            <p className="text-2xl font-bold mt-2">{n(t.resultat)}</p>
            <p className="text-xs text-slate-500">Objectif : {n(t.objectif)}</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">{percent(t.taux)}</p>
          </div>
        ))}
      </div>

      <section className={`${card} p-4`}>
        <h2 className="font-semibold mb-4">Objectifs et résultats actuels</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{left:10,right:10,bottom:30}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="name" tick={{fontSize:11}} angle={-20} textAnchor="end"/>
              <YAxis/><Tooltip/><Legend/>
              <Bar dataKey="Objectif" fill="#38bdf8"/>
              <Bar dataKey="Actuel" fill="#10b981"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={`${card} overflow-hidden`}>
        <h2 className="font-semibold p-4 border-b dark:border-slate-800">Données quantitatives</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                {['Commune','Indicateur','Objectif','Actuel','Réalisation','Action'].map(x=>(
                  <th key={x} className="text-left px-4 py-3 whitespace-nowrap">{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.rapports||[]).flatMap(r=>r.indicateurs.map(i=>(
                <tr key={`${r.commune_id}:${i.key}`} className="border-t dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2">{r.commune}</td>
                  <td className="px-4 py-2">{i.label}</td>
                  <td className="px-4 py-2">{n(i.objectif)}</td>
                  <td className="px-4 py-2 font-semibold">{n(i.resultat)}</td>
                  <td className="px-4 py-2">{percent(i.taux)}</td>
                  <td className="px-4 py-2">
                    {data.isAdmin&&(
                      <button disabled={!!saving} onClick={()=>saveObjectif(r,i)}
                        className="text-emerald-700 hover:underline text-xs flex gap-1 items-center">
                        <Save size={13}/> Objectif
                      </button>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${card} p-4`}>
        <h2 className="font-semibold mb-3">Données qualitatives</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {(data?.rapports||[]).flatMap(r=>(data?.categories||[]).map(c=>{
            const val=data.qualitatifs.find(x=>x.commune_id===r.commune_id&&x.categorie===c.key)?.description||'';
            return (
              <div key={`${r.commune_id}:${c.key}`} className="border dark:border-slate-800 rounded-lg p-3">
                <p className="text-xs text-emerald-700 font-semibold">{r.commune}</p>
                <h3 className="font-medium text-sm mt-1">{c.label}</h3>
                <p className="text-sm text-slate-500 mt-2 whitespace-pre-wrap">{val||'Aucune donnée saisie'}</p>
                <button disabled={!!saving} onClick={()=>saveQualitatif(r,c)}
                  className="text-xs text-emerald-700 mt-3 flex gap-1 items-center">
                  <Save size={13}/> Modifier
                </button>
              </div>
            );
          }))}
        </div>
      </section>

      <style>{`
        .btn{display:inline-flex;align-items:center;gap:6px;padding:9px 13px;border-radius:8px;background:#047857;color:white;font-size:13px}
        .btn:disabled{opacity:.4}
        .field{display:block;margin-top:5px;padding:9px 10px;border-radius:8px;border:1px solid #cbd5e1;background:transparent;color:inherit;width:100%}
      `}</style>
    </div>
  );
}