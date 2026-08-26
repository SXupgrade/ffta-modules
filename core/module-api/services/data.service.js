export function createDataService(adapter = null, acl = null, dev = null, logger = null) {
  if (!adapter?.request) {
    throw new Error('Data adapter must expose request(action, payload).');
  }

  async function request(action, payload = {}, { permission = 'read', moduleId = 'ffta-modules' } = {}) {
    const startedAt = performance.now?.() ?? Date.now();
    if (dev?.isEnabled?.('data')) logger?.debug?.('Data request started', { action, payload, permission, moduleId }, 'data');

    if (permission === 'write' && acl && !(await acl.canWrite(moduleId))) {
      const error = new Error('Write access denied for this module.');
      if (dev?.isEnabled?.('data')) logger?.warn?.('Data request denied', { action, permission, moduleId }, 'data');
      throw error;
    }
    if (permission !== 'write' && acl && !(await acl.canRead(moduleId))) {
      const error = new Error('Read access denied for this module.');
      if (dev?.isEnabled?.('data')) logger?.warn?.('Data request denied', { action, permission, moduleId }, 'data');
      throw error;
    }

    try {
      const result = await adapter.request(action, payload);
      if (dev?.isEnabled?.('data')) {
        const durationMs = Math.round(((performance.now?.() ?? Date.now()) - startedAt) * 10) / 10;
        logger?.debug?.('Data request completed', { action, durationMs, result }, 'data');
      }
      return result;
    } catch (error) {
      if (dev?.isEnabled?.('data')) logger?.error?.('Data request failed', { action, error }, 'data');
      throw error;
    }
  }

  return {
    request,
    tournament: {
      getCurrent(options = {}) {
        return request('getCurrentTournament', {}, options);
      }
    },
    context: {
      getTournament(options = {}) {
        return request('getCurrentTournament', {}, options);
      },
      getCurrentUser(options = {}) {
        return request('getCurrentUser', {}, options);
      }
    },
    entries: {
      list(filters = {}, options = {}) {
        return request('listEntries', filters, options);
      },
      get(entryId, options = {}) {
        return request('getEntry', { entryId }, options);
      }
    },
    scores: {
      listQualificationScores(filters = {}, options = {}) {
        return request('readQualificationScores', filters, options);
      },
      readQualificationScores(filters = {}, options = {}) {
        return request('readQualificationScores', filters, options);
      },
      getQualificationScore(entryId, options = {}) {
        return request('getQualificationScore', { entryId }, options);
      },
      saveQualificationScore(score, options = {}) {
        return request('writeQualificationScore', score, { ...options, permission: 'write' });
      },
      writeQualificationScore(score, options = {}) {
        return request('writeQualificationScore', score, { ...options, permission: 'write' });
      },
      recalculateQualificationRanking(filters = {}, options = {}) {
        return request('recalculateQualificationRanking', filters, { ...options, permission: 'write' });
      }
    },
    targets: {
      list(filters = {}, options = {}) {
        return request('listTargets', filters, options);
      },
      assign(payload = {}, options = {}) {
        return request('assignTarget', payload, { ...options, permission: 'write' });
      },
      unassign(payload = {}, options = {}) {
        return request('unassignTarget', payload, { ...options, permission: 'write' });
      }
    },
    officials: {
      list(filters = {}, options = {}) {
        return request('listOfficials', filters, options);
      }
    },
    clubs: {
      list(filters = {}, options = {}) {
        return request('listClubs', filters, options);
      }
    },
    divisions: {
      list(filters = {}, options = {}) {
        return request('listDivisions', filters, options);
      }
    },
    classes: {
      list(filters = {}, options = {}) {
        return request('listClasses', filters, options);
      }
    },
    records: {
      getDashboard(options = {}) {
        return request('getRecordsDashboard', {}, options);
      },
      saveMonitoredRecord(input = {}, options = {}) {
        return request('saveMonitoredRecord', input, { ...options, permission: 'write' });
      },
      saveRecord(payload = {}, options = {}) {
        return request('saveRecord', payload, { ...options, permission: 'write' });
      },
      importRecords(payload = {}, options = {}) {
        return request('importRecords', payload, { ...options, permission: 'write' });
      },
      activateTournamentRecords(payload = {}, options = {}) {
        return request('activateTournamentRecords', payload, { ...options, permission: 'write' });
      },
      saveRecordArea(input = {}, options = {}) {
        return request('saveRecordArea', input, { ...options, permission: 'write' });
      },
      deleteRecordArea(input = {}, options = {}) {
        return request('deleteRecordArea', input, { ...options, permission: 'write' });
      },
      syncTournamentRecordAreas(payload = {}, options = {}) {
        return request('syncTournamentRecordAreas', payload, { ...options, permission: 'write' });
      },
      updateGlobalRecordsFromBroken(options = {}) {
        return request('updateGlobalRecordsFromBroken', {}, { ...options, permission: 'write' });
      },
      checkBrokenRecords(options = {}) {
        return request('checkBrokenRecords', {}, { ...options, permission: 'write' });
      }
    }
  };
}
