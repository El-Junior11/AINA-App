import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import api from '../api/axios';
import logo from '../assets/logo.png';

const fieldClass = 'login-field w-full h-11 rounded-lg border border-slate-200 bg-[#F8FAF9] pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10';
const labelClass = 'block text-[13px] font-semibold text-slate-700 mb-1.5';
const iconClass = 'absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none';
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-2';
const primaryButton = `flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#176B46] text-sm font-semibold text-white transition-colors hover:bg-[#105437] cursor-pointer ${focusRing}`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await login(email, password);
    setTimeout(() => {
      setIsLoading(false);
      if (result.success) {
        setIsSuccess(true);
        toast.success("Connexion réussie !");
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        toast.error(result.message || "Identifiants invalides.", {
          duration: 4000, position: 'top-right'
        });
      }
    }, 1500);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setTimeout(() => {
        setIsLoading(false);
        setIsOtpSent(true);
        toast.success("Code OTP envoyé à votre email.");
      }, 1500);
    } catch (err) {
      setTimeout(() => {
        setIsLoading(false);
        toast.error(err.response?.data?.message || "Erreur lors de l'envoi du code.");
      }, 1500);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(true);
        if (response.data.token) {
          sessionStorage.setItem('token', response.data.token);
        }
        toast.success("Code vérifié avec succès !");
        setTimeout(() => navigate('/dashboard'), 2000);
      }, 1500);
    } catch (err) {
      setTimeout(() => {
        setIsLoading(false);
        toast.error(err.response?.data?.message || "Code OTP invalide.");
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
    <div className="aina-login flex min-h-screen w-full items-center justify-center bg-[#F1F6F3] px-4 py-5 text-slate-900 antialiased">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800&display=swap');
        .aina-login{font-family:'DM Sans',system-ui,sans-serif}
        .aina-login .aina-display{font-family:'Playfair Display',Georgia,serif}
        .aina-login-panel{background:linear-gradient(150deg,#103F30 0%,#176B46 55%,#23996A 100%)}
        .login-field:-webkit-autofill,
        .login-field:-webkit-autofill:hover,
        .login-field:-webkit-autofill:focus{
          -webkit-box-shadow:0 0 0 1000px #F8FAF9 inset!important;
          -webkit-text-fill-color:#1e293b!important;
          caret-color:#1e293b;
        }
        .login-field:autofill{background-color:#F8FAF9!important;color:#1e293b!important}
      `}</style>

      <Toaster toastOptions={{ style: { borderRadius: '8px', fontSize: '14px' } }}/>

      {/* CONTENEUR PRINCIPAL */}
      <div className="grid w-full max-w-[1000px] overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_12px_45px_rgba(16,63,48,0.10)] lg:grid-cols-2">

        {/* PANNEAU GAUCHE */}
        <aside className="aina-login-panel relative hidden flex-col overflow-hidden px-8 py-6 text-white lg:flex">

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

          {/* BIENVENUE */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-5 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-emerald-50">
              <ShieldCheck size={14}/> Plateforme sécurisée
            </div>

            <h1 className="aina-display mt-3 text-4xl font-bold leading-tight">
              Bienvenue !
            </h1>

            <p className="mt-2 max-w-[340px] text-sm leading-6 text-emerald-50/90">
              Accédez à votre espace de travail et contribuez au développement durable de nos communautés.
            </p>

            {/* IMAGE AVATAR */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative mt-3 flex w-full items-center justify-center">
              <img src="/images/avatar.svg"
                alt="Illustration de connexion"
                className="relative z-10 h-[220px] w-full max-w-[320px] object-contain"/>
            </motion.div>

            <p className="mt-2 text-xs font-medium text-emerald-100/90">
              Agir ensemble pour un avenir durable.
            </p>
          </div>

          {/* COPYRIGHT */}
          <div className="relative z-10 border-t border-white/15 pt-4 text-center text-[11px] text-emerald-100/75">
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

          {/* FORMULAIRE */}
          <div className="flex flex-1 items-center justify-center py-6">
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
                  Authentification
                </span>

                <h2 className="aina-display mt-1.5 text-3xl font-bold leading-tight text-[#103F30] sm:text-4xl">
                  {isForgotPassword ? 'Mot de passe oublié' : 'Connexion'}
                </h2>

                <p className="mt-2 text-sm leading-5 text-slate-500">
                  {!isForgotPassword
                    ? 'Connectez-vous à votre espace de travail.'
                    : isOtpSent
                      ? 'Saisissez le code reçu par email.'
                      : 'Saisissez votre email pour recevoir un code OTP.'}
                </p>
              </div>

              <AnimatePresence mode="wait">

                {/* CHARGEMENT */}
                {isLoading ? (
                  <motion.div key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    role="status"
                    className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center">
                    <div className="relative flex h-8 w-40 items-center justify-center">
                      {[0, 1, 2].map(i => (
                        <motion.span key={i} custom={i} variants={dotVariants}
                          animate={prefersReducedMotion ? undefined : 'animate'}
                          style={prefersReducedMotion ? { x: (i - 1) * 20 } : undefined}
                          className="absolute h-3 w-3 rounded-full bg-[#176B46]"/>
                      ))}
                    </div>
                    <p className="text-sm font-medium text-slate-500">Traitement en cours...</p>
                  </motion.div>

                ) : isSuccess ? (

                  /* CONNEXION RÉUSSIE */
                  <motion.div key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    role="status"
                    className="flex min-h-[200px] flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-[#176B46]">
                      <CheckCircle2 size={30}/>
                    </div>
                    <h3 className="aina-display text-xl font-bold text-[#176B46]">Connexion réussie !</h3>
                    <p className="mt-2 text-sm text-slate-500">Préparation de votre espace...</p>
                  </motion.div>

                ) : (

                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    {!isForgotPassword ? (

                      /* CONNEXION */
                      <form onSubmit={handleSubmit} className="space-y-4">

                        <div>
                          <label htmlFor="login-email" className={labelClass}>Adresse email</label>
                          <div className="relative">
                            <Mail size={17} className={iconClass}/>
                            <input id="login-email" type="email" required autoComplete="email"
                              className={fieldClass} placeholder="nom@exemple.com"
                              value={email} onChange={e => setEmail(e.target.value.toLowerCase())}/>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="login-password" className={labelClass}>Mot de passe</label>
                          <div className="relative">
                            <Lock size={17} className={iconClass}/>
                            <input id="login-password" type={showPassword ? 'text' : 'password'}
                              required autoComplete="current-password"
                              className={`${fieldClass} pr-12`} placeholder="••••••••"
                              value={password} onChange={e => setPassword(e.target.value)}/>

                            <button type="button" onClick={() => setShowPassword(v => !v)}
                              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                              aria-pressed={showPassword}
                              className={`absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-[#176B46] ${focusRing}`}>
                              {showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}
                            </button>
                          </div>

                          <div className="mt-2 flex justify-end">
                            <button type="button" onClick={() => setIsForgotPassword(true)}
                              className={`rounded text-xs font-semibold text-[#176B91] hover:underline ${focusRing}`}>
                              Mot de passe oublié ?
                            </button>
                          </div>
                        </div>

                        <button type="submit" className={primaryButton}>
                          <LogIn size={17}/> Se connecter
                        </button>
                      </form>

                    ) : (

                      /* RÉCUPÉRATION OTP */
                      <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">

                        <div>
                          <label htmlFor="otp-email" className={labelClass}>Adresse email</label>
                          <div className="relative">
                            <Mail size={17} className={iconClass}/>
                            <input id="otp-email" type="email" required disabled={isOtpSent}
                              autoComplete="email"
                              className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-70`}
                              placeholder="nom@exemple.com" value={email}
                              onChange={e => setEmail(e.target.value.toLowerCase())}/>
                          </div>
                        </div>

                        {isOtpSent && (
                          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                            <label htmlFor="otp-code" className={labelClass}>Code OTP</label>
                            <div className="relative">
                              <KeyRound size={17} className={iconClass}/>
                              <input id="otp-code" type="text" required maxLength={6}
                                autoComplete="one-time-code" inputMode="numeric"
                                className={`${fieldClass} text-center text-base font-semibold tracking-[0.4em]`}
                                placeholder="000000" value={otp}
                                onChange={e => setOtp(e.target.value)}/>
                            </div>
                          </motion.div>
                        )}

                        <button type="submit" className={primaryButton}>
                          <KeyRound size={17}/>
                          {isOtpSent ? 'Vérifier le code' : 'Envoyer le code OTP'}
                        </button>

                        <button type="button"
                          onClick={() => {
                            setIsForgotPassword(false);
                            setIsOtpSent(false);
                            setOtp('');
                          }}
                          className={`mx-auto flex items-center justify-center gap-2 rounded text-sm font-medium text-slate-500 hover:text-[#176B46] ${focusRing}`}>
                          <ArrowLeft size={15}/> Retour à la connexion
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* INSCRIPTION */}
              <div className="mt-5 border-t border-slate-100 pt-4 text-center">
                <p className="text-[13px] text-slate-500">
                  Pas encore de compte ?{' '}
                  <Link to="/register" className={`rounded font-semibold text-[#176B46] hover:underline ${focusRing}`}>
                    Créer un compte
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

export default Login;