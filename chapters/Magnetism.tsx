
import React, { useState, useEffect, useRef } from 'react';
import { translations } from '../utils/translations';
import { Language } from '../utils/types';
import { Graph } from '../components/Graph';
import * as Icons from 'lucide-react';

interface Props { lang: Language; mode: 'electromagnet' | 'induction' | 'transformer' | 'generator' | 'mri' }

export const MagnetismLab = ({ lang, mode }: Props) => {
  const t = translations[lang];

  // --- ELECTROMAGNET STATES ---
  const [current, setCurrent] = useState(2); // Amps
  const [turns, setTurns] = useState(20);
  const [hasIronCore, setHasIronCore] = useState(false);
  
  // --- INDUCTION STATES ---
  const [magnetPos, setMagnetPos] = useState(0); // 0-100% inside coil
  const [coilTurns, setCoilTurns] = useState(50);
  const [galvanometer, setGalvanometer] = useState(0); // -100 to 100
  
  // --- TRANSFORMER STATES ---
  const [vp, setVp] = useState(110); // Primary Voltage
  const [np, setNp] = useState(100); // Primary Turns
  const [ns, setNs] = useState(50);  // Secondary Turns
  
  // --- GENERATOR/MOTOR STATES ---
  const [genType, setGenType] = useState<'ac_generator' | 'dc_motor'>('ac_generator');
  const [viewMode, setViewMode] = useState<'schematic' | 'real'>('real');
  const [rpm, setRpm] = useState(0); // Speed (for Generator input)
  const [motorVolts, setMotorVolts] = useState(0); // Voltage (for Motor input)
  const [genHistory, setGenHistory] = useState<{x:number, y:number}[]>([]);
  const [genTime, setGenTime] = useState(0);

  // --- MRI STATES ---
  const [rfOn, setRfOn] = useState(false);
  const [bFieldOn, setBFieldOn] = useState(false);
  const [spins, setSpins] = useState(Array(36).fill(0).map(()=>Math.random()*360));
  const [scanProgress, setScanProgress] = useState(0);

  // --- REFS & LOOPS ---
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const lastMagnetPos = useRef(0);

  // Animation Loop
  const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current)/1000, 0.1);
      lastTimeRef.current = time;

      // INDUCTION LOGIC
      if (mode === 'induction') {
          setGalvanometer(prev => prev * 0.9); // Decay
      }

      // GENERATOR / MOTOR LOGIC
      if (mode === 'generator') {
          const effectiveSpeed = genType === 'ac_generator' ? rpm : motorVolts * 2; // Arbitrary scaling
          
          if (Math.abs(effectiveSpeed) > 0) {
              const w = effectiveSpeed / 60 * 2 * Math.PI; // rad/s
              const newTime = genTime + dt;
              setGenTime(newTime);
              
              if (genType === 'ac_generator') {
                  let output = Math.sin(w * newTime) * 10; 
                  setGenHistory(prev => {
                      const keep = [...prev, {x: newTime, y: output}];
                      if (keep.length > 200) return keep.slice(keep.length - 200);
                      return keep;
                  });
              }
          }
      }

      // MRI LOGIC
      if (mode === 'mri') {
          // Spin Physics
          setSpins(prev => prev.map(angle => {
              if (!bFieldOn) return (angle + Math.random()*10) % 360; 
              let target = 0; 
              if (rfOn) {
                  target = 90;
                  return angle + (target - angle) * 0.1; 
              } else {
                  const wobble = Math.sin(time * 0.01) * 10;
                  return angle + (target - angle) * 0.05 + wobble;
              }
          }));

          // Scanner Animation
          if (bFieldOn && rfOn && scanProgress < 100) {
              setScanProgress(p => Math.min(100, p + 0.5));
          } else if (!rfOn && scanProgress > 0) {
             // setScanProgress(p => Math.max(0, p - 1));
          }
      }

      requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
      requestRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(requestRef.current!);
  }, [mode, rpm, motorVolts, genTime, bFieldOn, rfOn, genType]);


  // --- CALCULATIONS ---
  const perm = hasIronCore ? 50 : 1;
  const bField = (4 * Math.PI * 1e-7 * turns * current * perm * 1000).toFixed(2); 
  const vs = (vp * ns) / np;

  // Induction Handler
  const handleMagnetDrag = (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const velocity = pct - lastMagnetPos.current;
      lastMagnetPos.current = pct;
      setGalvanometer(velocity * coilTurns * 0.5); 
      setMagnetPos(pct);
  };

  // --- STYLES ---
  const styles = `
    .perspective-800 { perspective: 800px; }
    .preserve-3d { transform-style: preserve-3d; }
    .rotate-y-90 { transform: rotateY(90deg); }
    .cylinder-side {
        position: absolute;
        width: 40px; 
        height: 100%;
        background: #334155;
        border: 1px solid #1e293b;
    }
  `;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <style>{styles}</style>
      
      {/* === VISUALIZATION STAGE === */}
      <div className="relative h-[55vh] w-full bg-slate-950 overflow-hidden border-b-4 border-slate-700">
         
         {mode === 'electromagnet' && (
             <div className="absolute inset-0 flex items-center justify-center">
                 {/* Solenoid SVG */}
                 <div className="relative w-[600px] h-[300px] flex items-center justify-center">
                     {/* Iron Core */}
                     <div className={`absolute w-[400px] h-[40px] bg-neutral-600 rounded transition-all duration-500 ${hasIronCore ? 'translate-x-0 opacity-100' : '-translate-x-[200%] opacity-0'}`} />

                     {/* Coil Loops */}
                     <svg className="absolute w-full h-full overflow-visible">
                         {[...Array(turns)].map((_, i) => (
                             <path 
                                key={i}
                                d={`M ${100 + i*(400/turns)} 130 Q ${120 + i*(400/turns)} 80 ${140 + i*(400/turns)} 130 Q ${120 + i*(400/turns)} 180 ${100 + i*(400/turns)} 130`}
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="3"
                             />
                         ))}
                     </svg>

                     {/* Magnetic Field Lines (B) */}
                     {current > 0 && (
                         <div className="absolute inset-0 pointer-events-none opacity-50">
                             {[...Array(5)].map((_, i) => (
                                 <div 
                                    key={i} 
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-cyan-400 rounded-[50%]"
                                    style={{ 
                                        width: `${500 + i*50}px`, 
                                        height: `${100 + i*60}px`,
                                        opacity: (current/5) * (1 - i*0.2)
                                    }}
                                 />
                             ))}
                             <div className="absolute right-[50px] top-1/2 -translate-y-1/2 text-cyan-400 font-bold">N &rarr;</div>
                             <div className="absolute left-[50px] top-1/2 -translate-y-1/2 text-cyan-400 font-bold">&larr; S</div>
                         </div>
                     )}
                 </div>
             </div>
         )}

         {mode === 'induction' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center" onMouseMove={(e) => e.buttons === 1 && handleMagnetDrag(e)}>
                 <div className="relative w-[600px] h-[200px] bg-slate-800/50 rounded-xl border border-slate-600 mb-8 cursor-ew-resize">
                     <div className="absolute top-2 left-2 text-xs text-slate-400 font-mono">{t.moveMagnet}</div>
                     {/* Coil */}
                     <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 border-4 border-amber-500 rounded-[50%] flex items-center justify-center opacity-50">
                         <div className="text-amber-500 font-bold">{coilTurns} {t.turns}</div>
                     </div>
                     
                     {/* Moving Magnet */}
                     <div 
                        className="absolute top-1/2 -translate-y-1/2 h-16 w-32 flex shadow-2xl"
                        style={{ left: `${magnetPos}%`, transform: 'translate(-50%, -50%)' }}
                     >
                         <div className="flex-1 bg-red-600 flex items-center justify-center text-white font-bold">N</div>
                         <div className="flex-1 bg-slate-200 flex items-center justify-center text-black font-bold">S</div>
                     </div>
                 </div>

                 {/* Galvanometer */}
                 <div className="w-48 h-48 bg-white rounded-full border-8 border-slate-300 shadow-2xl relative flex items-center justify-center">
                     <div className="absolute top-4 text-xs font-bold text-slate-500">GALVANOMETER</div>
                     <div className="absolute bottom-10 w-2 h-2 bg-black rounded-full z-10" />
                     <div 
                        className="absolute bottom-10 h-32 w-1 bg-red-600 origin-bottom transition-transform duration-75"
                        style={{ transform: `rotate(${galvanometer}deg)` }}
                     />
                     <div className="absolute inset-4 rounded-full border-t border-slate-400" />
                 </div>
             </div>
         )}

         {mode === 'transformer' && (
             <div className="absolute inset-0 flex items-center justify-center">
                 {/* Core */}
                 <div className="w-64 h-48 border-[20px] border-slate-600 rounded-lg relative bg-transparent">
                      {/* Primary */}
                      <div className="absolute -left-5 top-4 bottom-4 w-10 flex flex-col justify-around">
                          {[...Array(8)].map((_, i) => <div key={i} className="h-2 bg-amber-600 rounded-full w-full" />)}
                      </div>
                      <div className="absolute -left-24 top-1/2 -translate-y-1/2 text-right">
                          <div className="text-amber-500 font-bold text-sm">Primary</div>
                          <div className="text-white font-mono text-xl">{vp} V</div>
                          <div className="text-slate-400 text-xs">{np} Turns</div>
                      </div>

                      {/* Secondary */}
                      <div className="absolute -right-5 top-4 bottom-4 w-10 flex flex-col justify-around">
                          {[...Array(ns > np ? 12 : 5)].map((_, i) => <div key={i} className="h-2 bg-amber-600 rounded-full w-full" />)}
                      </div>
                      <div className="absolute -right-24 top-1/2 -translate-y-1/2 text-left">
                          <div className="text-amber-500 font-bold text-sm">Secondary</div>
                          <div className="text-emerald-400 font-mono text-3xl font-black">{vs.toFixed(1)} V</div>
                          <div className="text-slate-400 text-xs">{ns} Turns</div>
                      </div>
                      <div className="absolute inset-0 border-[10px] border-dashed border-cyan-500/30 rounded-sm animate-pulse" />
                 </div>
             </div>
         )}

         {mode === 'generator' && (
             <div className="absolute inset-0 flex items-center justify-center gap-20">
                 
                 {/* 3D Model Area */}
                 <div className="relative w-80 h-80 perspective-800 flex items-center justify-center">
                     
                     {viewMode === 'real' ? (
                         // REALISTIC 3D MOTOR/GENERATOR (CSS Construction)
                         <div className="preserve-3d w-40 h-60 relative group">
                             {/* Stator Housing (Cylinder approximation) */}
                             <div className="absolute inset-0 bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 rounded-2xl shadow-2xl flex items-center justify-center border-y-8 border-slate-800">
                                 {/* Cooling Fins */}
                                 <div className="w-full h-full flex flex-col justify-around py-4 opacity-50">
                                     {[...Array(8)].map((_, i) => <div key={i} className="w-full h-2 bg-black/30" />)}
                                 </div>
                                 {/* Label */}
                                 <div className="absolute bg-slate-800 text-white text-xs px-2 py-1 rounded shadow border border-slate-600 font-bold">
                                     {genType === 'ac_generator' ? 'AC GEN' : 'DC MOTOR'}
                                 </div>
                             </div>
                             
                             {/* Rotor Shaft (Front) */}
                             <div 
                                className="absolute top-1/2 left-1/2 w-8 h-24 bg-gradient-to-r from-gray-300 to-gray-500 -translate-x-1/2 -translate-y-1/2 rounded origin-center"
                                style={{ transform: `translate(-50%, -50%) translateZ(40px) rotate(${genTime * (genType==='ac_generator'?rpm:motorVolts*2) * 6}deg)` }}
                             >
                                 <div className="w-full h-full border-2 border-dashed border-gray-600 opacity-50" />
                             </div>
                             
                             {/* Base */}
                             <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-4 bg-slate-800 rounded shadow-xl" />
                         </div>
                     ) : (
                         // SCHEMATIC VIEW
                         <div className="relative w-full h-full preserve-3d">
                             <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-40 bg-red-600 flex items-center justify-center text-white font-bold border-r-4 border-red-800">N</div>
                             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-40 bg-slate-300 flex items-center justify-center text-black font-bold border-l-4 border-slate-400">S</div>
                             
                             {/* Rotating Coil */}
                             <div 
                                className="absolute left-1/2 top-1/2 w-40 h-20 border-4 border-amber-500 bg-amber-500/10"
                                style={{ 
                                    transform: `translate(-50%, -50%) rotateX(${(genTime * (genType==='ac_generator'?rpm:motorVolts*2) * 60) % 360}deg)`,
                                    transformStyle: 'preserve-3d'
                                }}
                             >
                                 <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] bg-black/50 backface-hidden">Armature</div>
                             </div>
                             
                             <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                                 <div className="w-10 h-10 rounded-full border-4 border-slate-400 border-x-transparent animate-spin" />
                                 <div className="text-[10px] text-slate-400 text-center mt-1">Commutator</div>
                             </div>
                         </div>
                     )}
                 </div>

                 {/* Real-time Graph (Only for Generator) */}
                 {genType === 'ac_generator' && (
                     <div className="w-80 h-40 bg-black border border-slate-700 rounded p-2 relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                         <div className="absolute top-2 left-2 text-green-500 text-xs font-mono">OSCILLOSCOPE</div>
                         <svg className="w-full h-full" viewBox="0 -15 200 30" preserveAspectRatio="none">
                             <path 
                                d={`M ${genHistory.map((pt, i) => `${i},${-pt.y}`).join(' L ')}`}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                             />
                         </svg>
                         <div className="absolute bottom-0 w-full h-[1px] bg-slate-800" />
                     </div>
                 )}
                 
                 {genType === 'dc_motor' && (
                     <div className="text-center text-slate-400 font-mono">
                         <div className="text-6xl mb-2"><Icons.Fan className={Math.abs(motorVolts) > 0 ? 'animate-spin' : ''} style={{ animationDuration: `${200/Math.max(1, Math.abs(motorVolts))}s` }} /></div>
                         <div className="text-xl">{(motorVolts * 30).toFixed(0)} RPM</div>
                         <div className="text-xs text-slate-500">Mechanical Output</div>
                     </div>
                 )}
             </div>
         )}

         {mode === 'mri' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                 
                 {viewMode === 'real' ? (
                     // REALISTIC MRI SCANNER VIEW
                     <div className="relative w-[600px] h-[400px] flex items-center justify-center perspective-800">
                         {/* MRI Machine Body (Front Face) */}
                         <div className="absolute w-[300px] h-[300px] bg-slate-200 rounded-[40px] shadow-2xl flex items-center justify-center border-[20px] border-slate-300 z-20">
                             {/* Bore Hole */}
                             <div className={`w-[180px] h-[180px] rounded-full bg-slate-800 shadow-inner flex items-center justify-center overflow-hidden transition-all duration-500 ${bFieldOn ? 'shadow-[inset_0_0_50px_#3b82f6]' : ''}`}>
                                  {rfOn && <div className="absolute inset-0 border-[10px] border-yellow-500/20 rounded-full animate-ping" />}
                             </div>
                             <div className="absolute top-4 text-slate-400 font-bold tracking-widest">MRI</div>
                         </div>
                         
                         {/* MRI Body (Depth) - simulated with layers or just imply it */}
                         <div className="absolute w-[280px] h-[280px] bg-slate-400 rounded-[40px] -translate-z-[100px] z-10 scale-95" />

                         {/* Patient Table */}
                         <div 
                            className="absolute bottom-[60px] w-[250px] h-[20px] bg-slate-500 z-30 transition-all duration-[2000ms] shadow-lg rounded"
                            style={{ transform: `translateZ(${scanProgress > 0 ? -100 : 100}px) translateY(${scanProgress > 0 ? -20 : 0}px)` }}
                         >
                             {/* Patient */}
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-[60px] h-[15px] bg-blue-300 rounded-t-lg" />
                         </div>

                         {/* Computer Screen */}
                         <div className="absolute right-[-100px] top-[100px] w-32 h-24 bg-black border-4 border-slate-600 rounded p-1">
                             <div className="w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center">
                                 {scanProgress > 50 ? (
                                     <div className="w-16 h-16 rounded-full border-4 border-white/20 animate-pulse bg-white/10" /> 
                                 ) : (
                                     <div className="text-[8px] text-green-500 font-mono">READY...</div>
                                 )}
                             </div>
                         </div>
                     </div>
                 ) : (
                     // QUANTUM SPIN VIEW
                     <>
                        <div className={`relative w-[300px] h-[300px] rounded-full border-[20px] border-slate-700 bg-slate-900 flex flex-wrap content-center justify-center gap-2 p-10 transition-colors duration-500 ${bFieldOn ? 'shadow-[0_0_50px_#3b82f6]' : ''}`}>
                            {spins.map((s, i) => (
                                <div key={i} className="w-6 h-6 flex items-center justify-center transition-transform duration-300" style={{ transform: `rotate(${s}deg)` }}>
                                    <div className="w-1 h-5 bg-red-500 rounded-full relative">
                                        <div className="absolute -top-1 -left-1.5 w-4 h-4 border-t-2 border-white rounded-full opacity-50" />
                                    </div>
                                </div>
                            ))}
                            {rfOn && <div className="absolute inset-0 bg-yellow-400/10 animate-pulse rounded-full pointer-events-none" />}
                        </div>
                        <div className="mt-4 text-slate-400 text-sm font-mono">
                            B0 Field: <span className={bFieldOn ? "text-blue-400" : "text-slate-600"}>{bFieldOn ? "3.0 Tesla (ON)" : "OFF"}</span>
                        </div>
                     </>
                 )}
             </div>
         )}
      </div>

      {/* === CONTROLS === */}
      <div className="flex-grow p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto bg-white">
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black uppercase text-slate-700">{t[mode]}</h2>
                  {/* VIEW TOGGLE */}
                  {(mode === 'generator' || mode === 'mri') && (
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                          <button onClick={() => setViewMode('schematic')} className={`px-3 py-1 text-xs font-bold rounded ${viewMode==='schematic' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Schematic</button>
                          <button onClick={() => setViewMode('real')} className={`px-3 py-1 text-xs font-bold rounded ${viewMode==='real' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Realistic</button>
                      </div>
                  )}
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  {mode === 'electromagnet' && (
                      <>
                        <InputSlider label={t.current} val={current} set={setCurrent} min={0} max={10} unit="A" />
                        <InputSlider label={t.turns} val={turns} set={setTurns} min={5} max={50} />
                        <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                             <span className="text-sm font-bold text-slate-600">{t.ironCore}</span>
                             <button onClick={() => setHasIronCore(!hasIronCore)} className={`w-12 h-6 rounded-full relative transition-colors ${hasIronCore ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hasIronCore ? 'left-7' : 'left-1'}`} />
                             </button>
                        </div>
                      </>
                  )}
                  {mode === 'induction' && (
                      <>
                        <InputSlider label="Coil Turns" val={coilTurns} set={setCoilTurns} min={10} max={100} />
                        <div className="text-xs text-slate-500 p-2 bg-yellow-50 rounded border border-yellow-100">
                            <strong>Faraday's Law:</strong> Move the magnet quickly to induce voltage! The faster you move, the greater the deflection.
                        </div>
                      </>
                  )}
                  {mode === 'transformer' && (
                      <>
                        <InputSlider label={t.voltageIn} val={vp} set={setVp} min={10} max={240} unit="V" />
                        <InputSlider label={`${t.primary} ${t.turns}`} val={np} set={setNp} min={10} max={200} />
                        <InputSlider label={`${t.secondary} ${t.turns}`} val={ns} set={setNs} min={10} max={200} />
                      </>
                  )}
                  {mode === 'generator' && (
                      <>
                        <div className="flex bg-slate-200 p-1 rounded-lg mb-4">
                            <button onClick={() => setGenType('ac_generator')} className={`flex-1 py-2 text-xs font-bold rounded ${genType === 'ac_generator' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>AC Generator</button>
                            <button onClick={() => setGenType('dc_motor')} className={`flex-1 py-2 text-xs font-bold rounded ${genType === 'dc_motor' ? 'bg-white shadow text-amber-600' : 'text-slate-500'}`}>DC Motor</button>
                        </div>
                        
                        {genType === 'ac_generator' ? (
                            <InputSlider label={t.rpm} val={rpm} set={setRpm} min={0} max={120} />
                        ) : (
                            <InputSlider label="Input Voltage" val={motorVolts} set={setMotorVolts} min={0} max={12} unit="V" />
                        )}
                      </>
                  )}
                  {mode === 'mri' && (
                      <>
                        <button onClick={() => setBFieldOn(!bFieldOn)} className={`w-full py-3 rounded-xl font-bold mb-2 ${bFieldOn ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {bFieldOn ? 'Magnetic Field ON' : 'Magnetic Field OFF'}
                        </button>
                        <button 
                            onMouseDown={() => setRfOn(true)}
                            onMouseUp={() => setRfOn(false)}
                            className={`w-full py-3 rounded-xl font-bold ${bFieldOn ? 'bg-yellow-500 text-white active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                            disabled={!bFieldOn}
                        >
                            Apply RF Pulse (Resonance)
                        </button>
                      </>
                  )}
              </div>
          </div>

          <div className="bg-slate-100 p-6 rounded-2xl flex flex-col justify-center border border-slate-200">
              {mode === 'electromagnet' && (
                  <div className="text-center">
                      <h3 className="text-sm font-bold text-slate-500 mb-2">Magnetic Field Strength (approx)</h3>
                      <div className="text-4xl font-black text-cyan-600">{bField} mT</div>
                      <div className="text-xs text-slate-400 mt-2 font-mono">B = μ₀ n I</div>
                  </div>
              )}
              {mode === 'transformer' && (
                  <div className="space-y-4 text-center">
                      <div>
                          <div className="text-sm font-bold text-slate-500">Transformation Ratio (k)</div>
                          <div className="text-3xl font-black text-slate-700">{(ns/np).toFixed(2)}</div>
                      </div>
                      <div className={`text-lg font-bold ${ns > np ? 'text-blue-600' : ns < np ? 'text-orange-600' : 'text-slate-600'}`}>
                          {ns > np ? "Step-Up Transformer" : ns < np ? "Step-Down Transformer" : "Isolation Transformer"}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">Vs/Vp = Ns/Np</div>
                  </div>
              )}
              {mode === 'generator' && (
                   <div className="text-center">
                       <h3 className="text-sm font-bold text-slate-500 mb-2">{genType === 'ac_generator' ? 'Generated EMF' : 'Rotor Speed'}</h3>
                       <div className={`text-3xl font-black ${genType === 'dc_motor' ? 'text-amber-500' : 'text-blue-500'}`}>
                           {genType === 'ac_generator' ? 'Alternating Current (Sine)' : `${(motorVolts * 30).toFixed(0)} RPM`}
                       </div>
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
