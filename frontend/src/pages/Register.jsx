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

    const isAdmin = formData.role === 'admin';

    return (
        <div className="h-screen w-full flex bg-slate-50 font-body text-slate-900 overflow-hidden relative">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
                .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
                .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
            `}</style>

            {/* Fizarana Ankavia : Nohafohezina ho fohy sy milamina tsara */}
            <div className="hidden lg:flex lg:w-1/2 bg-emerald-900 text-white flex-col justify-between p-12 relative overflow-hidden border-r border-emerald-800 z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 opacity-95" />
                
                <div className="relative z-10 flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-full bg-white/15 flex items-center justify-center ring-1 ring-white/30 overflow-hidden p-0.5 shadow-sm">
                        <img src={logo} alt="Logo" className="h-full w-full object-cover rounded-full" />
                    </div>
                    <div>
                        <span className="font-display font-bold text-base tracking-tight block">ONG Tsinjo Aina</span>
                        <span className="text-xs text-emerald-200 font-medium">Fianarantsoa, Madagascar</span>
                    </div>
                </div>

                <div className="relative z-10 max-w-md space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-semibold ring-1 ring-emerald-600/50">
                        <ShieldCheck size={14} /> Plateforme Sécurisée
                    </div>
                    <h1 className="text-3xl font-display font-bold leading-tight tracking-tight">
                        Rejoignez notre réseau de collaboration.
                    </h1>
                    <p className="text-emerald-100/90 text-sm leading-relaxed font-medium">
                        Créez votre compte pour participer à la gestion centralisée des membres et des activités de l'ONG Tsinjo Aina.
                    </p>

                    {/* Toromarika 2 fohy */}
                    <div className="pt-2 space-y-2">
                        <div className="flex items-center gap-2.5 text-xs font-medium text-emerald-100">
                            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0">1</span>
                            <span>Remplissez le formulaire d'inscription.</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs font-medium text-emerald-100">
                            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0">2</span>
                            <span>Validation par l'administrateur et connexion.</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-xs text-emerald-200/70">
                    © {new Date().getFullYear()} ONG Tsinjo Aina. Tous droits réservés.
                </div>
            </div>

            {/* Fizarana Ankavanana : Formulaire d'Inscription madio tsara */}
            <div className="flex-1 flex items-center justify-center p-6 relative z-10 overflow-y-auto bg-slate-50">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 relative overflow-hidden border border-slate-200"
                >
                    <Link 
                        to="/" 
                        aria-label="Fermer et retourner à l'accueil"
                        className="absolute top-4 right-4 z-20 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <X size={18} />
                    </Link>

                    {/* Header Logo & Title */}
                    <div className="text-center mb-6 relative z-10">
                        {/* Logo boribory tsara amin'ny mobile */}
                        <div className="w-14 h-14 rounded-full p-0.5 mx-auto mb-3 bg-emerald-50 ring-1 ring-emerald-100 overflow-hidden lg:hidden shadow-sm flex items-center justify-center">
                            <img src={logo} alt="Logo" className="w-full h-full object-cover rounded-full" />
                        </div>

                        <h2 className="text-xl font-display font-semibold text-slate-900 tracking-tight">Créer un compte</h2>
                        
                        <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                            isAdmin 
                                ? 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200' 
                                : 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200'
                        }`}>
                            {isAdmin ? (
                                <>
                                    <ShieldCheck size={13} />
                                    <span>Administrateur</span>
                                </>
                            ) : (
                                <>
                                    <User size={13} />
                                    <span>Utilisateur</span>
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
                                <p className="text-sm text-slate-600 font-medium mt-2">Création de votre compte...</p>
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
                                <h3 className="text-base font-display font-semibold text-slate-900">Compte créé avec succès !</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Redirection vers l'espace de connexion...
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
                                            className="bg-rose-50 border border-rose-200 text-rose-700 p-3 mb-4 rounded-lg text-xs font-medium"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                    <div>
                                        <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Nom *</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                            <input
                                                type="text"
                                                required
                                                className="w-full h-10 px-3 pl-10 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25"
                                                placeholder="Votre nom"
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Adresse email *</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                            <input
                                                type="email"
                                                required
                                                className="w-full h-10 px-3 pl-10 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25"
                                                placeholder="nom@exemple.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Mot de passe *</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                className="w-full h-10 px-3 pl-10 pr-10 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            className="w-full h-10 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-colors cursor-pointer"
                                        >
                                            <UserPlus size={16} />
                                            <span>S'inscrire</span>
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-5 text-center relative z-10 border-t border-slate-200 pt-4">
                        <p className="text-slate-600 text-xs font-medium">
                            Déjà un compte ?{' '}
                            <Link 
                                to="/login" 
                                className="text-emerald-700 font-semibold hover:underline"
                            >
                                Se connecter
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Register;