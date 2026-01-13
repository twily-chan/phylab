
import React, { useState } from 'react';
import { Environment } from '../components/Environment';
import { Graph } from '../components/Graph';
import { translations } from '../utils/translations';
import { Language } from '../utils/types';

interface Props {
  lang: Language;
  mode: 'buoyancy' | 'pressure' | 'elasticity';
}

export const MatterLab = ({ lang, mode }: Props) => {
  const t = translations[lang];
  
  // Buoyancy
  const [densityObj, setDensityObj] = useState(800);
  const [volume, setVolume] = useState(0.5);
  
  // Pressure
  const [depth, setDepth] = useState(10);
  const [liquidDensity, setLiquidDensity] = useState(1000);
  
  // Elasticity
  const [force, setForce] = useState(0);
  const [k, setK] = useState(100);

  // Calcs
  // Buoyancy
  const mass = densityObj * volume;
  const weight = mass * 9.8;
  const maxBuoyancy = 1000 * volume * 9.8;
  const submergedRatio = Math.min(1, densityObj / 1000);
  const buoyancyForce = submergedRatio * maxBuoyancy;
  const visualDepth = densityObj < 1000 ? submergedRatio * 40 : 180;

  // Pressure
  const pressureVal = depth * liquidDensity * 9.8; // Pa

  // Elasticity
  const extension = force / k;

  return (
    <div className="flex flex-col h-full">
      <div className="relative h-[50vh] w-full overflow-hidden bg-white border-b-4 border-slate-200">
         {mode === 'elasticity' ? (
             <div className="absolute inset-0 bg-slate-50 flex items-center justify-center">
                 <div className="relative w-40">
                     <div className="w-full h-4 bg-slate-400 mb-0" />
                     {/* Spring */}
                     <div className="w-8 mx-auto border-x-2 border-slate-400 box-content relative" 
                          style={{ 
                              height: `${100 + extension * 200}px`,
                              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, #94a3b8 5px, #94a3b8 10px)' 
                          }} 
                     />
                     <div className="w-20 h-20 bg-amber-500 mx-auto shadow-lg flex items-center justify-center text-white font-bold">
                         {force}N
                     </div>
                 </div>
                 <div className="absolute right-10 top-1/2">
                    <div className="text-4xl font-black text-slate-300">Δx = {extension.toFixed(2)}m</div>
                 </div>
             </div>
         ) : (
            // Liquid Environment
            <div className="absolute inset-0 bg-sky-50">
               <div className="absolute bottom-0 w-full h-[80%] bg-blue-500/20 border-t-2 border-blue-400 backdrop-blur-sm">
                  {mode === 'buoyancy' ? (
                      <div className="absolute left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-600 rounded-xl shadow-xl border-2 border-amber-800 flex flex-col items-center justify-center text-white transition-all duration-700"
                           style={{ top: `calc(0% + ${visualDepth}px)` }}>
                          <span className="font-bold text-xs">{mass.toFixed(0)}kg</span>
                      </div>
                  ) : (
                      // Pressure Gauge
                      <div className="absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-800 rounded-full shadow-xl border-2 border-white flex items-center justify-center text-white transition-all duration-300"
                           style={{ top: `${(depth / 50) * 80}%` }}>
                          <span className="text-[10px]">{pressureVal.toFixed(0)}</span>
                      </div>
                  )}
               </div>
               
               {mode === 'pressure' && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 h-[80%] w-10 border-r-2 border-slate-400 flex flex-col justify-between text-[10px] text-slate-500 py-2">
                     {[0, 10, 20, 30, 40, 50].map(d => <span key={d} className="relative"><span className="absolute right-2">{d}m</span>-</span>)}
                  </div>
               )}
            </div>
         )}
      </div>

      <div className="flex-grow p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto bg-white">
          <div className="space-y-6">
             <h2 className="text-xl font-black uppercase text-slate-700">{t[mode]}</h2>
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                {mode === 'buoyancy' && (
                    <>
                        <InputSlider label="Density" val={densityObj} set={setDensityObj} min={100} max={2000} step={50} unit="kg/m³"/>
                        <InputSlider label="Volume" val={volume} set={setVolume} min={0.1} max={2} step={0.1} unit="m³"/>
                    </>
                )}
                {mode === 'pressure' && (
                    <>
                        <InputSlider label="Depth (h)" val={depth} set={setDepth} min={0} max={50} unit="m"/>
                        <InputSlider label="Fluid Density (ρ)" val={liquidDensity} set={setLiquidDensity} min={800} max={1200} step={50} unit="kg/m³"/>
                    </>
                )}
                {mode === 'elasticity' && (
                    <>
                        <InputSlider label="Force (F)" val={force} set={setForce} min={0} max={200} unit="N"/>
                        <InputSlider label="Spring Constant (k)" val={k} set={setK} min={50} max={500} unit="N/m"/>
                    </>
                )}
             </div>
          </div>
          
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex flex-col justify-center">
              <h3 className="font-bold text-emerald-800 mb-4 uppercase text-xs tracking-widest">Calculated Results</h3>
              {mode === 'buoyancy' && (
                  <div className="space-y-2 text-sm text-emerald-900">
                      <div className="flex justify-between"><span>Weight:</span> <b>{weight.toFixed(0)} N</b></div>
                      <div className="flex justify-between"><span>Buoyancy:</span> <b>{buoyancyForce.toFixed(0)} N</b></div>
                      <div className="flex justify-between"><span>Status:</span> <b>{densityObj < 1000 ? 'FLOATING' : 'SINKING'}</b></div>
                  </div>
              )}
              {mode === 'pressure' && (
                  <div className="text-center">
                      <div className="text-4xl font-black text-emerald-600 mb-2">{(pressureVal/1000).toFixed(1)} kPa</div>
                      <p className="text-xs opacity-60">P = hρg</p>
                  </div>
              )}
              {mode === 'elasticity' && (
                   <div className="text-center">
                      <div className="text-4xl font-black text-emerald-600 mb-2">{extension.toFixed(3)} m</div>
                      <p className="text-xs opacity-60">Extension (x = F/k)</p>
                   </div>
              )}
          </div>
      </div>
    </div>
  );
};

const InputSlider = ({ label, val, set, min, max, step=1, unit="" }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs font-bold text-slate-600"><span>{label}</span> <span>{val} {unit}</span></div>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} className="w-full" />
  </div>
);
