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
  { id: 'organisation', titleKey: 'sections.organisation', page: 22, discipline: 'organisation' },
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
  },
  /* ------------------------------------------------------------------
   * Fiches organisateur (v0.2.15) — terrain, lignes, formats, para.
   * Pages = pages du PDF officiel Version Mai 2026.
   * ---------------------------------------------------------------- */
  {
    id: 'org-target-assignment', section: 'organisation', discipline: 'organisation', page: 23,
    title: 'Attribution des cibles par le greffe',
    article: 'I.B.1.2', tags: ['greffe', 'cibles', 'placement', 'club', 'fauteuil'],
    summary: 'Pas plus de 2 tireurs du même club sur une même cible. Éviter 4 tireurs sur une cible quand un archer est en fauteuil roulant. Après défections, ne pas laisser un archer seul ni 2 archers du même club sur une cible.',
    sourceHint: 'Page 23 — contrôles du greffe avant le concours.'
  },
  {
    id: 'org-results-deadline', section: 'organisation', discipline: 'organisation', page: 23,
    title: 'Envoi des résultats : immédiat et obligatoire',
    article: 'I.B.1.4', tags: ['résultats', 'envoi', 'pénalités', 'organisateur'],
    summary: 'Les résultats sont transmis via l’application préconisée par la FFTA dès la fin de la compétition. Pénalités organisateur : plus de 3 jours de retard = 1 an de suppression d’organisation ; pas d’envoi = 2 ans.',
    sourceHint: 'Page 23 — envoi des résultats et barème de pénalités.'
  },
  {
    id: 'org-press-access', section: 'organisation', discipline: 'organisation', page: 24,
    title: 'Presse et photographes sur le terrain',
    article: 'I.B.2', tags: ['presse', 'photographes', 'tv', 'zone de presse'],
    summary: 'Journalistes, photographes et TV accèdent au terrain uniquement dans les zones qui leur sont réservées, et près des cibles avec l’accord de l’arbitre responsable. Les photographes amateurs peuvent entrer momentanément dans la zone de presse, sous contrôle des arbitres.',
    sourceHint: 'Pages 24-25 — accès des médias au terrain.'
  },
  {
    id: 'org-coach-zone', section: 'organisation', discipline: 'organisation', page: 25,
    title: 'Zone des entraîneurs (Championnat de France 18 m)',
    article: 'I.B.2', tags: ['entraîneurs', 'coach', 'zone', 'ligne d’attente'],
    summary: 'Après l’entraînement, aucun coach sur le terrain de compétition. L’organisateur aménage pour eux une bande d’environ 2 m parallèle à la ligne de tir, juste derrière la zone de repos des archers. À défaut de place, une solution est trouvée avec le délégué technique et l’arbitre responsable.',
    sourceHint: 'Page 25 — placement des entraîneurs et cadres techniques.'
  },
  {
    id: 'org-duels-threshold', section: 'organisation', discipline: 'organisation', page: 119,
    title: 'Quand organiser des duels ?',
    article: 'II.A.7.1', tags: ['duels', 'championnat', 'format', 'phases finales'],
    summary: 'Championnats de France et de région : duels obligatoires. Championnats départementaux : duels souhaités. Les duels ne sont organisés que si la catégorie compte au moins 4 archers.',
    sourceHint: 'Page 119 — catégories d’épreuves TAE.'
  },

  /* ---------------- TAE : aménagement du terrain ---------------- */
  {
    id: 'tae-field-tolerances', section: 'organisation', discipline: 'outdoor', page: 126,
    title: 'Terrain TAE : équerrage et tolérances de distance',
    article: 'II.B.1.1', tags: ['terrain', 'distances', 'mesure', 'tolérance'],
    summary: 'Le terrain est mis à l’équerre, chaque distance mesurée depuis la verticale du jaune de chaque cible jusqu’à la ligne de tir. Tolérance : ±30 cm à 90/70/60 m, ±15 cm à 50/30 m.',
    sourceHint: 'Page 126 — aménagement des terrains TAE.'
  },
  {
    id: 'tae-waiting-media-lines', section: 'organisation', discipline: 'outdoor', page: 126,
    title: 'TAE : ligne d’attente et ligne médias',
    article: 'II.B.1.2', tags: ['ligne d’attente', 'ligne de tir', 'médias', '5 m'],
    summary: 'La ligne d’attente est tracée à 5 m au moins derrière la ligne de tir. Une ligne pour les médias est tracée 1 m devant la ligne d’attente.',
    sourceHint: 'Page 126 — lignes du terrain TAE.'
  },
  {
    id: 'tae-target-height', section: 'organisation', discipline: 'outdoor', page: 126,
    title: 'TAE : hauteur et inclinaison des cibles',
    article: 'II.B.1.3-1.4', tags: ['cibles', 'blason', 'hauteur', 'inclinaison', '1,30 m'],
    summary: 'Cibles numérotées, inclinées de 10 à 15° par rapport à la verticale, toutes au même angle. Centre de l’or à 1,30 m du sol (±5 cm) pour les blasons uniques de 122 ou 80 cm ; avec 2 blasons réduits, les deux centres à 1,30 m et 10 cm minimum entre zones de score.',
    sourceHint: 'Page 126 — cibles et blasons TAE.'
  },
  {
    id: 'tae-archers-per-target', section: 'organisation', discipline: 'outdoor', page: 126,
    title: 'TAE : nombre de tireurs par cible',
    article: 'II.B.1.7-1.8', tags: ['tireurs par cible', 'ligne de tir', 'capacité'],
    summary: 'Tous les concurrents sur une seule ligne de tir. Prévoir assez de cibles pour ne pas dépasser 3 tireurs par cible ; 4 au maximum si la ligne de tir ne le permet pas.',
    sourceHint: 'Page 126 — capacité de la ligne de tir.'
  },
  {
    id: 'tae-position-spacing', section: 'organisation', discipline: 'outdoor', page: 126,
    title: 'TAE : 80 cm par archer, 1,25 m en fauteuil',
    article: 'II.B.1.9', tags: ['espace', '80 cm', 'fauteuil', '1,25 m', 'marquage', 'pas de tir'],
    summary: 'Le numéro de chaque cible est répété à 4 m devant la ligne de tir. Les positions de tir sont marquées au sol (obligatoire, en rythme AB/CD comme A-B-C) avec un minimum de 80 cm par archer, porté à 1,25 m pour un archer en fauteuil roulant. La ligne de tir ne doit jamais être couverte.',
    sourceHint: 'Pages 126-127 — positions de tir et interprétation WA.'
  },
  {
    id: 'tae-3m-line-lanes', section: 'organisation', discipline: 'outdoor', page: 127,
    title: 'TAE : ligne des 3 m et couloirs de tir',
    article: 'II.B.1.10-1.11', tags: ['ligne des 3 m', 'couloirs', 'buttes'],
    summary: 'Une ligne est tracée à 3 m devant la ligne de tir. Des couloirs perpendiculaires relient la ligne de tir à la ligne des cibles ; chaque couloir contient de 1 à 4 buttes.',
    sourceHint: 'Page 127 — couloirs et ligne des 3 m.'
  },
  {
    id: 'tae-spectator-safety', section: 'organisation', discipline: 'outdoor', page: 127,
    title: 'TAE : barrières et zone de sécurité du public',
    article: 'II.B.1.12', tags: ['sécurité', 'barrières', 'spectateurs', 'public', '50 m'],
    summary: 'Barrières à 20 m minimum de part et d’autre de la ligne des cibles à 90 m (réductible à 10 m de part et d’autre de la ligne de tir), à 10 m minimum derrière la ligne d’attente, et public maintenu à au moins 50 m derrière les cibles à 90 m (zone de sécurité de 110 m cibles à 30 m). Cette distance arrière peut être réduite avec une butte d’arrêt naturelle ou artificielle suffisamment haute.',
    sourceHint: 'Page 127 — protection du public.'
  },
  {
    id: 'tae-finals-field', section: 'organisation', discipline: 'outdoor', page: 127,
    title: 'TAE : aménagement pour éliminatoires et finales',
    article: 'II.B.1.13-1.16', tags: ['finales', 'éliminatoires', 'ligne de 1 m', 'équipes', 'entraînement'],
    summary: 'Chaque catégorie en lice tire sur des cibles contiguës, avec un terrain d’entraînement adjacent pour les archers encore en compétition. Pour les épreuves par équipes : ligne nette à 1 m derrière la ligne de tir (3 cm de large minimum), emplacements pour 3 archers et leur matériel derrière cette ligne, case entraîneur derrière la zone des archers, et si possible une place pour l’arbitre entre les deux équipes.',
    sourceHint: 'Page 127 — dispositif des phases finales (cf. annexe 2).'
  },
  {
    id: 'tae-practice-sessions', section: 'organisation', discipline: 'outdoor', page: 117,
    title: 'TAE : volées d’essai et terrain d’entraînement',
    article: 'II.A.3.1-3.4', tags: ['entraînement', 'volées d’essai', 'échauffement'],
    summary: 'Trois volées d’essai ouvrent chaque journée de qualification, la compétition démarrant immédiatement après. Pendant les éliminatoires et finales, l’organisateur peut fixer le nombre de volées d’essai et doit mettre un terrain d’entraînement à disposition des archers encore en lice.',
    sourceHint: 'Page 117 — entraînement sur le lieu de compétition.'
  },
  {
    id: 'tae-tv-rules', section: 'organisation', discipline: 'outdoor', page: 125,
    title: 'TAE télévisé : contraintes de terrain',
    article: 'II.A.11.2', tags: ['télévision', 'tv', 'parasols', 'coach'],
    summary: 'Avec la télévision : ni parasols ni structures d’ombre sur le terrain, pas de chaises pour archers et entraîneurs, un seul coach par archer ou équipe, ni téléphone ni caméra personnelle sur le terrain de tir, eau froide à disposition sur le terrain et en zone d’attente.',
    sourceHint: 'Page 125 — compétitions retransmises.'
  },

  /* ---------------- TAE : formats d'épreuves et phases finales ---------------- */
  {
    id: 'tae-qualification-duels', section: 'organisation', discipline: 'outdoor', page: 120,
    title: 'TAE international : qualification puis duels',
    article: 'II.A.7.4', tags: ['format', 'qualification', '2x36', '70 m', '50 m', 'duels'],
    summary: 'Épreuve de qualification de 2×36 flèches (70 m arc classique ou distance de la catégorie ; 50 m arc à poulies), pouvant être suivie de phases éliminatoires et finales tirées à la même distance et sur le même blason.',
    sourceHint: 'Pages 118-120 — épreuves TAE distances internationales.'
  },
  {
    id: 'tae-recurve-matches', section: 'organisation', discipline: 'outdoor', page: 121,
    title: 'TAE arcs classiques : duels en sets',
    article: 'II.A.7.4.1', tags: ['duels', 'sets', 'classique', 'finales', '104'],
    summary: 'Éliminatoires : jusqu’à 104 archers positionnés selon la qualification (tableau des duels), chaque duel au meilleur des 5 sets de 3 flèches. Finales : les 8 meilleurs poursuivent en duels jusqu’à la finale pour l’or. Équipes : les 4 meilleures issues des éliminatoires, tir alterné par séquences de 3 flèches en finale.',
    sourceHint: 'Pages 120-121 — épreuves éliminatoires et finales arcs classiques.'
  },
  {
    id: 'tae-compound-matches', section: 'organisation', discipline: 'outdoor', page: 122,
    title: 'TAE arcs à poulies : duels au cumul',
    article: 'II.A.7.5.1', tags: ['duels', 'poulies', 'cumul', '50 m', 'blason 80'],
    summary: 'Duels arcs à poulies à 50 m sur blason de 80 cm réduit à 6 zones, en score cumulé sur 5 volées de 3 flèches (pas de sets). Éliminatoires jusqu’à 104 archers, finales à 8, équipes à 4.',
    sourceHint: 'Pages 121-122 — épreuves éliminatoires et finales arcs à poulies.'
  },
  {
    id: 'tae-compound-faces', section: 'organisation', discipline: 'outdoor', page: 130,
    title: 'TAE poulies : disposition des blasons en duel',
    article: 'II.B.2.1.4.3', tags: ['blasons', 'duels', 'poulies', 'disposition'],
    summary: 'Éliminatoires (sans tir alterné) : 2 blasons 80 cm 6 zones côte à côte sur la même butte, archer de gauche à gauche, archer de droite à droite. Finales en tir alterné : 1 blason par cible. Équipes : 2 blasons horizontaux par cible, 3 flèches par blason (2 en mixte).',
    sourceHint: 'Page 130 — disposition des blasons duels et matchs.'
  },
  {
    id: 'tae-1440-round', section: 'organisation', discipline: 'outdoor', page: 120,
    title: 'Épreuve 1440 : 4 distances',
    article: 'II.A.7.2', tags: ['1440', 'distances', 'format'],
    summary: 'L’épreuve 1440 consiste à tirer 36 flèches à chacune des 4 distances, en une journée ou sur deux jours consécutifs.',
    sourceHint: 'Page 120 — épreuve 1440.'
  },
  {
    id: 'tae-shooting-times', section: 'organisation', discipline: 'outdoor', page: 141,
    title: 'TAE : temps de tir (et temps international)',
    article: 'II.B.5.4', tags: ['temps', 'chrono', '120 s', '240 s', 'tir alterné'],
    summary: 'Volée de 6 flèches : 240 s (180 s en temps international). Volée de 3 flèches en duel ou 6 flèches en match équipe : 120 s (90 s international). 1 flèche / égalité : 40 s (30 s international). Tir alterné des duels : 20 s par flèche. Équipe mixte : 80 s pour 4 flèches. Le « temps international » s’applique aux compétitions identifiées (D1, France Élite, TNJ…) ou si le mandat le précise.',
    sourceHint: 'Page 141 — temps et séquences de tir.'
  },
  {
    id: 'tae-team-1m-conduct', section: 'organisation', discipline: 'outdoor', page: 139,
    title: 'Matchs équipes : conduite derrière la ligne de 1 m',
    article: 'II.B.5', tags: ['équipes', 'ligne de 1 m', 'rotation', 'fauteuil'],
    summary: 'Les 3 archers démarrent chaque volée derrière la ligne de 1 m ; un seul archer à la fois sur la ligne de tir, 2 flèches chacun dans l’ordre choisi. Les flèches ne sortent du carquois qu’une fois sur la ligne de tir. Les archers en fauteuil roulant peuvent rester sur la ligne de tir pendant tout le match et lèvent la main pour signaler la fin de leur tir.',
    sourceHint: 'Page 139 — déroulement des matchs par équipes.'
  },

  /* ---------------- Salle 18 m : terrain et formats ---------------- */
  {
    id: 'indoor-tolerances', section: 'organisation', discipline: 'indoor18m', page: 240,
    title: 'Salle : tolérances de distance',
    article: 'III.B.1.1', tags: ['terrain', 'distances', 'tolérance', '18 m', '25 m'],
    summary: 'Terrain mis à l’équerre, distances mesurées de la verticale du jaune à la ligne de tir. Tolérance : ±10 cm à 18 m comme à 25 m.',
    sourceHint: 'Page 240 — aménagement du terrain de salle.'
  },
  {
    id: 'indoor-waiting-line', section: 'organisation', discipline: 'indoor18m', page: 240,
    title: 'Salle : ligne d’attente à 3 m minimum',
    article: 'III.B.1.2', tags: ['ligne d’attente', '3 m', 'ligne de tir'],
    summary: 'En salle, la ligne d’attente est tracée à au moins 3 m en arrière de la ligne de tir (contre 5 m en extérieur).',
    sourceHint: 'Page 240 — lignes du terrain de salle.'
  },
  {
    id: 'indoor-lane-width', section: 'organisation', discipline: 'indoor18m', page: 240,
    title: 'Salle : largeur des couloirs (80 cm / archer)',
    article: 'III.B.1.6', tags: ['couloirs', '160 cm', '80 cm', '70 cm', 'espace'],
    summary: 'Couloirs de 2 archers maximum, larges de 160 cm minimum (80 cm par archer). Tolérance : 70 cm par archer, soit des couloirs de 1,40 m ; en dessous, ne mettre qu’une cible et demie par panneau.',
    sourceHint: 'Page 240 — couloirs de tir en salle.'
  },
  {
    id: 'indoor-3m-marking', section: 'organisation', discipline: 'indoor18m', page: 240,
    title: 'Salle : ligne des 3 m et marquage des positions',
    article: 'III.B.1.5-1.7', tags: ['ligne des 3 m', 'marquage', 'numéro de cible', '4 m'],
    summary: 'Une ligne des 3 m est tracée devant la ligne de tir. Le numéro de chaque cible est répété à 4 m devant la ligne de tir, et le marquage au sol des positions de tir est obligatoire en rythme AB/CD comme A-B-C.',
    sourceHint: 'Page 240 — marquage du terrain de salle.'
  },
  {
    id: 'indoor-spectators', section: 'organisation', discipline: 'indoor18m', page: 240,
    title: 'Salle : barrières et spectateurs',
    article: 'III.B.1.10', tags: ['spectateurs', 'barrières', 'sécurité', 'public'],
    summary: 'Si la salle l’exige, des barrières maintiennent le public à 10 m minimum des extrémités de la ligne des cibles et 5 m minimum derrière la ligne d’attente. Les spectateurs ne peuvent jamais se trouver derrière la ligne des cibles.',
    sourceHint: 'Page 240 — protection du public en salle.'
  },
  {
    id: 'indoor-light-categories', section: 'organisation', discipline: 'indoor18m', page: 240,
    title: 'Salle : lumière et séparation des catégories',
    article: 'III.B.1.8-1.9', tags: ['lumière', 'éclairage', 'catégories', 'recommandation'],
    summary: 'Tenir compte des sources de lumière naturelles et artificielles et de leurs effets sur les blasons. Il est recommandé de séparer les différentes catégories sur la ligne de tir.',
    sourceHint: 'Page 240 — recommandations d’aménagement.'
  },
  {
    id: 'indoor-team-layout', section: 'organisation', discipline: 'indoor18m', page: 240,
    title: 'Salle : dispositif des matchs par équipes',
    article: 'III.B.1.11-1.12', tags: ['équipes', 'ligne de 1 m', 'emplacements', 'arbitre'],
    summary: 'Pour les matchs par équipes : ligne tracée à 1 m derrière la ligne de tir (3 cm de large minimum), emplacements pour 3 archers et leur matériel derrière cette ligne, case entraîneur derrière la zone des archers et, si la place le permet, un emplacement pour l’arbitre entre les deux équipes.',
    sourceHint: 'Pages 240-241 — matchs par équipes en salle.'
  },
  {
    id: 'indoor-duel-format', section: 'organisation', discipline: 'indoor18m', page: 236,
    title: 'Salle : format des duels (32 → 8) et équipes (16 → 4)',
    article: 'III.A.7.5', tags: ['duels', 'format', '32', 'trispot', 'finales'],
    summary: 'Duels à 18 m sur blasons triples de 40 cm. Éliminatoires : les 32 meilleurs de la qualification (sets pour les arcs classiques ; score cumulé sur 5 volées de 3 flèches pour les poulies). Finales : les 8 meilleurs. Équipes : 16 équipes en éliminatoires, 4 en finales. Des phases finales peuvent aussi suivre un 2×25 m ou un 2×18 m.',
    sourceHint: 'Pages 235-237 — épreuves de duels en salle.'
  },
  {
    id: 'indoor-times-signals', section: 'organisation', discipline: 'indoor18m', page: 252,
    title: 'Salle : temps de tir et signaux',
    article: 'III.B.5.3', tags: ['temps', '120 s', '40 s', 'signaux', 'panneaux'],
    summary: 'Volée de 3 flèches (ou 6 par équipe) : 120 s. 1 flèche (égalité, rattrapage) : 40 s ; 20 s en tir alterné. Égalité par équipe (3 flèches) : 60 s. Signal visuel obligatoire à 30 s de la fin (hors tir alterné), signaux placés des deux côtés du terrain et visibles de tous les archers, gauchers comme droitiers.',
    sourceHint: 'Pages 252-253 — séquences de tir et signalisation.'
  },

  /* ---------------- Para-tir à l'arc ---------------- */
  {
    id: 'para-space-line', section: 'organisation', discipline: 'para', page: 126,
    title: 'Para : 1,25 m par archer en fauteuil',
    article: 'II.B.1.9', tags: ['fauteuil', '1,25 m', 'espace', 'placement'],
    summary: 'Sur la ligne de tir, un archer en fauteuil roulant a besoin de 1,25 m (au lieu de 80 cm). Au greffe, éviter de placer 4 tireurs sur une cible où tire un archer en fauteuil.',
    sourceHint: 'Pages 23 et 126 — espace et attribution des cibles.'
  },
  {
    id: 'para-classes', section: 'organisation', discipline: 'para', page: 332,
    title: 'Para : classes de handicap reconnues',
    article: 'VI.B', tags: ['classification', 'W1', 'ST', 'support', 'déficient visuel'],
    summary: 'Handicap locomoteur : ST, W2, W1 (World Archery) ; ST3-ST4, W3-W4, Support 1-2 et NEI (FFTA). Déficients visuels : B1-B3 (WA) ; B4 et NEB regroupés en « LIBRE » (FFTA). Les archers sourds sont classés avec la catégorie NEI. ST = tir debout/chaise, W = fauteuil.',
    sourceHint: 'Page 332 — classes de handicap.'
  },
  {
    id: 'para-assistant', section: 'organisation', discipline: 'para', page: 334,
    title: 'Para : rôle de l’assistant sur le pas de tir',
    article: 'VI.B.4.2.1.4', tags: ['assistant', 'support', 'équité', 'pas de tir'],
    summary: 'L’archer réalise seul la mise en tension, la visée et la libération de la corde. L’assistant se limite à encocher la flèche, stabiliser la verticalité de l’arc (sans dépasser le pas de tir) et présenter, au signal de l’archer, l’aide technique de décoche — le déclenchement restant à l’archer.',
    sourceHint: 'Page 334 — règles d’équité pour les assistants.'
  },
  {
    id: 'para-support-position', section: 'organisation', discipline: 'para', page: 334,
    title: 'Para Support : placement de la potence',
    article: 'VI.B.4.2.1.2', tags: ['support', 'potence', 'pas de tir', 'sécurité'],
    summary: 'Tous les archers tirent du même pas de tir : pieds ou roues « à cheval » sur le pas de tir, arc en avant. La potence est positionnée pour que l’encoche soit au niveau du pas de tir en pleine allonge (tolérance d’une dizaine de cm). Un seul archer Support par cible.',
    sourceHint: 'Page 334 — placement du support d’arc.'
  },
  {
    id: 'para-cdf-formats', section: 'organisation', discipline: 'para', page: 342,
    title: 'Para : formats des championnats de France',
    article: 'VI.C.1-C.2', tags: ['championnat', 'format', '2x30', '2x36', 'duels', '28 cibles'],
    summary: 'Salle : tir de classement 2×30 flèches ; duels ensuite pour W1, Open et Fédéral si au moins 3 archers, finales bronze et or si possible en tir simultané au centre du gymnase ; rythme AB privilégié, d’où un minimum de 28 cibles. TAE : 2×36 flèches, avec duels pour le Para TAE International. Prévoir au moins 1 arbitre expérimenté pour 7 cibles.',
    sourceHint: 'Pages 342-343 — championnats de France para.'
  },
  {
    id: 'para-judges-placement', section: 'organisation', discipline: 'para', page: 342,
    title: 'Para : ajustement des positions par les arbitres',
    article: 'VI.C.1.1', tags: ['arbitres', 'placement', 'fauteuil', 'latéralité', 'sécurité'],
    summary: 'Hors phases finales, les arbitres peuvent modifier la position des archers sur la ligne de tir pour des raisons de sécurité (place des fauteuils, latéralité des archers déficients visuels), avec l’accord de l’arbitre responsable et information du service informatique.',
    sourceHint: 'Page 342 — adaptation du placement.'
  },
  {
    id: 'para-wheelchair-match', section: 'organisation', discipline: 'para', page: 139,
    title: 'Para : fauteuils pendant les matchs équipes',
    article: 'II.B.5 / II.B.7.4', tags: ['fauteuil', 'équipes', 'ligne de tir', 'main levée'],
    summary: 'En match par équipes, les archers en fauteuil roulant peuvent rester sur la ligne de tir pendant toute la durée du match ; ils signalent la fin de leur tir en levant la main au-dessus de la tête.',
    sourceHint: 'Pages 139 et 152 — conduite du tir par équipes.'
  },
  {
    id: 'para-tae-distances', section: 'organisation', discipline: 'para', page: 343,
    title: 'Para TAE : distances et blasons',
    article: 'VI.C.2', tags: ['distances', 'blasons', 'international', 'national'],
    summary: 'Para TAE National : 15 à 50 m en classique, 20 à 50 m en poulies et W1. Para TAE International : 70 m classique, 50 m poulies et W1, 20 à 30 m pour les déficients visuels selon âge et classification. Blasons de 122 cm ou 80 cm (entiers ou réduits) selon les catégories.',
    sourceHint: 'Page 343 — championnat de France Para-tir à l’Arc TAE.'
  }
];
