
import React, { useState, useEffect, useRef } from 'react';
import { translations } from '../utils/translations';
import { Language } from '../utils/types';

interface Props { lang: Language; mode: 'waves' | 'seismic' }

export const SoundLab = ({ lang, mode }: Props) => {
  const t = translations[lang];
  const [freq, setFreq] = useState(2);
  const [amp, setAmp] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    let animId: number;

    const draw = () => {
      time += 0.05;
      const width = canvas.width = canvas.offsetWidth;
      const height = canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, width, height);
      
      ctx.beginPath();
      ctx.strokeStyle = mode === 'waves' ? '#3b82f6' : '#ea580c';
      ctx.lineWidth = 3;

      for (let x = 0; x < width; x++) {
        // Wave Equation: y = A sin(kx - wt)
        const y = height/2 + Math.sin(x * 0.02 * freq - time * 2) * (amp * 50);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (mode === 'seismic') {
         // Draw layers
         ctx.fillStyle = 'rgba(0,0,0,0.05)';
         ctx.fillRect(0, height/2 + 50, width, height/2 - 50);
         ctx.fillStyle = 'rgba(0,0,0,0.1)';
         ctx.fillRect(0, height/2 + 100, width, height/2 - 100);
      }

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [freq, amp, mode]);

  return (
    <div className="flex flex-col h-full bg-white">
       <div className="h-[45vh] bg-slate-900 relative">
          <canvas ref={canvasRef} className="w-full h-full" />
          <div className="absolute top-4 right-4 text-white font-mono text-xs opacity-50">
             f={freq}Hz A={amp}
          </div>
       </div>

       <div className="flex-grow p-8 space-y-8">
           <h2 className="text-xl font-black uppercase text-slate-700">{t[mode]}</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                 <InputSlider label="Frequency (Hz)" val={freq} set={setFreq} min={1} max={10} step={0.5} />
                 <InputSlider label="Amplitude" val={amp} set={setAmp} min={0.1} max={2} step={0.1} />
              </div>
              
              <div className="flex flex-col justify-center text-sm text-slate-500">
                 <p className="mb-2"><strong>Wave Equation:</strong> y = A sin(ωt ± kx)</p>
                 <p>Observe how changing frequency affects the wavelength and how amplitude affects the wave height.</p>
              </div>
           </div>
       </div>
    </div>
  );
};

const InputSlider = ({ label, val, set, min, max, step=1 }: any) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-bold text-slate-600"><span>{label}</span> <span>{val}</span></div>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} className="w-full" />
  </div>
);
