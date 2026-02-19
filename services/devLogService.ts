
// services/devLogService.ts - v4.12 - Enhanced Audit Logging
export type LogType = 'system' | 'security' | 'audit' | 'error';
export type LogLevel = 'info' | 'warn' | 'critical';

export interface DevLogEntry {
  timestamp: string;
  type: LogType;
  level: LogLevel;
  action: string;      // Operation name or User Prompt
  details: string;     // Result details or AI Summary
}

export interface DevLog {
  version: number;
  entries: DevLogEntry[];
}

const DEV_LOG_STORAGE_KEY = 'devLog_v1';
const DEV_LOG_VERSION = 2; // Incremented for structure update

/**
 * Retrieves all development logs from localStorage.
 * Handles migration from v1 to v2 structure on read.
 */
export const getLogs = (): DevLog => {
  try {
    const data = localStorage.getItem(DEV_LOG_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      
      // Auto-migration for legacy logs
      if (parsed.version === 1 || !parsed.entries[0]?.type) {
          const migratedEntries = parsed.entries.map((e: any) => ({
              timestamp: e.timestamp,
              type: 'system',
              level: 'info',
              action: e.userPrompt || 'Unknown Action',
              details: e.aiSummary || 'Legacy Log Entry'
          }));
          return { version: DEV_LOG_VERSION, entries: migratedEntries };
      }
      
      return parsed;
    }
  } catch (error) {
    console.error("Failed to get dev logs from localStorage", error);
  }
  return { version: DEV_LOG_VERSION, entries: [] };
};

/**
 * Saves a DevLog object to localStorage.
 */
export const saveLogs = (logs: DevLog): void => {
  try {
    localStorage.setItem(DEV_LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Failed to save dev logs to localStorage", error);
  }
};

/**
 * Adds a new entry to the development/audit log.
 * Supports both legacy signature (for backward compatibility) and new object signature.
 */
export const addLogEntry = (
    input: { userPrompt: string, aiSummary: string } | { type: LogType, level: LogLevel, action: string, details: string }
): void => {
  const logs = getLogs();
  let newEntry: DevLogEntry;

  if ('userPrompt' in input) {
      // Legacy compatibility
      newEntry = {
          timestamp: new Date().toISOString(),
          type: 'system',
          level: 'info',
          action: input.userPrompt,
          details: input.aiSummary
      };
  } else {
      // New Audit Format
      newEntry = {
          timestamp: new Date().toISOString(),
          type: input.type,
          level: input.level,
          action: input.action,
          details: input.details
      };
  }

  logs.entries.push(newEntry);
  
  // Limit log size to prevent storage overflow (keep last 500)
  if (logs.entries.length > 500) {
      logs.entries = logs.entries.slice(logs.entries.length - 500);
  }
  
  saveLogs(logs);
};

/**
 * Clears all development logs from localStorage.
 */
export const clearLogs = (): void => {
  try {
    localStorage.removeItem(DEV_LOG_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear dev logs from localStorage", error);
  }
};
