
// services/analysisService.ts
import { STORAGE_KEYS } from '../constants';
import { AnalysisHistoryEntry, AnalysisType } from '../types';

export const getAnalysisHistory = (userId: string): AnalysisHistoryEntry[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.ANALYSIS_HISTORY);
        if (!raw) return [];
        const all: AnalysisHistoryEntry[] = JSON.parse(raw);
        // Sort: Newest first
        return all.filter(e => e.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
        console.error("Failed to load analysis history", e);
        return [];
    }
};

export const saveAnalysisResult = (userId: string, type: AnalysisType, data: any) => {
    // Only persist Trajectory and SkillMatching as per requirements
    if (type === 'hiddenPotential') return;

    try {
        const raw = localStorage.getItem(STORAGE_KEYS.ANALYSIS_HISTORY);
        const all: AnalysisHistoryEntry[] = raw ? JSON.parse(raw) : [];
        
        const newEntry: AnalysisHistoryEntry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId,
            timestamp: Date.now(),
            type: type as 'trajectory' | 'skillMatching',
            data
        };
        
        all.push(newEntry);
        localStorage.setItem(STORAGE_KEYS.ANALYSIS_HISTORY, JSON.stringify(all));
    } catch (e) {
        console.error("Failed to save analysis result", e);
    }
};

export const deleteAnalysisHistory = (userIds: string[]) => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.ANALYSIS_HISTORY);
        if (!raw) return;
        const all: AnalysisHistoryEntry[] = JSON.parse(raw);
        const remaining = all.filter(e => !userIds.includes(e.userId));
        localStorage.setItem(STORAGE_KEYS.ANALYSIS_HISTORY, JSON.stringify(remaining));
    } catch (e) {
        console.error("Failed to delete analysis history", e);
    }
};

// For full system backup/restore
export const getAllAnalysisHistory = (): AnalysisHistoryEntry[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.ANALYSIS_HISTORY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

export const restoreAnalysisHistory = (history: AnalysisHistoryEntry[]) => {
    try {
        localStorage.setItem(STORAGE_KEYS.ANALYSIS_HISTORY, JSON.stringify(history));
    } catch (e) { console.error("Restore failed", e); }
}
