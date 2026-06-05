export const wikiSections = [
  {
    id: 'overview',
    titleKey: 'developer-wiki.sections.overview',
    title: 'Overview',
    level: 'beginner',
    body: [
      'This wiki explains how to create an FFTA module from zero, test it in the Lab, and certify it before trying it inside a real Ianseo installation.',
      'There are two supported development paths: a simple manifest-first module for small pages and a full MVVM module for business-heavy features.',
      'Golden rule: all variables, functions, comments and default UI texts must be written in English. UI labels should go through i18n keys whenever possible.'
    ],
    checklist: [
      'Start in the Lab, not in Ianseo.',
      'Use SDK helpers instead of direct fetch calls whenever possible.',
      'Declare ACL access in the manifest.',
      'Run certification before packaging the module.'
    ]
  },
  {
    id: 'simple',
    titleKey: 'developer-wiki.sections.simple',
    title: 'Create a simple module',
    level: 'beginner',
    body: [
      'A simple module is the fastest way to expose a small feature. It is ideal for read-only reports, basic tools, simple exports, and small write actions.',
      'The module is mainly driven by module.manifest.js. The SDK creates the menu entry, page layout, action buttons, permission handling and data calls.'
    ],
    steps: [
      'Create a folder under modules/my-simple-module or examples/my-simple-module.',
      'Create module.manifest.js with type: simple.',
      'Declare access.read and access.write in the manifest.',
      'Add i18n/en.json and i18n/fr.json.',
      'Add one read action using app.data.scores.readQualificationScores.',
      'Add one write action using app.data.scores.saveQualificationScore or a dedicated SDK method.',
      'Register the module in lab/index.html while developing.',
      'Open the Lab and test admin, read-only and no-access profiles.',
      'Run certification.'
    ],
    code: `export default {\n  sdkVersion: '1.1.0',\n  type: 'simple',\n  id: 'qualification-score-viewer',\n  name: 'Qualification Score Viewer',\n  version: '0.1.0',\n  description: 'Simple module showing and updating qualification scores.',\n  i18n: ['./i18n/en.json', './i18n/fr.json'],\n  capabilities: ['i18n', 'data:qualification-scores'],\n  runtimeCompatibility: ['ianseo', 'lab'],\n  access: {\n    acl: 'AclModules',\n    subFeature: 'qualificationScoreViewer',\n    read: 'AclReadOnly',\n    write: 'AclReadWrite'\n  },\n  page: {\n    titleKey: 'qualification-score-viewer.title',\n    descriptionKey: 'qualification-score-viewer.description',\n    actions: [\n      {\n        id: 'readScores',\n        labelKey: 'qualification-score-viewer.actions.readScores',\n        permission: 'read',\n        handler: {\n          service: 'scores',\n          method: 'readQualificationScores',\n          payload: { session: 1 }\n        }\n      },\n      {\n        id: 'saveScore',\n        labelKey: 'qualification-score-viewer.actions.saveScore',\n        permission: 'write',\n        handler: {\n          service: 'scores',\n          method: 'saveQualificationScore',\n          payload: { entryId: 101, distance: 1, end: 1, arrows: [10, 9, 9] }\n        }\n      }\n    ]\n  }\n};`
  },
  {
    id: 'mvvm',
    titleKey: 'developer-wiki.sections.mvvm',
    title: 'Create an MVVM module',
    level: 'guided',
    body: [
      'Use MVVM when the module has real state, several screens, complex interactions, validation rules or data transformations.',
      'The recommended file names are feature.vm.js, feature.store.js and FeatureComponent.js. Keep business logic away from DOM rendering.'
    ],
    steps: [
      'Create modules/qualification-score-editor.',
      'Create module.manifest.js, module.routes.js and module.mount.js.',
      'Create application/qualification-score.store.js.',
      'Create application/qualification-score.vm.js.',
      'Create repositories/ianseo/IanseoQualificationScoreRepository.js.',
      'Create ui/pages/QualificationScorePage.js.',
      'Register the VM in module.mount.js with app.services.register.',
      'Use app.data.scores methods inside the repository.',
      'Respect readonly mode in the VM and UI.',
      'Test in Lab with generated competitions and certification.'
    ],
    code: `export function createQualificationScoreViewModel({ app, store, repository }) {\n  async function loadScores() {\n    store.setState({ loading: true, error: null });\n    try {\n      const scores = await repository.listQualificationScores({ session: 1 });\n      store.setState({ scores, loading: false });\n    } catch (error) {\n      store.setState({ error: error.message, loading: false });\n    }\n  }\n\n  async function saveScore({ entryId, distance, end, arrows }) {\n    if (!app.acl.canWrite('qualification-score-editor')) {\n      app.notify.error(app.t('app.acl.writeDenied'));\n      return;\n    }\n\n    await repository.saveQualificationScore({ entryId, distance, end, arrows });\n    app.notify.success(app.t('qualification-score-editor.messages.saved'));\n    await loadScores();\n  }\n\n  return {\n    subscribe: store.subscribe,\n    getState: store.getState,\n    loadScores,\n    saveScore\n  };\n}`
  },
  {
    id: 'lab',
    titleKey: 'developer-wiki.sections.lab',
    title: 'Test in the Lab',
    level: 'required',
    body: [
      'The Lab is the safe place to break things. It provides mock Ianseo context, ACL profiles, API modes, generated competitions, theme switches and device frames.',
      'Use generated competitions to test empty, small and large datasets before touching a real tournament.'
    ],
    steps: [
      'Run cd lab && npm install && npm run dev.',
      'Add your module to lab/index.html window.__FFTA_MODULES__.',
      'Select Admin and verify all actions are available.',
      'Select Read only and verify write buttons are disabled or blocked.',
      'Select No access and verify the module is hidden.',
      'Generate competitions with 10, 100 and 500 archers.',
      'Switch API mode to slow, error and offline.',
      'Switch language and theme.',
      'Check the browser console. No uncontrolled error should remain.'
    ],
    code: `window.__FFTA_MODULES__ = [\n  {\n    id: 'qualification-score-editor',\n    manifestPath: '../modules/qualification-score-editor/module.manifest.js',\n    basePath: '../modules/qualification-score-editor/'\n  }\n];`
  },
  {
    id: 'certification',
    titleKey: 'developer-wiki.sections.certification',
    title: 'Run module certification',
    level: 'required',
    body: [
      'Certification is not magic, but it catches the boring mistakes before they become production gremlins.',
      'A module should not be released if manifest, i18n, ACL, readonly behavior or runtime compatibility checks fail.'
    ],
    checklist: [
      'Manifest is valid.',
      'Module has id, name, version and description.',
      'ACL is declared.',
      'i18n files exist and keys are consistent.',
      'No write action runs in readonly mode.',
      'Module works in generated data scenarios.',
      'No console errors during normal use.',
      'Mobile frame remains usable.'
    ]
  },
  {
    id: 'ai',
    titleKey: 'developer-wiki.sections.ai',
    title: 'AI-friendly prompts',
    level: 'assistant',
    body: [
      'Give the AI a small, strict mission. Ask for one module at a time. Require English code and i18n keys. Require Lab tests and certification notes.',
      'Do not ask for a vague “finish the module”. Ask for concrete files and acceptance criteria.'
    ],
    code: `Create a new FFTA Modules SDK module named qualification-score-editor.\n\nConstraints:\n- Use MVVM.\n- Use English variable names and comments.\n- Use i18n keys for UI labels.\n- Use app.data.scores.readQualificationScores for reading.\n- Use app.data.scores.saveQualificationScore for writing.\n- Respect app.acl readonly/write permissions.\n- Add the module to the Lab module list.\n- Add or update certification notes.\n\nAcceptance criteria:\n- Works in Lab admin profile.\n- Write actions are disabled in readonly profile.\n- Module is hidden in no-access profile.\n- Certification passes without critical errors.`
  },
  {
    id: 'checklists',
    titleKey: 'developer-wiki.sections.checklists',
    title: 'Release checklist',
    level: 'release',
    checklist: [
      'Run node --check on every changed JS file.',
      'Run php -l on every changed PHP file.',
      'Open the Lab and test all ACL profiles.',
      'Run generated competitions at multiple sizes.',
      'Run certification.',
      'Update PATCH_NOTES.md.',
      'Only then test inside a real Ianseo installation.'
    ]
  }
];
