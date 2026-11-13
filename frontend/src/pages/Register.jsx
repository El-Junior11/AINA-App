import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from '../api/axios';
import { UserPlus, User, Mail, Lock, CheckCircle2, ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import logo from '../assets/logo.png';

// Champs en forme de pilule, fond vert clair (même style que la page de connexion)
const fieldClass =
    'login-field w-full h-11 px-5 rounded-full border border-transparent bg-emerald-100 text-sm text-emerald-950 placeholder:text-emerald-800/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] outline-none transition-colors hover:bg-emerald-200/70 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25';
const labelClass = 'flex items-center gap-1.5 pl-4 text-[13px] font-medium text-slate-700 mb-1.5';
const labelIconClass = 'text-emerald-700 shrink-0';
const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1';
const primaryButton =
    'w-full max-w-[240px] h-11 px-6 rounded-full bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider shadow-md shadow-emerald-700/25 transition-colors cursor-pointer';

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
    const prefersReducedMotion = useReducedMotion();

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
        /* Le fond de la page est vert : il n'apparaît que dans le coin haut droit, à cause du coin arrondi du panneau clair */
        <div
            className="h-screen w-full font-body text-slate-900 overflow-hidden relative antialiased"
            style={{ background: 'linear-gradient(225deg, #2aa376 0%, #1b7a4b 100%)' }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
                .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
                .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}

                /* Panneau clair : coin haut droit très arrondi (grand écran) */
                .login-light{background:linear-gradient(180deg,#ffffff 0%,#f6f7f9 55%,#e9ecef 100%)}
                @media (min-width:1024px){
                    .login-light{border-top-right-radius:13% 33%}
                }

                /* Champs remplis automatiquement par le navigateur : on garde le fond vert clair */
                .login-field:-webkit-autofill,
                .login-field:-webkit-autofill:hover,
                .login-field:-webkit-autofill:focus{
                    -webkit-box-shadow:0 0 0 1000px #d1fae5 inset !important;
                    -webkit-text-fill-color:#022c22 !important;
                    caret-color:#022c22;
                }
                .login-field:autofill{
                    background-color:#d1fae5 !important;
                    color:#022c22 !important;
                    filter:none !important;
                }
            `}</style>

            {/* Fond clair de la partie formulaire */}
            <div className="login-light absolute inset-0" aria-hidden="true" />

            {/* Fizarana Ankavia : forme verte, coin haut droit très arrondi, bord droit droit en bas */}
            <aside
                className="hidden lg:flex absolute inset-y-0 left-0 w-1/2 z-10 flex-col items-center justify-between gap-8 px-10 py-10 text-center text-white overflow-y-auto shadow-2xl"
                style={{
                    background: 'linear-gradient(165deg, #1b7a4b 0%, #1e8556 55%, #23996a 100%)',
                    borderTopRightRadius: '28% 47%'
                }}
            >
                <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center ring-4 ring-white/20 overflow-hidden p-0.5 shadow-md shrink-0">
                        <img src={logo} alt="Logo" className="h-full w-full object-cover rounded-full" />
                    </div>
                    <div>
                        <span className="font-display font-bold text-lg tracking-tight block">ONG TSINJO AINA</span>
                        <span className="text-xs text-emerald-100 font-medium">Fianarantsoa, Madagascar</span>
                    </div>
                </div>

                <div className="w-full max-w-md flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-50 text-xs font-medium ring-1 ring-white/20">
                        <ShieldCheck size={14} /> Plateforme Sécurisée
                    </div>
                    <h1 className="mt-5 text-4xl font-display font-bold leading-[1.15] tracking-tight">
                        Rejoignez notre réseau de collaboration.
                    </h1>
                    <p className="mt-4 text-emerald-50/90 text-[15px] leading-relaxed">
                        Créez votre compte pour participer à la gestion centralisée des membres et des activités de l'ONG Tsinjo Aina.
                    </p>
                </div>

                <div className="text-xs text-emerald-100/80">
                    © {new Date().getFullYear()} ONG TSINJO AINA. Tous droits réservés.
                </div>
            </aside>

            {/* Petit coin clair en bas à gauche, qui découpe le vert (comme la maquette) */}
            <div
                className="hidden lg:block absolute bottom-0 left-0 z-20 w-[18%] h-[13%] bg-slate-100 pointer-events-none"
                style={{ borderTopRightRadius: '100% 100%' }}
                aria-hidden="true"
            />

            {/* Fizarana Ankavanana : Formulaire d'Inscription */}
            <main className="h-full lg:pl-[50%] relative z-10 flex items-center justify-center px-6 py-10 sm:px-10 overflow-y-auto">
                {/* Petite flèche : retour à l'accueil */}
                <Link 
                    to="/" 
                    aria-label="Retour à l'accueil"
                    title="Retour à l'accueil"
                    className={`absolute top-5 left-5 lg:left-[calc(50%+1.5rem)] z-20 h-9 w-9 rounded-full border border-slate-300 bg-white/80 text-slate-600 hover:text-emerald-700 hover:border-emerald-600 hover:bg-white shadow-sm flex items-center justify-center transition-colors ${focusRing}`}
                >
                    <ArrowLeft size={18} />
                </Link>

                <motion.div 
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 110, damping: 18 }}
                    className="w-full max-w-[420px] relative"
                >
                    {/* Header Logo & Title */}
                    <div className="mb-8 relative z-10 text-center">
                        {/* Logo boribory tsara amin'ny mobile */}
                        <div className="w-14 h-14 rounded-full p-0.5 mb-5 mx-auto bg-emerald-50 ring-1 ring-emerald-100 overflow-hidden lg:hidden shadow-sm flex items-center justify-center">
                            <img src={logo} alt="Logo" className="w-full h-full object-cover rounded-full" />
                        </div>

                        <h2 className="text-4xl font-display font-bold text-emerald-800 tracking-tight">Créer un compte</h2>
                        
                        <div className={`inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full text-xs font-semibold ${
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
                                            className="absolute w-3 h-3 bg-emerald-600 rounded-full" 
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
                                            role="alert"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 mb-5 rounded-2xl text-[13px] font-medium text-center"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                                    <div>
                                        <label htmlFor="register-name" className={labelClass}>
                                            <User size={14} className={labelIconClass} />
                                            Nom *
                                        </label>
                                        <input
                                            id="register-name"
                                            type="text"
                                            required
                                            autoComplete="name"
                                            className={fieldClass}
                                            placeholder="Votre nom"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="register-email" className={labelClass}>
                                            <Mail size={14} className={labelIconClass} />
                                            Adresse email *
                                        </label>
                                        <input
                                            id="register-email"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            className={fieldClass}
                                            placeholder="nom@exemple.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="register-password" className={labelClass}>
                                            <Lock size={14} className={labelIconClass} />
                                            Mot de passe *
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="register-password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                autoComplete="new-password"
                                                className={`${fieldClass} pr-12`}
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                                aria-pressed={showPassword}
                                                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-emerald-800/70 hover:text-emerald-900 hover:bg-emerald-200/60 transition-colors cursor-pointer ${focusRing}`}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-center">
                                        <button
                                            type="submit"
                                            className={`${primaryButton} ${focusRing}`}
                                        >
                                            <UserPlus size={16} />
                                            <span>S'inscrire</span>
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 text-center relative z-10">
                        <p className="text-slate-700 text-[13px]">
                            Déjà un compte ?{' '}
                            <Link 
                                to="/login" 
                                className={`text-emerald-700 font-semibold hover:underline rounded ${focusRing}`}
                            >
                                Se connecter
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default Register;