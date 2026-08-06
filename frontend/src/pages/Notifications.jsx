import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, BookOpen, ShieldAlert, Key, Info, Code, Layers, CheckCircle2 } from 'lucide-react';

const Notifications = () => {
  const navigate = useNavigate();

  const sections = [
    {
      id: "general",
      icon: <Info size={22} className="text-sky-500 shrink-0" />,
      title: "À propos de la Plateforme Gestion-ONG",
      content: "Cette application centralisée constitue l'outil pilote de l'ONG TSINJO AINA pour la gestion opérationnelle et le suivi en temps réel de ses activités à Fianarantsoa. Elle intègre des modules interconnectés pour la cartographie des membres, l'administration des groupes de solidarité, le pilotage des réseaux locaux, et le suivi académique ou professionnel des formations dispensées."
    },
    {
      id: "toromarika",
      icon: <BookOpen size={22} className="text-sky-500 shrink-0" />,
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
      icon: <ShieldAlert size={22} className="text-sky-500 shrink-0" />,
      title: "Sécurité, Confidentialité & Droits d'Accès",
      content: "• Confidentialité stricte : Vos identifiants de connexion sont personnels et intransmissibles. Toute action entreprise avec votre compte engage votre responsabilité.\n• Hiérarchie des privilèges : Seuls les utilisateurs dotés du rôle 'Admin' possèdent les droits requis pour approuver les nouvelles inscriptions et modifier la structure des données.\n• Conformité : L'utilisation de la plateforme doit rigoureusement s'aligner avec la charte informatique et le règlement intérieur de l'ONG."
    },
    {
      id: "kaonty",
      icon: <Key size={22} className="text-sky-500 shrink-0" />,
      title: "Maintenance & Support Technique",
      content: "En cas d'anomalie technique, de ralentissement ou pour solliciter une modification de vos privilèges d'accès, veuillez ne pas tenter de manipulation interne. Documentez l'erreur constatée et soumettez directement un ticket de support au bureau de l'administrateur système ou à l'équipe technique de développement."
    }
  ];

  return (
    <div className="w-full min-h-full font-sans text-black dark:text-white transition-colors flex flex-col">
      
      {/* SECTION EN-TÊTE (FLAT - SANS CARD) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-100 dark:border-slate-800 pb-5 px-4 md:px-6 pt-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 transition-colors border border-sky-100 dark:border-slate-800 cursor-pointer"
            title="Retour"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div className="p-2.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl shrink-0">
            <HelpCircle size={22} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Centre d'aide & Documentation
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Guide d'utilisation, protocoles de sécurité et informations système.
            </p>
          </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL PLEIN ÉCRAN */}
      <div className="flex-1 py-8 px-4 md:px-6">
        <div className="w-full flex flex-col gap-10">
          
          {sections.map((section) => (
            <div key={section.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-3 border-b border-sky-100 dark:border-slate-800 pb-2">
                {section.icon}
                <h2 className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  {section.title}
                </h2>
              </div>
              
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                {section.content}
              </p>

              {section.steps && (
                <div className="mt-1 flex flex-col gap-2 pl-1">
                  {section.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <CheckCircle2 size={15} className="text-sky-500 mt-0.5 shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* SECTION ÉDITEUR & SYSTÈME */}
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex items-center gap-3 border-b border-sky-100 dark:border-slate-800 pb-2">
              <Code size={22} className="text-sky-500 shrink-0" />
              <h2 className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                Informations Éditeur & Système
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-sky-50/40 dark:bg-slate-900/60 rounded-xl border border-sky-100 dark:border-slate-800 flex items-center gap-3">
                <div className="p-2.5 bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 rounded-xl shadow-xs border border-sky-100 dark:border-slate-700">
                  <Code size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">Ingénierie & Développement</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Elysé Randrianantenaina</span>
                </div>
              </div>

              <div className="p-4 bg-sky-50/40 dark:bg-slate-900/60 rounded-xl border border-sky-100 dark:border-slate-800 flex items-center gap-3">
                <div className="p-2.5 bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 rounded-xl shadow-xs border border-sky-100 dark:border-slate-700">
                  <Layers size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">Version du Logiciel</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">v1.0.0 (Version Stable)</span>
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