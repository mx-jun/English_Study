import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import { Visualizer } from './components/Visualizer';
import { LanguageSelector, LanguageConfig } from './components/LanguageSelector';
import { Notebook } from './components/Notebook';

const STORAGE_KEY = 'linguaflow_config';
const NOTEBOOK_KEY = 'linguaflow_notebook';

const DEFAULT_CONFIG: LanguageConfig = {
  language: 'English',
  level: 'Beginner',
  topic: 'Daily Conversation'
};

const App: React.FC = () => {
  const [config, setConfig] = useState<LanguageConfig>(DEFAULT_CONFIG);
  const [hasSavedConfig, setHasSavedConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'notebook'>('settings');
  const [savedPhrases, setSavedPhrases] = useState<string[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load Config
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setHasSavedConfig(true);
      try {
        setConfig(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
    
    const savedNotes = localStorage.getItem(NOTEBOOK_KEY);
    if (savedNotes) {
      try {
        setSavedPhrases(JSON.parse(savedNotes));
      } catch (e) { console.error(e); }
    }
  }, []);

  const handleConfigChange = (newConfig: LanguageConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    setHasSavedConfig(true);
  };

  const loadSavedConfig = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }
  };
  
  const savePhrase = (text: string) => {
    if (!savedPhrases.includes(text)) {
      const updated = [text, ...savedPhrases];
      setSavedPhrases(updated);
      localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(updated));
    }
  };

  const removePhrase = (text: string) => {
    const updated = savedPhrases.filter(p => p !== text);
    setSavedPhrases(updated);
    localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(updated));
  };

  const systemInstruction = useMemo(() => {
    return `You are a friendly, patient, and native English language tutor. 
    The user is a ${config.level} level learner who may speak Chinese. 
    Your goal is to have a natural conversation about "${config.topic}". 
    
    Guidelines:
    1. Speak clearly and at a pace appropriate for a ${config.level} learner.
    2. Correct significant grammar or vocabulary mistakes gently, then encourage them to try again or move on.
    3. Ask open-ended questions to keep the user talking.
    4. If the user struggles, switch briefly to Chinese to explain, then back to English.
    5. Keep your responses relatively concise (under 3 sentences) to allow a back-and-forth dialogue.
    6. Start the conversation by introducing yourself and the topic in English.`;
  }, [config]);

  const voiceName = useMemo(() => {
     return 'Zephyr';
  }, []);

  const { isActive, isConnecting, error, connect, disconnect, volume, transcriptions, clearTranscriptions } = useGeminiLive({
    systemInstruction,
    voiceName
  });

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions]);

  // Auto-switch to notebook when connected
  useEffect(() => {
    if (isActive) {
        setActiveTab('notebook');
    }
  }, [isActive]);

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100 shrink-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
               <i className="fa-solid fa-microphone-lines text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">LinguaFlow</h1>
              <p className="text-xs text-indigo-500 font-medium">AI Language Partner</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isActive && (
               <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold animate-pulse">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Connected to English Tutor
               </div>
            )}
            <button 
              onClick={clearTranscriptions}
              className="text-gray-400 hover:text-gray-600 text-xs font-medium transition-colors"
              title="Clear transcript history"
            >
              Clear Log
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-2 sm:px-4 py-4 flex flex-col lg:flex-row gap-4 sm:gap-8 overflow-hidden">
        
        {/* Left Panel */}
        <div className={`w-full lg:w-1/3 flex flex-col gap-4 transition-all duration-300 ${isActive ? 'lg:opacity-100' : 'opacity-100'} overflow-hidden`}>
           {/* Hero Card */}
           <div className={`bg-indigo-600 text-white p-4 sm:p-6 rounded-2xl shadow-xl shadow-indigo-200 relative overflow-hidden shrink-0 ${isActive ? 'hidden lg:block' : 'block'}`}>
              <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                  <i className="fa-solid fa-comments text-9xl"></i>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Practice English</h2>
              <p className="text-indigo-100 mb-4 sm:mb-6 text-xs sm:text-sm">Real-time voice immersion with immediate feedback.</p>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                 <div className="bg-white/10 p-2 sm:p-3 rounded-xl">
                    <p className="text-[10px] uppercase tracking-wider text-indigo-200 font-bold mb-1">Level</p>
                    <span className="text-xs sm:text-sm font-semibold">{config.level}</span>
                 </div>
                 <div className="bg-white/10 p-2 sm:p-3 rounded-xl">
                    <p className="text-[10px] uppercase tracking-wider text-indigo-200 font-bold mb-1">Topic</p>
                    <span className="text-xs sm:text-sm font-semibold truncate block">{config.topic}</span>
                 </div>
              </div>

              {hasSavedConfig && !isActive && !isConnecting && (
                <button 
                  onClick={loadSavedConfig}
                  className="mt-4 sm:mt-6 w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-2 group"
                >
                  <i className="fa-solid fa-clock-rotate-left group-hover:rotate-[-45deg] transition-transform"></i>
                  Restore Last Session
                </button>
              )}
           </div>

           {/* Tab Switcher */}
           <div className="flex p-1 bg-gray-200/50 rounded-xl shrink-0">
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${activeTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Settings
              </button>
              <button 
                onClick={() => setActiveTab('notebook')}
                className={`flex-1 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${activeTab === 'notebook' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Notebook
                {savedPhrases.length > 0 && (
                   <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-[10px]">{savedPhrases.length}</span>
                )}
              </button>
           </div>

           {/* Dynamic Content (Settings or Notebook) */}
           <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
             {activeTab === 'settings' ? (
                 <LanguageSelector 
                   config={config} 
                   onChange={handleConfigChange} 
                   disabled={isActive || isConnecting}
                 />
             ) : (
                 <Notebook 
                   phrases={savedPhrases} 
                   onRemove={removePhrase}
                   className="h-full" 
                 />
             )}
           </div>

           {/* Connection Controls */}
           <div className="w-full shrink-0 pt-2">
               {error && (
                    <div className="mb-2 p-2 bg-red-50 text-red-600 text-[10px] rounded-xl text-center border border-red-100 shadow-sm">
                        <i className="fa-solid fa-circle-exclamation mr-2"></i>
                        {error}
                    </div>
                )}
                
                {!isActive ? (
                    <button
                      onClick={connect}
                      disabled={isConnecting}
                      className="w-full py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl font-bold text-base sm:text-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      {isConnecting ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            <span>Preparing...</span>
                          </>
                      ) : (
                          <>
                            <i className="fa-solid fa-play"></i>
                            <span>Start Practice</span>
                          </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={disconnect}
                      className="w-full py-3 sm:py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-base sm:text-lg shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      <i className="fa-solid fa-stop"></i>
                      <span>Stop Session</span>
                    </button>
                  )}
           </div>
        </div>

        {/* Live Interaction & Transcript (Right) */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col flex-1 min-h-0">
             
             {/* Visualizer Header */}
             <div className="p-3 sm:p-6 border-b border-gray-50 flex items-center justify-center bg-gray-50/50 shrink-0">
                <div className="w-full max-w-sm flex flex-col items-center">
                    <div className="relative mb-2 sm:mb-4">
                       <div className={`w-16 h-16 sm:w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-inner ${isActive ? 'bg-indigo-50 scale-110' : 'bg-gray-100'}`}>
                          <i className={`fa-solid fa-graduation-cap text-2xl sm:text-3xl transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}></i>
                       </div>
                       {isActive && (
                         <div className="absolute -inset-2 rounded-full border-2 border-indigo-500 opacity-20 animate-ping"></div>
                       )}
                    </div>
                    <div className="h-12 w-full flex items-center justify-center">
                       {isActive ? (
                         <Visualizer volume={volume} isActive={isActive} />
                       ) : (
                         <span className="text-gray-400 text-[10px] sm:text-xs font-medium bg-gray-100 px-4 py-1.5 rounded-full">
                           Mic ready
                         </span>
                       )}
                    </div>
                </div>
             </div>

             {/* Transcript Area */}
             <div 
               ref={scrollRef}
               className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 scroll-smooth scrollbar-hide bg-white"
             >
                {transcriptions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-8">
                    <i className="fa-solid fa-microphone-slash text-3xl sm:text-4xl mb-3 sm:mb-4 text-gray-300"></i>
                    <p className="text-xs sm:text-sm font-medium">Conversation log will appear here.</p>
                  </div>
                ) : (
                  transcriptions.map((entry) => (
                    <div 
                      key={entry.id} 
                      className={`flex flex-col ${entry.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div 
                        className={`max-w-[90%] sm:max-w-[85%] px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs sm:text-sm shadow-sm ${
                          entry.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'
                        }`}
                      >
                        {entry.text}
                      </div>
                      <div className="flex items-center gap-2 mt-1 px-1">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-tighter">
                            {entry.role === 'user' ? 'You' : 'Tutor'}
                          </span>
                          <button 
                            onClick={() => savePhrase(entry.text)}
                            className={`text-gray-300 hover:text-indigo-500 transition-colors ${savedPhrases.includes(entry.text) ? 'text-indigo-500' : ''}`}
                            title="Save to Notebook"
                          >
                             <i className={`${savedPhrases.includes(entry.text) ? 'fa-solid' : 'fa-regular'} fa-bookmark text-xs`}></i>
                          </button>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>
          
          <div className="shrink-0 pb-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold text-center">
                Powered by Gemini 2.5 Flash
              </p>
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;