
// components/AIAvatar.tsx - v2.80 - Expert Insight Edition
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

export const ShibaAvatar: React.FC<AvatarComponentProps> = ({ mood }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood) }}>
        <path d="M 100,160 C 60,160 50,110 50,90 C 50,60 70,40 100,40 C 130,40 150,60 150,90 C 150,110 140,160 100,160 Z" fill="#f6e8d8" stroke="#a16207" strokeWidth="2"/>
        <path d="M 50,80 C 20,80 20,40 55,50 C 60,70 55,80 50,80" fill="#ca8a04" stroke="#854d0e" strokeWidth="2"/>
        <path d="M 150,80 C 180,80 180,40 145,50 C 140,70 145,80 150,80" fill="#ca8a04" stroke="#854d0e" strokeWidth="2"/>
        <g className="transition-all duration-300">
          {mood === 'happy' ? (
            <>
              <path d="M 70,85 Q 80,75 90,85" fill="none" stroke="#27272a" strokeWidth="3" strokeLinecap="round"/>
              <path d="M 110,85 Q 120,75 130,85" fill="none" stroke="#27272a" strokeWidth="3" strokeLinecap="round"/>
            </>
          ) : mood === 'thinking' ? (
            <>
              <ellipse cx="80" cy="85" rx="5" ry="3" fill="#27272a"/>
              <ellipse cx="120" cy="85" rx="5" ry="3" fill="#27272a"/>
            </>
          ) : (
            <>
              <ellipse cx="80" cy="85" rx="7" ry="9" fill="#27272a"/>
              <ellipse cx="120" cy="85" rx="7" ry="9" fill="#27272a"/>
            </>
          )}
        </g>
        <path d={mood === 'happy' ? "M 90,120 Q 100,135 110,120" : "M 95,115 Q 100,110 105,115"} fill="none" stroke="#27272a" strokeWidth="2" strokeLinecap="round"/>
        <path d="M 95,105 C 90,115 110,115 105,105 Q 100,100 95,105 Z" fill="#27272a"/>
    </svg>
);

export const PoodleAvatar: React.FC<AvatarComponentProps> = ({ mood }) => (
     <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood) }}>
        <path d="M100 165c-22.1 0-40-17.9-40-40 0-15 10-30 20-40 10-10 20-15 40-15s30 5 40 15c10 10 20 25 20 40 0 22.1-17.9 40-40 40z" fill="#fffbeb" stroke="#d97706" strokeWidth="2"/>
        <circle cx="100" cy="70" r="35" fill="#fffbeb" stroke="#d97706" strokeWidth="2"/>
        <circle cx="65" cy="75" r="20" fill="#fffbeb" stroke="#d97706" strokeWidth="2"/>
        <circle cx="135" cy="75" r="20" fill="#fffbeb" stroke="#d97706" strokeWidth="2"/>
        <g className="transition-all duration-300">
          {mood === 'happy' ? (
             <>
               <path d="M 75,100 Q 85,90 95,100" fill="none" stroke="#27272a" strokeWidth="3" strokeLinecap="round"/>
               <path d="M 105,100 Q 115,90 125,100" fill="none" stroke="#27272a" strokeWidth="3" strokeLinecap="round"/>
             </>
          ) : (
             <>
               <ellipse cx="85" cy="100" rx="6" ry="8" fill="#27272a"/>
               <ellipse cx="115" cy="100" rx="6" ry="8" fill="#27272a"/>
             </>
          )}
        </g>
        <path d="M97 115a5 5 0 016 0" stroke="#27272a" strokeWidth="2" fill="none" strokeLinecap="round"/>
     </svg>
);

export const CorgiAvatar: React.FC<AvatarComponentProps> = ({ mood }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood) }}>
        <path d="M100 160c-35 0-50-40-50-60 0-30 20-40 50-40s50 10 50 40c0 20 15 60-50 60z" fill="#eab308" stroke="#a16207" strokeWidth="2"/>
        <path d="M65 50 c-20-25 10-40 20-15z M135 50 c20-25 -10-40 -20-15z" fill="#eab308" stroke="#a16207" strokeWidth="2" />
        <path d="M68 50 c0-15 12-15 12-5z M132 50 c0-15 -12-15 -12-5z" fill="#fef3c7"/>
        <g className="transition-all duration-300">
           {mood === 'happy' ? (
             <>
               <path d="M 75,95 Q 85,85 95,95" fill="none" stroke="#27272a" strokeWidth="3" strokeLinecap="round"/>
               <path d="M 105,95 Q 115,85 125,95" fill="none" stroke="#27272a" strokeWidth="3" strokeLinecap="round"/>
             </>
           ) : (
             <>
               <circle cx="85" cy="95" r="7" fill="#27272a"/>
               <circle cx="115" cy="95" r="7" fill="#27272a"/>
             </>
           )}
        </g>
        <path d={mood === 'happy' ? "M 90,120 Q 100,130 110,120" : "M95 110 c5 8 15 8 20 0"} fill="none" stroke="#27272a" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

