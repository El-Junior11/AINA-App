import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Compass, Sprout, HeartHandshake, ArrowRight, MapPin, Menu, X, ExternalLink, Globe, ArrowUp, Phone, Mail } from 'lucide-react';
import logo from '../assets/logo.png';
import bgImage from '../assets/inter.png';

const titles = [
  { first: 'Agir pour un avenir', second: 'durable' },
  { first: 'ONG TSINJO AINA', second: 'Fianarantsoa' },
  { first: 'Haute Matsiatra,', second: 'Madagascar' }
];

const pillars = [
  { title: 'Nos valeurs', icon: HeartHandshake, color: 'bg-emerald-50 text-emerald-700', text: "Guidés par l'effort propre, la volonté de ne laisser personne de côté et une approche sans discrimination." },
  { title: 'Notre mission', icon: Sprout, color: 'bg-sky-50 text-sky-700', text: "Œuvrer pour le développement humain durable, l'autopromotion des communautés et la protection de l'environnement." },
  { title: 'Notre vision', icon: Compass, color: 'bg-teal-50 text-teal-700', text: 'Faire de chaque bénéficiaire un citoyen responsable, acteur de son développement, dans une société équitable.' }
];

const ABOUT_URL = 'https://taf.ongtsinjoainafi.org';
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2';
const primaryButton = `inline-flex items-center justify-center gap-2 rounded-lg bg-[#176B46] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#105437] ${focusRing}`;
const secondaryButton = `inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 ${focusRing}`;
const navLink = 'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-[#176B46]';

const Caret = ({ blinking }) => (
  <span aria-hidden="true" className={`ml-1 inline-block h-[0.85em] w-[2px] bg-current align-middle ${blinking ? 'aina-caret' : ''}`}/>
);

