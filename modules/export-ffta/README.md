# export-ffta

Module `ffta-modules` for the French federation results export.

## Step 1 — active tournament export

The `Export` tab calls `api/export-ffta.php?action=download&level=S|SP|N`.
It uses the refactored PHP engine extracted from `Modules/Sets/FR/exports/index.php`.

## Step 2 — active tournament TNR

The `Active tournament TNR` tab generates the TXT from the active Ianseo tournament and compares it with a reference file stored in `tests/expected/`.

Default reference names:

- `active-S.txt`
- `active-SP.txt`
- `active-N.txt`

These files are intentionally not generated here because they depend on your real active tournament.

## Step 3 — JSON dataset TNR

The `JSON dataset TNR` tab uses datasets stored in `tests/datasets/` and expected files stored in `tests/expected/`.
This first version uses a lightweight portable JS engine to validate the TNR workflow. The target is to progressively align this dataset engine with the official PHP export engine.

## Legacy reference

`legacy/original-fr-export-index.php` keeps the original monolithic FR export as the functional reference.
