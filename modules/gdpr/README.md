# gdpr

Module `ffta-modules` covering RGPD (GDPR) opt-out end to end, in three
tabs:

1. **Liste des participants** — mark an archer "RGPD private" (writes the
   same opt-out flag Compet+ writes — see "Storage" below).
2. **Impressions** — anonymized equivalents of two of Ianseo's own
   printable documents (opted-out archers shown as `Archer #<EnId>`
   instead of their real name).
3. **Publication internet** — publishes results to ianseo.net the same way
   Ianseo's own "Send to Ianseo.net" screen (`Tournament/UploadResults.php`)
   does, except opted-out archers are replaced by an anonymous placeholder
   (given name and date of birth blanked too) before the payload is sent.
   Club/country stays visible throughout.

## Storage

Opt-out is a per-participant flag, scoped to the tournament, stored in
Ianseo's native `ModulesParameters` table (`MpModule='CompetPlusPrivacy'`,
`MpParameter='gdpr.optout.<EnId>'`, `MpTournament=<tournament id>`,
`MpValue='1'`/`'0'`) — the same table and row shape Compet+'s own
`core/services/entry-privacy.service.js` writes. **Both sides read and
write these rows now**: originally Compet+-only (this module was
read-only), the "Liste des participants" tab added in v0.2.0 makes this
module a writer too, via `IanseoGdprRepository::setEntryOptOut()`. One
row per participant (not one row per tournament with a list packed into
`MpValue`) specifically so two independent writers — Compet+ and this
module — can never clobber each other's write: `ModulesParameters`' real
primary key is `(MpModule, MpParameter, MpTournament)`, so a fixed
`MpParameter` would allow only one row per tournament total.

Before v0.2.0, opt-out was a single global bucket (`MpParameter='optout.<EnId>'`,
`MpTournament` always `0`) — Compet+'s own `PATCH_NOTES.md` documents the
rescoping and its one-time migration of any rows still in that shape.

## Why "Publication internet" rebuilds the payload itself

Ianseo core has no hook, filter, or event system a module can use to
intercept or rewrite an outgoing request (confirmed: `Tournament/UploadResults-upload.php`
has no conditional `include`/`require` toward `Modules/`, and this repo's
own SDK has no event bus either). This module does not patch or replace
that native screen — it cannot, and a core-file patch would be silently
wiped by Ianseo's own updater anyway (it MD5-diffs and overwrites every
`Tournament/*.php` file on every update; `Modules/Custom/` is the only
excluded path). Instead it **rebuilds the same kind of payload itself**,
reusing Ianseo's own native result-builder functions
(`Common/OrisFunctions.php`) so the row shapes ianseo.net receives are
byte-compatible with what the native screen would have sent, then applies
a redaction pass before sending.

Organizers who want RGPD-respecting publication should use this screen
instead of Ianseo's native one. Nothing in this module hides or disables
the native screen — see "Coexisting with the native screen" below.

## Scope (v1 of "Publication internet")

Covered result types: individual and team qualification (`IQ`/`TQ`),
individual and team final ranking (`IF`/`TF`), medal list (`MEDLST`),
medal standing by country (`MEDSTD`), start list (`ENS`), entry statistics
(`STC`/`STE`).

Not yet covered (use Ianseo's native screen for these): brackets/eliminations
(`IE`/`IP`/`IB`/`TB`), records (`RECSTD`/`RECBRK`), alternate start list
orderings (`ENE`/`ENC`/`ENA`), "Run Archery" (World Archery run-scoring)
tournaments, the ORIS (World Archery) formatting toggle, and periodic
auto-upload (this module always publishes on an explicit click).

**Mode test**: Preview no longer requires ianseo.net credentials to be
configured for the tournament — only Publish does, since only Publish
actually sends anything. This lets an organizer or developer see exactly
what an anonymized payload would look like on a tournament that isn't
linked to ianseo.net yet (or at all).

## Scope (v1 of "Impressions")

Two documents, chosen as the v1 subset: the alphabetical participants
list and the individual qualification ranking. Both are custom PHP
scripts under `print/`, not a reuse of Ianseo's own native print scripts
— see each file's own header comment for why (short version: the native
alphabetical-listing query doesn't even select `Entries.EnId`, so there
is no reliable key to redact by without patching Ianseo's own query,
which this module must never do). Opened via `window.open()` in the
"Impressions" tab, same UX as Ianseo's own native prints.

