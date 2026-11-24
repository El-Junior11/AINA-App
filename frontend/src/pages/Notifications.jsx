import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, BookOpen, ShieldAlert, Key, Info, Code, Layers, CheckCircle2, ExternalLink } from 'lucide-react';

const sections = [
  {
    id: 'general', icon: Info, title: 'À propos de la Plateforme Gestion-ONG',
    content: "Cette application centralisée constitue l'outil pilote de l'ONG TSINJO AINA pour la gestion opérationnelle et le suivi en temps réel de ses activités à Fianarantsoa. Elle intègre des modules interconnectés pour la cartographie des membres, l'administration des groupes de solidarité, le pilotage des réseaux locaux, et le suivi académique ou professionnel des formations dispensées."
  },
  {
    id: 'toromarika', icon: BookOpen, title: "Instructions & Guide d'Utilisation",
    content: "Pour garantir l'intégrité des données, veuillez suivre les protocoles d'administration suivants :",
    steps: [
      "Gestion des effectifs : L'onglet 'Membres' centralise tous les profils. Utilisez les filtres avancés pour trier par statut ou par zone géographique.",
      "Affectation des rôles : L'attribution d'un Poste ou d'une responsabilité spécifique à un membre s'effectue directement depuis sa fiche profil.",
      "Persistance des données : Toute modification ou ajout est instantanément audité et synchronisé avec la base de données centrale."
    ]
  },
  {
    id: 'fepetra', icon: ShieldAlert, title: "Sécurité, Confidentialité & Droits d'Accès",
    content: "• Confidentialité stricte : Vos identifiants de connexion sont personnels et intransmissibles. Toute action entreprise avec votre compte engage votre responsabilité.\n\n• Hiérarchie des privilèges : Seuls les utilisateurs dotés du rôle 'Admin' possèdent les droits requis pour approuver les nouvelles inscriptions et modifier la structure des données.\n\n• Conformité : L'utilisation de la plateforme doit rigoureusement s'aligner avec la charte informatique et le règlement intérieur de l'ONG."
  },
  {
    id: 'kaonty', icon: Key, title: 'Maintenance & Support Technique',
    content: "En cas d'anomalie technique, de ralentissement ou pour solliciter une modification de vos privilèges d'accès, veuillez ne pas tenter de manipulation interne. Documentez l'erreur constatée et soumettez directement un ticket de support au bureau de l'administrateur système ou à l'équipe technique de développement."
  }
];

const cardClass = 'min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden';
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40';

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
    <div className="h-9 w-9 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-[#176B46] dark:text-emerald-400 flex items-center justify-center">
      <Icon size={18}/>
    </div>
    <h2 className="font-display text-[16px] font-semibold text-[#103F30] dark:text-white leading-snug">{title}</h2>
  </div>
);

const Notifications = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[#F8FAFC] dark:bg-slate-950 font-body text-slate-900 dark:text-slate-100 antialiased">
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-[#176B46] text-white flex items-center justify-center">
              <HelpCircle size={23}/>
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-xl font-bold text-[#103F30] dark:text-white leading-tight">Centre d'aide & Documentation</h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Guide d'utilisation, sécurité et informations système.</p>
            </div>
          </div>
          <button onClick={() => navigate(-1)} aria-label="Retour" className={`h-9 px-2 sm:px-3 shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium ${focusRing}`}>
            <ChevronLeft size={18}/><span className="hidden sm:inline">Retour</span>
          </button>
        </div>
      </header>

      <main className="w-full p-4 md:p-6 space-y-4">
        {sections.map(section => (
          <section key={section.id} className={cardClass}>
            <SectionHeader icon={section.icon} title={section.title}/>
            <div className="px-4 sm:px-5 py-4 space-y-3">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">{section.content}</p>
              {section.steps && (
                <div className="space-y-2">
                  {section.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#176B46] dark:text-emerald-400"/>
                      <span className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}

        <section className={cardClass}>
          <SectionHeader icon={Code} title="Informations Éditeur & Système"/>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 sm:p-5">
            <a href="https://elyse-profil.vercel.app/" target="_blank" rel="noopener noreferrer" className={`group flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors ${focusRing}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#176B46] dark:text-emerald-400 flex items-center justify-center">
                  <Code size={20}/>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ingénierie & Développement</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1 group-hover:text-[#176B46] dark:group-hover:text-emerald-400">Elysé Randrianantenaina</p>
                </div>
              </div>
              <ExternalLink size={16} className="shrink-0 text-slate-400 group-hover:text-emerald-600"/>
            </a>

            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 flex items-center justify-center">
                <Layers size={20}/>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">Version du logiciel</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">v1.0.0 (Version Stable)</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Notifications;