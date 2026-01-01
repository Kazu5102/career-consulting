export interface DevLogEntry {
  timestamp: string;
  userPrompt: string;
  aiSummary: string;
}

export interface DevLog {
  version: number;
  entries: DevLogEntry[];
}

const DEV_LOG_STORAGE_KEY = 'devLog_v1';
const DEV_LOG_VERSION = 1;

/**
 * Retrieves all development logs from localStorage.
 * @returns A DevLog object.
 */
export const getLogs = (): DevLog => {
  try {
    const data = localStorage.getItem(DEV_LOG_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.version === DEV_LOG_VERSION) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to get dev logs from localStorage", error);
  }
  // Return a default structure if no valid data is found
  return { version: DEV_LOG_VERSION, entries: [] };
};

/**
 * Saves a DevLog object to localStorage.
 * @param logs - The DevLog object to save.
 */
export const saveLogs = (logs: DevLog): void => {
  try {
    localStorage.setItem(DEV_LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Failed to save dev logs to localStorage", error);
  }
};

/**
 * Adds a new entry to the development log.
 * @param entryData - An object containing userPrompt and aiSummary.
 */
export const addLogEntry = ({ userPrompt, aiSummary }: { userPrompt: string, aiSummary: string }): void => {
  const logs = getLogs();
  const newEntry: DevLogEntry = {
    timestamp: new Date().toISOString(),
    userPrompt,
    aiSummary,
  };
  logs.entries.push(newEntry);
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