
// services/analysisService.ts - v4.80 - In-Memory Storage
import { AnalysisHistoryEntry, AnalysisType } from '../types';

// In-memory storage
let memoryAnalysisHistory: AnalysisHistoryEntry[] = [];

export const getAnalysisHistory = async (userId: string): Promise<AnalysisHistoryEntry[]> => {
    // Sort: Newest first
    return memoryAnalysisHistory.filter(e => e.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
};

export const saveAnalysisResult = async (userId: string, type: AnalysisType, data: any): Promise<void> => {
    // Only persist Trajectory and SkillMatching as per requirements
    if (type === 'hiddenPotential') return;

    const newEntry: AnalysisHistoryEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId,
        timestamp: Date.now(),
        type: type as 'trajectory' | 'skillMatching',
        data
    };
    
    memoryAnalysisHistory.push(newEntry);
};

export const deleteAnalysisHistory = async (userIds: string[]): Promise<void> => {
    memoryAnalysisHistory = memoryAnalysisHistory.filter(e => !userIds.includes(e.userId));
};

// For full system backup/restore
export const getAllAnalysisHistory = async (): Promise<AnalysisHistoryEntry[]> => {
    return [...memoryAnalysisHistory];
}

export const restoreAnalysisHistory = async (history: AnalysisHistoryEntry[]): Promise<void> => {
    memoryAnalysisHistory = [...history];
}

