import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, GraduationCap, ShieldCheck, Heart, Leaf, 
  Users, BarChart3, PieChart, ArrowLeft 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FormationStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/formations/stats-details', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error("Erreur stats détaillée:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const MiniChart = ({ type, h, f, color }) => {
    const total = h + f || 1;
    const pctH = Math.round((h / total) * 100);
    const pctF = Math.round((f / total) * 100);

    if (type === 'donut') {
      const radius = 14;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (pctH / 100) * circumference;
      return (
        <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r={radius} fill="transparent" stroke="#e2e8f0" strokeWidth="4" className="dark:stroke-slate-800" />
            <circle cx="18" cy="18" r={radius} fill="transparent" stroke={color} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
          </svg>
          <span className="absolute text-[9px] font-bold text-slate-700 dark:text-slate-300">{pctH}%</span>
        </div>
      );
    }

    if (type === 'bar') {
      return (
        <div className="flex items-end gap-1.5 h-8 w-10 justify-center shrink-0 pt-1">
          <div className="w-2 bg-blue-500 rounded-t transition-all duration-500" style={{ height: `${Math.max(pctH, 15)}%` }} />
          <div className="w-2 bg-pink-500 rounded-t transition-all duration-500" style={{ height: `${Math.max(pctF, 15)}%` }} />
        </div>
      );
    }

    if (type === 'progress') {
      return (
        <div className="flex flex-col w-14 gap-1 shrink-0 justify-center">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pctH}%` }} />
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-pink-500 h-full rounded-full" style={{ width: `${pctF}%` }} />
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
        <span className="text-[11px] font-bold text-blue-500">{pctH}%</span>
        <span className="text-slate-300 dark:text-slate-700 text-[10px]">|</span>
        <span className="text-[11px] font-bold text-pink-500">{pctF}%</span>
      </div>
    );
  };

  const StatCard = ({ title, h, f, icon: Icon, colorClass, bgClass, chartType, strokeColor }) => {
    const totalHomme = parseInt(h) || 0;
    const totalFemme = parseInt(f) || 0;

    return (
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700">
        
        {/* TOP SECTION: Icon + Title (No truncate) + MiniChart */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className={`w-8 h-8 flex items-center justify-center rounded-md shrink-0 ${bgClass} ${colorClass}`}>
              <Icon size={17} />
            </div>
            {/* Nesorina ny truncate mba hiseho manontolo ny soratra */}
            <h3 className="text-xs font-bold text-slate-800 dark:text-white leading-tight break-words">
              {title}
            </h3>
          </div>
          <div className="pt-0.5 shrink-0">
            <MiniChart type={chartType} h={totalHomme} f={totalFemme} color={strokeColor} />
          </div>
        </div>

        {/* BOTTOM SECTION: Hommes / Femmes Counts */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col bg-slate-50 dark:bg-slate-800/40 p-2 rounded-md border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-0.5">Hommes</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{totalHomme}</span>
          </div>
          <div className="flex flex-col bg-slate-50 dark:bg-slate-800/40 p-2 rounded-md border border-slate-100 dark:border-slate-800 text-right">
            <span className="text-[10px] font-semibold text-pink-600 dark:text-pink-400 mb-0.5">Femmes</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{totalFemme}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-slate-950">
      <Activity size={32} className="animate-spin text-indigo-600 mb-3" />
      <p className="font-semibold text-slate-500 text-xs">Chargement des statistiques...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 font-sans pb-8">
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 bg-white dark:bg-slate-900 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-md shrink-0">
              <GraduationCap size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Statistiques des formations
              </h1>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Répartition par genre des quelques formations
              </p>
            </div>
          </div>

          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all self-start sm:self-center"
          >
            <ArrowLeft size={15} />
            Retour
          </button>
        </div>

        {/* CARDS GRID (Nampifanarahana amin'ny responsive design) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatCard 
            title="Genre & Social" 
            h={stats?.genre_h} 
            f={stats?.genre_f} 
            icon={Users} 
            colorClass="text-indigo-600 dark:text-indigo-400" 
            bgClass="bg-indigo-50 dark:bg-indigo-950/40" 
            chartType="donut"
            strokeColor="#4f46e5"
          />
          <StatCard 
            title="Agroécologie" 
            h={stats?.agroeco_h} 
            f={stats?.agroeco_f} 
            icon={Leaf} 
            colorClass="text-emerald-600 dark:text-emerald-400" 
            bgClass="bg-emerald-50 dark:bg-emerald-950/40" 
            chartType="bar"
            strokeColor="#10b981"
          />
          <StatCard 
            title="Production semence" 
            h={stats?.semence_h} 
            f={stats?.semence_f} 
            icon={Activity} 
            colorClass="text-amber-600 dark:text-amber-400" 
            bgClass="bg-amber-50 dark:bg-amber-950/40" 
            chartType="progress"
            strokeColor="#f59e0b"
          />
          <StatCard 
            title="Nutrition" 
            h={stats?.nutrition_h} 
            f={stats?.nutrition_f} 
            icon={Heart} 
            colorClass="text-rose-600 dark:text-rose-400" 
            bgClass="bg-rose-50 dark:bg-rose-950/40" 
            chartType="badge"
            strokeColor="#f43f5e"
          />
          <StatCard 
            title="Conservation produit" 
            h={stats?.conservation_h} 
            f={stats?.conservation_f} 
            icon={ShieldCheck} 
            colorClass="text-cyan-600 dark:text-cyan-400" 
            bgClass="bg-cyan-50 dark:bg-cyan-950/40" 
            chartType="donut"
            strokeColor="#06b6d4"
          />
          <StatCard 
            title="Transformation produit" 
            h={stats?.transformation_h} 
            f={stats?.transformation_f} 
            icon={BarChart3} 
            colorClass="text-purple-600 dark:text-purple-400" 
            bgClass="bg-purple-50 dark:bg-purple-950/40" 
            chartType="bar"
            strokeColor="#a855f7"
          />
          <StatCard 
            title="Gestion simplifiée" 
            h={stats?.gestion_h} 
            f={stats?.gestion_f} 
            icon={PieChart} 
            colorClass="text-orange-600 dark:text-orange-400" 
            bgClass="bg-orange-50 dark:bg-orange-950/40" 
            chartType="progress"
            strokeColor="#f97316"
          />
          <StatCard 
            title="EPRACC" 
            h={stats?.epracc_h} 
            f={stats?.epracc_f} 
            icon={GraduationCap} 
            colorClass="text-teal-600 dark:text-teal-400" 
            bgClass="bg-teal-50 dark:bg-teal-950/40" 
            chartType="badge"
            strokeColor="#14b8a6"
          />
        </div>

      </div>
    </div>
  );
};

export default FormationStats;