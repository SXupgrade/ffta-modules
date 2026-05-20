# Runtime System

## What is a runtime?

A runtime is the host environment that provides database access, session context, language detection, tournament context, and settings storage.

## Supported runtimes

| Runtime ID | Description |
|---|---|
| `ianseo` | Standalone Ianseo installation at `Modules/Custom/ffta-modules` |

## Runtime context shape

```js
{
  type: 'ianseo',           // string identifier used for compatibility checks
  language: 'fr',           // two-letter language code
  adapters: {
    settings: {             // read/write settings
      get(key): Promise<any>,
      set(key, value): Promise<void>
    },
    notifications: null,    // optional override; null = use built-in toast
    tournament: {
      getTournament(): Promise<{ id, code, name, venue } | null>
    }
  }
}
```

## Ianseo runtime

`core/adapters/ianseo/runtime/createIanseoRuntime.js`

The Ianseo runtime:
1. Detects language from Ianseo `SelectLanguage()` injected by `index.php`, then from the `UseLanguage` cookie, then from `navigator.language`.
2. Wires `settings` adapter to `api/settings.php` (backed by `ModulesParameters`).
3. Wires `tournament` adapter to `api/context.php` (backed by `$_SESSION['TourId']`).

## Module compatibility check

Before mounting, `runtimeResolver.js` verifies that the current runtime type is listed in `manifest.runtimeCompatibility`. A module listing only `['ianseo']` refuses to mount in any other runtime, preventing silent failures.

## No tournament? No crash.

If `api/context.php` returns `null` (no active tournament in session), the runtime sets `tournament: null`. The UI displays an empty state rather than throwing.

## Future runtimes

Future compatibility targets can implement the same contracts outside this repository:

```
competplus-web
competplus-desktop
```

Modules declare the runtimes they support. The platform checks compatibility at load time.
