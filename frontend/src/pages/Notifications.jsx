
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, BookOpen, ShieldAlert, Key, Info, Code, Layers, CheckCircle2 } from 'lucide-react';

const Notifications = () => {
  const navigate = useNavigate();

  const sections = [
    {
      id: "general",
      icon: <Info size={22} className="text-emerald-600 dark:text-emerald-400 shrink-0" />,
      title: "À propos de la Plateforme Gestion-ONG",
      content: "Cette application centralisée constitue l'outil pilote de l'ONG TSINJO AINA pour la gestion opérationnelle et le suivi en temps réel de ses activités à Fianarantsoa. Elle intègre des modules interconnectés pour la cartographie des membres, l'administration des groupes de solidarité, le pilotage des réseaux locaux, et le suivi académique ou professionnel des formations dispensées."
    },
    {
      id: "toromarika",
      icon: <BookOpen size={22} className="text-emerald-600 dark:text-emerald-400 shrink-0" />,
      title: "Instructions & Guide d'Utilisation",
      content: "Pour garantir l'intégrité des données, veuillez suivre les protocoles d'administration suivants :",
      steps: [
        "Gestion des effectifs : L'onglet 'Membres' centralise tous les profils. Utilisez les filtres avancés pour trier par statut ou par zone géographique.",
        "Affectation des rôles : L'attribution d'un Poste ou d'une responsabilité spécifique à un membre s'effectue directement depuis sa fiche profil.",
        "Persistance des données : Toute modification ou ajout est instantanément audité et synchronisé avec la base de données centrale."
      ]
    },
    {
      id: "fepetra",
      icon: <ShieldAlert size={22} className="text-emerald-600 dark:text-emerald-400 shrink-0" />,
      title: "Sécurité, Confidentialité & Droits d'Accès",
      content: "• Confidentialité stricte : Vos identifiants de connexion sont personnels et intransmissibles. Toute action entreprise avec votre compte engage votre responsabilité.\n• Hiérarchie des privilèges : Seuls les utilisateurs dotés du rôle 'Admin' possèdent les droits requis pour approuver les nouvelles inscriptions et modifier la structure des données.\n• Conformité : L'utilisation de la plateforme doit rigoureusement s'aligner avec la charte informatique et le règlement intérieur de l'ONG."
    },
    {
      id: "kaonty",
      icon: <Key size={22} className="text-emerald-600 dark:text-emerald-400 shrink-0" />,
      title: "Maintenance & Support Technique",
      content: "En cas d'anomalie technique, de ralentissement ou pour solliciter une modification de vos privilèges d'accès, veuillez ne pas tenter de manipulation interne. Documentez l'erreur constatée et soumettez directement un ticket de support au bureau de l'administrateur système ou à l'équipe technique de développement."
    }
  ];

  return (
    <div className="w-full min-h-full font-body text-black dark:text-white transition-colors flex flex-col">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
        .font-body { font-family: 'DM Sans', sans-serif; }
        .font-display { font-family: 'Manrope', sans-serif; }
      `}</style>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 px-4 md:px-6 pt-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
            title="Retour"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-800"></div>

          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-sky-500 text-white rounded-2xl shrink-0 shadow-sm">
            <HelpCircle size={24} />
          </div>

          <div>
            <h1 className="text-lg font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
              Centre d'aide & Documentation
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Guide d'utilisation, protocoles de sécurité et informations système.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-8 px-4 md:px-6">
        <div className="w-full flex flex-col gap-10">
          
          {sections.map((section) => (
            <div key={section.id} className="flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="p-2 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30 rounded-xl">
                  {section.icon}
                </div>

                <h2 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-display">
                  {section.title}
                </h2>
              </div>
              
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                {section.content}
              </p>

              {section.steps && (
                <div className="mt-1 flex flex-col gap-3 pl-1">
                  {section.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="p-2 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30 rounded-xl">
                <Code size={22} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>

              <h2 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-display">
                Informations Éditeur & Système
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-400/40 dark:hover:border-emerald-500/30">
                <div className="p-3 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                  <Code size={21} />
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-slate-400 dark:text-slate-500 font-semibold">
                    Ingénierie & Développement
                  </span>

                  <span className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Elysé Randrianantenaina
                  </span>
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-400/40 dark:hover:border-emerald-500/30">
                <div className="p-3 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                  <Layers size={21} />
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-slate-400 dark:text-slate-500 font-semibold">
                    Version du Logiciel
                  </span>

                  <span className="text-base font-bold text-slate-900 dark:text-white font-display">
                    v1.0.0 (Version Stable)
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Notifications;