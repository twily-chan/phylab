
import React, { useState } from 'react';
import { translations } from '../utils/translations';
import { Language } from '../utils/types';
import * as Icons from 'lucide-react';

interface Props { lang: Language; mode: 'spectrum' | 'plane' | 'spherical' | 'absorption' }

export const ReflectionLab = ({ lang, mode }: Props) => {
  const t = translations[lang];

  // Spectrum
  const [wavelength, setWavelength] = useState(550); // nm

  // Plane Mirror
  const [incAngle, setIncAngle] = useState(45);
  const [subMode, setSubMode] = useState<'standard' | 'fermat' | 'fresnel'>('standard');

  // Spherical Mirror
  const [focalLen, setFocalLen] = useState(-50); // Negative = Concave, Positive = Convex
  const [objDist, setObjDist] = useState(100); // u
  const [objHeight, setObjHeight] = useState(40);

  // Absorption
  const [objColor, setObjColor] = useState('red');

  // --- Spherical Calcs ---
  const uCoord = -objDist;
  const fCoord = focalLen;
  const absF = Math.abs(focalLen);
  const vCoord = (fCoord * uCoord) / (uCoord - fCoord);
  const magnification = -vCoord / uCoord;
  const imageHeight = magnification * objHeight;

  // Wavelength to Color
  const getWavelengthColor = (wl: number) => {
    if (wl < 380) return '#555';
    if (wl < 440) return `rgb(${-(wl-440)/(440-380)*255}, 0, 255)`;
    if (wl < 490) return `rgb(0, ${(wl-440)/(490-440)*255}, 255)`;
    if (wl < 510) return `rgb(0, 255, ${(510-wl)/(510-490)*255})`;
    if (wl < 580) return `rgb(${(wl-510)/(580-510)*255}, 255, 0)`;
    if (wl < 645) return `rgb(255, ${(645-wl)/(645-580)*255}, 0)`;
    if (wl <= 750) return `rgb(255, 0, 0)`;
    return '#555';
  };

  // Fresnel Approx
  const rad = incAngle * Math.PI / 180;
  const fresnelR = 0.04 + (1 - 0.04) * Math.pow(1 - Math.cos(rad), 5);
  const fresnelPercent = (fresnelR * 100).toFixed(1);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* VISUALIZATION AREA - LIGHT THEME */}
      <div className="relative h-[55vh] w-full bg-slate-50 overflow-hidden border-b-4 border-slate-200">
         
         {mode === 'spectrum' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-white">
                 <div 
                   className="w-64 h-64 rounded-full shadow-2xl mb-8 transition-colors duration-100 flex items-center justify-center border-4 border-slate-100"
                   style={{ backgroundColor: getWavelengthColor(wavelength), boxShadow: `0 20px 50px ${getWavelengthColor(wavelength)}40` }}
                 >
                    <div className="text-white mix-blend-difference font-black text-3xl">{wavelength} nm</div>
                 </div>
                 <div className="w-full max-w-2xl h-12 rounded-lg relative overflow-hidden ring-4 ring-slate-100 shadow-inner">
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, violet, indigo, blue, green, yellow, orange, red)' }} />
                    <div className="absolute top-0 bottom-0 w-1 bg-black shadow-[0_0_5px_black]" style={{ left: `${((wavelength - 380) / (750-380)) * 100}%` }} />
                 </div>
                 <div className="flex justify-between w-full max-w-2xl text-slate-400 text-xs mt-2 font-mono">
                    <span>UV (380nm)</span>
                    <span>VISIBLE LIGHT</span>
                    <span>IR (750nm)</span>
                 </div>
             </div>
         )}

         {mode === 'plane' && (
             <div className="absolute inset-0 flex items-center justify-center bg-white">
                 <div className="absolute bottom-0 w-full h-1/2 bg-slate-100 border-t-4 border-blue-400">
                    <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxwYXRoIGQ9Ik0wIDBMNCA0IiBzdHJva2U9IiNlMmU4ZjAiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-50" />
                 </div>

                 {subMode === 'standard' && (
                     <div className="absolute bottom-1/2 left-1/2 w-0 h-0">
                        <div className="absolute bottom-0 w-[2px] h-64 bg-slate-800 border-l border-dashed border-slate-300 origin-bottom -translate-x-1/2 z-0" />
                        <div 
                            className="absolute bottom-0 w-1.5 h-[400px] bg-rose-500 origin-bottom shadow-sm"
                            style={{ transform: `rotate(${-incAngle}deg) translateX(-50%)` }}
                        >
                             <div className="absolute top-[10%] left-2 text-rose-600 text-xs font-bold rotate-90">INCIDENT (i)</div>
                             <div className="absolute bottom-0 w-full h-4 bg-rose-600 arrow-head" /> 
                        </div>
                        <div 
                            className="absolute bottom-0 w-1.5 h-[400px] bg-rose-500 origin-bottom shadow-sm"
                            style={{ transform: `rotate(${incAngle}deg) translateX(-50%)` }}
                        >
                            <div className="absolute top-[10%] right-2 text-rose-600 text-xs font-bold -rotate-90">REFLECTED (r)</div>
                        </div>
                        <div className="absolute -top-16 -left-16 w-32 h-32 border-t-2 border-slate-400 rounded-full" 
                             style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)', transform: `scale(${Math.min(1, incAngle/45)})` }} />
                        <div className="absolute bottom-4 -translate-x-1/2 text-slate-800 font-bold bg-white/80 px-3 py-1 rounded shadow-sm border border-slate-200">
                            i = r = {incAngle}°
                        </div>
                     </div>
                 )}

                 {subMode === 'fermat' && (
                     <div className="absolute inset-0 w-full h-full pointer-events-none">
                         <svg className="w-full h-full overflow-visible">
                            <circle cx="20%" cy="30%" r="6" fill="#ef4444" />
                            <text x="20%" y="25%" textAnchor="middle" className="font-bold fill-slate-700">A</text>
                            <circle cx="80%" cy="30%" r="6" fill="#3b82f6" />
                            <text x="80%" y="25%" textAnchor="middle" className="font-bold fill-slate-700">B</text>
                            <path d="M 20% 30% L 35% 50% L 80% 30%" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" fill="none" />
                            <path d="M 20% 30% L 65% 50% L 80% 30%" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" fill="none" />
                            <path d="M 20% 30% L 50% 50% L 80% 30%" stroke="#10b981" strokeWidth="4" fill="none" />
                            <text x="50%" y="45%" textAnchor="middle" className="font-bold text-xs fill-emerald-600 bg-white">Shortest Path</text>
                         </svg>
                     </div>
                 )}

                 {subMode === 'fresnel' && (
                     <div className="absolute inset-0 flex items-center justify-center">
                         <div className="absolute bottom-1/2 left-1/2 w-0 h-0">
                            <div className="absolute bottom-0 w-4 h-[400px] bg-yellow-400/50 origin-bottom -translate-x-1/2 blur-sm" style={{ transform: `rotate(${-incAngle}deg)` }} />
                            <div className="absolute bottom-0 w-4 h-[400px] bg-yellow-400 origin-bottom -translate-x-1/2 blur-sm transition-opacity duration-100" 
                                 style={{ transform: `rotate(${incAngle}deg)`, opacity: fresnelR }} />
                            <div className="absolute top-0 w-4 h-[400px] bg-yellow-400 origin-top -translate-x-1/2 blur-sm opacity-20" 
                                 style={{ transform: `rotate(${180 + incAngle/1.5}deg)` }} />
                         </div>
                         <div className="absolute top-[20%] right-[10%] bg-white p-4 rounded-xl shadow-lg border border-slate-200">
                             <h4 className="font-bold text-slate-700 mb-2">Fresnel Reflectance</h4>
                             <div className="w-40 h-2 bg-slate-200 rounded-full overflow-hidden">
                                 <div className="h-full bg-yellow-500 transition-all duration-100" style={{ width: `${fresnelPercent}%` }} />
                             </div>
                             <div className="text-right font-mono text-lg font-black mt-1">{fresnelPercent}%</div>
                         </div>
                     </div>
                 )}
             </div>
         )}

         {mode === 'spherical' && (
             <div className="w-full h-full relative overflow-hidden bg-slate-50">
                <svg className="w-full h-full" viewBox="-400 -200 800 400" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect x="-400" y="-200" width="800" height="400" fill="url(#grid)" />
                    <line x1="-400" y1="0" x2="400" y2="0" stroke="#64748b" strokeWidth="2" />
                    <path d={`M 0 -150 Q ${focalLen < 0 ? -30 : 30} 0 0 150`} fill="none" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />
                    <path d={`M 0 -150 Q ${focalLen < 0 ? -30 : 30} 0 0 150`} fill="none" stroke="#94a3b8" strokeWidth="10" strokeDasharray="4,6" className="opacity-40" transform={`translate(${focalLen < 0 ? 6 : -6}, 0)`} />
                    
                    {/* Pole (P) */}
                    <circle cx="0" cy="0" r="3" fill="white" stroke="#64748b" strokeWidth="2" />
                    <text x="0" y="20" fill="#64748b" fontSize="12" fontWeight="bold" textAnchor="middle">P</text>

                    {/* Left Points */}
                    <circle cx={-absF} cy="0" r="3" fill="#94a3b8" />
                    <text x={-absF} y="20" fill="#94a3b8" fontSize="12" fontWeight="bold" textAnchor="middle">F</text>
                    <circle cx={-2*absF} cy="0" r="3" fill="#94a3b8" />
                    <text x={-2*absF} y="20" fill="#94a3b8" fontSize="12" fontWeight="bold" textAnchor="middle">C</text>

                    {/* Right Points */}
                    <circle cx={absF} cy="0" r="3" fill="#94a3b8" />
                    <text x={absF} y="20" fill="#94a3b8" fontSize="12" fontWeight="bold" textAnchor="middle">F'</text>
                    <circle cx={2*absF} cy="0" r="3" fill="#94a3b8" />
                    <text x={2*absF} y="20" fill="#94a3b8" fontSize="12" fontWeight="bold" textAnchor="middle">C'</text>

                    {/* Active Focus Highlight */}
                    <circle cx={fCoord} cy="0" r="4" fill="#ef4444" opacity="0.5" />
                    
                    {/* Object */}
                    <line x1={uCoord} y1="0" x2={uCoord} y2={-objHeight} stroke="#eab308" strokeWidth="5" markerEnd="url(#arrow)" />
                    <text x={uCoord} y={-objHeight - 15} fill="#eab308" fontSize="14" fontWeight="bold" textAnchor="middle">Object</text>
                    
                    {/* Image */}
                    <line x1={vCoord} y1="0" x2={vCoord} y2={-imageHeight} stroke="#10b981" strokeWidth="5" strokeDasharray={vCoord > 0 ? "5,3" : ""} markerEnd="url(#arrow-green)" opacity={Math.abs(vCoord) > 1000 ? 0 : 1} />
                    <text x={vCoord} y={imageHeight > 0 ? 25 : -imageHeight - 15} fill="#10b981" fontSize="14" fontWeight="bold" textAnchor="middle" opacity={Math.abs(vCoord) > 1000 ? 0 : 1}>Image</text>
                    
                    {/* Rays */}
                    <g opacity="0.6">
                        <line x1={uCoord} y1={-objHeight} x2={0} y2={-objHeight} stroke="#f59e0b" strokeWidth="2" />
                        <line x1={0} y1={-objHeight} x2={fCoord + (fCoord - 0)*10} y2={0 + (0 - (-objHeight))*10} stroke="#f59e0b" strokeWidth="2" />
                        {fCoord > 0 && <line x1={0} y1={-objHeight} x2={fCoord} y2={0} stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,4" />}
                        <line x1={uCoord} y1={-objHeight} x2={0} y2={-objHeight * (0 - 2*fCoord)/(uCoord - 2*fCoord)} stroke="#ef4444" strokeWidth="2" />
                        <line x1={uCoord} y1={-objHeight} x2={0} y2={0} stroke="#8b5cf6" strokeWidth="2" />
                        <line x1={0} y1={0} x2={uCoord} y2={objHeight} stroke="#8b5cf6" strokeWidth="2" /> 
                    </g>
                    <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#eab308" /></marker>
                        <marker id="arrow-green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#10b981" /></marker>
                    </defs>
                </svg>
             </div>
         )}

         {mode === 'absorption' && (
             <div className="absolute inset-0 flex items-center justify-center bg-white">
                 {/* Light Source */}
                 <div className="absolute top-[10%] left-[10%] -rotate-45">
                    <div className="w-12 h-6 bg-slate-800 rounded-lg shadow-lg" />
                    <div className="w-4 h-4 bg-yellow-100 rounded-full blur-sm absolute top-1 left-full" />
                 </div>
                 
                 {/* Beam */}
                 <div className="absolute w-[400px] h-10 bg-gradient-to-r from-transparent via-white/80 to-white left-[12%] top-[12%] rotate-[30deg] origin-left mix-blend-multiply z-10 pointer-events-none">
                     <div className="w-full h-full bg-gradient-to-b from-red-500 via-green-500 to-blue-500 opacity-30" />
                 </div>

                 {/* Object */}
                 <div 
                   className="w-48 h-48 rounded shadow-2xl z-0 transition-colors duration-500 border-4 border-slate-200"
                   style={{ backgroundColor: objColor }}
                 />

                 {/* Reflected Color */}
                 <div 
                   className="absolute w-[300px] h-10 right-[15%] top-[12%] -rotate-[30deg] origin-right pointer-events-none filter blur-xl opacity-50 transition-colors duration-500"
                   style={{ backgroundColor: objColor === 'white' ? 'white' : objColor === 'black' ? 'transparent' : objColor }}
                 />
                 
                 {/* Label */}
                 <div className="absolute bottom-[20%] font-bold text-slate-500 text-center">
                     {objColor === 'white' && "Reflects All Colors"}
                     {objColor === 'black' && "Absorbs All Colors (Heat)"}
                     {objColor === 'red' && "Reflects Red, Absorbs Green & Blue"}
                     {objColor === 'green' && "Reflects Green, Absorbs Red & Blue"}
                     {objColor === 'blue' && "Reflects Blue, Absorbs Red & Green"}
                 </div>
             </div>
         )}
      </div>

      {/* CONTROLS */}
      <div className="flex-grow p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto">
         <div className="space-y-6">
             <div className="flex justify-between items-center">
                 <h2 className="text-xl font-black uppercase text-slate-700">{t[mode === 'spectrum' ? 'spectrum' : mode === 'plane' ? 'planeMirror' : mode === 'absorption' ? 'absorption' : 'sphericalMirror']}</h2>
             </div>
             
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                 {mode === 'spectrum' && (
                     <InputSlider label={`${t.wavelength} (nm)`} val={wavelength} set={setWavelength} min={380} max={750} />
                 )}
                 {mode === 'plane' && (
                     <>
                        <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                            {['standard', 'fermat', 'fresnel'].map(m => (
                                <button key={m} onClick={() => setSubMode(m as any)} className={`flex-1 py-1.5 text-xs font-bold uppercase rounded ${subMode === m ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{m === 'standard' ? t.planeMirror : m === 'fermat' ? 'Fermat' : 'Fresnel'}</button>
                            ))}
                        </div>
                        <InputSlider label={`${t.incidentAngle} (°)`} val={incAngle} set={setIncAngle} min={0} max={85} />
                     </>
                 )}
                 {mode === 'spherical' && (
                     <>
                        <div className="flex gap-2 mb-4">
                            <button onClick={() => setFocalLen(-50)} className={`flex-1 py-2 rounded-lg font-bold text-xs shadow-sm border transition-all ${focalLen < 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}>{t.concave}</button>
                            <button onClick={() => setFocalLen(50)} className={`flex-1 py-2 rounded-lg font-bold text-xs shadow-sm border transition-all ${focalLen > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}>{t.convex}</button>
                        </div>
                        <InputSlider label={t.focalLength} val={Math.abs(focalLen)} set={(v: number) => setFocalLen(focalLen < 0 ? -v : v)} min={20} max={200} />
                        <InputSlider label={t.objectDist} val={objDist} set={setObjDist} min={20} max={300} />
                        <InputSlider label={t.objectHeight} val={objHeight} set={setObjHeight} min={10} max={100} />
                     </>
                 )}
                 {mode === 'absorption' && (
                     <div>
                         <label className="text-xs font-bold text-slate-600 mb-2 block">{t.objectColor}</label>
                         <div className="flex gap-2">
                             {['red', 'green', 'blue', 'white', 'black'].map(c => (
                                 <button 
                                    key={c} 
                                    onClick={() => setObjColor(c)}
                                    className={`w-10 h-10 rounded-full border-2 shadow-sm ${objColor === c ? 'scale-110 border-blue-500' : 'border-slate-200'}`}
                                    style={{ backgroundColor: c }}
                                 />
                             ))}
                         </div>
                     </div>
                 )}
             </div>
         </div>

         <div className="bg-slate-100 p-6 rounded-2xl flex flex-col justify-center border border-slate-200">
            {mode === 'spectrum' && (
                <div className="text-sm text-slate-600 space-y-2">
                    <p><strong>Visible Light:</strong> 380nm (Violet) to 750nm (Red).</p>
                    <p>Our eyes are most sensitive to green light (~555nm).</p>
                </div>
            )}
            {mode === 'plane' && (
                <div className="text-center space-y-4">
                    {subMode === 'standard' && <><div className="text-4xl font-black text-slate-700 mb-2">∠i = ∠r</div><p className="text-xs text-slate-400">Law of Reflection</p></>}
                    {subMode === 'fermat' && <div className="text-sm text-slate-600"><h4 className="font-bold text-slate-800 mb-2">{t.fermat}</h4><p>Light takes the path of least time.</p></div>}
                    {subMode === 'fresnel' && <div className="text-sm text-slate-600"><h4 className="font-bold text-slate-800 mb-2">{t.fresnel}</h4><p>Reflectance increases at grazing angles.</p></div>}
                </div>
            )}
            {mode === 'spherical' && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <ResultBox label={t.imageDist} val={`${Math.abs(vCoord).toFixed(1)} (${vCoord > 0 ? 'Right/Virtual' : 'Left/Real'})`} />
                    <ResultBox label={t.magnification} val={`${Math.abs(magnification).toFixed(2)}x`} />
                    <ResultBox label="Nature" val={vCoord < 0 ? t.real : t.virtual} color={vCoord < 0 ? 'text-emerald-600' : 'text-purple-600'} />
                    <ResultBox label="Orientation" val={magnification < 0 ? t.inverted : t.upright} />
                </div>
            )}
            {mode === 'absorption' && (
                <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{t.absorption}</h3>
                    <p className="text-sm text-slate-600">Objects appear a certain color because they reflect that color of light and absorb all others. Black objects absorb almost all light energy as heat.</p>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

const InputSlider = ({ label, val, set, min, max }: any) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-bold text-slate-600"><span>{label}</span> <span>{val}</span></div>
    <input type="range" min={min} max={max} value={val} onChange={(e) => set(Number(e.target.value))} className="w-full accent-blue-600" />
  </div>
);

const ResultBox = ({ label, val, color='text-slate-800' }: any) => (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
        <div className="text-[10px] text-slate-400 uppercase font-bold">{label}</div>
        <div className={`text-lg font-black ${color}`}>{val}</div>
    </div>
);
