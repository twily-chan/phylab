
import React, { useState } from 'react';
import { Environment } from '../components/Environment';
import { translations } from '../utils/translations';
import { Language } from '../utils/types';

export const PressureLab = ({ lang }: { lang: Language }) => {
  const t = translations[lang];
  const [densityObj, setDensityObj] = useState(800); // kg/m3
  const [volume, setVolume] = useState(0.5); // m3
  
  const densityWater = 1000;
  const gravity = 9.8;
  
  // Calculations
  const mass = densityObj * volume;
  const weight = mass * gravity;
  const maxBuoyancy = densityWater * volume * gravity;
  
  // If densityObj < densityWater, it floats.
  // Submerged Volume V_sub = (densityObj / densityWater) * V
  const submergedRatio = Math.min(1, densityObj / densityWater);
  const buoyancyForce = submergedRatio * maxBuoyancy;

  const netForce = weight - buoyancyForce; // If positive, sinks. If 0, floats.

  // Visual Position (0 = surface, 100 = bottom)
  const visualDepth = densityObj < densityWater ? submergedRatio * 40 : 180;

  return (
    <div className="flex flex-col h-full">
      <div className="relative h-[55vh] w-full overflow-hidden bg-white">
        {/* Sky is irrelevant indoors, but using Environment for consistency */}
        <div className="absolute inset-0 bg-slate-100">
           {/* Water Tank */}
           <div className="absolute bottom-0 w-full h-[70%] bg-blue-400/30 border-t border-blue-400 backdrop-blur-sm z-10 flex justify-center">
              {/* Water Surface Lines */}
              <div className="absolute top-0 w-full h-4 bg-white/20" />
           </div>
           
           {/* Object */}
           <div 
             className="absolute left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-600 rounded-lg shadow-xl border-2 border-amber-800 z-20 transition-all duration-1000 flex items-center justify-center text-white font-bold flex-col"
             style={{ top: `calc(30% - 40px + ${visualDepth}px)` }}
           >
             <span>Block</span>
             <span className="text-[10px] font-normal">{mass.toFixed(1)} kg</span>
           </div>

           {/* Force Vectors */}
           <div className="absolute left-[60%] top-1/2 flex flex-col items-center z-30 space-y-2">
              <div className="flex items-center gap-2">
                 <div className="w-4 h-16 bg-red-500 rounded-t-lg relative"><span className="absolute -top-6 text-red-600 font-bold whitespace-nowrap">Weight {weight.toFixed(0)}N</span></div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-4 bg-emerald-500 rounded-b-lg relative transition-all duration-500" style={{ height: `${(buoyancyForce / weight) * 64}px` }}>
                    <span className="absolute -bottom-6 text-emerald-600 font-bold whitespace-nowrap">Buoyancy {buoyancyForce.toFixed(0)}N</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="flex-grow p-8 bg-white overflow-y-auto">
         <h2 className="text-xl font-black uppercase text-slate-700 mb-6">{t.buoyancy}</h2>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <label className="font-bold text-sm text-slate-600 flex justify-between mb-2">
                    <span>Object Density</span>
                    <span className="text-blue-600">{densityObj} kg/m³</span>
                  </label>
                  <input type="range" min="100" max="2000" step="50" value={densityObj} onChange={(e)=>setDensityObj(Number(e.target.value))} className="w-full" />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                     <span>Styrofoam (100)</span>
                     <span>Water (1000)</span>
                     <span>Iron (2000+)</span>
                  </div>
               </div>
               
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <label className="font-bold text-sm text-slate-600 flex justify-between mb-2">
                    <span>Object Volume</span>
                    <span className="text-blue-600">{volume} m³</span>
                  </label>
                  <input type="range" min="0.1" max="2" step="0.1" value={volume} onChange={(e)=>setVolume(Number(e.target.value))} className="w-full" />
               </div>
            </div>

            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex flex-col justify-center">
               <h3 className="text-emerald-800 font-bold text-lg mb-4">Results</h3>
               <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-emerald-200 pb-2">
                     <span>State:</span>
                     <span className="font-bold uppercase">{densityObj < densityWater ? 'Floating' : 'Sunk'}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-200 pb-2">
                     <span>Displaced Water Vol:</span>
                     <span className="font-bold">{(volume * submergedRatio).toFixed(2)} m³</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-200 pb-2">
                     <span>Apparent Weight:</span>
                     <span className="font-bold">{Math.max(0, weight - buoyancyForce).toFixed(1)} N</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
