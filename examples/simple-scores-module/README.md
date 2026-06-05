# Simple Scores module

This module is intentionally simple: no MVVM, no store, no custom backend.

It demonstrates:

- reading qualification scores with `app.data.scores.readQualificationScores()`;
- editing a score with `app.data.scores.writeQualificationScore()`;
- recalculating ranking with `app.data.scores.recalculateQualificationRanking()`;
- rendering a table directly from one `index.js` page;
- respecting ACL read-only / read-write access.

Use it in the Lab to validate simple module behavior before testing in Ianseo.
