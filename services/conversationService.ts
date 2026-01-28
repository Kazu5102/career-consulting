
// services/conversationService.ts - v1.0.0 - Persistence Layer Isolation
import { StoredConversation, STORAGE_VERSION, StoredData } from '../types';
// Fix: Import STORAGE_KEYS from constants.ts instead of types.ts
import { STORAGE_KEYS } from '../constants';

/**
 * Retrieves all conversations from storage.
 * Designed to be async to facilitate future database migration.
 */
export const getAllConversations = async (): Promise<StoredConversation[]> => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEYS.CONSULTATIONS);
    if (!rawData) return [];
    const parsed = JSON.parse(rawData);
    if (parsed && parsed.data && Array.isArray(parsed.data)) {
      return parsed.data;
    } else if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
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
  const all = await getAllConversations();
  const index = all.findIndex(c => c.id === conversation.id);
  
  let updated;
  if (index !== -1) {
    updated = [...all];
    updated[index] = conversation;
  } else {
    updated = [...all, conversation];
  }

  const dataToStore: StoredData = {
    version: STORAGE_VERSION,
    data: updated
  };
  localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(dataToStore));
};

/**
 * Bulk deletes conversations by user IDs.
 */
export const deleteConversationsByUserIds = async (userIds: string[]): Promise<void> => {
  const targetIds = new Set(userIds);
  const all = await getAllConversations();
  const remaining = all.filter(c => !targetIds.has(c.userId));
  
  localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify({
    version: STORAGE_VERSION,
    data: remaining
  }));
};

/**
 * Saves auto-save draft data.
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
 */
export const replaceAllConversations = async (conversations: StoredConversation[]): Promise<void> => {
  localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify({
    version: STORAGE_VERSION,
    data: conversations
  }));
};
