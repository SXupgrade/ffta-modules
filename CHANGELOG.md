# Changelog

## v0.2.16 - Simple-menu

- Module simple-menu qui permet de remplacer l'ordre des menus ianseo.
- Chargement optimisé de ffta-modules

## v0.2.15 - Rulebook etoffe pour les organisateurs

- Module rulebook v0.3.0 : 37 nouvelles fiches verifiees dans le reglement officiel Version Mai 2026 (terrain, lignes et espacements, formats et phases finales, temps de tir, para), nouvelle section « Organisation d'un concours », version du reglement affichee. Voir modules/rulebook/CHANGELOG.md.

## v0.2.14 - UX neophyte (audit ergonomique applique)

- Navigation : champ `audience` + `navigation.order` dans les manifests. Premier lancement = profil organisateur (wiki dev, eArchery, Hauts Faits desactives par defaut, reactivables dans Parametres). Nav triee par usage terrain : l'Assistant devient la page d'accueil.
- Beursault : visible uniquement pour les competitions SetFrBeursault (eligibilite manifest).
- Wording : purge du jargon technique dans les i18n fr/en (crypto, SQL, TNR, PoC, adaptateurs), vouvoiement uniforme, libelles orientes benefice. Onglets records renommes « Ce concours » / « Catalogue permanent ».
- Premiere visite : encart d'intro par module (cle i18n `<module>.intro`), repliable definitivement (memorise dans les settings). Rendu centralise dans le shell.
- Toss : parcours guide « 1. Verrouiller » -> « 2. Reveler » avec une seule action primaire contextuelle ; preuve et details techniques replies dans des blocs « avance ».
- Records : parcours en 3 etapes numerotees, suppression de zone via modale de confirmation explicite (decompte des records, bouton rouge) au lieu de confirm(), banniere de celebration quand des records sont battus, modele CSV telechargeable dans l'import, boutons migres vers cp-btn.
- League : selecteur de tournois (nouvelle action API `listTournaments`) pour le tournoi principal et l'ajout de manches — fini les codes tapes a la main ; avertissements reformules en langage humain avec action corrective ; bouton « Configurer le championnat » ; bouton de bareme par categorie avec libelle visible.
- Beursault : chargement automatique (ouverture + changement de filtre), focus preserve pendant la saisie (corrige une perte de focus a chaque frappe), Entree = case suivante comme un tableur, infobulle expliquant le statut « A verifier ».
- Export FFTA : ecran reduit au telechargement du fichier federal ; onglets de non-regression visibles uniquement en mode developpeur.
- Impressions : description orientee tache, aide contextuelle sur les feuilles de marque, badge technique retire.
- Assistant : badge « PoC » remplace, liens « Faire maintenant -> » vers les modules concernes (impressions, export, records).
- Rule Book : ouverture du PDF officiel directement a la page de la fiche consultee.
- Core : composant CpConfirm (confirmations destructives), styles ffta-intro-card et ffta-advanced, alias ffta-button (3e classe de bouton fantome, utilisee par records).
- Fix : la modale de parametres league extrait le code du tournoi meme si l'utilisateur choisit l'entree complete « CODE - Nom (date) » du selecteur.

## v0.2.13 - Harmonisation UX/UI (12 constats d'audit)

