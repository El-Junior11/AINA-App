import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { User, Compass, Sprout, HeartHandshake, ArrowRight, MapPin } from 'lucide-react';
import logo from '../assets/logo.png';
import bgImage from '../assets/inter.png';

// Titres animés : première ligne en bleu, seconde ligne en vert
const titles = [
  { first: 'Agir pour un avenir', second: 'durable' },
  { first: 'ONG TSINJO AINA', second: 'Fianarantsoa' },
  { first: 'Haute Matsiatra,', second: 'Madagascar' }
];

const pillars = [
  { eyebrow: 'Racine', title: 'Valeurs', icon: HeartHandshake, text: "Guidés par l'effort propre, la volonté de ne laisser personne de côté et une approche sans discrimination." },
  { eyebrow: 'Terrain', title: 'Mission', icon: Sprout, text: "Œuvrer pour le développement humain durable, l'autopromotion des communautés et la protection de l'environnement." },
  { eyebrow: 'Horizon', title: 'Vision', icon: Compass, text: 'Faire de chaque bénéficiaire un citoyen responsable, acteur de son développement, dans une société équitable.' }
];

// Lien « À propos » (site externe)
const ABOUT_URL = 'https://taf.ongtsinjoainafi.org';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/50 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-50';

// Curseur de saisie : fixe pendant que l'on écrit ou efface, clignotant pendant les pauses
const Caret = ({ blinking }) => (
  <span
    aria-hidden="true"
    className={`inline-block w-[3px] h-[0.85em] ml-1 align-[-0.05em] bg-current rounded-[1px] ${blinking ? 'caret-blink' : ''}`}
  />
);

// Feuille décorative (forme pleine avec nervures)
const Leaf = ({ className = '', rotate = 0, delay = 0 }) => (
  <svg
    viewBox="0 0 100 140"
    aria-hidden="true"
    className={`leaf-sway absolute ${className}`}
    style={{ '--r': `${rotate}deg`, transform: `rotate(${rotate}deg)`, animationDelay: `${delay}s` }}
    fill="currentColor"
  >
    <path d="M50 4C88 34 92 92 50 136C8 92 12 34 50 4Z" />
    <g stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" strokeLinecap="round">
      <path d="M50 20V128" />
      <path d="M50 58L72 42M50 80L28 64M50 100L72 84" />
    </g>
  </svg>
);

