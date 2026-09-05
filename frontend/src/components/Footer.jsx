import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mx-4 md:mx-6 mb-3 mt-auto h-8 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between items-center px-3 transition-all shadow-sm">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
          ONG Tsinjo Aina — Fianarantsoa, Haute Matsiatra
        </span>
      </div>
      <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
        © {currentYear} Tous droits réservés
      </div>
    </footer>
  );
};

export default Footer;