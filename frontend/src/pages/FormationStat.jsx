import React,{useState,useEffect} from 'react';
import axios from '../api/axios';
import {Activity,GraduationCap,ShieldCheck,Heart,Leaf,Users,BarChart3,PieChart,ArrowLeft} from 'lucide-react';
import {useNavigate,useSearchParams} from 'react-router-dom';

// Deux couleurs seulement pour toute la page : bleu = hommes, rose = femmes
const COLOR_H='#0284c7';
const COLOR_F='#f43f5e';

// Part en pourcentage (la somme fait toujours 100 quand il y a des données)
const getShares=(h,f)=>{
  const total=h+f;
  if(total===0)return {total:0,pctH:0,pctF:0};
  const pctH=Math.round((h/total)*100);
  return {total,pctH,pctF:100-pctH};
};

/* ---------- Diagrammes (SVG, sans dépendance externe) ---------- */

// Anneau : part hommes / femmes, total au centre
const DonutChart=({h,f})=>{
  const {total,pctH,pctF}=getShares(h,f);
  const r=44;
  const C=2*Math.PI*r;
  const lenH=(pctH/100)*C;
  const lenF=(pctF/100)*C;
  return (
    <svg viewBox="0 0 120 120" className="w-44 h-44" role="img" aria-label={`Hommes ${h}, Femmes ${f}`}>
      <g transform="rotate(-90 60 60)" fill="none" strokeWidth="16">
        <circle cx="60" cy="60" r={r} className="stroke-slate-100 dark:stroke-slate-800"/>
        <circle cx="60" cy="60" r={r} stroke={COLOR_H} strokeDasharray={`${lenH} ${C}`}/>
        <circle cx="60" cy="60" r={r} stroke={COLOR_F} strokeDasharray={`${lenF} ${C}`} strokeDashoffset={-lenH}/>
      </g>
      <text x="60" y="60" textAnchor="middle" fontSize="22" fontWeight="600" className="fill-slate-900 dark:fill-white">{total}</text>
      <text x="60" y="76" textAnchor="middle" fontSize="9" className="fill-slate-500 dark:fill-slate-400">Total</text>
    </svg>
  );
};

// Barres verticales : valeurs comparées
const BarChartV=({h,f})=>{
  const max=Math.max(h,f,1);
  const baseY=118;
  const maxH=80;
  const hH=h>0?Math.max((h/max)*maxH,3):0;
  const hF=f>0?Math.max((f/max)*maxH,3):0;
  return (
    <svg viewBox="0 0 220 150" className="w-full max-w-[280px] h-44" role="img" aria-label={`Hommes ${h}, Femmes ${f}`}>
      <line x1="16" y1={baseY} x2="204" y2={baseY} strokeWidth="1" className="stroke-slate-200 dark:stroke-slate-700"/>
      <rect x="50" y={baseY-hH} width="46" height={hH} rx="4" fill={COLOR_H}/>
      <rect x="124" y={baseY-hF} width="46" height={hF} rx="4" fill={COLOR_F}/>
      <text x="73" y={baseY-hH-7} textAnchor="middle" fontSize="14" fontWeight="600" className="fill-slate-900 dark:fill-white">{h}</text>
      <text x="147" y={baseY-hF-7} textAnchor="middle" fontSize="14" fontWeight="600" className="fill-slate-900 dark:fill-white">{f}</text>
      <text x="73" y="136" textAnchor="middle" fontSize="11" className="fill-slate-500 dark:fill-slate-400">Hommes</text>
      <text x="147" y="136" textAnchor="middle" fontSize="11" className="fill-slate-500 dark:fill-slate-400">Femmes</text>
    </svg>
  );
};

// Barre empilée à 100 %
const StackedBar=({h,f})=>{
  const {pctH,pctF}=getShares(h,f);
  return (
    <div className="w-full px-1" role="img" aria-label={`Hommes ${pctH}%, Femmes ${pctF}%`}>
      <div className="flex h-11 w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
        {pctH>0&&(
          <div className="h-full flex items-center justify-center text-sm font-semibold text-white tabular-nums" style={{width:`${pctH}%`,backgroundColor:COLOR_H}}>
            {pctH>=12?`${pctH}%`:''}
          </div>
        )}
        {pctF>0&&(
          <div className="h-full flex items-center justify-center text-sm font-semibold text-white tabular-nums" style={{width:`${pctF}%`,backgroundColor:COLOR_F}}>
            {pctF>=12?`${pctF}%`:''}
          </div>
        )}
      </div>
      <div className="flex justify-between mt-2 text-xs text-slate-400 dark:text-slate-500 tabular-nums">
        <span>0%</span><span>50%</span><span>100%</span>
      </div>
    </div>
  );
};

