
// components/AIAvatar.tsx - v3.71 - Visual Perfection & Natural Hairline
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

// Fixed semicolon to comma in destructuring
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

const HumanBase: React.FC<{ skin: string; mood: Mood; children: React.ReactNode; backHair?: React.ReactNode; bangs?: React.ReactNode; bodyColor?: string }> = ({ skin, mood, children, backHair, bangs, bodyColor = "#475569" }) => (
    <g>
        <path d="M 45,200 C 45,170 65,155 100,155 S 155,170 155,200 Z" fill={bodyColor} />
        <g style={{ transform: getHeadTransform(mood), transformOrigin: 'center 110px', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            {backHair}
            <path d="M 92,130 L 88,165 L 112,165 L 108,130 Z" fill={skin} />
            <circle cx="53" cy="115" r="9" fill={skin} />
            <circle cx="147" cy="115" r="9" fill={skin} />
            <rect x="52" y="65" width="96" height="85" rx="42" fill={skin} />
            <g opacity="0.15">
                <path d="M 52,85 Q 100,75 148,85 L 148,65 Q 100,55 52,65 Z" fill="#000" />
            </g>
            {bangs}
            {children}
        </g>
    </g>
);

export const FemaleAvatar1: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <HumanBase 
          skin="#fee2e2" 
          mood={mood as Mood}
          bodyColor="#94a3b8"
          backHair={<path d="M 30,105 C 30,5 170,5 170,105 L 170,140 Q 170,155 140,155 L 60,155 Q 30,155 30,140 Z" fill="#0ea5e9" />}
          bangs={<path d="M 52,80 C 52,30 148,30 148,80 Q 120,95 100,95 Q 80,95 52,80 Z" fill="#0ea5e9" />}
        >
            <DynamicEyes cx1={82} cx2={118} cy={118} mood={mood as Mood} color="#1e293b" />
            <FaceDetails mood={mood as Mood} />
        </HumanBase>
    </svg>
);

export const MaleAvatar1: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <HumanBase 
          skin="#fef3c7" 
          mood={mood as Mood}
          bodyColor="#334155"
          backHair={<path d="M 45,95 C 45,25 155,25 155,95 L 155,115 Q 100,110 45,115 Z" fill="#1e293b" />}
          bangs={<path d="M 52,85 C 52,35 148,35 148,85 Q 130,95 100,95 Q 70,95 52,85 Z" fill="#1e293b" />}
        >
            <DynamicEyes cx1={82} cx2={118} cy={122} mood={mood as Mood} />
            <FaceDetails mood={mood as Mood} />
        </HumanBase>
    </svg>
);

export const FemaleAvatar2: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <HumanBase 
          skin="#fff7ed" 
          mood={mood as Mood}
          bodyColor="#f472b6"
          backHair={<path d="M 28,110 Q 15,195 100,200 S 185,195 172,110 C 172,5 28,5 28,110 Z" fill="#6d28d9" />}
          bangs={<path d="M 52,82 C 52,35 148,35 148,82 Q 120,105 100,105 Q 80,105 52,82 Z" fill="#6d28d9" />}
        >
            <DynamicEyes cx1={82} cx2={118} cy={118} mood={mood as Mood} color="#2e1065" />
            <FaceDetails mood={mood as Mood} />
        </HumanBase>
    </svg>
);

export const MaleAvatar2: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <HumanBase 
          skin="#ffedd5" 
          mood={mood as Mood}
          bodyColor="#0284c7"
          backHair={<path d="M 45,100 C 45,25 155,25 155,100 L 155,120 Q 100,110 45,120 Z" fill="#1e1b4b" />}
          bangs={<path d="M 50,85 C 50,35 150,35 150,85 Q 130,98 100,98 Q 70,98 50,85 Z" fill="#1e1b4b" />}
        >
            <g stroke="#1e1b4b" strokeWidth="2" fill="none" opacity="0.8">
                <rect x="70" y="112" width="23" height="16" rx="2" />
                <rect x="107" y="112" width="23" height="16" rx="2" />
                <path d="M 93,120 H 107" />
            </g>
            <DynamicEyes cx1={81} cx2={119} cy={120} mood={mood as Mood} color="#1e1b4b" />
            <FaceDetails mood={mood as Mood} />
        </HumanBase>
    </svg>
);

