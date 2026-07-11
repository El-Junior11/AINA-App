import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShieldCheck, ChevronDown, Eye, Target, Star, HeartHandshake } from 'lucide-react';

import logo from '../assets/logo.png'; 
import bgImage from '../assets/inter.png'; 

const Home = () => {
  const [showRoles, setShowRoles] = useState(false);
  
  // Lohateny mifandimby (Loop)
  const titles = [
    "Agir pour un avenir durable",
    "ONG Tsinjo Aina Fianarantsoa",
    "Haute Matsiatra, Madagascar"
  ];
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTitleIndex((prevIndex) => (prevIndex + 1) % titles.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 100, damping: 15 } 
    }
  };

  const titleContainerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.035, delayChildren: 0.05 }
    },
    exit: {
      opacity: 1,
      transition: { staggerChildren: 0.015, staggerDirection: -1 }
    }
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { duration: 0.04, ease: "easeOut" } 
    },
    exit: {
      opacity: 0,
      y: -8,
      filter: "blur(4px)",
      transition: { duration: 0.02, ease: "easeIn" }
    }
  };

  return (
    /* h-screen sy overflow-hidden ampiasaina mba tsy hisy scrollbar mihitsy */
    <div 
      className="h-screen w-screen overflow-hidden relative flex flex-col font-sans bg-cover bg-center bg-no-repeat select-none"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      
      {/* OVERLAY MAZAVA - Tsy manankona ny sary background */}
      <div className="absolute inset-0 bg-black/20 z-0" />

      {/* --- NAVBAR --- */}
      <nav className="h-16 flex items-center justify-between px-4 sm:px-8 bg-slate-900/30 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 text-white shrink-0">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-full border-2 border-indigo-500 p-0.5 overflow-hidden bg-white shrink-0 flex items-center justify-center shadow-md">
            <img 
              src={logo} 
              alt="Logo Tsinjo Aina"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xs font-bold text-white tracking-tight drop-shadow-md">
              ONG Tsinjo Aina
            </span>
            <span className="text-[10px] text-slate-200 font-medium drop-shadow-md">
              Fianarantsoa
            </span>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <Link 
            to="/login" 
            className="text-xs font-semibold px-3 py-2 rounded-lg text-slate-100 hover:text-white hover:bg-white/20 transition-colors drop-shadow-md"
          >
            Se connecter
          </Link>
          
          <div className="relative">
            <button 
              onClick={() => setShowRoles(!showRoles)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <span>S'inscrire</span>
              <motion.div animate={{ rotate: showRoles ? 180 : 0 }}>
                <ChevronDown size={14} />
              </motion.div>
            </button>

            <AnimatePresence>
              {showRoles && (
                <motion.div 
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="absolute right-0 mt-2 w-48 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 p-1.5 z-50"
                >
                  <Link 
                    to="/register?role=admin" 
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-indigo-600/30 rounded-lg text-xs font-semibold text-slate-100 hover:text-white transition-colors group"
                  >
                    <ShieldCheck size={16} className="text-indigo-400 group-hover:scale-105 transition-transform" />
                    Administrateur
                  </Link>
                  <Link 
                    to="/register?role=user" 
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-emerald-600/30 rounded-lg text-xs font-semibold text-slate-100 hover:text-white transition-colors group"
                  >
                    <User size={16} className="text-emerald-400 group-hover:scale-105 transition-transform" />
                    Utilisateur
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 overflow-hidden">
        
        <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
          
          {/* BADGE TOP */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/40 backdrop-blur-md border border-white/20 text-indigo-200 text-[11px] font-semibold mb-6 shadow-xl"
          >
            <HeartHandshake size={14} className="text-indigo-400" />
            <span>Développement humain & autopromotion</span>
          </motion.div>

          {/* DYNAMIC TITLE */}
          <div className="text-center mb-10 min-h-[60px] sm:min-h-[80px] flex flex-col justify-center items-center w-full">
            <AnimatePresence mode="wait">
              <motion.h1 
                key={currentTitleIndex}
                variants={titleContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-snug flex justify-center flex-wrap px-2 drop-shadow-xl"
              >
                {titles[currentTitleIndex].split("").map((char, index) => (
                  <motion.span
                    key={index}
                    variants={letterVariants}
                    className={
                      currentTitleIndex === 0
                        ? "bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-blue-200 to-white"
                        : currentTitleIndex === 1
                        ? "text-white"
                        : "bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 to-teal-100"
                    }
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </motion.h1>
            </AnimatePresence>
          </div>

          {/* SECTION TEXTES: NESORINA NY CARD BACKGROUND (Tsy misy boite intsony) */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full"
          >
            {/* Vision */}
            <motion.div variants={fadeInUp} className="flex flex-col items-start text-left">
              <div className="flex items-center gap-2.5 mb-2">
                <Eye size={24} className="text-indigo-400 shrink-0 drop-shadow-md" />
                <h3 className="text-lg font-bold text-white tracking-wide drop-shadow-md">Vision</h3>
              </div>
              <p className="text-xs text-slate-100 leading-relaxed font-medium drop-shadow-md">
                Faire de chaque bénéficiaire un citoyen responsable, prenant en main son développement et vivant en harmonie dans une société équitable.
              </p>
            </motion.div>

            {/* Mission */}
            <motion.div variants={fadeInUp} className="flex flex-col items-start text-left">
              <div className="flex items-center gap-2.5 mb-2">
                <Target size={24} className="text-emerald-400 shrink-0 drop-shadow-md" />
                <h3 className="text-lg font-bold text-white tracking-wide drop-shadow-md">Mission</h3>
              </div>
              <p className="text-xs text-slate-100 leading-relaxed font-medium drop-shadow-md">
                Œuvrer pour le développement humain durable, l'autopromotion des communautés et la protection de l'environnement.
              </p>
            </motion.div>

            {/* Valeurs */}
            <motion.div variants={fadeInUp} className="flex flex-col items-start text-left">
              <div className="flex items-center gap-2.5 mb-2">
                <Star size={24} className="text-amber-400 shrink-0 drop-shadow-md" />
                <h3 className="text-lg font-bold text-white tracking-wide drop-shadow-md">Valeurs</h3>
              </div>
              <p className="text-xs text-slate-100 leading-relaxed font-medium drop-shadow-md">
                Notre action est guidée par l'effort propre, la volonté de ne laisser personne de côté et une approche sans aucune discrimination.
              </p>
            </motion.div>
          </motion.div>

        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="h-14 px-4 sm:px-8 border-t border-white/20 flex flex-col sm:flex-row justify-between items-center bg-slate-900/30 backdrop-blur-md text-slate-200 text-xs shrink-0 relative z-10">
        <p className="font-medium text-[11px] sm:text-xs drop-shadow-md">
          © {new Date().getFullYear()} ONG Tsinjo Aina — Fianarantsoa, Haute Matsiatra
        </p>
        <div className="flex gap-5 mt-1 sm:mt-0 font-semibold text-[11px] sm:text-xs">
          <a href="#" className="hover:text-indigo-300 transition-colors drop-shadow-md">Facebook</a>
          <a href="#" className="hover:text-indigo-300 transition-colors drop-shadow-md">Contact</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;