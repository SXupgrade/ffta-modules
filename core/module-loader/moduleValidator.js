import { REQUIRED_MANIFEST_FIELDS } from '../module-api/contracts/module.manifest.contract.js';

export function validateModuleManifest(manifest) {
  const errors = [];

  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (!manifest || manifest[field] === undefined || manifest[field] === null || manifest[field] === '') {
      errors.push(`Missing manifest field: ${field}`);
    }
  }

  if (manifest?.id && !/^[a-z0-9][a-z0-9-]*$/.test(manifest.id)) {
    errors.push('Manifest id must be kebab-case lowercase.');
  }

  if (manifest?.runtimeCompatibility && !Array.isArray(manifest.runtimeCompatibility)) {
    errors.push('runtimeCompatibility must be an array.');
  }

  return {
    ok: errors.length === 0,
    errors
  };
}
