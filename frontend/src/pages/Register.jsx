import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from '../api/axios';
import { UserPlus, User, Mail, Lock, CheckCircle2, ShieldCheck, X, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';

const Register = () => {
    const [searchParams] = useSearchParams();
    const roleFromUrl = searchParams.get('role') || 'user';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: roleFromUrl
    });

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            role: searchParams.get('role') || 'user'
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
        animate: {
            y: [0, -6, 0],
            transition: {
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    const isAdmin = formData.role === 'admin';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950/40 px-4 font-body transition-colors duration-500 relative overflow-hidden">

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
                .font-body { font-family: 'DM Sans', sans-serif; }
                .font-display { font-family: 'Manrope', sans-serif; }
            `}</style>

            {/* Halos décoratifs de fond, cohérents avec Home / Login */}
            <div className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-24 w-[420px] h-[420px] rounded-full bg-sky-400/15 dark:bg-sky-500/10 blur-3xl pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="max-w-md w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(16,185,129,0.15)] p-7 relative overflow-hidden border border-white dark:border-slate-800/60 z-10"
            >
                {/* Bouton X (Fermer / Retour à l'accueil) */}
                <Link 
                    to="/" 
                    aria-label="Fermer et retourner à l'accueil"
                    className="absolute top-5 right-5 z-20 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all active:scale-95"
                >
                    <X size={20} />
                </Link>

                {/* Background decorative blobs */}
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

                {/* Header Logo & Title */}
                <div className="text-center mb-6 relative z-10">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="w-16 h-16 rounded-full p-[2px] mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-sky-400 shadow-lg overflow-hidden"
                    >
                        <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                            <img src={logo} alt="Logo" className="w-full h-full object-cover rounded-full" />
                        </div>
                    </motion.div>
                    <h2 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">Créer un compte</h2>
                    
                    <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full border ${
                        isAdmin 
                            ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800/60' 
                            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/60'
                    }`}>
                        {isAdmin ? (
                            <>
                                <ShieldCheck size={12} className="text-sky-600 dark:text-sky-400" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">Admin</span>
                            </>
                        ) : (
                            <>
                                <User size={12} className="text-emerald-600 dark:text-emerald-400" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">User</span>
                            </>
                        )}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-10 relative z-10 flex flex-col items-center justify-center gap-3"
                        >
                            <div className="flex items-center gap-1.5 h-6">
                                <motion.span variants={dotVariants} animate="animate" transition={{ delay: 0 }} className="w-3 h-3 bg-emerald-500 rounded-full" />
                                <motion.span variants={dotVariants} animate="animate" transition={{ delay: 0.15 }} className="w-3 h-3 bg-teal-500 rounded-full" />
                                <motion.span variants={dotVariants} animate="animate" transition={{ delay: 0.3 }} className="w-3 h-3 bg-sky-500 rounded-full" />
                            </div>
                            <p className="text-sm text-slate-900 dark:text-slate-300 font-bold">Création de votre compte...</p>
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
                                className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-3"
                            >
                                <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 w-10 h-10" />
                            </motion.div>
                            <h3 className="text-xl font-display font-extrabold text-slate-900 dark:text-white">Compte créé !</h3>
                            <p className="text-sm text-slate-900 dark:text-slate-300 mt-1 font-bold">
                                Inscription réussie. <br /> Redirection vers l'espace de connexion...
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <AnimatePresence>
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-slate-900 dark:text-red-400 p-3.5 mb-4 rounded-xl text-xs font-bold"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 ml-1">Nom</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-slate-900 dark:text-white text-sm font-bold"
                                            placeholder="Votre nom"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 ml-1">Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                                        <input
                                            type="email"
                                            required
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-slate-900 dark:text-white text-sm font-bold"
                                            placeholder="Adresse email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
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
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                                        <UserPlus size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                                        <span>S'inscrire</span>
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-6 text-center relative z-10 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <p className="text-slate-900 dark:text-slate-400 text-xs font-bold">
                        Déjà un compte ?{' '}
                        <Link 
                            to="/login" 
                            className="text-sky-600 dark:text-sky-400 font-black hover:underline underline-offset-4"
                        >
                            Se connecter
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;