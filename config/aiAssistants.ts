
import React from 'react';
import { AIAssistant } from '../types';
import { 
  FemaleAvatar1, MaleAvatar1, FemaleAvatar2, MaleAvatar2, FemaleAvatar3, MaleAvatar3,
  ShibaAvatar, PoodleAvatar, CorgiAvatar, RetrieverAvatar, HuskyAvatar, PugAvatar 
} from '../components/AIAvatar';

export const ASSISTANTS: AIAssistant[] = [
  // Human Avatars - Professional Agent Names
  { 
    id: 'human_female_1',
    type: 'human', 
    title: "Senior Strategist",
    nameOptions: ['ARIA', 'LYRA', 'VEGA'],
    description: "冷静沈着な分析力を持ち、キャリアの構造的課題を解き明かす戦略的パートナーです。",
    avatarComponent: React.createElement(FemaleAvatar1)
  },
  { 
    id: 'human_male_1',
    type: 'human', 
    title: "Insight Architect",
    nameOptions: ['NOVA', 'SOLAR', 'ORION'],
    description: "あなたの内なる声と言語化されない強みを繋ぎ合わせ、新しいキャリアの設計図を描きます。",
    avatarComponent: React.createElement(MaleAvatar1)
  },
  { 
    id: 'human_female_2',
    type: 'human', 
    title: "Growth Catalyst",
    nameOptions: ['AURA', 'IRIS', 'SELENE'],
    description: "ポジティブな視座の転換を促し、挑戦への不安を確信へと変える対話を得意とします。",
    avatarComponent: React.createElement(FemaleAvatar2)
  },
  { 
    id: 'human_male_2',
    type: 'human', 
    title: "Market Analyst",
    nameOptions: ['ETHOS', 'AXEL', 'LOGOS'],
    description: "市場の動向と個人のポテンシャルを掛け合わせ、最も合理的なキャリアパスを提案します。",
    avatarComponent: React.createElement(MaleAvatar2)
  },
  { 
    id: 'human_female_3',
    type: 'human', 
    title: "Lead Mentor",
    nameOptions: ['SAGE', 'MAIA', 'THEMIS'],
    description: "数多くの事例を経験した叡智に基づき、長期的な視点からあなたの人生の航路を照らします。",
    avatarComponent: React.createElement(FemaleAvatar3)
  },
  { 
    id: 'human_male_3',
    type: 'human', 
    title: "Tech Specialist",
    nameOptions: ['CYBER', 'VECTOR', 'ZENITH'],
    description: "専門職やIT業界の潮流に精通し、具体的で実用的なスキルセットの構築を支援します。",
    avatarComponent: React.createElement(MaleAvatar3)
  },
  // Dog Avatars - (Keep existing for warmth)
  {
    id: 'dog_shiba_1',
    type: 'dog',
    title: "相談わんこ (柴犬)",
    nameOptions: ['ポチ', 'ハチ', 'コタロウ'],
    description: "元気いっぱい！ポジティブな対話であなたを励まします。",
    avatarComponent: React.createElement(ShibaAvatar)
  },
  {
    id: 'dog_poodle_1',
    type: 'dog',
    title: "相談わんこ (プードル)",
    nameOptions: ['ココ', 'モモ', 'マロン'],
    description: "優しく寄り添い、あなたのペースで話を聞きます。",
    avatarComponent: React.createElement(PoodleAvatar)
  },
  {
    id: 'dog_corgi_1',
    type: 'dog',
    title: "相談わんこ (コーギー)",
    nameOptions: ['チャチャ', 'レオ', 'ソラ'],
    description: "短い足で一生懸命！あなたの悩みに全力で向き合います。",
    avatarComponent: React.createElement(CorgiAvatar)
  },
  {
    id: 'dog_retriever_1',
    type: 'dog',
    title: "相談わんこ (レトリバー)",
    nameOptions: ['マックス', 'ラッキー', 'リク'],
    description: "賢く穏やかに。あなたのどんな話も優しく受け止めます。",
    avatarComponent: React.createElement(RetrieverAvatar)
  },
  {
    id: 'dog_husky_1',
    type: 'dog',
    title: "相談わんこ (ハスキー)",
    nameOptions: ['カイ', 'ノア', 'アポロ'],
    description: "クールで誠実。まっすぐな言葉であなたを導きます。",
    avatarComponent: React.createElement(HuskyAvatar)
  },
  {
    id: 'dog_pug_1',
    type: 'dog',
    title: "相談わんこ (パグ)",
    nameOptions: ['ぷく', 'ゴン', 'まる'],
    description: "癒やしの専門犬。あなたの心をほっこり解きほぐします。",
    avatarComponent: React.createElement(PugAvatar)
  },
];
