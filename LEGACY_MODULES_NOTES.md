# Legacy modules integration notes

This build imports the modules found in `IanseoModules-main/Modules/Custom` as wrapped legacy modules:

- `bslt` from `Bslt`
- `plan-qualifs` from `PlanQualifs`
- `plan-finales` from `PlanFinales`
- `prints` from `Prints`

Each imported module is stored under:

```txt
modules/<module-id>/legacy/
```

and is exposed to the `ffta-modules` loader through:

```txt
module.manifest.js
module.mount.js
module.routes.js
i18n/en.json
i18n/fr.json
ui/pages/*Page.js
```

The legacy PHP files were path-adjusted for the new installation root:

```txt
Modules/Custom/ffta-modules/modules/<module-id>/legacy/
```

They still reuse the Ianseo shell and runtime when opened in the iframe or in a separate tab.

This is intentionally a compatibility wrapper, not a full rewrite. Future work can progressively migrate useful legacy modules to native MVVM modules.
