import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { User, Mail, Lock, Loader2, Save, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const AccountSettings = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // State hitantanana ny fisehoan'ny maso amin'ireo mot de passe
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const API_BASE = "http://localhost:5000/api";

  // Configuration du Toast SweetAlert2
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
      color: isDark ? '#ffffff' : '#0f172a',
      customClass: {
        popup: 'rounded-md shadow-lg border border-slate-200 dark:border-slate-800 text-xs font-medium',
      }
    });
  };

  // Charger les données de l'utilisateur connecté au montage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
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

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      return showToast('error', 'Les nouveaux mots de passe ne correspondent pas.');
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      const response = await axios.put(`${API_BASE}/auth/account/settings`, {
        name: formData.name,
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      }, config);

      showToast('success', response.data.message);
      
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
    <div className="h-full bg-[#f8fafc] dark:bg-slate-950 p-4 font-sans overflow-hidden flex flex-col justify-center">
      <div className="max-w-5xl mx-auto w-full space-y-4">
        
        {/* HEADER SECTION */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="p-2 bg-indigo-600 text-white rounded-md shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">
              {formData.name ? `Paramètres du compte de ${formData.name}` : 'Paramètres du compte'}
            </h1>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Mise à jour du profil et sécurité
            </p>
          </div>
        </div>

        {/* FORM CONTAINER - GRID 2 COLUMNS */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* HAVIA: INFORMATIONS PERSONNELLES */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                  Informations personnelles
                </h3>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Nom complet</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input 
                        type="text" name="name" value={formData.name} onChange={handleChange} required
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md py-1.5 pl-9 pr-3 text-xs font-medium text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Adresse email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input 
                        type="email" name="email" value={formData.email} onChange={handleChange} required
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md py-1.5 pl-9 pr-3 text-xs font-medium text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* HAVANANA: SÉCURITÉ & MOT DE PASSE */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="w-2 h-2 bg-rose-600 rounded-full"></span>
                  Changement de mot de passe
                </h3>
                
                <div className="space-y-3">
                  {/* Mot de passe actuel */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Mot de passe actuel</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input 
                        type={showCurrentPassword ? "text" : "password"} 
                        name="currentPassword" 
                        value={formData.currentPassword} 
                        onChange={handleChange}
                        placeholder="Saisir pour valider les changements"
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md py-1.5 pl-9 pr-9 text-xs font-medium text-slate-900 dark:text-white focus:ring-1 focus:ring-rose-500 outline-none transition-all placeholder:text-slate-400 placeholder:text-[10px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Nouveau mot de passe */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Nouveau mot de passe</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input 
                          type={showNewPassword ? "text" : "password"} 
                          name="newPassword" 
                          value={formData.newPassword} 
                          onChange={handleChange}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md py-1.5 pl-9 pr-9 text-xs font-medium text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                          {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirmation */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Confirmation</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          name="confirmPassword" 
                          value={formData.confirmPassword} 
                          onChange={handleChange}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md py-1.5 pl-9 pr-9 text-xs font-medium text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ACTION BUTTON FOOTER */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Utilisez un mot de passe robuste pour garantir la sécurité de votre accès.
              </p>
              <button
                type="submit" disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2 rounded-md transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
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