
import React,{useState,useEffect} from 'react';
import {Link} from 'react-router-dom';
import {Settings,Bell,Moon,Sun,HelpCircle} from 'lucide-react';
import logoOng from '../assets/logo.png';

const Navbar=({darkMode,setDarkMode})=>{
  const [time,setTime]=useState(new Date());
  useEffect(()=>{const timer=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(timer)},[]);
  const hours=time.getHours(),minutes=time.getMinutes(),seconds=time.getSeconds();
  const hourDegrees=((hours%12)*30)+(minutes*0.5);
  const minuteDegrees=(minutes*6)+(seconds*0.1);
  const secondDegrees=seconds*6;
  const savedUser=localStorage.getItem('user');
  const userObj=savedUser?JSON.parse(savedUser):null;
  const userName=userObj?.name||"Utilisateur";
  const userRole=(userObj?.role||"user").trim().toLowerCase();
  const isAdmin=userRole==='admin';
  const userInitial=userName.split(' ').filter(Boolean).map(n=>n[0]).join('').toUpperCase().substring(0,2)||"U";

  return <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors font-body">
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');.font-body{font-family:'DM Sans',sans-serif}.font-display{font-family:'Manrope',sans-serif}`}</style>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-br from-emerald-500 to-sky-500 shrink-0 shadow-sm"><div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center"><img src={logoOng} alt="Logo Tsinjo Aina" className="w-full h-full object-cover rounded-full"/></div></div>
      <div className="flex flex-col leading-none"><span className="text-xs font-display font-extrabold text-slate-900 dark:text-white tracking-tight">ONG TSINJO AINA</span><span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Fianarantsoa</span></div>
    </div>
    <div className="flex items-center gap-1 sm:gap-1.5">
      <div className="relative w-[24px] h-[24px] rounded-full border-2 border-slate-300 dark:border-slate-600 mr-1.5 hidden sm:flex items-center justify-center bg-slate-50 dark:bg-slate-800 shadow-inner" title={`Heure : ${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}`}>
        <div className="absolute bottom-1/2 left-1/2 w-0.5 h-1.5 bg-slate-700 dark:bg-white origin-bottom rounded-full" style={{transform:`translateX(-50%) rotate(${hourDegrees}deg)`}}/>
        <div className="absolute bottom-1/2 left-1/2 w-0.5 h-2 bg-emerald-500 origin-bottom rounded-full" style={{transform:`translateX(-50%) rotate(${minuteDegrees}deg)`}}/>
        <div className="absolute bottom-1/2 left-1/2 w-[1px] h-2 bg-sky-400 origin-bottom" style={{transform:`translateX(-50%) rotate(${secondDegrees}deg)`}}/>
        <div className="absolute w-1 h-1 bg-slate-700 dark:bg-white rounded-full"></div>
      </div>
      <button onClick={()=>setDarkMode(!darkMode)} className="p-2.5 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-sky-50 dark:hover:bg-slate-800 dark:hover:from-slate-800 dark:hover:to-slate-800 rounded-2xl text-slate-600 dark:text-white transition-all" title={darkMode?"Activer le mode clair":"Activer le mode sombre"}>{darkMode?<Sun size={19} className="text-amber-400"/>:<Moon size={19}/>}</button>
      <Link to="/notifications" className="p-2.5 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-sky-50 dark:hover:bg-slate-800 dark:hover:from-slate-800 dark:hover:to-slate-800 rounded-2xl text-slate-600 dark:text-white group transition-all" title="Aide"><HelpCircle size={19} className="group-hover:scale-105 transition-transform"/></Link>
      <Link to="/settings" className="p-2.5 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-sky-50 dark:hover:bg-slate-800 dark:hover:from-slate-800 dark:hover:to-slate-800 rounded-2xl text-slate-600 dark:text-white group transition-all" title="Paramètres du compte"><Settings size={19} className="group-hover:rotate-90 transition-transform duration-300"/></Link>
      {isAdmin&&<Link to="/admin/approvals" className="p-2.5 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-2xl text-slate-600 dark:text-white relative group transition-all" title="Approbation des inscriptions"><Bell size={19} className="group-hover:rotate-12 transition-transform"/><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900"></span></Link>}
      <div className="flex items-center gap-2.5 ml-2 pl-3 border-l border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-sky-500 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">{userInitial}</div>
        <div className="hidden sm:flex flex-col items-start leading-none"><span className="text-xs font-semibold text-slate-900 dark:text-white">{userName}</span><span className={`text-[10px] font-semibold capitalize mt-0.5 ${isAdmin?'text-sky-600 dark:text-sky-400':'text-emerald-600 dark:text-emerald-400'}`}>{userRole}</span></div>
      </div>
    </div>
  </header>
};

export default Navbar;
