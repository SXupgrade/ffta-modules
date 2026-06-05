export default {
  sdkVersion: '1.2.0',
  type: 'simple',
  id: 'simple-scores',
  name: 'Simple Scores',
  version: '0.2.10',
  author: 'Compet+',
  license: 'MIT',
  website: 'https://competplus.fr',
  description: 'Simple module example: list, edit and recalculate qualification scores with ACL read/write checks.',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  capabilities: ['i18n', 'data:qualification-scores', 'data:qualification-ranking'],
  runtimeCompatibility: ['ianseo', 'lab'],
  access: {
    acl: 'AclModules',
    subFeature: 'simpleScores',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  navigation: { accentColor: '#0f766e' },
  page: {
    titleKey: 'simple-scores.title',
    descriptionKey: 'simple-scores.description',
    index: './index.js'
  }
};
