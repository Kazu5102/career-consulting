
import React, { useState } from 'react';
import ShareIconIOS from './icons/ShareIconIOS';
import PlusCircleIcon from './icons/PlusCircleIcon';
import MenuIcon from './icons/MenuIcon';
import MobileIcon from './icons/MobileIcon';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'iphone' | 'android' | 'pc'>('iphone');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[400] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 text-sky-600 rounded-xl">
                <MobileIcon className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">アプリとして保存する</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="flex border-b border-slate-100">
            <button 
                onClick={() => setActiveTab('iphone')} 
                className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'iphone' ? 'text-sky-600 border-b-2 border-sky-600 bg-sky-50' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                iPhone / iPad
            </button>
            <button 
                onClick={() => setActiveTab('android')} 
                className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'android' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                Android
            </button>
             <button 
                onClick={() => setActiveTab('pc')} 
                className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'pc' ? 'text-slate-800 border-b-2 border-slate-800 bg-slate-50' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                パソコン
            </button>
        </div>
        
        <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto">
            {activeTab === 'iphone' && (
                <div className="space-y-6">
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-sm text-amber-900 leading-relaxed">
                        <span className="font-bold block mb-1">⚠️ 重要: ボタンが見つからない場合</span>
                        LINEやYahoo!などのアプリ内で開いていませんか？<br/>
                        まずは画面の右下や右上にあるコンパス等のアイコンを押し、<span className="font-bold underline">「Safariで開く」</span>を選択してください。
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center flex-shrink-0">1</div>
                        <div>
                            <p className="font-bold text-slate-800 mb-2">画面下の中央にある「共有ボタン」をタップします。</p>
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-xl border border-slate-200">
                                <ShareIconIOS className="w-6 h-6 text-sky-600" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center flex-shrink-0">2</div>
                        <div>
                            <p className="font-bold text-slate-800 mb-2">メニューを少し下にスクロールし、「ホーム画面に追加」を選択します。</p>
                            <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 text-sm font-bold text-slate-700">
                                <PlusCircleIcon className="w-5 h-5" />
                                ホーム画面に追加
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center flex-shrink-0">3</div>
                        <div>
                            <p className="font-bold text-slate-800">右上の「追加」をタップして完了です。</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'android' && (
                <div className="space-y-6">
                     <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-sm text-emerald-900 leading-relaxed">
                        <span className="font-bold block mb-1">推奨ブラウザ</span>
                        Google Chromeでの操作を推奨します。<br/>
                        メニューが見つからない場合は、Chromeで開き直してください。
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center flex-shrink-0">1</div>
                        <div>
                            <p className="font-bold text-slate-800 mb-2">画面右上のメニューアイコンをタップします。</p>
                             <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-xl border border-slate-200">
                                <MenuIcon className="w-6 h-6 text-slate-600" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center flex-shrink-0">2</div>
                        <div>
                            <p className="font-bold text-slate-800 mb-2">「アプリをインストール」または「ホーム画面に追加」を選択します。</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center flex-shrink-0">3</div>
                        <div>
                            <p className="font-bold text-slate-800">確認画面で「インストール」または「追加」をタップして完了です。</p>
                        </div>
                    </div>
                </div>
            )}

             {activeTab === 'pc' && (
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center flex-shrink-0">1</div>
                        <div>
                            <p className="font-bold text-slate-800 mb-2">ブラウザのアドレスバー右端にある「インストール」アイコンをクリックします。</p>
                            <div className="p-3 bg-slate-100 rounded-xl inline-block text-xs text-slate-500">
                                URL欄の右端: <span className="font-bold text-slate-800">[↓]</span> または <span className="font-bold text-slate-800">[⊕]</span>
                            </div>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center flex-shrink-0">2</div>
                        <div>
                            <p className="font-bold text-slate-800 mb-2">表示されない場合は、メニューから「保存して共有」→「インストール」を選択します。</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-4">※これにより、Chromeのアイコンではなく、専用のアプリショートカットが作成されます。</p>
                </div>
            )}
        </div>
        
        <footer className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <button onClick={onClose} className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 transition-all">
                閉じる
            </button>
        </footer>
      </div>
    </div>
  );
};

export default InstallGuideModal;
