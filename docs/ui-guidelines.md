# UI Guidelines — harmonisation des modules

Référentiel introduit en v0.2.13. Toute nouvelle UI de module doit respecter ces règles ; `node scripts/lint-ui.cjs` les vérifie.

## Tokens

- **Seule famille autorisée : `--ffta-*`** (`core/ui/styles/tokens.css`). Les familles historiques (`--cp-*`, `--c-*`, `--ffta-border-color`…) sont mappées par des alias de compatibilité — ne plus les utiliser dans du nouveau code, et ne jamais écrire de fallback en dur (`var(--x, #hex)`).
- Couleurs : uniquement via tokens sémantiques (`--ffta-color-primary`, `-muted`, `-border`, `-success/-warning/-error/-info` + `-bg`).
- Accent du module : `var(--ffta-module-accent, var(--ffta-color-primary))`. Cette variable est posée automatiquement sur l'outlet depuis `manifest.navigation.accentColor`. C'est le **seul** vecteur d'identité visuelle par module.
- Rayons : `--ffta-radius-sm | md | card | lg | full`. Pas de px/rem en dur.
- Ombres : `--ffta-shadow-sm | md | lg`.
- Graisses : 400 / 500 / 700 via tokens. Pas de 800/900.

## Structure de page

```
<section class="ffta-page <module>-page">
  ${CpPageHeader({ kicker, title, description, badge })}
  …contenu…
</section>
```

- En-tête : composant `core/ui/components/CpPageHeader.js` (kicker + h1 + description + badge/actions). Ne pas créer de header maison.
- Le kicker utilise `.ffta-kicker` (couleur = accent module).

## Composants canoniques

| Besoin | Composant / classe |
|---|---|
| Bouton | `CpButton` → `cp-btn` (+ `--primary/--secondary/--ghost/--icon`) |
| Carte | `CpCard` → `cp-card` |
| Table | `CpTable` → `cp-table` (+ `--compact`) |
| Modale | `CpModal` |
| Pastille / statut | `ffta-badge` (+ `--success/--warning/--error/--info/--accent/--neutral/--outline`) |
| Chargement | `CpLoader` |
| État vide | `CpEmptyState` |
| Erreur bloquante | `cp-alert cp-alert--danger` (variants `--warning/--info/--success`) |
| Feedback transitoire | `app.notify.success/error` |
| Champ de formulaire | `ffta-form-group` |
| Barre de filtres | `ffta-filter-bar` (contenant des `ffta-form-group`) |

`cp-button` est un alias legacy de `cp-btn` : tout nouveau markup utilise `cp-btn`.

## CSS de module

- **Tout sélecteur est scopé sous `.ffta-modules-shell`** (le module vit dans la page hôte Ianseo).
- Breakpoints autorisés : **560 / 760 / 920 / 1100 px** (max-width).
- Impression : la base commune est dans `core/ui/styles/print.css` (masquage shell/modales/toasts, `@page { margin: 12mm }`). Le module n'ajoute que ses spécificités, sans redéclarer `@page`.

## Checklist avant merge

1. `node scripts/lint-ui.cjs` → 0 erreur, pas de nouvel avertissement.
2. En-tête de page via `CpPageHeader`.
3. Aucun hex, radius, ombre ou breakpoint en dur ajouté.
4. États chargement / vide / erreur couverts par le trio CpLoader / CpEmptyState / cp-alert.
