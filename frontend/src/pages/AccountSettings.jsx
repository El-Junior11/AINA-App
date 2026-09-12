
import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import { User, Mail, Lock, Loader2, Save, ShieldCheck, Eye, EyeOff, Info, KeyRound, CheckCircle2 } from 'lucide-react';

const AccountSettings = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

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
        popup: 'rounded-2xl shadow-xl border border-emerald-100 dark:border-slate-800 text-sm font-medium p-4',
      }
    });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'Authorization': `Bearer ${token}` } };

        const res = await axios.get('/auth/me', config);
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

      const response = await axios.put('/auth/account/settings', {
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
    <div className="w-full min-h-full p-4 md:p-6 font-body space-y-8 text-black dark:text-white transition-colors">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
        .font-body { font-family: 'DM Sans', sans-serif; }
        .font-display { font-family: 'Manrope', sans-serif; }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-sky-500 text-white rounded-2xl shrink-0 shadow-sm">
            <ShieldCheck size={24} />
          </div>

          <div>
            <h1 className="text-lg font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formData.name ? `Paramètres du compte de ${formData.name}` : 'Paramètres du compte'}
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Mise à jour du profil et sécurité de votre compte
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/20 dark:to-sky-950/20 border border-emerald-200/50 dark:border-emerald-900/40 rounded-2xl p-5 text-emerald-900 dark:text-emerald-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/60 dark:bg-white/5 rounded-lg shrink-0">
            <Info size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="space-y-2 text-sm">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-100 font-display">
              Guide d'utilisation :
            </h4>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-emerald-800/90 dark:text-emerald-300/80 list-disc list-inside">
              <li>Modifiez votre nom et votre adresse e-mail si nécessaire.</li>
              <li>Le changement de mot de passe est optionnel si vous mettez uniquement à jour vos informations.</li>
              <li>Pour changer de mot de passe, renseignez d'abord votre <strong>Mot de passe actuel</strong> par sécurité.</li>
              <li>Utilisez un nouveau mot de passe robuste et sécurisé.</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <div className="space-y-5">
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <User size={18} />
              Informations personnelles
            </h3>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nom complet
                </label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Adresse email
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <KeyRound size={18} />
              Changement de mot de passe
            </h3>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Mot de passe actuel
                </label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Saisir pour valider les changements"
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-11 text-sm font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 placeholder:text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nouveau mot de passe
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-11 text-sm font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />

                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Confirmation
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-11 text-sm font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle2 size={17} className="text-emerald-500 shrink-0" />
            Veuillez vérifier et sauvegarder soigneusement vos modifications.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 active:scale-[0.98] text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}

            Enregistrer les modifications
          </button>
        </div>

      </form>
    </div>
  );
};

export default AccountSettings;
