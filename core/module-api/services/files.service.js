export function createFilesService() {
  return {
    downloadText(filename, content, mimeType = 'text/plain;charset=utf-8') {
      triggerDownload(filename, mimeType, String(content ?? ''));
    },
    downloadJson(filename, data) {
      triggerDownload(filename, 'application/json;charset=utf-8', JSON.stringify(data, null, 2));
    },
    async readTextFile(file) {
      if (!file) throw new Error('No file provided.');
      return file.text();
    },
    async readJsonFile(file) {
      const text = await this.readTextFile(file);
      return JSON.parse(text);
    }
  };
}

function triggerDownload(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || 'download.txt';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
