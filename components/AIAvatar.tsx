
// components/AIAvatar.tsx - v4.02 - Refined Female Avatar 3
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
        <path d={`M ${cx1-12},${cy+4} Q ${cx1},${cy-7} ${cx1+12},${cy+4}`} />
        <path d={`M ${cx2-13},${cy+5} Q ${cx2},${cy-10} ${cx2+13},${cy+5}`} />
      </g>
    );
  }
  if (mood === 'reassure') {
    return (
      <g stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8">
        <path d={`M ${cx1-12},${cy} Q ${cx1},${cy+5} ${cx1+12},${cy}`} />
        <path d={`M ${cx2-11},${cy+1} Q ${cx2},${cy+8} ${cx2+11},${cy+1}`} />
      </g>
    );
  }
  return (
    <g>
      <circle cx={cx1} cy={cy} r="9" fill={color}/>
      <circle cx={cx2} cy={cy} r="9.3" fill={color}/>
      <circle cx={cx1-3.2} cy={cy-3.2} r="3.5" fill="#fff"/>
      <circle cx={cx2-1.2} cy={cy-4.2} r="4" fill="#fff"/>
      <circle cx={cx1+3.8} cy={cy+3.2} r="1.6" fill="#fff" opacity="0.3"/>
      <circle cx={cx2-1} cy={cy+4} r="1.2" fill="#fff" opacity="0.5"/>
    </g>
  );
};

const DynamicEyebrows: React.FC<{ cx1: number; cx2: number; cy: number; mood: Mood; color?: string }> = ({ cx1, cx2, cy, mood, color = "#4b2c20" }) => {
  const tilt = mood === 'curious' ? -10 : mood === 'thinking' ? 10 : 0;
  return (
    <g stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.75">
      <path d={`M ${cx1-13},${cy} Q ${cx1},${cy-4} ${cx1+13},${cy}`} transform={`rotate(${tilt}, ${cx1}, ${cy})`} />
      <path d={`M ${cx2-13},${cy-1} Q ${cx2},${cy-5} ${cx2+13},${cy-1}`} transform={`rotate(${-tilt}, ${cx2}, ${cy})`} />
    </g>
  );
};

