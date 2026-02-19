
// services/userService.ts - v4.55 - IndexedDB Support
import { UserInfo } from '../types';
import { ADJECTIVES, ANIMALS } from '../data/nicknames';
import { dbService, STORES } from './db';

/**
 * Generates a unique, memorable nickname.
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

export const generatePin = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Retrieves all users from IndexedDB.
 */
export const getUsers = async (): Promise<UserInfo[]> => {
  try {
    return await dbService.getAll<UserInfo>(STORES.USERS);
  } catch (error) {
    console.error("Failed to get users from DB", error);
    return [];
  }
};

/**
 * Saves all users. Note: IndexedDB putAll overwrites/adds.
 * For full replacement logic if needed, we might need clear+putAll, but put is fine for updates.
 */
export const saveUsers = async (users: UserInfo[]): Promise<void> => {
  try {
    await dbService.putAll(STORES.USERS, users);
  } catch (error) {
    console.error("Failed to save users to DB", error);
  }
};

export const getUserById = async (userId: string): Promise<UserInfo | undefined> => {
  const users = await getUsers();
  return users.find(u => u.id === userId);
}

export const addNewUser = async (): Promise<UserInfo> => {
    const users = await getUsers();
    const existingNicknames = users.map(u => u.nickname);
    
    const newUser: UserInfo = {
        id: `user_${Date.now()}`,
        nickname: generateNickname(existingNicknames),
        pin: generatePin(),
    };
    
    await dbService.put(STORES.USERS, newUser);
    return newUser;
}

/**
 * Optimized user deletion.
 */
export const deleteUsers = async (userIds: string[]): Promise<void> => {
  try {
      await dbService.deleteAll(STORES.USERS, userIds);
  } catch (error) {
      console.error("Failed to delete users", error);
  }
};
