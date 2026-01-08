
// types.ts - v3.20
import type React from 'react';

export const STORAGE_VERSION = 1;

export interface StoredData {
  version: number;
  data: StoredConversation[];
  users?: UserInfo[];
  userInfo?: UserInfo;
  exportedAt?: string; // Ver 3.20: Traceability for exports
}

export interface UserInfo {
  id: string;
  nickname: string;
  pin: string;
}

export interface UserProfile {
  stage?: string;
  age?: string;
  gender?: string;
  complaint?: string;
  lifeRoles?: string[];
  interactionStats?: {
    backCount: number;
    resetCount: number;
    totalTimeSeconds: number;
  };
}

export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

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
  groundingMetadata?: GroundingMetadata;
}

export type AIType = 'human' | 'dog';

export interface StructuredSummary {
  user_summary: string;
  pro_notes: string;
}

export interface StoredConversation {
  id: number;
  userId: string;
  aiName: string;
  aiType: AIType;
  aiAvatar: string;
  messages: ChatMessage[];
  summary: string;
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
  overallInsights: string;
  keyTakeaways: string[];
}

export interface SkillMatchingResult {
  keyTakeaways: string[];
  analysisSummary: string;
  recommendedRoles: RecommendedRole[];
  skillsToDevelop: SkillToDevelop[];
  learningResources: LearningResource[];
}

export interface RecommendedRole {
  role: string;
  reason: string;
  matchScore: number;
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

export interface ConsultationEntry {
    dateTime: string;
    estimatedDurationMinutes: number;
}

export interface ReframedSkill {
  userWord: string;
  professionalSkill: string;
  insight: string;
}

export interface TrajectoryAnalysisData {
    keyTakeaways: string[];
    userId: string;
    totalConsultations: number;
    consultations: ConsultationEntry[];
    keyThemes: string[];
    detectedStrengths: string[];
    areasForDevelopment: string[];
    suggestedNextSteps: string[];
    overallSummary: string;
    triageLevel: 'high' | 'medium' | 'low';
    ageStageGap: number; // 0-100
    theoryBasis?: string; // Ver 2.72 追加
    expertAdvice?: string; // Ver 2.72 追加
    reframedSkills: ReframedSkill[];
    sessionStarter: string;
    narrativeTimeline?: { topic: string; emotionalTone: number }[];
}

export interface HiddenPotentialData {
    hiddenSkills: SkillToDevelop[];
}

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

export interface UserAnalysisCache {
    trajectory?: (TrajectoryAnalysisData | { error: string });
    skillMatching?: (SkillMatchingResult | { error: string });
    hiddenPotential?: (HiddenPotentialData | { error: string });
}
