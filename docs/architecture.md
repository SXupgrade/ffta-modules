# Architecture

`ffta-modules` is a lightweight module platform intended to run inside an existing Ianseo installation.

## Installation path

```txt
Modules/Custom/ffta-modules
```

## Layers

```txt
core/      Public module platform and Ianseo runtime adapters
modules/   Community modules
league/    Reference module: Team Championship / Championnat par équipe
```

## MVVM rules

```txt
domain/       Pure business logic, no UI, no fetch, no SQL
repositories/ Data access and mapping to domain contracts
application/  Stores, view-models and use cases
ui/           Rendering only
```

## Runtime rules

The standalone runtime is `ianseo`.

The module platform must reuse:

- Ianseo config
- Ianseo database connection
- Ianseo session/auth context
- Ianseo language if available
- Ianseo tournament context if available

The module platform must not ask for database credentials.

## Compatibility strategy

Compet+ compatibility is achieved by contracts, not by importing Compet+ code.
