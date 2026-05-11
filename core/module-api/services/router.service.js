export function createRouterService() {
  const entries = [];
  return {
    register(entry) {
      entries.push(entry);
    },
    list() {
      return [...entries];
    }
  };
}
