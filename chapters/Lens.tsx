
import React, { useState } from 'react';
import { translations } from '../utils/translations';
import { Language } from '../utils/types';

interface Props { lang: Language; }

type LensType = 'biconvex' | 'biconcave' | 'planoConvex' | 'planoConcave' | 'posMeniscus' | 'negMeniscus';

const LENS_CONFIG: Record<LensType, { nameKey: string, sign: number, path: string }> = {
  biconvex: { 
      nameKey: 'biconvex', 
      sign: 1, 
      path: "M 0 -100 Q 30 0 0 100 Q -30 0 0 -100" 
  },
  biconcave: { 
      nameKey: 'biconcave', 
      sign: -1, 
      path: "M -15 -100 Q 0 0 -15 100 L 15 100 Q 0 0 15 -100 Z" 
  },
  planoConvex: { 
      nameKey: 'planoConvex', 
      sign: 1, 
      path: "M -15 -100 L -15 100 Q 30 0 -15 -100 Z" 
  },
  planoConcave: { 
      nameKey: 'planoConcave', 
      sign: -1, 
      path: "M -15 -100 L -15 100 L 15 100 Q 0 0 15 -100 Z" 
  },
  posMeniscus: { 
      nameKey: 'positiveMeniscus', 
      sign: 1, 
      path: "M -20 -100 Q 20 0 -20 100 L 0 100 Q 30 0 0 -100 Z" 
  },
  negMeniscus: { 
      nameKey: 'negativeMeniscus', 
      sign: -1, 
      path: "M -10 -100 Q 10 0 -10 100 L 10 100 Q 40 0 10 -100 Z" 
  }
};

