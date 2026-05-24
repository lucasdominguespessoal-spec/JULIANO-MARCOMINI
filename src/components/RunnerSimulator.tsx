import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Zap, Play, Pause, Compass, ArrowRight, EyeOff, RotateCcw } from 'lucide-react';
import { WorkoutMetric } from '../types';

interface RunnerSimulatorProps {
  athleteCode: string;
  onNavigateToDashboard: () => void;
  onReset: () => void;
}

export default function RunnerSimulator({ athleteCode, onNavigateToDashboard, onReset }: RunnerSimulatorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [intensity, setIntensity] = useState(60); // 0..100%
  const [metrics, setMetrics] = useState<WorkoutMetric>({
    pace: "04:12",
    distance: 8.42,
    heartRate: 154,
    time: "35:42",
    intensity: 60,
  });
  
  // States for secondary display toggle
  const [stealthMode, setStealthMode] = useState(false);

  // Simulation loop for timer, distance, pace fluctuation and heartRate adjustment
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setMetrics((prev) => {
          // Time parsing and increment
          const [minStr, secStr] = prev.time.split(':');
          let minutes = parseInt(minStr, 10);
          let seconds = parseInt(secStr, 10);
          seconds += 1;
          if (seconds >= 60) {
            minutes += 1;
            seconds = 0;
          }
          const nextTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

          // Distance logic based on intensity and time passing
          // ~ 4:12 pace means around ~ 0.004 km increment per second
          const speedFactor = 0.001 * (3 + (intensity / 30));
          const nextDistance = parseFloat((prev.distance + speedFactor).toFixed(3));

          // Real-time heart rate variation
          const targetHeartRate = 120 + Math.floor((intensity / 100) * 65) + Math.floor(Math.sin(minutes) * 5);
          const hrDiff = targetHeartRate - prev.heartRate;
          const nextHR = prev.heartRate + (hrDiff > 0 ? 1 : hrDiff < 0 ? -1 : 0);

          // Real-time pace lookup calculation based on speed
          // Ex: 04:12 at 60 intensity. If intensity is higher, pace becomes faster (shorter time, e.g. 03:55)
          const totalSecondsForKM = Math.max(180, 400 - Math.floor((intensity / 100) * 160) + Math.floor(Math.random() * 5));
          const paceMin = Math.floor(totalSecondsForKM / 60);
          const paceSec = totalSecondsForKM % 60;
          const nextPace = `${paceMin.toString().padStart(2, '0')}:${paceSec.toString().padStart(2, '0')}`;

          return {
            pace: nextPace,
            distance: nextDistance,
            heartRate: nextHR,
            time: nextTime,
            intensity,
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, intensity]);

  // Adjust energy line animation speed
  const flowSpeedSeconds = Math.max(0.4, 2 - (intensity / 100) * 1.6);

  return (
    <div className="relative w-full h-full bg-[#000000] text-white flex flex-col justify-between overflow-hidden select-none" id="runner-simulator-root">
      
      {/* Facho de Luz (Spotlight) Top-Down styling */}
      <div className="absolute top-0 left-0 right-0 h-[80%] pointer-events-none overflow-hidden z-0">
        {/* Subtle glowing source spot */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-white blur-md" />
        
        {/* Light Cone geometry using SVG */}
        <svg className="w-full h-full opacity-60" viewBox="0 0 400 600" preserveAspectRatio="none">
          <defs>
            <linearGradient id="spotlightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="energyGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d="M120,0 L280,0 L360,600 L40,600 Z" fill="url(#spotlightGrad)" />
        </svg>
      </div>

      {/* Linhas de Energia Laterais (White flow lines running along limits) */}
      <div className="absolute left-0 top-12 bottom-12 w-[1px] bg-neutral-900 pointer-events-none z-10">
        <motion.div 
          className="w-[2px] bg-white absolute"
          style={{ height: '40px', left: '-1px' }}
          animate={{ y: ['0%', '800%'] }}
          transition={{
            duration: flowSpeedSeconds,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="w-[2px] bg-white absolute"
          style={{ height: '25px', left: '-1px' }}
          animate={{ y: ['-200%', '600%'] }}
          transition={{
            duration: flowSpeedSeconds * 1.5,
            repeat: Infinity,
            ease: "linear",
            delay: 0.15
          }}
        />
      </div>

      <div className="absolute right-0 top-12 bottom-12 w-[1px] bg-neutral-900 pointer-events-none z-10">
        <motion.div 
          className="w-[2px] bg-white absolute"
          style={{ height: '55px', right: '-1px' }}
          animate={{ y: ['800%', '0%'] }}
          transition={{
            duration: flowSpeedSeconds * 1.2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="w-[2px] bg-white absolute"
          style={{ height: '30px', right: '-1px' }}
          animate={{ y: ['1000%', '-200%'] }}
          transition={{
            duration: flowSpeedSeconds * 0.8,
            repeat: Infinity,
            ease: "linear",
            delay: 0.3
          }}
        />
      </div>

      {/* Top Controls Bar */}
      <div className="p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
            SIDE_B // GPS_ACTIVE
          </span>
        </div>
        
        <div className="flex gap-3">
          <button 
            id="toggle-stealth"
            onClick={() => setStealthMode(!stealthMode)}
            className="p-1 px-2.5 rounded-none border border-neutral-800 text-[9px] font-mono text-neutral-400 hover:text-white hover:border-white transition-colors duration-200"
            title="Modo Altamente Cego OLED"
          >
            {stealthMode ? "METRICA_MAX" : "STEALTH_ON"}
          </button>
          <button 
            id="reset-runner"
            onClick={onReset}
            className="p-1 px-2.5 rounded-none border border-neutral-900 text-neutral-500 hover:text-white hover:border-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Performance Central Metric Windows */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 relative z-10">
        
        {/* Metric illuminated directly by Spotlight */}
        {!stealthMode ? (
          <motion.div 
            className="text-center space-y-2.5 my-3 py-6 px-10 rounded-2xl liquid-glass liquid-sheen shadow-2xl border border-white/10 transition-all duration-300 relative hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(255,255,255,0.12)]"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Glossy liquid glass scanner bar line */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            
            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-neutral-400 font-bold">RITMO ATUAL</p>
            <h2 className="text-6xl md:text-7xl font-bold font-display tracking-tight text-white font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.25)]">
              {metrics.pace}
            </h2>
            <p className="text-[9px] font-mono text-neutral-500 tracking-wider">REPETIÇÃO DO INTERVALO SEC</p>
          </motion.div>
        ) : (
          /* Micro Stealth display where metrics are heavily blacked out except a dynamic progress cursor */
          <div className="h-28 flex items-center justify-center font-mono text-sm tracking-wide text-neutral-500">
            [ TELA INTEIRA ESCURA // TOUCH PARA REVELAR ]
          </div>
        )}

        {/* Medium Line separator / Anchor */}
        <div className="w-16 h-[1px] bg-neutral-900/60 my-4" />

        {/* Grid Stats wrapped in sleek liquid glass bubbles */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs text-center py-2">
          <div className="px-3 py-3 rounded-2xl liquid-glass transition-all duration-300 hover:scale-[1.03]">
            <span className="block text-[8px] font-mono text-neutral-500 tracking-widest uppercase mb-1">DISTÂNCIA TOTAL</span>
            <span className="block text-xl md:text-2xl font-bold font-display font-light text-white">
              {metrics.distance.toFixed(2)} <span className="text-[10px] text-neutral-500">KM</span>
            </span>
          </div>
          <div className="px-3 py-3 rounded-2xl liquid-glass transition-all duration-300 hover:scale-[1.03]">
            <span className="block text-[8px] font-mono text-neutral-500 tracking-widest uppercase mb-1">CRONÔMETRO</span>
            <span className="block text-xl md:text-2xl font-bold font-mono text-white">
              {metrics.time}
            </span>
          </div>
        </div>

        {/* Heart Rate Progression widget using liquid-glass style design */}
        <div className="flex items-center gap-3 mt-8 px-5 py-2.5 rounded-full liquid-glass shadow-lg font-mono text-[10px] tracking-widest transition-all hover:scale-102">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="text-neutral-200 font-bold">{metrics.heartRate} <span className="text-neutral-500">BPM</span></span>
          <div className="w-[1px] h-3 bg-white/10" />
          <span className="text-neutral-400">CAD: 178 SPM</span>
        </div>
      </div>

      {/* Real-time slider controlling training intensity and Energy Line velocity */}
      <div className="p-5 z-10 rounded-t-3xl liquid-glass border-t border-white/5 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center text-[9px] font-mono text-neutral-400 uppercase tracking-widest">
          <span className="flex items-center gap-1.5 font-bold text-white">
            <Zap className="w-3 h-3 text-emerald-400 animate-bounce" />
            INTENSIDADE ATIVA
          </span>
          <span className="text-emerald-400 font-bold">{intensity}%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-mono text-neutral-600">RELAXADO</span>
          <input 
            type="range"
            min="10"
            max="100"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="flex-1 accent-white bg-neutral-800 h-[2px] cursor-pointer"
          />
          <span className="text-[8px] font-mono text-white">LIMIAR_B</span>
        </div>

        {/* Start / Pause Tactical Button with modern liquid feedback */}
        <div className="pt-2 flex gap-3">
          <button
            id="toggle-workout-state"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-mono text-xs tracking-widest uppercase transition-all duration-300 active:scale-95 cursor-pointer ${
              isPlaying 
                ? 'bg-neutral-950 border border-neutral-800 text-white hover:bg-[#080808] shadow-inner' 
                : 'bg-white text-black border border-white hover:bg-neutral-200 shadow-md font-black'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                CONGELAR TREINO (PAUSAR)
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" fill="black" />
                DISPARAR METRO DE CORRIDA
              </>
            )}
          </button>
          
          <button 
            id="runner-direct-dashboard"
            onClick={onNavigateToDashboard}
            className="flex-none p-3.5 rounded-xl border border-neutral-800 hover:border-white hover:bg-white/5 transition-all active:scale-95 cursor-pointer"
            title="Ir para Analytics"
          >
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
