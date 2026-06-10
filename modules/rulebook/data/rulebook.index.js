export const OFFICIAL_PDF_URL = 'https://www.fftiralarc.org/DOCUMENTS/ARBITRES/R%C3%A8glements_sportifs_et_arbitrage_saison_2026_version_20260502.pdf';

export const RULEBOOK_META = {
  title: 'Règlements sportifs et arbitrage',
  version: 'Version Mai 2026',
  season: '2026',
  pageCount: 438,
  sourceUrl: OFFICIAL_PDF_URL
};

export const SECTIONS = [
  { id: 'general', titleKey: 'sections.general', page: 5, discipline: 'general' },
  { id: 'outdoor', titleKey: 'sections.outdoor', page: 116, discipline: 'outdoor' },
  { id: 'indoor18m', titleKey: 'sections.indoor18m', page: 231, discipline: 'indoor18m' },
  { id: 'field', titleKey: 'sections.field', page: 286, discipline: 'field' },
  { id: 'para', titleKey: 'sections.para', page: 328, discipline: 'para' },
  { id: 'nature', titleKey: 'sections.nature', page: 346, discipline: 'nature' },
  { id: 'threeD', titleKey: 'sections.threeD', page: 368, discipline: 'threeD' },
  { id: 'runArchery', titleKey: 'sections.runArchery', page: 397, discipline: 'runArchery' }
];

