
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import * as Icons from 'lucide-react';
import { Chapter, Language, Topic } from './utils/types';
import { translations } from './utils/translations';

// Import Labs
import { MotionLab } from './chapters/Motion';
import { ForceLab } from './chapters/Force';
import { MatterLab } from './chapters/Matter';
import { HeatLab } from './chapters/Heat';
import { SoundLab } from './chapters/Sound';
import { ReflectionLab } from './chapters/Reflection';
import { RefractionLab } from './chapters/Refraction';
import { LensLab } from './chapters/Lens';
import { ElectricityLab } from './chapters/Electricity';
import { MeasurementLab } from './chapters/Measurement';
import { MagnetismLab } from './chapters/Magnetism';

const App = () => {
  const [lang, setLang] = useState<Language>('bn'); // Default to Bangla
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);

  const t = translations[lang];

  // --- DATA STRUCTURE ---
  const CHAPTERS: Chapter[] = [
    {
      id: 'measurement',
      title: { en: 'Measurement', bn: 'পরিমাপ' },
      icon: <Icons.Ruler size={32} />,
      topics: [
        { id: 'vernier', title: { en: 'Vernier Caliper', bn: 'ভার্নিয়ার ক্যালিপার্স' }, component: (p) => <MeasurementLab {...p} mode="vernier"/> },
        { id: 'screw', title: { en: 'Screw Gauge', bn: 'স্ক্রু গজ' }, component: (p) => <MeasurementLab {...p} mode="screw"/> },
      ]
    },
    {
      id: 'motion',
      title: { en: 'Motion', bn: 'গতি' },
      icon: <Icons.Activity size={32} />,
      topics: [
        { id: 'linear', title: { en: 'Linear Motion', bn: 'রৈখিক গতি' }, component: (p) => <MotionLab {...p} mode="linear"/> },
        { id: 'falling', title: { en: 'Falling Bodies', bn: 'পড়ন্ত বস্তু' }, component: (p) => <MotionLab {...p} mode="falling"/> },
        { id: 'projectile', title: { en: 'Projectile', bn: 'প্রাসের গতি' }, component: (p) => <MotionLab {...p} mode="projectile"/> },
        { id: 'circular', title: { en: 'Circular Motion', bn: 'ঘূর্ণন গতি' }, component: (p) => <MotionLab {...p} mode="circular"/> },
        { id: 'harmonic', title: { en: 'Harmonic Motion', bn: 'সরল স্পন্দন' }, component: (p) => <MotionLab {...p} mode="harmonic"/> },
      ]
    },
    {
      id: 'force',
      title: { en: 'Force', bn: 'বল' },
      icon: <Icons.Anchor size={32} />,
      topics: [
        { id: 'collision', title: { en: 'Collision', bn: 'সংঘর্ষ' }, component: (p) => <ForceLab {...p} mode="collision" /> },
        { id: 'newton', title: { en: 'Newton\'s Laws', bn: 'নিউটনের সূত্র' }, component: (p) => <ForceLab {...p} mode="newton2" /> },
        { id: 'friction', title: { en: 'Friction', bn: 'ঘর্ষণ' }, component: (p) => <ForceLab {...p} mode="friction" /> },
      ]
    },
    {
      id: 'matter',
      title: { en: 'States of Matter', bn: 'পদার্থের অবস্থা' },
      icon: <Icons.Droplets size={32} />,
      topics: [
        { id: 'buoyancy', title: { en: 'Buoyancy', bn: 'প্লবতা' }, component: (p) => <MatterLab {...p} mode="buoyancy"/> },
        { id: 'pressure', title: { en: 'Pressure', bn: 'চাপ' }, component: (p) => <MatterLab {...p} mode="pressure"/> },
        { id: 'elasticity', title: { en: 'Elasticity', bn: 'স্থিতিস্থাপকতা' }, component: (p) => <MatterLab {...p} mode="elasticity"/> },
      ]
    },
    {
      id: 'heat',
      title: { en: 'Heat & Temp', bn: 'তাপ ও তাপমাত্রা' },
      icon: <Icons.Thermometer size={32} />,
      topics: [
        { id: 'calorimetry', title: { en: 'Calorimetry', bn: 'ক্যালোরিমিতি' }, component: (p) => <HeatLab {...p} mode="calorimetry"/> },
        { id: 'expansion', title: { en: 'Thermal Expansion', bn: 'তাপীয় প্রসারণ' }, component: (p) => <HeatLab {...p} mode="expansion"/> },
      ]
    },
    {
      id: 'sound',
      title: { en: 'Sound', bn: 'শব্দ' },
      icon: <Icons.Waves size={32} />,
      topics: [
        { id: 'waves', title: { en: 'Sound Waves', bn: 'শব্দ তরঙ্গ' }, component: (p) => <SoundLab {...p} mode="waves"/> },
        { id: 'seismic', title: { en: 'Seismic Survey', bn: 'সিসমিক সার্ভে' }, component: (p) => <SoundLab {...p} mode="seismic"/> },
      ]
    },
    {
      id: 'reflection',
      title: { en: 'Light Reflection', bn: 'আলোর প্রতিফলন' },
      icon: <Icons.Sun size={32} />,
      topics: [
        { id: 'spectrum', title: { en: 'Nature & Spectrum', bn: 'প্রকৃতি ও বর্ণালী' }, component: (p) => <ReflectionLab {...p} mode="spectrum"/> },
        { id: 'plane', title: { en: 'Plane Mirror', bn: 'সমতল দর্পণ' }, component: (p) => <ReflectionLab {...p} mode="plane"/> },
        { id: 'spherical', title: { en: 'Spherical Mirrors', bn: 'গোলীয় দর্পণ' }, component: (p) => <ReflectionLab {...p} mode="spherical"/> },
        { id: 'absorption', title: { en: 'Absorption & Color', bn: 'আলোর শোষণ' }, component: (p) => <ReflectionLab {...p} mode="absorption"/> },
      ]
    },
    {
      id: 'refraction',
      title: { en: 'Light Refraction', bn: 'আলোর প্রতিসরণ' },
      icon: <Icons.Glasses size={32} />,
      topics: [
        { id: 'snell', title: { en: 'Snell\'s Law', bn: 'স্নেল-এর সূত্র' }, component: (p) => <RefractionLab {...p} mode="snell"/> },
        { id: 'prism', title: { en: 'Prism & Rainbow', bn: 'প্রিজম ও রংধনু' }, component: (p) => <RefractionLab {...p} mode="prism"/> },
        { id: 'fiber', title: { en: 'Optical Fiber', bn: 'অপটিক্যাল ফাইবার' }, component: (p) => <RefractionLab {...p} mode="fiber"/> },
      ]
    },
    {
      id: 'electricity',
      title: { en: 'Static Electricity', bn: 'স্থির তড়িৎ' },
      icon: <Icons.Zap size={32} />,
      topics: [
        { id: 'field', title: { en: 'Field & Coulomb', bn: 'তড়িৎ ক্ষেত্র ও কুলম্ব' }, component: (p) => <ElectricityLab {...p} mode="field"/> },
        { id: 'apps', title: { en: 'Real World Apps', bn: 'বাস্তব প্রয়োগ' }, component: (p) => <ElectricityLab {...p} mode="apps"/> },
      ]
    },
    {
      id: 'magnetism',
      title: { en: 'Magnetic Effects', bn: 'চল বিদ্যুৎ ও চুম্বক' },
      icon: <Icons.Magnet size={32} />,
      topics: [
        { id: 'electromagnet', title: { en: 'Electromagnetism', bn: 'তড়িৎ চুম্বক' }, component: (p) => <MagnetismLab {...p} mode="electromagnet"/> },
        { id: 'induction', title: { en: 'Induction', bn: 'আবেশ' }, component: (p) => <MagnetismLab {...p} mode="induction"/> },
        { id: 'transformer', title: { en: 'Transformer', bn: 'ট্রান্সফরমার' }, component: (p) => <MagnetismLab {...p} mode="transformer"/> },
        { id: 'generator', title: { en: 'Generator/Motor', bn: 'জেনারেটর/মোটর' }, component: (p) => <MagnetismLab {...p} mode="generator"/> },
        { id: 'mri', title: { en: 'MRI Physics', bn: 'MRI' }, component: (p) => <MagnetismLab {...p} mode="mri"/> },
      ]
    },
    {
      id: 'lens',
      title: { en: 'Lenses', bn: 'লেন্স' },
      icon: <Icons.Eye size={32} />,
      topics: [
        { id: 'lab', title: { en: 'Ray Optics Lab', bn: 'রশ্মি চিত্র ল্যাব' }, component: (p) => <LensLab {...p} /> },
      ]
    }
  ];

  // --- NAVIGATION VIEWS ---
  
  // 1. Home / Chapter Selection
  if (!activeChapter) {
    return (
      <div className="h-screen overflow-y-auto bg-slate-50 flex flex-col">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200"><Icons.Atom size={24}/></div>
              <h1 className="text-xl font-black italic text-slate-800 tracking-tighter hidden md:block">{t.appTitle}</h1>
           </div>
           <button onClick={() => setLang(l => l === 'en' ? 'bn' : 'en')} className="px-4 py-2 bg-slate-100 rounded-lg font-bold text-xs uppercase text-slate-600 hover:bg-slate-200">{lang === 'en' ? 'বাংলা' : 'English'}</button>
        </header>
        <main className="flex-grow p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
           <h2 className="text-3xl font-black text-slate-800 mb-8">{t.selectTopic}</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-12">
              {CHAPTERS.map(ch => (
                <div key={ch.id} onClick={() => setActiveChapter(ch)} className="group bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 cursor-pointer hover:-translate-y-2 transition-all duration-300">
                   <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">{ch.icon}</div>
                   <h3 className="text-2xl font-bold text-slate-800 mb-2">{ch.title[lang]}</h3>
                   <div className="text-slate-400 text-sm font-medium">{ch.topics.length} Simulations</div>
                </div>
              ))}
           </div>
        </main>
      </div>
    );
  }

  // 2. Topic Selection
  if (!activeTopic) {
    return (
      <div className="h-screen overflow-y-auto bg-slate-50 flex flex-col">
         <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
            <button onClick={() => setActiveChapter(null)} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-xs mb-8 hover:text-blue-600"><Icons.ArrowLeft size={16}/> {t.back}</button>
            <div className="flex items-center gap-4 mb-12">
               <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">{activeChapter.icon}</div>
               <h2 className="text-3xl md:text-4xl font-black text-slate-800">{activeChapter.title[lang]}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-12">
               {activeChapter.topics.map(topic => (
                 <div key={topic.id} onClick={() => setActiveTopic(topic)} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 hover:border-blue-500 cursor-pointer transition-all flex justify-between items-center group">
                    <span className="text-lg md:text-xl font-bold text-slate-700 group-hover:text-blue-600">{topic.title[lang]}</span>
                    <Icons.ChevronRight className="text-slate-300 group-hover:text-blue-500" />
                 </div>
               ))}
            </div>
         </div>
      </div>
    );
  }

  // 3. Active Simulation Lab
  const LabComponent = activeTopic.component;
  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
       <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-50 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setActiveTopic(null)} className="p-2 hover:bg-slate-100 rounded-full"><Icons.ArrowLeft size={20} className="text-slate-600"/></button>
             <div>
                <h3 className="font-bold text-slate-800 leading-none text-sm md:text-base">{activeTopic.title[lang]}</h3>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{activeChapter.title[lang]}</span>
             </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/> Live
          </div>
       </header>
       <main className="flex-grow overflow-hidden relative">
          <LabComponent lang={lang} />
       </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
