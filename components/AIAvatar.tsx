
// components/AIAvatar.tsx - v3.72 - Visual Perfection & Natural Hairline
import React from 'react';

export type Mood = 'neutral' | 'happy' | 'curious' | 'thinking' | 'reassure';

interface AvatarComponentProps {
  mood?: Mood;
}

const getHeadTransform = (mood?: Mood) => {
  if (mood === 'curious') return 'rotate(-5deg) translateX(-2px)';
  if (mood === 'thinking') return 'rotate(5deg) translateY(2px)';
  return 'none';
};

const DynamicEyes: React.FC<{ cx1: number; cx2: number; cy: number; mood: Mood; color?: string }> = ({ cx1, cx2, cy, mood, color = "#2d2d2d" }) => {
  if (mood === 'happy') {
    return (
      <g stroke={color} strokeWidth="4" fill="none" strokeLinecap="round">
        <path d={`M ${cx1-8},${cy+2} Q ${cx1},${cy-6} ${cx1+8},${cy+2}`} />
        <path d={`M ${cx2-8},${cy+2} Q ${cx2},${cy-6} ${cx2+8},${cy+2}`} />
      </g>
    );
  }
  return (
    <g>
      <circle cx={cx1} cy={cy} r="7.5" fill={color}/>
      <circle cx={cx2} cy={cy} r="7.5" fill={color}/>
      <circle cx={cx1-2.5} cy={cy-2.5} r="2.5" fill="#ffffff" />
      <circle cx={cx2-2.5} cy={cy-2.5} r="2.5" fill="#ffffff" />
    </g>
  );
};

const FaceDetails: React.FC<{ mood: Mood; color?: string }> = ({ mood, color = "#d19a8e" }) => {
  return (
    <g>
      <path d="M 98,122 Q 100,125 102,122" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {mood === 'happy' ? (
        <path d="M 88,138 Q 100,150 112,138" fill="none" stroke="#2d2d2d" strokeWidth="2.5" strokeLinecap="round" />
      ) : (
        <path d="M 92,141 Q 100,144 108,141" fill="none" stroke="#2d2d2d" strokeWidth="2" strokeLinecap="round" />
      )}
    </g>
  );
};

/* HUMAN AVATARS */

export const FemaleAvatar1: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="95" fill="#f8fafc" />
    <path d="M 40,200 Q 100,140 160,200" fill="#475569" />
    <g style={{ transform: getHeadTransform(mood), transformOrigin: 'center' }}>
      <path d="M 70,110 Q 100,180 130,110 Z" fill="#2d2d2d" />
      <circle cx="100" cy="105" r="45" fill="#fbdad0" />
      {/* Fix: Ensure mood is passed with correct type */}
      <DynamicEyes cx1="85" cx2="115" cy="100" mood={mood as Mood} />
      <FaceDetails mood={mood as Mood} />
    </g>
  </svg>
);

export const MaleAvatar1: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="95" fill="#f8fafc" />
    <path d="M 40,200 Q 100,150 160,200" fill="#334155" />
    <g style={{ transform: getHeadTransform(mood), transformOrigin: 'center' }}>
      <path d="M 60,70 Q 100,50 140,70 L 140,110 Q 100,120 60,110 Z" fill="#1e293b" />
      <circle cx="100" cy="105" r="42" fill="#e8beac" />
      {/* Fix: Ensure mood is passed with correct type */}
      <DynamicEyes cx1="85" cx2="115" cy="105" mood={mood as Mood} />
      <FaceDetails mood={mood as Mood} />
    </g>
  </svg>
);

export const FemaleAvatar2: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="95" fill="#f8fafc" />
    <path d="M 40,200 Q 100,145 160,200" fill="#64748b" />
    <g style={{ transform: getHeadTransform(mood), transformOrigin: 'center' }}>
      <circle cx="100" cy="105" r="45" fill="#ffdbac" />
      <path d="M 55,90 Q 100,40 145,90" fill="#4a3728" />
      {/* Fix: Ensure mood is passed with correct type */}
      <DynamicEyes cx1="85" cx2="115" cy="105" mood={mood as Mood} />
      <FaceDetails mood={mood as Mood} />
    </g>
  </svg>
);

