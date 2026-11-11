import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../api/axios';
import domtoimage from 'dom-to-image-more';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, Building2, Network, ShieldCheck, GraduationCap, PieChart as PieIcon, Activity, Loader2, CalendarDays, Download, AlertTriangle, RefreshCw, Inbox, MapPin } from 'lucide-react';

const COLORS = [
  { top1: '#38bdf8', top2: '#0284c7', side: '#075985' },
  { top1: '#34d399', top2: '#047857', side: '#064e3b' },
  { top1: '#fbbf24', top2: '#d97706', side: '#92400e' },
  { top1: '#94a3b8', top2: '#475569', side: '#1e293b' },
  { top1: '#fb7185', top2: '#e11d48', side: '#9f1239' }
];

const KPI_CONFIG = [
  { key: 'membres', label: 'Membres', icon: Users },
  { key: 'groupes', label: 'Groupes GS', icon: Building2 },
  { key: 'reseaux', label: 'Réseaux', icon: Network },
  { key: 'responsables', label: 'Responsables', icon: ShieldCheck },
  { key: 'formations', label: 'Formations', icon: GraduationCap },
  { key: 'menages', label: 'Ménages', icon: Building2 }
];

const useIsDark = () => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return dark;
};

const ChartCard = ({ id, title, icon: Icon, empty, downloading, onDownload, children }) => (
  <div id={id} className="relative bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[350px]">
    {!empty && (
      <button type="button" data-download-button onClick={() => onDownload(id)} disabled={!!downloading}
        className="absolute top-3.5 right-3.5 z-20 h-8 w-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-emerald-600 flex items-center justify-center disabled:opacity-50"
        title="Télécharger en PNG">
        {downloading === id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
      </button>
    )}
    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4 pr-10 flex items-center gap-2.5">
      <span className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
        <Icon size={16} />
      </span>
      <span className="truncate">{title}</span>
    </h3>
    {empty ? (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
        <Inbox size={24} /><p className="text-xs">Pas encore de données</p>
      </div>
    ) : <div className="flex-1 min-h-0 w-full">{children}</div>}
  </div>
);

const Pie3D = ({ slices }) => {
  const cx = 130, cy = 78, rx = 108, ry = 64, depth = 24;
  const total = slices.reduce((n, s) => n + s.value, 0) || 1;
  const point = (a, dy = 0, k = 1) => [cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a) + dy];
  let angle = -Math.PI / 2;
  const arcs = slices.filter(s => s.value > 0).map(s => {
    const sweep = s.value / total * Math.PI * 2;
    const item = { ...s, a1: angle, a2: angle + sweep };
    angle += sweep;
    return item;
  });
  const full = arcs.length === 1;
  return (
    <svg viewBox="0 0 260 180" className="w-full max-w-[300px] h-auto" role="img" aria-label={slices.map(s => `${s.label}: ${s.pct}%`).join(', ')}>
      <defs>{slices.map((s, i) => (
        <linearGradient key={s.label} id={`maturite-grad-${i}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={s.top1} /><stop offset="1" stopColor={s.top2} />
        </linearGradient>
      ))}</defs>
      <ellipse cx={cx} cy={cy + depth + 8} rx={rx * .92} ry={ry * .42} fill="#0f172a" opacity=".1" />
      {full ? (
        <path d={`M ${cx-rx} ${cy} L ${cx-rx} ${cy+depth} A ${rx} ${ry} 0 0 0 ${cx+rx} ${cy+depth} L ${cx+rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx-rx} ${cy} Z`} fill={arcs[0].side} />
      ) : arcs.map(s => {
        const a = Math.max(s.a1, 0), b = Math.min(s.a2, Math.PI);
        if (a >= b) return null;
        const [x1,y1] = point(a), [x2,y2] = point(b);
        return <path key={`wall-${s.label}`} d={`M ${x1} ${y1} L ${x1} ${y1+depth} A ${rx} ${ry} 0 0 1 ${x2} ${y2+depth} L ${x2} ${y2} A ${rx} ${ry} 0 0 0 ${x1} ${y1} Z`} fill={s.side} />;
      })}
      {arcs.map(s => {
        const i = slices.findIndex(x => x.label === s.label);
        if (full) return <ellipse key={s.label} cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#maturite-grad-${i})`} />;
        const [x1,y1] = point(s.a1), [x2,y2] = point(s.a2);
        return <path key={s.label} d={`M ${cx} ${cy} L ${x1} ${y1} A ${rx} ${ry} 0 ${s.a2-s.a1>Math.PI?1:0} 1 ${x2} ${y2} Z`}
          fill={`url(#maturite-grad-${i})`} stroke="#fff" strokeOpacity=".55" strokeWidth="1.5" />;
      })}
      {arcs.map(s => {
        if (s.pct < 3) return null;
        const [x,y] = full ? [cx,cy] : point((s.a1+s.a2)/2,0,.6);
        return <text key={s.label} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700"
          fill="#fff" stroke="rgba(15,23,42,.35)" strokeWidth="3" paintOrder="stroke">{s.pct}%</text>;
      })}
    </svg>
  );
};

