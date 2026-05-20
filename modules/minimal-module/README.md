# Minimal Module Example

This example is intentionally small, but it demonstrates the full expected module shape for `ffta-modules`.

It shows how to:

- declare a `module.manifest.js`,
- register routes and menu entries,
- register i18n namespaces,
- register module settings,
- create a tiny store and ViewModel,
- mount a page in the FFTA shell,
- keep styles scoped to the module.

## Try it locally inside `ffta-modules`

Copy this folder into the runtime modules directory:

```txt
examples/minimal-module
→ modules/minimal-module
```

Then refresh the FFTA Modules page. The PHP autodiscovery will detect:

```txt
modules/minimal-module/module.manifest.js
```

No core import or manual registration should be needed.

## Files to look at first

```txt
module.manifest.js      module identity, routes, styles, capabilities
module.mount.js         module registration entrypoint
application/minimal.vm.js       ViewModel example
application/minimal.store.js    tiny observable store example
ui/pages/MinimalPage.js         page rendering and DOM actions
ui/styles/minimal.css           scoped module CSS
i18n/en.json            English labels
i18n/fr.json            French labels
```

## Rules to keep

- Do not import private core internals.
- Use the public `app` Module API.
- Keep business logic out of UI components.
- Keep CSS scoped under `.minimal-module`.
- Keep user-facing text in i18n files.
