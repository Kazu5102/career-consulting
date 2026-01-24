
import { UserInfo } from '../types';
import { ADJECTIVES, ANIMALS } from '../data/nicknames';

const USERS_STORAGE_KEY = 'careerConsultingUsers_v1';

/**
 * Generates a unique, memorable nickname from predefined lists.
 * @param existingNicknames - An array of nicknames already in use.
 * @returns A new, unique nickname.
 */
export const generateNickname = (existingNicknames: string[]): string => {
  let nickname;
  let attempts = 0;
  do {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    nickname = `${adj}${animal}`;
    attempts++;
  } while (existingNicknames.includes(nickname) && attempts < 50); // Avoid infinite loops
  return nickname;
};

/**
 * Generates a random 4-digit PIN as a string.
 * @returns A 4-digit PIN string.
 */
export const generatePin = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Retrieves all user info from localStorage.
 * @returns An array of UserInfo objects.
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
 * @param users - The array of UserInfo objects to save.
 */
export const saveUsers = (users: UserInfo[]): void => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Failed to save users to localStorage", error);
  }
};

/**
 * Finds a user by their unique ID.
 * @param userId - The ID of the user to find.
 * @returns The UserInfo object if found, otherwise undefined.
 */
export const getUserById = (userId: string): UserInfo | undefined => {
  return getUsers().find(u => u.id === userId);
}

/**
 * Creates a new user with a unique ID, nickname, and PIN, and saves them.
 * @returns The newly created UserInfo object.
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

/**
 * Deletes users and their associated conversation history.
 * @param userIds - Array of user IDs to delete.
 */
export const deleteUsers = (userIds: string[]): void => {
  const targetIds = new Set(userIds);

  // 1. Delete User Info
  const users = getUsers();
  const remainingUsers = users.filter(u => !targetIds.has(u.id));
  saveUsers(remainingUsers);

  // 2. Delete Conversation History
  try {
    const rawData = localStorage.getItem('careerConsultations');
    if (rawData) {
      const parsed = JSON.parse(rawData);
      let conversations = parsed.data || (Array.isArray(parsed) ? parsed : []);
      
      // Filter out conversations belonging to deleted users
      const originalCount = conversations.length;
      conversations = conversations.filter((c: any) => !targetIds.has(c.userId));
      
      // Save maintaining structure
      const newData = { ...parsed, data: conversations };
      
      if (Array.isArray(parsed)) {
          // Fallback for legacy array format
          localStorage.setItem('careerConsultations', JSON.stringify({ version: 1, data: conversations }));
      } else {
          localStorage.setItem('careerConsultations', JSON.stringify(newData));
      }
      
      console.log(`Deleted ${originalCount - conversations.length} conversations for ${userIds.length} users.`);
    }
  } catch (e) {
    console.error("Failed to delete conversations", e);
  }
};
