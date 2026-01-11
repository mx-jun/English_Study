
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

const LANGUAGES = [
  { id: 'English', label: 'English 🇺🇸', voice: 'Zephyr' }, // Primary Default
  { id: 'Spanish', label: 'Spanish 🇪🇸', voice: 'Puck' },
  { id: 'French', label: 'French 🇫🇷', voice: 'Charon' },
  { id: 'German', label: 'German 🇩🇪', voice: 'Fenrir' },
  { id: 'Japanese', label: 'Japanese 🇯🇵', voice: 'Kore' },
];

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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <i className="fa-solid fa-sliders text-indigo-500"></i>
        <span>Session Settings</span>
      </h2>
      
      <div className="space-y-4">
        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Target Language</label>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => update('language', lang.id)}
                disabled={disabled}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  config.language === lang.id
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Level Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Proficiency Level</label>
          <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => update('level', lvl)}
                disabled={disabled}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
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
           <label className="block text-sm font-medium text-gray-600 mb-1">Topic</label>
           <select 
             value={config.topic}
             onChange={(e) => update('topic', e.target.value)}
             disabled={disabled}
             className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
           >
               {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
           </select>
        </div>
      </div>
    </div>
  );
};
