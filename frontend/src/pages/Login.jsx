import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, CheckCircle2, Eye, EyeOff, KeyRound, X } from 'lucide-react';
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950/40 px-4 font-body transition-colors duration-500 relative overflow-hidden">

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
                .font-body { font-family: 'DM Sans', sans-serif; }
                .font-display { font-family: 'Manrope', sans-serif; }
            `}</style>

            <Toaster />

            {/* Halos décoratifs de fond, cohérents avec la page d'accueil */}
            <div className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-24 w-[420px] h-[420px] rounded-full bg-sky-400/15 dark:bg-sky-500/10 blur-3xl pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="max-w-md w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(16,185,129,0.15)] p-7 relative overflow-hidden border border-white dark:border-slate-800/60 z-10"
            >
                <Link 
                    to="/" 
                    aria-label="Fermer et retourner à l'accueil"
                    className="absolute top-5 right-5 z-20 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all active:scale-95"
                >
                    <X size={20} />
                </Link>

                <motion.div 
                    animate={{ scale: [1, 1.2, 1], x: [0, 15, 0], y: [0, -15, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute -top-24 -right-24 w-52 h-52 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
                />
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], x: [0, -15, 0], y: [0, 15, 0] }}
                    transition={{ duration: 8, repeat: Infinity, delay: 2 }}
                    className="absolute -bottom-24 -left-24 w-52 h-52 bg-sky-400/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
                />

                <div className="text-center mb-6 relative z-10">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="w-16 h-16 rounded-full p-[2px] mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-sky-400 shadow-lg overflow-hidden"
                    >
                        <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                            <img src={logo} alt="Logo Tsinjo Aina" className="w-full h-full object-cover rounded-full" />
                        </div>
                    </motion.div>
                    <h2 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {isForgotPassword ? "Mot de passe oublié" : "Espace du compte"}
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1 uppercase tracking-widest">
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
                                        className="absolute w-3 h-3 bg-gradient-to-br from-emerald-500 to-sky-500 rounded-full" 
                                    />
                                ))}
                            </div>
                            <p className="text-sm text-slate-900 dark:text-slate-300 font-bold mt-2">Traitement en cours...</p>
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
                                className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4"
                            >
                                <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 w-10 h-10" />
                            </motion.div>

                            <p className="text-sm text-slate-900 dark:text-slate-300 mt-2 font-bold">
                                Préparation de votre espace...
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {!isForgotPassword ? (
                                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 ml-1">Email</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                                            <input
                                                type="email"
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-slate-900 dark:text-white text-sm font-bold"
                                                placeholder="Adresse email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 ml-1">Mot de passe</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-slate-900 dark:text-white text-sm font-bold"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <div className="flex justify-end px-1">
                                            <button 
                                                type="button"
                                                onClick={() => setIsForgotPassword(true)}
                                                className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline mt-1"
                                            >
                                                Mot de passe oublié ?
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group text-sm"
                                        >
                                            <LogIn size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                                            <span>Se connecter</span>
                                        </motion.button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4 relative z-10">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 ml-1">Email</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                                            <input
                                                type="email"
                                                required
                                                disabled={isOtpSent}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-slate-900 dark:text-white text-sm font-bold disabled:opacity-60"
                                                placeholder="Adresse email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                            />
                                        </div>
                                    </div>

                                    {isOtpSent && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-1.5"
                                        >
                                            <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 ml-1">Code OTP</label>
                                            <div className="relative group">
                                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                                                <input
                                                    type="text"
                                                    required
                                                    maxLength={6}
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-slate-900 dark:text-white text-sm font-bold tracking-widest text-center"
                                                    placeholder="000000"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="pt-2 flex flex-col gap-2">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                                        >
                                            <span>{isOtpSent ? "Vérifier le code" : "Envoyer le code OTP"}</span>
                                        </motion.button>
                                        
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setIsForgotPassword(false);
                                                setIsOtpSent(false);
                                                setOtp('');
                                            }}
                                            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:underline py-1"
                                        >
                                            Retour à la connexion
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-6 text-center relative z-10 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <p className="text-slate-900 dark:text-slate-400 text-xs font-bold">
                        Pas encore de compte ?{' '}
                        <Link 
                            to="/register" 
                            className="text-sky-600 dark:text-sky-400 font-black hover:underline underline-offset-4"
                        >
                            Créer un compte
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;