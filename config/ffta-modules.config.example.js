/**
 * Example development configuration.
 * Copy values into ffta-modules.config.js while developing locally.
 */
export default {
  devMode: true,
  logLevel: 'debug',
  exposeGlobal: true,
  showBadge: true,
  logs: {
    runtime: true,
    modules: true,
    acl: true,
    data: true,
    api: true,
    i18n: false
  }
};
