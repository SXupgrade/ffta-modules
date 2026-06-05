/**
 * FFTA Modules runtime configuration.
 *
 * This file is intentionally plain JavaScript so it can be edited directly
 * after deploying the module in Ianseo. Keep devMode disabled in production.
 */
export default {
  devMode: false,
  logLevel: 'warn',
  exposeGlobal: false,
  showBadge: false,
  logs: {
    runtime: false,
    modules: false,
    acl: false,
    data: false,
    api: false,
    i18n: false
  }
};
