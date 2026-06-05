export default {
  sdkVersion: '1.2.0',
  id: 'my-readonly-module',
  name: 'My Read-only Module',
  version: '0.1.0',
  type: 'simple',
  runtimeCompatibility: ['ianseo', 'lab'],
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  access: {
    acl: 'AclModules',
    subFeature: 'myReadonlyModule',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  page: {
    titleKey: 'my-readonly-module.title',
    descriptionKey: 'my-readonly-module.description',
    actions: [
      {
        id: 'listEntries',
        labelKey: 'my-readonly-module.actions.listEntries',
        permission: 'read',
        handler: { service: 'entries', method: 'list', payload: { session: 1 } }
      }
    ]
  }
};
