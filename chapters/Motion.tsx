import React, { useState, useEffect, useRef } from 'react';
import { Environment } from '../components/Environment';
import { Graph } from '../components/Graph';
import { translations } from '../utils/translations';
import { Language, SimulationState } from '../utils/types';
import * as Icons from 'lucide-react';

interface Props {
  lang: Language;
  mode: 'linear' | 'falling' | 'projectile' | 'circular' | 'harmonic';
}

const SCALE = 50; // 50px per meter

export const MotionLab = ({ lang, mode }: Props) => {
  const t = translations[lang];
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState<SimulationState[]>([]);
  
  // Params (Initial Conditions & Constants)
  const [u, setU] = useState(10);     // Initial Velocity / Amplitude
  const [a, setA] = useState(9.8);    // Acceleration / Gravity
  const [h, setH] = useState(50);     // Initial Height
  const [theta, setTheta] = useState(45); // Angle
  const [radius, setRadius] = useState(20); // Radius
  const [omega, setOmega] = useState(2); // Angular Velocity

  // Physics State (Mutable for Euler Integration)
  const physicsState = useRef({
    t: 0,
    s: 0, v: 0, // Linear
    x: 0, y: 0, vx: 0, vy: 0, // Projectile/2D
    angle: 0, // Circular
    h: 0 // Falling
  });

  const reqRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);

  // Reset Function
  const reset = () => {
    setIsPlaying(false);
    setHistory([]);
    lastTimeRef.current = undefined;
    
    // Reset Physics State based on current parameters
    physicsState.current = {
        t: 0,
        s: 0, 
        v: u, // Set linear velocity to Initial Velocity 'u'
        h: h,
        x: 0, 
        y: 0, 
        vx: u * Math.cos(theta * Math.PI / 180), 
        vy: u * Math.sin(theta * Math.PI / 180),
        angle: 0
    };
  };

  // Initialize state on load or mode change
  useEffect(() => {
    reset();
  }, [mode]);

  // If parameters change while NOT playing, update initial state preview
  useEffect(() => {
    if (!isPlaying) {
        physicsState.current = {
            ...physicsState.current,
            v: u,
            h: h,
            vx: u * Math.cos(theta * Math.PI / 180),
            vy: u * Math.sin(theta * Math.PI / 180),
        };
        // Update history for preview? No, keep empty until play.
        // But we want to show the start position.
        setHistory([{ t: 0, v: u, s: 0, h, x: 0, y: 0, a }]);
    }
  }, [u, h, theta, isPlaying]);

  const animate = (now: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = now;
    // Limit dt to max 0.1s to prevent huge jumps if tab inactive
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1); 
    lastTimeRef.current = now;

    const state = physicsState.current;
    state.t += dt;
    
    let newState: SimulationState = { t: state.t };

    if (mode === 'linear') {
      // Euler Integration
      // v = v + a * dt
      // s = s + v * dt
      state.v += a * dt;
      state.s += state.v * dt;
      newState = { t: state.t, v: state.v, s: state.s, a };
    } 
    else if (mode === 'falling') {
      // v increases by g (downwards)
      state.v += a * dt; 
      state.h -= state.v * dt; // Falling down
      
      // Ground Collision
      if (state.h <= 0) {
          state.h = 0;
          state.v = 0;
          setIsPlaying(false);
      }
      newState = { t: state.t, s: h - state.h, h: state.h, v: state.v, a };
    }
    else if (mode === 'projectile') {
      // ax = 0, ay = -g
      // vx constant, vy changes
      state.vy -= a * dt;
      state.x += state.vx * dt;
      state.y += state.vy * dt;
      
      const vTotal = Math.sqrt(state.vx**2 + state.vy**2);

      if (state.y <= 0) {
          state.y = 0;
          setIsPlaying(false);
      }
      newState = { t: state.t, x: state.x, y: state.y, v: vTotal, a };
    }
    else if (mode === 'circular') {
      // Analytical is fine for circular as it repeats perfectl
      // But let's stay consistent with t
      state.angle += omega * dt;
      const x = radius * Math.cos(state.angle);
      const y = radius * Math.sin(state.angle);
      const v = omega * radius;
      const ac = (v*v) / radius;
      newState = { t: state.t, x, y, v, a: ac };
    }
    else if (mode === 'harmonic') {
      // Analytical is better for stability of harmonic motion
      const x = u * Math.cos(omega * state.t);
      const v = -u * omega * Math.sin(omega * state.t);
      const acc = -u * omega * omega * Math.cos(omega * state.t);
      newState = { t: state.t, x, v, a: acc };
    }

    setHistory(prev => {
        // Keep 2000 points (~33 seconds at 60fps)
        const newHistory = [...prev, newState];
        if (newHistory.length > 2000) return newHistory.slice(newHistory.length - 2000);
        return newHistory;
    });
    
    if (isPlaying) reqRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
      reqRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(reqRef.current!);
      lastTimeRef.current = undefined;
    }
    return () => cancelAnimationFrame(reqRef.current!);
  }, [isPlaying, a, radius, omega]); // removed 'u' dependency so it doesn't reset/jump while playing

  // Current State for Visuals
  const current = history.length > 0 ? history[history.length - 1] : { t: 0, v: u, s: 0, h, x: 0, y: 0, a };
  
  // Camera handling (Infinite Follow)
  let cameraX = 0;
  if (mode === 'linear') {
      cameraX = (current.s || 0) * SCALE - 150; 
  }
  if (mode === 'projectile') {
      cameraX = (current.x || 0) * SCALE - 200;
  }
  cameraX = Math.max(0, cameraX);

  return (
    <div className="flex flex-col h-full">
      <div className="relative h-[40vh] md:h-[50vh] bg-slate-200 w-full overflow-hidden shadow-md">
        <Environment cameraX={cameraX}>
          
          {mode === 'linear' && (
            <div 
              className="absolute bottom-[20%] left-0 w-32 h-16 bg-blue-600 rounded-lg shadow-2xl flex items-center justify-center text-white font-bold text-xs border-2 border-white/30 z-20"
              style={{ transform: `translateX(${(current.s || 0) * SCALE}px) translateZ(0)` }}
            >
              CAR
              <div className="absolute -bottom-4 w-8 h-8 bg-black rounded-full left-2 shadow-lg animate-spin" style={{ animationDuration: `${Math.max(0.1, 1/(current.v || 1))}s` }} />
              <div className="absolute -bottom-4 w-8 h-8 bg-black rounded-full right-2 shadow-lg animate-spin" style={{ animationDuration: `${Math.max(0.1, 1/(current.v || 1))}s` }} />
            </div>
          )}

          {mode === 'falling' && (
            <div className="absolute left-1/2 -translate-x-1/2 w-20 bg-slate-300/50 h-[80%] bottom-[20%] flex justify-center z-10">
               <div className="absolute right-0 h-full border-l border-slate-500 w-4 flex flex-col justify-between text-[10px]">
                 {[...Array(6)].map((_, i) => <div key={i} className="w-full border-t border-slate-500 relative"><span className="absolute -top-2 right-2">{Math.round(h - i*(h/5))}m</span></div>)}
              </div>
              <div 
                className="absolute w-12 h-12 bg-rose-500 rounded-full shadow-lg"
                style={{ bottom: `${(current.h || 0) * (80/h)}%` }} // Visual scaling
              />
            </div>
          )}

          {mode === 'projectile' && (
            <>
               {/* Trajectory Path */}
               <svg className="absolute inset-0 overflow-visible pointer-events-none z-10" style={{ left: '100px', bottom: '20%' }}>
                  <path d={`M 0 0 ${history.map(pt => `L ${pt.x! * SCALE} ${-pt.y! * SCALE}`).join(' ')}`} fill="none" stroke="rgba(255,0,0,0.5)" strokeWidth="4" strokeDasharray="10,10"/>
               </svg>
               <div 
                 className="absolute w-8 h-8 bg-amber-500 rounded-full shadow-lg border-2 border-white z-20"
                 style={{ left: `calc(100px + ${(current.x || 0) * SCALE}px)`, bottom: `calc(20% + ${(current.y || 0) * SCALE}px)` }}
               />
               <div className="absolute left-[100px] bottom-[20%] w-16 h-8 bg-slate-800 rounded-t-full z-10" />
            </>
          )}

          {mode === 'circular' && (
            <div className="absolute left-1/2 top-1/2 w-0 h-0 z-10">
               <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-400 border-dashed" 
                    style={{ width: `${radius * 10}px`, height: `${radius * 10}px` }} />
               <div className="absolute w-full h-[2px] bg-slate-400 origin-left" 
                    style={{ width: `${radius * 5}px`, transform: `rotate(${((current.t || 0) * omega * 180/Math.PI)}deg)` }}>
                    <div className="absolute right-0 -top-3 w-6 h-6 bg-purple-600 rounded-full shadow-lg" />
               </div>
               <div className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full" />
            </div>
          )}

          {mode === 'harmonic' && (
            <div className="absolute left-1/2 top-[30%] z-10">
               <div className="w-2 bg-slate-400 absolute left-0 origin-top" style={{ height: `${200 + (current.x || 0)*3}px`, transform: 'translateX(-50%)' }}>
                  {[...Array(20)].map((_, i) => <div key={i} className="w-8 h-[2px] bg-slate-600 absolute left-[-14px]" style={{ top: `${i*5}%` }} />)}
               </div>
               <div 
                 className="absolute -translate-x-1/2 w-20 h-20 bg-emerald-500 rounded-xl shadow-lg border-b-4 border-emerald-700 flex items-center justify-center text-white font-bold"
                 style={{ top: `${200 + (current.x || 0)*3}px` }}
               >
                 M
               </div>
            </div>
          )}

        </Environment>

        {/* Overlay Telemetry */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-200 z-50">
           <h3 className="text-xs font-black uppercase text-slate-400 mb-2">{t.telemetry}</h3>
           <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm font-mono">
              <span>T:</span> <span className="font-bold text-blue-600">{(current.t || 0).toFixed(2)} s</span>
              {mode !== 'harmonic' && <><span>V:</span> <span className="font-bold text-rose-600">{(current.v || 0).toFixed(2)} m/s</span></>}
              {mode === 'linear' && <><span>S:</span> <span className="font-bold text-emerald-600">{(current.s || 0).toFixed(2)} m</span></>}
              {mode === 'projectile' && <><span>X:</span> <span className="font-bold text-emerald-600">{(current.x || 0).toFixed(2)} m</span></>}
              {mode === 'harmonic' && <><span>X:</span> <span className="font-bold text-emerald-600">{(current.x || 0).toFixed(2)} m</span></>}
           </div>
        </div>
      </div>

      <div className="flex-grow bg-white p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto">
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-lg font-black uppercase text-slate-700">{t[mode]}</h2>
              <div className="flex gap-2">
                 <button onClick={() => setIsPlaying(!isPlaying)} className={`w-12 h-12 flex items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95 ${isPlaying ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                    {isPlaying ? <Icons.Pause size={20} fill="currentColor" /> : <Icons.Play size={20} fill="currentColor" />}
                 </button>
                 <button onClick={reset} className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                    <Icons.RotateCcw size={20} />
                 </button>
              </div>
           </div>

           <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.parameters}</h4>
              
              {mode === 'linear' && (
                <>
                  <InputSlider label="Initial Velocity (u)" val={u} set={setU} min={0} max={50} unit="m/s" disabled={isPlaying} />
                  <InputSlider label={`${t.acceleration} (a)`} val={a} set={setA} min={-10} max={20} step={0.5} unit="m/s²" />
                  {isPlaying && <div className="text-[10px] text-amber-600">* Acceleration updates in real-time. Velocity is initial.</div>}
                </>
              )}
              {mode === 'falling' && (
                  <InputSlider label="Height (h)" val={h} set={setH} min={10} max={200} unit="m" disabled={isPlaying} />
              )}
              {mode === 'projectile' && (
                <>
                  <InputSlider label="Initial Velocity (u)" val={u} set={setU} min={10} max={100} unit="m/s" disabled={isPlaying} />
                  <InputSlider label={`${t.angle} (θ)`} val={theta} set={setTheta} min={0} max={90} unit="°" disabled={isPlaying} />
                </>
              )}
              {mode === 'circular' && (
                <>
                  <InputSlider label={`${t.radius} (r)`} val={radius} set={setRadius} min={10} max={50} unit="m" />
                  <InputSlider label="Omega (ω)" val={omega} set={setOmega} min={0.5} max={5} step={0.1} unit="rad/s" />
                </>
              )}
              {mode === 'harmonic' && (
                <>
                  <InputSlider label={`${t.amplitude} (A)`} val={u} set={setU} min={10} max={100} unit="m" disabled={isPlaying} />
                  <InputSlider label={`${t.frequency} (ω)`} val={omega} set={setOmega} min={1} max={10} step={0.5} unit="Hz" />
                </>
              )}
           </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
           {mode === 'linear' && <Graph data={history.map(h => ({ x: h.t, y: h.s || 0 }))} color="#10b981" label="Displacement" xLabel="t" yLabel="s" />}
           {mode === 'projectile' && <Graph data={history.map(h => ({ x: h.x || 0, y: h.y || 0 }))} color="#f59e0b" label="Trajectory Y-X" xLabel="x" yLabel="y" />}
           {(mode === 'harmonic' || mode === 'circular') && <Graph data={history.map(h => ({ x: h.t, y: h.x || 0 }))} color="#8b5cf6" label="Position X-T" xLabel="t" yLabel="x" />}
           
           <Graph data={history.map(h => ({ x: h.t, y: h.v || 0 }))} color="#3b82f6" label="Velocity" xLabel="t" yLabel="v" />
        </div>
      </div>
    </div>
  );
};

const InputSlider = ({ label, val, set, min, max, step=1, unit="", disabled=false }: any) => (
  <div className={`space-y-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
    <div className="flex justify-between text-xs font-bold text-slate-600"><span>{label}</span> <span>{val} {unit}</span></div>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} className="w-full accent-blue-600" />
  </div>
);