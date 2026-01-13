
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { translations } from '../utils/translations';
import { Language } from '../utils/types';
import * as Icons from 'lucide-react';

interface Props { lang: Language; mode: 'field' | 'apps' }

type Charge = { id: string; x: number; y: number; q: number }; // x,y in percentage (0-100)
type AppMode = 'vandegraaff' | 'photocopier' | 'lightning' | 'truck';

export const ElectricityLab = ({ lang, mode }: Props) => {
  const t = translations[lang];
  
  // --- FIELD LAB STATE ---
  const [charges, setCharges] = useState<Charge[]>([
      { id: '1', x: 35, y: 50, q: 5 },
      { id: '2', x: 65, y: 50, q: -5 }
  ]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [sensorPos, setSensorPos] = useState({ x: 50, y: 50 });
  const [showValues, setShowValues] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- APP STATE ---
  const [appMode, setAppMode] = useState<AppMode>('truck'); // Default to truck to show fix immediately
  
  // Van de Graaff
  const [beltOn, setBeltOn] = useState(false);
  const [domeVoltage, setDomeVoltage] = useState(0); // 0 to 100
  const [wandDist, setWandDist] = useState(50); // Distance of discharge sphere
  
  // Lightning
  const [cloudPos, setCloudPos] = useState(50); // % horizontal
  const [cloudCharge, setCloudCharge] = useState(0);
  const [hasRod, setHasRod] = useState(false);
  
  // Truck
  const [truckSpeed, setTruckSpeed] = useState(30); // Start with some speed
  const [truckCharge, setTruckCharge] = useState(0);
  const [grounded, setGrounded] = useState(false);

  // Shared
  const [spark, setSpark] = useState<{x: number, y: number} | null>(null);

  // --- FIELD LAB LOGIC ---
  const k = 200; // Coupling constant for visuals

  const getFieldAt = (x: number, y: number, chargesList: Charge[]) => {
      let Ex = 0, Ey = 0, V = 0;
      chargesList.forEach(c => {
          const dx = x - c.x;
          const dy = y - c.y;
          const rSq = dx*dx + dy*dy;
          const r = Math.sqrt(rSq);
          if (r < 1) return; // Singularity
          const E = (k * c.q) / rSq;
          Ex += E * (dx / r);
          Ey += E * (dy / r);
          V += (k * c.q) / r;
      });
      return { Ex, Ey, V, Mag: Math.sqrt(Ex*Ex + Ey*Ey) };
  };

  // Canvas Renderer for Field Lines
  useEffect(() => {
    if (mode !== 'field') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive sizing
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Helper to map % to px
    const toPx = (p: number, dim: number) => (p / 100) * dim;

    // Draw Field Lines
    // Start from positive charges
    ctx.lineWidth = 1;
    
    const traceLine = (startX: number, startY: number, direction: 1 | -1) => {
        let x = startX;
        let y = startY;
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        let i = 0;
        while (i < 500) { // Max steps
            // Map px to % for calc
            const pctX = (x / width) * 100;
            const pctY = (y / height) * 100;
            
            // Check bounds
            if (pctX < 0 || pctX > 100 || pctY < 0 || pctY > 100) break;
            
            // Check proximity to charges
            let hit = false;
            for (let c of charges) {
                 const dx = pctX - c.x;
                 const dy = pctY - c.y;
                 if (dx*dx + dy*dy < 2) { hit = true; break; } // Hit a charge
            }
            if (hit && i > 5) break; // Don't stop immediately at start

            const { Ex, Ey, Mag } = getFieldAt(pctX, pctY, charges);
            if (Mag === 0) break;

            // Normalize and step
            const stepSize = 3;
            x += (Ex / Mag) * stepSize * direction;
            y += (Ey / Mag) * stepSize * direction;
            
            ctx.lineTo(x, y);
            i++;
        }
        
        // Dark Theme Color: Cyan with opacity
        ctx.strokeStyle = "rgba(34, 211, 238, 0.4)"; 
        ctx.stroke();
    };

    charges.forEach(c => {
        // Spawn lines per charge magnitude unit
        const lines = Math.abs(c.q) * 2; 
        const radius = 2; // % radius of visual charge
        for (let i = 0; i < lines; i++) {
            const angle = (Math.PI * 2 * i) / lines;
            const startX = toPx(c.x + radius * Math.cos(angle), width);
            const startY = toPx(c.y + radius * Math.sin(angle), height);
            traceLine(startX, startY, c.q > 0 ? 1 : -1);
        }
    });

  }, [charges, mode]);


  // --- APP SIMULATION LOOPS ---
  useEffect(() => {
     if (mode !== 'apps') return;

     const interval = setInterval(() => {
         // Van de Graaff
         if (appMode === 'vandegraaff') {
             if (beltOn) {
                 setDomeVoltage(v => Math.min(100, v + 0.5));
             } else {
                 setDomeVoltage(v => Math.max(0, v - 0.2)); // Leakage
             }
             
             // Spark Logic
             if (domeVoltage > wandDist * 1.5 + 10) {
                 // Trigger Spark
                 setSpark({ x: 50 + Math.random()*10, y: 50 });
                 setDomeVoltage(v => v * 0.5); // Discharge
                 setTimeout(() => setSpark(null), 100);
             }
         }

         // Lightning
         if (appMode === 'lightning') {
             setCloudCharge(c => Math.min(120, c + 0.2));
             // Probability of strike increases with charge
             const threshold = hasRod ? 90 : 80;
             if (cloudCharge > threshold && Math.random() > 0.95) {
                 setSpark({ x: cloudPos, y: 80 }); // y is ground level
                 setCloudCharge(0);
                 setTimeout(() => setSpark(null), 150);
             }
         }

         // Truck
         if (appMode === 'truck') {
             if (truckSpeed > 0 && !grounded) {
                 setTruckCharge(c => Math.min(100, c + truckSpeed * 0.1));
             }
             if (grounded) {
                 setTruckCharge(0);
             }
             // Dangerous Spark?
             if (truckCharge > 90 && !grounded && Math.random() > 0.9) {
                 setSpark({ x: 50, y: 50 }); // Spark on the tank
                 setTimeout(() => setSpark(null), 200);
             }
         }
     }, 50);

     return () => clearInterval(interval);
  }, [mode, appMode, beltOn, domeVoltage, wandDist, cloudCharge, hasRod, truckSpeed, grounded, cloudPos]);


  // --- HANDLERS ---
  const handleStageClick = (e: React.MouseEvent) => {
      if (mode !== 'field' || draggingId) return;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      if (draggingId) {
          setCharges(prev => prev.map(c => c.id === draggingId ? { ...c, x, y } : c));
      } else {
          setSensorPos({ x, y });
      }
  };

  const addCharge = (q: number) => {
      setCharges(prev => [...prev, { id: Date.now().toString(), x: 50 + Math.random()*10, y: 50 + Math.random()*10, q }]);
  };

  // --- STYLES FOR ANIMATIONS ---
  const styles = `
    @keyframes scrollRoad {
      from { background-position: 0 0; }
      to { background-position: -100px 0; }
    }
    @keyframes spinWheel {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes rain {
        0% { background-position: 0 0; }
        100% { background-position: 0 500px; }
    }
    @keyframes slide-y {
      from { background-position: 0 0; }
      to { background-position: 0 100px; }
    }
  `;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      
      {/* === VISUALIZATION STAGE === */}
      <div 
        ref={containerRef}
        className="relative h-[60vh] w-full bg-slate-950 overflow-hidden border-b-4 border-slate-700 select-none cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={() => setDraggingId(null)}
        onMouseLeave={() => setDraggingId(null)}
        onClick={handleStageClick}
      >
          {mode === 'field' && (
              <>
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                  
                  {/* Charges */}
                  {charges.map(c => (
                      <div 
                        key={c.id}
                        className={`absolute w-10 h-10 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center font-bold text-white cursor-grab active:cursor-grabbing z-20
                                    ${c.q > 0 ? 'bg-red-600 ring-2 ring-red-400' : 'bg-blue-600 ring-2 ring-blue-400'}`}
                        style={{ left: `${c.x}%`, top: `${c.y}%`, transform: 'translate(-50%, -50%)' }}
                        onMouseDown={(e) => { e.stopPropagation(); setDraggingId(c.id); }}
                      >
                          {c.q > 0 ? '+' : '-'}
                          {/* Glow */}
                          <div className={`absolute inset-0 rounded-full blur-md opacity-50 ${c.q > 0 ? 'bg-red-500 animate-pulse' : 'bg-blue-500 animate-pulse'}`} />
                      </div>
                  ))}

                  {/* Sensor Probe */}
                  <div 
                    className="absolute w-24 pointer-events-none z-30 transition-transform duration-75"
                    style={{ left: `${sensorPos.x}%`, top: `${sensorPos.y}%`, transform: 'translate(10px, 10px)' }}
                  >
                      {(() => {
                          const f = getFieldAt(sensorPos.x, sensorPos.y, charges);
                          const rot = Math.atan2(f.Ey, f.Ex) * 180 / Math.PI;
                          const width = Math.min(100, f.Mag * 10);
                          return (
                              <>
                                <div className="absolute top-0 left-0 w-3 h-3 bg-yellow-400 rounded-full border border-yellow-200 shadow-[0_0_10px_yellow]" style={{ transform: 'translate(-50%, -50%)' }} />
                                {/* Vector Arrow */}
                                {f.Mag > 0.1 && (
                                    <div 
                                        className="absolute top-0 left-0 h-1 bg-yellow-400 origin-left flex items-center shadow-[0_0_5px_yellow]"
                                        style={{ width: `${width}px`, transform: `rotate(${rot}deg)` }}
                                    >
                                        <div className="absolute right-0 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[8px] border-l-yellow-400" />
                                    </div>
                                )}
                                {/* Values Tooltip */}
                                {showValues && (
                                    <div className="absolute top-4 left-4 bg-black/80 text-cyan-400 text-[10px] p-2 rounded border border-slate-700 shadow-lg font-mono whitespace-nowrap backdrop-blur-sm">
                                        <div>E: {f.Mag.toFixed(1)} N/C</div>
                                        <div>V: {f.V.toFixed(1)} V</div>
                                    </div>
                                )}
                              </>
                          )
                      })()}
                  </div>
              </>
          )}

          {mode === 'apps' && (
              <>
              <style>{styles}</style>
              <div className="w-full h-full relative perspective-container bg-black">
                  
                  {appMode === 'vandegraaff' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 preserve-3d">
                          {/* Dark Lab Floor */}
                          <div className="absolute bottom-0 w-full h-[40%] bg-neutral-800 origin-bottom transform rotate-x-60" 
                               style={{ backgroundImage: 'radial-gradient(circle at 50% 0, #333 5%, transparent 60%)' }}/>

                          {/* Generator Base */}
                          <div className="relative group">
                              {/* Belt Column */}
                              <div className="w-16 h-64 bg-neutral-700 mx-auto relative overflow-hidden border-x border-neutral-600">
                                   <div className={`absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] ${beltOn ? 'animate-slide-y' : ''}`} />
                                   {/* Moving Belt Charge */}
                                   {beltOn && (
                                       <div className="absolute inset-0 flex flex-col items-center justify-between py-4 animate-pulse">
                                           <div className="text-cyan-400 font-bold text-xs">+</div>
                                           <div className="text-cyan-400 font-bold text-xs">+</div>
                                           <div className="text-cyan-400 font-bold text-xs">+</div>
                                       </div>
                                   )}
                              </div>
                              
                              {/* Dome */}
                              <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-gradient-to-br from-neutral-300 via-neutral-400 to-neutral-600 shadow-2xl transition-all duration-300
                                              ${domeVoltage > 50 ? 'shadow-[0_0_80px_rgba(59,130,246,0.6)] brightness-110' : ''}`}>
                                  <div className="absolute inset-0 rounded-full bg-white opacity-20" style={{ transform: 'rotate(-45deg) translateX(10px)' }} /> 
                              </div>
                              
                              {/* Discharge Wand */}
                              <div 
                                className="absolute top-[-50px] w-12 h-12 rounded-full bg-neutral-400 shadow-lg cursor-grab active:cursor-grabbing z-20 transition-all duration-100 flex items-center justify-center"
                                style={{ 
                                    left: `${150 + wandDist * 3}px`,
                                    top: '50px' 
                                }}
                              >
                                  <div className="absolute top-full left-1/2 w-1 h-64 bg-black -z-10" /> 
                              </div>

                              {/* SPARK */}
                              {spark && (
                                  <svg className="absolute overflow-visible pointer-events-none z-50 left-1/2 top-[-50px]">
                                      <path 
                                        d={`M 0 50 L ${150 + wandDist*3 - 100 + 20} 100`} 
                                        stroke="#a5f3fc"
                                        strokeWidth="4" 
                                        fill="none" 
                                        className="animate-pulse"
                                        filter="url(#glow)"
                                      />
                                      <defs>
                                          <filter id="glow">
                                              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                                              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                                          </filter>
                                      </defs>
                                  </svg>
                              )}
                          </div>
                      </div>
                  )}

                  {appMode === 'lightning' && (
                      <div className="absolute inset-0 bg-slate-900 overflow-hidden">
                          {/* Rain */}
                          <div 
                            className="absolute inset-0 opacity-10"
                            style={{ 
                                backgroundImage: 'linear-gradient(to bottom, #94a3b8 1px, transparent 1px)', 
                                backgroundSize: '1px 30px',
                                animation: 'rain 0.3s linear infinite'
                            }} 
                          />

                          {/* Dark City Silhouette */}
                          <div className="absolute bottom-0 w-full h-32 bg-black flex items-end justify-center gap-2 px-10 border-t-2 border-slate-800">
                               <div className="w-10 h-10 bg-slate-900" />
                               <div className="w-14 h-20 bg-slate-800" />
                               <div className="w-20 h-32 bg-slate-800 relative group border border-slate-700">
                                   {/* Building with Rod */}
                                   {hasRod && <div className="absolute -top-10 left-1/2 w-0.5 h-10 bg-slate-600"><div className="absolute -top-1 -left-0.5 w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-[0_0_10px_yellow]" /></div>}
                                   {/* Windows */}
                                   <div className="absolute inset-2 grid grid-cols-2 gap-1">
                                       <div className="bg-yellow-900/50 w-full h-2" />
                                       <div className="bg-black w-full h-2" />
                                       <div className="bg-yellow-900/50 w-full h-2" />
                                   </div>
                               </div>
                               <div className="w-16 h-16 bg-slate-900" />
                          </div>

                          {/* Draggable Cloud */}
                          <div 
                             className="absolute top-10 cursor-grab active:cursor-grabbing z-20"
                             style={{ left: `${cloudPos}%`, transform: 'translateX(-50%)' }}
                             onMouseDown={(e) => {
                                 const track = (ev: MouseEvent) => {
                                     setCloudPos((ev.clientX / window.innerWidth) * 100);
                                 };
                                 window.addEventListener('mousemove', track);
                                 window.addEventListener('mouseup', () => window.removeEventListener('mousemove', track), { once: true });
                             }}
                          >
                              <div className={`w-64 h-24 bg-slate-700 rounded-full blur-xl relative transition-colors duration-1000 shadow-[0_0_50px_rgba(0,0,0,0.8)] ${cloudCharge > 80 ? 'bg-slate-500' : ''}`}>
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-black opacity-30 text-4xl select-none">
                                      {Math.floor(cloudCharge)}%
                                  </div>
                              </div>
                          </div>

                          {/* Lightning Strike */}
                          {spark && (
                              <svg className="absolute inset-0 pointer-events-none z-50 filter drop-shadow-[0_0_25px_cyan]">
                                  <path 
                                    d={`M ${spark.x}% 15% L ${spark.x + (Math.random()-0.5)*10}% 40% L ${hasRod ? 50 : spark.x + (Math.random()-0.5)*20}% 80%`} 
                                    stroke="#fff" 
                                    strokeWidth="3" 
                                    fill="none" 
                                    strokeLinejoin="round"
                                  />
                              </svg>
                          )}
                      </div>
                  )}

                  {appMode === 'truck' && (
                      <div className="absolute inset-0 bg-slate-900 overflow-hidden flex flex-col justify-end">
                          {/* Night Sky */}
                          <div className="absolute top-0 w-full h-[60%] bg-gradient-to-b from-black to-slate-900">
                             <div className="absolute top-10 right-20 w-12 h-12 bg-slate-100 rounded-full blur-[1px] opacity-80 shadow-[0_0_30px_white]"></div> {/* Moon */}
                          </div>
                          
                          {/* Dark Road with Headlights effect */}
                          <div className="absolute bottom-0 w-full h-[40%] bg-neutral-900 overflow-hidden perspective-container border-t-2 border-slate-700">
                               <div 
                                 className="w-full h-full absolute inset-0 opacity-20"
                                 style={{ 
                                     backgroundImage: 'linear-gradient(90deg, transparent 50%, #444 50%)', 
                                     backgroundSize: '100px 100%', 
                                     animation: 'scrollRoad 0.5s linear infinite',
                                     animationDuration: truckSpeed > 0 ? `${100/Math.max(1, truckSpeed)}s` : '0s',
                                     animationPlayState: truckSpeed > 0 ? 'running' : 'paused'
                                 }} 
                               />
                          </div>

                          {/* 3D Truck Model */}
                          <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-80 h-40 preserve-3d">
                              {/* Tanker Body */}
                              <div className="w-full h-full bg-slate-700 rounded-2xl border-2 border-slate-600 shadow-2xl relative overflow-hidden flex items-center justify-center">
                                  {/* Danger Charge Indicator */}
                                  <div className="absolute inset-0 bg-red-900 mix-blend-overlay transition-opacity duration-300" style={{ opacity: truckCharge / 100 }} />
                                  <span className="relative font-black text-4xl text-slate-900 opacity-50 z-10">FUEL</span>
                                  {/* Spark on tank */}
                                  {spark && <div className="absolute inset-0 bg-white animate-ping opacity-80" />}
                              </div>

                              {/* Headlights */}
                              <div className="absolute right-0 top-[60%] w-[200px] h-[100px] bg-gradient-to-r from-yellow-100/20 to-transparent transform rotate-12 blur-xl pointer-events-none" />

                              {/* Wheels with Animation */}
                              <div 
                                className="absolute -bottom-8 left-4 w-16 h-16 bg-black rounded-full border-2 border-slate-600 shadow-lg" 
                                style={{ 
                                    animation: 'spinWheel 0.5s linear infinite',
                                    animationDuration: truckSpeed > 0 ? `${100/Math.max(1, truckSpeed)}s` : '0s',
                                    animationPlayState: truckSpeed > 0 ? 'running' : 'paused'
                                }}
                              >
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-slate-700" />
                                  <div className="absolute top-1/2 left-0 -translate-y-1/2 h-1 w-full bg-slate-700" />
                              </div>

                              <div 
                                className="absolute -bottom-8 right-4 w-16 h-16 bg-black rounded-full border-2 border-slate-600 shadow-lg" 
                                style={{ 
                                    animation: 'spinWheel 0.5s linear infinite',
                                    animationDuration: truckSpeed > 0 ? `${100/Math.max(1, truckSpeed)}s` : '0s',
                                    animationPlayState: truckSpeed > 0 ? 'running' : 'paused'
                                }} 
                              >
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-slate-700" />
                                  <div className="absolute top-1/2 left-0 -translate-y-1/2 h-1 w-full bg-slate-700" />
                              </div>

                              {/* Ground Chain */}
                              <div 
                                onClick={() => setGrounded(!grounded)}
                                className={`absolute bottom-0 right-20 w-1 h-20 origin-top cursor-pointer transition-transform duration-500 hover:scale-110 z-20 ${grounded ? 'bg-green-500 shadow-[0_0_10px_lime]' : 'bg-red-500 -rotate-12'}`}
                              >
                                  <div className="absolute bottom-0 -left-1.5 w-4 h-4 rounded-full border border-white bg-inherit shadow-md" />
                                  {!grounded && truckSpeed > 0 && Math.random() > 0.5 && (
                                     <div className="absolute bottom-0 left-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
                                  )}
                              </div>
                          </div>
                      </div>
                  )}

                  {/* Photocopier Placeholder */}
                  {appMode === 'photocopier' && (
                      <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                           <div className="text-slate-500 font-bold text-center">
                               <div className="text-6xl mb-4 text-slate-600"><Icons.Printer /></div>
                               <p>Xerography Process</p>
                           </div>
                      </div>
                  )}
              </div>
              </>
          )}
      </div>

      {/* === CONTROLS === */}
      <div className="flex-grow p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto z-10 bg-white">
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black uppercase text-slate-700">{t[mode === 'field' ? 'fieldLab' : 'applications']}</h2>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  {mode === 'field' && (
                      <div className="space-y-4">
                          <div className="flex gap-4">
                              <button onClick={() => addCharge(5)} className="flex-1 py-3 bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 hover:bg-red-200 shadow-sm">+ Add Positive</button>
                              <button onClick={() => addCharge(-5)} className="flex-1 py-3 bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 hover:bg-blue-200 shadow-sm">- Add Negative</button>
                          </div>
                          <div className="flex justify-between items-center">
                              <label className="text-sm font-bold text-slate-600">Show Sensor Values</label>
                              <input type="checkbox" checked={showValues} onChange={(e) => setShowValues(e.target.checked)} className="w-5 h-5 accent-blue-600" />
                          </div>
                          <button onClick={() => setCharges([])} className="w-full py-2 text-xs font-bold text-slate-400 uppercase hover:text-red-500">Reset Canvas</button>
                      </div>
                  )}

                  {mode === 'apps' && (
                      <>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                              {[
                                  {id: 'truck', icon: <Icons.Truck size={14}/>, label: t.oilTruck},
                                  {id: 'lightning', icon: <Icons.CloudLightning size={14}/>, label: t.lightning},
                                  {id: 'vandegraaff', icon: <Icons.Zap size={14}/>, label: t.vandeGraaff},
                              ].map(a => (
                                  <button 
                                    key={a.id} 
                                    onClick={() => { setAppMode(a.id as any); setSpark(null); setDomeVoltage(0); setCloudCharge(0); setTruckCharge(0); }} 
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase whitespace-nowrap transition-colors ${appMode === a.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
                                  >
                                      {a.icon} {a.label}
                                  </button>
                              ))}
                          </div>

                          <div className="pt-4 border-t border-slate-200">
                              {appMode === 'vandegraaff' && (
                                  <>
                                      <div className="flex justify-between items-center mb-4">
                                          <span className="font-bold text-slate-700">Motor Power</span>
                                          <button 
                                            onClick={() => setBeltOn(!beltOn)}
                                            className={`px-4 py-1 rounded-full text-xs font-bold text-white transition-colors ${beltOn ? 'bg-red-500' : 'bg-emerald-500'}`}
                                          >
                                              {beltOn ? 'STOP' : 'START'}
                                          </button>
                                      </div>
                                      <InputSlider label="Discharge Wand Distance" val={wandDist} set={setWandDist} min={0} max={100} />
                                  </>
                              )}
                              {appMode === 'lightning' && (
                                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                                      <span className="font-bold text-slate-700 text-sm">Lightning Rod Protection</span>
                                      <button 
                                        onClick={() => setHasRod(!hasRod)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${hasRod ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                      >
                                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hasRod ? 'left-7' : 'left-1'}`} />
                                      </button>
                                  </div>
                              )}
                              {appMode === 'truck' && (
                                  <>
                                      <InputSlider label="Truck Speed" val={truckSpeed} set={setTruckSpeed} min={0} max={100} />
                                      <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded-lg border border-yellow-100">
                                          <strong>Instruction:</strong> Friction from the road builds static charge (Red). Click the chain to ground it!
                                      </div>
                                  </>
                              )}
                          </div>
                      </>
                  )}
              </div>
          </div>

          <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 flex flex-col justify-center">
             {mode === 'field' && (
                 <div className="text-center">
                     <h3 className="text-lg font-black text-slate-700 mb-2">Interactive Field</h3>
                     <p className="text-sm text-slate-500 mb-4">Drag charges to reshape the field. Use the mouse probe to measure intensity.</p>
                     <div className="flex justify-center gap-4 text-xs font-mono">
                         <div className="px-3 py-1 bg-white rounded border border-slate-200 shadow-sm text-red-600">E = kQ/r²</div>
                         <div className="px-3 py-1 bg-white rounded border border-slate-200 shadow-sm text-blue-600">V = kQ/r</div>
                     </div>
                 </div>
             )}
             {mode === 'apps' && (
                 <div className="text-center">
                     <div className="text-4xl font-black text-slate-800 mb-2">
                         {appMode === 'vandegraaff' && `${Math.round(domeVoltage)} kV`}
                         {appMode === 'lightning' && `${Math.round(cloudCharge)} %`}
                         {appMode === 'truck' && `${Math.round(truckCharge)} %`}
                     </div>
                     <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
                         {appMode === 'vandegraaff' ? 'Dome Potential' : 'Charge Buildup'}
                     </p>
                 </div>
             )}
          </div>
      </div>
    </div>
  );
};

const InputSlider = ({ label, val, set, min, max, unit }: any) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-bold text-slate-600"><span>{label}</span> <span>{val} {unit}</span></div>
    <input type="range" min={min} max={max} value={val} onChange={(e) => set(Number(e.target.value))} className="w-full accent-blue-600" />
  </div>
);
