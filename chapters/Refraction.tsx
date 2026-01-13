
import React, { useState } from 'react';
import { translations } from '../utils/translations';
import { Language } from '../utils/types';

interface Props { lang: Language; mode: 'snell' | 'prism' | 'fiber' }

export const RefractionLab = ({ lang, mode }: Props) => {
  const t = translations[lang];

  // Snell
  const [n1, setN1] = useState(1.00); // Top Medium
  const [n2, setN2] = useState(1.50); // Bottom Medium
  const [incAngle, setIncAngle] = useState(45);

  // Prism
  const [prismAngle, setPrismAngle] = useState(60);

  // Fiber
  const [fiberN, setFiberN] = useState(1.5);

  // --- Calcs ---
  const rad = (deg: number) => deg * Math.PI / 180;
  const deg = (rad: number) => rad * 180 / Math.PI;

  // Snell's Law: n1 sin(i) = n2 sin(r)
  const sinR = (n1 / n2) * Math.sin(rad(incAngle));
  
  // Physics Logic
  const criticalAngle = n1 > n2 ? deg(Math.asin(n2/n1)) : null;
  let isTIR = false;
  let refractAngle = 0; // Angle relative to normal in medium 2

  if (Math.abs(sinR) > 1.0) {
      isTIR = true;
      refractAngle = incAngle; // Reflection
  } else {
      refractAngle = deg(Math.asin(sinR));
  }
  
  const isCritical = criticalAngle && Math.abs(incAngle - criticalAngle) < 0.5;

  return (
    <div className="flex flex-col h-full bg-slate-50">
       <div className="relative h-[55vh] w-full bg-slate-900 overflow-hidden border-b-4 border-slate-700">
           
           {mode === 'snell' && (
               <div className="absolute inset-0 flex items-center justify-center">
                   {/* Medium 1 (Top) */}
                   <div className="absolute top-0 w-full h-1/2 bg-slate-800 text-right p-4">
                      <div className="font-bold text-white text-xl">n₁ = {n1.toFixed(2)}</div>
                      <div className="text-white/50 text-xs uppercase">{t.medium1}</div>
                   </div>
                   {/* Medium 2 (Bottom) */}
                   <div className="absolute bottom-0 w-full h-1/2 bg-sky-900/40 text-right p-4 border-t border-white/20">
                      <div className="font-bold text-sky-300 text-xl">n₂ = {n2.toFixed(2)}</div>
                      <div className="text-sky-300/50 text-xs uppercase">{t.medium2}</div>
                   </div>

                   {/* Normal Line */}
                   <div className="absolute h-full w-[1px] bg-white/30 border-l border-dashed border-white/50" />

                   <div className="absolute w-0 h-0">
                       {/* Incident Ray (Coming from Top-Left) */}
                       {/* Anchor at Bottom Center (0,0) */}
                       <div 
                         className="absolute bottom-0 w-1.5 h-[400px] bg-red-500 origin-bottom shadow-[0_0_15px_red]"
                         style={{ transform: `rotate(${-incAngle}deg) translateX(-50%)` }}
                       >
                           <div className="absolute top-10 left-2 text-red-200 font-bold text-xs rotate-90">INCIDENT</div>
                           <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-white to-transparent opacity-50" />
                       </div>
                       
                       {/* Result Rays */}
                       {isTIR ? (
                           // TIR (Reflection to Top-Right)
                           <div 
                             className="absolute bottom-0 w-1.5 h-[400px] bg-red-500 origin-bottom shadow-[0_0_15px_red] opacity-90"
                             style={{ transform: `rotate(${incAngle}deg) translateX(-50%)` }}
                           >
                               <div className="absolute top-10 right-2 text-red-200 font-bold text-xs -rotate-90">TIR (Reflected)</div>
                           </div>
                       ) : isCritical ? (
                            // Critical Angle (Grazing emergence along boundary)
                           <div 
                             className="absolute top-0 w-2 h-[400px] bg-yellow-400 origin-top shadow-[0_0_15px_yellow]"
                             style={{ transform: `rotate(-90deg) translateX(-50%)` }}
                           >
                               <div className="absolute top-20 left-2 text-yellow-200 font-bold text-xs">CRITICAL RAY (90°)</div>
                           </div>
                       ) : (
                           // Standard Refraction (Going to Bottom-Right)
                           // Anchor at Top Center (0,0)
                           // Standard rotation: 0 is Down. +angle is Left (CW). -angle is Right (CCW).
                           // Wait, standard CSS rotate(0) on an element usually aligns with flow.
                           // For a vertical bar (height 400), rotate(0) points Down.
                           // We want to rotate it LEFT (CCW) by r degrees if we want Bottom-Right? 
                           // No. Standard clock: 6 is Down. 5 is Down-Right (CCW from Down?). 
                           // CSS rotate is CW. So rotate(-r) moves Down to Down-Right.
                           <div 
                             className="absolute top-0 w-1.5 h-[400px] bg-emerald-400 origin-top shadow-[0_0_15px_emerald]"
                             style={{ transform: `rotate(${-refractAngle}deg) translateX(-50%)` }}
                           >
                               <div className="absolute top-20 right-2 text-emerald-200 font-bold text-xs -rotate-90">REFRACTED</div>
                           </div>
                       )}

                       {/* Faint Partial Reflection (Fresnel) */}
                       {!isTIR && (
                           <div 
                             className="absolute bottom-0 w-1 h-[400px] bg-red-500/20 origin-bottom pointer-events-none"
                             style={{ transform: `rotate(${incAngle}deg) translateX(-50%)` }}
                           />
                       )}
                   </div>
               </div>
           )}

           {mode === 'prism' && (
               <div className="w-full h-full flex items-center justify-center bg-slate-900">
                   <svg width="600" height="400" viewBox="-300 -200 600 400">
                       <path d="M -100 100 L 100 100 L 0 -100 Z" fill="rgba(255,255,255,0.05)" stroke="white" strokeWidth="2" />
                       <line x1="-300" y1="20" x2="-60" y2="20" stroke="white" strokeWidth="3" />
                       <path d="M -60 20 L 40 20 L 200 150" stroke="#ef4444" strokeWidth="2" fill="none" opacity="0.9" /> {/* Red bends least */}
                       <path d="M -60 20 L 36 10 L 200 110" stroke="#eab308" strokeWidth="2" fill="none" opacity="0.9" />
                       <path d="M -60 20 L 32 0 L 200 70" stroke="#3b82f6" strokeWidth="2" fill="none" opacity="0.9" />
                       <path d="M -60 20 L 30 -5 L 200 50" stroke="#8b5cf6" strokeWidth="2" fill="none" opacity="0.9" /> {/* Violet bends most */}
                   </svg>
                   <div className="absolute bottom-4 text-white/50 text-xs">Simulated Dispersion (Exaggerated)</div>
               </div>
           )}

           {mode === 'fiber' && (
               <div className="w-full h-full flex items-center justify-center">
                   <div className="relative w-[80%] h-24 bg-blue-900/30 border-y-4 border-blue-500 overflow-hidden rounded-full backdrop-blur-sm">
                       <div className="absolute top-2 left-2 text-blue-300 text-xs font-bold">CLADDING (n low)</div>
                       <div className="absolute top-1/2 left-2 text-white text-xs font-bold -translate-y-1/2">CORE (n high)</div>
                       <svg className="w-full h-full overflow-visible">
                           <path 
                              d="M -20 12 L 50 20 L 150 4 L 250 20 L 350 4 L 450 20 L 550 4 L 650 20" 
                              fill="none" 
                              stroke="#facc15" 
                              strokeWidth="3" 
                              className="animate-pulse shadow-[0_0_20px_yellow]"
                              filter="drop-shadow(0 0 5px yellow)"
                           />
                       </svg>
                   </div>
               </div>
           )}

       </div>

       <div className="flex-grow p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto">
          <div className="space-y-6">
              <h2 className="text-xl font-black uppercase text-slate-700">{t[mode]}</h2>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  {mode === 'snell' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                            <InputSlider label="n1 (Top)" val={n1} set={setN1} min={1} max={2.5} step={0.01} />
                            <InputSlider label="n2 (Bottom)" val={n2} set={setN2} min={1} max={2.5} step={0.01} />
                        </div>
                        <InputSlider label={`${t.incidentAngle} (°)`} val={incAngle} set={setIncAngle} min={0} max={89} step={0.1} />
                        
                        {criticalAngle && (
                             <button 
                                onClick={() => setIncAngle(Number(criticalAngle.toFixed(1)))}
                                className="w-full py-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 font-bold text-xs hover:bg-yellow-100"
                             >
                                Set to Critical Angle ({criticalAngle.toFixed(1)}°)
                             </button>
                        )}

                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                            <PresetBtn label="Air (1.0)" set={() => { setN1(1.0); setN2(1.5); }} />
                            <PresetBtn label="Water -> Air" set={() => { setN1(1.33); setN2(1.0); }} />
                            <PresetBtn label="Glass -> Air" set={() => { setN1(1.5); setN2(1.0); }} />
                            <PresetBtn label="Diamond -> Air" set={() => { setN1(2.42); setN2(1.0); }} />
                        </div>
                      </>
                  )}
                  {mode === 'prism' && (
                      <div className="text-sm text-slate-600">
                          <p className="mb-2"><strong>Dispersion:</strong> Different colors (wavelengths) travel at slightly different speeds in glass.</p>
                          <p>Violet slows down more than Red, causing it to bend (refract) more. This separation creates the spectrum.</p>
                      </div>
                  )}
                  {mode === 'fiber' && (
                      <div className="text-sm text-slate-600">
                          <p className="mb-2"><strong>Total Internal Reflection (TIR):</strong> Light signals bounce continuously inside the core because the angle of incidence is always greater than the critical angle.</p>
                          <p>This allows internet data to travel kilometers with minimal loss.</p>
                      </div>
                  )}
              </div>
          </div>

          <div className="bg-slate-100 p-6 rounded-2xl flex flex-col justify-center border border-slate-200">
              {mode === 'snell' && (
                  <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-300 pb-2">
                          <span className="text-sm font-bold text-slate-500">Phenomenon</span>
                          <span className={`text-xl font-black ${isTIR ? 'text-red-600' : isCritical ? 'text-yellow-600' : 'text-emerald-600'}`}>
                             {isTIR ? t.tir : isCritical ? 'Critical Angle' : 'Refraction'}
                          </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-300 pb-2">
                          <span className="text-sm font-bold text-slate-500">Angle r</span>
                          <span className="text-xl font-black text-slate-700">{isTIR ? '-' : refractAngle.toFixed(1)}°</span>
                      </div>
                      {criticalAngle && (
                          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mt-2">
                             <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-yellow-700">Critical Angle (θc)</span>
                                <span className="text-sm font-black text-yellow-800">{criticalAngle.toFixed(2)}°</span>
                             </div>
                             <div className="text-[10px] text-yellow-600 mt-1">Light must go from Dense (n={n1}) to Rare (n={n2})</div>
                          </div>
                      )}
                      <div className="text-xs text-slate-400 font-mono bg-white p-2 rounded">
                          sin(i)/sin(r) = n₂/n₁
                      </div>
                  </div>
              )}
          </div>
       </div>
    </div>
  );
};

const InputSlider = ({ label, val, set, min, max, step=1 }: any) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-bold text-slate-600"><span>{label}</span> <span>{val}</span></div>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} className="w-full accent-blue-600" />
  </div>
);

const PresetBtn = ({ label, set }: any) => (
    <button onClick={set} className="px-2 py-1 text-[10px] rounded font-bold bg-white text-slate-500 border border-slate-200 hover:border-blue-500 hover:text-blue-600">
        {label}
    </button>
);
