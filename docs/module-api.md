# Module API

The public API is passed to `mountModule(app)` and is the only interface modules should use.

## Translation

```js
app.t(key, params?)
// app.t('league.title')
// app.t('league.warnings.tooManyRounds', { max: 8 })
```

## i18n

```js
app.i18n.registerNamespace(namespace, { en, fr })
app.i18n.getLocale()       // 'fr'
app.i18n.setLocale('en')
```

## Settings

```js
app.settings.registerSchema(namespace, schemaObject)
await app.settings.get(key, defaultValue?)
await app.settings.set(key, value)
```

## Routes

```js
app.routes.register({ path, labelKey, component })
app.routes.list()
```

## Menu

```js
app.menu.register({ id, label, route })
app.menu.list()
```

## Services

```js
app.services.register(name, service)
app.services.get(name)        // throws if not registered
```

## Notifications

```js
app.notify.success(message)
app.notify.error(message)
app.notify.info(message)
```

## Modal

```js
const modal = app.modal.open({
  id?,      // optional, defaults to a unique id
  title,
  body,     // HTML string
  footer?   // HTML string with buttons
})
modal.close()
modal.el   // HTMLElement
```

## Exports

```js
app.exports.csv(filename, rows)
// rows is an array of plain objects; keys become headers

app.exports.json(filename, data)

app.exports.pdf(filename, documentModel)
// documentModel: { title, groups: [{ groupKey, rows: [{ rank, teamName, totalPoints }] }] }
// Opens a print-ready page in a new browser window
```

## Context

```js
await app.context.getTournament()
// Returns { id, code, name, venue } or null
```

## Runtime

```js
app.runtime.type       // 'ianseo'
app.runtime.language   // 'fr'
```

## Stability contract

This API is stable. Community modules may depend on it.  
Breaking changes require a major `sdkVersion` bump and a migration guide.

Do not import from `core/` directories other than via `app.*`. Internal helpers may change without notice.
