
import React, { useState, useEffect, useRef } from 'react';
import { translations } from '../utils/translations';
import { Language } from '../utils/types';
import * as Icons from 'lucide-react';

interface Props { lang: Language; mode: 'vernier' | 'screw' }

type MeasurementObject = { id: string; name: { en: string; bn: string }; size: number; color: string; type: 'round' | 'rect' | 'wire' };

const OBJECTS: MeasurementObject[] = [
    { id: 'none', name: { en: 'None', bn: 'কিছুই না' }, size: 0, color: 'transparent', type: 'rect' },
    // Tiny Items (Screw Gauge)
    { id: 'hair', name: { en: 'Human Hair', bn: 'মানুষের চুল' }, size: 0.07, color: '#333', type: 'wire' },
    { id: 'wire1', name: { en: 'Copper Wire', bn: 'তামার তার' }, size: 1.63, color: '#b45309', type: 'wire' },
    { id: 'paper', name: { en: 'Paper Sheet', bn: 'কাগজ' }, size: 0.10, color: '#f8fafc', type: 'rect' },
    { id: 'glass', name: { en: 'Glass Slide', bn: 'গ্লাস স্লাইড' }, size: 2.15, color: '#a5f3fc', type: 'rect' },
    { id: 'shot', name: { en: 'Lead Shot', bn: 'সীসার গুলি' }, size: 3.42, color: '#475569', type: 'round' },
    { id: 'led', name: { en: 'LED', bn: 'এলইডি' }, size: 5.00, color: '#ef4444', type: 'round' },
    // Medium Items (Vernier)
    { id: 'marble', name: { en: 'Marble', bn: 'মার্বেল' }, size: 12.45, color: '#14b8a6', type: 'round' },
    { id: 'dice', name: { en: 'Dice', bn: 'লুডুর ছক্কা' }, size: 15.20, color: '#fca5a5', type: 'rect' },
    { id: 'coin1', name: { en: 'Coin (Small)', bn: 'মুদ্রা (ছোট)' }, size: 18.50, color: '#d1d5db', type: 'round' },
    { id: 'coin2', name: { en: 'Coin (Large)', bn: 'মুদ্রা (বড়)' }, size: 24.35, color: '#fbbf24', type: 'round' },
    { id: 'battery', name: { en: 'AA Battery', bn: 'ব্যাটারি AA' }, size: 14.50, color: '#1e293b', type: 'round' },
    { id: 'nut', name: { en: 'Hex Nut', bn: 'নাট' }, size: 11.15, color: '#9ca3af', type: 'rect' },
    { id: 'bottlecap', name: { en: 'Bottle Cap', bn: 'বোতলের ছিপি' }, size: 29.80, color: '#ef4444', type: 'round' },
    // Large Items
    { id: 'pen', name: { en: 'Pen', bn: 'কলম' }, size: 145.0, color: '#2563eb', type: 'rect' },
    { id: 'phone', name: { en: 'Smartphone', bn: 'স্মার্টফোন' }, size: 158.5, color: '#0f172a', type: 'rect' },
    { id: 'card', name: { en: 'Credit Card', bn: 'ক্রেডিট কার্ড' }, size: 85.6, color: '#3b82f6', type: 'rect' },
    { id: 'spoon', name: { en: 'Teaspoon', bn: 'চামচ' }, size: 135.0, color: '#cbd5e1', type: 'rect' },
];

