
// services/analysisService.ts - v4.55 - IndexedDB Support
import { AnalysisHistoryEntry, AnalysisType } from '../types';
import { dbService, STORES } from './db';

// Changed to Async
export const getAnalysisHistory = async (userId: string): Promise<AnalysisHistoryEntry[]> => {
    try {
        const all = await dbService.getAll<AnalysisHistoryEntry>(STORES.ANALYSIS_HISTORY);
        // Sort: Newest first
        return all.filter(e => e.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
        console.error("Failed to load analysis history", e);
        return [];
    }
};

// Changed to Async
export const saveAnalysisResult = async (userId: string, type: AnalysisType, data: any): Promise<void> => {
    // Only persist Trajectory and SkillMatching as per requirements
    if (type === 'hiddenPotential') return;

    try {
        const newEntry: AnalysisHistoryEntry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId,
            timestamp: Date.now(),
            type: type as 'trajectory' | 'skillMatching',
            data
        };
        
        await dbService.put(STORES.ANALYSIS_HISTORY, newEntry);
    } catch (e) {
        console.error("Failed to save analysis result", e);
    }
};

// Changed to Async
export const deleteAnalysisHistory = async (userIds: string[]): Promise<void> => {
    try {
        const all = await dbService.getAll<AnalysisHistoryEntry>(STORES.ANALYSIS_HISTORY);
        const targets = all.filter(e => userIds.includes(e.userId));
        const keys = targets.map(e => e.id);
        await dbService.deleteAll(STORES.ANALYSIS_HISTORY, keys);
    } catch (e) {
        console.error("Failed to delete analysis history", e);
    }
};

// For full system backup/restore
export const getAllAnalysisHistory = async (): Promise<AnalysisHistoryEntry[]> => {
    try {
        return await dbService.getAll<AnalysisHistoryEntry>(STORES.ANALYSIS_HISTORY);
    } catch (e) { return []; }
}

export const restoreAnalysisHistory = async (history: AnalysisHistoryEntry[]): Promise<void> => {
    try {
        await dbService.putAll(STORES.ANALYSIS_HISTORY, history);
    } catch (e) { console.error("Restore failed", e); }
}