const Home = () => {
  const prefersReducedMotion = useReducedMotion();

  // --- Effet de machine à écrire ---
  const [titleIndex, setTitleIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [phase, setPhase] = useState('typing'); // 'typing' | 'deleting'

  const current = titles[titleIndex];
  const chars = current.first + current.second;
  const total = chars.length;

  useEffect(() => {
    // Mouvement réduit : pas de saisie, le titre complet change simplement de temps en temps
    if (prefersReducedMotion) {
      const timer = setTimeout(() => setTitleIndex((i) => (i + 1) % titles.length), 5000);
      return () => clearTimeout(timer);
    }

    let timer;

    if (phase === 'typing') {
      if (charCount < total) {
        // Rythme de frappe irrégulier : léger aléa, hésitations après un espace, une virgule ou un retour à la ligne
        const previous = charCount > 0 ? chars[charCount - 1] : '';
        let delay = 65 + Math.random() * 55;
        if (previous === ' ') delay += 40 + Math.random() * 60;
        if (previous === ',') delay += 180;
        if (charCount === current.first.length) delay += 320;
        if (charCount === 0) delay += 300;
        timer = setTimeout(() => setCharCount((c) => c + 1), delay);
      } else {
        // Texte complet : on laisse le temps de le lire avant d'effacer
        timer = setTimeout(() => setPhase('deleting'), 2600);
      }
    } else {
      if (charCount > 0) {
        // L'effacement est un peu plus rapide que l'écriture
        let delay = 35 + Math.random() * 25;
        if (charCount === current.first.length) delay += 120;
        timer = setTimeout(() => setCharCount((c) => c - 1), delay);
      } else {
        // Petite pause avant d'écrire le titre suivant
        timer = setTimeout(() => {
          setTitleIndex((i) => (i + 1) % titles.length);
          setPhase('typing');
        }, 500);
      }
    }

    return () => clearTimeout(timer);
  }, [charCount, phase, titleIndex, prefersReducedMotion]);

  const visibleCount = prefersReducedMotion ? total : charCount;
  const firstText = current.first.slice(0, visibleCount);
  const secondText = current.second.slice(0, Math.max(0, visibleCount - current.first.length));
  const caretOnSecond = visibleCount > current.first.length;
  const caretBlinking = (phase === 'typing' && charCount === total) || charCount === 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 16 } }
  };

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden relative font-body text-slate-900 antialiased flex flex-col"
      style={{ background: 'linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 45%, #d1fae5 100%)' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
        .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
        @keyframes caret-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
        .caret-blink{animation:caret-blink 1.1s steps(1) infinite}
        @keyframes leaf-sway{
          0%,100%{transform:rotate(var(--r)) translateY(0)}
          50%{transform:rotate(calc(var(--r) + 3deg)) translateY(-6px)}
        }
        @media (prefers-reduced-motion: no-preference){
          .leaf-sway{animation:leaf-sway 9s ease-in-out infinite}
        }
      `}</style>

      {/* Photo très légère en arrière-plan */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center opacity-[0.10]"
        style={{ backgroundImage: `url(${bgImage})` }}
        aria-hidden="true"
      />

      {/* Décor nature : cercles doux et feuilles */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-emerald-200/40" />
        <div className="absolute -right-32 -top-32 h-[26rem] w-[26rem] rounded-full bg-emerald-300/30" />

        <Leaf className="text-emerald-400/35 w-24 sm:w-32 -top-2 right-[8%]" rotate={32} />
        <Leaf className="text-emerald-500/25 w-16 sm:w-20 top-24 right-[2%]" rotate={-18} delay={1.5} />
        <Leaf className="text-emerald-300/45 w-20 sm:w-28 bottom-40 -left-4" rotate={-38} delay={0.8} />
        <Leaf className="text-emerald-500/20 w-14 sm:w-20 bottom-56 left-[7%]" rotate={22} delay={2.2} />
      </div>

      {/* Barre de navigation */}
      <nav className="relative z-50 px-4 md:px-6 py-4 border-b border-emerald-100 bg-white/70">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3.5">
            <div className="h-10 w-10 shrink-0 rounded-full bg-white flex items-center justify-center ring-2 ring-emerald-200 overflow-hidden p-0.5 shadow-sm">
              <img src={logo} alt="Logo Tsinjo Aina" className="h-full w-full object-cover rounded-full" />
            </div>
            <div className="leading-tight">
              <span className="font-display text-sm md:text-base font-semibold text-emerald-900 tracking-tight">ONG TSINJO AINA</span>
              <span className="block text-[11px] text-emerald-700 font-medium">Fianarantsoa</span>
            </div>
          </motion.div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <a
              href={ABOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium text-emerald-900 hover:bg-emerald-100 transition-colors ${focusRing}`}
            >
              À propos
            </a>
            <Link
              to="/login"
              className={`hidden sm:flex px-4 py-2 rounded-full text-sm font-medium text-emerald-900 hover:bg-emerald-100 transition-colors ${focusRing}`}
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className={`h-10 px-4 rounded-full bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center justify-center gap-2 text-sm font-medium shadow-sm shadow-emerald-700/20 transition-colors ${focusRing}`}
            >
              <User size={16} />
              <span>S'inscrire</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="relative z-10 flex-1 px-4 md:px-6 py-12 lg:py-16 flex items-center">
        <div className="max-w-7xl w-full mx-auto">
          <motion.div
            variants={containerVariants}
            initial={prefersReducedMotion ? false : 'hidden'}
            animate="visible"
            className="grid lg:grid-cols-[1.08fr_0.92fr] gap-10 lg:gap-16 items-center"
          >
            {/* Hero */}
            <div className="text-center lg:text-left">
              <motion.p variants={fadeInUp} className="text-sm font-semibold text-emerald-800">
                Développement humain & autopromotion
              </motion.p>

              {/* Titre vu par les lecteurs d'écran : stable, sans l'animation */}
              <h1 className="sr-only">ONG Tsinjo Aina, Fianarantsoa, Haute Matsiatra, Madagascar</h1>

              {/* Titre animé (masqué aux lecteurs d'écran pour ne pas annoncer chaque lettre) */}
              <div
                aria-hidden="true"
                className="mt-5 font-display font-bold leading-tight tracking-tight text-3xl sm:text-4xl lg:text-5xl xl:text-6xl min-h-[2.5em] text-center lg:text-left"
              >
                <span className="text-sky-700">
                  {firstText}
                  {!caretOnSecond && !prefersReducedMotion && <Caret blinking={caretBlinking} />}
                </span>
                <br />
                <span className="text-emerald-700">
                  {secondText}
                  {caretOnSecond && !prefersReducedMotion && <Caret blinking={caretBlinking} />}
                </span>
              </div>

              <motion.p
                variants={fadeInUp}
                className="mt-6 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base leading-relaxed text-slate-700"
              >
                Construire ensemble un avenir durable en plaçant les communautés, l'environnement et le développement humain au cœur de notre action.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <Link
                  to="/login"
                  className={`group h-12 px-7 rounded-full bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center justify-center gap-2 text-sm font-semibold shadow-lg shadow-emerald-700/25 transition-colors cursor-pointer ${focusRing}`}
                >
                  Accéder à la plateforme
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <div className="inline-flex items-center gap-2 h-12 px-5 rounded-full bg-white/70 ring-1 ring-emerald-200 text-emerald-900 text-sm font-medium">
                  <MapPin size={16} className="text-emerald-600" />
                  Haute Matsiatra
                </div>
              </motion.div>
            </div>

            {/* Notre engagement */}
            <motion.div
              variants={fadeInUp}
              className="relative bg-white/80 ring-1 ring-emerald-100 shadow-xl shadow-emerald-900/5 p-6 sm:p-8 space-y-6"
              style={{ borderRadius: '2rem 5rem 2rem 2rem' }}
            >
              <div>
                <span className="text-sm font-semibold text-emerald-700 block mb-1">Notre engagement</span>
                <h2 className="font-display text-2xl font-bold text-emerald-900">Agir. Construire. Transformer.</h2>
              </div>

              <div className="space-y-5 divide-y divide-emerald-100">
                {pillars.map((p) => {
                  const Icon = p.icon;
                  return (
                    <div key={p.title} className="flex items-start gap-4 pt-4 first:pt-0">
                      <div className="shrink-0 h-11 w-11 rounded-full flex items-center justify-center bg-emerald-100 ring-1 ring-emerald-200">
                        <Icon size={18} className="text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-emerald-700">{p.eyebrow}</div>
                        <h3 className="mt-0.5 font-display text-base font-semibold text-slate-900">{p.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{p.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Pied de page : bande verte arrondie, comme les pages de connexion */}
      <footer
        className="relative z-20 px-4 md:px-6 pb-6 pt-7 text-emerald-50"
        style={{
          background: 'linear-gradient(165deg, #1b7a4b 0%, #1e8556 55%, #23996a 100%)',
          borderTopLeftRadius: '2.5rem',
          borderTopRightRadius: '2.5rem'
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} ONG TSINJO AINA — FIANARANTSOA, HAUTE MATSIATRA
          </p>

          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-white hover:underline transition-colors">Facebook</a>
            <a href="#" className="hover:text-white hover:underline transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;