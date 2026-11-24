import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import Swal from 'sweetalert2';
import { User, Loader2, Save, ShieldCheck, Eye, EyeOff, Info, KeyRound, CheckCircle2, Mail } from 'lucide-react';

const fieldClass =
  'w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-[#176B46] focus:ring-2 focus:ring-emerald-600/25';

const labelClass =
  'block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900';

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
    confirmPassword: '',
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
      icon,
      title,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#ffffff' : '#0f172a',
      customClass: {
        popup:
          'rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 text-sm font-medium p-4',
      },
    });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        const res = await axios.get('/auth/me', config);

        setFormData((prev) => ({
          ...prev,
          name: res.data.name || '',
          email: res.data.email || '',
        }));
      } catch (err) {
        console.error('Erreur lors du chargement du profil', err);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      return showToast(
        'error',
        'Les nouveaux mots de passe ne correspondent pas.'
      );
    }

    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const response = await axios.put(
        '/auth/account/settings',
        {
          name: formData.name,
          email: formData.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        config
      );

      showToast('success', response.data.message);

      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      showToast(
        'error',
        err.response?.data?.message ||
          'Une erreur est survenue lors de la mise à jour.'
      );
    } finally {
      setLoading(false);
    }
  };

  const passwords = [
    { id: 'acc-current', name: 'currentPassword', label: 'Mot de passe actuel', placeholder: 'Saisir votre mot de passe actuel', autoComplete: 'current-password', visible: showCurrentPassword, toggle: setShowCurrentPassword },
    { id: 'acc-new', name: 'newPassword', label: 'Nouveau mot de passe', placeholder: 'Saisir un nouveau mot de passe', autoComplete: 'new-password', visible: showNewPassword, toggle: setShowNewPassword },
    { id: 'acc-confirm', name: 'confirmPassword', label: 'Confirmation du nouveau mot de passe', placeholder: 'Confirmer le nouveau mot de passe', autoComplete: 'new-password', visible: showConfirmPassword, toggle: setShowConfirmPassword }
  ];
  const panel = 'min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden';
  const sectionHead = 'flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800';
  const note = 'rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400';
  return (
    <div className="flex min-h-full min-w-0 flex-col bg-[#F8FAFC] dark:bg-slate-950 font-body text-slate-900 dark:text-slate-100 antialiased">
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#176B46] text-white"><ShieldCheck size={22}/></div>
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#103F30] dark:text-white break-words">{formData.name ? `Paramètres du compte de ${formData.name}` : 'Paramètres du compte'}</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Mise à jour du profil et sécurité de votre compte</p>
          </div>
        </div>
      </header>
      <main className="w-full max-w-6xl mx-auto p-3 sm:p-5 md:p-6 space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/30 p-4">
          <Info size={19} className="shrink-0 mt-0.5 text-sky-600 dark:text-sky-400"/>
          <div className="min-w-0 text-sm text-sky-900 dark:text-sky-200">
            <h2 className="font-display font-bold mb-1.5">Guide d'utilisation</h2>
            <ul className="grid md:grid-cols-2 gap-x-6 gap-y-1 list-disc pl-4 text-xs leading-relaxed">
              <li>Modifiez votre nom et votre adresse e-mail si nécessaire.</li>
              <li>Le changement de mot de passe est facultatif pour une mise à jour du profil.</li>
              <li>Pour changer de mot de passe, renseignez votre mot de passe actuel.</li>
              <li>Utilisez un nouveau mot de passe robuste et sécurisé.</li>
            </ul>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
            <section className={panel}>
              <div className={sectionHead}>
                <div className="h-9 w-9 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-[#176B46] dark:text-emerald-400 flex items-center justify-center"><User size={19}/></div>
                <div><h2 className="font-display font-bold text-base">Informations personnelles</h2><p className="text-xs text-slate-500 dark:text-slate-400">Gérez vos informations de profil.</p></div>
              </div>
              <div className="p-4 sm:p-5 space-y-4">
                <div><label htmlFor="acc-name" className={labelClass}>Nom complet</label>
                  <div className="relative"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/><input id="acc-name" type="text" name="name" autoComplete="name" value={formData.name} onChange={handleChange} required className={`${fieldClass} pl-9`} placeholder="Votre nom complet"/></div>
                </div>
                <div><label htmlFor="acc-email" className={labelClass}>Adresse email</label>
                  <div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/><input id="acc-email" type="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} required className={`${fieldClass} pl-9`} placeholder="exemple@email.com"/></div>
                </div>
                <p className={note}>Ces informations permettent d'identifier votre compte sur la plateforme.</p>
              </div>
            </section>
            <section className={panel}>
              <div className={sectionHead}>
                <div className="h-9 w-9 shrink-0 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center"><KeyRound size={19}/></div>
                <div><h2 className="font-display font-bold text-base">Changement de mot de passe</h2><p className="text-xs text-slate-500 dark:text-slate-400">Renforcez la sécurité de votre compte.</p></div>
              </div>
              <div className="p-4 sm:p-5 space-y-4">
                {passwords.map(p => <div key={p.id}>
                  <label htmlFor={p.id} className={labelClass}>{p.label}</label>
                  <div className="relative"><KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                    <input id={p.id} type={p.visible ? 'text' : 'password'} name={p.name} autoComplete={p.autoComplete} value={formData[p.name]} onChange={handleChange} placeholder={p.placeholder} className={`${fieldClass} pl-9 pr-11`}/>
                    <PasswordToggle visible={p.visible} onToggle={() => p.toggle(v => !v)}/>
                  </div>
                </div>)}
                <p className={note}>Laissez les champs de mot de passe vides si vous ne souhaitez pas le modifier.</p>
              </div>
            </section>
          </div>
          <div className={`${panel} flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5`}>
            <p className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400"><CheckCircle2 size={17} className="shrink-0 text-[#176B46] dark:text-emerald-400"/>Vérifiez vos informations avant d'enregistrer les modifications.</p>
            <button type="submit" disabled={loading} className={`w-full sm:w-auto shrink-0 h-10 px-4 rounded-lg bg-[#176B46] hover:bg-[#103F30] text-white inline-flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-60 ${focusRing}`}>
              {loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
export default AccountSettings;
