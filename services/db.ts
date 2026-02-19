
// services/db.ts - v1.0 - IndexedDB Wrapper & Migration
import { STORAGE_KEYS } from '../constants';
import { UserInfo, StoredConversation, AnalysisHistoryEntry, DevLogEntry } from '../types';

const DB_NAME = 'CareerConsultingDB';
const DB_VERSION = 1;

// Define Store Names
export const STORES = {
    USERS: 'users',
    CONVERSATIONS: 'conversations',
    ANALYSIS_HISTORY: 'analysis_history',
    LOGS: 'logs'
};

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB error:", request.error);
            reject(request.error);
        };

        request.onsuccess = (event) => {
            const db = request.result;
            // Check for migration after successful open
            migrateFromLocalStorage(db).then(() => resolve(db));
        };

        request.onupgradeneeded = (event) => {
            const db = request.result;
            // Create object stores
            if (!db.objectStoreNames.contains(STORES.USERS)) {
                db.createObjectStore(STORES.USERS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.CONVERSATIONS)) {
                db.createObjectStore(STORES.CONVERSATIONS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.ANALYSIS_HISTORY)) {
                db.createObjectStore(STORES.ANALYSIS_HISTORY, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.LOGS)) {
                // logs don't strictly need a keyPath if we use autoIncrement, 
                // but let's assume we might query by timestamp
                db.createObjectStore(STORES.LOGS, { autoIncrement: true });
            }
        };
    });

    return dbPromise;
};

// Data Migration Logic
const migrateFromLocalStorage = async (db: IDBDatabase): Promise<void> => {
    const MIGRATION_KEY = 'migration_v1_complete';
    if (localStorage.getItem(MIGRATION_KEY)) return;

    console.log("Starting migration from LocalStorage to IndexedDB...");

    const tx = db.transaction([STORES.USERS, STORES.CONVERSATIONS, STORES.ANALYSIS_HISTORY, STORES.LOGS], 'readwrite');
    
    // 1. Users
    try {
        const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        if (rawUsers) {
            const users: UserInfo[] = JSON.parse(rawUsers);
            const userStore = tx.objectStore(STORES.USERS);
            users.forEach(u => userStore.put(u));
        }
    } catch (e) { console.error("Migration Error (Users):", e); }

    // 2. Conversations
    try {
        const rawConvs = localStorage.getItem(STORAGE_KEYS.CONSULTATIONS);
        if (rawConvs) {
            const parsed = JSON.parse(rawConvs);
            const convs: StoredConversation[] = Array.isArray(parsed.data) ? parsed.data : (Array.isArray(parsed) ? parsed : []);
            const convStore = tx.objectStore(STORES.CONVERSATIONS);
            convs.forEach(c => convStore.put(c));
        }
    } catch (e) { console.error("Migration Error (Conversations):", e); }

    // 3. Analysis History
    try {
        const rawHistory = localStorage.getItem(STORAGE_KEYS.ANALYSIS_HISTORY);
        if (rawHistory) {
            const history: AnalysisHistoryEntry[] = JSON.parse(rawHistory);
            const historyStore = tx.objectStore(STORES.ANALYSIS_HISTORY);
            history.forEach(h => historyStore.put(h));
        }
    } catch (e) { console.error("Migration Error (History):", e); }

    // 4. Logs
    try {
        const rawLogs = localStorage.getItem(STORAGE_KEYS.DEV_LOG);
        if (rawLogs) {
            const parsed = JSON.parse(rawLogs);
            const logs: DevLogEntry[] = parsed.entries || [];
            const logStore = tx.objectStore(STORES.LOGS);
            logs.forEach(l => logStore.add(l));
        }
    } catch (e) { console.error("Migration Error (Logs):", e); }

    return new Promise((resolve) => {
        tx.oncomplete = () => {
            console.log("Migration completed successfully.");
            localStorage.setItem(MIGRATION_KEY, 'true');
            // Optional: Clear old data to free up LocalStorage
            localStorage.removeItem(STORAGE_KEYS.USERS);
            localStorage.removeItem(STORAGE_KEYS.CONSULTATIONS);
            localStorage.removeItem(STORAGE_KEYS.ANALYSIS_HISTORY);
            localStorage.removeItem(STORAGE_KEYS.DEV_LOG);
            resolve();
        };
        tx.onerror = () => {
            console.error("Migration transaction failed.");
            resolve(); // Resolve anyway to allow app to start, maybe retry later
        };
    });
};

export const dbService = {
    getAll: async <T>(storeName: string): Promise<T[]> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    put: async <T>(storeName: string, item: T): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(item);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    add: async <T>(storeName: string, item: T): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.add(item);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    putAll: async <T>(storeName: string, items: T[]): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            items.forEach(item => store.put(item));
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    delete: async (storeName: string, key: any): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    deleteAll: async (storeName: string, keys: any[]): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            keys.forEach(key => store.delete(key));
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },
    
    clear: async (storeName: string): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
};