- Tokens : alias de compatibilite pour les familles historiques (--cp-*, --c-*, variantes --ffta-*) vers le referentiel officiel ; ajout de --ffta-radius-lg et --ffta-space-2. Les fallbacks en dur des modules deviennent inertes : la palette converge.
- Accent par module : --ffta-module-accent est pose sur l'outlet depuis manifest.navigation.accentColor ; les couleurs primaires/accent des modules en derivent (kickers, tabs, chips...).
- Boutons : styles pour cp-button / cp-button--primary (utilises par le shell et 9 modules mais jamais definis) en alias de cp-btn ; ajout du variant --icon.
- En-tete de page : styles core pour .ffta-page__header et .ffta-kicker ; nouveau composant core/ui/components/CpPageHeader.js (kicker + h1 + description + badge).
- Alertes : styles pour cp-alert (+ --danger/--warning/--info/--success), utilise partout mais jamais defini.
- Badges : variants ffta-badge--accent / --neutral / --outline.
- Tables : modificateur cp-table--compact. Formulaires : utilitaire ffta-filter-bar.
- Scoping : tous les CSS de modules (et la partie non scopee de utilities.css) sont desormais sous .ffta-modules-shell - plus de fuite vers la page hote Ianseo.
- Echelles : border-radius et box-shadow normalises sur les tokens ; font-weight 800/900 -> token bold ; breakpoints standardises 560/760/920/1100 ; letter-spacing des kickers unifie (.08em).
- Impression : core/ui/styles/print.css commun (charge par index.php, media print) ; @page locaux retires ; selecteurs print errones d'assistant corriges (.ffta-shell__header).
- Gouvernance : docs/ui-guidelines.md, checklist UI dans create-module.md, scripts/lint-ui.cjs (npm run lint:ui).
- package.json : fusion des deux cles "scripts" dupliquees (bug preexistant), version 0.2.13.

## v0.2.10 - Simple scores editor example

- Added `modules/simple-scores`, a simple non-MVVM module with an `index.js` page.
- Demonstrates qualification score listing, editing, write ACL checks and ranking recalculation.
- Added `app.data.scores.recalculateQualificationRanking()`.
- Added Lab support for simple module custom index pages.

## v0.2.8 - Lab module URL fix

- Fixed export-ffta module URLs by resolving API and test dataset paths from import.meta.url instead of current browser route.
- Prevents nested relative paths such as modules/export-ffta/api/modules/export-ffta/api/... in Vite Lab.

## v0.2.5 - Developer Wiki module

- Added `modules/developer-wiki`, an embedded SDK/Lab wiki for beginner-friendly module development.
- Added step-by-step guides for simple manifest-first modules and MVVM modules.
- Added examples for qualification score reading/writing, Lab testing and certification workflows.
- Added AI-friendly prompts and release checklists directly inside the module.
- Registered the wiki in the Lab module list and ACL mock profiles.

## v0.2.4 - Lab generator and module certification

- Added a Fake Competition Generator in the Lab with configurable archers, sessions, archers per target and deterministic seed.
- Added a persistent generated competition scenario backed by localStorage.
- Added Module Certification with manifest, ACL, i18n, write-permission and Lab data checks.
- Added certification status badge and last-run metadata per module.
- Documented the generator/certification workflow.

## v0.2.3 - Dev mode configuration

- Added `config/ffta-modules.config.js` and development example config.
- Added `app.dev` service with channel-based log activation.
- Updated `app.logger` to respect dev mode and log levels.
- Added optional console traces for runtime, ACL, data and HTTP API calls.
- Added optional `window.__FFTA_APP__` / `window.__FFTA_DEV__` debug handles.
- Added optional floating dev badge in the Ianseo shell.
- Added Dev mode toggle in the Lab sidebar.

## v0.2.2 - SDK packs and Lab scenarios

- Added SDK services: `app.ui`, `app.files`, `app.logger`, `app.validation`.
- Expanded `app.data` with entries, scores, targets, clubs, divisions and classes helpers.
- Added write helpers for qualification scores and target assignment.
- Extended `api/data.php` with the matching read/write actions and server-side ACL checks.
- Extended the Lab with API modes, data scenarios, theme switch and device frame switch.
- Added Lab templates for simple read-only, simple read/write, export helper and MVVM modules.
- Added documentation in `docs/sdk-packs-and-lab.md`.

## 0.2.1 - FFTA Modules Lab

- Added `lab/`, a Vite-powered local Ianseo simulator for SDK/module development.
- Added mock ACL profiles, tournament data, entries, qualification scores and target listing.
- Added lab controls for module selection, ACL profile, language, API delay and API error simulation.
- Added manifest validation feedback for classic and simple modules.
- Updated `app.data` read helpers to accept options, including module-aware ACL checks.

## 0.1.0

- Initial architecture scaffold.