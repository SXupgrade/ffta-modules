export function createIanseoServices({ data, runtime }) {
  const rootUrl = runtime?.ianseo?.rootUrl || '../../../';

  function resolveUrl(path = '') {
    if (/^(https?:)?\/\//i.test(path)) return path;
    if (path.startsWith('./') || path.startsWith('../')) return path;
    return rootUrl.replace(/\/$/, '/') + String(path).replace(/^\/+/, '');
  }

  const prints = {
    async listPrintouts(payload = {}) {
      return data.request('ianseo.prints.list', payload);
    },
    resolveUrl,
    open(printout, params = {}) {
      if (!printout?.path) return;
      const url = new URL(resolveUrl(printout.path), window.location.href);
      const query = { ...(printout.params || {}), ...params };
      for (const [key, value] of Object.entries(query)) {
        if (value === null || value === undefined || value === '') continue;
        if (Array.isArray(value)) {
          for (const item of value) url.searchParams.append(key, item);
        } else {
          url.searchParams.set(key, value);
        }
      }
      window.open(url.href, printout.target || 'PrintOut');
    }
  };

  return {
    rootUrl,
    resolveUrl,
    prints
  };
}
