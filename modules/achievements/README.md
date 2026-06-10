# Achievements

Organizer achievements proof of concept for FFTA Modules and Compet+.

The module is intentionally focused on organizers, not archers. It turns software usage into a gamified checklist: create a competition, import archers, assign targets, enter scores, generate exports, activate live data, create backups, and so on.

## Modes

- **Database scan mode**: FFTA Modules reads the current Ianseo/Compet+ data through the SDK and recalculates achievements quickly.
- **Event-driven mode**: Compet+ will emit domain events such as `export.federal.generated`, `record.broken`, `finals.team.started` or `backup.created`.

## MVP notes

This version is a PoC. It does not create new Ianseo tables and stores demo events in local storage only.
