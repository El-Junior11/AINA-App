import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShieldCheck, ChevronDown, Eye, Target, Star, Globe, Moon, Sun } from 'lucide-react';

import logo from '../assets/logo.png'; 

const Home = () => {
  const [showRoles, setShowRoles] = useState(false);
  const [isDark, setIsDark] = useState(false);

  
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const titleAnimation = {
    hidden: { filter: "blur(10px)", opacity: 0, y: 20 },
    visible: { 
      filter: "blur(0px)", 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: "easeOut" } 
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col font-sans selection:bg-blue-100 selection:text-blue-600 transition-colors duration-500">
      
      {/* --- NAVBAR --- */}
  
      <nav className="flex items-center justify-between px-10 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-3 text-xl font-black tracking-tighter text-blue-600"
        >
          <div className="w-12 h-12 rounded-full border-2 border-blue-600 p-0.5 overflow-hidden bg-white shadow-lg shadow-blue-100 flex items-center justify-center">
            <img 
              src={logo} 
              alt="Logo Tsinjo Aina"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          {/* Nampiana dark:text-white */}
          <span className="hidden md:block uppercase tracking-tight dark:text-white">ONG Tsinjo Aina FIANARANTSOA</span>
        </motion.div>
        
        <div className="flex items-center gap-8">
          {/* Bokotra hanovana Dark Mode */}
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <Link to="/login" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">
            Se connecter
          </Link>
          
          <div className="relative">
            <button 
              onClick={() => setShowRoles(!showRoles)}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-blue-600 text-white text-sm font-bold rounded-full hover:bg-blue-600 dark:hover:bg-blue-500 shadow-xl transition-all active:scale-95"
            >
              S'inscrire
              <motion.div animate={{ rotate: showRoles ? 180 : 0 }}>
                <ChevronDown size={16} />
              </motion.div>
            </button>

            <AnimatePresence>
              {showRoles && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  /* Nampiana dark styles ho an'ny dropdown */
                  className="absolute right-0 mt-3 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 z-[60]"
                >
                  <Link 
                    to="/register?role=admin" 
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors group"
                  >
                    <ShieldCheck size={18} className="text-blue-600 group-hover:scale-110 transition-transform" />
                    Administrateur
                  </Link>
                  <Link 
                    to="/register?role=user" 
                    className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors group"
                  >
                    <User size={18} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                    Utilisateur
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        
        {/* Nampiana dark opacity kely eto amin'ny blobs */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-200 dark:bg-blue-900/20 rounded-full blur-[120px] -z-10" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.4, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-200 dark:bg-emerald-900/20 rounded-full blur-[120px] -z-10" 
        />

        <div className="relative z-10 w-full max-w-6xl mt-[-2rem]">
          
        <motion.div 
          variants={titleAnimation}
          initial="hidden"
          animate="visible"
          className="text-center mb-10"
        >
          {/* Nampiana dark:text-white */}
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Agir pour un <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500">Avenir Durable</span>
          </h1>
        </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
          >
            {/* Vision */}
            <motion.div variants={fadeInUp} whileHover={{ y: -10 }} className="group">
              {/* Nampiana dark:bg-slate-900/70 dark:border-slate-800 */}
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 h-full relative overflow-hidden">
                <div className="flex items-center gap-5 mb-6">
                  <div className="p-4 bg-blue-600 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform">
                    <Eye size={28} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">Vision</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
                  Faire de chaque bénéficiaire un citoyen responsable, prenant en main son développement et vivant en harmonie dans une society équitable.
                </p>
              </div>
            </motion.div>

            {/* Mission */}
            <motion.div variants={fadeInUp} whileHover={{ y: -10 }} className="group">
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 h-full relative overflow-hidden border-b-4 border-b-emerald-500">
                <div className="flex items-center gap-5 mb-6">
                  <div className="p-4 bg-emerald-500 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform">
                    <Target size={28} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">Mission</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
                  Œuvrer pour le développement humain durable, l’autopromotion des communautés et la protection de l’environnement.
                </p>
              </div>
            </motion.div>

            {/* Valeurs */}
            <motion.div variants={fadeInUp} whileHover={{ y: -10 }} className="group">
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 h-full relative overflow-hidden">
                <div className="flex items-center gap-5 mb-6">
                  <div className="p-4 bg-amber-500 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform">
                    <Star size={28} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">Valeurs</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
                  Notre action est guidée par l'effort propre, la volonté de ne laisser personne de côté et une approche sans aucune discrimination.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Nampiana dark:bg-slate-950 dark:border-slate-900 dark:text-slate-500 */}
      <footer className="px-10 py-6 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors">
        <p>© 2026 ONG TSINJO AINA FIANARANTSOA</p>
        <div className="flex gap-8 mt-4 md:mt-0">
          <a href="#" className="hover:text-blue-600 transition-colors">Facebook</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;