// Jauge en demi-cercle
const GaugeChart=({h,f})=>{
  const {total,pctH,pctF}=getShares(h,f);
  const r=50;
  const L=Math.PI*r;
  const lenH=(pctH/100)*L;
  const lenF=(pctF/100)*L;
  const d='M 10 64 A 50 50 0 0 1 110 64';
  return (
    <svg viewBox="0 0 120 78" className="w-56 h-36" role="img" aria-label={`Hommes ${h}, Femmes ${f}`}>
      <g fill="none" strokeWidth="16">
        <path d={d} className="stroke-slate-100 dark:stroke-slate-800"/>
        <path d={d} stroke={COLOR_H} strokeDasharray={`${lenH} ${L}`}/>
        <path d={d} stroke={COLOR_F} strokeDasharray={`${lenF} ${L}`} strokeDashoffset={-lenH}/>
      </g>
      <text x="60" y="58" textAnchor="middle" fontSize="22" fontWeight="600" className="fill-slate-900 dark:fill-white">{total}</text>
      <text x="60" y="71" textAnchor="middle" fontSize="8" className="fill-slate-500 dark:fill-slate-400">Total</text>
    </svg>
  );
};

// Anneaux concentriques : un anneau par genre
const RingsChart=({h,f})=>{
  const {total,pctH,pctF}=getShares(h,f);
  const r1=50;
  const r2=35;
  const C1=2*Math.PI*r1;
  const C2=2*Math.PI*r2;
  return (
    <svg viewBox="0 0 120 120" className="w-44 h-44" role="img" aria-label={`Hommes ${h}, Femmes ${f}`}>
      <g transform="rotate(-90 60 60)" fill="none" strokeWidth="11" strokeLinecap="round">
        <circle cx="60" cy="60" r={r1} className="stroke-slate-100 dark:stroke-slate-800"/>
        <circle cx="60" cy="60" r={r2} className="stroke-slate-100 dark:stroke-slate-800"/>
        {pctH>0&&<circle cx="60" cy="60" r={r1} stroke={COLOR_H} strokeDasharray={`${(pctH/100)*C1} ${C1}`}/>}
        {pctF>0&&<circle cx="60" cy="60" r={r2} stroke={COLOR_F} strokeDasharray={`${(pctF/100)*C2} ${C2}`}/>}
      </g>
      <text x="60" y="64" textAnchor="middle" fontSize="18" fontWeight="600" className="fill-slate-900 dark:fill-white">{total}</text>
    </svg>
  );
};

const charts={donut:DonutChart,bar:BarChartV,stacked:StackedBar,gauge:GaugeChart,rings:RingsChart};

/* ---------- Carte de statistique ---------- */

const StatCard=({title,h,f,icon:Icon,chart})=>{
  const totalHomme=parseInt(h)||0;
  const totalFemme=parseInt(f)||0;
  const {total,pctH,pctF}=getShares(totalHomme,totalFemme);
  const Chart=charts[chart]||DonutChart;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
      <div className="px-5 pt-5 flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60">
          <Icon size={18}/>
        </div>
        <h3 className="text-[15px] font-display font-semibold text-slate-900 dark:text-white leading-tight">{title}</h3>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-5 min-h-[200px]">
        {total>0?<Chart h={totalHomme} f={totalFemme}/>:<p className="text-sm text-slate-400 dark:text-slate-500">Aucune donnée</p>}
      </div>

      <div className="grid grid-cols-2 border-t border-slate-100 dark:border-slate-800">
        <div className="px-5 py-3.5">
          <span className="flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400"><span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:COLOR_H}}/>Hommes</span>
          <p className="mt-1 text-xl font-display font-semibold text-slate-900 dark:text-white tabular-nums">{totalHomme}<span className="ml-1.5 text-[13px] font-normal text-slate-400 dark:text-slate-500">{total>0?`${pctH}%`:''}</span></p>
        </div>
        <div className="px-5 py-3.5 border-l border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400"><span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:COLOR_F}}/>Femmes</span>
          <p className="mt-1 text-xl font-display font-semibold text-slate-900 dark:text-white tabular-nums">{totalFemme}<span className="ml-1.5 text-[13px] font-normal text-slate-400 dark:text-slate-500">{total>0?`${pctF}%`:''}</span></p>
        </div>
      </div>
    </div>
  );
};

/* ---------- Comparaison de toutes les formations ---------- */

