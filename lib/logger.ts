/**
 * Application Logger
 * Tracks errors, warnings, and important events
 */

interface LogEntry {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
  context?: Record<string, any>;
  stack?: string;
}

const logs: LogEntry[] = [];
const MAX_LOGS = 1000;

export const logger = {
  error: (message: string, context?: Record<string, any>, error?: Error) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      context,
      stack: error?.stack,
    };
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.shift();
    console.error(`❌ [ERROR] ${message}`, context, error);
  },

  warn: (message: string, context?: Record<string, any>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      context,
    };
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.shift();
    console.warn(`⚠️ [WARN] ${message}`, context);
  },

  info: (message: string, context?: Record<string, any>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      context,
    };
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.shift();
    console.log(`ℹ️ [INFO] ${message}`, context);
  },

  debug: (message: string, context?: Record<string, any>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message,
      context,
    };
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.shift();
    console.log(`🔍 [DEBUG] ${message}`, context);
  },

  getLogs: (filter?: { level?: string; limit?: number }) => {
    let result = [...logs];
    
    if (filter?.level) {
      result = result.filter(log => log.level === filter.level);
    }
    
    if (filter?.limit) {
      result = result.slice(-filter.limit);
    }
    
    return result;
  },

  exportLogs: () => {
    return JSON.stringify(logs, null, 2);
  },

  clearLogs: () => {
    logs.length = 0;
  },

  getStats: () => {
    return {
      totalLogs: logs.length,
      errors: logs.filter(l => l.level === 'ERROR').length,
      warnings: logs.filter(l => l.level === 'WARN').length,
      info: logs.filter(l => l.level === 'INFO').length,
      debug: logs.filter(l => l.level === 'DEBUG').length,
    };
  },
};

// Export logs to window object for browser access
if (typeof window !== 'undefined') {
  (window as any).appLogs = logger;
}