export const QUICK_RULES = [
  {
    id: 'official-season-version', section: 'general', discipline: 'general', page: 2,
    title: 'Version applicable saison 2026',
    article: 'Version Mai 2026', tags: ['version', 'saison', '2026'],
    summary: 'Cette version est applicable aux compétitions de la saison sportive 2026 et intègre les modifications votées en mars 2026.',
    sourceHint: 'Page 2 — changements depuis Novembre 2025.'
  },
  {
    id: 'main-summary', section: 'general', discipline: 'general', page: 3,
    title: 'Sommaire principal', article: 'Sommaire', tags: ['sommaire', 'chapitres', 'disciplines'],
    summary: 'Le document est structuré en règlements généraux puis règlements sportifs par discipline : TAE, 18m, campagne, para, nature, 3D et Run Archery.',
    sourceHint: 'Page 3 — sommaire général.'
  },
  {
    id: 'judge-responsible-required', section: 'general', discipline: 'general', page: 15,
    title: 'Concours sous responsabilité d’un arbitre', article: 'I.A.3.4.2', tags: ['arbitre', 'officiel', 'responsable'],
    summary: 'Un concours officiel, qualificatif ou sélectif, doit être placé sous la responsabilité d’au moins un arbitre officiel.',
    sourceHint: 'Page 15 — absence d’arbitre.'
  },
  {
    id: 'judge-equipment', section: 'general', discipline: 'general', page: 15,
    title: 'Équipement de l’arbitre', article: 'I.A.3.4.3', tags: ['arbitre', 'matériel', 'équipement'],
    summary: 'Le règlement liste notamment sifflet, chronomètre, jumelles, stylo rouge, règlement concerné, cartons, matériel de mesure et éléments de contrôle.',
    sourceHint: 'Page 15 — tenue et équipements des arbitres.'
  },
  {
    id: 'judge-before-during-after', section: 'general', discipline: 'general', page: 16,
    title: 'Rôle de l’arbitre avant, pendant et après', article: 'I.A.3.4.4', tags: ['arbitre', 'avant', 'pendant', 'après', 'contrôle'],
    summary: 'Le règlement détaille les vérifications avant concours, le respect de la sécurité et des horaires pendant, puis le contrôle des résultats et éventuels records après.',
    sourceHint: 'Pages 16-17 — déroulement de la compétition.'
  },
  {
    id: 'referee-report', section: 'general', discipline: 'general', page: 20,
    title: 'Rapports d’arbitrage', article: 'I.A.4.1', tags: ['rapport', 'arbitrage', 'contrôle terrain'],
    summary: 'Les rapports servent de grille de contrôle pour les arbitres et d’outil de retour pour les organisateurs. Les feuilles de marque doivent être conservées au moins un an.',
    sourceHint: 'Page 20 — rapports d’arbitrage.'
  },
  {
    id: 'weekend-selective-competition', section: 'general', discipline: 'general', page: 22,
    title: 'Définition d’une compétition sélective', article: 'I.B', tags: ['sélectif', 'week-end', 'calendrier'],
    summary: 'Une compétition sélective se déroule sur le week-end, éventuellement avec une journée accolée, avec des exceptions pour les manifestations nationales ou internationales.',
    sourceHint: 'Page 22 — définition d’une compétition sélective.'
  },
  {
    id: 'registry-invitation-info', section: 'general', discipline: 'general', page: 22,
    title: 'Informations à prévoir sur le mandat', article: 'I.B.1.1', tags: ['mandat', 'greffe', 'horaires'],
    summary: 'Les invitations doivent indiquer les horaires du greffe, de l’inspection du matériel, de l’entraînement, du début des tirs et la forme du concours.',
    sourceHint: 'Page 22 — inscriptions.'
  },
  {
    id: 'target-assignment-club-control', section: 'general', discipline: 'general', page: 23,
    title: 'Contrôle de l’attribution des cibles', article: 'I.B.1.2', tags: ['cibles', 'club', 'affectation', 'greffe'],
    summary: 'Lors de l’attribution des cibles, il faut éviter certaines situations, notamment le regroupement excessif de tireurs d’un même club sur une même cible.',
    sourceHint: 'Page 23 — contrôles.'
  },
  {
    id: 'results-content', section: 'general', discipline: 'general', page: 23,
    title: 'Contenu des résultats', article: 'I.B.1.3', tags: ['résultats', 'classement', 'export'],
    summary: 'Les résultats doivent faire apparaître date, lieu, club organisateur, arbitres, participants par catégorie, distances, total général et informations archer.',
    sourceHint: 'Page 23 — résultats.'
  },
  {
    id: 'federal-results-send', section: 'general', discipline: 'general', page: 23,
    title: 'Envoi fédéral des résultats', article: 'I.B.1.4', tags: ['ffta', 'export', 'résultats', 'pénalité'],
    summary: 'L’organisateur doit envoyer les résultats via l’application préconisée par la FFTA dès la fin de la compétition. Des pénalités sont prévues en cas de retard ou absence d’envoi.',
    sourceHint: 'Page 23 — envoi des résultats.'
  },
  {
    id: 'markers', section: 'general', discipline: 'general', page: 28,
    title: 'Marqueurs et double marque', article: 'I.B.3', tags: ['marqueurs', 'double marque', 'feuilles'],
    summary: 'Au moins un marqueur doit être désigné par cible. En cas de score électronique, les feuilles de marque manuelles restent la valeur officielle.',
    sourceHint: 'Page 28 — marqueurs.'
  },
  {
    id: 'site-layout', section: 'general', discipline: 'general', page: 29,
    title: 'Aménagement du site', article: 'I.B.4', tags: ['terrain', 'sécurité', 'zone', 'organisation'],
    summary: 'Le site doit séparer clairement terrain ou parcours de compétition, terrain d’entraînement, zone spectateurs et zone de détente.',
    sourceHint: 'Page 29 — aménagement des sites.'
  },
  {
    id: 'jury-appeal', section: 'general', discipline: 'general', page: 30,
    title: 'Jury d’appel', article: 'I.B.5.1', tags: ['jury', 'appel', 'réclamation'],
    summary: 'Le jury d’appel est souhaitable sur les compétitions et obligatoire sur championnats de France, compétitions nationales et certaines manches par équipes.',
    sourceHint: 'Page 30 — jury d’appel.'
  },
  {
    id: 'appeal-procedure', section: 'general', discipline: 'general', page: 31,
    title: 'Procédure de réclamation', article: 'I.B.5.1', tags: ['réclamation', 'appel', 'procédure'],
    summary: 'Une réclamation doit être écrite, signée, motivée et remise au président des arbitres, avec des délais très courts lorsqu’elle peut impacter la suite de la compétition.',
    sourceHint: 'Page 31 — procédure.'
  },
  {
    id: 'captains-meeting', section: 'general', discipline: 'general', page: 36,
    title: 'Réunion des capitaines', article: 'I.B.6', tags: ['capitaines', 'briefing', 'équipes'],
    summary: 'La réunion des capitaines permet de reprendre le programme, les informations techniques, le jury d’appel, les procédures et les informations matérielles.',
    sourceHint: 'Pages 36-37 — réunion des capitaines.'
  },
  {
    id: 'score-sheets-control', section: 'general', discipline: 'general', page: 37,
    title: 'Feuilles de marque', article: 'I.B.7', tags: ['feuilles de marque', 'scores', 'signature'],
    summary: 'Les archers sont responsables de leurs scores et doivent contrôler puis signer les feuilles de marque. Les corrections doivent suivre la procédure prévue.',
    sourceHint: 'Pages 37-38 — feuilles de marques.'
  },
  {
    id: 'competition-interruption', section: 'general', discipline: 'general', page: 39,
    title: 'Interruption de compétition', article: 'I.B.7', tags: ['interruption', 'intempéries', 'classement'],
    summary: 'L’interruption définitive relève de l’arbitre responsable après concertation. Le classement reste validé avec les scores acquis si les conditions d’équité sont respectées.',
    sourceHint: 'Page 39 — interruption de la compétition.'
  },
  {
    id: 'u11-rules', section: 'general', discipline: 'general', page: 43,
    title: 'Règles U11', article: 'I.C.3.1.1', tags: ['u11', 'jeunes', 'puissance', 'blason'],
    summary: 'Les U11 ont des conditions spécifiques de pratique, notamment en matière de puissance d’arc, distance, blason et hauteur du centre du blason.',
    sourceHint: 'Pages 43-44 — U11.'
  },
  {
    id: 'national-ranking-average', section: 'general', discipline: 'general', page: 48,
    title: 'Classement national individuel', article: 'I.C.5.1.2', tags: ['classement national', 'sélection', 'moyenne'],
    summary: 'Les classements nationaux individuels sont établis sur la base des meilleurs scores selon la discipline et servent aux sélections aux championnats de France.',
    sourceHint: 'Pages 48-50 — sélection individuelle.'
  },
  {
    id: 'records-france', section: 'general', discipline: 'general', page: 58,
    title: 'Records de France et meilleures performances', article: 'I.C.7', tags: ['records', 'meilleure performance', 'homologation'],
    summary: 'Un record ou une meilleure performance est établi lorsqu’une performance supérieure d’au moins un point est atteinte, avec des règles spécifiques pour les scores parfaits.',
    sourceHint: 'Pages 58-60 — records.'
  },
  {
    id: 'license-check', section: 'general', discipline: 'general', page: 61,
    title: 'Contrôle des licences', article: 'I.C.9', tags: ['licence', 'greffe', 'contrôle'],
    summary: 'Les compétitions inscrites au calendrier FFTA sont ouvertes aux licenciés concernés. Le contrôle des licences fait partie des obligations du greffe.',
    sourceHint: 'Page 61 — licences.'
  },
  {
    id: 'dress-code', section: 'general', discipline: 'general', page: 62,
    title: 'Tenues et équipement', article: 'I.C.12', tags: ['tenue', 'équipement', 'protocole'],
    summary: 'Le règlement encadre les tenues sur les compétitions et cérémonies, avec des cas particuliers selon disciplines et compétitions par équipes.',
    sourceHint: 'Pages 62-66 — tenues.'
  },
  {
    id: 'advertising-field', section: 'general', discipline: 'general', page: 72,
    title: 'Publicité sur le terrain', article: 'I.E.1', tags: ['publicité', 'sponsors', 'terrain'],
    summary: 'La publicité est autorisée dans des conditions précises afin de ne pas nuire à la sécurité ni à la lisibilité du terrain.',
    sourceHint: 'Pages 72-73 — publicité.'
  },
  {
    id: 'badges-awards', section: 'general', discipline: 'general', page: 74,
    title: 'Badges et distinctions', article: 'I.F', tags: ['badges', 'distinctions', 'progression'],
    summary: 'Le règlement présente les distinctions WA et FFTA, notamment badges, écussons, plumes et flèches de progression.',
    sourceHint: 'Pages 74-81 — distinctions.'
  },
  {
    id: 'common-arrows', section: 'general', discipline: 'general', page: 82,
    title: 'Flèches — matériel commun', article: 'I.G.2', tags: ['flèches', 'matériel', 'diamètre'],
    summary: 'Les flèches doivent respecter les principes de définition, de diamètre, de marquage et d’apparence dans une même volée.',
    sourceHint: 'Page 82 — matériel commun.'
  },
  {
    id: 'bow-categories', section: 'general', discipline: 'general', page: 83,
    title: 'Catégories d’arc', article: 'I.G.3', tags: ['arc classique', 'poulies', 'barebow', 'longbow'],
    summary: 'Le règlement détaille les catégories d’arc et les accessoires autorisés ou interdits selon la division.',
    sourceHint: 'Pages 83+ — catégories d’arc.'
  },
  {
    id: 'outdoor-entry', section: 'outdoor', discipline: 'outdoor', page: 116,
    title: 'Tir à l’Arc Extérieur', article: 'II.1', tags: ['tae', 'extérieur', 'discipline'],
    summary: 'Point d’entrée vers les règles spécifiques du Tir à l’Arc Extérieur.',
    sourceHint: 'Page 116 — chapitre TAE.'
  },
  {
    id: 'indoor-entry', section: 'indoor18m', discipline: 'indoor18m', page: 231,
    title: 'Tir à 18 m', article: 'II.2', tags: ['18m', 'salle', 'indoor'],
    summary: 'Point d’entrée vers les règles spécifiques du Tir à 18 m.',
    sourceHint: 'Page 231 — chapitre Tir à 18m.'
  },
  {
    id: 'field-entry', section: 'field', discipline: 'field', page: 286,
    title: 'Tir en Campagne', article: 'II.3', tags: ['campagne', 'field'],
    summary: 'Point d’entrée vers les règles spécifiques du Tir en Campagne.',
    sourceHint: 'Page 286 — chapitre Campagne.'
  },
  {
    id: 'para-entry', section: 'para', discipline: 'para', page: 328,
    title: 'Para-tir à l’arc', article: 'II.4', tags: ['para', 'handicap', 'classification'],
    summary: 'Point d’entrée vers les règles spécifiques du Para-tir à l’arc.',
    sourceHint: 'Page 328 — chapitre Para.'
  },
  {
    id: 'nature-entry', section: 'nature', discipline: 'nature', page: 346,
    title: 'Parcours Nature', article: 'II.5', tags: ['nature', 'parcours'],
    summary: 'Point d’entrée vers les règles spécifiques du Parcours Nature.',
    sourceHint: 'Page 346 — chapitre Nature.'
  },
  {
    id: '3d-entry', section: 'threeD', discipline: 'threeD', page: 368,
    title: 'Tir sur cibles 3D', article: 'II.6', tags: ['3d', 'parcours'],
    summary: 'Point d’entrée vers les règles spécifiques du Tir sur cibles 3D.',
    sourceHint: 'Page 368 — chapitre 3D.'
  },
  {
    id: 'run-archery-entry', section: 'runArchery', discipline: 'runArchery', page: 397,
    title: 'Run Archery', article: 'II.7', tags: ['run archery', 'course', 'tir'],
    summary: 'Point d’entrée vers les règles spécifiques du Run Archery.',
    sourceHint: 'Page 397 — chapitre Run Archery.'
  }
];