const DynamicMouth: React.FC<{ cx: number; cy: number; mood: Mood; color?: string }> = ({ cx, cy, mood, color = "#27272a" }) => {
  if (mood === 'happy') {
    return <path d={`M ${cx-15},${cy} Q ${cx},${cy+18} ${cx+15},${cy}`} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />;
  }
  if (mood === 'thinking') {
    return <path d={`M ${cx-10},${cy+6} Q ${cx},${cy+4} ${cx+10},${cy+6}`} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />;
  }
  return <path d={`M ${cx-12},${cy+6} Q ${cx},${cy+12} ${cx+12},${cy+6}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />;
};

const DynamicBlush: React.FC<{ cx1: number; cx2: number; cy: number; mood: Mood }> = ({ cx1, cx2, cy, mood }) => (
  <g opacity={mood === 'happy' ? "0.6" : "0.3"}>
    <ellipse cx={cx1} cy={cy} rx="14" ry="8" fill="#fb7185" />
    <ellipse cx={cx2} cy={cy} rx="14" ry="8" fill="#fb7185" />
  </g>
);

const HumanBase: React.FC<{ skin: string; mood: Mood; backHair?: React.ReactNode; body?: React.ReactNode; children: React.ReactNode }> = ({ skin, mood, backHair, body, children }) => (
    <g style={{ transform: getHeadTransform(mood), transformOrigin: '100px 110px', transition: 'all 0.5s ease-out' }}>
        {/* Layer 1: Body/Shoulders (Deeper than neck) */}
        {body}
        {/* Layer 2: Back Hair */}
        {backHair}
        {/* Layer 3: Neck (Tapered) */}
        <path d="M 88,145 L 82,185 Q 100,195 118,185 L 112,145 Z" fill={skin} opacity="0.9" />
        <path d="M 88,145 L 82,155 Q 100,165 118,155 L 112,145" fill="none" stroke="#000" strokeWidth="0.5" opacity="0.1" />
        {/* Layer 4: Face (Tapered Anatomical Contour) */}
        <path d="M 52,90 C 52,55 74,40 100,40 C 126,40 148,55 148,90 C 148,125 125,155 100,155 C 75,155 52,125 52,90" fill={skin} />
        {children}
    </g>
);

const HairGradient: React.FC<{ id: string; color1: string; color2: string }> = ({ id, color1, color2 }) => (
    <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
        </linearGradient>
    </defs>
);

export const FemaleAvatar1: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <HairGradient id="grad_f1" color1="#3d2b1f" color2="#1e140d" />
        <HumanBase skin="#ffedd5" mood={mood as Mood} 
            body={<path d="M 40,200 Q 100,155 160,200 Z" fill="#475569" />}
            backHair={
                <path d="M 35,90 C 35,20 165,20 165,90 L 165,160 Q 100,185 35,160 Z" fill="url(#grad_f1)" />
            }>
            <DynamicEyebrows cx1={80} cx2={120} cy={82} mood={mood as Mood} color="#2d1d1d" />
            <DynamicBlush cx1={75} cx2={125} cy={122} mood={mood as Mood} />
            <DynamicEyes cx1={82} cx2={118} cy={102} mood={mood as Mood} />
            <DynamicMouth cx={100} cy={135} mood={mood as Mood} />
            {/* Front Fringe with strands */}
            <path d="M 40,95 Q 65,35 110,55 Q 155,75 160,105 L 160,85 Q 140,30 100,30 Q 60,30 40,85 Z" fill="url(#grad_f1)" />
            <path d="M 42,90 Q 55,50 85,55" fill="none" stroke="#ffffff22" strokeWidth="2" strokeLinecap="round" />
        </HumanBase>
    </svg>
);

export const MaleAvatar1: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <HairGradient id="grad_m1" color1="#27272a" color2="#09090b" />
        <HumanBase skin="#fef3c7" mood={mood as Mood}
            body={<path d="M 30,200 C 30,165 60,155 100,155 S 170,165 170,200 Z" fill="#1e293b" />}
            backHair={
                <path d="M 45,90 C 45,30 155,30 155,90 L 155,120 Q 100,110 45,120 Z" fill="url(#grad_m1)" />
            }>
            <DynamicEyebrows cx1={80} cx2={120} cy={82} mood={mood as Mood} color="#1e293b" />
            <DynamicBlush cx1={75} cx2={125} cy={125} mood={mood as Mood} />
            <DynamicEyes cx1={82} cx2={118} cy={105} mood={mood as Mood} />
            <DynamicMouth cx={100} cy={138} mood={mood as Mood} />
            {/* Spiky professional top */}
            <path d="M 48,85 Q 100,15 152,85" fill="none" stroke="url(#grad_m1)" strokeWidth="18" strokeLinecap="round" />
            <path d="M 60,65 Q 100,25 140,65" fill="none" stroke="#ffffff11" strokeWidth="4" strokeLinecap="round" />
        </HumanBase>
    </svg>
);

export const FemaleAvatar2: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Growth Catalyst: Professional Voluminous Waves */}
        <HairGradient id="grad_f2" color1="#5b21b6" color2="#2e1065" />
        <HumanBase skin="#fff7ed" mood={mood as Mood}
            body={<path d="M 25,200 Q 100,150 175,200" fill="#be185d" opacity="0.8" />}
            backHair={
                <g fill="url(#grad_f2)">
                    <path d="M 30,100 C 30,20 170,20 170,100 C 170,140 185,185 150,190 Q 100,200 50,190 C 15,185 30,140 30,100 Z" />
                    {/* Wavy accents */}
                    <path d="M 35,120 Q 10,150 25,185" fill="none" stroke="url(#grad_f2)" strokeWidth="14" strokeLinecap="round" />
                    <path d="M 165,120 Q 190,150 175,185" fill="none" stroke="url(#grad_f2)" strokeWidth="14" strokeLinecap="round" />
                </g>
            }>
            <DynamicEyebrows cx1={80} cx2={120} cy={82} mood={mood as Mood} color="#4c1d95" />
            <DynamicBlush cx1={75} cx2={125} cy={125} mood={mood as Mood} />
            <DynamicEyes cx1={82} cx2={118} cy={105} mood={mood as Mood} />
            <DynamicMouth cx={100} cy={138} mood={mood as Mood} />
            {/* Elegant front wave */}
            <path d="M 45,90 Q 75,30 120,60 Q 165,90 175,85" fill="none" stroke="url(#grad_f2)" strokeWidth="18" strokeLinecap="round" />
            <path d="M 172,90 Q 145,55 90,45 Q 45,55 35,100" fill="none" stroke="url(#grad_f2)" strokeWidth="10" strokeLinecap="round" opacity="0.6" />
        </HumanBase>
    </svg>
);

export const MaleAvatar2: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <HairGradient id="grad_m2" color1="#1e1b4b" color2="#020617" />
        <HumanBase skin="#ffedd5" mood={mood as Mood}
            body={<path d="M 35,200 C 35,165 65,155 100,155 S 165,165 165,200 Z" fill="#0369a1" />}
            backHair={
                <path d="M 48,95 Q 100,20 152,95 L 152,130 Q 100,115 48,130 Z" fill="url(#grad_m2)" />
            }>
            <DynamicEyebrows cx1={80} cx2={120} cy={82} mood={mood as Mood} color="#1e1b4b" />
            <DynamicBlush cx1={75} cx2={125} cy={125} mood={mood as Mood} />
            <DynamicEyes cx1={82} cx2={118} cy={105} mood={mood as Mood} />
            <g stroke="#1e1b4b" strokeWidth="2" fill="none" opacity="0.6">
                <rect x="68" y="102" width="28" height="18" rx="3" />
                <rect x="104" y="102" width="28" height="18" rx="3" />
                <path d="M 96,111 H 104" />
            </g>
            <DynamicMouth cx={100} cy={140} mood={mood as Mood} />
            <path d="M 52,80 Q 100,15 148,80" fill="none" stroke="url(#grad_m2)" strokeWidth="18" strokeLinecap="round" />
        </HumanBase>
    </svg>
);

export const FemaleAvatar3: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <HairGradient id="grad_f3" color1="#44403c" color2="#1c1917" />
        <HumanBase skin="#fef3c7" mood={mood as Mood}
            body={<path d="M 30,200 Q 100,160 170,200 L 170,200 L 30,200 Z" fill="#78716c" />}
            backHair={
                <g>
                    {/* Sophisticated Long Hair */}
                    <path d="M 25,100 C 25,10 175,10 175,100 C 175,160 185,180 160,195 Q 100,210 40,195 C 15,180 25,160 25,100 Z" fill="url(#grad_f3)" />
                </g>
            }>
            <DynamicEyebrows cx1={80} cx2={120} cy={82} mood={mood as Mood} color="#27272a" />
            <DynamicBlush cx1={75} cx2={125} cy={130} mood={mood as Mood} />
            <DynamicEyes cx1={82} cx2={118} cy={110} mood={mood as Mood} />
            <DynamicMouth cx={100} cy={142} mood={mood as Mood} />
            {/* Elegant Side-swept Bangs */}
            <path d="M 30,120 Q 20,40 100,35 Q 180,40 170,120 L 165,120 Q 160,60 100,55 Q 40,60 35,120 Z" fill="url(#grad_f3)" />
            {/* Hair Shine */}
            <path d="M 40,70 Q 70,40 110,45" fill="none" stroke="#ffffff15" strokeWidth="3" strokeLinecap="round" />
        </HumanBase>
    </svg>
);

export const MaleAvatar3: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <HairGradient id="grad_m3" color1="#334155" color2="#0f172a" />
        <HumanBase skin="#fffbeb" mood={mood as Mood}
            body={<path d="M 30,200 L 170,200 L 100,155 Z" fill="#334155" />}
            backHair={
                <path d="M 48,100 C 48,30 152,30 152,100 L 152,135 Q 100,120 48,135 Z" fill="url(#grad_m3)" />
            }>
            <DynamicEyebrows cx1={80} cx2={120} cy={82} mood={mood as Mood} color="#0f172a" />
            <DynamicBlush cx1={75} cx2={125} cy={125} mood={mood as Mood} />
            <DynamicEyes cx1={82} cx2={118} cy={105} mood={mood as Mood} />
            <DynamicMouth cx={100} cy={140} mood={mood as Mood} />
            <path d="M 55,80 Q 100,30 145,80" fill="none" stroke="url(#grad_m3)" strokeWidth="22" strokeLinecap="round" />
            <path d="M 65,70 Q 100,40 135,70" fill="none" stroke="#ffffff11" strokeWidth="6" strokeLinecap="round" />
        </HumanBase>
    </svg>
);

export const ShibaAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood as Mood) }}>
        <path d="M 100,160 C 60,160 50,110 50,90 C 50,60 70,40 100,40 C 130,40 150,60 150,90 C 150,110 140,160 100,160 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="2.5"/>
        <path d="M 50,80 C 20,80 20,40 55,50 C 60,70 55,80 50,80" fill="#f59e0b" stroke="#b45309" strokeWidth="2.5"/>
        <path d="M 150,80 C 180,80 180,40 145,50 C 140,70 145,80 150,80" fill="#f59e0b" stroke="#b45309" strokeWidth="2.5"/>
        <DynamicEyes cx1={80} cx2={120} cy={90} mood={mood as Mood} />
        <DynamicBlush cx1={70} cx2={130} cy={105} mood={mood as Mood} />
        <path d="M 90,115 C 85,125 115,125 110,115 Q 100,110 90,115 Z" fill="#27272a"/>
        <DynamicMouth cx={100} cy={135} mood={mood as Mood} />
    </svg>
);

export const PoodleAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
     <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood as Mood) }}>
        <circle cx="100" cy="115" r="55" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="2.5"/>
        <circle cx="100" cy="65" r="40" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="2.5"/>
        <circle cx="55" cy="75" r="25" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="2.5"/>
        <circle cx="145" cy="75" r="25" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="2.5"/>
        <DynamicEyes cx1={85} cx2={115} cy={100} mood={mood as Mood} />
        <DynamicBlush cx1={75} cx2={125} cy={115} mood={mood as Mood} />
        <circle cx="100" cy="118" r="6" fill="#27272a" />
        <DynamicMouth cx={100} cy={132} mood={mood as Mood} />
     </svg>
);

export const CorgiAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood as Mood) }}>
        <path d="M 100,165 C 65,165 50,125 50,105 C 50,75 70,65 100,65 S 150,75 150,105 C 150,125 135,165 100,165 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="2.5"/>
        <path d="M 60,45 L 45,25 C 40,35 50,55 60,45 Z M 140,45 L 155,25 C 160,35 150,55 140,45 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="2.5" />
        <DynamicEyes cx1={85} cx2={115} cy={95} mood={mood as Mood} />
        <DynamicBlush cx1={70} cx2={130} cy={110} mood={mood as Mood} />
        <ellipse cx="100" cy="115" rx="7" ry="5" fill="#27272a"/>
        <DynamicMouth cx={100} cy={128} mood={mood as Mood} />
    </svg>
);

export const RetrieverAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood as Mood) }}>
        <path d="M 100,160 C 70,160 55,130 55,110 C 55,80 75,60 100,60 S 145,80 145,110 C 145,130 130,160 100,160 Z" fill="#fde68a" stroke="#d97706" strokeWidth="2.5"/>
        <path d="M 55,80 C 40,75 35,40 50,35 C 60,40 65,70 55,80 Z M 145,80 C 160,75 165,40 150,35 C 140,40 135,70 145,80 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2.5"/>
        <DynamicEyes cx1={82} cx2={118} cy={90} mood={mood as Mood} />
        <DynamicBlush cx1={70} cx2={130} cy={105} mood={mood as Mood} />
        <DynamicMouth cx={100} cy={112} mood={mood as Mood} />
    </svg>
);

export const HuskyAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood as Mood) }}>
        <path d="M 100,165 C 60,165 45,135 45,105 C 45,70 70,50 100,50 S 155,70 155,105 C 155,135 140,165 100,165 Z" fill="#94a3b8" stroke="#334155" strokeWidth="2.5"/>
        <path d="M 100,165 C 75,165 65,150 65,120 S 75,85 100,85 S 135,95 135,120 S 125,165 100,165 Z" fill="#f8fafc"/>
        <path d="M 60,40 L 48,15 L 50,45 Z M 140,40 L 152,15 L 150,45 Z" fill="#475569" stroke="#1e293b" strokeWidth="2.5" />
        <DynamicEyes cx1={82} cx2={118} cy={88} mood={mood as Mood} />
        <DynamicMouth cx={100} cy={112} mood={mood as Mood} color="#1e293b" />
    </svg>
);

export const PugAvatar: React.FC<AvatarComponentProps> = ({ mood = 'neutral' }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood as Mood) }}>
        <circle cx="100" cy="110" r="58" fill="#e7d5c0" stroke="#78350f" strokeWidth="2.5"/>
        <path d="M 55,65 C 40,55 30,80 40,100 Z M 145,65 C 160,55 170,80 160,100 Z" fill="#451a03"/>
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
                {isLoading ? '解析中...' : activeMood === 'happy' ? '心を込めてサポートします' : activeMood === 'curious' ? 'あなたのことを知りたいです' : activeMood === 'thinking' ? '丁寧に向き合っています' : 'あなたのペースで大丈夫です'}
            </p>
          </div>
      </div>

      <div className="absolute bottom-6 right-6 text-sm font-mono font-bold text-slate-300 select-none bg-white px-2 py-1 rounded border border-slate-100">
        Ver 4.02
      </div>
    </div>
  );
};

export default AIAvatar;
