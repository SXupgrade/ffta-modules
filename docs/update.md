# Update

`ffta-modules` includes a deliberately simple self-update mechanism.

The UI exposes one button:

```txt
[update module]
```

When clicked, it calls:

```txt
POST core/update/update.php?action=install
```

The endpoint downloads the latest GitHub release asset from:

```txt
https://github.com/FFTA/ffta-modules/releases/latest/download/ffta-modules.zip
```

Then it extracts the zip in a temporary directory and copies/overwrites files into the current `Modules/Custom/ffta-modules` directory.

No backup is created by design. If an update breaks the module, reinstall the release zip manually.

The release asset should contain either:

```txt
ffta-modules/
  index.php
  core/
  modules/
```

or the module files directly at the zip root.
