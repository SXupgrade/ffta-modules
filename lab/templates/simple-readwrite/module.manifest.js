export default {
  sdkVersion: '1.2.0',
  id: 'my-score-tool',
  name: 'My Score Tool',
  version: '0.1.0',
  type: 'simple',
  runtimeCompatibility: ['ianseo', 'lab'],
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  access: {
    acl: 'AclModules',
    subFeature: 'myScoreTool',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  page: {
    titleKey: 'my-score-tool.title',
    descriptionKey: 'my-score-tool.description',
    actions: [
      {
        id: 'readScores',
        labelKey: 'my-score-tool.actions.readScores',
        permission: 'read',
        handler: { service: 'scores', method: 'listQualificationScores', payload: { session: 1 } }
      },
      {
        id: 'saveScore',
        labelKey: 'my-score-tool.actions.saveScore',
        permission: 'write',
        handler: { service: 'scores', method: 'saveQualificationScore', payload: { quId: 101, score: 315 } }
      }
    ]
  }
};
