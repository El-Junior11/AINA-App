import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck, X, Users, Network, GraduationCap, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast'; 
import api from '../api/axios'; 
import logo from '../assets/logo.png';

// Classes partagées pour garder des champs de formulaire cohérents avec le reste de l'application
const fieldClass =
    'w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25';
const labelClass = 'flex items-center gap-1.5 text-[13px] font-medium text-slate-700 mb-1.5';
const labelIconClass = 'text-slate-500 shrink-0';
const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1';

// Contenu du panneau d'information (côté gauche)
const features = [
    { icon: Users, title: 'Membres', text: 'Enregistrez les membres, leurs ménages et leurs chefs de ménage.' },
    { icon: Users, title: 'Groupes solidaires', text: 'Administrez les groupes, leurs ménages rattachés et leur localisation.' },
    { icon: Network, title: 'Réseaux communautaires', text: 'Suivez la structuration des réseaux jusqu\'à leur autonomie.' },
    { icon: ShieldCheck, title: 'Responsables du bureau', text: 'Attribuez les postes de président, trésorier, secrétaire et conseiller.' },
    { icon: GraduationCap, title: 'Suivi des formations', text: 'Consultez les modules suivis par chaque membre.' },
    { icon: BarChart3, title: 'Statistiques', text: 'Analysez la répartition hommes / femmes et exportez vos listes en PDF ou Excel.' }
];

const securityPoints = [
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
        <div className="h-screen w-full flex bg-slate-50 font-body text-slate-900 overflow-hidden relative antialiased">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
                .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
                .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
            `}</style>

            <Toaster />

            {/* Panneau gauche : présentation de l'ONG et de la plateforme */}
            <aside className="hidden lg:flex lg:w-1/2 bg-emerald-900 text-white flex-col justify-between gap-10 px-12 py-10 relative overflow-y-auto border-r border-emerald-800 z-10">
                <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-full bg-white/15 flex items-center justify-center ring-1 ring-white/30 overflow-hidden p-0.5 shadow-sm shrink-0">
                        <img src={logo} alt="Logo" className="h-full w-full object-cover rounded-full" />
                    </div>
                    <div>
                        <span className="font-display font-bold text-base tracking-tight block">ONG Tsinjo Aina</span>
                        <span className="text-xs text-emerald-200 font-medium">Fianarantsoa, Madagascar</span>
                    </div>
                </div>

                <div className="max-w-lg space-y-8">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-semibold ring-1 ring-emerald-600/50">
                            <ShieldCheck size={14} /> Plateforme Sécurisée
                        </div>
                        <h1 className="text-3xl font-display font-bold leading-tight tracking-tight">
                            Gestion centralisée et suivi des activités.
                        </h1>
                        <p className="text-emerald-100/90 text-sm leading-relaxed font-medium">
                            Accédez à votre espace de travail pour administrer les membres, suivre les rapports et gérer les enregistrements en toute sécurité au sein de l'ONG.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-sm font-display font-semibold text-white mb-3">Ce que vous pouvez faire</h2>
                        <ul className="space-y-3">
                            {features.map(({ icon: Icon, title, text }) => (
                                <li key={title} className="flex items-start gap-3">
                                    <span className="h-8 w-8 rounded-lg bg-white/10 ring-1 ring-white/15 flex items-center justify-center shrink-0">
                                        <Icon size={16} className="text-emerald-200" />
                                    </span>
                                    <div className="min-w-0">
                                        <span className="block text-sm font-semibold text-white leading-tight">{title}</span>
                                        <span className="block text-[13px] text-emerald-100/80 leading-snug mt-0.5">{text}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-lg bg-emerald-950/40 ring-1 ring-white/10 px-4 py-3.5">
                        <h2 className="text-sm font-display font-semibold text-white mb-2">Accès et sécurité</h2>
                        <ul className="space-y-1.5">
                            {securityPoints.map((point) => (
                                <li key={point} className="flex items-start gap-2 text-[13px] text-emerald-100/85 leading-snug">
                                    <CheckCircle2 size={14} className="text-emerald-300 shrink-0 mt-0.5" />
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="text-xs text-emerald-200/70">
                    © {new Date().getFullYear()} ONG Tsinjo Aina. Tous droits réservés.
                </div>
            </aside>

            {/* Panneau droit : formulaire */}
            <div className="flex-1 flex items-center justify-center p-6 relative z-10 overflow-y-auto bg-slate-50">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 sm:p-7 relative overflow-hidden border border-slate-200"
                >
                    <Link 
                        to="/" 
                        aria-label="Fermer et retourner à l'accueil"
                        className={`absolute top-4 right-4 z-20 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${focusRing}`}
                    >
                        <X size={18} />
                    </Link>

                    <div className="text-center mb-6 relative z-10">
                        {/* Logo boribory amin'ny mobile */}
                        <div className="w-14 h-14 rounded-full p-0.5 mx-auto mb-3 bg-emerald-50 ring-1 ring-emerald-100 overflow-hidden lg:hidden shadow-sm flex items-center justify-center">
                            <img src={logo} alt="Logo Tsinjo Aina" className="w-full h-full object-cover rounded-full" />
                        </div>

                        <h2 className="text-xl font-display font-semibold text-slate-900 tracking-tight">
                            {isForgotPassword ? "Mot de passe oublié" : "Connexion"}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
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
                                <p className="text-sm text-slate-600 font-medium mt-2">Traitement en cours...</p>
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
                                    className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 text-emerald-700 rounded-full mb-3 ring-1 ring-emerald-100"
                                >
                                    <CheckCircle2 size={28} />
                                </motion.div>

                                <p className="text-sm text-slate-700 mt-2 font-medium">
                                    Préparation de votre espace...
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {!isForgotPassword ? (
                                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
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
                                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ${focusRing}`}
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            <div className="flex justify-end mt-1.5">
                                                <button 
                                                    type="button"
                                                    onClick={() => setIsForgotPassword(true)}
                                                    className={`text-xs font-medium text-sky-700 hover:underline cursor-pointer rounded ${focusRing}`}
                                                >
                                                    Mot de passe oublié ?
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                className={`w-full h-10 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-colors cursor-pointer ${focusRing}`}
                                            >
                                                <LogIn size={16} />
                                                <span>Se connecter</span>
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4 relative z-10">
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
                                                className={`${fieldClass} disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
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
                                                    className={`${fieldClass} tracking-widest text-center font-semibold`}
                                                    placeholder="000000"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                />
                                            </motion.div>
                                        )}

                                        <div className="pt-2 flex flex-col gap-2">
                                            <button
                                                type="submit"
                                                className={`w-full h-10 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-colors cursor-pointer ${focusRing}`}
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
                                                className={`text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline py-1 cursor-pointer rounded ${focusRing}`}
                                            >
                                                Retour à la connexion
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-5 text-center relative z-10 border-t border-slate-200 pt-4">
                        <p className="text-slate-600 text-[13px]">
                            Pas encore de compte ?{' '}
                            <Link 
                                to="/register" 
                                className={`text-emerald-700 font-semibold hover:underline rounded ${focusRing}`}
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