## Verification before production use

The exact PII field names Ianseo's native result builders return are
**not consistent** across result types (confirmed by static source
review: `Common/Rank/Obj_Rank_Abs.php` uses `familyname`/`givenname`/
`birthdate`, `Common/Rank/Obj_Rank_GridInd.php` uses `familyName`/
`givenName`/`birthDate`, and some classes mix both casings in the same
row). `domain/Anonymizer.php` deliberately does not rely on a hand-typed
per-type field map for this reason: it walks every row and redacts any
key whose *lowercased* name exactly matches a known PII field name
(`familyname`, `familynameupper`, `givenname`, `athlete`, `tvname`,
`name`, `birthdate`), regardless of casing. This is a defense-in-depth
choice, not a substitute for verification.

**Before enabling "Publication internet" for a real tournament, use the
"Preview" action** (`action=preview` on `api/gdpr.php`, or the "Preview"
button in the screen) against a real tournament that has at least one
archer flagged opted-out, and visually confirm every name/DOB field in
the dumped payload for that archer reads as the anonymized placeholder,
not real data. Preview never sends anything to ianseo.net.

The two "Impressions" documents (`print/PrintParticipantsAnonymized.php`,
`print/PrintQualificationAnonymized.php`) were built and `php -l`'d
without a running Ianseo instance/real PDF render available — verify a
real print of each, for a tournament with at least one opted-out
participant, before relying on them for a real event.

## Coexisting with the native screen

This module does not disable or hide Ianseo's native "Send to Ianseo.net"
screen — both remain reachable. Two ways to steer organizers toward this
one instead, neither implemented by this module itself:

- Rename/deprioritize the native menu entry via the `simple-menu` module
  already in this repo (it relabels/reorders Ianseo's native menu without
  touching core files) — the safe, always-available option.
- On installations running `IanseoAuthentication` (real per-user ACL via
  `AclUserFeatures`), revoke `AclInternetPublish`/`ipSend` for the
  organizer role through Ianseo's native ACL screen. Not verified from
  this module's own codebase whether `IanseoAuthentication` actually wires
  `AclUserFeatures` into `checkFullACL()` — confirm before relying on it.

## Credentials

"Publication internet" reuses whatever `OnlineId`/`OnlineAuth` the
organizer already entered on Ianseo's native `Tournament/SetCredentials.php`
screen for this tournament — same session-first, then `ModulesParameters`
(`MpModule='SendToIanseo'`) fallback order Ianseo's own upload script
uses. This module never asks for or stores its own copy of these
credentials.

## Architecture

- `repositories/ianseo/IanseoGdprRepository.php` — reads/writes the two
  Ianseo-owned `ModulesParameters` namespaces this module doesn't
  otherwise own (RGPD opt-outs, publish credentials), plus the event list
  and the tournament's participant list (`getParticipants()`, for the
  "Liste des participants" tab).
- `domain/Anonymizer.php` — the generic, casing-tolerant redaction walker.
- `domain/PublishEnvelope.php` — builds the `$RET` envelope in the exact
  shape `Tournament/UploadResults-upload.php` builds it in.
- `application/GdprPublishService.php` — orchestration: ACL check (same
  bit the native screen uses), calls native `Common/OrisFunctions.php`
  builders per selected result type, redacts, serializes
  (`gzcompress(serialize($RET))`), POSTs to
  `$CFG->IanseoServer . 'Upload-Competition.php'` (curl-first,
  `stream_context_create()` fallback — same pattern as this repo's only
  other outbound HTTP call, `core/update/update.php`). Also exposes
  `listParticipants()`/`setParticipantOptOut()` for the participants tab
  and `getAnonymizedQualificationSections()` for the qualification print.
- `api/gdpr.php` — `status`, `preview`, `publish`, `list-participants`,
  `set-participant-optout`.
- `print/PrintParticipantsAnonymized.php`, `print/PrintQualificationAnonymized.php`
  — the two "Impressions" documents, deployed under
  `Modules/Custom/ffta-modules/modules/gdpr/print/` (this repo's own root
  maps 1:1 onto `Modules/Custom/ffta-modules/`).
