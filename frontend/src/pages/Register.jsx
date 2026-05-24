import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from '../api/axios';
import { UserPlus, User, Mail, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';
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
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
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
        setLoading(true);
        try {
            await axios.post('/auth/register', formData);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de l'inscription");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-6 font-sans transition-colors duration-500">
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-xl p-5 md:p-7 border border-slate-100 dark:border-slate-800 relative overflow-hidden"
            >
                {/* Background Effect kely kokoa */}
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="text-center mb-4 relative z-10">
                    <motion.div 
                        whileHover={{ rotate: 5 }}
                        className="w-12 h-12 rounded-full border-2 border-green-600 p-1 mx-auto mb-2 bg-white shadow-md overflow-hidden flex items-center justify-center"
                    >
                        <img src={logo} alt="Logo" className="w-full h-full object-cover rounded-full" />
                    </motion.div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Inscription</h2>
                    
                    <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                        {formData.role === 'admin' ? (
                            <>
                                <ShieldCheck size={10} className="text-blue-600" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Admin</span>
                            </>
                        ) : (
                            <>
                                <User size={10} className="text-emerald-500" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">User</span>
                            </>
                        )}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {success ? (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-6"
                        >
                            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full inline-block mb-3">
                                <CheckCircle2 className="text-green-600 dark:text-green-400 w-8 h-8" />
                            </div>
                            <h3 className="text-md font-black text-slate-800 dark:text-white">Compte créé !</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Redirection en cours...</p>
                        </motion.div>
                    ) : (
                        <motion.div key="form">
                            <AnimatePresence>
                                {error && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-2.5 mb-3 rounded-lg text-[11px] font-medium overflow-hidden"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit} className="space-y-3 relative z-10">
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Nom</label>
                                    <div className="relative group">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" size={14} />
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white text-xs"
                                            placeholder="Votre nom"
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" size={14} />
                                        <input
                                            type="email"
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white text-xs"
                                            placeholder="exemple@tsinjo.mg"
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Mot de passe</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" size={14} />
                                        <input
                                            type="password"
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white text-xs"
                                            placeholder="••••••••"
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full mt-2 py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? "Chargement..." : "S'inscrire"}
                                    {!loading && <UserPlus size={14} />}
                                </motion.button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-4 text-center border-t border-slate-100 dark:border-slate-800 pt-4">
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">
                        Déjà un compte ?{' '}
                        <Link to="/login" className="text-blue-600 dark:text-blue-400 font-black hover:underline">Se connecter</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;