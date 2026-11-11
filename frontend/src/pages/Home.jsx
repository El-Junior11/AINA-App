import React,{useState,useEffect} from 'react';
import {Link} from 'react-router-dom';
import {motion,useReducedMotion} from 'framer-motion';
import {User,Compass,Sprout,HeartHandshake,ArrowRight,MapPin} from 'lucide-react';
import logo from '../assets/logo.png';
import bgImage from '../assets/inter.png';

const titles=[
  {first:'Agir pour un avenir',second:'durable'},
  {first:'ONG TSINJO AINA',second:'Fianarantsoa'},
  {first:'Haute Matsiatra,',second:'Madagascar'}
];

const pillars=[
  {eyebrow:'Racine',title:'Valeurs',icon:HeartHandshake,text:"Guidés par l'effort propre, la volonté de ne laisser personne de côté et une approche sans discrimination."},
  {eyebrow:'Terrain',title:'Mission',icon:Sprout,text:"Œuvrer pour le développement humain durable, l'autopromotion des communautés et la protection de l'environnement."},
  {eyebrow:'Horizon',title:'Vision',icon:Compass,text:'Faire de chaque bénéficiaire un citoyen responsable, acteur de son développement, dans une société équitable.'}
];

const focusRing='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950';

const Caret=({blinking})=>(
  <span aria-hidden="true" className={`inline-block w-[3px] h-[0.85em] ml-1 align-[-0.05em] bg-current rounded-[1px] ${blinking?'caret-blink':''}`}/>
);

