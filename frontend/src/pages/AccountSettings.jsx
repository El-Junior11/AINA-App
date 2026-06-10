import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { User, Mail, Lock, Loader2, Save, ShieldCheck } from 'lucide-react';

const AccountSettings = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const API_BASE = "http://localhost:5000/api";

  // Configuration du Toast SweetAlert2 adaptable (Sombre/Clair)
  const showToast = (icon, title) => {
    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: icon,
      title: title,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#ffffff' : '#1e293b',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800',
      }
    });
  };

  // Charger les données de l'utilisateur connecté au montage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        // Remplacez cet URL par votre route "get profile" si nécessaire
        const res = await axios.get(`${API_BASE}/auth/me`, config);
        setFormData(prev => ({
          ...prev,
          name: res.data.name || '',
          email: res.data.email || ''
        }));
      } catch (err) {
        console.error("Erreur lors du chargement du profil", err);
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation simple du mot de passe
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      return showToast('error', 'Les nouveaux mots de passe ne correspondent pas.');
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      const response = await axios.put(`${API_BASE}/account/settings`, {
        name: formData.name,
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      }, config);

      showToast('success', response.data.message);
      
      // Réinitialiser les champs de mot de passe après succès
      setFormData(prev => ({ 
        ...prev, 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
      }));

    } catch (err) {
      showToast('error', err.response?.data?.message || "Une erreur est survenue lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-[#f8fafc] dark:bg-slate-950 p-4 md:p-8 overflow-y-auto font-sans">
      <div className="max-w-2xl mx-auto">
        
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20 text-white">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
              Paramètres du Compte
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Mise à jour du profil et sécurité
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* --- SECTION INFORMATIONS --- */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-8 h-[2px] bg-indigo-500 rounded-full"></span>
                Informations Personnelles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase px-1">Nom Complet</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input 
                      type="text" name="name" value={formData.name} onChange={handleChange} required
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-800 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase px-1">Adresse Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input 
                      type="email" name="email" value={formData.email} onChange={handleChange} required
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-800 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- SECTION SÉCURITÉ --- */}
            <div className="space-y-6 pt-4">
              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-8 h-[2px] bg-rose-500 rounded-full"></span>
                Changement de Mot de passe
              </h3>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase px-1">Mot de passe actuel</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={18} />
                  <input 
                    type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange}
                    placeholder="Saisir pour valider les changements"
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-800 dark:text-white focus:border-rose-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all shadow-sm placeholder:text-slate-400 placeholder:text-[10px] placeholder:uppercase placeholder:font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase px-1">Nouveau mot de passe</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input 
                      type="password" name="newPassword" value={formData.newPassword} onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-800 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase px-1">Confirmation</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input 
                      type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-800 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- ACTION BUTTON --- */}
            <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[9px] text-slate-400 font-bold uppercase max-w-[250px]">
                Assurez-vous d'utiliser un mot de passe robuste pour garantir la sécurité de votre accès.
              </p>
              <button
                type="submit" disabled={loading}
                className="w-full md:w-auto flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest px-10 py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:translate-y-0"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Enregistrer les modifications
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;