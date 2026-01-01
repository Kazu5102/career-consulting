import React from 'react';
import { AIAssistant } from '../types';
import { 
  FemaleAvatar1, MaleAvatar1, FemaleAvatar2, MaleAvatar2, 
  ShibaAvatar, PoodleAvatar, CorgiAvatar, RetrieverAvatar 
} from '../components/AIAvatar';

export const ASSISTANTS: AIAssistant[] = [
  // Human Avatars
  { 
    id: 'human_female_1',
    type: 'human', 
    title: "AIコンサルタント (女性風)",
    nameOptions: ['佐藤 さくら', '高橋 あかり', '鈴木 陽菜'],
    description: "知的で落ち着いた雰囲気で、あなたの悩みを深く理解します。",
    // FIX: Replaced JSX syntax with React.createElement to resolve TypeScript error in a .ts file. JSX syntax is only allowed in .tsx files.
    avatarComponent: React.createElement(FemaleAvatar1)
  },
  { 
    id: 'human_male_1',
    type: 'human', 
    title: "AIコンサルタント (男性風)",
    nameOptions: ['伊藤 健太', '渡辺 拓也', '田中 誠'],
    description: "親しみやすい雰囲気で、あなたの考えを丁寧に整理します。",
    // FIX: Replaced JSX syntax with React.createElement to resolve TypeScript error in a .ts file. JSX syntax is only allowed in .tsx files.
    avatarComponent: React.createElement(MaleAvatar1)
  },
  { 
    id: 'human_female_2',
    type: 'human', 
    title: "AIコンサルタント (女性風・快活)",
    nameOptions: ['加藤 美咲', '吉田 理恵', '山田 優子'],
    description: "明るい笑顔で、あなたの新しい挑戦を応援します。",
    // FIX: Replaced JSX syntax with React.createElement to resolve TypeScript error in a .ts file. JSX syntax is only allowed in .tsx files.
    avatarComponent: React.createElement(FemaleAvatar2)
  },
  { 
    id: 'human_male_2',
    type: 'human', 
    title: "AIコンサルタント (男性風・スマート)",
    nameOptions: ['中村 翔太', '小林 大輔', '斎藤 蓮'],
    description: "スマートな対話で、あなたのキャリアの可能性を引き出します。",
    // FIX: Replaced JSX syntax with React.createElement to resolve TypeScript error in a .ts file. JSX syntax is only allowed in .tsx files.
    avatarComponent: React.createElement(MaleAvatar2)
  },
  // Dog Avatars
  {
    id: 'dog_shiba_1',
    type: 'dog',
    title: "キャリア相談わんこ (柴犬風)",
    nameOptions: ['ポチ', 'ハチ', 'コタロウ'],
    description: "元気いっぱい！ポジティブな対話であなたを励まします。",
    // FIX: Replaced JSX syntax with React.createElement to resolve TypeScript error in a .ts file. JSX syntax is only allowed in .tsx files.
    avatarComponent: React.createElement(ShibaAvatar)
  },
  {
    id: 'dog_poodle_1',
    type: 'dog',
    title: "キャリア相談わんこ (プードル風)",
    nameOptions: ['ココ', 'モモ', 'マロン'],
    description: "優しく寄り添い、あなたのペースで話を聞きます。",
    // FIX: Replaced JSX syntax with React.createElement to resolve TypeScript error in a .ts file. JSX syntax is only allowed in .tsx files.
    avatarComponent: React.createElement(PoodleAvatar)
  },
  {
    id: 'dog_corgi_1',
    type: 'dog',
    title: "キャリア相談わんこ (コーギー風)",
    nameOptions: ['チャチャ', 'レオ', 'ソラ'],
    description: "短い足で一生懸命！あなたの悩みに全力で向き合います。",
    // FIX: Replaced JSX syntax with React.createElement to resolve TypeScript error in a .ts file. JSX syntax is only allowed in .tsx files.
    avatarComponent: React.createElement(CorgiAvatar)
  },
  {
    id: 'dog_retriever_1',
    type: 'dog',
    title: "キャリア相談わんこ (レトリバー風)",
    nameOptions: ['マックス', 'ラッキー', 'リク'],
    description: "賢く穏やかに。あなたのどんな話も優しく受け止めます。",
    // FIX: Replaced JSX syntax with React.createElement to resolve TypeScript error in a .ts file. JSX syntax is only allowed in .tsx files.
    avatarComponent: React.createElement(RetrieverAvatar)
  },
];
