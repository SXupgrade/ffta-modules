/**
 * Public module manifest contract.
 * Keep this contract stable: community modules will rely on it.
 */
export const MODULE_MANIFEST_VERSION = '1.0.0';

export const REQUIRED_MANIFEST_FIELDS = [
  'sdkVersion',
  'id',
  'name',
  'version',
  'entry',
  'runtimeCompatibility'
];

/**
 * @typedef {Object} ModuleManifest
 * @property {string} sdkVersion
 * @property {string} id
 * @property {string} name
 * @property {string} version
 * @property {string} entry
 * @property {string=} routes
 * @property {string[]=} i18n
 * @property {string[]=} styles
 * @property {string[]=} capabilities
 * @property {string[]} runtimeCompatibility
 * @property {Object[]=} settings
 */
