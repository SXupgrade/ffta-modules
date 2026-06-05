const LEVELS = ['debug', 'info', 'warn', 'error'];

export function createLoggerService(adapter = null, dev = null) {
  function canWrite(level, channel = 'runtime') {
    if (!dev?.enabled) {
      return level === 'warn' || level === 'error';
    }
    return dev.shouldLog?.(level, channel) ?? true;
  }

  function write(level, message, data = null, channel = 'runtime') {
    if (!LEVELS.includes(level)) level = 'debug';
    if (!canWrite(level, channel)) return;

    const logger = adapter?.[level] || console[level] || console.log;
    const prefix = dev?.enabled ? `[ffta:${channel}]` : '[ffta]';
    if (data === null || data === undefined) {
      logger.call(console, prefix, message);
      return;
    }
    logger.call(console, prefix, message, data);
  }

  return {
    debug(message, data = null, channel = 'runtime') { write('debug', message, data, channel); },
    info(message, data = null, channel = 'runtime') { write('info', message, data, channel); },
    warn(message, data = null, channel = 'runtime') { write('warn', message, data, channel); },
    error(message, data = null, channel = 'runtime') { write('error', message, data, channel); },
    group(label, channel = 'runtime') {
      if (dev?.shouldLog?.('debug', channel) && console.groupCollapsed) console.groupCollapsed(`[ffta:${channel}] ${label}`);
    },
    groupEnd(channel = 'runtime') {
      if (dev?.shouldLog?.('debug', channel) && console.groupEnd) console.groupEnd();
    }
  };
}
