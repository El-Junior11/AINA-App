import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
<footer className="mx-6 mb-4 mt-2 h-[34px] bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 flex justify-center items-center transition-all hover:border-blue-500/20 shadow-sm px-6">
  
  <div className="flex items-center gap-3">
    <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em]">
      © {currentYear} ONG TSINJO AINA FIANARANTSOA - HAUTE MATSIATRA
    </div>
  </div>

</footer>
  );
};

export default Footer;