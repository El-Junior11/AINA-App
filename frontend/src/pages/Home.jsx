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

  // Animation letter by letter
  const currentText = titles[currentTitleIndex];

  const letterVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.04, duration: 0.1 },
    }),
    exit: (i) => ({
      opacity: 0,
      y: -10,
      transition: { delay: i * 0.02, duration: 0.08 },
    }),
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentTitleIndex((prev) => (prev + 1) % titles.length);
    }, currentText.length * 50 + 2000);

    return () => clearTimeout(timeout);
  }, [currentTitleIndex, currentText.length]);

  const pillars = [
    {
      eyebrow: 'Racine',
      title: 'Valeurs',
      icon: HeartHandshake,
      accent: '#047857',
      text: "Guidés par l'effort propre, la volonté de ne laisser personne de côté et une approche sans discrimination.",
    },
    {
      eyebrow: 'Terrain',
      title: 'Mission',
      icon: Sprout,
      accent: '#059669',
      text: "Œuvrer pour le développement humain durable, l'autopromotion des communautés et la protection de l'environnement.",
    },
    {
      eyebrow: 'Horizon',
      title: 'Vision',
      icon: Compass,
      accent: '#0284c7',
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

  return (
    <div className="min-h-screen w-screen overflow-x-hidden relative bg-slate-50 font-body text-slate-900 antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
        .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 z-0 bg-slate-900" />
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})`, filter: 'brightness(1.15) saturate(1.05)' }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-emerald-950/70 via-slate-950/60 to-slate-900/80" />
      <div className="fixed inset-0 z-0 bg-black/15" />

      {/* Navbar — Transparent sy backdrop-blur */}
      <nav className="relative z-50 px-4 md:px-6 py-4 border-b border-white/15 bg-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3.5">
            <div className="h-10 w-10 shrink-0 rounded-full bg-white/20 flex items-center justify-center ring-1 ring-inset ring-white/30 overflow-hidden p-0.5 shadow-sm">
              <img src={logo} alt="Logo Tsinjo Aina" className="h-full w-full object-cover rounded-full" />
            </div>

            <div className="leading-tight">
              <span className="font-display text-sm md:text-base font-semibold text-white tracking-tight">
                ONG TSINJO AINA
              </span>
              <span className="block text-[11px] text-emerald-200 font-medium">
                Fianarantsoa
              </span>
            </div>
          </motion.div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium text-white/90 hover:text-white hover:bg-white/15 transition-colors"
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
                    className="absolute right-0 mt-2 w-52 p-1 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl z-50 text-slate-900"
                  >
                    <Link
                      to="/register?role=admin"
                      onClick={() => setShowRoles(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                    >
                      <span className="w-8 h-8 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center ring-1 ring-sky-200">
                        <ShieldCheck size={16} />
                      </span>
                      Administrateur
                    </Link>

                    <Link
                      to="/register?role=user"
                      onClick={() => setShowRoles(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                    >
                      <span className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center ring-1 ring-emerald-200">
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
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold shadow-sm"
              >
                <span className="w-4 h-4 rounded-full bg-emerald-400/30 flex items-center justify-center">
                  <Leaf size={11} className="text-emerald-200" />
                </span>
                Développement humain & autopromotion
              </motion.div>

              {/* Lohateny manao animation lettre par lettre */}
              <div className="mt-6 min-h-[120px] sm:min-h-[140px] flex items-center justify-center lg:justify-start">
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={currentTitleIndex}
                    className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight text-white max-w-4xl"
                  >
                    {currentText.split('').map((char, i) => (
                      <motion.span
                        key={i}
                        custom={i}
                        variants={letterVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </motion.span>
                    ))}
                  </motion.h1>
                </AnimatePresence>
              </div>

              <motion.div variants={fadeInUp} className="mt-4 flex items-center justify-center lg:justify-start gap-2">
                <span className="h-1 w-10 rounded-full bg-emerald-400" />
                <span className="h-1 w-20 rounded-full bg-sky-400" />
              </motion.div>

              <motion.p
                variants={fadeInUp}
                className="mt-6 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base leading-relaxed text-slate-200 font-medium"
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

                <div className="flex items-center gap-2 px-4 py-3 text-slate-200 text-sm font-medium">
                  <MapPin size={16} className="text-sky-300" />
                  Haute Matsiatra
                </div>
              </motion.div>
            </div>

            {/* Card misy ny "Notre engagement" — Natao transparent tanteraka sy backdrop-blur */}
            <motion.div variants={fadeInUp} className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 md:p-8 shadow-2xl">
              <div className="mb-6">
                <span className="text-xs font-semibold text-sky-300 uppercase tracking-wider">
                  Notre engagement
                </span>
                <h2 className="mt-1 font-display text-xl font-bold text-white">
                  Agir. Construire. Transformer.
                </h2>
              </div>

              <div className="divide-y divide-white/15">
                {pillars.map((p, index) => {
                  const Icon = p.icon;
                  return (
                    <motion.div
                      key={p.title}
                      whileHover={prefersReducedMotion ? {} : { x: 4 }}
                      className="flex items-start gap-4 py-4 first:pt-0 last:pb-0 transition-transform"
                    >
                      <div className="shrink-0 h-10 w-10 rounded-lg flex items-center justify-center bg-white/15 ring-1 ring-white/30">
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

                        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-200">
                          {p.text}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-300">
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

      {/* Footer — Transparent sy backdrop-blur */}
      <footer className="relative z-20 px-4 md:px-6 pb-6 pt-4 border-t border-white/15 bg-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-200 text-xs font-medium">
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