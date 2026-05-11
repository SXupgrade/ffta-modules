# MVVM guidelines

- Views render state and emit user actions.
- ViewModels orchestrate use cases and expose state.
- Stores own mutable module state.
- Repositories fetch and persist data.
- Domain functions calculate and validate data.

Forbidden:

- UI directly calling SQL.
- UI directly calling `fetch`.
- Domain importing runtime adapters.
- Domain reading settings from persistence.