export const MeasurementLab = ({ lang, mode }: Props) => {
  const t = translations[lang];
  const [activeObjId, setActiveObjId] = useState('none');
  const [val, setVal] = useState(0); // Current measurement reading in mm
  const activeObj = OBJECTS.find(o => o.id === activeObjId) || OBJECTS[0];

  // Tool Configs
  const [vernierDivs, setVernierDivs] = useState(10); 
  const mainScaleDiv = 1; // 1mm
  const vernierConst = mainScaleDiv / vernierDivs; 

  const [pitch, setPitch] = useState(1); 
  const [circDivs, setCircDivs] = useState(100); 
  const leastCount = pitch / circDivs;

  const viewportRef = useRef<HTMLDivElement>(null);

  // Initial Placement
  useEffect(() => {
     if (activeObj.size > 0) {
        setVal(activeObj.size + (mode === 'screw' ? 2 : 10)); // Open slightly more than object
     } else {
        setVal(mode === 'screw' ? 5 : 20);
     }
  }, [activeObj, mode]);

  // Clamping Logic
  const handleSlide = (newVal: number) => {
     let v = Math.max(0, newVal);
     // Collision check
     if (activeObj.id !== 'none' && v < activeObj.size) {
         v = activeObj.size; 
     }
     // Limit max opening (250mm for vernier, 25mm for screw)
     const max = mode === 'vernier' ? 250 : 25;
     if (v > max) v = max;
     
     setVal(v);
  };

  // Math Helpers
  // Vernier
  const msr = Math.floor(val);
  const vsrRaw = (val - msr) / vernierConst;
  const vsr = Math.round(vsrRaw);
  const displayValVernier = (msr + vsr * vernierConst).toFixed(2);

  // Screw
  const screwMsr = Math.floor(val / pitch) * pitch; 
  const screwRem = val - screwMsr;
  const csr = Math.round(screwRem / leastCount);
  const displayValScrew = (screwMsr + csr * leastCount).toFixed(3);

  return (
    <div className="flex flex-col h-full bg-slate-50">
       
       {/* === SCROLLABLE VIEWPORT === */}
       <div 
         ref={viewportRef}
         className="relative h-[60vh] w-full bg-slate-100 border-b-4 border-slate-200 overflow-x-auto overflow-y-hidden shadow-inner custom-scrollbar"
       >
           <div className="relative h-full min-w-max px-10 pt-10">
              
              {/* === VERNIER CALIPER === */}
              {mode === 'vernier' && (
                  <div className="relative w-[2800px] h-[300px] select-none mt-10">
                      
                      {/* OBJECT */}
                      {activeObj.id !== 'none' && (
                          <div 
                            className="absolute z-10 flex items-center justify-center shadow-sm border border-black/20"
                            style={{
                                left: `50px`, // Fixed Jaw position is 40px, jaw thickness 10px -> 50px
                                top: '120px', // Between jaws
                                width: `${activeObj.size * 10}px`, // 10px per mm
                                height: activeObj.type === 'wire' ? '150px' : activeObj.type === 'round' ? `${activeObj.size * 10}px` : '60px',
                                backgroundColor: activeObj.color,
                                borderRadius: activeObj.type === 'round' ? '50%' : '2px',
                                transform: 'translateY(-50%)'
                            }}
                          >
                             {activeObj.size > 20 && <span className="text-[10px] text-white font-bold drop-shadow-md">{activeObj.name[lang]}</span>}
                          </div>
                      )}

                      {/* MAIN SCALE (Fixed) - 25cm Length */}
                      <div className="absolute top-[50px] left-[40px] w-[2600px] h-[60px] bg-gradient-to-b from-slate-200 to-slate-300 border border-slate-400 rounded-r-lg shadow-md flex items-end">
                          <div className="absolute left-[-20px] top-[60px] w-[20px] h-[150px] bg-gradient-to-r from-slate-300 to-slate-400 border border-slate-500 rounded-bl-xl shadow-lg" /> {/* Fixed Jaw Down */}
                          <div className="absolute left-[-20px] top-[-40px] w-[20px] h-[40px] bg-slate-300 border border-slate-500 rounded-tl-xl" /> {/* Fixed Jaw Up */}
                          
                          {/* Ruler Ticks */}
                          <div className="absolute bottom-0 left-[10px] w-full h-[30px] flex pointer-events-none">
                              {[...Array(26)].map((_, cm) => (
                                  <div key={cm} className="relative w-[100px] h-full border-l border-slate-500">
                                      <span className="absolute -top-5 -left-2 text-xs font-bold text-slate-600">{cm}</span>
                                      {[...Array(10)].map((_, mm) => (
                                          <div key={mm} className={`absolute bottom-0 w-[1px] bg-slate-500 ${mm===5 ? 'h-[18px]' : 'h-[10px]'}`} style={{ left: `${mm*10}px` }} />
                                      ))}
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* VERNIER SCALE (Sliding) */}
                      <div 
                        className="absolute top-[50px] h-[60px] cursor-grab active:cursor-grabbing group z-20"
                        style={{ left: `${50 + val * 10}px` }} // 1mm = 10px
                        onMouseDown={(e) => {
                            const startX = e.clientX;
                            const startVal = val;
                            const handleMove = (ev: MouseEvent) => {
                                const diff = (ev.clientX - startX) / 10;
                                handleSlide(startVal + diff);
                            };
                            window.addEventListener('mousemove', handleMove);
                            window.addEventListener('mouseup', () => window.removeEventListener('mousemove', handleMove), { once: true });
                        }}
                      >
                          {/* Sliding Jaw Down */}
                          <div className="absolute left-[-10px] top-[60px] w-[20px] h-[150px] bg-gradient-to-r from-slate-300 to-slate-400 border border-slate-500 rounded-br-xl shadow-lg" />
                          {/* Sliding Jaw Up */}
                          <div className="absolute left-[-10px] top-[-40px] w-[20px] h-[40px] bg-slate-300 border border-slate-500 rounded-tr-xl" />
                          
                          {/* Transparent Vernier Plate */}
                          <div 
                              className="absolute left-0 top-0 h-[60px] bg-yellow-100/10 border-x border-b border-yellow-600/50 flex items-end overflow-hidden"
                              style={{ width: `${vernierDivs * 10 + 15}px` }}
                          >
                              {/* Vernier Ticks (Red) - No Numbers */}
                              <div className="absolute top-0 w-full h-full pointer-events-none">
                                  {[...Array(vernierDivs + 1)].map((_, i) => (
                                      <div key={i} className="absolute top-0 w-[1px] bg-red-600 h-[25px]" 
                                           style={{ left: `${i * (10 * (1 - vernierConst))}px` }} />
                                  ))}
                              </div>
                              
                              {/* Thumb Grip */}
                              <div className="absolute bottom-1 right-2 w-4 h-6 flex gap-1 justify-center">
                                 {[1,2].map(i => <div key={i} className="w-0.5 h-full bg-slate-400/50" />)}
                              </div>
                              
                              {/* Locking Screw */}
                              <div className="absolute -top-3 right-2 w-4 h-4 bg-slate-300 rounded-full border border-slate-500 shadow-sm" />
                          </div>
                      </div>
                  </div>
              )}

              {/* === SCREW GAUGE === */}
              {mode === 'screw' && (
                  <div className="relative w-[1000px] h-[300px] flex items-center select-none pt-20 pl-20">
                      
                      {/* U-Frame */}
                      <div className="absolute left-0 top-[50px] w-[150px] h-[150px] border-[20px] border-blue-900 rounded-l-[80px] rounded-r-none border-r-0 shadow-2xl" />
                      <div className="absolute left-[130px] top-[115px] w-[20px] h-[20px] bg-slate-400 border border-slate-600" /> {/* Anvil */}

                      {/* OBJECT */}
                      {activeObj.id !== 'none' && (
                          <div 
                            className="absolute top-[125px] z-10 flex items-center justify-center bg-opacity-90 shadow-sm border border-black/10"
                            style={{
                                left: '150px',
                                width: `${Math.min(val, activeObj.size) * 20}px`, // 20px per mm
                                height: activeObj.type === 'wire' ? '150px' : activeObj.type === 'round' ? `${activeObj.size * 10}px` : '30px',
                                backgroundColor: activeObj.color,
                                transform: 'translateY(-50%)',
                                borderRadius: activeObj.type === 'round' ? '50%' : '1px'
                            }}
                          />
                      )}

                      {/* Spindle */}
                      <div className="absolute top-[118px] h-[14px] bg-slate-300 border-y border-slate-400" 
                           style={{ left: `${150}px`, width: `${val * 20}px` }} /> 

                      {/* Sleeve (Main Scale) */}
                      <div className="absolute left-[150px] top-[100px] w-[550px] h-[50px] bg-gradient-to-b from-slate-200 to-slate-300 border border-slate-500 flex items-center rounded-r-sm shadow-inner">
                          <div className="w-full h-[1px] bg-slate-800" /> {/* Datum Line */}
                          {/* Ticks */}
                          <div className="absolute inset-0">
                              {[...Array(50)].map((_, i) => (
                                  <div key={i} className="absolute top-1/2 w-[1px] bg-slate-700 h-[12px]" style={{ left: `${i * 20}px` }}> {/* 20px per mm */}
                                      {i % 5 === 0 && <span className="absolute -top-5 -left-1 text-[10px] font-bold text-slate-700">{i}</span>}
                                      {/* Half mm ticks below */}
                                      {<div className="absolute top-[12px] h-[6px] w-[1px] bg-slate-500 left-[10px]" />}
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Thimble (Rotating Scale) */}
                      <div 
                        className="absolute top-[75px] h-[100px] w-[120px] bg-gradient-to-b from-slate-400 via-slate-100 to-slate-400 border-x border-slate-500 cursor-ew-resize flex items-center shadow-2xl z-20"
                        style={{ left: `${150 + val * 20}px` }} 
                        onMouseDown={(e) => {
                            const startX = e.clientX;
                            const startVal = val;
                            const sensitivity = 50; // pixels per mm movement
                            const handleMove = (ev: MouseEvent) => {
                                const diff = (ev.clientX - startX) / sensitivity; 
                                handleSlide(startVal + diff);
                            };
                            window.addEventListener('mousemove', handleMove);
                            window.addEventListener('mouseup', () => window.removeEventListener('mousemove', handleMove), { once: true });
                        }}
                      >
                           {/* Beveled Edge */}
                           <div className="absolute left-0 top-0 bottom-0 w-[30px] border-r border-slate-400 bg-slate-300 opacity-50 skew-x-6 origin-left" />

                           {/* Circular Scale Ticks */}
                           <div className="w-full h-full relative overflow-hidden">
                               <div className="absolute left-0 top-0 bottom-0 w-[40px] border-r border-slate-500 flex flex-col justify-center transition-transform duration-75"
                                    style={{ transform: `translateY(${- (val % pitch) / pitch * 1000}px)` }} 
                               >
                                   {/* Repeat ticks for infinite scroll effect */}
                                   {[...Array(circDivs * 4)].map((_, i) => {
                                       const num = (circDivs * 4 - i) % circDivs;
                                       return (
                                           <div key={i} className="w-full h-[10px] border-b border-slate-500/50 relative flex items-center justify-end pr-1">
                                                {num % 5 === 0 && <span className="text-[9px] font-bold text-slate-800">{num}</span>}
                                                <div className={`h-[1px] bg-black ${num%5===0 ? 'w-[15px]' : 'w-[8px]'}`} />
                                           </div>
                                       )
                                   })}
                               </div>
                           </div>
                           
                           {/* Knurled Grip */}
                           <div className="absolute right-0 top-0 bottom-0 w-[40px] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 border-l border-slate-500" />
                           
                           {/* Ratchet */}
                           <div className="absolute -right-[25px] top-[25px] w-[25px] h-[50px] bg-slate-800 rounded-r-md shadow-lg" />
                      </div>
                  </div>
              )}
           </div>

           {/* Reading Overlay (Fixed Position) */}
           <div className="fixed top-24 right-4 bg-white/95 p-4 rounded-xl shadow-2xl border border-slate-200 backdrop-blur-sm z-50 pointer-events-none">
               <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">{t.totalReading}</h3>
               <div className="text-4xl font-black text-slate-800 font-mono">
                   {mode === 'vernier' ? displayValVernier : displayValScrew} <span className="text-lg text-slate-500">mm</span>
               </div>
           </div>
       </div>

       {/* === CONTROLS === */}
       <div className="flex-grow p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto">
           <div className="space-y-6">
               <h2 className="text-xl font-black uppercase text-slate-700">{t[mode]}</h2>
               
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                   <label className="text-xs font-bold text-slate-500 block mb-2">{t.selectObject}</label>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                       {OBJECTS.filter(o => {
                           if (mode === 'screw') return o.size < 25 && (o.type === 'wire' || o.type === 'rect' || o.size < 10);
                           if (mode === 'vernier') return o.size < 220 && o.size > 5;
                           return o.size > 20;
                       }).map(obj => (
                           <button 
                             key={obj.id} 
                             onClick={() => setActiveObjId(obj.id)}
                             className={`p-2 rounded border text-xs font-bold truncate transition-all ${activeObjId === obj.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                           >
                               {obj.name[lang]}
                           </button>
                       ))}
                   </div>
                   
                   <div className="h-px bg-slate-100 my-4" />

                   {/* Settings */}
                   {mode === 'vernier' && (
                       <div className="space-y-4">
                           <div>
                               <label className="text-xs font-bold text-slate-500 block mb-2">{t.vernierScale} Divisions (n)</label>
                               <div className="flex gap-2">
                                   {[10, 20, 50].map(d => (
                                       <button key={d} onClick={() => setVernierDivs(d)} className={`flex-1 py-2 rounded text-xs font-bold border ${vernierDivs===d ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}>
                                           {d}
                                       </button>
                                   ))}
                                   <input 
                                     type="number" 
                                     value={vernierDivs} 
                                     onChange={(e) => setVernierDivs(Number(e.target.value))}
                                     className="w-16 p-1 border rounded text-center text-xs font-bold"
                                     min="5" max="100"
                                   />
                               </div>
                               <div className="text-[10px] text-slate-400 mt-1">VC = 1/{vernierDivs} = {vernierConst.toFixed(3)} mm</div>
                           </div>
                       </div>
                   )}
                   {mode === 'screw' && (
                       <>
                           <label className="text-xs font-bold text-slate-500 block mb-2">{t.leastCount} (LC)</label>
                           <div className="flex gap-2">
                               <button onClick={() => {setCircDivs(100); setPitch(1);}} className={`flex-1 py-2 rounded text-xs font-bold border ${circDivs===100 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}>1/100 (0.01mm)</button>
                               <button onClick={() => {setCircDivs(50); setPitch(0.5);}} className={`flex-1 py-2 rounded text-xs font-bold border ${circDivs===50 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}>0.5/50 (0.01mm)</button>
                           </div>
                       </>
                   )}
                   
                   {/* Fine Tune Slider */}
                   <label className="text-xs font-bold text-slate-500 block mt-4">Manual Adjustment</label>
                   <input 
                      type="range" 
                      min="0" 
                      max={mode === 'vernier' ? 250 : 25} 
                      step={mode === 'screw' ? 0.01 : 0.1}
                      value={val} 
                      onChange={(e) => setVal(Number(e.target.value))} 
                      className="w-full accent-blue-600"
                   />
               </div>
           </div>

           <div className="bg-slate-100 p-6 rounded-2xl flex flex-col justify-center border border-slate-200">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Icons.Calculator size={18}/> Calculation Breakdown</h3>
               
               {mode === 'vernier' && (
                   <div className="space-y-3 font-mono text-sm">
                       <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                           <span className="text-slate-500">{t.msr}</span>
                           <span className="font-bold">{msr} mm</span>
                       </div>
                       <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                           <span className="text-slate-500">{t.vsr} (Matching Line)</span>
                           <span className="font-bold text-red-600">{vsr}</span>
                       </div>
                       <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                           <span className="text-slate-500">{t.vernierConst}</span>
                           <span className="font-bold">{vernierConst.toFixed(3)} mm</span>
                       </div>
                       <div className="mt-2 p-3 bg-blue-50 text-blue-800 rounded font-bold border border-blue-100 text-center text-lg">
                           L = {msr} + ({vsr} × {vernierConst.toFixed(3)}) = {displayValVernier} mm
                       </div>
                   </div>
               )}

               {mode === 'screw' && (
                   <div className="space-y-3 font-mono text-sm">
                        <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                           <span className="text-slate-500">{t.linearScale}</span>
                           <span className="font-bold">{screwMsr} mm</span>
                       </div>
                       <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                           <span className="text-slate-500">{t.csr}</span>
                           <span className="font-bold">{csr}</span>
                       </div>
                       <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                           <span className="text-slate-500">{t.leastCount}</span>
                           <span className="font-bold">{leastCount} mm</span>
                       </div>
                       <div className="mt-2 p-3 bg-blue-50 text-blue-800 rounded font-bold border border-blue-100 text-center text-lg">
                           D = {screwMsr} + ({csr} × {leastCount}) = {displayValScrew} mm
                       </div>
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};
