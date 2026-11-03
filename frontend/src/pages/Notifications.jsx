import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, HelpCircle, BookOpen, ShieldAlert, Key, Info, Code, Layers, CheckCircle2, ExternalLink, Search, X, Compass, Users, Network, ShieldCheck, GraduationCap, BarChart3, Download, User, Tag } from 'lucide-react';

// Recherche insensible à la casse et aux accents
const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const Notifications = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const iconClass = "text-emerald-600 dark:text-emerald-400";

  const sections = [
    {
      id: "general",
      short: "À propos",
      icon: <Info size={18} className={iconClass} />,
      title: "À propos de la Plateforme Gestion-ONG",
      content: "Cette application centralisée constitue l'outil pilote de l'ONG TSINJO AINA pour la gestion opérationnelle et le suivi en temps réel de ses activités à Fianarantsoa. Elle intègre des modules interconnectés pour la cartographie des membres, l'administration des groupes de solidarité, le pilotage des réseaux locaux, et le suivi académique ou professionnel des formations dispensées."
    },
    {
      id: "toromarika",
      short: "Guide d'utilisation",
      icon: <BookOpen size={18} className={iconClass} />,
      title: "Instructions & Guide d'Utilisation",
      content: "Pour garantir l'intégrité des données, veuillez suivre les protocoles d'administration suivants :",
      steps: [
        "Gestion des effectifs : L'onglet 'Membres' centralise tous les profils. Utilisez les filtres avancés pour trier par statut ou par zone géographique.",
        "Affectation des rôles : L'attribution d'un Poste ou d'une responsabilité spécifique à un membre s'effectue directement depuis sa fiche profil.",
        "Persistance des données : Toute modification ou ajout est instantanément audité et synchronisé avec la base de données centrale."
      ]
    },
    {
      id: "commun",
      short: "Fonctions communes",
      icon: <Compass size={18} className={iconClass} />,
      title: "Navigation & Fonctions communes",
      content: "Les pages de gestion (Membres, Groupes solidaires, Réseaux, Responsables, Formations) partagent la même organisation. Une fois apprise sur l'une d'elles, elle s'applique aux autres.",
      points: [
        { label: "Recherche", text: "Le champ en haut de page filtre la liste en temps réel pendant la saisie. La croix à droite du champ efface la recherche et réaffiche tous les enregistrements." },
        { label: "Ajouter", text: "Le bouton « Ajouter » ouvre une fiche de saisie vide. Les champs marqués d'un astérisque (*) sont obligatoires." },
        { label: "Modifier", text: "L'icône en forme de crayon, à droite de chaque ligne, ouvre la fiche déjà remplie. Les changements sont pris en compte après un clic sur « Enregistrer » ou « Mettre à jour »." },
        { label: "Supprimer", text: "Dans les modules qui la proposent, l'icône corbeille demande une confirmation (Oui / Non) avant toute suppression. Vérifiez bien l'enregistrement concerné avant de confirmer : la suppression ne peut pas être annulée depuis l'application." },
        { label: "Voir plus", text: "Ce bouton affiche un résumé chiffré de la liste actuellement affichée." },
        { label: "Messages de confirmation", text: "Un bandeau en haut à droite de l'écran indique si l'opération a réussi ou échoué, puis disparaît seul après quelques secondes. Placez le curseur dessus pour le garder affiché." },
        { label: "Tableaux larges", text: "Sur un écran étroit, faites défiler le tableau horizontalement. La colonne « Actions » reste visible sur le bord droit." }
      ]
    },
    {
      id: "membres",
      short: "Membres",
      icon: <Users size={18} className={iconClass} />,
      title: "Module Membres",
      content: "Le module Membres est la base de tous les autres : un membre doit y être enregistré avant d'apparaître dans Responsables et dans Formations, et son numéro de ménage permet de retrouver son groupe solidaire.",
      points: [
        { label: "Fiche d'un membre", text: "Nom de famille (obligatoire), prénoms, année de naissance, sexe (Homme ou Femme), numéro de ménage (obligatoire) et case « Chef de ménage »." },
        { label: "Numéro de ménage", text: "C'est le lien entre un membre et son groupe solidaire. Saisissez-le toujours de la même façon (par exemple M001) dans la fiche du membre et dans celle du groupe. La différence entre majuscules et minuscules n'a pas d'importance." },
        { label: "Chef de ménage", text: "Cochez la case pour le chef du ménage : il apparaît avec le badge « Chef » dans le tableau." },
        { label: "Année de naissance inconnue", text: "Laissez le champ vide : le tableau affiche alors « ---- »." },
        { label: "Ordre d'affichage", text: "La liste est triée par numéro de ménage, ce qui regroupe les membres d'un même ménage." },
        { label: "Recherche", text: "Elle porte sur le nom, les prénoms, l'année de naissance, le sexe, le statut (tapez « chef ») et le numéro de ménage." },
        { label: "Voir plus", text: "Affiche la population totale, le nombre de chefs de ménage et la répartition Homme / Femme, calculés sur la liste affichée (donc après une éventuelle recherche)." }
      ]
    },
    {
      id: "groupes",
      short: "Groupes solidaires",
      icon: <Users size={18} className={iconClass} />,
      title: "Module Groupes solidaires",
      content: "Un groupe solidaire (GS) rassemble des ménages d'une même zone. Sa fiche décrit son identité, sa localisation et la liste des ménages rattachés.",
      points: [
        { label: "Fiche d'un groupe", text: "Nom du groupe et date de création (obligatoires), commune, fokontany, village, et ménages rattachés (obligatoire)." },
        { label: "Ménages rattachés", text: "Saisissez les numéros de ménage séparés par des virgules, par exemple M001, M002, M003. Chaque numéro apparaît ensuite sous forme de puce dans le tableau." },
        { label: "Un ménage, un seul groupe", text: "Un numéro de ménage ne peut appartenir qu'à un seul groupe. S'il est déjà utilisé ailleurs, l'enregistrement est refusé et le message indique le ou les numéros concernés. Retirez-les de l'autre groupe ou corrigez votre saisie." },
        { label: "Localisation", text: "Le tableau affiche la commune, le fokontany et le village du groupe. Renseignez toujours la commune : elle sert à localiser le groupe dans le module Réseaux." },
        { label: "Voir plus", text: "Affiche le nombre de groupes, le nombre de ménages rattachés (chaque ménage n'étant compté qu'une fois) et le nombre de communes couvertes." }
      ]
    },
    {
      id: "reseaux",
      short: "Réseaux",
      icon: <Network size={18} className={iconClass} />,
      title: "Module Réseaux communautaires",
      content: "Un réseau regroupe plusieurs groupes solidaires. Ce module permet de suivre leur structuration jusqu'à l'autonomie.",
      points: [
        { label: "Création d'un réseau", text: "Nom du réseau et date de création (obligatoires), puis groupes membres : les noms des groupes, séparés par des virgules." },
        { label: "Nom des groupes", text: "Recopiez le nom du groupe tel qu'il est enregistré dans le module Groupes solidaires. La différence entre majuscules et minuscules n'a pas d'importance, mais l'orthographe doit être identique." },
        { label: "Localisation", text: "Cette colonne affiche automatiquement la ou les communes des groupes membres, retrouvées à partir de leur nom. Si un nom ne correspond à aucun groupe existant (faute de frappe, groupe renommé), sa commune n'apparaît pas ; la cellule affiche « — » quand aucune commune n'est trouvée." },
        { label: "Critères de structuration", text: "Activités, Plaidoyers et Plan de développement (Oui ou Non) se renseignent en modifiant un réseau existant ; ils n'apparaissent pas à la création." },
        { label: "Autonomie calculée automatiquement", text: "Un réseau est « Autonome » uniquement lorsque les trois critères sont à « Oui » ; sinon il est « En cours ». Ce statut ne se modifie pas à la main." },
        { label: "Voir plus", text: "Affiche le total des réseaux, le nombre de groupes membres, le nombre de réseaux autonomes et le nombre de réseaux en structuration." }
      ]
    },
    {
      id: "responsables",
      short: "Responsables",
      icon: <ShieldCheck size={18} className={iconClass} />,
      title: "Module Responsables",
      content: "Ce module attribue les postes du bureau aux membres. Il affiche tous les membres enregistrés, avec leur groupe et leur poste.",
      points: [
        { label: "Poste par défaut", text: "Un membre sans poste attribué apparaît avec « Membres ». Rien n'est enregistré tant que vous n'avez pas validé une modification." },
        { label: "Postes disponibles", text: "President, Tresorier, Secretaire, Conseiller et Membres, tels qu'ils apparaissent dans la liste de choix." },
        { label: "Attribuer un poste", text: "Cliquez sur le crayon en face du membre, choisissez le poste dans la liste, puis cliquez sur « Enregistrer ». Le nom du membre et son groupe sont affichés en lecture seule." },
        { label: "Groupe du membre", text: "Il est retrouvé automatiquement à partir du numéro de ménage du membre. « Aucun groupe » signifie que son ménage n'est rattaché à aucun groupe solidaire." },
        { label: "Bureau", text: "President, Tresorier et Secretaire forment le bureau et sont comptés dans « Total Bureau »." },
        { label: "Exports « Femmes bureau »", text: "Ils listent les femmes qui occupent l'un des trois postes du bureau. Contrairement aux autres exports, ils ne tiennent pas compte de la recherche en cours." },
        { label: "Voir plus", text: "Affiche le total du bureau, le nombre de femmes au bureau, ainsi que le nombre d'hommes et de femmes de moins de 26 ans." }
      ]
    },
    {
      id: "formations",
      short: "Formations",
      icon: <GraduationCap size={18} className={iconClass} />,
      title: "Module Suivi des formations",
      content: "Le suivi des formations enregistre, pour chaque membre, les modules de formation qu'il a suivis.",
      points: [
        { label: "Fiche individuelle", text: "Cliquez sur le crayon en face d'un membre. Cliquez sur chaque module pour le faire passer de « Non » à « Oui » (ou l'inverse), complétez si besoin la zone « Observations / Autres », puis cliquez sur « Enregistrer »." },
        { label: "Statuts calculés automatiquement", text: "Trois statuts se mettent à jour dès que vous cochez ou décochez un module et ne se modifient pas à la main : Agro-éco (Agro-sol, Agro-eau et Végétaux tous à « Oui »), Nutrition (Nutri-eau et Alimentaire tous deux à « Oui ») et Autonomie (tous les autres modules à « Oui » : Gestion, Agro-sol, Agro-eau, Végétaux, Semences, Nutri-eau, Alimentaire, Conservation, Transformation, Genre et Epracc)." },
        { label: "Lecture du tableau", text: "Les colonnes N° et Membre restent fixes à gauche pendant le défilement horizontal. « Oui » apparaît dans un badge vert, « Non » en gris clair." },
        { label: "Recherche", text: "Elle porte sur le prénom, le nom ou l'identifiant (ID) du membre." },
        { label: "Actualiser", text: "Recharge les données depuis le serveur, par exemple si un collègue vient d'enregistrer une fiche." },
        { label: "Voir plus", text: "Ouvre la page Statistiques des formations (voir la rubrique suivante)." }
      ]
    },
    {
      id: "stats",
      short: "Statistiques",
      icon: <BarChart3 size={18} className={iconClass} />,
      title: "Statistiques des formations",
      content: "Cette page présente la répartition hommes / femmes pour chaque thème de formation. Elle s'ouvre depuis le bouton « Voir plus » du module Suivi des formations.",
      points: [
        { label: "Comparaison des formations", text: "Le grand graphique en haut de page montre, pour chaque thème, une barre pour les hommes (bleu) et une barre pour les femmes (rose), à la même échelle." },
        { label: "Une carte par thème", text: "Huit thèmes sont détaillés : Genre & Social, Agroécologie, Production semence, Nutrition, Conservation produit, Transformation produit, Gestion simplifiée et EPRACC. Chaque carte associe un diagramme au nombre et au pourcentage d'hommes et de femmes." },
        { label: "Types de diagrammes", text: "Anneau, barres verticales, barre empilée, jauge et anneaux concentriques : les types varient pour faciliter la lecture, mais les couleurs restent les mêmes partout (bleu pour les hommes, rose pour les femmes)." },
        { label: "Retour", text: "Le bouton « Retour » ramène à la page précédente." }
      ]
    },
    {
      id: "exports",
      short: "Exports",
      icon: <Download size={18} className={iconClass} />,
      title: "Exports PDF & Excel",
      content: "Chaque module de liste propose un bouton « Exporter » qui génère un fichier à partir des données affichées.",
      points: [
        { label: "Document PDF", text: "Il comprend le logo, le titre de l'ONG, la date d'édition et le tableau. Il est adapté à l'impression et au partage." },
        { label: "Feuille Excel", text: "Elle convient aux calculs, aux tris et aux analyses complémentaires. L'export Excel des formations contient tous les modules, la colonne « Autre » et l'identifiant du membre." },
        { label: "Contenu exporté", text: "Le fichier reprend la liste affichée à l'écran : si une recherche est active, seul le résultat filtré est exporté. Effacez la recherche avant d'exporter pour obtenir toute la liste." },
        { label: "Téléchargement", text: "Le fichier est téléchargé par votre navigateur avec un nom explicite, par exemple membres_tsinjo_aina.pdf. S'il n'apparaît pas, vérifiez le dossier de téléchargements et les autorisations du navigateur." },
        { label: "En cas d'échec", text: "Un message « Impossible de générer le fichier » s'affiche. Réessayez, puis contactez le support si le problème persiste." }
      ]
    },
    {
      id: "compte",
      short: "Compte",
      icon: <User size={18} className={iconClass} />,
      title: "Paramètres du compte",
      content: "La page Paramètres du compte permet de modifier votre nom, votre adresse e-mail et votre mot de passe.",
      points: [
        { label: "Informations personnelles", text: "Modifiables à tout moment. Les changements sont pris en compte après un clic sur « Enregistrer les modifications »." },
        { label: "Changer de mot de passe", text: "Cette étape est facultative. Saisissez d'abord votre mot de passe actuel, puis le nouveau mot de passe, puis sa confirmation, qui doit être strictement identique. Sinon, un message d'erreur s'affiche et rien n'est envoyé." },
        { label: "Afficher ou masquer", text: "L'icône en forme d'œil, à droite de chaque champ de mot de passe, permet de vérifier votre saisie." },
        { label: "Après l'enregistrement", text: "Les trois champs de mot de passe sont automatiquement vidés pour votre sécurité." }
      ]
    },
    {
      id: "faq",
      short: "Questions fréquentes",
      icon: <HelpCircle size={18} className={iconClass} />,
      title: "Questions fréquentes",
      faq: [
        {
          q: "Mon enregistrement est refusé, que faire ?",
          a: "Lisez le message affiché en haut à droite de l'écran. Les causes les plus fréquentes sont un champ obligatoire resté vide, un numéro de ménage déjà attribué à un autre groupe (module Groupes solidaires) ou une session expirée. Corrigez le point indiqué puis enregistrez de nouveau."
        },
        {
          q: "J'obtiens le message « Votre session a expiré ».",
          a: "Votre connexion n'est plus valide. Déconnectez-vous, puis reconnectez-vous avec vos identifiants avant de reprendre votre saisie."
        },
        {
          q: "J'obtiens « Connexion au serveur impossible ».",
          a: "Vérifiez d'abord votre connexion internet. Si elle fonctionne, le serveur est peut-être momentanément indisponible : patientez quelques minutes, puis contactez l'équipe technique si le message persiste."
        },
        {
          q: "Un groupe n'apparaît pas dans la colonne Localisation d'un réseau.",
          a: "Le nom saisi dans le réseau doit être identique à celui du groupe enregistré dans le module Groupes solidaires. Vérifiez l'orthographe, et assurez-vous que la commune est bien renseignée dans la fiche du groupe."
        },
        {
          q: "Un membre apparaît avec « Aucun groupe ».",
          a: "Son numéro de ménage ne figure dans aucune fiche de groupe. Ajoutez ce numéro dans « Ménages rattachés » du groupe concerné, ou corrigez le numéro de ménage du membre s'il comporte une erreur."
        },
        {
          q: "Pourquoi mon export contient-il moins de lignes que prévu ?",
          a: "Une recherche est probablement active : l'export reprend uniquement la liste affichée. Effacez le champ de recherche, puis exportez de nouveau."
        },
        {
          q: "Pourquoi un réseau ou un membre reste-t-il « En cours » ou sans statut Autonomie ?",
          a: "Le statut est calculé automatiquement. Pour un réseau, les trois critères Activités, Plaidoyers et Plan de développement doivent être à « Oui ». Pour un membre en formation, tous les modules concernés doivent être à « Oui »."
        },
        {
          q: "Puis-je annuler une suppression ?",
          a: "Non. Une confirmation est demandée avant chaque suppression, mais une fois validée, elle ne peut pas être annulée depuis l'application. Si vous avez supprimé un enregistrement par erreur, vous devrez le saisir de nouveau."
        },
        {
          q: "Comment changer mon mot de passe ?",
          a: "Ouvrez la page Paramètres du compte, saisissez votre mot de passe actuel, puis le nouveau mot de passe et sa confirmation, et cliquez sur « Enregistrer les modifications »."
        }
      ]
    },
    {
      id: "glossaire",
      short: "Glossaire",
      icon: <Tag size={18} className={iconClass} />,
      title: "Glossaire",
      terms: [
        { term: "Ménage", def: "Unité familiale identifiée par un numéro (par exemple M001). Plusieurs membres peuvent partager le même numéro de ménage." },
        { term: "Chef de ménage", def: "Membre désigné comme responsable de son ménage." },
        { term: "Groupe solidaire (GS)", def: "Groupe communautaire qui rassemble plusieurs ménages d'une même zone." },
        { term: "Réseau", def: "Ensemble de groupes solidaires qui s'organisent et agissent ensemble." },
        { term: "Commune", def: "Collectivité territoriale qui regroupe plusieurs fokontany." },
        { term: "Fokontany", def: "Plus petite division administrative à Madagascar, au sein d'une commune." },
        { term: "Plaidoyer", def: "Ensemble d'actions menées pour défendre une cause ou les intérêts d'une communauté auprès des décideurs." },
        { term: "Autonomie", def: "Statut calculé automatiquement lorsque tous les critères requis sont remplis (pour un réseau comme pour le suivi des formations)." }
      ]
    },
    {
      id: "fepetra",
      short: "Sécurité",
      icon: <ShieldAlert size={18} className={iconClass} />,
      title: "Sécurité, Confidentialité & Droits d'Accès",
      content: "• Confidentialité stricte : Vos identifiants de connexion sont personnels et intransmissibles. Toute action entreprise avec votre compte engage votre responsabilité.\n\n• Hiérarchie des privilèges : Seuls les utilisateurs dotés du rôle 'Admin' possèdent les droits requis pour approuver les nouvelles inscriptions et modifier la structure des données.\n\n• Conformité : L'utilisation de la plateforme doit rigoureusement s'aligner avec la charte informatique et le règlement intérieur de l'ONG."
    },
    {
      id: "kaonty",
      short: "Support",
      icon: <Key size={18} className={iconClass} />,
      title: "Maintenance & Support Technique",
      content: "En cas d'anomalie technique, de ralentissement ou pour solliciter une modification de vos privilèges d'accès, veuillez ne pas tenter de manipulation interne. Documentez l'erreur constatée et soumettez directement un ticket de support au bureau de l'administrateur système ou à l'équipe technique de développement.",
      points: [
        { label: "Que préciser dans votre demande", text: "La page concernée, l'action effectuée juste avant l'erreur, le message affiché à l'écran (une capture d'écran aide beaucoup), ainsi que la date et l'heure approximatives." },
        { label: "Ce qu'il ne faut pas faire", text: "Ne partagez jamais votre mot de passe, même avec l'équipe technique : elle n'en a pas besoin pour intervenir." }
      ]
    }
  ];

  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900';

  // Texte complet d'une rubrique, utilisé pour la recherche
  const getSearchText = (section) => normalize([
    section.title,
    section.short,
    section.content,
    ...(section.steps || []),
    ...(section.points || []).map(p => `${p.label} ${p.text}`),
    ...(section.faq || []).map(item => `${item.q} ${item.a}`),
    ...(section.terms || []).map(t => `${t.term} ${t.def}`)
  ].join(' '));

  const search = normalize(query).trim();
  const visibleSections = search
    ? sections.filter(section => getSearchText(section).includes(search))
    : sections;

  // Défilement fluide vers une rubrique (désactivé si l'utilisateur préfère moins d'animations)
  const goToSection = (id) => {
    const el = document.getElementById(`aide-${id}`);
    if (!el) return;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950 font-body text-slate-900 dark:text-slate-100 overflow-hidden relative antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        .font-body{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
        .font-display{font-family:'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:-0.01em}
        details > summary::-webkit-details-marker{display:none}
      `}</style>
      
      {/* En-tête de page fixe en haut */}
      <header className="px-4 md:px-6 py-4 md:py-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => navigate(-1)} 
            aria-label="Retour"
            className={`h-9 w-9 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer shrink-0 ${focusRing}`}
          >
            <ChevronLeft size={18} />
          </button>

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0"></div>

          <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60">
            <HelpCircle size={20} strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <h1 className="text-lg font-display font-semibold text-slate-900 dark:text-white leading-tight">
              Centre d'aide & Documentation
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Guide d'utilisation, protocoles de sécurité et informations système.
            </p>
          </div>
        </div>
      </header>

      {/* Contenu principal défilable qui remplit tout l'espace restant */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6 w-full pb-6">

          {/* Recherche dans l'aide */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={17} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher dans l'aide (ex. ménage, export, mot de passe)..."
              aria-label="Rechercher dans l'aide"
              className="w-full h-10 pl-10 pr-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Effacer la recherche"
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${focusRing}`}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Sommaire */}
          {visibleSections.length > 0 && (
            <nav
              aria-label="Sommaire de l'aide"
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">Sommaire</h2>
                {search && (
                  <span className="text-[13px] text-slate-500 dark:text-slate-400 tabular-nums">
                    {visibleSections.length} rubrique{visibleSections.length > 1 ? 's' : ''} trouvée{visibleSections.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {visibleSections.map(section => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => goToSection(section.id)}
                    className={`h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors cursor-pointer ${focusRing}`}
                  >
                    {section.short}
                  </button>
                ))}
              </div>
            </nav>
          )}

          {/* Aucun résultat */}
          {visibleSections.length === 0 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Aucune rubrique ne correspond à votre recherche.</p>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Essayez un mot plus court ou un autre terme.</p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className={`mt-4 h-9 px-4 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors cursor-pointer ${focusRing}`}
              >
                Effacer la recherche
              </button>
            </div>
          )}
          
          {visibleSections.map((section) => (
            <div 
              key={section.id} 
              id={`aide-${section.id}`}
              className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 transition-colors scroll-mt-4"
            >
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60 shrink-0">
                  {section.icon}
                </div>
                <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                  {section.title}
                </h2>
              </div>
              
              {section.content && (
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                  {section.content}
                </p>
              )}

              {section.steps && (
                <div className="mt-2 space-y-2 pt-1">
                  {section.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 mt-1 shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {section.points && (
                <div className="mt-2 space-y-2.5 pt-1">
                  {section.points.map((point, index) => (
                    <div key={index} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 mt-1 shrink-0" />
                      <span>
                        <strong className="font-semibold text-slate-900 dark:text-white">{point.label} :</strong>{' '}
                        {point.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {section.faq && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {section.faq.map((item, index) => (
                    <details key={index} className="group py-3 first:pt-0 last:pb-0" open={!!search}>
                      <summary className={`flex items-start justify-between gap-3 cursor-pointer list-none rounded-md text-sm font-semibold text-slate-900 dark:text-white ${focusRing}`}>
                        <span>{item.q}</span>
                        <ChevronDown size={16} className="text-slate-400 shrink-0 mt-0.5 transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              )}

              {section.terms && (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {section.terms.map((item) => (
                    <div key={item.term} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                      <dt className="text-sm font-display font-semibold text-slate-900 dark:text-white">{item.term}</dt>
                      <dd className="mt-1 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">{item.def}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ))}

          {/* Sektionan'ny Mpanoratra & Version */}
          <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 transition-colors">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-inset ring-emerald-100 dark:ring-emerald-900/60 shrink-0">
                <Code size={18} strokeWidth={2} />
              </div>
              <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                Informations Éditeur & Système
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Ingénierie & Développement (Misy rohy mankany amin'ny Portfolio) */}
              <a
                href="https://elyse-profil.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all flex items-center justify-between group ${focusRing}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 ring-1 ring-emerald-200 dark:ring-emerald-900">
                    <Code size={18} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                      Ingénierie & Développement
                    </span>
                    <span className="text-sm font-display font-semibold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      Elysé Randrianantenaina
                    </span>
                  </div>
                </div>
                <ExternalLink size={16} className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0 ml-2" />
              </a>

              {/* Version du Logiciel */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 flex items-center justify-center shrink-0 ring-1 ring-sky-200 dark:ring-sky-900">
                  <Layers size={18} />
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                    Version du Logiciel
                  </span>
                  <span className="text-sm font-display font-semibold text-slate-900 dark:text-white">
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