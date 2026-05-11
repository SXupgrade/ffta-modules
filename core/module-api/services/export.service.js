export function createExportService() {
  return {
    csv(filename, rows) {
      // TODO: Implement CSV browser download.
      return { filename, rows };
    },
    xlsx(filename, rows) {
      // TODO: Implement XLSX export if dependency is accepted.
      return { filename, rows };
    },
    pdf(filename, documentModel) {
      // TODO: Implement PDF export for standings.
      return { filename, documentModel };
    }
  };
}
