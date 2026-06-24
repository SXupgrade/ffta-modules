# Simple Menu

Simple Menu is an experimental FFTA Modules navigation policy module for Ianseo.

It is disabled by default because its purpose is to reorganize the native Ianseo navbar.
Enable it from **FFTA Modules > Settings**, then reload Ianseo.

## What it does

- Keeps Ianseo core files untouched.
- Adds a module-level Ianseo menu hook: `modules/simple-menu/ianseo-menu.php`.
- Uses `profiles/ffta-beginner.json` to rebuild the navbar.
- Keeps a fallback **Menu expert** with the native Ianseo menu structure.

## Important

This patch also updates `ffta-modules/menu.php` so the launcher can include module menu hooks.
Without that root hook, nested modules cannot affect the native Ianseo navbar.
