import React, { useMemo } from 'react';
import { AIType } from '../types';
import { ASSISTANTS } from '../config/aiAssistants';

interface AvatarSelection {
    type: AIType;
    avatarKey: string;
}

interface AvatarSelectionViewProps {
  onSelect: (selection: AvatarSelection) => void;
}

const AvatarSelectionView: React.FC<AvatarSelectionViewProps> = ({ onSelect }) => {
  const selectedAssistants = useMemo(() => {
    const humanAssistants = ASSISTANTS.filter(a => a.type === 'human');
    const dogAssistants = ASSISTANTS.filter(a => a.type === 'dog');

    const selectedHuman = humanAssistants.length > 0
        ? humanAssistants[Math.floor(Math.random() * humanAssistants.length)]
        : null;
    
    const selectedDog = dogAssistants.length > 0
        ? dogAssistants[Math.floor(Math.random() * dogAssistants.length)]
        : null;
    
    return { human: selectedHuman, dog: selectedDog };
  }, []); // Empty dependency array ensures this runs only once per component mount.


  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">相談相手を選んでください</h1>
        <p className="mt-2 text-slate-600">どちらのアシスタントと話したいですか？</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Human Avatar Card */}
        {selectedAssistants.human && (
          <button 
            onClick={() => onSelect({ type: 'human', avatarKey: selectedAssistants.human!.id })}
            className="w-full max-w-xs flex flex-col items-center bg-white p-6 rounded-2xl shadow-lg border border-slate-200 transition-all duration-300 hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-300 group"
          >
            <div className="w-32 h-32 mb-4 rounded-full overflow-hidden bg-slate-200">
              {selectedAssistants.human.avatarComponent}
            </div>
            <h3 className="text-xl font-bold text-slate-800">AIコンサルタント</h3>
            <p className="text-slate-600 mt-2 text-center h-16">丁寧な対話で、あなたの考えを整理するお手伝いをします。</p>
            <div className="mt-4 w-full px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md group-hover:bg-sky-700 transition-colors">
              このアシスタントと話す
            </div>
          </button>
        )}

        {/* Dog Avatar Card */}
        {selectedAssistants.dog && (
          <button 
            onClick={() => onSelect({ type: 'dog', avatarKey: selectedAssistants.dog!.id })}
            className="w-full max-w-xs flex flex-col items-center bg-white p-6 rounded-2xl shadow-lg border border-slate-200 transition-all duration-300 hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-300 group"
          >
            <div className="w-32 h-32 mb-4 rounded-full overflow-hidden bg-slate-200">
              {selectedAssistants.dog.avatarComponent}
            </div>
            <h3 className="text-xl font-bold text-slate-800">キャリア相談わんこ</h3>
            <p className="text-slate-600 mt-2 text-center h-16">元気な対話で、あなたに寄り添い、励まします。</p>
            <div className="mt-4 w-full px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md group-hover:bg-sky-700 transition-colors">
              このアシスタントと話す
            </div>
          </button>
        )}

      </div>
    </div>
  );
};

export default AvatarSelectionView;