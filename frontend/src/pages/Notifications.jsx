import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, BookOpen, ShieldAlert, Key, Info, Code, Layers, CheckCircle2 } from 'lucide-react';

const Notifications = () => {
  const navigate = useNavigate();

  const sections = [
    {
      id: "general",
      icon: <Info size={22} className="text-blue-600 shrink-0" />,
      title: "À propos de la Plateforme Gestion-ONG",
      content: "Cette application centralisée constitue l'outil pilote de l'ONG TSINJO AINA pour la gestion opérationnelle et le suivi en temps réel de ses activités à Fianarantsoa. Elle intègre des modules interconnectés pour la cartographie des membres, l'administration des groupes de solidarité, le pilotage des réseaux locaux, et le suivi académique ou professionnel des formations dispensées."
    },
    {
      id: "toromarika",
      icon: <BookOpen size={22} className="text-blue-600 shrink-0" />,
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
      icon: <ShieldAlert size={22} className="text-blue-600 shrink-0" />,
      title: "Sécurité, Confidentialité & Droits d'Accès",
      content: "• Confidentialité stricte : Vos identifiants de connexion sont personnels et intransmissibles. Toute action entreprise avec votre compte engage votre responsabilité.\n• Hiérarchie des privilèges : Seuls les utilisateurs dotés du rôle 'Admin' possèdent les droits requis pour approuver les nouvelles inscriptions et modifier la structure des données.\n• Conformité : L'utilisation de la plateforme doit rigoureusement s'aligner avec la charte informatique et le règlement intérieur de l'ONG."
    },
    {
      id: "kaonty",
      icon: <Key size={22} className="text-blue-600 shrink-0" />,
      title: "Maintenance & Support Technique",
      content: "En cas d'anomalie technique, de ralentissement ou pour solliciter une modification de vos privilèges d'accès, veuillez ne pas tenter de manipulation interne. Documentez l'erreur constatée et soumettez directement un ticket de support au bureau de l'administrateur système ou à l'équipe technique de développement."
    }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-white dark:bg-slate-950 text-black dark:text-white transition-colors">
      
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-black dark:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700"></div>
          <div className="flex items-center gap-2 font-bold text-lg text-black dark:text-white">
            <HelpCircle size={22} className="text-blue-600" />
            <span>Centre d'aide & Documentation</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-8 pl-[calc(1cm+24px)] pr-8">
        <div className="max-w-4xl flex flex-col gap-10">
          
          {sections.map((section) => (
            <div key={section.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                {section.icon}
                <h2 className="text-base font-bold text-black dark:text-white tracking-tight">
                  {section.title}
                </h2>
              </div>
              
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>

              {section.steps && (
                <div className="mt-2 flex flex-col gap-2.5 pl-1">
                  {section.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                      <CheckCircle2 size={16} className="text-blue-600 mt-0.5 shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex flex-col gap-3 mt-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-2">
              <Code size={22} className="text-blue-600 shrink-0" />
              <h2 className="text-base font-bold text-black dark:text-white tracking-tight">
                Informations Éditeur & Système
              </h2>
            </div>
            <div className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between gap-4 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <Code size={18} className="text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Ingénierie & Développement</span>
                  <span className="font-semibold text-black dark:text-white">Elysé Randrianantenaina</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <Layers size={18} className="text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Version du Logiciel</span>
                  <span className="font-semibold text-black dark:text-white">v1.0.0 (Version Stable)</span>
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