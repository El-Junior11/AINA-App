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
      const radius = 16;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (pctH / 100) * circumference;
      return (
        <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="5" className="dark:stroke-slate-800" />
            <circle cx="20" cy="20" r={radius} fill="transparent" stroke={color} strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
          </svg>
          <span className="absolute text-[10px] font-black text-slate-700 dark:text-slate-300">{pctH}%</span>
        </div>
      );
    }

    if (type === 'bar') {
      return (
        <div className="flex items-end gap-2 h-12 w-14 justify-center shrink-0 pt-2">
          <div className="w-3 bg-blue-500 rounded-t-md transition-all duration-500" style={{ height: `${Math.max(pctH, 15)}%` }} />
          <div className="w-3 bg-pink-500 rounded-t-md transition-all duration-500" style={{ height: `${Math.max(pctF, 15)}%` }} />
        </div>
      );
    }

    if (type === 'progress') {
      return (
        <div className="flex flex-col w-20 gap-1.5 shrink-0 justify-center">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pctH}%` }} />
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-pink-500 h-full rounded-full" style={{ width: `${pctF}%` }} />
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
        <span className="text-xs font-black text-blue-500">{pctH}%</span>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <span className="text-xs font-black text-pink-500">{pctF}%</span>
      </div>
    );
  };

  const StatCard = ({ title, h, f, icon: Icon, colorClass, bgClass, chartType, strokeColor }) => {
    const totalHomme = parseInt(h) || 0;
    const totalFemme = parseInt(f) || 0;

    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-all hover:shadow-md">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-12 h-12 flex items-center justify-center rounded-2xl shrink-0 ${bgClass} ${colorClass}`}>
              <Icon size={22} />
            </div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider truncate">
              {title}
            </h3>
          </div>
          <MiniChart type={chartType} h={totalHomme} f={totalFemme} color={strokeColor} />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex flex-col bg-blue-50/40 dark:bg-blue-950/10 p-3 rounded-2xl">
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-wider mb-1">Hommes</span>
            <span className="text-base font-black text-blue-700 dark:text-blue-400">{totalHomme}</span>
          </div>
          <div className="flex flex-col bg-pink-50/40 dark:bg-pink-950/10 p-3 rounded-2xl text-right">
            <span className="text-[9px] font-black text-pink-500 uppercase tracking-wider mb-1">Femmes</span>
            <span className="text-base font-black text-pink-700 dark:text-pink-400">{totalFemme}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-slate-950">
      <Activity size={40} className="animate-spin text-indigo-600 mb-4" />
      <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Chargement des statistiques...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 font-sans pb-12">
      <div className="p-8 space-y-8 max-w-5xl mx-auto">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 text-white w-12 h-12 flex items-center justify-center rounded-2xl shadow-md shadow-indigo-500/20">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                Statistiques des Formations
              </h1>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Répartition par genre sy taranja rehetra
              </p>
            </div>
          </div>

          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all active:scale-95 self-start sm:self-center"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard 
            title="Genre & Social" 
            h={stats?.genre_h} 
            f={stats?.genre_f} 
            icon={Users} 
            colorClass="text-indigo-600" 
            bgClass="bg-indigo-50 dark:bg-indigo-950/30" 
            chartType="donut"
            strokeColor="#4f46e5"
          />
          <StatCard 
            title="Agroécologie" 
            h={stats?.agroeco_h} 
            f={stats?.agroeco_f} 
            icon={Leaf} 
            colorClass="text-emerald-600" 
            bgClass="bg-emerald-50 dark:bg-emerald-950/30" 
            chartType="bar"
            strokeColor="#10b981"
          />
          <StatCard 
            title="Production Semence" 
            h={stats?.semence_h} 
            f={stats?.semence_f} 
            icon={Activity} 
            colorClass="text-amber-600" 
            bgClass="bg-amber-50 dark:bg-amber-950/30" 
            chartType="progress"
            strokeColor="#f59e0b"
          />
          <StatCard 
            title="Nutrition" 
            h={stats?.nutrition_h} 
            f={stats?.nutrition_f} 
            icon={Heart} 
            colorClass="text-rose-600" 
            bgClass="bg-rose-50 dark:bg-rose-950/30" 
            chartType="badge"
            strokeColor="#f43f5e"
          />
          <StatCard 
            title="Conservation Produit" 
            h={stats?.conservation_h} 
            f={stats?.conservation_f} 
            icon={ShieldCheck} 
            colorClass="text-cyan-600" 
            bgClass="bg-cyan-50 dark:bg-cyan-950/30" 
            chartType="donut"
            strokeColor="#06b6d4"
          />
          <StatCard 
            title="Transformation Produit" 
            h={stats?.transformation_h} 
            f={stats?.transformation_f} 
            icon={BarChart3} 
            colorClass="text-purple-600" 
            bgClass="bg-purple-50 dark:bg-purple-950/30" 
            chartType="bar"
            strokeColor="#a855f7"
          />
          <StatCard 
            title="Gestion Simplifiée" 
            h={stats?.gestion_h} 
            f={stats?.gestion_f} 
            icon={PieChart} 
            colorClass="text-orange-600" 
            bgClass="bg-orange-50 dark:bg-orange-950/30" 
            chartType="progress"
            strokeColor="#f97316"
          />
          <StatCard 
            title="EPRACC" 
            h={stats?.epracc_h} 
            f={stats?.epracc_f} 
            icon={GraduationCap} 
            colorClass="text-teal-600" 
            bgClass="bg-teal-50 dark:bg-teal-950/30" 
            chartType="badge"
            strokeColor="#14b8a6"
          />
        </div>

      </div>
    </div>
  );
};

export default FormationStats;