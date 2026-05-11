export function createNotificationService(adapter = null) {
  return {
    success(message) {
      adapter?.success?.(message);
      console.info(message);
    },
    error(message) {
      adapter?.error?.(message);
      console.error(message);
    },
    info(message) {
      adapter?.info?.(message);
      console.info(message);
    }
  };
}
