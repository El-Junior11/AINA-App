import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast'; 
import api from '../api/axios'; 
import logo from '../assets/logo.png';

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
        <div className="h-screen w-full flex bg-slate-50 dark:bg-slate-950 font-body text-slate-900 dark:text-slate-100 overflow-hidden relative">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
                .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
                .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
            `}</style>

            <Toaster />

            {/* Fizarana Ankavia : Logo boribory tsara */}
            <div className="hidden lg:flex lg:w-1/2 bg-emerald-900 dark:bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden border-r border-slate-200 dark:border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 opacity-90" />
                
                <div className="relative z-10 flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center ring-1 ring-white/20 overflow-hidden p-0.5 shadow-sm">
                        <img src={logo} alt="Logo" className="h-full w-full object-cover rounded-full" />
                    </div>
                    <div>
                        <span className="font-display font-bold text-base tracking-tight block">ONG Tsinjo Aina</span>
                        <span className="text-xs text-emerald-300/80 font-medium">Fianarantsoa, Madagascar</span>
                    </div>
                </div>

                <div className="relative z-10 max-w-md space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 text-emerald-300 text-xs font-semibold ring-1 ring-emerald-700/50">
                        <ShieldCheck size={14} /> Plateforme Sécurisée
                    </div>
                    <h1 className="text-3xl font-display font-bold leading-tight tracking-tight">
                        Gestion centralisée et suivi des activités.
                    </h1>
                    <p className="text-emerald-100/80 text-sm leading-relaxed">
                        Accédez à votre espace de travail pour administrer les membres, suivre les rapports et gérer les enregistrements en toute sécurité au sein de l'ONG.
                    </p>
                </div>

                <div className="relative z-10 text-xs text-emerald-300/60">
                    © {new Date().getFullYear()} ONG Tsinjo Aina. Tous droits réservés.
                </div>
            </div>

            {/* Fizarana Ankavanana */}
            <div className="flex-1 flex items-center justify-center p-6 relative z-10 overflow-y-auto bg-white dark:bg-slate-950">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-6 relative overflow-hidden"
                >
                    <Link 
                        to="/" 
                        aria-label="Fermer et retourner à l'accueil"
                        className="absolute top-4 right-4 z-20 p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={18} />
                    </Link>

                    <div className="text-center mb-6 relative z-10">
                        {/* Logo boribory amin'ny mobile */}
                        <div className="w-14 h-14 rounded-full p-0.5 mx-auto mb-3 bg-emerald-50 dark:bg-emerald-950/50 ring-1 ring-emerald-100 dark:ring-emerald-900 overflow-hidden lg:hidden shadow-sm flex items-center justify-center">
                            <img src={logo} alt="Logo Tsinjo Aina" className="w-full h-full object-cover rounded-full" />
                        </div>

                        <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white tracking-tight">
                            {isForgotPassword ? "Mot de passe oublié" : "Connexion"}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            ONG Tsinjo Aina Fianarantsoa
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
                                            className="absolute w-3 h-3 bg-gradient-to-br from-emerald-600 to-sky-500 rounded-full" 
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
                                    className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 dark:bg-emerald-950/50 rounded-full mb-3 ring-1 ring-emerald-100 dark:ring-emerald-900"
                                >
                                    <CheckCircle2 className="text-emerald-700 dark:text-emerald-400 w-8 h-8" />
                                </motion.div>

                                <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 font-medium">
                                    Préparation de votre espace...
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {!isForgotPassword ? (
                                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                        <div>
                                            <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Adresse email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                                <input
                                                    type="email"
                                                    required
                                                    className="w-full h-10 px-3 pl-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25"
                                                    placeholder="nom@exemple.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mot de passe</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    required
                                                    className="w-full h-10 px-3 pl-10 pr-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25"
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            <div className="flex justify-end mt-1.5">
                                                <button 
                                                    type="button"
                                                    onClick={() => setIsForgotPassword(true)}
                                                    className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                                                >
                                                    Mot de passe oublié ?
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                className="w-full h-10 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-colors cursor-pointer"
                                            >
                                                <LogIn size={16} />
                                                <span>Se connecter</span>
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4 relative z-10">
                                        <div>
                                            <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Adresse email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                                <input
                                                    type="email"
                                                    required
                                                    disabled={isOtpSent}
                                                    className="w-full h-10 px-3 pl-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25 disabled:opacity-60"
                                                    placeholder="nom@exemple.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                                />
                                            </div>
                                        </div>

                                        {isOtpSent && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Code OTP</label>
                                                <div className="relative">
                                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                                    <input
                                                        type="text"
                                                        required
                                                        maxLength={6}
                                                        className="w-full h-10 px-3 pl-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25 tracking-widest text-center font-bold"
                                                        placeholder="000000"
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value)}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}

                                        <div className="pt-2 flex flex-col gap-2">
                                            <button
                                                type="submit"
                                                className="w-full h-10 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-colors cursor-pointer"
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
                                                className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:underline py-1 cursor-pointer"
                                            >
                                                Retour à la connexion
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-5 text-center relative z-10 border-t border-slate-200 dark:border-slate-800 pt-4">
                        <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                            Pas encore de compte ?{' '}
                            <Link 
                                to="/register" 
                                className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
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