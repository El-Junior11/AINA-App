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
    <div className="min-h-screen w-screen overflow-x-hidden relative bg-slate-950 font-body text-white antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
        .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 z-0 bg-slate-950" />
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})`, filter: 'brightness(1.1) saturate(1.02)' }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-emerald-950/80 via-emerald-900/60 to-slate-950/90" />
      <div className="fixed inset-0 z-0 bg-black/20" />

      {/* Navbar — Logo boribory tsara */}
      <nav className="relative z-50 px-4 md:px-6 py-4 border-b border-white/10 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3.5">
            <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-50/10 flex items-center justify-center ring-1 ring-inset ring-emerald-400/30 overflow-hidden p-0.5">
              <img src={logo} alt="Logo Tsinjo Aina" className="h-full w-full object-cover rounded-full" />
            </div>

            <div className="leading-tight">
              <span className="font-display text-sm md:text-base font-semibold text-white tracking-tight">
                ONG TSINJO AINA
              </span>
              <span className="block text-[11px] text-emerald-300/80 font-medium">
                Fianarantsoa
              </span>
            </div>
          </motion.div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors"
            >
              Se connecter
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowRoles(!showRoles)}
                className="h-10 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center gap-2 text-sm font-medium shadow-sm transition-colors cursor-pointer"
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
                    className="absolute right-0 mt-2 w-52 p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-xl z-50 text-slate-100"
                  >
                    <Link
                      to="/register?role=admin"
                      onClick={() => setShowRoles(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                    >
                      <span className="w-8 h-8 rounded-md bg-sky-950 text-sky-400 flex items-center justify-center ring-1 ring-sky-900">
                        <ShieldCheck size={16} />
                      </span>
                      Administrateur
                    </Link>

                    <Link
                      to="/register?role=user"
                      onClick={() => setShowRoles(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                    >
                      <span className="w-8 h-8 rounded-md bg-emerald-950 text-emerald-400 flex items-center justify-center ring-1 ring-emerald-900">
                        <User size={16} />
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
      <main className="relative z-10 min-h-[calc(100vh-80px)] px-4 md:px-6 py-12 flex items-center">
        <div className="max-w-7xl w-full mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid lg:grid-cols-[1.08fr_0.92fr] gap-10 lg:gap-16 items-center"
          >
            <div className="text-center lg:text-left">
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold"
              >
                <span className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center">
                  <Leaf size={11} className="text-emerald-300" />
                </span>
                Développement humain & autopromotion
              </motion.div>

              <div className="mt-6 min-h-[120px] sm:min-h-[140px] flex items-center justify-center lg:justify-start">
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={currentTitleIndex}
                    variants={titleVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight text-white max-w-4xl"
                  >
                    {titles[currentTitleIndex]}
                  </motion.h1>
                </AnimatePresence>
              </div>

              <motion.div variants={fadeInUp} className="mt-4 flex items-center justify-center lg:justify-start gap-2">
                <span className="h-1 w-10 rounded-full bg-emerald-500" />
                <span className="h-1 w-20 rounded-full bg-sky-400" />
              </motion.div>

              <motion.p
                variants={fadeInUp}
                className="mt-6 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base leading-relaxed text-slate-300 font-medium"
              >
                Construire ensemble un avenir durable en plaçant les communautés, l'environnement et le développement humain au cœur de notre action.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
              >
                <Link
                  to="/login"
                  className="group h-11 px-6 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-colors cursor-pointer"
                >
                  Découvrir nos actions
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center gap-2 px-4 py-3 text-slate-300 text-sm font-medium">
                  <MapPin size={16} className="text-sky-400" />
                  Haute Matsiatra
                </div>
              </motion.div>
            </div>

            <motion.div variants={fadeInUp} className="relative bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 md:p-8 shadow-xl">
              <div className="mb-6">
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  Notre engagement
                </span>
                <h2 className="mt-1 font-display text-xl font-bold text-white">
                  Agir. Construire. Transformer.
                </h2>
              </div>

              <div className="divide-y divide-slate-800">
                {pillars.map((p, index) => {
                  const Icon = p.icon;
                  return (
                    <motion.div
                      key={p.title}
                      whileHover={prefersReducedMotion ? {} : { x: 4 }}
                      className="flex items-start gap-4 py-4 first:pt-0 last:pb-0 transition-transform"
                    >
                      <div className="shrink-0 h-10 w-10 rounded-lg flex items-center justify-center bg-slate-800/80 ring-1 ring-slate-700">
                        <Icon size={18} style={{ color: p.accent }} />
                      </div>

                      <div>
                        <div
                          className="text-[11px] uppercase tracking-wider font-semibold"
                          style={{ color: p.accent }}
                        >
                          0{index + 1} · {p.eyebrow}
                        </div>

                        <h3 className="mt-0.5 font-display text-base font-semibold text-white">
                          {p.title}
                        </h3>

                        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-300">
                          {p.text}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Une vision durable
                </div>

                <span className="text-xs font-semibold text-sky-400">
                  Madagascar
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 px-4 md:px-6 pb-6 pt-4 border-t border-white/10 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-xs font-medium">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} ONG TSINJO AINA — FIANARANTSOA, HAUTE MATSIATRA
          </p>

          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-white transition-colors">Facebook</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;