export const FemaleAvatar3: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <HumanBase 
          skin="#fef3c7" 
          mood={mood as Mood}
          bodyColor="#57534e"
          backHair={
            <g fill="#44403c">
              <circle cx="100" cy="40" r="30" />
              <path d="M 38,100 C 38,25 162,25 162,100 L 162,130 Q 100,120 38,130 Z" />
            </g>
          }
          bangs={<path d="M 52,85 C 52,40 148,40 148,85 Q 100,105 52,85 Z" fill="#44403c" />}
        >
            <DynamicEyes cx1={82} cx2={118} cy={120} mood={mood as Mood} color="#27272a" />
            <FaceDetails mood={mood as Mood} />
        </HumanBase>
    </svg>
);

export const MaleAvatar3: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <HumanBase 
          skin="#fffbeb" 
          mood={mood as Mood}
          bodyColor="#334155"
          backHair={<path d="M 45,100 C 45,25 155,25 155,100 L 155,130 Q 100,120 45,130 Z" fill="#334155" />}
          bangs={<path d="M 52,85 C 52,40 148,40 148,85 Q 100,102 52,85 Z" fill="#334155" />}
        >
            <DynamicEyes cx1={82} cx2={118} cy={122} mood={mood as Mood} color="#1e293b" />
            <FaceDetails mood={mood as Mood} />
        </HumanBase>
    </svg>
);

export const ShibaAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood as Mood) }}>
        <path d="M 100,160 C 60,160 50,110 50,90 C 50,60 70,40 100,40 C 130,40 150,60 150,90 C 150,110 140,160 100,160 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="2.5"/>
        <path d="M 50,80 C 20,80 20,40 55,50 C 60,70 55,80 50,80" fill="#f59e0b" stroke="#b45309" strokeWidth="2.5"/>
        <path d="M 150,80 C 180,80 180,40 145,50 C 140,70 145,80 150,80" fill="#f59e0b" stroke="#b45309" strokeWidth="2.5"/>
        <DynamicEyes cx1={80} cx2={120} cy={90} mood={mood as Mood} />
        <ellipse cx="100" cy="115" rx="7" ry="5" fill="#27272a"/>
        <path d="M 90,135 Q 100,145 110,135" fill="none" stroke="#27272a" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const PoodleAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
     <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood as Mood) }}>
        <circle cx="100" cy="115" r="55" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="2.5"/>
        <circle cx="100" cy="65" r="40" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="2.5"/>
        <circle cx="55" cy="75" r="25" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="2.5"/>
        <circle cx="145" cy="75" r="25" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="2.5"/>
        <DynamicEyes cx1={85} cx2={115} cy={100} mood={mood as Mood} />
        <circle cx="100" cy="118" r="6" fill="#27272a" />
        <path d="M 92,132 Q 100,140 108,132" fill="none" stroke="#27272a" strokeWidth="2" strokeLinecap="round" />
     </svg>
);

export const CorgiAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood as Mood) }}>
        <path d="M 100,165 C 65,165 50,125 50,105 C 50,75 70,65 100,65 S 150,75 150,105 C 150,125 135,165 100,165 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="2.5"/>
        <path d="M 60,45 L 45,25 C 40,35 50,55 60,45 Z M 140,45 L 155,25 C 160,35 150,55 140,45 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="2.5" />
        <DynamicEyes cx1={85} cx2={115} cy={95} mood={mood as Mood} />
        <ellipse cx="100" cy="115" rx="7" ry="5" fill="#27272a"/>
        <path d="M 90,130 Q 100,140 110,130" fill="none" stroke="#27272a" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const RetrieverAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood as Mood) }}>
        <path d="M 100,160 C 70,160 55,130 55,110 C 55,80 75,60 100,60 S 145,80 145,110 C 145,130 130,160 100,160 Z" fill="#fde68a" stroke="#d97706" strokeWidth="2.5"/>
        <path d="M 55,80 C 40,75 35,40 50,35 C 60,40 65,70 55,80 Z M 145,80 C 160,75 165,40 150,35 C 140,40 135,70 145,80 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2.5"/>
        <DynamicEyes cx1={82} cx2={118} cy={90} mood={mood as Mood} />
        <path d="M 90,115 Q 100,125 110,115" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const HuskyAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood as Mood) }}>
        <path d="M 100,165 C 60,165 45,135 45,105 C 45,70 70,50 100,50 S 155,70 155,105 C 155,135 140,165 100,165 Z" fill="#94a3b8" stroke="#334155" strokeWidth="2.5"/>
        <path d="M 100,165 C 75,165 65,150 65,120 S 75,85 100,85 S 135,95 135,120 S 125,165 100,165 Z" fill="#f8fafc"/>
        <path d="M 60,40 L 48,15 L 50,45 Z M 140,40 L 152,15 L 150,45 Z" fill="#475569" stroke="#1e293b" strokeWidth="2.5" />
        <DynamicEyes cx1={82} cx2={118} cy={88} mood={mood as Mood} />
        <path d="M 92,115 Q 100,122 108,115" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const PugAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood as Mood) }}>
        <circle cx="100" cy="110" r="58" fill="#e7d5c0" stroke="#78350f" strokeWidth="2.5"/>
        <path d="M 55,65 C 40,55 30,80 40,100 Z M 145,65 C 160,55 170,80 160,100 Z" fill="#451a03"/>
        <DynamicEyes cx1={78} cx2={122} cy={95} mood={mood as Mood} />
        <path d="M 93,122 Q 100,130 107,122" fill="none" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

