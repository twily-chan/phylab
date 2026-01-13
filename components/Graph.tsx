
import React, { useState } from 'react';

interface Props {
  data: { x: number; y: number }[];
  color: string;
  label: string;
  xLabel: string;
  yLabel: string;
}

export const Graph = ({ data, color, label, xLabel, yLabel }: Props) => {
  const [hover, setHover] = useState<{x:number, y:number} | null>(null);
  
  if (!data || data.length < 2) return (
    <div className="h-64 flex items-center justify-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl">
      WAITING FOR DATA...
    </div>
  );

  let minX = data[0].x;
  let maxX = data[data.length - 1].x;
  
  const yValues = data.map(d => d.y);
  let minY = Math.min(...yValues);
  let maxY = Math.max(...yValues);

  // Fix: Handle constant values (flat line)
  if (Math.abs(maxY - minY) < 0.0001) {
    minY -= 1;
    maxY += 1;
  }

  // Add padding to Y axis so the line isn't touching the edges
  const rangeY = maxY - minY;
  const paddingY = rangeY * 0.1;
  const renderMinY = minY - paddingY;
  const renderMaxY = maxY + paddingY;
  const renderRangeY = renderMaxY - renderMinY;

  const normalizeX = (val: number) => ((val - minX) / (maxX - minX)) * 100;
  const normalizeY = (val: number) => 100 - ((val - renderMinY) / renderRangeY) * 100;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickXRatio = (e.clientX - rect.left) / rect.width;
    const clickXVal = minX + clickXRatio * (maxX - minX);
    
    // Find closest point
    const closest = data.reduce((prev, curr) => 
      Math.abs(curr.x - clickXVal) < Math.abs(prev.x - clickXVal) ? curr : prev
    );
    setHover(closest);
  };

  // Generate Path
  // We use simple line commands. For large datasets, this might need optimization, 
  // but for <2000 points it's fine.
  const pathD = `M ${data.map(d => `${normalizeX(d.x)},${normalizeY(d.y)}`).join(' L ')}`;

  return (
    <div className="flex flex-col h-64 bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
        <div className="flex gap-4 text-[10px] font-mono text-slate-400">
           <span>Max: {maxY.toFixed(2)}</span>
           <span>Min: {minY.toFixed(2)}</span>
        </div>
      </div>
      <div className="flex-grow relative overflow-hidden">
        <svg 
          className="w-full h-full overflow-visible" 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* Grid Lines */}
          <line x1="0" y1="0" x2="100" y2="0" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="0" y1="25" x2="100" y2="25" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="0" y1="100" x2="100" y2="100" stroke="#f1f5f9" strokeWidth="1" />

          {/* Zero Line (if visible) */}
          {minY < 0 && maxY > 0 && (
             <line x1="0" y1={normalizeY(0)} x2="100" y2={normalizeY(0)} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4" />
          )}

          {/* Data Line */}
          <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

          {/* Hover Indicator */}
          {hover && (
            <g>
              <line x1={normalizeX(hover.x)} y1="0" x2={normalizeX(hover.x)} y2="100" stroke="#64748b" strokeWidth="1" strokeDasharray="2" vectorEffect="non-scaling-stroke" />
              <circle cx={normalizeX(hover.x)} cy={normalizeY(hover.y)} r="4" fill={color} stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </g>
          )}
        </svg>
        {hover && (
          <div className="absolute top-0 right-0 bg-slate-800/90 text-white text-[10px] p-2 rounded shadow-lg pointer-events-none z-10 font-mono backdrop-blur-sm">
            <div>{xLabel}: {hover.x.toFixed(2)}</div>
            <div>{yLabel}: {hover.y.toFixed(2)}</div>
          </div>
        )}
      </div>
    </div>
  );
};
