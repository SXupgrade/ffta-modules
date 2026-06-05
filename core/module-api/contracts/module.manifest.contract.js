/**
 * Public module manifest contract.
 * Keep this contract stable: community modules will rely on it.
 */
export const MODULE_MANIFEST_VERSION = '1.1.0';

export const REQUIRED_MANIFEST_FIELDS = [
  'sdkVersion',
  'id',
  'name',
  'version',
  'runtimeCompatibility'
];

/**
 * @typedef {Object} ModuleManifest
 * @property {string} sdkVersion
 * @property {string} id
 * @property {string} name
 * @property {string} version
 * @property {'legacy'|'mvvm'|'simple'=} type
 * @property {string=} entry
 * @property {string=} routes
 * @property {string[]=} i18n
 * @property {string[]=} styles
 * @property {string[]=} capabilities
 * @property {string[]} runtimeCompatibility
 * @property {Object[]=} settings
 * @property {{accentColor?: string}=} navigation
 * @property {{acl?: string, feature?: string, subFeature?: string, read?: string, write?: string, levels?: {read?: string, write?: string}}=} access
 * @property {{titleKey?: string, descriptionKey?: string, actions?: Object[]}=} page
 */
