import React from 'react';

interface VisualizerProps {
  volume: number; // 0 to 100
  isActive: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ volume, isActive }) => {
  // Create 5 bars
  const bars = Array.from({ length: 5 });

  return (
    <div className="flex items-center justify-center space-x-1.5 h-16 w-full">
      {bars.map((_, i) => {
        const isCenter = i === 2;
        const isMiddle = i === 1 || i === 3;
        
        let heightMod = 6; // Default min height px
        
        if (isActive) {
            const scale = isCenter ? 1 : (isMiddle ? 0.7 : 0.4);
            const dynamicHeight = Math.max(6, (volume * 1) * scale);
            const jitter = volume > 5 ? Math.random() * 10 : 0;
            heightMod = Math.min(60, dynamicHeight + jitter); 
        }

        return (
          <div
            key={i}
            className={`w-4 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full transition-all duration-75 ease-in-out`}
            style={{ 
                height: `${heightMod}px`,
                opacity: isActive ? 1 : 0.3 
            }}
          />
        );
      })}
    </div>
  );
};