import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, BookOpen, ShieldAlert, Key, Info, Code, Layers, CheckCircle2, ExternalLink } from 'lucide-react';

const Notifications = () => {
  const navigate = useNavigate();

  const sections = [
    {
      id: "general",
      icon: <Info size={18} className="text-emerald-700" />,
      title: "À propos de la Plateforme Gestion-ONG",
      content: "Cette application centralisée constitue l'outil pilote de l'ONG TSINJO AINA pour la gestion opérationnelle et le suivi en temps réel de ses activités à Fianarantsoa. Elle intègre des modules interconnectés pour la cartographie des membres, l'administration des groupes de solidarité, le pilotage des réseaux locaux, et le suivi académique ou professionnel des formations dispensées."
    },
    {
      id: "toromarika",
      icon: <BookOpen size={18} className="text-emerald-700" />,
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
      icon: <ShieldAlert size={18} className="text-emerald-700" />,
      title: "Sécurité, Confidentialité & Droits d'Accès",
      content: "• Confidentialité stricte : Vos identifiants de connexion sont personnels et intransmissibles. Toute action entreprise avec votre compte engage votre responsabilité.\n\n• Hiérarchie des privilèges : Seuls les utilisateurs dotés du rôle 'Admin' possèdent les droits requis pour approuver les nouvelles inscriptions et modifier la structure des données.\n\n• Conformité : L'utilisation de la plateforme doit rigoureusement s'aligner avec la charte informatique et le règlement intérieur de l'ONG."
    },
    {
      id: "kaonty",
      icon: <Key size={18} className="text-emerald-700" />,
      title: "Maintenance & Support Technique",
      content: "En cas d'anomalie technique, de ralentissement ou pour solliciter une modification de vos privilèges d'accès, veuillez ne pas tenter de manipulation interne. Documentez l'erreur constatée et soumettez directement un ticket de support au bureau de l'administrateur système ou à l'équipe technique de développement."
    }
  ];

  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1';

  return (
    <div className="flex flex-col h-full bg-slate-50 font-body text-slate-900 overflow-hidden relative antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
        .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
      `}</style>
      
      {/* En-tête de page */}
      <header className="px-4 md:px-6 py-4 md:py-5 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => navigate(-1)} 
            aria-label="Retour"
            className={`h-9 w-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center cursor-pointer shrink-0 ${focusRing}`}
          >
            <ChevronLeft size={18} />
          </button>

          <div className="h-6 w-[1px] bg-slate-200 shrink-0"></div>

          <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center ring-1 ring-inset ring-emerald-100">
            <HelpCircle size={20} strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <h1 className="text-lg font-display font-semibold text-slate-900 leading-tight">
              Centre d'aide & Documentation
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Guide d'utilisation, protocoles de sécurité et informations système.
            </p>
          </div>
        </div>
      </header>

      {/* Contenu principal défilable */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {sections.map((section) => (
            <div 
              key={section.id} 
              className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-3.5"
            >
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center ring-1 ring-inset ring-emerald-100 shrink-0">
                  {section.icon}
                </div>
                <h2 className="text-sm font-display font-semibold text-slate-900 uppercase tracking-wide">
                  {section.title}
                </h2>
              </div>
              
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line font-medium">
                {section.content}
              </p>

              {section.steps && (
                <div className="mt-2 space-y-2 pt-1">
                  {section.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-2.5 text-sm text-slate-600 font-medium leading-relaxed">
                      <CheckCircle2 size={16} className="text-emerald-600 mt-1 shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Sektionan'ny Mpanoratra & Version (Version 2) */}
          <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center ring-1 ring-inset ring-emerald-100 shrink-0">
                <Code size={18} strokeWidth={2} />
              </div>
              <h2 className="text-sm font-display font-semibold text-slate-900 uppercase tracking-wide">
                Informations Éditeur & Système
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Ingénierie & Développement (Misy rohy mankany amin'ny Portfolio) */}
              <a
                href="https://elyse-profil.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-4 bg-slate-50 hover:bg-emerald-50/50 rounded-lg border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-between group ${focusRing}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Code size={18} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-medium block">
                      Ingénierie & Développement
                    </span>
                    <span className="text-sm font-display font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Elysé Randrianantenaina
                    </span>
                  </div>
                </div>
                <ExternalLink size={16} className="text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0 ml-2" />
              </a>

              {/* Version du Logiciel */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                  <Layers size={18} />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    Version du Logiciel
                  </span>
                  <span className="text-sm font-display font-semibold text-slate-900">
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