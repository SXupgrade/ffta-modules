# GDPR module Changelog

## 0.2.0

- Module devient un écran à 3 onglets au lieu d'un simple écran de
  publication, sur demande :
  - **Liste des participants** (nouveau) : coche « RGPD privé » par
    participant, écrit immédiatement (une ligne = un participant). Ce
    module devient donc aussi écrivain sur le flag RGPD, alors qu'il
    n'était jusqu'ici que lecteur (Compet+ était le seul écrivain).
  - **Impressions** (nouveau) : deux documents anonymisés — liste des
    participants (alphabétique) et classement qualificatif — ouverts dans
    une nouvelle fenêtre comme les impressions natives d'Ianseo. Nouveaux
    scripts autonomes `print/PrintParticipantsAnonymized.php` et
    `print/PrintQualificationAnonymized.php` (pas une réutilisation du
    pipeline d'impression natif d'Ianseo — voir le commentaire d'en-tête
    de chaque fichier pour le pourquoi).
  - **Publication internet** : l'écran existant, inchangé dans son
    contenu, mais l'aperçu ("Preview") fonctionne désormais sans
    identifiants ianseo.net configurés ("mode test") — seul l'envoi réel
    ("Publish") les exige toujours.
- **Format de stockage RGPD revu** : `MpParameter` passe de `optout.<id>`
  à `gdpr.optout.<id>`, et `MpTournament` passe de toujours `0` à l'ID du
  tournoi de chaque participant (`IanseoGdprRepository.php`) — pour que
  les écritures ne se marchent jamais dessus maintenant que deux systèmes
  (Compet+ et ce module) écrivent la même table, et pour que les
  extractions/suppressions de tournoi côté Compet+ embarquent
  naturellement les flags RGPD de leurs participants. Voir le README de
  ce module ("Storage") et le `PATCH_NOTES.md` du repo `competplus` pour
  le détail de la migration.
- `api/gdpr.php` gagne `list-participants` et `set-participant-optout`
  (même garde ACL que le reste du module).
- Vérifié : `php -l` sur tous les fichiers PHP modifiés/ajoutés, le test
  `gdpr.i18n.test.js` (couverture des nouvelles clés i18n en/fr), le
  self-test existant `anonymizer.selftest.php` (18 checks, inchangé). Les
  deux nouveaux documents d'impression n'ont **pas** été vérifiés contre
  une vraie instance Ianseo (aucun environnement de ce type disponible ici)
  — voir README "Verification before production use".

## 0.1.0

- Initial version: publishes results to ianseo.net with RGPD-opted-out
  archers automatically anonymized, reusing Ianseo's own native
  `Common/OrisFunctions.php` result builders. Covers individual/team
  qualification and final ranking, medal list/standing, start list, and
  entry statistics. See README for scope and the required verification
  step before production use.
