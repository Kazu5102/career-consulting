
// components/AIAvatar.tsx - v3.19 - Fixed Layering for Hair Visibility
import React from 'react';

export type Mood = 'neutral' | 'happy' | 'curious' | 'thinking' | 'reassure';

interface AvatarComponentProps {
  mood?: Mood;
}

const getHeadTransform = (mood?: Mood) => {
  if (mood === 'curious') return 'rotate(-8deg)';
  if (mood === 'thinking') return 'rotate(5deg) translateY(2px)';
  return 'none';
};

const DynamicEyes: React.FC<{ cx1: number; cx2: number; cy: number; mood: Mood; color?: string }> = ({ cx1, cx2, cy, mood, color = "#27272a" }) => {
  if (mood === 'happy') {
    return (
      <g stroke={color} strokeWidth="4" fill="none" strokeLinecap="round">
        <path d={`M ${cx1-12},${cy+4} Q ${cx1},${cy-8} ${cx1+12},${cy+4}`} />
        <path d={`M ${cx2-12},${cy+4} Q ${cx2},${cy-8} ${cx2+12},${cy+4}`} />
      </g>
    );
  }
  if (mood === 'reassure') {
    return (
      <g stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8">
        <path d={`M ${cx1-12},${cy} Q ${cx1},${cy+6} ${cx1+12},${cy}`} />
        <path d={`M ${cx2-12},${cy} Q ${cx2},${cy+6} ${cx2+12},${cy}`} />
      </g>
    );
  }
  return (
    <g>
      <circle cx={cx1} cy={cy} r="9" fill={color}/>
      <circle cx={cx2} cy={cy} r="9" fill={color}/>
      <circle cx={cx1-3} cy={cy-3} r="3.5" fill="#fff"/>
      <circle cx={cx2-3} cy={cy-3} r="3.5" fill="#fff"/>
      <circle cx={cx1+3} cy={cy+3} r="1.5" fill="#fff" opacity="0.5"/>
      <circle cx={cx2+3} cy={cy+3} r="1.5" fill="#fff" opacity="0.5"/>
    </g>
  );
};

const DynamicEyebrows: React.FC<{ cx1: number; cx2: number; cy: number; mood: Mood; color?: string }> = ({ cx1, cx2, cy, mood, color = "#4b2c20" }) => {
  const tilt = mood === 'curious' ? -10 : mood === 'thinking' ? 10 : 0;
  return (
    <g stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6">
      <path d={`M ${cx1-12},${cy} Q ${cx1},${cy-3} ${cx1+12},${cy}`} transform={`rotate(${tilt}, ${cx1}, ${cy})`} />
      <path d={`M ${cx2-12},${cy} Q ${cx2},${cy-3} ${cx2+12},${cy}`} transform={`rotate(${-tilt}, ${cx2}, ${cy})`} />
    </g>
  );
};

