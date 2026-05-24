import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, CheckCircle2 } from 'lucide-react'; // Nampiana CheckCircle2
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false); 
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password);
        
        if (result.success) {
            setIsSuccess(true); 
            
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-sans transition-colors duration-500">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden"
            >
                {/* Animated Background Blob */}
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"
                />

                <div className="text-center mb-6 relative z-10">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="w-16 h-16 rounded-full border-2 border-blue-600 p-1 mx-auto mb-3 bg-white shadow-lg overflow-hidden flex items-center justify-center"
                    >
                        <img src={logo} alt="Logo" className="w-full h-full object-cover rounded-full" />
                    </motion.div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Connexion</h2>
                </div>
                
                <AnimatePresence mode="wait">
                    {isSuccess ? (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-10 relative z-10"
                        >
                            <motion.div
                                initial={{ rotate: -45, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                transition={{ type: "spring", duration: 0.8 }}
                                className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4"
                            >
                                <CheckCircle2 className="text-blue-600 dark:text-blue-400 w-10 h-10" />
                            </motion.div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">Ravi de vous revoir !</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                                Connexion réussie. <br /> Préparation de votre espace...
                            </p>
                        </motion.div>
                    ) : (
                        /* FORMULAIRE LOGIN */
                        <motion.div key="form">
                            <AnimatePresence>
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-3 mb-4 rounded-xl text-xs font-medium"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                                        <input
                                            type="email"
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-white text-sm font-medium"
                                            placeholder="Adresse email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mot de passe</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                                        <input
                                            type="password"
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-white text-sm font-medium"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        className="w-full py-3.5 bg-slate-900 dark:bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group text-sm"
                                    >
                                        Se connecter
                                        <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-6 text-center relative z-10 border-t border-slate-100 dark:border-slate-800 pt-5">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                        Pas encore de compte ?{' '}
                        <Link 
                            to="/register" 
                            className="text-blue-600 dark:text-blue-400 font-black hover:underline underline-offset-4"
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