const Home=()=>{
  const prefersReducedMotion=useReducedMotion();
  const [titleIndex,setTitleIndex]=useState(0);
  const [charCount,setCharCount]=useState(0);
  const [phase,setPhase]=useState('typing');

  const current=titles[titleIndex];
  const chars=current.first+current.second;
  const total=chars.length;

  useEffect(()=>{
    if(prefersReducedMotion){
      const timer=setTimeout(()=>setTitleIndex(i=>(i+1)%titles.length),5000);
      return()=>clearTimeout(timer);
    }
    let timer;
    if(phase==='typing'){
      if(charCount<total){
        const previous=charCount>0?chars[charCount-1]:'';
        let delay=65+Math.random()*55;
        if(previous===' ')delay+=40+Math.random()*60;
        if(previous===',')delay+=180;
        if(charCount===current.first.length)delay+=320;
        if(charCount===0)delay+=300;
        timer=setTimeout(()=>setCharCount(c=>c+1),delay);
      }else timer=setTimeout(()=>setPhase('deleting'),2600);
    }else{
      if(charCount>0){
        let delay=35+Math.random()*25;
        if(charCount===current.first.length)delay+=120;
        timer=setTimeout(()=>setCharCount(c=>c-1),delay);
      }else{
        timer=setTimeout(()=>{
          setTitleIndex(i=>(i+1)%titles.length);
          setPhase('typing');
        },500);
      }
    }
    return()=>clearTimeout(timer);
  },[charCount,phase,titleIndex,prefersReducedMotion]);

  const visibleCount=prefersReducedMotion?total:charCount;
  const firstText=current.first.slice(0,visibleCount);
  const secondText=current.second.slice(0,Math.max(0,visibleCount-current.first.length));
  const caretOnSecond=visibleCount>current.first.length;
  const caretBlinking=(phase==='typing'&&charCount===total)||charCount===0;

  const containerVariants={
    hidden:{opacity:0},
    visible:{opacity:1,transition:{staggerChildren:0.12,delayChildren:0.1}}
  };

  const fadeInUp={
    hidden:{opacity:0,y:25},
    visible:{opacity:1,y:0,transition:{type:'spring',stiffness:80,damping:16}}
  };

  return(
    <div className="min-h-screen w-full overflow-x-hidden relative bg-emerald-950 font-body text-white antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
        .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
        @keyframes caret-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
        .caret-blink{animation:caret-blink 1.1s steps(1) infinite}
      `}</style>

      <div className="fixed inset-0 z-0 bg-cover bg-center" style={{backgroundImage:`url(${bgImage})`}}/>
      <div className="fixed inset-0 z-0 bg-emerald-950/75"/>

      <nav className="relative z-50 px-4 md:px-6 py-4 border-b border-white/10 bg-emerald-950/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div initial={prefersReducedMotion?false:{opacity:0,x:-20}} animate={{opacity:1,x:0}} className="flex items-center gap-3.5">
            <div className="h-10 w-10 shrink-0 rounded-full bg-white/20 flex items-center justify-center ring-1 ring-inset ring-white/40 overflow-hidden p-0.5 shadow-sm">
              <img src={logo} alt="Logo Tsinjo Aina" className="h-full w-full object-cover rounded-full"/>
            </div>
            <div className="leading-tight">
              <span className="font-display text-sm md:text-base font-semibold text-white tracking-tight">ONG TSINJO AINA</span>
              <span className="block text-[11px] text-emerald-200 font-medium">Fianarantsoa</span>
            </div>
          </motion.div>

          <div className="flex items-center gap-3">
            <Link to="/login" className={`hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium text-white/90 hover:text-white hover:bg-white/15 transition-colors ${focusRing}`}>
              Se connecter
            </Link>
            <Link to="/register" className={`h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white inline-flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-colors ${focusRing}`}>
              <User size={16}/>
              <span>S'inscrire</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 min-h-[calc(100vh-80px)] px-4 md:px-6 py-12 flex items-center">
        <div className="max-w-7xl w-full mx-auto">
          <motion.div variants={containerVariants} initial={prefersReducedMotion?false:'hidden'} animate="visible" className="grid lg:grid-cols-[1.08fr_0.92fr] gap-10 lg:gap-16 items-center">

            <div className="text-center lg:text-left">
              <motion.p variants={fadeInUp} className="text-sm font-medium text-emerald-200">
                Développement humain & autopromotion
              </motion.p>

              <h1 className="sr-only">ONG Tsinjo Aina, Fianarantsoa, Haute Matsiatra, Madagascar</h1>

              <div aria-hidden="true" className="mt-5 font-display font-bold leading-tight tracking-tight text-3xl sm:text-4xl lg:text-5xl xl:text-6xl min-h-[2.5em] text-center lg:text-left">
                <span className="text-sky-300">
                  {firstText}
                  {!caretOnSecond&&!prefersReducedMotion&&<Caret blinking={caretBlinking}/>}
                </span>
                <br/>
                <span className="text-emerald-400">
                  {secondText}
                  {caretOnSecond&&!prefersReducedMotion&&<Caret blinking={caretBlinking}/>}
                </span>
              </div>

              <motion.p variants={fadeInUp} className="mt-6 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base leading-relaxed text-emerald-50">
                Construire ensemble un avenir durable en plaçant les communautés, l'environnement et le développement humain au cœur de notre action.
              </motion.p>

              <motion.div variants={fadeInUp} className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link to="/login" className={`group h-11 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white inline-flex items-center justify-center gap-2 text-sm font-medium shadow-md transition-colors cursor-pointer ${focusRing}`}>
                  Accéder à la plateforme
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform"/>
                </Link>
                <div className="flex items-center gap-2 text-emerald-100 text-sm">
                  <MapPin size={16} className="text-emerald-300"/>
                  Haute Matsiatra
                </div>
              </motion.div>
            </div>

            <motion.div variants={fadeInUp} className="relative space-y-6">
              <div>
                <span className="text-sm font-medium text-emerald-300 block mb-1">Notre engagement</span>
                <h2 className="font-display text-2xl font-bold text-white">Agir. Construire. Transformer.</h2>
              </div>
              <div className="space-y-5 divide-y divide-white/15">
                {pillars.map(p=>{
                  const Icon=p.icon;
                  return(
                    <div key={p.title} className="flex items-start gap-4 pt-4 first:pt-0">
                      <div className="shrink-0 h-10 w-10 rounded-lg flex items-center justify-center bg-emerald-900/70 ring-1 ring-emerald-500/40">
                        <Icon size={18} className="text-emerald-300"/>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-emerald-300">{p.eyebrow}</div>
                        <h3 className="mt-0.5 font-display text-base font-semibold text-white">{p.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-emerald-100">{p.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

          </motion.div>
        </div>
      </main>

      <footer className="relative z-20 px-4 md:px-6 pb-6 pt-4 border-t border-white/10 bg-emerald-950/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-200 text-xs font-medium">
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