export const MaleAvatar2: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="95" fill="#f8fafc" />
    <path d="M 40,200 Q 100,155 160,200" fill="#1e293b" />
    <g style={{ transform: getHeadTransform(mood), transformOrigin: 'center' }}>
      <circle cx="100" cy="105" r="42" fill="#d1a3a4" />
      <path d="M 65,75 L 135,75 L 130,95 L 70,95 Z" fill="#2d2d2d" />
      {/* Fix: Ensure mood is passed with correct type */}
      <DynamicEyes cx1="85" cx2="115" cy="108" mood={mood as Mood} />
      <FaceDetails mood={mood as Mood} />
    </g>
  </svg>
);

export const FemaleAvatar3: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="95" fill="#f8fafc" />
    <path d="M 40,200 Q 100,140 160,200" fill="#475569" />
    <g style={{ transform: getHeadTransform(mood), transformOrigin: 'center' }}>
      <circle cx="100" cy="105" r="45" fill="#fbdad0" />
      <path d="M 55,80 C 55,40 145,40 145,80 L 145,120 L 55,120 Z" fill="#3d2b1f" opacity="0.9" />
      {/* Fix: Ensure mood is passed with correct type */}
      <DynamicEyes cx1="85" cx2="115" cy="105" mood={mood as Mood} />
      <FaceDetails mood={mood as Mood} />
    </g>
  </svg>
);

export const MaleAvatar3: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="95" fill="#f8fafc" />
    <path d="M 40,200 Q 100,150 160,200" fill="#334155" />
    <g style={{ transform: getHeadTransform(mood), transformOrigin: 'center' }}>
      <circle cx="100" cy="105" r="42" fill="#e8beac" />
      <path d="M 60,85 Q 100,60 140,85 L 130,100 L 70,100 Z" fill="#2d2d2d" />
      {/* Fix: Ensure mood is passed with correct type */}
      <DynamicEyes cx1="85" cx2="115" cy="108" mood={mood as Mood} />
      <FaceDetails mood={mood as Mood} />
    </g>
  </svg>
);

/* DOG AVATARS */

export const ShibaAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="95" fill="#fff7ed" />
    <g style={{ transform: getHeadTransform(mood), transformOrigin: 'center' }}>
      <path d="M 60,80 L 80,40 L 100,70 Z" fill="#f97316" />
      <path d="M 140,80 L 120,40 L 100,70 Z" fill="#f97316" />
      <circle cx="100" cy="110" r="50" fill="#fb923c" />
      <circle cx="100" cy="120" r="35" fill="#fff" />
      <circle cx="80" cy="100" r="6" fill="#2d2d2d" />
      <circle cx="120" cy="100" r="6" fill="#2d2d2d" />
      <path d="M 90,120 Q 100,135 110,120" fill="none" stroke="#2d2d2d" strokeWidth="3" strokeLinecap="round" />
    </g>
  </svg>
);

export const PoodleAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="95" fill="#fdf2f8" />
    <g style={{ transform: getHeadTransform(mood), transformOrigin: 'center' }}>
      <circle cx="65" cy="90" r="25" fill="#f472b6" />
      <circle cx="135" cy="90" r="25" fill="#f472b6" />
      <circle cx="100" cy="110" r="45" fill="#fbcfe8" />
      {/* Fix: Ensure mood is passed with correct type */}
      <DynamicEyes cx1="85" cx2="115" cy="105" mood={mood as Mood} />
      <path d="M 95,125 Q 100,130 105,125" fill="none" stroke="#2d2d2d" strokeWidth="2.5" />
    </g>
  </svg>
);

