export default {
  sdkVersion: '1.0.0',
  id: 'simple-menu',
  type: 'simple',
  audience: 'configuration',
  name: 'Simple Menu',
  version: '0.1.5',
  description: 'Reorganizes the native Ianseo menu into a simpler workflow with selectable profiles.',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/simple-menu.css'],
  capabilities: ['settings', 'i18n', 'routing', 'ianseo-menu'],
  runtimeCompatibility: ['ianseo'],
  navigation: { accentColor: '#2563eb', order: 95 },
  page: {
    titleKey: 'simpleMenu.nav.title',
    descriptionKey: 'simpleMenu.description',
    index: './ui/pages/SimpleMenuPage.js'
  },
  creator: {
    name: 'FFTA Modules',
    role: 'Navigation profile integration'
  },
  thanks: [
    'Ianseo community',
    'FFTA field users and trainers'
  ],
  contributors: []
};
