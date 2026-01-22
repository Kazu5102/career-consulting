
import { UserInfo, StoredConversation, StoredData } from '../types';
import { ADJECTIVES, ANIMALS } from '../data/nicknames';

const USERS_STORAGE_KEY = 'careerConsultingUsers_v1';
const CONVERSATIONS_STORAGE_KEY = 'careerConsultations';

/**
 * Generates a unique, memorable nickname from predefined lists.
 */
export const generateNickname = (existingNicknames: string[]): string => {
  let nickname;
  let attempts = 0;
  do {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    nickname = `${adj}${animal}`;
    attempts++;
  } while (existingNicknames.includes(nickname) && attempts < 50);
  return nickname;
};

/**
 * Generates a random 4-digit PIN as a string.
 */
export const generatePin = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Retrieves all user info from localStorage.
 */
export const getUsers = (): UserInfo[] => {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get users from localStorage", error);
    return [];
  }
};

/**
 * Saves an array of user info to localStorage.
 */
export const saveUsers = (users: UserInfo[]): void => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Failed to save users to localStorage", error);
  }
};

/**
 * Deletes multiple users and their associated conversation data.
 */
export const deleteUsers = (userIds: string[]): void => {
    // 1. Delete user profiles
    const users = getUsers();
    const remainingUsers = users.filter(u => !userIds.includes(u.id));
    saveUsers(remainingUsers);

    // 2. Delete associated conversations
    const allDataRaw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (allDataRaw) {
        try {
            const parsed = JSON.parse(allDataRaw);
            let conversations: StoredConversation[] = [];
            
            if (parsed && Array.isArray(parsed.data)) {
                conversations = parsed.data;
            } else if (Array.isArray(parsed)) {
                conversations = parsed;
            }

            const filteredConvs = conversations.filter(c => !userIds.includes(c.userId));
            
            localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify({
                version: (parsed && parsed.version) || 1,
                data: filteredConvs
            }));
        } catch (e) {
            console.error("Failed to cleanup conversations during user deletion", e);
        }
    }
};

/**
 * Finds a user by their unique ID.
 */
export const getUserById = (userId: string): UserInfo | undefined => {
  return getUsers().find(u => u.id === userId);
}

/**
 * Creates a new user with a unique ID, nickname, and PIN, and saves them.
 */
export const addNewUser = (): UserInfo => {
    const users = getUsers();
    const existingNicknames = users.map(u => u.nickname);
    
    const newUser: UserInfo = {
        id: `user_${Date.now()}`,
        nickname: generateNickname(existingNicknames),
        pin: generatePin(),
    };
    
    saveUsers([...users, newUser]);
    return newUser;
}