const SolidPie = ({ data = [], nameKey, valueKey, innerRatio = 0, idPrefix, tooltipStyle }) => {
  const ref = useRef(null);
  const [tip, setTip] = useState(null);
  const [hovered, setHovered] = useState(null);
  const cx = 130, cy = 78, rx = 108, ry = 64, depth = 24, k = innerRatio;
  const items = data.map((d, i) => ({
    index: i, label: String(d?.[nameKey] ?? ''), value: Number(d?.[valueKey]) || 0,
    ...COLORS[i % COLORS.length]
  }));
  const total = items.reduce((n, s) => n + s.value, 0) || 1;
  const all = items.map(s => ({ ...s, pct: Math.round(s.value / total * 100) }));
  const point = (a, dy = 0, m = 1) => [cx + rx*m*Math.cos(a), cy + ry*m*Math.sin(a)+dy];
  let angle = -Math.PI/2;
  let arcs = all.filter(s => s.value > 0).map(s => {
    const sweep = s.value/total*Math.PI*2;
    const item = { ...s, a1: angle, a2: angle+sweep };
    angle += sweep;
    return item;
  });
  const full = arcs.length === 1;
  if (full) {
    const s = arcs[0];
    arcs = [{ ...s, a1:-Math.PI/2, a2:Math.PI/2, part:0 }, { ...s, a1:Math.PI/2, a2:Math.PI*1.5, part:1 }];
  }
  const move = (e, s) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setHovered(s.index);
    setTip({ x:e.clientX-r.left, y:e.clientY-r.top, text:`${s.label} : ${s.value}` });
  };
  const leave = () => { setHovered(null); setTip(null); };
  const style = s => ({ opacity:hovered !== null && hovered !== s.index ? .8 : 1, transition:'opacity 150ms' });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 h-full">
      <div ref={ref} className="relative w-full max-w-[300px]">
        <svg viewBox="0 0 260 180" className="w-full h-auto" role="img" aria-label={all.map(s => `${s.label}: ${s.value}`).join(', ')}>
          <defs>{all.map(s => (
            <linearGradient key={s.index} id={`${idPrefix}-grad-${s.index}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={s.top1} /><stop offset="1" stopColor={s.top2} />
            </linearGradient>
          ))}</defs>
          <ellipse cx={cx} cy={cy+depth+8} rx={rx*.92} ry={ry*.42} fill="#0f172a" opacity=".1" />
          {k > 0 && arcs.flatMap(s => [
            [Math.max(s.a1,-Math.PI/2),Math.min(s.a2,0)],
            [Math.max(s.a1,Math.PI),Math.min(s.a2,Math.PI*1.5)]
          ].map(([a,b],i) => {
            if (a >= b) return null;
            const [x1,y1] = point(a,0,k), [x2,y2] = point(b,0,k);
            return <path key={`inner-${s.index}-${s.part??0}-${i}`} d={`M ${x1} ${y1} A ${rx*k} ${ry*k} 0 0 1 ${x2} ${y2} L ${x2} ${y2+depth} A ${rx*k} ${ry*k} 0 0 0 ${x1} ${y1+depth} Z`} fill={s.side} style={style(s)} />;
          }))}
          {arcs.map(s => {
            const a = Math.max(s.a1,0), b = Math.min(s.a2,Math.PI);
            if (a >= b) return null;
            const [x1,y1] = point(a), [x2,y2] = point(b);
            return <path key={`wall-${s.index}-${s.part??0}`} d={`M ${x1} ${y1} L ${x1} ${y1+depth} A ${rx} ${ry} 0 0 1 ${x2} ${y2+depth} L ${x2} ${y2} A ${rx} ${ry} 0 0 0 ${x1} ${y1} Z`}
              fill={s.side} style={style(s)} onMouseMove={e=>move(e,s)} onMouseLeave={leave} />;
          })}
          {arcs.map(s => {
            const [x1,y1] = point(s.a1), [x2,y2] = point(s.a2), large = s.a2-s.a1>Math.PI?1:0;
            const d = k ? (() => {
              const [i1,j1] = point(s.a1,0,k), [i2,j2] = point(s.a2,0,k);
              return `M ${x1} ${y1} A ${rx} ${ry} 0 ${large} 1 ${x2} ${y2} L ${i2} ${j2} A ${rx*k} ${ry*k} 0 ${large} 0 ${i1} ${j1} Z`;
            })() : `M ${cx} ${cy} L ${x1} ${y1} A ${rx} ${ry} 0 ${large} 1 ${x2} ${y2} Z`;
            return <path key={`top-${s.index}-${s.part??0}`} d={d} fill={`url(#${idPrefix}-grad-${s.index})`}
              stroke={full?'none':'#fff'} strokeOpacity=".55" strokeWidth="1.5" style={style(s)}
              onMouseMove={e=>move(e,s)} onMouseLeave={leave} />;
          })}
          {arcs.map(s => {
            if ((full && s.part !== 0) || s.pct < 5) return null;
            const [x,y] = full ? point(Math.PI/2,0,k?(1+k)/2:.62) : point((s.a1+s.a2)/2,0,k?(1+k)/2:.62);
            return <text key={`label-${s.index}`} x={x} y={y} textAnchor="middle" dominantBaseline="central"
              fontSize={k?14:16} fontWeight="700" fill="#fff" stroke="rgba(15,23,42,.35)" strokeWidth="3" paintOrder="stroke" pointerEvents="none">{s.pct}%</text>;
          })}
        </svg>
        {tip && <div style={{ ...tooltipStyle, position:'absolute', left:tip.x, top:tip.y, transform:'translate(-50%,-130%)',
          padding:'6px 10px', whiteSpace:'nowrap', pointerEvents:'none', zIndex:30 }}>{tip.text}</div>}
      </div>
      <ul className="flex sm:flex-col flex-wrap justify-center gap-x-5 gap-y-2.5 shrink-0 max-h-[200px] overflow-y-auto">
        {all.map(s => (
          <li key={s.index} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="h-3 w-3 rounded-sm shrink-0" style={{ background:`linear-gradient(135deg,${s.top1},${s.top2})` }} />
            <span className="font-medium">{s.label}</span>
            <span className="text-slate-400 tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Bar3D = ({ x, y, width, height, gradient, top, side }) => {
  if (x == null || y == null) return null;
  let xx=x, yy=y, w=width, h=height;
  if (h<0) { yy+=h; h=-h; }
  if (w<0) { xx+=w; w=-w; }
  if (!w || !h) return null;
  return <g>
    <path d={`M ${xx+w} ${yy} L ${xx+w+8} ${yy-5} L ${xx+w+8} ${yy+h-5} L ${xx+w} ${yy+h} Z`} fill={side}/>
    <path d={`M ${xx} ${yy} L ${xx+8} ${yy-5} L ${xx+w+8} ${yy-5} L ${xx+w} ${yy} Z`} fill={top}/>
    <rect x={xx} y={yy} width={w} height={h} fill={gradient}/>
  </g>;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [communeId, setCommuneId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);
  const isDark = useIsDark();

  const fetchData = useCallback(async signal => {
    try {
      setLoading(true); setError('');
      const { data } = await axios.get('/dashboard/stats', {
        signal, params: communeId ? { commune_id:communeId } : {}
      });
      if (!data?.success) throw new Error('Réponse invalide');
      if (!signal?.aborted) setStats(data);
    } catch (err) {
      if (signal?.aborted || axios.isCancel?.(err) || err.name === 'CanceledError') return;
      console.error('Dashboard:', err);
      setError('Impossible de charger le tableau de bord. Vérifiez votre connexion.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [communeId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const downloadChart = async id => {
    const el = document.getElementById(id);
    if (!el || downloading) return;
    const button = el.querySelector('[data-download-button]');
    try {
      setDownloading(id);
      if (button) button.style.visibility = 'hidden';
      const url = await domtoimage.toPng(el, {
        quality:1, bgcolor:isDark?'#0f172a':'#fff',
        width:el.offsetWidth*2, height:el.offsetHeight*2,
        style:{ transform:'scale(2)', transformOrigin:'top left', width:`${el.offsetWidth}px`, height:`${el.offsetHeight}px` }
      });
      const a = document.createElement('a');
      a.href=url; a.download=`${id}${communeId?`-commune-${communeId}`:''}.png`;
      document.body.appendChild(a); a.click(); a.remove();
    } catch (err) {
      console.error('Export PNG:', err);
    } finally {
      if (button) button.style.visibility = 'visible';
      setDownloading(null);
    }
  };

  if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
    <Loader2 size={32} className="animate-spin text-emerald-600 mb-3"/>
    <p className="text-sm text-slate-500">Chargement des données...</p>
  </div>;

  if (error) return <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950 px-6 text-center">
    <AlertTriangle size={28} className="text-rose-600"/>
    <p className="text-sm text-slate-600 dark:text-slate-300">{error}</p>
    <button onClick={()=>fetchData()} className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm">
      <RefreshCw size={15}/> Réessayer
    </button>
  </div>;

  if (!stats) return null;

  const theme = isDark
    ? { grid:'#334155', tick:'#94a3b8', bg:'#0f172a', border:'#334155', text:'#f1f5f9', cursor:'rgba(255,255,255,.05)' }
    : { grid:'#e2e8f0', tick:'#64748b', bg:'#fff', border:'#cbd5e1', text:'#0f172a', cursor:'rgba(0,0,0,.03)' };

  const tooltipStyle = { borderRadius:8, border:`1px solid ${theme.border}`, fontSize:12, background:theme.bg, color:theme.text };
  const tick = { fontSize:11, fill:theme.tick };
  const kpis = stats.kpis || {};
  const total = Number(kpis.reseaux) || 0;
  const autonomes = Number(kpis.reseauxAutonomes) || 0;
  const pct = total ? Math.round(autonomes/total*100) : 0;
  const slices = [
    { label:'Autonomes', value:autonomes, pct, top1:'#22c55e', top2:'#16a34a', side:'#166534' },
    { label:'En structuration', value:Math.max(total-autonomes,0), pct:total?100-pct:0, top1:'#fbbf24', top2:'#d97706', side:'#92400e' }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body,.font-display{font-family:'Public Sans',system-ui,sans-serif}
        .recharts-wrapper text{font-family:'Public Sans',system-ui,sans-serif}
        .solid-area .recharts-area-area{filter:drop-shadow(6px 5px 0 #075985)}
      `}</style>

      <header className="px-4 md:px-6 py-4 md:py-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Activity size={20}/>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Tableau de bord & Statistiques</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Vue d'ensemble des performances et indicateurs clés de la plateforme.</p>
            </div>
          </div>
          {stats.isAdmin && (
            <div className="w-full sm:w-auto sm:ml-auto">
              <label htmlFor="dashboard-commune" className="flex items-center gap-1.5 text-xs font-medium mb-1 text-slate-600 dark:text-slate-300">
                <MapPin size={13}/> Commune
              </label>
              <select id="dashboard-commune" value={communeId} onChange={e=>setCommuneId(e.target.value)}
                className="w-full sm:min-w-[210px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Toutes les communes</option>
                {(stats.communes || []).map(c=><option key={c.id_commune} value={c.id_commune}>{c.nom_commune}</option>)}
              </select>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 font-body">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {KPI_CONFIG.map(({key,label,icon:Icon})=>(
            <div key={key} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <Icon size={18}/>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</p>
                <p className="text-xl font-semibold tabular-nums mt-0.5">{kpis[key] ?? 0}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard id="chart-equilibre" title="Équilibre du programme" icon={PieIcon} empty={!stats.resumeData?.some(x=>Number(x.A)>0)} downloading={downloading} onDownload={downloadChart}>
            <SolidPie data={stats.resumeData} nameKey="subject" valueKey="A" innerRatio={.55} idPrefix="equilibre" tooltipStyle={tooltipStyle}/>
          </ChartCard>
          <ChartCard id="chart-modules" title="Taux de maîtrise par module" icon={Activity} empty={!stats.moduleStats?.some(x=>Number(x.valeur)>0)} downloading={downloading} onDownload={downloadChart}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.moduleStats} margin={{top:14,right:18,left:0,bottom:0}}>
                <defs><linearGradient id="bar3d-modules" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#10b981"/><stop offset="1" stopColor="#047857"/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.grid}/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={tick}/>
                <YAxis axisLine={false} tickLine={false} tick={tick}/>
                <Tooltip cursor={{fill:theme.cursor}} contentStyle={tooltipStyle} itemStyle={{color:theme.text}} labelStyle={{color:theme.text}}/>
                <Bar dataKey="valeur" barSize={28} shape={p=><Bar3D {...p} gradient="url(#bar3d-modules)" top="#6ee7b7" side="#064e3b"/>}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard id="chart-croissance" title="Croissance des groupes (% par année)" icon={CalendarDays} empty={!stats.evolutionGS?.length} downloading={downloading} onDownload={downloadChart}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={stats.evolutionGS} margin={{top:10,right:22,left:0,bottom:0}}>
                <defs><linearGradient id="bar3d-groupes" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#38bdf8"/><stop offset="1" stopColor="#0284c7"/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.grid}/>
                <XAxis type="number" axisLine={false} tickLine={false} tick={tick} unit="%"/>
                <YAxis dataKey="year" type="category" axisLine={false} tickLine={false} tick={tick}/>
                <Tooltip cursor={{fill:theme.cursor}} formatter={v=>[`${v}%`,'Répartition']} contentStyle={tooltipStyle} itemStyle={{color:theme.text}} labelStyle={{color:theme.text}}/>
                <Bar dataKey="pourcentage" barSize={20} shape={p=><Bar3D {...p} gradient="url(#bar3d-groupes)" top="#7dd3fc" side="#075985"/>}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard id="chart-ages" title="Pyramide des âges" icon={Users} empty={!stats.ageData?.some(x=>Number(x.value)>0)} downloading={downloading} onDownload={downloadChart}>
            <div className="solid-area h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.ageData} margin={{top:10,right:14,left:0,bottom:6}}>
                  <defs><linearGradient id="colorAge" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#0369a1"/></linearGradient></defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={tick}/>
                  <YAxis axisLine={false} tickLine={false} tick={tick}/>
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{color:theme.text}} labelStyle={{color:theme.text}}/>
                  <Area type="monotone" dataKey="value" stroke="#0369a1" strokeWidth={2} fillOpacity={1} fill="url(#colorAge)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-2">
          <ChartCard id="chart-reseaux" title="Maturité des réseaux" icon={Network} empty={!total} downloading={downloading} onDownload={downloadChart}>
            <div className="flex flex-col h-full">
              <div className="flex-1 min-h-0 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                <Pie3D slices={slices}/>
                <ul className="flex sm:flex-col flex-wrap justify-center gap-x-5 gap-y-2.5 shrink-0">
                  {slices.map(s=><li key={s.label} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <span className="h-3 w-3 rounded-sm shrink-0" style={{background:`linear-gradient(135deg,${s.top1},${s.top2})`}}/>
                    <span className="font-medium">{s.label}</span><span className="text-slate-400 tabular-nums">{s.value}</span>
                  </li>)}
                </ul>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center mt-2 tabular-nums">
                {autonomes} sur {total} réseaux autonomes
              </p>
            </div>
          </ChartCard>
          <ChartCard id="chart-postes" title="Répartition des postes" icon={ShieldCheck} empty={!stats.respData?.some(x=>Number(x.valeur)>0)} downloading={downloading} onDownload={downloadChart}>
            <SolidPie data={stats.respData} nameKey="name" valueKey="valeur" idPrefix="postes" tooltipStyle={tooltipStyle}/>
          </ChartCard>
        </div>
      </main>
    </div>
  );
}