export const RetrieverAvatar: React.FC<AvatarComponentProps> = ({ mood }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-500" style={{ transform: getHeadTransform(mood) }}>
        <path d="M100 160c-30 0-45-30-45-50 0-30 20-50 45-50s45 20 45 50c0 20 15 50-45 50z" fill="#fcd34d" stroke="#b45309" strokeWidth="2"/>
        <path d="M55 90c-15-5-15-40 0-45 10 5 15 35 0 45z M145 90c15-5 15-40 0-45 -10 5 -15 35 0 45z" fill="#fbbf24" stroke="#b45309" strokeWidth="2"/>
        <path d="M75 110c0-15 50-15 50 0" fill="#fffbeb" />
        <g className="transition-all duration-300">
          {mood === 'happy' ? (
            <>
              <path d="M 70,90 Q 80,80 90,90" fill="none" stroke="#27272a" strokeWidth="3" strokeLinecap="round"/>
              <path d="M 110,90 Q 120,80 130,90" fill="none" stroke="#27272a" strokeWidth="3" strokeLinecap="round"/>
            </>
          ) : (
            <>
              <circle cx="80" cy="90" r="7" fill="#27272a"/>
              <circle cx="120" cy="90" r="7" fill="#27272a"/>
            </>
          )}
        </g>
        <path d="M98 105a3 3 0 014 0" fill="#27272a"/>
    </svg>
);

export const FemaleAvatar1 = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
            <radialGradient id="grad_female1_skin" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor="#fef3f1"/><stop offset="100%" stopColor="#fbe5e0"/></radialGradient>
            <linearGradient id="grad_female1_hair" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#6d4c41"/><stop offset="100%" stopColor="#4e342e"/></linearGradient>
            <linearGradient id="grad_female1_shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff"/><stop offset="100%" stopColor="#e8eaf6"/></linearGradient>
            <linearGradient id="grad_female1_blazer" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#374151"/><stop offset="100%" stopColor="#1f2937"/></linearGradient>
            <radialGradient id="grad_eye_brown" cx="60%" cy="40%" r="70%"><stop offset="0%" stopColor="#a1887f"/><stop offset="50%" stopColor="#6d4c41"/><stop offset="100%" stopColor="#3e2723"/></radialGradient>
        </defs>
        <path d="M40 200 C40 160, 70 140, 100 140 C130 140, 160 160, 160 200 Z" fill="url(#grad_female1_blazer)"/>
        <path d="M85 140 L115 140 L100 165 Z" fill="url(#grad_female1_shirt)"/>
        <rect x="95" y="130" width="10" height="15" fill="url(#grad_female1_skin)"/>
        <circle cx="100" cy="100" r="60" fill="url(#grad_female1_skin)"/>
        <path d="M 30 100 A 70 70 0 0 1 170 100" fill="url(#grad_female1_hair)"/>
        <path d="M 40 130 C 40 80, 70 40, 100 40 C 130 40, 160 80, 160 130 C 140 140, 60 140, 40 130 Z" fill="url(#grad_female1_hair)"/>
        <g>
            <circle cx="75" cy="90" r="12" fill="#fff"/>
            <circle cx="75" cy="90" r="10" fill="url(#grad_eye_brown)"/>
            <circle cx="78" cy="87" r="4" fill="#fff" fillOpacity="0.8"/>
            <circle cx="125" cy="90" r="12" fill="#fff"/>
            <circle cx="125" cy="90" r="10" fill="url(#grad_eye_brown)"/>
            <circle cx="128" cy="87" r="4" fill="#fff" fillOpacity="0.8"/>
        </g>
        <path d="M95 125 Q 100 130 105 125" stroke="#d5bba9" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="60" cy="115" r="8" fill="#fecaca"/>
        <circle cx="140" cy="115" r="8" fill="#fecaca"/>
    </svg>
);