export const CorgiAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="95" fill="#fffbeb" />
    <g style={{ transform: getHeadTransform(mood), transformOrigin: 'center' }}>
      <path d="M 50,70 Q 50,30 80,50 L 80,90 Z" fill="#d97706" />
      <path d="M 150,70 Q 150,30 120,50 L 120,90 Z" fill="#d97706" />
      <ellipse cx="100" cy="120" rx="55" ry="45" fill="#fbbf24" />
      <ellipse cx="100" cy="130" rx="35" ry="25" fill="#fff" />
      {/* Fix: Ensure mood is passed with correct type */}
      <DynamicEyes cx1="80" cx2="120" cy="115" mood={mood as Mood} />
      <circle cx="100" cy="130" r="5" fill="#2d2d2d" />
    </g>
  </svg>
);

export const RetrieverAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="95" fill="#fefce8" />
    <g style={{ transform: getHeadTransform(mood), transformOrigin: 'center' }}>
      <path d="M 50,80 Q 40,120 70,130 Z" fill="#ca8a04" />
      <path d="M 150,80 Q 160,120 130,130 Z" fill="#ca8a04" />
      <circle cx="100" cy="110" r="50" fill="#fde047" />
      {/* Fix: Ensure mood is passed with correct type */}
      <DynamicEyes cx1="85" cx2="115" cy="105" mood={mood as Mood} />
      <path d="M 90,130 Q 100,145 110,130" fill="none" stroke="#2d2d2d" strokeWidth="3" />
    </g>
  </svg>
);

export const HuskyAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="95" fill="#f1f5f9" />
    <g style={{ transform: getHeadTransform(mood), transformOrigin: 'center' }}>
      <path d="M 60,70 L 75,30 L 90,70 Z" fill="#475569" />
      <path d="M 140,70 L 125,30 L 110,70 Z" fill="#475569" />
      <circle cx="100" cy="110" r="50" fill="#94a3b8" />
      <path d="M 70,100 Q 100,70 130,100 Z" fill="#fff" />
      {/* Fix: HuskyAvatar didn't use DynamicEyes previously, but for consistency if added, should be typed. 
          The original code had hardcoded circles. No changes needed to Husky logic unless eyes were replaced. */}
      <circle cx="85" cy="105" r="7" fill="#2d2d2d" />
      <circle cx="115" cy="105" r="7" fill="#2d2d2d" />
      <path d="M 95,135 L 105,135" stroke="#2d2d2d" strokeWidth="4" strokeLinecap="round" />
    </g>
  </svg>
);

export const PugAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="95" fill="#fff7ed" />
    <g style={{ transform: getHeadTransform(mood), transformOrigin: 'center' }}>
      <path d="M 55,90 Q 45,70 70,70" fill="#78350f" />
      <path d="M 145,90 Q 155,70 130,70" fill="#78350f" />
      <circle cx="100" cy="115" r="50" fill="#fdba74" />
      {/* Fix: Ensure mood is passed with correct type */}
      <DynamicEyes cx1="80" cx2="120" cy="110" mood={mood as Mood} />
      <path d="M 85,135 Q 100,150 115,135" fill="none" stroke="#2d2d2d" strokeWidth="4" />
    </g>
  </svg>
);

/* MAIN COMPONENT */

interface AIAvatarProps {
  avatarKey: string;
  aiName: string;
  isLoading?: boolean;
  mood?: Mood;
  isCompact?: boolean;
}

const AIAvatar: React.FC<AIAvatarProps> = ({ avatarKey, mood = 'neutral' }) => {
  const avatars: Record<string, React.FC<AvatarComponentProps>> = {
    human_female_1: FemaleAvatar1,
    human_male_1: MaleAvatar1,
    human_female_2: FemaleAvatar2,
    human_male_2: MaleAvatar2,
    human_female_3: FemaleAvatar3,
    human_male_3: MaleAvatar3,
    dog_shiba_1: ShibaAvatar,
    dog_poodle_1: PoodleAvatar,
    dog_corgi_1: CorgiAvatar,
    dog_retriever_1: RetrieverAvatar,
    dog_husky_1: HuskyAvatar,
    dog_pug_1: PugAvatar,
  };

  const SelectedAvatar = avatars[avatarKey] || FemaleAvatar1;
  return <SelectedAvatar mood={mood} />;
};

export default AIAvatar;
