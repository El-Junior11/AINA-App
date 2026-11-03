import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import { User, Loader2, Save, ShieldCheck, Eye, EyeOff, Info, KeyRound, CheckCircle2 } from 'lucide-react';

// Classes partagées pour garder des champs de formulaire cohérents avec les autres pages
const fieldClass =
  'w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25';
const labelClass = 'block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5';
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900';

// Bouton afficher / masquer le mot de passe (défini hors du composant pour garder le focus clavier)
const PasswordToggle = ({ visible, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
    aria-pressed={visible}
    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer ${focusRing}`}
  >
    {visible ? <EyeOff size={17} /> : <Eye size={17} />}
  </button>
);

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
        popup: 'rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 text-sm font-medium p-4',
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
    <div className="flex flex-col w-full min-h-full bg-slate-50 dark:bg-slate-950 font-body text-slate-900 dark:text-slate-100 transition-colors antialiased">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body { font-family: 'Public Sans', system-ui, -apple-system, 'Segoe UI', sans-serif; }
        .font-display { font-family: 'Public Sans', system-ui, -apple-system, 'Segoe UI', sans-serif; letter-spacing: -0.01em; }
      `}</style>

      {/* En-tête de page */}
      <header className="px-4 md:px-6 py-4 md:py-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60">
            <ShieldCheck size={20} strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <h1 className="text-lg font-display font-semibold text-slate-900 dark:text-white leading-tight truncate">
              {formData.name ? `Paramètres du compte de ${formData.name}` : 'Paramètres du compte'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Mise à jour du profil et sécurité de votre compte
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 md:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Guide d'utilisation */}
          <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50 dark:bg-sky-950/20 px-4 py-3.5 flex items-start gap-3">
            <Info size={18} className="text-sky-700 dark:text-sky-400 shrink-0 mt-0.5" />

            <div className="text-[13px] leading-relaxed text-sky-950 dark:text-sky-100">
              <h2 className="font-semibold font-display text-sm text-sky-950 dark:text-sky-100 mb-1.5">
                Guide d'utilisation
              </h2>

              <ul className="space-y-1 list-disc pl-4 marker:text-sky-400 text-sky-900/90 dark:text-sky-200/80">
                <li>Modifiez votre nom et votre adresse e-mail si nécessaire.</li>
                <li>Le changement de mot de passe est optionnel si vous mettez uniquement à jour vos informations.</li>
                <li>Pour changer de mot de passe, renseignez d'abord votre <strong className="font-semibold">Mot de passe actuel</strong> par sécurité.</li>
                <li>Utilisez un nouveau mot de passe robuste et sécurisé.</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Informations personnelles */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                <User size={18} className="text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                  Informations personnelles
                </h3>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <label htmlFor="acc-name" className={labelClass}>Nom complet</label>
                  <input
                    id="acc-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="acc-email" className={labelClass}>Adresse email</label>
                  <input
                    id="acc-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={fieldClass}
                  />
                </div>
              </div>
            </section>

            {/* Mot de passe */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                <KeyRound size={18} className="text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                  Changement de mot de passe
                </h3>
              </div>

              <div className="p-5 space-y-4">
                <div className="sm:max-w-[calc(50%-0.5rem)]">
                  <label htmlFor="acc-current" className={labelClass}>Mot de passe actuel</label>
                  <div className="relative">
                    <input
                      id="acc-current"
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      autoComplete="current-password"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      placeholder="Saisir pour valider les changements"
                      className={`${fieldClass} pr-11`}
                    />
                    <PasswordToggle visible={showCurrentPassword} onToggle={() => setShowCurrentPassword(!showCurrentPassword)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                  <div>
                    <label htmlFor="acc-new" className={labelClass}>Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        id="acc-new"
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        autoComplete="new-password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className={`${fieldClass} pr-11`}
                      />
                      <PasswordToggle visible={showNewPassword} onToggle={() => setShowNewPassword(!showNewPassword)} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="acc-confirm" className={labelClass}>Confirmation</label>
                    <div className="relative">
                      <input
                        id="acc-confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`${fieldClass} pr-11`}
                      />
                      <PasswordToggle visible={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Barre d'action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[13px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                Veuillez vérifier et sauvegarder soigneusement vos modifications.
              </p>

              <button
                type="submit"
                disabled={loading}
                className={`w-full sm:w-auto h-10 px-5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white inline-flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${focusRing}`}
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