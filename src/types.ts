export interface WorkoutMetric {
  pace: string;      // ex: "04:12"
  distance: number;  // in km, ex: 12.4
  heartRate: number; // in bpm, ex: 154
  time: string;      // elapsed time, ex: "52:14"
  intensity: number; // intensity multiplier 0..100 (for energy lines flow speed)
}

export interface Athlete {
  id: string;
  name: string;
  avatarSeed: string;
  targetPace: string;
  currentPace: string;
  distanceKm: number;
  heartRate: number;
  cadence: number;
  status: 'active' | 'completed' | 'idle';
  telemetryStream: number[]; // real-time data flow values for the wave graphics
}

export interface CodeFile {
  name: string;
  path: string;
  language: 'typescript' | 'dart';
  content: string;
}

export interface PlatformCodebase {
  platform: 'React Native' | 'Flutter';
  description: string;
  files: CodeFile[];
}
