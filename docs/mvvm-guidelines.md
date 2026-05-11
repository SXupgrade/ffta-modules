# MVVM Guidelines

## Layer responsibilities

### `domain/`
- Pure functions — no side effects, no I/O.
- Takes plain objects as input, returns plain objects.
- Fully testable with simple fixtures.
- No `fetch`, no DOM access, no SQL, no `app` context.

### `repositories/`
- Data access: reads from and writes to the runtime (Ianseo DB, localStorage, etc.).
- Maps raw data rows to the domain contract format.
- Never performs calculations — only maps.
- No UI logic.

### `application/`
- **Store**: holds mutable UI state (`isLoading`, `standings`, `warnings`, etc.).
- **ViewModel**: orchestrates use cases; exposes actions to the UI.
- **Use cases**: single-responsibility async functions that call repositories and domain functions, then update the store.

### `ui/`
- Components receive state props and return HTML strings.
- Pages subscribe to the store and re-render on state changes.
- Event handling uses `data-action` attributes and `addEventListener` delegation.
- No direct fetch/SQL calls.

## Data flow

```
User action (click)
  → UI event listener
    → ViewModel.action()
      → Use case
        → Repository.getData()      (async, server)
        → Domain.calculate(data)    (sync, pure)
        → Store.setState(result)    (sync)
          → UI re-renders
```

Forbidden:
- UI directly calling SQL or `fetch`.
- Domain importing runtime adapters.
- Domain reading settings from persistence.
- ViewModel importing from `ui/`.

## Example use case

```js
// application/useCases/loadMyData.js
export async function loadMyData({ app, store, repository, calculator }) {
  store.setLoading(true);
  try {
    const input  = await repository.getInput();
    const result = calculator.calculate(input);
    store.setData(result.data);
    store.setWarnings(result.warnings);
  } catch (error) {
    store.setError(error);
    app.notify.error(app.t('my-module.errors.loadFailed'));
  } finally {
    store.setLoading(false);
  }
}
```

## Store subscribe pattern

```js
const store = createMyStore();
store.subscribe(() => {
  root.innerHTML = MyPage({ state: store.state, app });
});
```

## UI component conventions

```js
// Components return HTML strings.
export function MyComponent({ items = [], app } = {}) {
  return `<ul>${items.map((i) => `<li>${escapeHtml(i.name)}</li>`).join('')}</ul>`;
}
```

Always `escapeHtml()` values from external data to prevent XSS.
