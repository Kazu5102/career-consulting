
// services/userService.ts - v4.20 - Future-proofed Async Interfaces
import { UserInfo } from '../types';
// Fix: Import STORAGE_KEYS from constants.ts instead of types.ts
import { STORAGE_KEYS } from '../constants';
import { ADJECTIVES, ANIMALS } from '../data/nicknames';

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
 * Retrieves all users. Now async-ready.
 */
export const getUsers = async (): Promise<UserInfo[]> => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get users from localStorage", error);
    return [];
  }
};

/**
 * Saves all users.
 */
export const saveUsers = async (users: UserInfo[]): Promise<void> => {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (error) {
    console.error("Failed to save users to localStorage", error);
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
    
    await saveUsers([...users, newUser]);
    return newUser;
}

/**
 * Optimized user deletion with clear separation of concerns.
 */
export const deleteUsers = async (userIds: string[]): Promise<void> => {
  const targetIds = new Set(userIds);
  const users = await getUsers();
  const remainingUsers = users.filter(u => !targetIds.has(u.id));
  await saveUsers(remainingUsers);
};
