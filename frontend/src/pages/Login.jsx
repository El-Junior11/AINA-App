import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast'; 
import api from '../api/axios'; 
import logo from '../assets/logo.png';

const fieldClass =
    'w-full h-11 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-colors hover:border-slate-400 dark:hover:border-slate-600 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25';
const labelClass = 'flex items-center gap-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5';
const labelIconClass = 'text-slate-500 dark:text-slate-400 shrink-0';
const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-950';
const primaryButton =
    'w-full h-11 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-colors cursor-pointer';

const securityPoints = [
    'Connectez-vous avec votre adresse email et votre mot de passe.',
    'Vos identifiants sont strictement personnels.',
    'Mot de passe oublié : récupération par code OTP envoyé à votre adresse email.',
    'Les nouvelles inscriptions sont approuvées par un administrateur.'
];

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
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                toast.error(result.message || "Identifiants invalides.", {
                    duration: 4000,
                    position: 'top-right',
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
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
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
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.3,
                times: [0, 0.35, 0.65, 1]
            }
        })
    };

    return (
        <div className="h-screen w-full flex bg-white dark:bg-slate-950 font-body text-slate-900 dark:text-slate-100 overflow-hidden relative antialiased">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
                .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
                .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
            `}</style>

            <Toaster toastOptions={{ style: { borderRadius: '8px', fontSize: '14px' } }} />

            {/* Panneau gauche : informations de connexion uniquement */}
            <aside
                className="hidden lg:flex lg:w-[46%] xl:w-1/2 bg-emerald-900 text-white flex-col justify-between gap-10 px-12 xl:px-16 py-10 relative overflow-y-auto z-10"
                style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            >
                <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-full bg-white/15 flex items-center justify-center ring-1 ring-white/30 overflow-hidden p-0.5 shadow-sm shrink-0">
                        <img src={logo} alt="Logo" className="h-full w-full object-cover rounded-full" />
                    </div>
                    <div>
                        <span className="font-display font-bold text-base tracking-tight block">ONG TSINJO AINA</span>
                        <span className="text-xs text-emerald-200 font-medium">Fianarantsoa, Madagascar</span>
                    </div>
                </div>

                <div className="max-w-lg space-y-9">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-100 text-xs font-medium ring-1 ring-white/15">
                            <ShieldCheck size={14} /> Plateforme Sécurisée
                        </div>
                        <h1 className="text-4xl font-display font-bold leading-[1.15] tracking-tight">
                            Accédez à votre espace de travail.
                        </h1>
                        <p className="text-emerald-100/90 text-[15px] leading-relaxed">
                            Connectez-vous avec votre compte pour accéder à la plateforme de l'ONG en toute sécurité.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-sm font-display font-semibold text-white pb-3 border-b border-white/15">Accès et sécurité</h2>
                        <ul className="divide-y divide-white/10">
                            {securityPoints.map((point) => (
                                <li key={point} className="flex items-start gap-3 py-3 text-sm text-emerald-100/90 leading-snug">
                                    <span className="mt-0.5 h-5 w-5 rounded-full bg-white/10 ring-1 ring-white/15 flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={13} className="text-emerald-300" />
                                    </span>
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="text-xs text-emerald-200/70">
                    © {new Date().getFullYear()} ONG TSINJO AINA. Tous droits réservés.
                </div>
            </aside>

            {/* Panneau droit : formulaire */}
            <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10 relative z-10 overflow-y-auto bg-white dark:bg-slate-950">
                <Link 
                    to="/" 
                    aria-label="Fermer et retourner à l'accueil"
                    className={`absolute top-5 right-5 z-20 p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
                >
                    <X size={18} />
                </Link>

                <motion.div 
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 110, damping: 18 }}
                    className="w-full max-w-[400px] relative"
                >
                    <div className="mb-8 relative z-10">
                        {/* Logo boribory amin'ny mobile */}
                        <div className="w-14 h-14 rounded-full p-0.5 mb-5 bg-emerald-50 dark:bg-emerald-950/50 ring-1 ring-emerald-100 dark:ring-emerald-900/60 overflow-hidden lg:hidden shadow-sm flex items-center justify-center">
                            <img src={logo} alt="Logo Tsinjo Aina" className="w-full h-full object-cover rounded-full" />
                        </div>

                        <h2 className="text-2xl font-display font-semibold text-slate-900 dark:text-white tracking-tight">
                            {isForgotPassword ? "Mot de passe oublié" : "Connexion"}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                            {!isForgotPassword
                                ? "Connectez-vous à votre espace de travail"
                                : isOtpSent
                                    ? "Saisissez le code reçu par email"
                                    : "Saisissez votre email pour recevoir un code OTP"}
                        </p>
                    </div>
                    
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-10 relative z-10 flex flex-col items-center justify-center gap-4"
                            >
                                <div className="relative w-40 h-8 flex items-center justify-center">
                                    {[0, 1, 2].map((i) => (
                                        <motion.span 
                                            key={i}
                                            custom={i} 
                                            variants={dotVariants} 
                                            animate="animate" 
                                            className="absolute w-3 h-3 bg-emerald-600 rounded-full" 
                                        />
                                    ))}
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-2">Traitement en cours...</p>
                            </motion.div>
                        ) : isSuccess ? (
                            <motion.div 
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-8 relative z-10"
                            >
                                <motion.div
                                    initial={{ rotate: -45, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    transition={{ type: "spring", duration: 0.8 }}
                                    className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full mb-3 ring-1 ring-emerald-100 dark:ring-emerald-900/60"
                                >
                                    <CheckCircle2 size={28} />
                                </motion.div>

                                <p className="text-sm text-slate-700 dark:text-slate-200 mt-2 font-medium">
                                    Préparation de votre espace...
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {!isForgotPassword ? (
                                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                                        <div>
                                            <label htmlFor="login-email" className={labelClass}>
                                                <Mail size={14} className={labelIconClass} />
                                                Adresse email
                                            </label>
                                            <input
                                                id="login-email"
                                                type="email"
                                                required
                                                autoComplete="email"
                                                className={fieldClass}
                                                placeholder="nom@exemple.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="login-password" className={labelClass}>
                                                <Lock size={14} className={labelIconClass} />
                                                Mot de passe
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id="login-password"
                                                    type={showPassword ? "text" : "password"}
                                                    required
                                                    autoComplete="current-password"
                                                    className={`${fieldClass} pr-11`}
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                                    aria-pressed={showPassword}
                                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${focusRing}`}
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            <div className="flex justify-end mt-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => setIsForgotPassword(true)}
                                                    className={`text-[13px] font-medium text-sky-700 dark:text-sky-400 hover:underline cursor-pointer rounded ${focusRing}`}
                                                >
                                                    Mot de passe oublié ?
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-1">
                                            <button
                                                type="submit"
                                                className={`${primaryButton} ${focusRing}`}
                                            >
                                                <LogIn size={16} />
                                                <span>Se connecter</span>
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} className="space-y-5 relative z-10">
                                        <div>
                                            <label htmlFor="otp-email" className={labelClass}>
                                                <Mail size={14} className={labelIconClass} />
                                                Adresse email
                                            </label>
                                            <input
                                                id="otp-email"
                                                type="email"
                                                required
                                                disabled={isOtpSent}
                                                autoComplete="email"
                                                className={`${fieldClass} disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed`}
                                                placeholder="nom@exemple.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                            />
                                        </div>

                                        {isOtpSent && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <label htmlFor="otp-code" className={labelClass}>
                                                    <KeyRound size={14} className={labelIconClass} />
                                                    Code OTP
                                                </label>
                                                <input
                                                    id="otp-code"
                                                    type="text"
                                                    required
                                                    maxLength={6}
                                                    autoComplete="one-time-code"
                                                    className={`${fieldClass} tracking-[0.4em] text-center font-semibold text-base`}
                                                    placeholder="000000"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                />
                                            </motion.div>
                                        )}

                                        <div className="pt-1 flex flex-col gap-2">
                                            <button
                                                type="submit"
                                                className={`${primaryButton} ${focusRing}`}
                                            >
                                                <span>{isOtpSent ? "Vérifier le code" : "Envoyer le code OTP"}</span>
                                            </button>
                                            
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setIsForgotPassword(false);
                                                    setIsOtpSent(false);
                                                    setOtp('');
                                                }}
                                                className={`h-10 text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:underline cursor-pointer rounded-lg ${focusRing}`}
                                            >
                                                Retour à la connexion
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 text-center relative z-10 border-t border-slate-200 dark:border-slate-800 pt-5">
                        <p className="text-slate-600 dark:text-slate-400 text-[13px]">
                            Pas encore de compte ?{' '}
                            <Link 
                                to="/register" 
                                className={`text-emerald-700 dark:text-emerald-400 font-semibold hover:underline rounded ${focusRing}`}
                            >
                                Créer un compte
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;