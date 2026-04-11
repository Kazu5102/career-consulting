
// services/userService.ts - v4.80 - In-Memory Storage
import { UserInfo } from '../types';
import { ADJECTIVES, ANIMALS } from '../data/nicknames';

// In-memory storage
let memoryUsers: UserInfo[] = [];

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
 * Retrieves all users from memory.
 */
export const getUsers = async (): Promise<UserInfo[]> => {
  return [...memoryUsers];
};

/**
 * Saves all users to memory.
 */
export const saveUsers = async (users: UserInfo[]): Promise<void> => {
  memoryUsers = [...users];
};

export const getUserById = async (userId: string): Promise<UserInfo | undefined> => {
  return memoryUsers.find(u => u.id === userId);
}

export const addNewUser = async (): Promise<UserInfo> => {
    const existingNicknames = memoryUsers.map(u => u.nickname);
    
    const newUser: UserInfo = {
        id: `user_${Date.now()}`,
        nickname: generateNickname(existingNicknames),
        pin: generatePin(),
    };
    
    memoryUsers.push(newUser);
    return newUser;
}

/**
 * Optimized user deletion from memory.
 */
export const deleteUsers = async (userIds: string[]): Promise<void> => {
  memoryUsers = memoryUsers.filter(u => !userIds.includes(u.id));
};