const DynamicMouth: React.FC<{ cx: number; cy: number; mood: Mood; color?: string }> = ({ cx, cy, mood, color = "#27272a" }) => {
  if (mood === 'happy') {
    return <path d={`M ${cx-15},${cy} Q ${cx},${cy+18} ${cx+15},${cy}`} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" />;
  }
  if (mood === 'thinking') {
    return <path d={`M ${cx-10},${cy+6} Q ${cx},${cy+4} ${cx+10},${cy+6}`} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" />;
  }
  return <path d={`M ${cx-12},${cy+6} Q ${cx},${cy+12} ${cx+12},${cy+6}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />;
};

const DynamicBlush: React.FC<{ cx1: number; cx2: number; cy: number; mood: Mood }> = ({ cx1, cx2, cy, mood }) => (
  <g opacity={mood === 'happy' ? "0.6" : "0.3"}>
    <ellipse cx={cx1} cy={cy} rx="14" ry="8" fill="#fb7185" />
    <ellipse cx={cx2} cy={cy} rx="14" ry="8" fill="#fb7185" />
  </g>
);

const HumanBase: React.FC<{ skin: string; mood: Mood; children: React.ReactNode }> = ({ skin, mood, children }) => (
    <g style={{ transform: getHeadTransform(mood), transformOrigin: 'center 105px', transition: 'all 0.5s ease-out' }}>
        <path d="M 92,145 L 92,175 Q 100,180 108,175 L 108,145 Z" fill={skin} />
        {children}
    </g>
);

export const FemaleAvatar1: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <path d="M 35,200 Q 100,140 165,200 Z" fill="#4ade80" />
        <HumanBase skin="#ffedd5" mood={mood}>
            {/* Back Hair */}
            <path d="M 35,100 C 35,20 165,20 165,100 C 165,150 145,160 100,160 C 55,160 35,150 35,100" fill="#3f2e2e" />
            {/* Face Base */}
            <circle cx="100" cy="100" r="58" fill="#ffedd5" />
            {/* Face Parts */}
            <DynamicEyebrows cx1={80} cx2={120} cy={82} mood={mood} color="#3f2e2e" />
            <DynamicBlush cx1={72} cx2={128} cy={122} mood={mood} />
            <DynamicEyes cx1={82} cx2={118} cy={102} mood={mood} />
            <DynamicMouth cx={100} cy={130} mood={mood} color="#3f2e2e" />
            {/* Front Hair & Accessory (MUST be after Face Base to be visible) */}
            <path d="M 42,85 Q 100,5 158,85 Q 140,75 100,85 Q 60,75 42,85 Z" fill="#3f2e2e" />
            <path d="M 45,95 Q 100,45 155,95 L 155,85 Q 100,35 45,85 Z" fill="#0ea5e9" />
        </HumanBase>
    </svg>
);

export const MaleAvatar1: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <path d="M 30,200 C 30,155 60,145 100,145 S 170,155 170,200 Z" fill="#fb923c" />
        <HumanBase skin="#fef3c7" mood={mood}>
            {/* Hair Base */}
            <path d="M 38,95 C 38,0 162,0 162,95 L 162,120 L 38,120 Z" fill="#1e293b" />
            {/* Face Base */}
            <circle cx="100" cy="105" r="58" fill="#fef3c7" />
            {/* Face Parts */}
            <DynamicEyebrows cx1={80} cx2={120} cy={88} mood={mood} color="#1e293b" />
            <DynamicBlush cx1={72} cx2={128} cy={128} mood={mood} />
            <DynamicEyes cx1={82} cx2={118} cy={108} mood={mood} />
            <g stroke="#0f172a" strokeWidth="2" fill="none" opacity="0.3">
                <circle cx="82" cy="108" r="18" />
                <circle cx="118" cy="108" r="18" />
                <path d="M 96,108 H 104" />
            </g>
            <DynamicMouth cx={100} cy={138} mood={mood} color="#1e293b" />
        </HumanBase>
    </svg>
);

export const FemaleAvatar2: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <path d="M 30,200 Q 100,140 170,200" fill="#f472b6" />
        <HumanBase skin="#fff7ed" mood={mood}>
            {/* Back Hair */}
            <path d="M 35,105 C 35,25 165,25 165,105 C 165,155 140,165 100,165 S 35,155 35,105" fill="#5b21b6" />
            {/* Face Base */}
            <circle cx="100" cy="105" r="58" fill="#fff7ed" />
            {/* Face Parts */}
            <DynamicEyebrows cx1={80} cx2={120} cy={88} mood={mood} color="#4c1d95" />
            <DynamicBlush cx1={72} cx2={128} cy={128} mood={mood} />
            <DynamicEyes cx1={82} cx2={118} cy={108} mood={mood} />
            <DynamicMouth cx={100} cy={138} mood={mood} color="#4c1d95" />
            {/* Front Hair */}
            <path d="M 40,80 Q 80,30 155,90 Q 120,70 40,80 Z" fill="#4c1d95" opacity="0.8" />
            <path d="M 30,100 Q 35,60 55,70" fill="none" stroke="#5b21b6" strokeWidth="6" strokeLinecap="round" />
            <path d="M 170,100 Q 165,60 145,70" fill="none" stroke="#5b21b6" strokeWidth="6" strokeLinecap="round" />
        </HumanBase>
    </svg>
);

export const MaleAvatar2: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <path d="M 25,200 C 25,160 55,150 100,150 S 175,160 175,200 Z" fill="#38bdf8" />
        <HumanBase skin="#ffedd5" mood={mood}>
            {/* Hair Base */}
            <path d="M 35,100 Q 100,-10 165,100 L 165,120 Q 100,110 35,120 Z" fill="#0f172a" />
            {/* Face Base */}
            <circle cx="100" cy="105" r="58" fill="#ffedd5" />
            {/* Face Parts */}
            <DynamicEyebrows cx1={80} cx2={120} cy={88} mood={mood} color="#0f172a" />
            <DynamicBlush cx1={72} cx2={128} cy={128} mood={mood} />
            <DynamicEyes cx1={82} cx2={118} cy={108} mood={mood} />
            <DynamicMouth cx={100} cy={138} mood={mood} color="#0f172a" />
            {/* Top Hair Spike */}
            <path d="M 70,60 Q 100,10 130,60" fill="#0f172a" />
        </HumanBase>
    </svg>
);

export const FemaleAvatar3: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <path d="M 25,200 Q 100,155 175,200" fill="#a8a29e" />
        <HumanBase skin="#fef3c7" mood={mood}>
            {/* Hair Bun */}
            <circle cx="100" cy="45" r="28" fill="#57534e" />
            {/* Hair Base */}
            <path d="M 38,105 C 38,35 162,35 162,105 C 162,155 100,165 38,105" fill="#57534e" />
            {/* Face Base */}
            <circle cx="100" cy="105" r="58" fill="#fef3c7" />
            {/* Face Parts */}
            <g stroke="#27272a" strokeWidth="2.5" fill="none" opacity="0.4">
                <rect x="65" y="100" width="28" height="24" rx="4" />
                <rect x="107" y="100" width="28" height="24" rx="4" />
                <path d="M 93,112 H 107" />
            </g>
            <DynamicEyebrows cx1={80} cx2={120} cy={88} mood={mood} color="#57534e" />
            <DynamicBlush cx1={72} cx2={128} cy={130} mood={mood} />
            <DynamicEyes cx1={79} cx2={121} cy={112} mood={mood} />
            <DynamicMouth cx={100} cy={142} mood={mood} color="#27272a" />
            {/* Bangs */}
            <path d="M 45,90 Q 100,45 155,90 Q 100,80 45,90 Z" fill="#44403c" opacity="0.9" />
        </HumanBase>
    </svg>
);

export const MaleAvatar3: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <path d="M 25,200 L 175,200 L 100,150 Z" fill="#475569" />
        <HumanBase skin="#fffbeb" mood={mood}>
            {/* Hair Base */}
            <path d="M 40,105 C 40,30 160,30 160,105" fill="#1e293b" />
            {/* Top Hair Volume */}
            <ellipse cx="100" cy="55" rx="60" ry="30" fill="#475569" />
            {/* Face Base */}
            <circle cx="100" cy="105" r="58" fill="#fffbeb" />
            {/* Face Parts */}
            <DynamicEyebrows cx1={80} cx2={120} cy={88} mood={mood} color="#1e293b" />
            <DynamicBlush cx1={72} cx2={128} cy={128} mood={mood} />
            <DynamicEyes cx1={82} cx2={118} cy={108} mood={mood} />
            <DynamicMouth cx={100} cy={140} mood={mood} color="#1e293b" />
            {/* Front Fringe */}
            <path d="M 50,85 Q 100,40 150,85" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
        </HumanBase>
    </svg>
);

export const ShibaAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood) }}>
        <path d="M 100,160 C 60,160 50,110 50,90 C 50,60 70,40 100,40 C 130,40 150,60 150,90 C 150,110 140,160 100,160 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="2.5"/>
        <path d="M 50,80 C 20,80 20,40 55,50 C 60,70 55,80 50,80" fill="#f59e0b" stroke="#b45309" strokeWidth="2.5"/>
        <path d="M 150,80 C 180,80 180,40 145,50 C 140,70 145,80 150,80" fill="#f59e0b" stroke="#b45309" strokeWidth="2.5"/>
        {/* FIX: Cast string to Mood type */}
        <DynamicEyes cx1={80} cx2={120} cy={90} mood={mood as Mood} />
        <DynamicBlush cx1={70} cx2={130} cy={105} mood={mood as Mood} />
        <path d="M 90,115 C 85,125 115,125 110,115 Q 100,110 90,115 Z" fill="#27272a"/>
        <DynamicMouth cx={100} cy={135} mood={mood as Mood} />
    </svg>
);

export const PoodleAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
     <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood) }}>
        <circle cx="100" cy="115" r="55" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="2.5"/>
        <circle cx="100" cy="65" r="40" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="2.5"/>
        <circle cx="55" cy="75" r="25" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="2.5"/>
        <circle cx="145" cy="75" r="25" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="2.5"/>
        {/* FIX: Cast string to Mood type */}
        <DynamicEyes cx1={85} cx2={115} cy={100} mood={mood as Mood} />
        <DynamicBlush cx1={75} cx2={125} cy={115} mood={mood as Mood} />
        <circle cx="100" cy="118" r="6" fill="#27272a" />
        <DynamicMouth cx={100} cy={132} mood={mood as Mood} />
     </svg>
);

export const CorgiAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood) }}>
        <path d="M 100,165 C 65,165 50,125 50,105 C 50,75 70,65 100,65 S 150,75 150,105 C 150,125 135,165 100,165 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="2.5"/>
        <path d="M 60,45 L 45,25 C 40,35 50,55 60,45 Z M 140,45 L 155,25 C 160,35 150,55 140,45 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="2.5" />
        {/* FIX: Cast string to Mood type */}
        <DynamicEyes cx1={85} cx2={115} cy={95} mood={mood as Mood} />
        <DynamicBlush cx1={70} cx2={130} cy={110} mood={mood as Mood} />
        <ellipse cx="100" cy="115" rx="7" ry="5" fill="#27272a"/>
        <DynamicMouth cx={100} cy={128} mood={mood as Mood} />
    </svg>
);

export const RetrieverAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood) }}>
        <path d="M 100,160 C 70,160 55,130 55,110 C 55,80 75,60 100,60 S 145,80 145,110 C 145,130 130,160 100,160 Z" fill="#fde68a" stroke="#d97706" strokeWidth="2.5"/>
        <path d="M 55,80 C 40,75 35,40 50,35 C 60,40 65,70 55,80 Z M 145,80 C 160,75 165,40 150,35 C 140,40 135,70 145,80 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2.5"/>
        {/* FIX: Cast string to Mood type */}
        <DynamicEyes cx1={82} cx2={118} cy={90} mood={mood as Mood} />
        <DynamicBlush cx1={70} cx2={130} cy={105} mood={mood as Mood} />
        <DynamicMouth cx={100} cy={112} mood={mood as Mood} />
    </svg>
);

export const HuskyAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood) }}>
        <path d="M 100,165 C 60,165 45,135 45,105 C 45,70 70,50 100,50 S 155,70 155,105 C 155,135 140,165 100,165 Z" fill="#94a3b8" stroke="#334155" strokeWidth="2.5"/>
        <path d="M 100,165 C 75,165 65,150 65,120 S 75,85 100,85 S 135,95 135,120 S 125,165 100,165 Z" fill="#f8fafc"/>
        <path d="M 60,40 L 48,15 L 50,45 Z M 140,40 L 152,15 L 150,45 Z" fill="#475569" stroke="#1e293b" strokeWidth="2.5" />
        {/* FIX: Cast string to Mood type */}
        <DynamicEyes cx1={82} cx2={118} cy={88} mood={mood as Mood} />
        <DynamicMouth cx={100} cy={112} mood={mood as Mood} color="#1e293b" />
    </svg>
);

export const PugAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood) }}>
        <circle cx="100" cy="110" r="58" fill="#e7d5c0" stroke="#78350f" strokeWidth="2.5"/>
        <path d="M 55,65 C 40,55 30,80 40,100 Z M 145,65 C 160,55 170,80 160,100 Z" fill="#451a03"/>
        {/* FIX: Cast string to Mood type */}
        <DynamicEyes cx1={78} cx2={122} cy={95} mood={mood as Mood} />
        <DynamicBlush cx1={70} cx2={130} cy={110} mood={mood as Mood} />
        <DynamicMouth cx={100} cy={120} mood={mood as Mood} />
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
  const renderAvatar = () => {
    switch (avatarKey) {
      case 'human_female_1': return <FemaleAvatar1 mood={mood} />;
      case 'human_male_1': return <MaleAvatar1 mood={mood} />;
      case 'human_female_2': return <FemaleAvatar2 mood={mood} />;
      case 'human_male_2': return <MaleAvatar2 mood={mood} />;
      case 'human_female_3': return <FemaleAvatar3 mood={mood} />;
      case 'human_male_3': return <MaleAvatar3 mood={mood} />;
      case 'dog_shiba_1': return <ShibaAvatar mood={mood} />;
      case 'dog_poodle_1': return <PoodleAvatar mood={mood} />;
      case 'dog_corgi_1': return <CorgiAvatar mood={mood} />;
      case 'dog_retriever_1': return <RetrieverAvatar mood={mood} />;
      case 'dog_husky_1': return <HuskyAvatar mood={mood} />;
      case 'dog_pug_1': return <PugAvatar mood={mood} />;
      default: return <FemaleAvatar1 mood={mood} />;
    }
  };

  if (isCompact) {
    return (
      <div className="w-full h-full bg-rose-50 flex items-center justify-center relative overflow-hidden rounded-full shadow-inner border border-rose-200/50">
        <div className="absolute inset-0 bg-grid-slate-200/20 opacity-20"></div>
        <div className="relative w-full h-full p-1 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center transform scale-[1.3] lg:scale-[1.5]">
            {renderAvatar()}
          </div>
        </div>
        {isLoading && (
          <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center backdrop-blur-[1px]">
             <div className="w-full h-full border-4 border-rose-400 border-t-transparent rounded-full animate-spin opacity-60"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] bg-white rounded-3xl flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-2xl border border-slate-200">
      <div className="absolute inset-0 bg-grid-slate-100 opacity-50"></div>
      
      <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0 rounded-full border-8 border-rose-50 shadow-2xl mb-8 bg-rose-50/30 overflow-visible z-10">
        {isLoading && (
          <div className="absolute inset-0 bg-rose-500/10 z-10 flex items-center justify-center backdrop-blur-sm rounded-full">
             <div className="w-24 h-24 border-8 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <div className="w-full h-full transform scale-105">
           {renderAvatar()}
        </div>
      </div>
      
      <div className="z-10 text-center">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">{aiName}</h2>
          <div className="px-4 py-1.5 bg-rose-500/5 border border-rose-500/20 rounded-full">
            <p className="text-rose-700 text-sm font-bold transition-all duration-300">
                {isLoading ? '解析中...' : mood === 'happy' ? '心を込めてサポートします' : mood === 'curious' ? 'あなたのことを知りたいです' : mood === 'thinking' ? '丁寧に向き合っています' : 'あなたのペースで大丈夫です'}
            </p>
          </div>
      </div>

      <div className="absolute bottom-6 right-6 text-sm font-mono font-bold text-slate-300 select-none bg-white px-2 py-1 rounded border border-slate-100">
        Ver 3.19
      </div>
    </div>
  );
};

export default AIAvatar;
