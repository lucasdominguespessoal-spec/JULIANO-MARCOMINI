import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingSimulator from './components/OnboardingSimulator';
import AthleteWorkspace from './components/AthleteWorkspace';
import TrainerDashboardSimulator from './components/TrainerDashboardSimulator';

export default function App() {
  const [athleteName, setAthleteName] = useState('ATLETA_B_09');
  const [authorized, setAuthorized] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('APP_THEME') as 'light' | 'dark') || 'dark';
  });

  const handleSetTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('APP_THEME', newTheme);
  };

  // Manipulador simulado de sucesso no login
  const handleLoginSuccess = (code: string) => {
    setAthleteName(code);
    setAuthorized(true);
  };

  const handleResetAuth = () => {
    setAuthorized(false);
  };

  return (
    <div 
      className={`w-full min-h-screen transition-colors duration-300 flex flex-col font-sans overflow-x-hidden ${
        theme === 'light' ? 'bg-[#f5f5f7] text-[#1c1c1e]' : 'bg-[#000000] text-white'
      }`} 
      id="app-workspace-root"
    >
      
      {/* Padrão de Micro Grid no Fundo */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity ${
          theme === 'light' 
            ? 'bg-[linear-gradient(to_right,rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.035)_1px,transparent_1px)]' 
            : 'bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)]'
        } bg-[size:30px_30px]`} 
        style={{ backgroundPosition: 'center' }}
      />
      
      {/* Orbes fluidos de efeito vidro/mercúrio atrás do simulador */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[18%] left-[-20%] w-[280px] h-[280px] rounded-full filter blur-[70px] mix-blend-screen ${
          theme === 'light' ? 'bg-[#10b981]/[0.08]' : 'bg-[#059669]/[0.12]'
        }`} />
        <div className={`absolute bottom-[22%] right-[-20%] w-[330px] h-[330px] rounded-full filter blur-[90px] mix-blend-screen ${
          theme === 'light' ? 'bg-[#3b82f6]/[0.05]' : 'bg-[#10b981]/[0.1]'
        }`} />
      </div>

      {/* Brilho ambiente de fundo */}
      <div className={`absolute top-[10%] left-[20%] w-96 h-96 opacity-5 blur-3xl rounded-full pointer-events-none ${
        theme === 'light' ? 'bg-[#000000]' : 'bg-white'
      }`} />

      {/* Display principal do app (focado na proporção mobile limpa) */}
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