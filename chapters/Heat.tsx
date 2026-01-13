
import React, { useState } from 'react';
import { translations } from '../utils/translations';
import { Language } from '../utils/types';
import * as Icons from 'lucide-react';

interface Props { lang: Language; mode: 'calorimetry' | 'expansion' }

const MATERIALS = {
  steel: { alpha: 12e-6, color: '#94a3b8' },
  copper: { alpha: 17e-6, color: '#f59e0b' },
  aluminum: { alpha: 23e-6, color: '#cbd5e1' },
  concrete: { alpha: 12e-6, color: '#78716c' },
};

export const HeatLab = ({ lang, mode }: Props) => {
  const t = translations[lang];
  
  // Calorimetry States
  const [m1, setM1] = useState(100); const [t1, setT1] = useState(80); // Hot Water
  const [m2, setM2] = useState(100); const [t2, setT2] = useState(20); // Cold Water
  const finalT = (m1 * t1 + m2 * t2) / (m1 + m2);

  // Expansion States
  const [expType, setExpType] = useState<'alpha' | 'beta' | 'gamma'>('alpha');
  const [material, setMaterial] = useState<keyof typeof MATERIALS>('steel');
  const [initialVal, setInitialVal] = useState(100); // Length, Area, or Volume
  const [tempChange, setTempChange] = useState(50);

  // Expansion Calculation
  const alpha = MATERIALS[material].alpha;
  let coeff = alpha;
  let label = t.alpha;
  let unit = "m";
  let dimensionLabel = "Length (L)";

  if (expType === 'beta') {
    coeff = 2 * alpha;
    label = t.beta;
    unit = "m²";
    dimensionLabel = "Area (A)";
  } else if (expType === 'gamma') {
    coeff = 3 * alpha;
    label = t.gamma;
    unit = "m³";
    dimensionLabel = "Volume (V)";
  }

  const change = initialVal * coeff * tempChange;
  const finalVal = initialVal + change;

  return (
    <div className="flex flex-col h-full bg-white">
       <div className="h-[45vh] bg-orange-50 relative flex items-center justify-center border-b border-orange-100 overflow-hidden">
          {mode === 'calorimetry' ? (
              <div className="flex items-end gap-1 relative">
                  {/* Beaker */}
                  <div className="w-40 h-48 border-x-4 border-b-4 border-slate-300 rounded-b-xl relative bg-white/50 backdrop-blur overflow-hidden shadow-xl">
                      <div className="absolute bottom-0 w-full bg-blue-500/30 transition-all duration-500" style={{ height: `${Math.min(100, (m1+m2)/4)}%` }} />
                      <div className="absolute bottom-4 w-full text-center text-blue-800 font-bold drop-shadow-sm">{finalT.toFixed(1)}°C</div>
                      {/* Mixing Particles */}
                      <div className="absolute inset-0 opacity-30 pointer-events-none">
                         {[...Array(5)].map((_, i) => <div key={i} className="absolute w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ left: `${20*i}%`, animationDelay: `${i*0.1}s`, bottom: '10%' }} />)}
                      </div>
                  </div>
                  {/* Thermometer */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-10 w-4 h-64 bg-slate-100 border border-slate-300 rounded-full shadow-lg">
                      <div className="absolute bottom-1 left-1 w-2 bg-red-500 rounded-full transition-all duration-700" style={{ height: `${finalT * 2}%` }} />
                      {/* Ticks */}
                      {[0, 20, 40, 60, 80, 100].map(deg => (
                          <div key={deg} className="absolute left-full ml-1 h-[1px] w-2 bg-slate-400" style={{ bottom: `${deg * 2}%` }}>
                              <span className="text-[8px] absolute left-3 -top-1.5 text-slate-500">{deg}</span>
                          </div>
                      ))}
                  </div>
              </div>
          ) : (
              <div className="w-full h-full flex items-center justify-center p-8 relative">
                  <div className="text-center absolute top-4 text-orange-800/50 font-bold uppercase tracking-widest text-xs">
                     {MATERIALS[material].alpha.toExponential(2)} /°C
                  </div>

                  {/* Visualization */}
                  <div className="relative transition-all duration-500 flex items-center justify-center shadow-2xl" 
                       style={{ 
                           backgroundColor: MATERIALS[material].color,
                           // Visual scaling: simplified for display
                           width: expType === 'alpha' ? '80%' : expType === 'beta' ? '200px' : '150px',
                           height: expType === 'alpha' ? '20px' : expType === 'beta' ? '200px' : '150px',
                           transform: `scale(${1 + (change/initialVal) * 50})`, // Exaggerate expansion for visual 50x
                           borderRadius: '4px'
                       }}>
                       <span className="text-white mix-blend-difference font-mono text-xs">{finalVal.toFixed(4)} {unit}</span>
                  </div>
                  
                  {/* Legend for exaggerated view */}
                  <div className="absolute bottom-4 right-4 text-[10px] text-orange-400 bg-white/80 px-2 py-1 rounded border border-orange-100">
                     *Visual expansion exaggerated 50x
                  </div>
              </div>
          )}
       </div>

       <div className="flex-grow p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
           <div className="space-y-6">
              <h2 className="text-lg font-black uppercase text-slate-700">{t[mode]}</h2>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                 {mode === 'calorimetry' ? (
                     <>
                        <h4 className="text-xs font-bold text-red-500 uppercase flex items-center gap-2"><Icons.Flame size={12}/> Liquid 1 (Hot)</h4>
                        <InputSlider label={`${t.mass} (g)`} val={m1} set={setM1} min={10} max={500} />
                        <InputSlider label={`${t.temperature} (°C)`} val={t1} set={setT1} min={0} max={100} />
                        <div className="h-px bg-slate-200 my-2"/>
                        <h4 className="text-xs font-bold text-blue-500 uppercase flex items-center gap-2"><Icons.Snowflake size={12}/> Liquid 2 (Cold)</h4>
                        <InputSlider label={`${t.mass} (g)`} val={m2} set={setM2} min={10} max={500} />
                        <InputSlider label={`${t.temperature} (°C)`} val={t2} set={setT2} min={0} max={100} />
                     </>
                 ) : (
                     <>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                           {/* Material Selector */}
                           <div>
                               <label className="text-xs font-bold text-slate-500 block mb-1">{t.material}</label>
                               <select value={material} onChange={(e) => setMaterial(e.target.value as any)} className="w-full p-2 rounded-lg border border-slate-200 text-sm bg-white font-bold text-slate-700">
                                   <option value="steel">{t.steel}</option>
                                   <option value="copper">{t.copper}</option>
                                   <option value="aluminum">{t.aluminum}</option>
                                   <option value="concrete">{t.concrete}</option>
                               </select>
                           </div>
                           {/* Type Selector */}
                           <div>
                               <label className="text-xs font-bold text-slate-500 block mb-1">{t.expansionType}</label>
                               <select value={expType} onChange={(e) => setExpType(e.target.value as any)} className="w-full p-2 rounded-lg border border-slate-200 text-sm bg-white font-bold text-slate-700">
                                   <option value="alpha">{t.alpha}</option>
                                   <option value="beta">{t.beta}</option>
                                   <option value="gamma">{t.gamma}</option>
                               </select>
                           </div>
                        </div>

                        <InputSlider label={`Initial ${dimensionLabel.split(' ')[0]}`} val={initialVal} set={setInitialVal} min={10} max={1000} />
                        <InputSlider label={`Δ ${t.temperature} (°C)`} val={tempChange} set={setTempChange} min={0} max={500} />
                     </>
                 )}
              </div>
           </div>
           
           <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
              {mode === 'calorimetry' ? (
                  <>
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-purple-600"><Icons.ThermometerSun size={40}/></div>
                    <div className="text-5xl font-black text-slate-800 mb-2">{finalT.toFixed(2)}°C</div>
                    <p className="text-slate-400 text-sm">Equilibrium Temperature</p>
                    <div className="mt-4 text-xs text-slate-400 bg-slate-50 p-2 rounded">
                        Formula: T = (m₁T₁ + m₂T₂) / (m₁ + m₂)
                    </div>
                  </>
              ) : (
                  <>
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-600"><Icons.Maximize size={40}/></div>
                    <div className="text-5xl font-black text-slate-800 mb-2">+{change.toExponential(2)} {unit}</div>
                    <p className="text-slate-400 text-sm font-bold">{label}</p>
                    <div className="mt-2 text-slate-500 font-mono text-sm">Total: {finalVal.toFixed(4)} {unit}</div>
                    
                    <div className="mt-6 text-left w-full text-xs text-slate-500 bg-slate-50 p-3 rounded space-y-1 font-mono border border-slate-100">
                       <div>Material: {material.toUpperCase()}</div>
                       <div>Coef ({expType === 'alpha' ? 'α' : expType === 'beta' ? 'β' : 'γ'}): {coeff.toExponential(2)}</div>
                       <div>Δ{expType === 'alpha' ? 'L' : expType === 'beta' ? 'A' : 'V'} = {initialVal} × {coeff.toExponential(1)} × {tempChange}</div>
                    </div>
                  </>
              )}
           </div>
       </div>
    </div>
  );
};

const InputSlider = ({ label, val, set, min, max }: any) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-bold text-slate-600"><span>{label}</span> <span>{val}</span></div>
    <input type="range" min={min} max={max} value={val} onChange={(e) => set(Number(e.target.value))} className="w-full" />
  </div>
);
