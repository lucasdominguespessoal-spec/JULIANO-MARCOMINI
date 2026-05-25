import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import OnboardingSimulator from './components/OnboardingSimulator';
import AthleteWorkspace from './components/AthleteWorkspace';
import TrainerDashboardSimulator from './components/TrainerDashboardSimulator';

export default function App() {
  const [athleteName, setAthleteName] = useState('ATLETA_B_09');
  const [authorized, setAuthorized] = useState(false);

  // Permanently locked to the cinematic dark 'pista' track theme per user specification. No more dual colors.
  const theme = 'dark';

  const handleSetTheme = (newTheme: 'light' | 'dark') => {
    // Single theme locked. No-op to avoid breaking component prop signatures.
  };

  // Simulated biometric success handler
  const handleLoginSuccess = (code: string) => {
    setAthleteName(code);
    setAuthorized(true);
  };

  const handleResetAuth = () => {
    setAuthorized(false);
  };

  return (
    <div 
      className="w-full min-h-screen transition-all duration-500 flex flex-col font-sans overflow-x-hidden text-white" 
      id="app-workspace-root"
      style={{
        background: 'linear-gradient(180deg, #000000 0%, #0d0d11 15%, #18181b 35%, #2a2a30 55%, #46464f 75%, #a1a3aa 100%)'
      }}
    >
      
      {/* Cinematic athletics track and atmospheric desert dusk dunas simulator layout */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none animate-fade-in" id="cinematic-track-bg">
        {/* Grayscale track blurred and well-disguised */}
        <img
          src="https://images.unsplash.com/photo-1508847154043-be12a3b4d63e?auto=format&fit=crop&q=82&w=1080"
          alt="Cinematic Monochrome Athletics Track"
          className="w-full h-full object-cover select-none transition-all duration-1000 grayscale contrast-[1.4] brightness-[0.22] opacity-[0.06] scale-102 mix-blend-overlay"
          referrerPolicy="no-referrer"
          id="cinematic-track-img"
        />
        
        {/* Soft ambient monochrome aura reflecting off the frosted panels */}
        <div 
          className="absolute inset-0 mix-blend-color-dodge pointer-events-none opacity-40"
          style={{
            background: 'radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)'
          }}
        />

        {/* Elegant curved athletics track (Pista de Atletismo) with clay red lanes and white lane dividers */}
        <svg 
          className="absolute bottom-0 left-0 w-full h-[40%] pointer-events-none z-5 transition-opacity duration-500 opacity-90" 
          viewBox="0 0 1440 250" 
          preserveAspectRatio="none"
          fill="none"
        >
          {/* Base Track Surface - terracotta / warm clay running lane gradient */}
          <path 
            d="M0,120 C350,85 1090,85 1440,120 L1440,250 L0,250 Z" 
            fill="url(#track-surface-grad)" 
          />
          
          {/* Curved track lanes (Raias) in organic white lines */}
          <path 
            d="M-200,135 C280,95 1160,95 1640,135" 
            stroke="rgba(255,255,255,0.22)" 
            strokeWidth="2.5" 
          />
          <path 
            d="M50,150 C380,110 1060,110 1390,150" 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="2" 
          />
          <path 
            d="M300,168 C500,128 940,128 1140,168" 
            stroke="rgba(255,255,255,0.16)" 
            strokeWidth="2" 
            strokeDasharray="6 6"
          />
          <path 
            d="M550,186 C620,148 820,148 890,186" 
            stroke="rgba(255,255,255,0.12)" 
            strokeWidth="1.5" 
          />
          
          {/* Small starting mark indicator notches */}
          <line x1="220" y1="160" x2="260" y2="185" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
          <line x1="1180" y1="160" x2="1220" y2="185" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
          
          {/* Soft floating lane numbers printed on track surface */}
          <text x="360" y="215" fill="rgba(255,255,255,0.18)" fontSize="16" fontFamily="monospace" fontWeight="bolder">3</text>
          <text x="720" y="228" fill="rgba(255,255,255,0.22)" fontSize="18" fontFamily="monospace" fontWeight="bolder">4</text>
          <text x="1080" y="215" fill="rgba(255,255,255,0.18)" fontSize="16" fontFamily="monospace" fontWeight="bolder">5</text>
          
          <defs>
            <linearGradient id="track-surface-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e0c0c" stopOpacity="0.3" />
              <stop offset="35%" stopColor="#2e1313" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#150606" stopOpacity="0.96" />
            </linearGradient>
          </defs>
        </svg>

        {/* Fog and atmospheric lighting blend - removed bright white glare at bottom */}
        <div 
          className="absolute inset-0 mix-blend-normal pointer-events-none transition-all duration-[600ms]"
          id="atmospheric-fog-layer"
          style={{
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.98) 0%, rgba(9, 9, 11, 0.75) 15%, rgba(24, 24, 27, 0) 35%, rgba(244, 244, 245, 0.04) 70%, rgba(0,0,0,0.45) 100%)'
          }}
        />

        {/* Subtle ground shadow */}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent z-10 pointer-events-none" id="grass-shadow-gradient" />
      </div>

      {/* Background Micro Grid pattern */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:30px_30px]" 
        style={{ backgroundPosition: 'center' }}
      />
      
      {/* Fluid Liquid Glass floating silver mercury orbs behind the dashboard simulator view */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[18%] left-[-20%] w-[280px] h-[280px] rounded-full filter blur-[70px] mix-blend-screen animate-mercury-1 bg-[#ffffff]/[0.05]" />
        <div className="absolute bottom-[22%] right-[-20%] w-[330px] h-[330px] rounded-full filter blur-[90px] mix-blend-screen animate-mercury-2 bg-[#ffffff]/[0.03]" />
      </div>

      {/* Ambient background accent */}
      <div className="absolute top-[10%] left-[20%] w-96 h-96 opacity-2 blur-3xl rounded-full pointer-events-none bg-white" />

      {/* Main app display (without phone borders, frames or code explorer) */}
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col relative z-10 min-h-screen">
        <AnimatePresence mode="wait">
          {!authorized ? (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="flex-1 flex flex-col"
            >
              <OnboardingSimulator onLoginSuccess={handleLoginSuccess} theme={theme} setTheme={handleSetTheme} />
            </motion.div>
          ) : (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex-1 flex flex-col"
            >
              {athleteName === 'TREINADOR' ? (
                <TrainerDashboardSimulator onBackToRunner={handleResetAuth} theme={theme} setTheme={handleSetTheme} />
              ) : (
                <AthleteWorkspace athleteName={athleteName} onBack={handleResetAuth} theme={theme} setTheme={handleSetTheme} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
