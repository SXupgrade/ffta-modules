# Adapters

Adapters isolate runtime details.

The Ianseo adapter must discover and reuse Ianseo's own mechanisms for:

- bootstrap/config include
- database access
- current session/user
- current tournament
- language
- ModulesParameters storage

Do not duplicate Ianseo configuration.
