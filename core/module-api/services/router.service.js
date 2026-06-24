export function createRouterService() {
  const entries = [];
  return {
    register(entry) {
      if (!entry) return;
      const index = entries.findIndex((current) => {
        if (entry.id && current.id) return current.id === entry.id;
        if (entry.route && current.route) return current.route === entry.route;
        return false;
      });
      if (index >= 0) {
        entries[index] = { ...entries[index], ...entry };
        return;
      }
      entries.push(entry);
    },
    list() {
      return [...entries];
    }
  };
}
