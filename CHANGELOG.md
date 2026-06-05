## v0.2.10 - Simple scores editor example

- Added `modules/simple-scores`, a simple non-MVVM module with an `index.js` page.
- Demonstrates qualification score listing, editing, write ACL checks and ranking recalculation.
- Added `app.data.scores.recalculateQualificationRanking()`.
- Added Lab support for simple module custom index pages.

# Changelog

## 0.1.0

- Initial architecture scaffold.

## 0.2.1 - FFTA Modules Lab

- Added `lab/`, a Vite-powered local Ianseo simulator for SDK/module development.
- Added mock ACL profiles, tournament data, entries, qualification scores and target listing.
- Added lab controls for module selection, ACL profile, language, API delay and API error simulation.
- Added manifest validation feedback for classic and simple modules.
- Updated `app.data` read helpers to accept options, including module-aware ACL checks.