export const MaleAvatar1 = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
            <radialGradient id="grad_male1_skin" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor="#fbebe1"/><stop offset="100%" stopColor="#f8dcc8"/></radialGradient>
            <linearGradient id="grad_male1_hair" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#4e342e"/><stop offset="100%" stopColor="#3e2723"/></linearGradient>
            <linearGradient id="grad_male1_shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff"/><stop offset="100%" stopColor="#e8eaf6"/></linearGradient>
            <linearGradient id="grad_male1_sweater" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#312e81"/><stop offset="100%" stopColor="#1e1b4b"/></linearGradient>
            <radialGradient id="grad_eye_blue" cx="60%" cy="40%" r="70%"><stop offset="0%" stopColor="#a3daff"/><stop offset="50%" stopColor="#4d94ff"/><stop offset="100%" stopColor="#0d47a1"/></radialGradient>
        </defs>
        <path d="M30 200 C30 160, 60 140, 100 140 C140 140, 170 160, 170 200 Z" fill="url(#grad_male1_sweater)"/>
        <path d="M80 140 L120 140 L100 160 Z" fill="url(#grad_male1_shirt)"/>
        <rect x="94" y="130" width="12" height="15" fill="url(#grad_male1_skin)"/>
        <circle cx="100" cy="100" r="60" fill="url(#grad_male1_skin)"/>
        <path d="M 50 100 C 50 60, 70 40, 100 40 C 130 40, 150 60, 150 100" fill="url(#grad_male1_hair)"/>
        <g>
            <circle cx="75" cy="90" r="12" fill="#fff"/>
            <circle cx="75" cy="90" r="10" fill="url(#grad_eye_blue)"/>
            <circle cx="78" cy="87" r="4" fill="#fff" fillOpacity="0.8"/>
            <circle cx="125" cy="90" r="12" fill="#fff"/>
            <circle cx="125" cy="90" r="10" fill="url(#grad_eye_blue)"/>
            <circle cx="128" cy="87" r="4" fill="#fff" fillOpacity="0.8"/>
        </g>
        <path d="M90 125 Q 100 135 110 125" stroke="#d5bba9" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="60" cy="115" r="8" fill="#fecaca"/>
        <circle cx="140" cy="115" r="8" fill="#fecaca"/>
    </svg>
);

export const FemaleAvatar2 = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
            <radialGradient id="grad_female2_skin" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor="#fef3f1"/><stop offset="100%" stopColor="#fbe5e0"/></radialGradient>
            <linearGradient id="grad_female2_hair" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#4a4a4a"/><stop offset="100%" stopColor="#212121"/></linearGradient>
            <linearGradient id="grad_female2_shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a3e635"/><stop offset="100%" stopColor="#65a30d"/></linearGradient>
            <radialGradient id="grad_eye_green" cx="60%" cy="40%" r="70%"><stop offset="0%" stopColor="#b2dfdb"/><stop offset="50%" stopColor="#4db6ac"/><stop offset="100%" stopColor="#00695c"/></radialGradient>
        </defs>
        <path d="M40 200 C40 160, 70 140, 100 140 C130 140, 160 160, 160 200 Z" fill="url(#grad_female2_shirt)"/>
        <rect x="95" y="130" width="10" height="15" fill="url(#grad_female2_skin)"/>
        <circle cx="100" cy="100" r="60" fill="url(#grad_female2_skin)"/>
        <path d="M40 100 C 40 60, 160 60, 160 100 C 160 130, 130 150, 100 150 C 70 150, 40 130, 40 100 Z" fill="url(#grad_female2_hair)"/>
        <path d="M60 40 Q 100 30 140 40" stroke="#666" strokeWidth="2" fill="none"/>
        <g>
            <circle cx="75" cy="95" r="12" fill="#fff"/>
            <circle cx="75" cy="95" r="10" fill="url(#grad_eye_green)"/>
            <circle cx="78" cy="92" r="4" fill="#fff" fillOpacity="0.8"/>
            <circle cx="125" cy="95" r="12" fill="#fff"/>
            <circle cx="125" cy="95" r="10" fill="url(#grad_eye_green)"/>
            <circle cx="128" cy="92" r="4" fill="#fff" fillOpacity="0.8"/>
        </g>
        <path d="M90 130 Q 100 120 110 130" stroke="#d5bba9" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="60" cy="115" r="8" fill="#fecaca"/>
        <circle cx="140" cy="115" r="8" fill="#fecaca"/>
    </svg>
);

