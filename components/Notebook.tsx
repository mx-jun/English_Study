import React from 'react';

interface NotebookProps {
  phrases: string[];
  onRemove: (text: string) => void;
  className?: string;
}

export const Notebook: React.FC<NotebookProps> = ({ phrases, onRemove, className }) => {
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col w-full ${className}`}>
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <i className="fa-solid fa-book-bookmark text-indigo-500"></i>
        <span>Study Notebook</span>
      </h2>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar min-h-[200px]">
        {phrases.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-4">
            <i className="fa-regular fa-bookmark text-2xl mb-2 opacity-50"></i>
            <p className="text-sm">Save phrases from the conversation to review them here.</p>
          </div>
        ) : (
          phrases.map((phrase, idx) => (
            <div key={idx} className="group relative flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed pr-6">{phrase}</p>
              <button 
                onClick={() => onRemove(phrase)}
                className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors"
                title="Remove"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};