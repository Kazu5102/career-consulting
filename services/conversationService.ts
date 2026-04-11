
// services/conversationService.ts - v4.80 - In-Memory Storage
import { StoredConversation } from '../types';

// In-memory storage
let memoryConversations: StoredConversation[] = [];

/**
 * Retrieves all conversations from memory.
 */
export const getAllConversations = async (): Promise<StoredConversation[]> => {
  return [...memoryConversations];
};

/**
 * Retrieves conversations for a specific user.
 */
export const getConversationsByUserId = async (userId: string): Promise<StoredConversation[]> => {
  return memoryConversations.filter(c => c.userId === userId);
};

/**
 * Saves a new conversation or updates an existing one in memory.
 */
export const saveConversation = async (conversation: StoredConversation): Promise<void> => {
  const index = memoryConversations.findIndex(c => c.id === conversation.id);
  if (index >= 0) {
      memoryConversations[index] = conversation;
  } else {
      memoryConversations.push(conversation);
  }
};

/**
 * Bulk deletes conversations by user IDs from memory.
 */
export const deleteConversationsByUserIds = async (userIds: string[]): Promise<void> => {
  memoryConversations = memoryConversations.filter(c => !userIds.includes(c.userId));
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
 */
export const replaceAllConversations = async (conversations: StoredConversation[]): Promise<void> => {
  memoryConversations = [...conversations];
};

