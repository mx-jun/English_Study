
import React from 'react';

export interface LanguageConfig {
  language: string;
  level: string;
  topic: string;
}

interface LanguageSelectorProps {
  config: LanguageConfig;
  onChange: (config: LanguageConfig) => void;
  disabled: boolean;
}

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const TOPICS = [
    'Daily Conversation',
    'Travel & Directions',
    'Food & Ordering',
    'Business & Work',
    'Hobbies & Interests'
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ config, onChange, disabled }) => {
  
  const update = (key: keyof LanguageConfig, value: string) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 w-full">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
        <i className="fa-solid fa-sliders text-indigo-500"></i>
        <span>Session Settings</span>
      </h2>
      
      <div className="space-y-3 sm:space-y-4">
        {/* Level Selection */}
        <div>
          <label className="block text-[10px] sm:text-sm font-medium text-gray-600 mb-1">Proficiency Level</label>
          <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => update('level', lvl)}
                disabled={disabled}
                className={`flex-1 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-md transition-all ${
                  config.level === lvl
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Selection */}
        <div>
           <label className="block text-[10px] sm:text-sm font-medium text-gray-600 mb-1">Topic</label>
           <select 
             value={config.topic}
             onChange={(e) => update('topic', e.target.value)}
             disabled={disabled}
             className="w-full p-2 sm:p-2.5 rounded-lg border border-gray-200 text-[10px] sm:text-sm bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
           >
               {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
           </select>
        </div>
      </div>
    </div>
  );
};
