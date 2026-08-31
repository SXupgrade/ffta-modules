# gdpr

Module `ffta-modules` that publishes results to ianseo.net the same way
Ianseo's own "Send to Ianseo.net" screen (`Tournament/UploadResults.php`)
does, except archers who opted out of public results publication (Compet+'s
RGPD opt-out flag, `ModulesParameters` / `MpModule='CompetPlusPrivacy'`) are
replaced by an anonymous placeholder (`Archer #<EnId>`, given name and date
of birth blanked) before the payload is sent. Club/country stays visible.

## Why this exists

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

## Scope (v1)

Covered result types: individual and team qualification (`IQ`/`TQ`),
individual and team final ranking (`IF`/`TF`), medal list (`MEDLST`),
medal standing by country (`MEDSTD`), start list (`ENS`), entry statistics
(`STC`/`STE`).

Not yet covered (use Ianseo's native screen for these): brackets/eliminations
(`IE`/`IP`/`IB`/`TB`), records (`RECSTD`/`RECBRK`), alternate start list
orderings (`ENE`/`ENC`/`ENA`), "Run Archery" (World Archery run-scoring)
tournaments, the ORIS (World Archery) formatting toggle, and periodic
auto-upload (this module always publishes on an explicit click).

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

**Before enabling this for a real tournament, use the "Preview" action**
(`action=preview` on `api/gdpr.php`, or the "Preview" button in the
screen) against a real tournament that has at least one archer flagged
opted-out, and visually confirm every name/DOB field in the dumped
payload for that archer reads as the anonymized placeholder, not real
data. Preview never sends anything to ianseo.net.

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

Reuses whatever `OnlineId`/`OnlineAuth` the organizer already entered on
Ianseo's native `Tournament/SetCredentials.php` screen for this
tournament — same session-first, then `ModulesParameters`
(`MpModule='SendToIanseo'`) fallback order Ianseo's own upload script
uses. This module never asks for or stores its own copy of these
credentials.

## Architecture

- `repositories/ianseo/IanseoGdprRepository.php` — direct SQL reads of
  the two Ianseo-owned `ModulesParameters` namespaces this module doesn't
  own (RGPD opt-outs, publish credentials) plus the event list.
- `domain/Anonymizer.php` — the generic, casing-tolerant redaction walker.
- `domain/PublishEnvelope.php` — builds the `$RET` envelope in the exact
  shape `Tournament/UploadResults-upload.php` builds it in.
- `application/GdprPublishService.php` — orchestration: ACL check (same
  bit the native screen uses), calls native `Common/OrisFunctions.php`
  builders per selected result type, redacts, serializes
  (`gzcompress(serialize($RET))`), POSTs to
  `$CFG->IanseoServer . 'Upload-Competition.php'` (curl-first,
  `stream_context_create()` fallback — same pattern as this repo's only
  other outbound HTTP call, `core/update/update.php`).
- `api/gdpr.php` — `status` (opt-out count, credentials configured,
  available events), `preview` (dry run, no network call), `publish`.