export default function Home() {
  const prefersReducedMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [titleIndex, setTitleIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [phase, setPhase] = useState('typing');
  const current = titles[titleIndex];
  const total = current.first.length + 1 + current.second.length;

  useEffect(() => {
    if (prefersReducedMotion) return;
    let timer;
    if (phase === 'typing') {
      timer = charCount < total
        ? setTimeout(() => setCharCount(c => c + 1), 75)
        : setTimeout(() => setPhase('deleting'), 2800);
    } else {
      timer = charCount > 0
        ? setTimeout(() => setCharCount(c => c - 1), 35)
        : setTimeout(() => {
          setTitleIndex(i => (i + 1) % titles.length);
          setPhase('typing');
        }, 400);
    }
    return () => clearTimeout(timer);
  }, [charCount, phase, total, prefersReducedMotion]);

  useEffect(() => {
    const close = event => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);

  const visibleCount = prefersReducedMotion ? total : charCount;
  const firstText = current.first.slice(0, visibleCount);
  const secondText = current.second.slice(0, Math.max(0, visibleCount - current.first.length - 1));
  const caretOnSecond = visibleCount > current.first.length;
  const blinking = charCount === total || charCount === 0;

  const animation = prefersReducedMotion ? {} : {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45 }
  };

  const scrollTo = (event, id) => {
    event.preventDefault();
    setMenuOpen(false);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  };

  return (
    <div id="accueil" className="aina-home flex min-h-screen w-full flex-col bg-[#F8FAF9] text-slate-900 antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800&display=swap');

        .aina-home {
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .aina-home .aina-display {
          font-family: 'Playfair Display', Georgia, serif;
        }
        .aina-home #contact {
          scroll-margin-top: 80px;
        }
        .aina-hero {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          min-height: clamp(490px, 48vh, 680px);
          border-radius: 150px 0 150px 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .aina-title-container { container-type: inline-size; }
        .aina-animated-title { font-size: clamp(12px, 5.3cqi, 60px); white-space: nowrap; min-height: 1.3em; }
        .aina-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.98) 0%,
            rgba(255,255,255,0.94) 25%,
            rgba(255,255,255,0.85) 43%,
            rgba(255,255,255,0.20) 75%,
            rgba(255,255,255,0.02) 100%
          );
        }
        @keyframes aina-blink {
          0%,49% { opacity: 1; }
          50%,100% { opacity: 0; }
        }
        .aina-caret {
          animation: aina-blink 1s steps(1) infinite;
        }
        @media (max-width: 1023px) {
          .aina-hero {
            border-radius: 100px 0 100px 0;
          }
          .aina-hero::before {
            background: linear-gradient(
              90deg,
              rgba(255,255,255,0.97),
              rgba(255,255,255,0.85) 65%,
              rgba(255,255,255,0.40)
            );
          }
        }
        @media (max-width: 767px) {
          .aina-hero {
            min-height: 450px;
            border-radius: 65px 0 65px 0;
            background-position: 60% center;
          }
          .aina-hero::before {
            background: linear-gradient(
              90deg,
              rgba(255,255,255,0.96),
              rgba(255,255,255,0.82)
            );
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .aina-caret { animation: none; }
        }
      `}</style>

      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <nav className="mx-auto flex h-[74px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className={`flex min-w-0 items-center gap-3 rounded-lg ${focusRing}`}>
            <img src={logo} alt="Logo ONG Tsinjo Aina" className="h-12 w-12 shrink-0 object-contain"/>
            <div className="min-w-0">
              <h2 className="aina-display text-base font-bold leading-tight text-[#176B46] sm:text-lg">ONG TSINJO AINA</h2>
              <p className="mt-1 text-[11px] font-medium text-slate-500">Fianarantsoa, Madagascar</p>
            </div>
          </Link>

          {/* NAVIGATION DESKTOP */}
          <div className="hidden items-center gap-2 lg:flex">
            <a href="#accueil" onClick={event => scrollTo(event, 'accueil')}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[#176B46]">
              Accueil
            </a>
            <a href={ABOUT_URL} target="_blank" rel="noopener noreferrer" className={navLink}>À propos</a>
            <a href="#contact" onClick={event => scrollTo(event, 'contact')} className={navLink}>Contact</a>
            <Link to="/login" className={navLink}>Se connecter</Link>
            <Link to="/register" className={navLink}>S'inscrire</Link>
          </div>

          <button type="button" onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen} aria-controls="aina-mobile-menu"
            className="rounded-lg border border-slate-200 p-2.5 text-slate-700 lg:hidden">
            {menuOpen ? <X size={21}/> : <Menu size={21}/>}
          </button>
        </nav>

        {/* NAVIGATION MOBILE */}
        {menuOpen && (
          <div id="aina-mobile-menu" className="space-y-2 border-t border-slate-100 bg-white p-4 lg:hidden">
            <a href="#accueil" onClick={event => scrollTo(event, 'accueil')}
              className="block rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              Accueil
            </a>
            <a href={ABOUT_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
              À propos
            </a>
            <a href="#contact" onClick={event => scrollTo(event, 'contact')}
              className="block rounded-lg px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
              Contact
            </a>
            <Link to="/login" onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
              Se connecter
            </Link>
            <Link to="/register" onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
              S'inscrire
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">

        {/* ACCUEIL AVEC IMAGE DE FOND */}
        <section className="bg-[#F8FAF9] px-3 pt-4 sm:px-5 lg:px-8 lg:pt-6">
          <div className="aina-hero flex items-center" style={{ backgroundImage: `url("${bgImage}")` }}>
            <div className="mx-auto w-full max-w-[1600px] px-3 py-12 sm:px-8 lg:px-14 lg:py-16">
              <motion.div {...animation} className="aina-title-container relative w-full min-w-0 max-w-[1000px]">

                <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/90 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"/>
                  Plateforme de gestion communautaire
                </div>

                <h1 className="sr-only">ONG Tsinjo Aina — Agir pour un avenir durable</h1>

                <div aria-hidden="true"
                  className="aina-display aina-animated-title mt-5 font-bold leading-[1.3] tracking-tight">
                  <span className="text-[#176B91]">
                    {firstText}
                    {!caretOnSecond && !prefersReducedMotion && <Caret blinking={blinking}/>}
                  </span>
                  <span className="text-[#176B46]">
                    {caretOnSecond && ' '}{secondText}
                    {caretOnSecond && !prefersReducedMotion && <Caret blinking={blinking}/>}
                  </span>
                </div>

                <p className="mt-4 max-w-lg text-sm font-medium leading-7 text-slate-700 sm:text-base">
                  Construire ensemble un avenir durable en plaçant les communautés,
                  l'environnement et le développement humain au cœur de notre action.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link to="/login" className={`${primaryButton} group`}>
                    Accéder à la plateforme
                    <ArrowRight size={17} className="shrink-0 transition-transform group-hover:translate-x-1"/>
                  </Link>
                  <a href={ABOUT_URL} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
                    Découvrir l'ONG <ExternalLink size={15}/>
                  </a>
                </div>

                <div className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-600">
                  <MapPin size={16} className="shrink-0 text-[#176B46]"/>
                  Fianarantsoa · Haute Matsiatra · Madagascar
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* VALEURS, MISSION ET VISION */}
        <section className="mx-auto max-w-[1600px] px-4 py-9 sm:px-6 lg:px-8 lg:py-11">
          <div className="mb-6 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#176B46]">Notre engagement</span>
            <h2 className="aina-display mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Agir. Construire. Transformer.
            </h2>
            <div className="mx-auto mt-3 h-[3px] w-12 rounded-full bg-[#176B46]"/>
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {pillars.map(({ title, icon: Icon, color, text }) => (
              <article key={title} className="min-w-0 py-2">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${color}`}><Icon size={24} strokeWidth={1.8}/></div>
                  <h3 className="aina-display text-xl font-bold text-slate-900">{title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER ET CONTACT */}
      <footer id="contact" className="relative bg-[#103F30] text-white">
        <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-9 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_0.8fr_1fr] lg:px-8">

          {/* PRÉSENTATION */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white p-1">
                <img src={logo} alt="Logo Tsinjo Aina" className="h-full w-full object-contain"/>
              </div>
              <div>
                <h3 className="aina-display text-lg font-bold">ONG TSINJO AINA</h3>
                <p className="mt-1 text-xs text-emerald-100/70">Fianarantsoa, Madagascar</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-emerald-100/80">
              Organisation engagée dans le développement humain durable,
              l'autopromotion des communautés et la protection de l'environnement.
            </p>
          </div>

          {/* LIENS RAPIDES */}
          <div>
            <h3 className="aina-display mb-4 text-lg font-semibold">Navigation</h3>
            <div className="flex flex-col items-start gap-3 text-sm text-emerald-100/80">
              <a href="#accueil" onClick={event => scrollTo(event, 'accueil')} className="hover:text-white">Accueil</a>
              <a href={ABOUT_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white">À propos</a>
              <Link to="/login" className="hover:text-white">Se connecter</Link>
              <Link to="/register" className="hover:text-white">S'inscrire</Link>
            </div>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="aina-display mb-4 text-lg font-semibold">Contactez-nous</h3>
            <div className="space-y-4 text-sm text-emerald-100/80">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-emerald-300"/>
                <div>
                  <p className="font-semibold text-white">Adresse</p>
                  <p className="mt-1">Lot 602/3306 Idanda,</p>
                  <p>Fianarantsoa 301, Madagascar</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 shrink-0 text-emerald-300"/>
                <div>
                  <p className="font-semibold text-white">Téléphone</p>
                  <a href="tel:+261341253074" className="mt-1 block hover:text-white hover:underline">+261 34 12 530 74</a>
                  <a href="tel:+261383008374" className="block hover:text-white hover:underline">+261 38 30 083 74</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 shrink-0 text-emerald-300"/>
                <div className="min-w-0">
                  <p className="font-semibold text-white">E-mail</p>
                  <a href="mailto:tsinjoainafi@yahoo.com" className="mt-1 block break-all hover:text-white hover:underline">tsinjoainafi@yahoo.com</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe size={18} className="mt-0.5 shrink-0 text-emerald-300"/>
                <div>
                  <p className="font-semibold text-white">Site web</p>
                  <a href={ABOUT_URL} target="_blank" rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 hover:text-white hover:underline">
                    Site officiel de l'ONG <ExternalLink size={13}/>
                  </a>
                </div>
              </div>
              <a href={ABOUT_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/10">
                En savoir plus <ArrowRight size={15}/>
              </a>
            </div>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-emerald-100/70 sm:flex-row sm:px-6 lg:px-8">
            <p className="text-center sm:text-left">
              © {new Date().getFullYear()} ONG TSINJO AINA. Tous droits réservés.
            </p>
            <div className="flex min-w-0 flex-wrap items-center justify-center gap-4">
              <span>Plateforme de gestion communautaire</span>
              <button type="button" onClick={event => scrollTo(event, 'accueil')}
                title="Retour en haut" aria-label="Retour en haut"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 text-white transition-colors hover:bg-white/10">
                <ArrowUp size={16}/>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}