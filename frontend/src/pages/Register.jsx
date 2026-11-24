import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from '../api/axios';
import { UserPlus, User, Mail, Lock, CheckCircle2, ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import logo from '../assets/logo.png';

const fieldClass = 'login-field w-full h-11 rounded-lg border border-slate-200 bg-[#F8FAF9] pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10';
const labelClass = 'block text-[13px] font-semibold text-slate-700 mb-1.5';
const iconClass = 'absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none';
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-2';
const primaryButton = `flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#176B46] text-sm font-semibold text-white transition-colors hover:bg-[#105437] cursor-pointer ${focusRing}`;

const Register = () => {
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get('role') || 'user';
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: roleFromUrl
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const isAdmin = formData.role === 'admin';

  useEffect(() => {
    setFormData(prev => ({
      ...prev, role: searchParams.get('role') || 'user'
    }));
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await axios.post('/auth/register', formData);
      setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      }, 1500);
    } catch (err) {
      setTimeout(() => {
        setIsLoading(false);
        setError(err.response?.data?.message || "Erreur lors de l'inscription");
      }, 1500);
    }
  };

  const dotVariants = {
    animate: (index) => ({
      x: [-60, 0, 0, 60],
      opacity: [0, 1, 1, 0],
      scale: [0.6, 1, 1, 0.6],
      transition: {
        duration: 1.6, repeat: Infinity, ease: 'easeInOut',
        delay: index * 0.3, times: [0, 0.35, 0.65, 1]
      }
    })
  };

  return (
    <div className="aina-register flex min-h-screen w-full items-center justify-center bg-[#F1F6F3] px-4 py-5 text-slate-900 antialiased">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800&display=swap');
        .aina-register{font-family:'DM Sans',system-ui,sans-serif}
        .aina-register .aina-display{font-family:'Playfair Display',Georgia,serif}
        .aina-register-panel{background:linear-gradient(150deg,#103F30 0%,#176B46 55%,#23996A 100%)}
        .login-field:-webkit-autofill,
        .login-field:-webkit-autofill:hover,
        .login-field:-webkit-autofill:focus{
          -webkit-box-shadow:0 0 0 1000px #F8FAF9 inset!important;
          -webkit-text-fill-color:#1e293b!important;
          caret-color:#1e293b;
        }
        .login-field:autofill{
          background-color:#F8FAF9!important;
          color:#1e293b!important;
        }
      `}</style>

      {/* CONTENEUR PRINCIPAL */}
      <div className="grid w-full max-w-[1050px] overflow-hidden rounded-[22px] border border-emerald-100 bg-white shadow-[0_12px_45px_rgba(16,63,48,0.10)] lg:grid-cols-[1.05fr_1fr]">

        {/* PANNEAU GAUCHE */}
        <aside className="aina-register-panel relative hidden flex-col overflow-hidden px-10 py-7 text-white lg:flex">

          {/* FORMES DÉCORATIVES */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border-[40px] border-white/5"/>
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/5"/>
            <div className="absolute bottom-20 right-8 h-16 w-16 rounded-full border border-white/10"/>
          </div>

          {/* LOGO CIRCULAIRE */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1.5 ring-4 ring-white/10">
              <img src={logo} alt="Logo ONG Tsinjo Aina" className="h-full w-full rounded-full object-contain"/>
            </div>
            <div>
              <h2 className="aina-display text-lg font-bold">ONG TSINJO AINA</h2>
              <p className="mt-0.5 text-xs text-emerald-100/80">Fianarantsoa, Madagascar</p>
            </div>
          </div>

          {/* PRÉSENTATION ET AVATAR */}
          <div className="relative z-10 flex flex-1 flex-col pt-6">
            <h1 className="aina-display text-[44px] font-bold leading-tight text-white">
              Rejoignez-nous !
            </h1>

            <p className="mt-3 max-w-[340px] text-sm leading-6 text-emerald-50/90">
              Créez votre compte pour participer à la gestion centralisée des membres et des activités de l'ONG Tsinjo Aina.
            </p>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-1 items-center justify-center py-3">
              <img src="/images/Register.svg"
                alt="Illustration de création de compte"
                className="h-[230px] w-full max-w-[300px] select-none object-contain"
                draggable={false}/>
            </motion.div>
          </div>

          {/* COPYRIGHT */}
          <div className="relative z-10 pt-3 text-[11px] text-emerald-100/75">
            © {new Date().getFullYear()} ONG TSINJO AINA. Tous droits réservés.
          </div>
        </aside>

        {/* PANNEAU DROIT */}
        <main className="relative flex min-w-0 flex-col bg-white px-6 py-6 sm:px-9 lg:px-10">

          {/* NAVIGATION */}
          <div className="flex items-center justify-between gap-2">
            <Link to="/" className={`inline-flex items-center gap-2 rounded text-sm font-medium text-slate-500 hover:text-[#176B46] ${focusRing}`}>
              <ArrowLeft size={17}/> Accueil
            </Link>

            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
              <ShieldCheck size={15}/> Espace sécurisé
            </div>
          </div>

          {/* CONTENU DU FORMULAIRE */}
          <div className="flex flex-1 items-center justify-center py-5">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 110, damping: 18 }}
              className="w-full max-w-[380px]">

              {/* EN-TÊTE */}
              <div className="mb-5">

                {/* LOGO MOBILE */}
                <div className="mb-5 flex items-center gap-3 lg:hidden">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-100 bg-white p-1.5 ring-4 ring-emerald-50">
                    <img src={logo} alt="Logo Tsinjo Aina" className="h-full w-full rounded-full object-contain"/>
                  </div>
                  <div>
                    <h2 className="aina-display font-bold text-[#176B46]">ONG TSINJO AINA</h2>
                    <p className="mt-0.5 text-xs text-slate-500">Fianarantsoa, Madagascar</p>
                  </div>
                </div>

                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#176B46]">
                  Inscription
                </span>

                <h2 className="aina-display mt-1.5 text-3xl font-bold leading-tight text-[#103F30] sm:text-4xl">
                  Créer un compte
                </h2>

                <p className="mt-2 text-sm leading-5 text-slate-500">
                  Renseignez vos informations pour rejoindre la plateforme.
                </p>

                {/* TYPE DE COMPTE */}
                <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
                  isAdmin
                    ? 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200'
                    : 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100'
                }`}>
                  {isAdmin ? <ShieldCheck size={13}/> : <User size={13}/>}
                  {isAdmin ? 'Administrateur' : 'Utilisateur'}
                </div>
              </div>

              <AnimatePresence mode="wait">

                {/* CHARGEMENT */}
                {isLoading ? (
                  <motion.div key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    role="status"
                    className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">

                    <div className="relative flex h-8 w-40 items-center justify-center">
                      {[0, 1, 2].map(i => (
                        <motion.span key={i} custom={i} variants={dotVariants}
                          animate={prefersReducedMotion ? undefined : 'animate'}
                          style={prefersReducedMotion ? { x: (i - 1) * 20 } : undefined}
                          className="absolute h-3 w-3 rounded-full bg-[#176B46]"/>
                      ))}
                    </div>

                    <p className="text-sm font-medium text-slate-500">
                      Création de votre compte...
                    </p>
                  </motion.div>

                ) : isSuccess ? (

                  <motion.div key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    role="status"
                    className="flex min-h-[240px] flex-col items-center justify-center text-center">

                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-[#176B46]">
                      <CheckCircle2 size={30}/>
                    </div>

                    <h3 className="aina-display text-xl font-bold text-[#176B46]">
                      Compte créé avec succès !
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Redirection vers l'espace de connexion...
                    </p>
                  </motion.div>

                ) : (

                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    {/* MESSAGE D'ERREUR */}
                    <AnimatePresence>
                      {error && (
                        <motion.div role="alert"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* FORMULAIRE D'INSCRIPTION */}
                    <form onSubmit={handleSubmit} className="space-y-4">

                      {/* NOM */}
                      <div>
                        <label htmlFor="register-name" className={labelClass}>Nom complet</label>
                        <div className="relative">
                          <User size={17} className={iconClass}/>
                          <input id="register-name" type="text" required autoComplete="name"
                            className={fieldClass} placeholder="Votre nom complet"
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}/>
                        </div>
                      </div>

                      {/* ADRESSE EMAIL */}
                      <div>
                        <label htmlFor="register-email" className={labelClass}>Adresse email</label>
                        <div className="relative">
                          <Mail size={17} className={iconClass}/>
                          <input id="register-email" type="email" required autoComplete="email"
                            className={fieldClass} placeholder="nom@exemple.com"
                            value={formData.email}
                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value.toLowerCase() }))}/>
                        </div>
                      </div>

                      {/* MOT DE PASSE */}
                      <div>
                        <label htmlFor="register-password" className={labelClass}>Mot de passe</label>
                        <div className="relative">
                          <Lock size={17} className={iconClass}/>
                          <input id="register-password" type={showPassword ? 'text' : 'password'}
                            required autoComplete="new-password"
                            className={`${fieldClass} pr-12`} placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}/>

                          <button type="button" onClick={() => setShowPassword(v => !v)}
                            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                            aria-pressed={showPassword}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-[#176B46] ${focusRing}`}>
                            {showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}
                          </button>
                        </div>
                      </div>

                      {/* BOUTON D'INSCRIPTION */}
                      <button type="submit" className={primaryButton}>
                        <UserPlus size={17}/> S'inscrire
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* RETOUR À LA CONNEXION */}
              <div className="mt-5 border-t border-slate-100 pt-4 text-center">
                <p className="text-[13px] text-slate-500">
                  Déjà un compte ?{' '}
                  <Link to="/login" className={`rounded font-semibold text-[#176B46] hover:underline ${focusRing}`}>
                    Se connecter
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>

          {/* PIED DU FORMULAIRE */}
          <div className="border-t border-slate-100 pt-3 text-center">
            <p className="text-[11px] text-slate-400">
              ONG TSINJO AINA · Plateforme de gestion communautaire
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Register;