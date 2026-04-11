
// services/devLogService.ts - v4.80 - In-Memory Storage
import { LogType, LogLevel, DevLogEntry } from '../types';

export type { LogType, LogLevel, DevLogEntry };

export interface DevLog {
  version: number;
  entries: DevLogEntry[];
}

const DEV_LOG_VERSION = 2;

// In-memory storage
let memoryLogs: DevLogEntry[] = [];

/**
 * Retrieves all development logs from memory.
 */
export const getLogs = async (): Promise<DevLog> => {
  return { version: DEV_LOG_VERSION, entries: [...memoryLogs] };
};

/**
 * Adds a new entry to the development/audit log.
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

  memoryLogs.push(newEntry);
};

/**
 * Clears all development logs from memory.
 */
export const clearLogs = async (): Promise<void> => {
  memoryLogs = [];
};

