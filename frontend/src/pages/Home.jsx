import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { User, ShieldCheck, ChevronDown, Compass, Sprout, HeartHandshake, Leaf, ArrowRight, MapPin } from 'lucide-react';

import logo from '../assets/logo.png';
import bgImage from '../assets/inter.png';

const Home = () => {
  const [showRoles, setShowRoles] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const titles = [
    'Agir pour un avenir durable',
    'ONG Tsinjo Aina Fianarantsoa',
    'Haute Matsiatra, Madagascar',
  ];

  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTitleIndex((prev) => (prev + 1) % titles.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const pillars = [
    {
      eyebrow: 'Racine',
      title: 'Valeurs',
      icon: HeartHandshake,
      accent: '#22C55E',
      text: "Guidés par l'effort propre, la volonté de ne laisser personne de côté et une approche sans discrimination.",
    },
    {
      eyebrow: 'Terrain',
      title: 'Mission',
      icon: Sprout,
      accent: '#10B981',
      text: "Œuvrer pour le développement humain durable, l'autopromotion des communautés et la protection de l'environnement.",
    },
    {
      eyebrow: 'Horizon',
      title: 'Vision',
      icon: Compass,
      accent: '#38BDF8',
      text: 'Faire de chaque bénéficiaire un citoyen responsable, acteur de son développement, dans une société équitable.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 16,
      },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: 15, filter: 'blur(5px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.55, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      y: -12,
      filter: 'blur(5px)',
      transition: { duration: 0.25, ease: 'easeIn' },
    },
  };

  return (
    <div className="min-h-screen w-screen overflow-x-hidden relative bg-[#F4FBF8] font-body text-slate-900">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');

        .font-body {
          font-family: 'DM Sans', sans-serif;
        }

        .font-display {
          font-family: 'Manrope', sans-serif;
        }
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 z-0 bg-[#073B32]" />

      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})`, filter: 'brightness(1.25) saturate(1.05)' }}
      />

      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#064E3B]/75 via-[#087F5B]/50 to-[#38BDF8]/40" />

      <div className="fixed inset-0 z-0 bg-black/5" />

      {/* Decorative lights */}
      <div className="fixed -top-32 -right-32 z-0 w-[420px] h-[420px] rounded-full bg-[#38BDF8]/20 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 z-0 w-[500px] h-[500px] rounded-full bg-[#22C55E]/20 blur-3xl pointer-events-none" />

      {/* Navbar — sans cadre : plus de boîte, la nav flotte directement sur le fond */}
      <nav className="relative z-50 px-5 sm:px-8 lg:px-12 pt-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-br from-[#22C55E] to-[#38BDF8] shadow-lg">
              <div className="w-full h-full rounded-full overflow-hidden bg-white">
                <img src={logo} alt="Logo Tsinjo Aina" className="w-full h-full object-cover rounded-full" />
              </div>
            </div>

            <div className="leading-none">
              <span className="font-display text-sm sm:text-base font-extrabold text-white tracking-tight drop-shadow-sm">
               ONG TSINJO AINA
              </span>
              <span className="block mt-1 text-[9px] uppercase tracking-[0.2em] text-emerald-200">
                Fianarantsoa
              </span>
            </div>
          </motion.div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="hidden sm:flex px-4 py-2.5 rounded-xl text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-all"
            >
              Se connecter
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowRoles(!showRoles)}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#38BDF8] text-white text-sm font-bold shadow-lg shadow-[#38BDF8]/20 hover:-translate-y-0.5 hover:shadow-xl transition-all"
              >
                <span>S'inscrire</span>
                <motion.div animate={{ rotate: showRoles ? 180 : 0 }}>
                  <ChevronDown size={15} />
                </motion.div>
              </button>

              <AnimatePresence>
                {showRoles && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    className="absolute right-0 mt-3 w-52 p-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-white shadow-2xl"
                  >
                    <Link
                      to="/register?role=admin"
                      onClick={() => setShowRoles(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                    >
                      <span className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center">
                        <ShieldCheck size={18} className="text-sky-500" />
                      </span>
                      Administrateur
                    </Link>

                    <Link
                      to="/register?role=user"
                      onClick={() => setShowRoles(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <span className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <User size={18} className="text-emerald-500" />
                      </span>
                      Utilisateur
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="relative z-10 min-h-[calc(100vh-105px)] px-5 sm:px-8 lg:px-12 py-10 flex items-center">
        <div className="max-w-7xl w-full mx-auto">

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid lg:grid-cols-[1.08fr_0.92fr] gap-10 lg:gap-16 items-center"
          >

            {/* Hero */}
            <div className="text-center lg:text-left">

              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em]"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center">
                  <Leaf size={12} className="text-emerald-300" />
                </span>
                Développement humain & autopromotion
              </motion.div>

              <div className="mt-7 min-h-[125px] sm:min-h-[145px] flex items-center justify-center lg:justify-start">
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={currentTitleIndex}
                    variants={titleVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.05] tracking-[-0.04em] text-white max-w-4xl drop-shadow-[0_8px_25px_rgba(0,0,0,0.2)]"
                  >
                    {titles[currentTitleIndex]}
                  </motion.h1>
                </AnimatePresence>
              </div>

              <motion.div variants={fadeInUp} className="mt-5 flex items-center justify-center lg:justify-start gap-2">
                <span className="h-[3px] w-12 rounded-full bg-[#22C55E]" />
                <span className="h-[3px] w-24 rounded-full bg-[#38BDF8]" />
              </motion.div>

              <motion.p
                variants={fadeInUp}
                className="mt-7 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base lg:text-lg leading-relaxed text-white/80"
              >
                Construire ensemble un avenir durable en plaçant les communautés, l'environnement et le développement humain au cœur de notre action.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
              >
                <Link
                  to="/login"
                  className="group flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white text-emerald-700 font-bold text-sm shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all"
                >
                  Découvrir nos actions
                  <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center gap-2 px-4 py-3 text-white/75 text-sm">
                  <MapPin size={16} className="text-sky-300" />
                  Haute Matsiatra
                </div>
              </motion.div>
            </div>

            {/* Values — sans cadre : plus de carte encadrée, la liste repose directement sur le fond */}
            <motion.div variants={fadeInUp} className="relative">
              <div className="mb-7">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-sky-300">
                  Notre engagement
                </span>

                <h2 className="mt-1 font-display text-xl sm:text-2xl font-extrabold text-white drop-shadow-sm">
                  Agir. Construire. Transformer.
                </h2>
              </div>

              <div className="divide-y divide-white/15">
                {pillars.map((p, index) => {
                  const Icon = p.icon;

                  return (
                    <motion.div
                      key={p.title}
                      whileHover={prefersReducedMotion ? {} : { x: 6 }}
                      className="flex items-start gap-4 py-5 first:pt-0 last:pb-0 transition-transform"
                    >
                      <div
                        className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-white/5 border"
                        style={{ borderColor: p.accent }}
                      >
                        <Icon size={20} style={{ color: p.accent }} />
                      </div>

                      <div>
                        <div
                          className="text-[9px] uppercase tracking-[0.18em] font-bold"
                          style={{ color: p.accent }}
                        >
                          0{index + 1} · {p.eyebrow}
                        </div>

                        <h3 className="mt-1 font-display text-base sm:text-lg font-bold text-white">
                          {p.title}
                        </h3>

                        <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-white/65">
                          {p.text}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-6 pt-5 border-t border-white/15 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Une vision durable
                </div>

                <span className="text-xs font-semibold text-sky-300">
                  Madagascar
                </span>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 px-5 sm:px-8 lg:px-12 pb-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/15 text-white/60 text-[10px] sm:text-xs">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} ONG TSINJO AINA — FIANARANTSOA, HAUTE MATSIATRA
          </p>

          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-sky-300 transition-colors">Facebook</a>
            <a href="#" className="hover:text-emerald-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;