export const LensLab = ({ lang }: Props) => {
  const t = translations[lang];
  
  const [lensType, setLensType] = useState<LensType>('biconvex');
  const [focalLen, setFocalLen] = useState(100); // Absolute value input
  const [objDist, setObjDist] = useState(200);   // Absolute value input
  const [objHeight, setObjHeight] = useState(50);

  const config = LENS_CONFIG[lensType];
  const f = focalLen * config.sign; // Apply sign based on lens type (Converging +, Diverging -)
  const u = -objDist; // Object always on left
  
  // Lens Formula: 1/v - 1/u = 1/f => 1/v = 1/f + 1/u
  const v = (f * u) / (u + f);
  const m = v / u;
  const imageH = m * objHeight;
  const isVirtual = (v < 0 && u < 0) || (config.sign < 0); // Generally check if image is on same side or based on v sign

  // Ray tracing points
  // 1. Parallel Ray -> Refracts through Focus (F2 for convex, diverges from F1 for concave)
  const ray1Start = { x: u, y: -objHeight };
  const ray1Lens = { x: 0, y: -objHeight };
  // If convex, goes to F (positive side). If concave, appears to come from F (negative side).
  // Actually, standard formula handles lines to (v, imageH)
  
  // 2. Optical Center Ray -> Undeviated
  const ray2Start = { x: u, y: -objHeight };
  const ray2End = { x: v, y: -imageH }; // Goes through 0,0 to image

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="relative h-[60vh] w-full bg-slate-50 overflow-hidden border-b-4 border-slate-200 cursor-crosshair">
         <svg className="w-full h-full" viewBox="-400 -250 800 500" preserveAspectRatio="xMidYMid meet">
             <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                </pattern>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#eab308" /></marker>
                <marker id="arrow-green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#10b981" /></marker>
             </defs>
             
             {/* Background Grid */}
             <rect x="-400" y="-250" width="800" height="500" fill="url(#grid)" />
             
             {/* Optical Axis */}
             <line x1="-400" y1="0" x2="400" y2="0" stroke="#64748b" strokeWidth="2" />
             
             {/* Lens Shape */}
             <path d={config.path} fill="rgba(219, 234, 254, 0.5)" stroke="#3b82f6" strokeWidth="2" />
             <circle cx="0" cy="0" r="3" fill="white" stroke="#3b82f6" strokeWidth="2"/> {/* Optical Center */}
             
             {/* Focal Points */}
             {/* F1 (Left) and F2 (Right) for Convex. For Concave, primary focus is virtual. */}
             <circle cx={-focalLen} cy="0" r="3" fill="#94a3b8" />
             <text x={-focalLen} y="20" fontSize="12" fill="#64748b" textAnchor="middle" fontWeight="bold">F</text>
             <circle cx={focalLen} cy="0" r="3" fill="#94a3b8" />
             <text x={focalLen} y="20" fontSize="12" fill="#64748b" textAnchor="middle" fontWeight="bold">F'</text>
             
             <circle cx={-2*focalLen} cy="0" r="3" fill="#cbd5e1" />
             <text x={-2*focalLen} y="20" fontSize="12" fill="#94a3b8" textAnchor="middle" fontWeight="bold">2F</text>
             <circle cx={2*focalLen} cy="0" r="3" fill="#cbd5e1" />
             <text x={2*focalLen} y="20" fontSize="12" fill="#94a3b8" textAnchor="middle" fontWeight="bold">2F'</text>

             {/* Object */}
             <line x1={u} y1="0" x2={u} y2={-objHeight} stroke="#eab308" strokeWidth="4" markerEnd="url(#arrow)" />
             <text x={u} y={-objHeight - 10} fontSize="14" fill="#ca8a04" textAnchor="middle" fontWeight="bold">Object</text>

             {/* Image */}
             {Math.abs(v) < 2000 && (
                 <>
                    <line x1={v} y1="0" x2={v} y2={-imageH} stroke="#10b981" strokeWidth="4" strokeDasharray={v < 0 ? "5,5" : "0"} markerEnd="url(#arrow-green)" opacity={Math.abs(v) > 2000 ? 0 : 1} />
                    <text x={v} y={imageH > 0 ? 25 : -imageH - 10} fontSize="14" fill="#10b981" textAnchor="middle" fontWeight="bold" opacity={Math.abs(v) > 2000 ? 0 : 1}>Image</text>
                 </>
             )}

             {/* RAYS */}
             <g opacity="0.6" strokeWidth="2">
                 {/* Ray 1: Parallel to Axis -> Refracts through Focus */}
                 <line x1={u} y1={-objHeight} x2={0} y2={-objHeight} stroke="#f59e0b" /> {/* Incident */}
                 
                 {/* Refracted Ray 1 */}
                 {config.sign > 0 ? (
                     // Convex: Through F' on right
                     <>
                        <line x1={0} y1={-objHeight} x2={400} y2={-objHeight + ((-objHeight - 0)/(-0 - focalLen)) * (400 - 0)} stroke="#f59e0b" />
                        {/* Virtual extension if needed */}
                        {v < 0 && <line x1={0} y1={-objHeight} x2={v} y2={-imageH} stroke="#f59e0b" strokeDasharray="4,4" />}
                     </>
                 ) : (
                     // Concave: Diverges from F on left
                     <>
                        {/* Refracted ray going outwards */}
                        <line x1={0} y1={-objHeight} x2={400} y2={-objHeight + ((-objHeight - 0)/(0 - (-focalLen))) * (400 - 0)} stroke="#f59e0b" />
                        {/* Virtual trace back to F */}
                        <line x1={0} y1={-objHeight} x2={-focalLen} y2={0} stroke="#f59e0b" strokeDasharray="4,4" />
                     </>
                 )}

                 {/* Ray 2: Through Optical Center (Undeviated) */}
                 <line x1={u} y1={-objHeight} x2={400} y2={-objHeight + (imageH - objHeight)/(v - u) * (400 - u)} stroke="#8b5cf6" />
                 {/* Virtual extension for Ray 2 is just the line itself backwards, but let's be explicit if v < u */}
                 {v < u && <line x1={u} y1={-objHeight} x2={v} y2={-imageH} stroke="#8b5cf6" strokeDasharray="4,4" />}
                 
                 {/* Ray 3: Through Focus -> Refracts Parallel */}
                 {/* Usually messy to draw if object is inside focus. Skipped for clarity in basic lab. */}
             </g>
         </svg>
      </div>

      <div className="flex-grow p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto">
         <div className="space-y-6">
             <div className="flex justify-between items-center">
                 <h2 className="text-xl font-black uppercase text-slate-700">{t.lensLab}</h2>
             </div>
             
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                 <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 block">{t.lensTypes}</label>
                     <div className="grid grid-cols-3 gap-2">
                         {(Object.keys(LENS_CONFIG) as LensType[]).map(type => (
                             <button 
                                key={type} 
                                onClick={() => setLensType(type)}
                                className={`p-2 rounded border text-[10px] font-bold uppercase transition-colors ${lensType === type ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                             >
                                 {t[type as keyof typeof t] || type}
                             </button>
                         ))}
                     </div>
                 </div>

                 <div className="h-px bg-slate-100 my-4" />

                 <InputSlider label={t.focalLength} val={focalLen} set={setFocalLen} min={20} max={200} unit="mm" />
                 <InputSlider label={t.objectDist} val={objDist} set={setObjDist} min={30} max={350} unit="mm" />
                 <InputSlider label={t.objectHeight} val={objHeight} set={setObjHeight} min={10} max={100} unit="mm" />
             </div>
         </div>

         <div className="bg-slate-100 p-6 rounded-2xl flex flex-col justify-center border border-slate-200 space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <ResultBox label={t.imageDist} val={`${Math.abs(v).toFixed(1)} mm`} sub={v > 0 ? t.real : t.virtual} color={v > 0 ? "text-emerald-600" : "text-purple-600"} />
                <ResultBox label={t.magnification} val={`${Math.abs(m).toFixed(2)}x`} sub={m < 0 ? t.inverted : t.upright} />
                <ResultBox label={t.power} val={`${(1000/f).toFixed(2)} D`} sub="Diopters" />
                <ResultBox label="Lens Nature" val={config.sign > 0 ? t.convex : t.concave} />
             </div>
             
             <div className="bg-white p-4 rounded-xl text-xs text-slate-500 font-mono border border-slate-200">
                 <div className="mb-1 font-bold text-slate-700">Calculations:</div>
                 <div>1/v - 1/u = 1/f</div>
                 <div>u = -{objDist} (Cartesian)</div>
                 <div>f = {f} ({config.sign > 0 ? 'Converging' : 'Diverging'})</div>
             </div>
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

const ResultBox = ({ label, val, sub, color='text-slate-800' }: any) => (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex flex-col justify-between">
        <div className="text-[10px] text-slate-400 uppercase font-bold">{label}</div>
        <div>
            <div className={`text-xl font-black ${color}`}>{val}</div>
            {sub && <div className="text-xs font-bold text-slate-400">{sub}</div>}
        </div>
    </div>
);