interface AIAvatarProps {
  avatarKey: string;
  aiName: string;
  isLoading: boolean;
  mood?: Mood;
  isCompact?: boolean;
}

const AIAvatar: React.FC<AIAvatarProps> = ({ avatarKey, aiName, isLoading, mood = 'neutral', isCompact = false }) => {
  const activeMood: Mood = (mood as Mood) || 'neutral';

  const renderAvatar = () => {
    switch (avatarKey) {
      case 'human_female_1': return <FemaleAvatar1 mood={activeMood} />;
      case 'human_male_1': return <MaleAvatar1 mood={activeMood} />;
      case 'human_female_2': return <FemaleAvatar2 mood={activeMood} />;
      case 'human_male_2': return <MaleAvatar2 mood={activeMood} />;
      case 'human_female_3': return <FemaleAvatar3 mood={activeMood} />;
      case 'human_male_3': return <MaleAvatar3 mood={activeMood} />;
      case 'dog_shiba_1': return <ShibaAvatar mood={activeMood} />;
      case 'dog_poodle_1': return <PoodleAvatar mood={activeMood} />;
      case 'dog_corgi_1': return <CorgiAvatar mood={activeMood} />;
      case 'dog_retriever_1': return <RetrieverAvatar mood={activeMood} />;
      case 'dog_husky_1': return <HuskyAvatar mood={activeMood} />;
      case 'dog_pug_1': return <PugAvatar mood={activeMood} />;
      default: return <FemaleAvatar1 mood={activeMood} />;
    }
  };

  if (isCompact) {
    return (
      <div className="w-full h-full bg-white/80 flex items-center justify-center relative overflow-hidden rounded-full shadow-inner border border-white/50">
        <div className="relative w-full h-full flex items-center justify-center transform scale-[1.3]">
            {renderAvatar()}
        </div>
        {isLoading && (
          <div className="absolute inset-0 bg-sky-400/10 flex items-center justify-center">
             <div className="w-full h-full border-4 border-sky-400 border-t-transparent rounded-full animate-spin opacity-40"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] bg-white rounded-3xl flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-2xl border border-slate-100">
      <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0 rounded-full border-8 border-slate-50 shadow-2xl mb-8 bg-slate-50/20 overflow-visible z-10">
        {isLoading && (
          <div className="absolute inset-0 bg-sky-500/5 z-10 flex items-center justify-center backdrop-blur-sm rounded-full">
             <div className="w-24 h-24 border-8 border-sky-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <div className="w-full h-full transform scale-110">
           {renderAvatar()}
        </div>
      </div>
      
      <div className="z-10 text-center">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">{aiName}</h2>
          <div className="px-4 py-1.5 bg-sky-500/5 border border-sky-500/10 rounded-full">
            <p className="text-sky-700 text-sm font-bold transition-all duration-300">
                {isLoading ? '解析中...' : activeMood === 'happy' ? '心を込めてサポートします' : activeMood === 'curious' ? 'あなたのことを知りたいです' : activeMood === 'thinking' ? '丁寧に向き合っています' : 'あなたのペースで大丈夫です'}
            </p>
          </div>
      </div>

      <div className="absolute bottom-6 right-6 text-sm font-sans font-bold text-slate-200 select-none bg-white/80 px-2 py-1 rounded">
        Ver 3.71
      </div>
    </div>
  );
};

export default AIAvatar;
