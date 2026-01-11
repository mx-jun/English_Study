import React from 'react';

interface VisualizerProps {
  volume: number; // 0 to 100
  isActive: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ volume, isActive }) => {
  // Create 5 bars
  const bars = Array.from({ length: 5 });

  return (
    <div className="flex items-center justify-center space-x-2 h-32 w-full">
      {bars.map((_, i) => {
        // Calculate a varied height based on volume and index to create a wave effect
        // When not active, flat line
        // When active but quiet, small movement
        // When loud, big movement
        
        const isCenter = i === 2;
        const isMiddle = i === 1 || i === 3;
        
        let heightMod = 10; // Default min height px
        
        if (isActive) {
            // Apply volume
            // Center bar moves the most
            const scale = isCenter ? 1 : (isMiddle ? 0.7 : 0.4);
            const dynamicHeight = Math.max(10, (volume * 2) * scale);
            // Add some jitter only if there is volume
            const jitter = volume > 5 ? Math.random() * 20 : 0;
            heightMod = Math.min(120, dynamicHeight + jitter); 
        }

        return (
          <div
            key={i}
            className={`w-6 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full transition-all duration-75 ease-in-out`}
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