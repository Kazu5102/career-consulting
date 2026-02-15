
// services/conversationService.ts - v4.55 - IndexedDB Support
import { StoredConversation } from '../types';
import { dbService, STORES } from './db';

/**
 * Retrieves all conversations from IndexedDB.
 */
export const getAllConversations = async (): Promise<StoredConversation[]> => {
  try {
    return await dbService.getAll<StoredConversation>(STORES.CONVERSATIONS);
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return [];
  }
};

/**
 * Retrieves conversations for a specific user.
 */
export const getConversationsByUserId = async (userId: string): Promise<StoredConversation[]> => {
  const all = await getAllConversations();
  return all.filter(c => c.userId === userId);
};

/**
 * Saves a new conversation or updates an existing one.
 */
export const saveConversation = async (conversation: StoredConversation): Promise<void> => {
  try {
      await dbService.put(STORES.CONVERSATIONS, conversation);
  } catch (error) {
      console.error("Failed to save conversation:", error);
  }
};

/**
 * Bulk deletes conversations by user IDs.
 * Since conversations store key is 'id' (timestamp), we need to find them first.
 */
export const deleteConversationsByUserIds = async (userIds: string[]): Promise<void> => {
  const all = await getAllConversations();
  const targets = all.filter(c => userIds.includes(c.userId));
  const keys = targets.map(c => c.id);
  await dbService.deleteAll(STORES.CONVERSATIONS, keys);
};

/**
 * Saves auto-save draft data. (Remains in LocalStorage for performance/simplicity for now)
 */
export const saveAutoSave = async (userId: string, data: any): Promise<void> => {
  localStorage.setItem(`career_autosave_${userId}`, JSON.stringify(data));
};

/**
 * Retrieves auto-save draft data.
 */
export const getAutoSave = async (userId: string): Promise<any | null> => {
  const raw = localStorage.getItem(`career_autosave_${userId}`);
  return raw ? JSON.parse(raw) : null;
};

/**
 * Clears auto-save draft data.
 */
export const clearAutoSave = async (userId: string): Promise<void> => {
  localStorage.removeItem(`career_autosave_${userId}`);
};

/**
 * Replaces the entire conversation store (used for import/restore).
 * WARNING: This clears existing DB data first.
 */
export const replaceAllConversations = async (conversations: StoredConversation[]): Promise<void> => {
  await dbService.clear(STORES.CONVERSATIONS);
  await dbService.putAll(STORES.CONVERSATIONS, conversations);
};
