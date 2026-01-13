
import React from 'react';

interface Props {
  children?: React.ReactNode;
  cameraX?: number; // Shifts the "camera" perspective
}

export const Environment = ({ children, cameraX = 0 }: Props) => {
  // Infinite scrolling logic:
  // The background position moves opposite to cameraX.
  
  // Parallax factors
  const cloudSpeed = 0.2;
  const groundSpeed = 1.0;
  
  // Cloud offset
  const cloudOffset = (cameraX * cloudSpeed) % 2000;

  // Dynamic Marker Generation
  // We want to generate markers (Trees, Rocks) that exist in the world relative to cameraX.
  // We render visible markers based on a window around cameraX.
  const MARKER_SPACING = 400; // Space between objects
  const visibleCount = 8; // How many to render at once (enough to cover screen + buffer)
  const currentChunk = Math.floor(cameraX / MARKER_SPACING);
  
  const markers = [];
  for (let i = currentChunk - 2; i < currentChunk + visibleCount; i++) {
      const xPos = i * MARKER_SPACING;
      // Simple pseudo-random using index to decide type
      const type = Math.abs(i) % 3; 
      markers.push(
        <div 
            key={i} 
            className="absolute bottom-8 origin-bottom transition-transform duration-75"
            style={{ 
                left: 0, 
                // We position them in the world. The parent container moves by -cameraX.
                transform: `translateX(${xPos}px) translateZ(0)` 
            }}
        >
           {type === 0 ? (
               // Pine Tree
               <div className="flex flex-col items-center">
                   <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[60px] border-b-emerald-800 -mb-8 relative z-10" />
                   <div className="w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-b-[70px] border-b-emerald-700 -mb-8 relative z-0" />
                   <div className="w-4 h-10 bg-amber-900" />
               </div>
           ) : type === 1 ? (
               // Bush
               <div className="flex items-end">
                  <div className="w-10 h-10 bg-green-600 rounded-full" />
                  <div className="w-8 h-8 bg-green-500 rounded-full -ml-4" />
               </div>
           ) : (
               // Rock
               <div className="w-12 h-8 bg-slate-400 rounded-full border-b-4 border-slate-500" />
           )}
        </div>
      );
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-100">
      {/* Sky */}
      <div className="absolute top-0 w-full h-[60%] sky-gradient overflow-hidden">
        {/* Clouds Layer 1 */}
        <div className="absolute inset-0" style={{ transform: `translateX(${-cloudOffset}px)` }}>
           <div className="absolute top-10 left-[10%] opacity-40"><Cloud size={100} /></div>
           <div className="absolute top-24 left-[50%] opacity-30"><Cloud size={80} /></div>
           <div className="absolute top-40 left-[80%] opacity-20"><Cloud size={120} /></div>
        </div>
        {/* Duplicate Cloud Loop */}
         <div className="absolute inset-0" style={{ transform: `translateX(${-cloudOffset + 2000}px)` }}>
           <div className="absolute top-10 left-[10%] opacity-40"><Cloud size={100} /></div>
           <div className="absolute top-24 left-[50%] opacity-30"><Cloud size={80} /></div>
           <div className="absolute top-40 left-[80%] opacity-20"><Cloud size={120} /></div>
        </div>
      </div>
      
      {/* Ground with Infinite Grid */}
      <div 
         className="absolute bottom-0 w-full h-[40%] ground-grid shadow-inner-strong perspective-container"
         style={{ 
             // Move background position. The pattern repeats automatically.
             backgroundPosition: `${-cameraX * groundSpeed}px center` 
         }}
      >
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-100/50 to-transparent" />
      </div>

      {/* 3D Stage - Objects move relative to camera */}
      {/* The container is shifted by -cameraX. World objects must be placed at their absolute X. */}
      <div className="absolute inset-0 perspective-container flex items-center justify-center pointer-events-none">
        <div className="preserve-3d relative w-full h-full" style={{ transform: `translateX(${-cameraX}px)` }}>
           {/* Render Markers in World Space */}
           {markers}
           {/* Render Children (The Physics Objects) */}
           {children}
        </div>
      </div>
    </div>
  );
};

const Cloud = ({ size }: { size: number }) => (
  <svg width={size} viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.5,19c-3.037,0-5.5-2.463-5.5-5.5c0-0.345,0.034-0.682,0.1-1.009C10.644,9.454,8.197,7.5,5.5,7.5 c-3.037,0-5.5,2.463-5.5,5.5c0,3.037,2.463,5.5,5.5,5.5H17.5z"/>
    <path d="M17.5,19c3.037,0,5.5-2.463,5.5-5.5s-2.463-5.5-5.5-5.5c-0.21,0-0.416,0.014-0.619,0.041 c-0.89-3.793-4.293-6.541-8.381-6.541c-3.32,0-6.223,1.808-7.781,4.536C0.472,6.547,0.239,7.009,0.069,7.5H5.5 c2.697,0,5.144,1.954,6.6,4.991C12.134,12.818,12.1,13.155,12.1,13.5c0,3.037,2.463,5.5,5.5,5.5H17.5z" opacity="0.6"/>
  </svg>
);
