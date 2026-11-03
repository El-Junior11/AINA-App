import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mx-4 md:mx-6 mb-3 mt-auto h-9 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between items-center px-3.5 transition-colors shadow-sm font-body">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
      `}</style>
      
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0"></span>
        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
          ONG Tsinjo Aina — Fianarantsoa, Haute Matsiatra
        </span>
      </div>
      <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 shrink-0 ml-3">
        © {currentYear} Tous droits réservés
      </div>
    </footer>
  );
};

export default Footer;