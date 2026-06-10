export function createPrintsAdapterViewModel({ app, store }) {
  async function load() {
    store.setState({ isLoading: true, error: '' });
    try {
      const data = await app.ianseo.prints.listPrintouts();
      const numDistances = Number(data?.context?.numDistances || 1);
      store.setState({
        data,
        isLoading: false,
        scorecardForm: {
          ...store.getState().scorecardForm,
          distances: Array.from({ length: Math.max(1, numDistances) }, (_, index) => String(index + 1))
        }
      });
    } catch (error) {
      store.setState({ isLoading: false, error: error.message || String(error) });
    }
  }

  function toggleSection(sectionId) {
    const current = new Set(store.getState().collapsedSections || []);
    if (current.has(sectionId)) current.delete(sectionId);
    else current.add(sectionId);
    store.setState({ collapsedSections: current });
  }

  function updateScorecardForm(patch) {
    store.setState({ scorecardForm: { ...store.getState().scorecardForm, ...patch } });
  }

  function openPrintout(printout) {
    app.ianseo.prints.open(printout);
  }

  function submitScorecards(section, mode) {
    const form = store.getState().scorecardForm;
    const params = {
      chk_BlockAutoSave: '1',
      ScorePageHeaderFooter: '1',
      ScoreFlags: '1',
      ScoreHeader: section.isBeursault ? '1' : '',
      ScoreLogos: section.isBeursault ? '1' : '',
      x_Session: form.session,
      x_From: form.from,
      x_To: form.to,
      noEmpty: form.noEmpty ? '1' : '',
      ScoreDraw: mode.draw,
      ScoreBarcode: mode.barcode ? '1' : '',
      PersonalScore: mode.personalScore ? '1' : '',
      ScoreFilled: mode.filled ? '1' : ''
    };
    const url = new URL(app.ianseo.prints.resolveUrl(section.path), window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '') url.searchParams.set(key, value);
    });
    for (const distance of form.distances || []) {
      url.searchParams.append('ScoreDist[]', distance);
    }
    window.open(url.href, 'PrintOut');
  }

  return {
    get state() {
      return store.getState();
    },
    load,
    toggleSection,
    updateScorecardForm,
    openPrintout,
    submitScorecards
  };
}