const OverviewChart=({items})=>{
  const rows=items.map(it=>({title:it.title,h:parseInt(it.h)||0,f:parseInt(it.f)||0}));
  const max=Math.max(...rows.flatMap(r=>[r.h,r.f]),1);
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white">Comparaison des formations</h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Nombre de personnes formées, hommes et femmes, pour chaque thème.</p>
        </div>
        <div className="flex items-center gap-4 text-[13px] text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:COLOR_H}}/>Hommes</span>
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:COLOR_F}}/>Femmes</span>
        </div>
      </div>

      <div className="space-y-4">
        {rows.map(r=>(
          <div key={r.title} className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-4 gap-y-1.5 items-center">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{r.title}</span>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{width:`${(r.h/max)*100}%`,backgroundColor:COLOR_H}}/>
                </div>
                <span className="w-8 text-right text-sm font-medium text-slate-700 dark:text-slate-200 tabular-nums">{r.h}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{width:`${(r.f/max)*100}%`,backgroundColor:COLOR_F}}/>
                </div>
                <span className="w-8 text-right text-sm font-medium text-slate-700 dark:text-slate-200 tabular-nums">{r.f}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const focusRing='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900';

const FormationStats=()=>{
  const [stats,setStats]=useState(null);
  const [loading,setLoading]=useState(true);
  const navigate=useNavigate();
  const [searchParams,setSearchParams]=useSearchParams();
  const communeId=searchParams.get('commune_id')||'';
  const [isAdmin,setIsAdmin]=useState(false);
  const [communes,setCommunes]=useState([]);
  const [error,setError]=useState('');
  useEffect(()=>{try{setIsAdmin(JSON.parse(localStorage.getItem('user')||'{}').role==='admin')}catch{}},[]);
  useEffect(()=>{if(!isAdmin)return;axios.get('/communes').then(res=>{const list=Array.isArray(res.data)?res.data:res.data?.communes||res.data?.data||[];if(Array.isArray(list))setCommunes(list)}).catch(()=>{})},[isAdmin]);
  useEffect(()=>{
    const fetchStats=async()=>{
      try{
        setLoading(true);
        const token=localStorage.getItem('token');
        const config={headers:{Authorization:`Bearer ${token}`}};
        const res=await axios.get('/formations/stats-details',{...config,params:communeId?{commune_id:communeId}:{}});
        setStats(res.data);
      }catch(err){console.error('Erreur stats détaillée:',err);setError(err.response?.data?.message||'Impossible de charger les statistiques');setStats(null)}finally{setLoading(false)}
    };
    setError('');fetchStats();
  },[communeId]);

  const items=[
    {title:'Genre & Social',h:stats?.genre_h,f:stats?.genre_f,icon:Users,chart:'donut'},
    {title:'Agroécologie',h:stats?.agroeco_h,f:stats?.agroeco_f,icon:Leaf,chart:'bar'},
    {title:'Production semence',h:stats?.semence_h,f:stats?.semence_f,icon:Activity,chart:'stacked'},
    {title:'Nutrition',h:stats?.nutrition_h,f:stats?.nutrition_f,icon:Heart,chart:'gauge'},
    {title:'Conservation produit',h:stats?.conservation_h,f:stats?.conservation_f,icon:ShieldCheck,chart:'rings'},
    {title:'Transformation produit',h:stats?.transformation_h,f:stats?.transformation_f,icon:BarChart3,chart:'bar'},
    {title:'Gestion simplifiée',h:stats?.gestion_h,f:stats?.gestion_f,icon:PieChart,chart:'gauge'},
    {title:'EPRACC',h:stats?.epracc_h,f:stats?.epracc_f,icon:GraduationCap,chart:'donut'}
  ];

  return (
    <div className="formation-stats flex flex-col h-full min-h-0 bg-slate-50 dark:bg-slate-950 transition-colors text-slate-900 dark:text-slate-100 overflow-hidden relative antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .formation-stats{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
        .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
        .formation-stats svg text{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
      `}</style>

      <header className="shrink-0 px-4 md:px-6 py-4 md:py-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60">
            <GraduationCap size={20} strokeWidth={2}/>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-display font-semibold text-slate-900 dark:text-white leading-tight">Statistiques des formations</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Répartition par genre des formations.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
        {isAdmin&&<select aria-label="Filtrer les statistiques par commune" value={communeId} onChange={e=>setSearchParams(e.target.value?{commune_id:e.target.value}:{})} className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
          <option value="">Toutes les communes</option>
          {communes.map(c=>{const id=c.id_commune??c.commune_id??c.id;return <option key={id} value={id}>{c.nom_commune||c.nom||`Commune ${id}`}</option>})}
        </select>}
        <button type="button" onClick={()=>navigate(-1)} className={`h-10 px-3.5 rounded-lg inline-flex items-center gap-2 text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${focusRing}`}><ArrowLeft size={16} className="text-slate-500 dark:text-slate-400"/>Retour</button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-5">
        <div className="max-w-7xl mx-auto space-y-5">
          {loading?<div className="flex items-center justify-center gap-3 py-20 text-sm text-slate-500 dark:text-slate-400"><Activity size={22} className="animate-spin text-emerald-600"/>Chargement des statistiques...</div>:error?<p role="alert" className="text-red-600 text-sm">{error}</p>:<OverviewChart items={items}/>}

          {!loading&&!error&&<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {items.map(it=>(
              <StatCard key={it.title} title={it.title} h={it.h} f={it.f} icon={it.icon} chart={it.chart}/>
            ))}
          </div>}
        </div>
      </main>
    </div>
  );
};
export default FormationStats;