export const MaleAvatar2 = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
            <radialGradient id="grad_male2_skin" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor="#fef0e7"/><stop offset="100%" stopColor="#fbdcc6"/></radialGradient>
            <linearGradient id="grad_male2_hair" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#f57c00"/><stop offset="100%" stopColor="#d84315"/></linearGradient>
            <linearGradient id="grad_male2_shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f1f5f9"/><stop offset="100%" stopColor="#e0f2fe"/></linearGradient>
            <linearGradient id="grad_male2_jacket" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0891b2"/><stop offset="100%" stopColor="#0e7490"/></linearGradient>
            <radialGradient id="grad_eye_amber" cx="60%" cy="40%" r="70%"><stop offset="0%" stopColor="#ffe57f"/><stop offset="50%" stopColor="#ffc107"/><stop offset="100%" stopColor="#ff8f00"/></radialGradient>
        </defs>
        <path d="M30 200 C30 160, 60 140, 100 140 C140 140, 170 160, 170 200 Z" fill="url(#grad_male2_jacket)"/>
        <path d="M80 140 L120 140 L120 180 L80 180 Z" fill="url(#grad_male2_shirt)"/>
        <rect x="94" y="130" width="12" height="15" fill="url(#grad_male2_skin)"/>
        <circle cx="100" cy="100" r="60" fill="url(#grad_male2_skin)"/>
        <path d="M 50 100 C 50 60, 70 40, 100 40 C 130 40, 150 60, 150 100" fill="url(#grad_male2_hair)"/>
        <path d="M 80 40 C 90 30, 110 30, 120 40" fill="url(#grad_male2_hair)"/>
        <g>
            <circle cx="75" cy="95" r="12" fill="#fff"/>
            <circle cx="75" cy="95" r="10" fill="url(#grad_eye_amber)"/>
            <circle cx="78" cy="92" r="4" fill="#fff" fillOpacity="0.8"/>
            <circle cx="125" cy="95" r="12" fill="#fff"/>
            <circle cx="125" cy="95" r="10" fill="url(#grad_eye_amber)"/>
            <circle cx="128" cy="92" r="4" fill="#fff" fillOpacity="0.8"/>
        </g>
        <path d="M90 130 C 100 140 110 130, 110 130" stroke="#d5bba9" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="60" cy="115" r="8" fill="#fecaca"/>
        <circle cx="140"cy="115" r="8" fill="#fecaca"/>
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
      case 'human_female_1': return <FemaleAvatar1 />;
      case 'human_male_1': return <MaleAvatar1 />;
      case 'human_female_2': return <FemaleAvatar2 />;
      case 'human_male_2': return <MaleAvatar2 />;
      case 'dog_shiba_1': return <ShibaAvatar mood={mood} />;
      case 'dog_poodle_1': return <PoodleAvatar mood={mood} />;
      case 'dog_corgi_1': return <CorgiAvatar mood={mood} />;
      case 'dog_retriever_1': return <RetrieverAvatar mood={mood} />;
      default: return <FemaleAvatar1 />;
    }
  };

  if (isCompact) {
    return (
      <div className="w-full h-full bg-slate-800 flex items-center justify-center relative overflow-hidden rounded-full shadow-inner">
        <div className="absolute inset-0 bg-grid-slate-700 opacity-20"></div>
        <div className="relative w-full h-full p-1.5 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center transform scale-110">
            {renderAvatar()}
          </div>
        </div>
        {isLoading && (
          <div className="absolute inset-0 bg-sky-500/20 flex items-center justify-center backdrop-blur-[1px]">
             <div className="w-full h-full border-2 border-sky-300 border-t-transparent rounded-full animate-spin opacity-60"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] bg-slate-800 rounded-3xl flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-2xl border border-slate-700">
      <div className="absolute inset-0 bg-grid-slate-700 [mask-image:linear-gradient(0deg,transparent,rgba(0,0,0,0.8))] opacity-50"></div>
      
      <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0 rounded-full border-8 border-slate-700 shadow-2xl mb-8 bg-slate-900 overflow-visible z-10">
        {isLoading && (
          <div className="absolute inset-0 bg-sky-500/20 z-10 flex items-center justify-center backdrop-blur-sm rounded-full">
             <div className="w-24 h-24 border-8 border-sky-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <div className="w-full h-full transform scale-105">
           {renderAvatar()}
        </div>
      </div>
      
      <div className="z-10 text-center">
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">{aiName}</h2>
          <div className="px-4 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full">
            <p className="text-sky-300 text-sm font-bold transition-all duration-300">
                {isLoading ? '考え中...' : mood === 'happy' ? 'しっぽを振っています！' : mood === 'curious' ? '興味津々ですワン' : mood === 'thinking' ? 'じっくり考えています' : '相談受付中'}
            </p>
          </div>
      </div>

      <div className="absolute bottom-6 right-6 text-sm font-mono font-bold text-slate-400 select-none bg-slate-900/50 px-2 py-1 rounded border border-slate-700">
        Ver 2.80
      </div>
    </div>
  );
};

export default AIAvatar;
