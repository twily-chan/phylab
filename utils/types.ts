
import React from 'react';

export type Language = 'en' | 'bn';

export interface SimulationState {
  t: number;
  [key: string]: number; // Dynamic properties for v, a, s, F, p, etc.
}

export interface Topic {
  id: string;
  title: { en: string; bn: string };
  description?: { en: string; bn: string };
  component: React.ComponentType<{ lang: Language }>;
}

export interface Chapter {
  id: string;
  title: { en: string; bn: string };
  icon: React.ReactNode;
  topics: Topic[];
}

export interface GraphPoint {
  x: number;
  y: number;
}

export interface GraphConfig {
  id: string;
  label: string;
  color: string;
  yLabel: string;
  xLabel: string;
  dataKey: string; // Key in SimulationState
}
