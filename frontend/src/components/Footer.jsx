import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mx-4 md:mx-6 mb-3 mt-auto h-9 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between items-center px-4 transition-all shadow-sm">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          ONG Tsinjo Aina — Fianarantsoa, Haute Matsiatra
        </span>
      </div>
      
      <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
        © {currentYear} Tous droits réservés
      </div>
    </footer>
  );
};

export default Footer;