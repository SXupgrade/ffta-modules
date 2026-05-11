export function createSettingsService(adapter) {
  const schemas = new Map();

  return {
    registerSchema(namespace, schema) {
      schemas.set(namespace, schema);
    },
    async get(key, fallbackValue = null) {
      const value = await adapter.get(key);
      return value ?? fallbackValue;
    },
    async set(key, value) {
      return adapter.set(key, value);
    },
    getSchemas() {
      return Object.fromEntries(schemas.entries());
    }
  };
}
