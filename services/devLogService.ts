
// services/devLogService.ts - v4.55 - IndexedDB Support
import { dbService, STORES } from './db';
import { LogType, LogLevel, DevLogEntry } from '../types';

export type { LogType, LogLevel, DevLogEntry };

export interface DevLog {
  version: number;
  entries: DevLogEntry[];
}

const DEV_LOG_VERSION = 2;

/**
 * Retrieves all development logs from IndexedDB.
 */
export const getLogs = async (): Promise<DevLog> => {
  try {
    const entries = await dbService.getAll<DevLogEntry>(STORES.LOGS);
    return { version: DEV_LOG_VERSION, entries };
  } catch (error) {
    console.error("Failed to get dev logs", error);
    return { version: DEV_LOG_VERSION, entries: [] };
  }
};

/**
 * Adds a new entry to the development/audit log.
 * Now Async.
 */
export const addLogEntry = async (
    input: { userPrompt: string, aiSummary: string } | { type: LogType, level: LogLevel, action: string, details: string }
): Promise<void> => {
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

  try {
      // Auto-pruning logic could be added here if DB gets too large, 
      // but IndexedDB handles large data well.
      await dbService.add(STORES.LOGS, newEntry);
  } catch (e) {
      console.error("Failed to write log", e);
  }
};

/**
 * Clears all development logs from IndexedDB.
 */
export const clearLogs = async (): Promise<void> => {
  try {
    await dbService.clear(STORES.LOGS);
  } catch (error) {
    console.error("Failed to clear dev logs", error);
  }
};
