#!/usr/bin/env node
/**
 * Lint UI — garde-fou d'harmonisation (v0.2.13).
 * Vérifie dans modules/<id>/ui/styles/*.css :
 *  - scoping sous .ffta-modules-shell (erreur)
 *  - variables CSS hors référentiel --ffta- (les alias --cp- / --c- sont tolérés mais signalés)
 *  - couleurs hex en dur hors blocs @media print (avertissement)
 *  - font-weight 800/900 littéraux (avertissement)
 *  - border-radius en px/rem hors tokens (avertissement)
 *  - breakpoints hors échelle 560/760/920/1100 (avertissement)
 * Usage : node scripts/lint-ui.cjs   (exit 1 si erreurs)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STANDARD_BP = new Set([560, 760, 920, 1100]);
let errors = 0;
let warnings = 0;

function report(level, file, msg) {
  if (level === 'error') errors++; else warnings++;
  console.log(`[${level.toUpperCase()}] ${file}: ${msg}`);
}

function stripPrintBlocks(css) {
  return css.replace(/@media\s+print\s*\{[\s\S]*?\n\}/g, '');
}

const files = [];
for (const mod of fs.readdirSync(path.join(ROOT, 'modules'))) {
  const dir = path.join(ROOT, 'modules', mod, 'ui', 'styles');
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.css')) files.push(path.join(dir, f));
  }
}

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const raw = fs.readFileSync(file, 'utf8');
  const css = stripPrintBlocks(raw);

  for (const m of raw.matchAll(/^([^@{}\n][^{}\n]*)\{/gm)) {
    const sel = m[1].trim();
    if (!sel || sel.includes('.ffta-modules-shell')) continue;
    if (/^(body|html|:root)\b/.test(sel)) continue;
    report('error', rel, `sélecteur non scopé : « ${sel.slice(0, 60)} »`);
  }

  for (const m of css.matchAll(/var\((--[a-z0-9-]+)/g)) {
    const v = m[1];
    if (v.startsWith('--ffta-')) continue;
    report('warn', rel, `variable hors référentiel : ${v} (migrer vers --ffta-*)`);
  }

  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    report('warn', rel, `couleur en dur : ${m[0]} (utiliser un token --ffta-color-*)`);
  }

  for (const m of css.matchAll(/font-weight:\s*(800|900)\b/g)) {
    report('warn', rel, `font-weight ${m[1]} (utiliser var(--ffta-font-weight-bold))`);
  }

  for (const m of css.matchAll(/border-radius:\s*([\d.]+(px|rem))/g)) {
    report('warn', rel, `border-radius ${m[1]} (utiliser var(--ffta-radius-sm|md|card|full))`);
  }

  for (const m of css.matchAll(/max-width:\s*(\d+)px/g)) {
    if (!STANDARD_BP.has(parseInt(m[1], 10))) {
      report('warn', rel, `breakpoint ${m[1]}px hors échelle 560/760/920/1100`);
    }
  }
}

console.log(`\n${errors} erreur(s), ${warnings} avertissement(s) sur ${files.length} fichier(s).`);
process.exit(errors > 0 ? 1 : 0);
