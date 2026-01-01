
import type React from 'react';

export const STORAGE_VERSION = 1;

export interface StoredData {
  version: number;
  data: StoredConversation[];
}

// User information for authentication and display
export interface UserInfo {
  id: string;      // Unique identifier, e.g., 'user_17...'
  nickname: string; // Auto-generated memorable name, e.g., 'Brave Lion'
  pin: string;     // 4-digit PIN for authentication
}

export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

// Grounding Metadata Types
export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  webSearchQueries?: string[];
}

export interface ChatMessage {
  author: MessageAuthor;
  text: string;
  groundingMetadata?: GroundingMetadata; // Added for Google Search results
}

export type AIType = 'human' | 'dog';

// Structured summary object for split view (Option 2 implementation)
export interface StructuredSummary {
  user_summary: string;
  pro_notes: string;
}

export interface StoredConversation {
  id: number;
  userId: string;
  aiName: string;
  aiType: AIType;
  aiAvatar: string; // e.g. 'human_female_1', 'dog_poodle_1'
  messages: ChatMessage[];
  summary: string; // For backward compatibility, we'll store as string (JSON stringified if structured)
  date: string;
  status: 'completed' | 'interrupted';
}

export interface AIAssistant {
  id: string;
  type: AIType;
  title: string;
  nameOptions: string[];
  description: string;
  avatarComponent: React.ReactElement;
}

// Types for structured analysis
export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface AnalysisData {
  keyMetrics: {
    totalConsultations: number;
    commonIndustries: string[];
  };
  commonChallenges: ChartDataPoint[];
  careerAspirations: ChartDataPoint[];
  commonStrengths: string[];
  overallInsights: string; // Markdown text for summary
  keyTakeaways: string[];
}


// Types for Skill Matching feature
export interface RecommendedRole {
  role: string;
  reason: string;
  matchScore: number; // A score from 0 to 100
}

export interface SkillToDevelop {
  skill: string;
  reason: string;
}

export interface LearningResource {
  title: string;
  type: 'course' | 'book' | 'article' | 'video';
  provider: string;
}

export interface SkillMatchingResult {
  keyTakeaways: string[];
  analysisSummary: string; // Markdown text
  recommendedRoles: RecommendedRole[];
  skillsToDevelop: SkillToDevelop[];
  learningResources: LearningResource[];
}

// --- NEW TYPES FOR SPLIT INDIVIDUAL ANALYSIS ---

export interface ConsultationEntry {
    dateTime: string;
    estimatedDurationMinutes: number;
}

// 1. Trajectory Analysis
export interface TrajectoryAnalysisData {
    keyTakeaways: string[];
    userId: string;
    totalConsultations: number;
    consultations: ConsultationEntry[];
    keyThemes: string[];
    detectedStrengths: string[];
    areasForDevelopment: string[];
    suggestedNextSteps: string[];
    overallSummary: string; // Markdown
}

// 2. Hidden Potential Analysis
export interface HiddenPotentialData {
    hiddenSkills: SkillToDevelop[];
}

// --- REFACTORED STATE MANAGEMENT ---
export type AnalysisStatus = 'idle' | 'loading' | 'error' | 'success';
export type AnalysisType = 'trajectory' | 'skillMatching' | 'hiddenPotential';

export interface AnalysisStateItem<T> {
  status: AnalysisStatus;
  data: T | null;
  error: string | null;
}

export type AnalysesState = {
  trajectory: AnalysisStateItem<TrajectoryAnalysisData>;
  skillMatching: AnalysisStateItem<SkillMatchingResult>;
  hiddenPotential: AnalysisStateItem<HiddenPotentialData>;
};

// --- LEGACY TYPE for ShareReportModal compatibility ---
export interface UserAnalysisCache {
    trajectory?: (TrajectoryAnalysisData | { error: string });
    skillMatching?: (SkillMatchingResult | { error: string });
    hiddenPotential?: (HiddenPotentialData | { error: string });
}
