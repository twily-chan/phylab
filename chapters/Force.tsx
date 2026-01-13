import React, { useState, useEffect, useRef } from 'react';
import { Environment } from '../components/Environment';
import { Graph } from '../components/Graph';
import { translations } from '../utils/translations';
import { Language, SimulationState } from '../utils/types';
import * as Icons from 'lucide-react';

interface Props {
  lang: Language;
  mode: 'collision' | 'friction' | 'newton2';
}

export const ForceLab = ({ lang, mode }: Props) => {
  const t = translations[lang];
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState<SimulationState[]>([]);
  const [law, setLaw] = useState<1 | 2 | 3>(1); // For Newton mode

  // --- PARAMS ---
  // Collision
  const [m1, setM1] = useState(5); const [u1, setU1] = useState(5);
  const [m2, setM2] = useState(5); const [u2, setU2] = useState(-2);
  const [pos1, setPos1] = useState(-100); const [pos2, setPos2] = useState(100);
  const [v1, setV1] = useState(u1); const [v2, setV2] = useState(u2);

  // Friction & Newton 2
  const [appliedForce, setAppliedForce] = useState(0);
  const [mass, setMass] = useState(10);
  const [muS, setMuS] = useState(0.5); // Static
  const [muK, setMuK] = useState(0.3); // Kinetic
  const [blockV, setBlockV] = useState(0);
  const [blockPos, setBlockPos] = useState(0);

  // Newton 1 (Spaceship)
  const [thrustActive, setThrustActive] = useState(false);
  const [shipV, setShipV] = useState(0);
  const [shipPos, setShipPos] = useState(0);

  // Newton 3 (Astronauts)
  const [massA, setMassA] = useState(60);
  const [massB, setMassB] = useState(60);
  const [posA, setPosA] = useState(-50);
  const [posB, setPosB] = useState(50);
  const [velA, setVelA] = useState(0);
  const [velB, setVelB] = useState(0);
  const [pushForce, setPushForce] = useState(200);

  const reqRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);

  // Reset
  const reset = () => {
    setIsPlaying(false);
    setHistory([]);
    lastTimeRef.current = undefined;
    
    // Mode specific resets
    if (mode === 'collision') {
        setPos1(-100); setPos2(100); setV1(u1); setV2(u2);
    } else if (mode === 'friction' || (mode === 'newton2' && law === 2)) {
        setBlockV(0); setBlockPos(0);
    } else if (mode === 'newton2' && law === 1) {
        setShipV(0); setShipPos(0); setThrustActive(false);
    } else if (mode === 'newton2' && law === 3) {
        setPosA(-50); setPosB(50); setVelA(0); setVelB(0);
    }
  };

  useEffect(() => { 
      if (!isPlaying && mode === 'collision') { setV1(u1); setV2(u2); }
  }, [u1, u2, isPlaying, mode]);

  const animate = (now: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = now;
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = now;

    // --- PHYSICS ENGINE ---

    if (mode === 'collision') {
        let nextP1 = pos1 + v1 * dt * 20;
        let nextP2 = pos2 + v2 * dt * 20;
        // Simple bounding box collision
        if (nextP1 + 25 >= nextP2 - 25) { 
           // Elastic Collision Formula
           const newV1 = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
           const newV2 = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
           setV1(newV1); setV2(newV2);
           nextP1 = pos1; nextP2 = pos2; // Prevent sticking
        }
        setPos1(nextP1); setPos2(nextP2);
        const pTotal = m1 * v1 + m2 * v2;
        setHistory(prev => [...prev.slice(-100), { t: now, p: pTotal, v1, v2 }]);
    } 
    
    else if (mode === 'newton2' && law === 1) {
        // Inertia: F = 0 -> a = 0 -> v = const
        // If thrust is active, F > 0
        const thrust = thrustActive ? 50 : 0;
        const a = thrust / 100; // Assume mass 100
        const newV = shipV + a * dt;
        const newPos = shipPos + newV * dt * 20;
        setShipV(newV);
        setShipPos(newPos);
        setHistory(prev => [...prev.slice(-100), { t: now, v: newV, a, f: thrust }]);
    }
    
    else if (mode === 'newton2' && law === 3) {
        // Action Reaction. Push happens for a short duration or while button held?
        // Let's model impulse if 'isPlaying' was just triggered, but for continuous, let's treat 'isPlaying' as 'Pushing'
        // Actually, for Newton 3, usually it's an impulse. Let's make the "Play" button a "Push" action.
        // We'll simulate a force applied for 0.5s then stop.
        // BUT to keep consistent with UI, let's say "Playing" = "Force Applied"
        
        const force = isPlaying ? pushForce : 0;
        const aA = -force / massA;
        const aB = force / massB;
        
        const newVA = velA + aA * dt;
        const newVB = velB + aB * dt;
        
        setVelA(newVA); setVelB(newVB);
        setPosA(p => p + newVA * dt * 20);
        setPosB(p => p + newVB * dt * 20);
        
        setHistory(prev => [...prev.slice(-100), { t: now, vA: newVA, vB: newVB, f: force }]);
    }

    else if (mode === 'friction' || (mode === 'newton2' && law === 2)) {
        // Friction & Newton 2 Model
        const g = 9.8;
        const normal = mass * g;
        
        // Determine Friction
        let frictionForce = 0;
        const isNewton2Mode = (mode === 'newton2' && law === 2);
        const staticLimit = isNewton2Mode ? 0 : muS * normal;
        const kineticFric = isNewton2Mode ? 0 : muK * normal;

        // Physics Logic
        // If moving, use kinetic. If not moving, check static limit.
        const isMoving = Math.abs(blockV) > 0.01;
        
        if (isMoving) {
            // Moving: Kinetic Friction opposes velocity
            frictionForce = kineticFric * Math.sign(blockV);
            // If v is very small and force is removed, stop it (prevent oscillation around 0)
            if (appliedForce === 0 && Math.abs(blockV) < 0.1) {
                 setBlockV(0);
                 frictionForce = 0;
            }
        } else {
            // Static: Friction matches applied force up to limit
            if (Math.abs(appliedForce) <= staticLimit) {
                frictionForce = appliedForce;
            } else {
                frictionForce = staticLimit * Math.sign(appliedForce); // Break away
            }
        }

        // Net Force
        const netForce = appliedForce - frictionForce;
        const a = netForce / mass;
        
        const newV = blockV + a * dt;
        const newPos = blockPos + newV * dt * 20;

        setBlockV(newV);
        setBlockPos(newPos);
        setHistory(prev => [...prev.slice(-100), { t: now, v: newV, a, f: appliedForce, friction: frictionForce, net: netForce }]);
    }

    if (isPlaying) reqRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) reqRef.current = requestAnimationFrame(animate);
    else { cancelAnimationFrame(reqRef.current!); lastTimeRef.current = undefined; }
    return () => cancelAnimationFrame(reqRef.current!);
  }, [isPlaying, pos1, pos2, v1, v2, blockPos, blockV, shipPos, shipV, posA, posB, velA, velB]);

  // --- CAMERA HANDLING ---
  let cameraX = 0;
  if (mode === 'newton2' && law === 1) cameraX = shipPos;
  else if (mode === 'friction' || (mode === 'newton2' && law === 2)) cameraX = blockPos;
  else if (mode === 'newton2' && law === 3) cameraX = (posA + posB) / 2;

  return (
    <div className="flex flex-col h-full">
      {/* 3D Viewport */}
      <div className="relative h-[45vh] bg-slate-100 w-full overflow-hidden shadow-md">
         {mode === 'newton2' && law === 1 ? (
             // SPACE ENVIRONMENT FOR LAW 1
             <div className="absolute inset-0 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0" style={{ transform: `translateX(${-cameraX * 0.5}px)` }}>
                    {[...Array(50)].map((_, i) => (
                        <div key={i} className="absolute w-1 h-1 bg-white rounded-full opacity-50" 
                             style={{ left: `${Math.random()*200}%`, top: `${Math.random()*100}%` }} />
                    ))}
                </div>
                {/* Spaceship */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-12 bg-slate-200 rounded-full shadow-lg z-20 transition-transform"
                     style={{ transform: `translateX(${0}px)` }}> {/* Camera tracks ship, so ship is centered relative to cam, but environment moves */}
                     <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-blue-500 rounded-r-lg" />
                     <div className="absolute left-4 top-2 w-8 h-8 bg-blue-900/50 rounded-full border-2 border-slate-300" />
                     {/* Thruster Flame */}
                     {thrustActive && (
                         <div className="absolute right-full top-1/2 -translate-y-1/2 flex items-center">
                             <div className="w-16 h-6 bg-orange-500 rounded-l-full blur-sm animate-pulse" />
                             <div className="w-10 h-3 bg-yellow-300 rounded-l-full blur-md absolute right-0" />
                         </div>
                     )}
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 font-mono text-xs">NO FRICTION / VACUUM</div>
             </div>
         ) : (
             <Environment cameraX={cameraX}>
                <div className="absolute top-[60%] w-full h-2 bg-slate-300 shadow-sm" /> 
                
                {/* COLLISION OBJECTS */}
                {mode === 'collision' && (
                    <>
                        <MassCircle x={pos1} v={v1} color="bg-blue-500" label="M1" />
                        <MassCircle x={pos2} v={v2} color="bg-rose-500" label="M2" />
                    </>
                )}

                {/* NEWTON 3 OBJECTS */}
                {mode === 'newton2' && law === 3 && (
                    <>
                        {/* Astronaut A */}
                        <div className="absolute top-[60%] left-0 -translate-y-[80px] flex flex-col items-center transition-transform" style={{ transform: `translateX(${posA}px)` }}>
                            <div className="w-16 h-20 bg-white rounded-2xl border-2 border-slate-300 relative shadow-lg">
                                <div className="absolute top-2 left-2 right-2 h-8 bg-blue-900 rounded-lg border border-slate-400" /> {/* Visor */}
                                {isPlaying && <div className="absolute left-full top-1/2 w-8 h-2 bg-slate-400 rounded-full origin-left animate-ping" />} {/* Arm pushing */}
                            </div>
                            <div className="mt-2 bg-slate-800 text-white text-xs px-2 py-1 rounded">{t.astronautA}</div>
                            <div className="font-bold text-blue-600">{velA.toFixed(1)} m/s</div>
                        </div>
                        {/* Astronaut B */}
                        <div className="absolute top-[60%] left-0 -translate-y-[80px] flex flex-col items-center transition-transform" style={{ transform: `translateX(${posB}px)` }}>
                            <div className="w-16 h-20 bg-white rounded-2xl border-2 border-slate-300 relative shadow-lg">
                                <div className="absolute top-2 left-2 right-2 h-8 bg-orange-900 rounded-lg border border-slate-400" />
                            </div>
                            <div className="mt-2 bg-slate-800 text-white text-xs px-2 py-1 rounded">{t.astronautB}</div>
                            <div className="font-bold text-orange-600">{velB.toFixed(1)} m/s</div>
                        </div>
                    </>
                )}

                {/* FRICTION / NEWTON 2 BLOCK */}
                {(mode === 'friction' || (mode === 'newton2' && law === 2)) && (
                    <div 
                    className="absolute top-[60%] left-0 -translate-y-[64px] w-32 h-16 bg-slate-700 rounded-lg shadow-xl border-b-4 border-black flex items-center justify-center text-white z-10"
                    style={{ transform: `translateX(${blockPos}px)` }}
                    >
                    <span className="font-bold">{mass}kg</span>
                    
                    {/* Applied Force Arrow */}
                    {Math.abs(appliedForce) > 0 && (
                        <div className={`absolute top-1/2 h-1 bg-emerald-500 flex items-center ${appliedForce > 0 ? 'left-full origin-left' : 'right-full origin-right'}`} 
                             style={{ width: `${Math.abs(appliedForce) * 2}px` }}>
                            <div className={`absolute -top-1.5 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ${appliedForce > 0 ? 'right-0 border-l-[10px] border-l-emerald-500' : 'left-0 border-r-[10px] border-r-emerald-500'}`} />
                            <span className="absolute -top-6 text-emerald-600 font-bold whitespace-nowrap px-2">F_app = {appliedForce}N</span>
                        </div>
                    )}
                    
                    {/* Friction Arrow */}
                    {mode === 'friction' && Math.abs(history[history.length-1]?.friction || 0) > 0.1 && (
                        <div className={`absolute top-3/4 h-1 bg-rose-500 flex items-center justify-end ${appliedForce > 0 ? 'right-full origin-right' : 'left-full origin-left'}`} 
                             style={{ width: `${Math.abs(history[history.length-1]?.friction || 0) * 2}px` }}>
                            <div className={`absolute -top-1.5 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ${appliedForce > 0 ? 'left-0 border-r-[10px] border-r-rose-500' : 'right-0 border-l-[10px] border-l-rose-500'}`} />
                            <span className="absolute -top-6 text-rose-600 font-bold whitespace-nowrap px-2">
                                f = {Math.abs(history[history.length-1]?.friction || 0).toFixed(1)}N
                            </span>
                        </div>
                    )}
                    </div>
                )}
             </Environment>
         )}
      </div>

      {/* Controls & Graphs */}
      <div className="flex-grow bg-white p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto">
         <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-black uppercase text-slate-700">{t[mode]}</h2>
                    
                    {/* Play/Reset Controls */}
                    <div className="flex gap-2">
                        {mode === 'newton2' && law === 1 ? (
                            // Inertia Controls
                            <button 
                                onMouseDown={() => setThrustActive(true)}
                                onMouseUp={() => setThrustActive(false)}
                                onTouchStart={() => setThrustActive(true)}
                                onTouchEnd={() => setThrustActive(false)}
                                className={`px-4 py-2 rounded-lg font-bold shadow-lg active:scale-95 transition-all ${thrustActive ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                            >
                                {t.thrust}
                            </button>
                        ) : (
                            <button onClick={() => setIsPlaying(!isPlaying)} className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${isPlaying ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                                {isPlaying ? <Icons.Pause size={16}/> : <Icons.Play size={16}/>}
                            </button>
                        )}
                        <button onClick={reset} className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center hover:bg-slate-300"><Icons.RotateCcw size={16}/></button>
                    </div>
                </div>

                {/* Newton Law Tabs */}
                {mode === 'newton2' && (
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {[1, 2, 3].map((l) => (
                            <button 
                                key={l}
                                onClick={() => { setLaw(l as any); reset(); }}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${law === l ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {t[`law${l}` as keyof typeof t]}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
               {mode === 'collision' && (
                   <>
                      <InputSlider label="Mass 1" val={m1} set={setM1} min={1} max={20} />
                      <InputSlider label="Vel 1" val={u1} set={setU1} min={-10} max={10} />
                      <InputSlider label="Mass 2" val={m2} set={setM2} min={1} max={20} />
                      <InputSlider label="Vel 2" val={u2} set={setU2} min={-10} max={10} />
                   </>
               )}

               {(mode === 'friction' || (mode === 'newton2' && law === 2)) && (
                   <>
                      <InputSlider label={t.forceVal} val={appliedForce} set={setAppliedForce} min={-100} max={100} unit="N" />
                      <InputSlider label={t.mass} val={mass} set={setMass} min={1} max={50} unit="kg" />
                      {mode === 'friction' && (
                          <>
                             <div className="h-px bg-slate-200 my-2"/>
                             <InputSlider label={t.staticFriction} val={muS} set={setMuS} min={0.1} max={1.0} step={0.05} />
                             <InputSlider label={t.kineticFriction} val={muK} set={setMuK} min={0.05} max={0.9} step={0.05} />
                             <div className="text-[10px] text-slate-400 italic">* Kinetic μ must be less than Static μ</div>
                          </>
                      )}
                   </>
               )}

               {mode === 'newton2' && law === 1 && (
                   <div className="text-sm text-slate-600">
                       <p className="mb-2"><strong>Newton's 1st Law:</strong> An object stays at rest or in constant motion unless acted upon by a force.</p>
                       <ul className="list-disc pl-4 space-y-1 text-xs">
                           <li>Apply <b>Thrust</b> to accelerate.</li>
                           <li>Release to see it coast forever (Inertia).</li>
                       </ul>
                   </div>
               )}

               {mode === 'newton2' && law === 3 && (
                   <>
                      <InputSlider label={t.massA} val={massA} set={setMassA} min={20} max={120} unit="kg" />
                      <InputSlider label={t.massB} val={massB} set={setMassB} min={20} max={120} unit="kg" />
                      <InputSlider label={t.push} val={pushForce} set={setPushForce} min={50} max={500} unit="N" />
                      <div className="text-xs text-slate-400 mt-2">Action: A pushes B. Reaction: B pushes A back with equal force.</div>
                   </>
               )}
            </div>
         </div>

         {/* Graphs */}
         <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {mode === 'collision' && (
                <Graph data={history.map((h, i) => ({ x: i, y: h.p || 0 }))} color="#8b5cf6" label={t.momentum} xLabel="t" yLabel="P" />
            )}
            
            {(mode === 'friction' || (mode === 'newton2' && law === 2)) && (
                <>
                    <Graph data={history.map(h => ({ x: h.t || 0, y: h.v || 0 }))} color="#3b82f6" label={`${t.velocity} vs ${t.time}`} xLabel="t" yLabel="v" />
                    <Graph data={history.map(h => ({ x: h.t || 0, y: h.net || 0 }))} color="#10b981" label={`${t.netForce} vs ${t.time}`} xLabel="t" yLabel="F_net" />
                </>
            )}

            {mode === 'newton2' && law === 1 && (
                <Graph data={history.map(h => ({ x: h.t || 0, y: h.v || 0 }))} color="#3b82f6" label={`${t.velocity} vs ${t.time}`} xLabel="t" yLabel="v" />
            )}

            {mode === 'newton2' && law === 3 && (
                <>
                     <Graph data={history.map(h => ({ x: h.t || 0, y: h.vA || 0 }))} color="#3b82f6" label="Velocity A" xLabel="t" yLabel="Va" />
                     <Graph data={history.map(h => ({ x: h.t || 0, y: h.vB || 0 }))} color="#f97316" label="Velocity B" xLabel="t" yLabel="Vb" />
                </>
            )}
         </div>
      </div>
    </div>
  );
};

const MassCircle = ({ x, v, color, label }: any) => (
    <div className={`absolute top-[60%] left-1/2 -translate-y-[50px] w-24 h-24 ${color} rounded-full shadow-2xl flex items-center justify-center text-white font-bold border-4 border-white/20`}
         style={{ transform: `translateX(${x}px)` }}>
        {label} <span className="absolute -top-8 text-slate-700 bg-white/80 px-2 rounded text-xs">{v.toFixed(1)} m/s</span>
    </div>
);

const InputSlider = ({ label, val, set, min, max, step=1, unit="" }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs font-bold text-slate-600"><span>{label}</span> <span>{val} {unit}</span></div>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} className="w-full" />
  </div>
);