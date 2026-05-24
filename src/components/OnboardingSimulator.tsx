import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, UserPlus, Phone, Lock, User, Check, Sun, Moon, Palette } from 'lucide-react';
import { getStateFromCloud, saveStateToCloud } from '../lib/supabase';

interface OnboardingSimulatorProps {
  onLoginSuccess: (athleteCode: string) => void;
  theme?: 'light' | 'dark';
  setTheme?: (newTheme: 'light' | 'dark') => void;
}

const PROFILES = [
  { id: 'athlete', label: 'ATLETA', labelShort: 'ATLE...', role: 'ATHLETE' },
  { id: 'trainer', label: 'TREINADOR', labelShort: 'TREIN...', role: 'COACH' },
  { id: 'create', label: 'CRIAR PERFIL', labelShort: 'CRIA...', role: 'NEW_RECORD' }
];

export default function OnboardingSimulator({ onLoginSuccess, theme = 'dark', setTheme }: OnboardingSimulatorProps) {
  const [activeIndex, setActiveIndex] = useState(1); // TREINADOR padrão
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [message, setMessage] = useState('');
  
  // Campos Login
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  
  // Campos Cadastro
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<'ATHLETE' | 'COACH'>('ATHLETE');
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(false);

  // Lista de usuários ativos
  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    async function loadUsers() {
      const defaultUsers = [
        { id: 'treinador', name: 'TREINADOR', phone: '0', password: '1234', role: 'COACH' },
        { id: 'lucas', name: 'LUCAS DOMINGUES', phone: '1', password: '1234', role: 'ATHLETE' },
        { id: 'gustavo', name: 'GUSTAVO HENRIQUE (ALFA)', phone: '2', password: '1234', role: 'ATHLETE' },
        { id: 'mariana', name: 'MARIANA COSTA (BETA)', phone: '3', password: '1234', role: 'ATHLETE' },
        { id: 'paula', name: 'PAULA ALBUQUERQUE (DELTA)', phone: '4', password: '1234', role: 'ATHLETE' }
      ];

      const isCleanStartSet = localStorage.getItem('IS_SYSTEM_CLEAN_START_TRUE');
      if (isCleanStartSet !== 'true') {
        localStorage.setItem('IS_SYSTEM_CLEAN_START_TRUE', 'true');
        localStorage.setItem('APP_USERS', JSON.stringify(defaultUsers));
        try {
          saveStateToCloud('APP_USERS', defaultUsers);
          saveStateToCloud('IS_SYSTEM_CLEAN_START_TRUE', true);
          saveStateToCloud('PLANILHA_CONFIG', null);
          saveStateToCloud('LUCAS_WORKOUT_STATES', null);
          saveStateToCloud('LUCAS_ATHLETE_FEEDBACK_DICT', null);
          saveStateToCloud('LUCAS_ACTIVITY_LOGS', null);
        } catch (_) {}
      }

      const res = await getStateFromCloud<any[]>('APP_USERS', defaultUsers);
      
      const mergedList = [...defaultUsers];
      if (res.data && Array.isArray(res.data)) {
        res.data.forEach((u: any) => {
          if (u && u.phone && !mergedList.some(item => item.phone === u.phone)) {
            mergedList.push(u);
          }
        });
      }
      setUsersList(mergedList);
      localStorage.setItem('APP_USERS', JSON.stringify(mergedList));
    }
    loadUsers();
  }, []);

  useEffect(() => {
    setFormError('');
    setIsScanning(false);
    setScanProgress(0);
    setMessage('');
  }, [activeIndex]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      setMessage('LENDO DADOS BIOMÉTRICOS...');
      setFormError('');
      interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsScanning(false);
              setMessage('ACESSO AUTORIZADO');
              setIsSubmitting(true);
              
              setTimeout(async () => {
                setIsSubmitting(false);
                if (activeIndex === 2) {
                  const cleanName = registerName.toUpperCase().trim();
                  const cleanPhone = registerPhone.trim();

                  const newUser = {
                    id: cleanName.toLowerCase().replace(/\s+/g, '_'),
                    name: cleanName,
                    phone: cleanPhone,
                    password: registerPassword,
                    role: registerRole
                  };

                  const updatedList = [...usersList, newUser];
                  setUsersList(updatedList);
                  await saveStateToCloud('APP_USERS', updatedList);

                  onLoginSuccess(newUser.role === 'COACH' ? 'TREINADOR' : newUser.name);
                } else {
                  const matched = usersList.find(u => u.phone === phoneNumber);
                  if (matched) {
                    onLoginSuccess(matched.role === 'COACH' ? 'TREINADOR' : matched.name);
                  } else {
                    onLoginSuccess(activeIndex === 0 ? 'ATLETA_B_09' : 'TREINADOR');
                  }
                }
              }, 800);
            }, 300);
            return 100;
          }
          return prev + 5;
        });
      }, 35);
    } else {
      setScanProgress(0);
    }
    return () => clearInterval(interval);
  }, [isScanning, activeIndex, registerName, registerPhone, registerPassword, registerRole, usersList, phoneNumber, onLoginSuccess]);

  const validateFields = () => {
    if (activeIndex === 2) {
      if (!registerName.trim()) {
        setFormError('DIGITE SEU NOME COMPLETO');
        setShakeTrigger(true);
        return false;
      }
      if (!registerPhone.trim()) {
        setFormError('DIGITE SEU TELEFONE CELULAR');
        setShakeTrigger(true);
        return false;
      }
      if (registerPassword.length < 4) {
        setFormError('SENHA MÍNIMO 4 DÍG');
        setShakeTrigger(true);
        return false;
      }
      const duplicate = usersList.some(u => u.phone === registerPhone);
      if (duplicate) {
        setFormError('TELEFONE JÁ REGISTRADO');
        setShakeTrigger(true);
        return false;
      }
    } else {
      if (!phoneNumber.trim()) {
        setFormError('DIGITE SEU CELULAR');
        setShakeTrigger(true);
        return false;
      }
      if (!password.trim()) {
        setFormError('DIGITE SUA SENHA');
        setShakeTrigger(true);
        return false;
      }

      const matched = usersList.find(u => u.phone === phoneNumber);
      if (!matched) {
        setFormError('CELULAR NÃO REGISTRADO');
        setShakeTrigger(true);
        return false;
      }
      if (matched.password !== password) {
        setFormError('SENHA INCORRETA');
        setShakeTrigger(true);
        return false;
      }

      const expectedRole = activeIndex === 0 ? 'ATHLETE' : 'COACH';
      if (matched.role !== expectedRole) {
        setFormError(activeIndex === 0 ? 'ESTE CADASTRO É DE TREINADOR' : 'ESTE CADASTRO É DE ATLETA');
        setShakeTrigger(true);
        return false;
      }
    }
    return true;
  };

  const handleStartScan = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e && e.type === 'touchstart') {
      if (e.cancelable) e.preventDefault();
    }
    if (isSubmitting || isScanning) return;
    setFormError('');
    if (!validateFields()) return;
    setIsScanning(true);
  };

  const handleCancelScan = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e && e.type === 'touchend') {
      if (e.cancelable) e.preventDefault();
    }
    if (scanProgress < 100) {
      setIsScanning(false);
      setScanProgress(0);
      setMessage('');
    }
  };

  const handlePrev = () => {
    if (isScanning || isSubmitting) return;
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : PROFILES.length - 1));
  };

  const handleNext = () => {
    if (isScanning || isSubmitting) return;
    setActiveIndex((prev) => (prev < PROFILES.length - 1 ? prev + 1 : 0));
  };

  const handleSwipe = (event: any, info: any) => {
    if (isScanning || isSubmitting) return;
    const swipeThreshold = 45;
    if (info.offset.x < -swipeThreshold) {
      handleNext();
    } else if (info.offset.x > swipeThreshold) {
      handlePrev();
    }
  };

  const getLeftLabel = () => {
    const idx = activeIndex === 0 ? PROFILES.length - 1 : activeIndex - 1;
    return PROFILES[idx].labelShort;
  };

  const getRightLabel = () => {
    const idx = activeIndex === PROFILES.length - 1 ? 0 : activeIndex + 1;
    return PROFILES[idx].labelShort;
  };

  return (
    <div className={`relative w-full flex-1 flex flex-col justify-between items-center py-4 px-6 overflow-hidden select-none h-screen max-h-screen transition-colors duration-300 ${
      theme === 'light' ? 'bg-[#f5f5f7] text-neutral-900' : 'bg-black text-white'
    }`} id="onboarding-simulator-root">
      
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-[1px] bg-gradient-to-r from-transparent to-transparent pointer-events-none ${
        theme === 'light' ? 'via-neutral-300' : 'via-neutral-800'
      }`} />

      {/* Cabeçalho principal */}
      <div className="text-center w-full z-10 pt-2 select-none flex flex-col items-center">
        <motion.h1 
          className={`text-2xl md:text-3xl font-extrabold tracking-[0.15em] font-display uppercase leading-tight transition-colors ${
            theme === 'light' ? 'text-neutral-900 drop-shadow-sm' : 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]'
          }`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          JULIANO MARCOMINI
        </motion.h1>
        
        <motion.p 
          className={`text-[9px] uppercase tracking-[0.25em] font-mono mt-1.5 transition-colors ${
            theme === 'light' ? 'text-neutral-600' : 'text-neutral-400'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          PARA ATLETAS CORREDORES
        </motion.p>

        <motion.div className="mt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <button
            onClick={() => setTheme && setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`px-3 py-1 rounded-full border text-[7.5px] font-mono tracking-widest uppercase flex items-center gap-1.5 transition-all duration-300 active:scale-95 cursor-pointer ${
              theme === 'light' 
                ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800 hover:text-black' 
                : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/30'
            }`}
          >
            {theme === 'light' ? (
              <>
                <Sun className="w-2.5 h-2.5 text-amber-500 animate-spin" style={{ animationDuration: '12s' }} />
                <span>MODO CLARO</span>
              </>
            ) : (
              <>
                <Moon className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                <span>MODO ESCURO</span>
              </>
            )}
          </button>
        </motion.div>
      </div>

      {/* Painel Interativo Central */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm px-4 my-2 z-10 gap-3">
        <div className={`absolute w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-40 ${
          theme === 'light' ? 'bg-neutral-200' : 'bg-white opacity-[0.015]'
        }`} />

        <div className="w-full max-w-[270px] h-[230px] relative flex flex-col justify-center select-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                x: shakeTrigger ? [0, -6, 6, -6, 6, 0] : 0
              }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.3, x: { duration: 0.4 } }}
              onAnimationComplete={() => setShakeTrigger(false)}
              className="w-full flex flex-col gap-3 py-1 absolute inset-y-0 left-0 right-0 justify-center"
            >
              <div className="text-center">
                <span className={`text-[11px] font-mono tracking-[0.22em] uppercase block ${
                  theme === 'light' ? 'text-neutral-500' : 'text-neutral-400'
                }`}>
                  {activeIndex === 2 ? 'CRIAR NOVO PERFIL' : `ENTRAR COMO ${PROFILES[activeIndex].label}`}
                </span>
              </div>

              {activeIndex === 2 ? (
                <div className="space-y-3">
                  <div className={`grid grid-cols-2 gap-1 p-[2px] border ${
                    theme === 'light' ? 'bg-neutral-200 border-neutral-300' : 'bg-neutral-950 border-neutral-900'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setRegisterRole('ATHLETE')}
                      className={`font-mono text-[10px] py-1.5 transition-all duration-300 tracking-[0.14em] cursor-pointer ${
                        registerRole === 'ATHLETE' 
                          ? 'bg-white text-black font-semibold' 
                          : `${theme === 'light' ? 'text-neutral-500 ' : 'text-neutral-400'} bg-transparent`
                      }`}
                    >
                      ATLETA
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterRole('COACH')}
                      className={`font-mono text-[10px] py-1.5 transition-all duration-300 tracking-[0.14em] cursor-pointer ${
                        registerRole === 'COACH' 
                          ? 'bg-white text-black font-semibold' 
                          : `${theme === 'light' ? 'text-neutral-500' : 'text-neutral-400'} bg-transparent`
                      }`}
                    >
                      TREINADOR
                    </button>
                  </div>

                  {/* Nome Completo */}
                  <div className="relative group">
                    <div className={`absolute left-0 bottom-1.5 ${theme === 'light' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      <User className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <input
                      type="text"
                      maxLength={18}
                      value={registerName}
                      onChange={(e) => { setRegisterName(e.target.value); setFormError(''); }}
                      placeholder="NOME COMPLETO"
                      className={`w-full bg-transparent border-b text-sm pl-7 pr-2 py-1.5 focus:outline-none tracking-widest uppercase placeholder:text-[11px] ${
                        theme === 'light' ? 'border-neutral-300 text-neutral-900' : 'border-neutral-900 text-white'
                      }`}
                    />
                  </div>

                  {/* Celular Cadastro */}
                  <div className="relative group">
                    <div className={`absolute left-0 bottom-1.5 ${theme === 'light' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      <Phone className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <input
                      type="tel"
                      value={registerPhone}
                      onChange={(e) => { setRegisterPhone(e.target.value.replace(/\D/g, '')); setFormError(''); }}
                      placeholder="DIGITE SEU CELULAR"
                      className={`w-full bg-transparent border-b text-sm pl-7 pr-2 py-1.5 focus:outline-none tracking-widest placeholder:text-[11px] ${
                        theme === 'light' ? 'border-neutral-300 text-neutral-900' : 'border-neutral-900 text-white'
                      }`}
                    />
                  </div>

                  {/* Senha Cadastro */}
                  <div className="relative group">
                    <div className={`absolute left-0 bottom-1.5 ${theme === 'light' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      <Lock className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <input
                      type="password"
                      value={registerPassword}
                      onChange={(e) => { setRegisterPassword(e.target.value); setFormError(''); }}
                      placeholder="SENHA DE ACESSO"
                      className={`w-full bg-transparent border-b text-sm pl-7 pr-2 py-1.5 focus:outline-none tracking-widest placeholder:text-[11px] ${
                        theme === 'light' ? 'border-neutral-300 text-neutral-900' : 'border-neutral-900 text-white'
                      }`}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4.5">
                  {/* Celular Login */}
                  <div className="relative group">
                    <div className={`absolute left-0 bottom-1.5 ${theme === 'light' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      <Phone className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => { setPhoneNumber(e.target.value.replace(/\D/g, '')); setFormError(''); }}
                      placeholder="DIGITE SEU CELULAR"
                      className={`w-full bg-transparent border-b text-sm pl-7 pr-2 py-1.5 focus:outline-none tracking-widest placeholder:text-[11px] ${
                        theme === 'light' ? 'border-neutral-300 text-neutral-900' : 'border-neutral-900 text-white'
                      }`}
                    />
                  </div>

                  {/* Senha Login */}
                  <div className="relative group">
                    <div className={`absolute left-0 bottom-1.5 ${theme === 'light' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      <Lock className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setFormError(''); }}
                      placeholder="SENHA DE ACESSO"
                      className={`w-full bg-transparent border-b text-sm pl-7 pr-2 py-1.5 focus:outline-none tracking-widest placeholder:text-[11px] ${
                        theme === 'light' ? 'border-neutral-300 text-neutral-900' : 'border-neutral-900 text-white'
                      }`}
                    />
                  </div>
                </div>
              )}

              {formError && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-red-500 font-mono tracking-wide text-center uppercase block mt-1">
                  ⚠ {formError}
                </motion.span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Feedback Biométrico */}
        <div className="text-center h-4 select-none my-1">
          {isScanning ? (
            <p className={`font-mono text-[11px] uppercase tracking-[0.15em] animate-pulse ${theme === 'light' ? 'text-neutral-900' : 'text-white'}`}>
              {message}
            </p>
          ) : isSubmitting ? (
            <span className={`flex items-center gap-1.5 justify-center font-mono text-[11px] tracking-[0.14em] ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>
              <span className={`w-3 h-3 border-2 border-t-transparent rounded-full animate-spin ${theme === 'light' ? 'border-emerald-600' : 'border-emerald-500'}`} />
              SISTEMA CARREGANDO PERFIL...
            </span>
          ) : null}
        </div>

        {/* Área Digital / Scanner */}
        <div className="relative flex items-center justify-center w-48 h-48">
          <AnimatePresence>
            {isScanning && (
              <motion.div 
                className={`absolute left-6 right-6 h-[2.5px] z-20 ${theme === 'light' ? 'bg-neutral-900' : 'bg-white'}`}
                style={{ top: `${15 + (scanProgress * 0.7)}%` }}
                initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              />
            )}
          </AnimatePresence>

          <motion.div
            onMouseDown={handleStartScan} onMouseUp={handleCancelScan} onMouseLeave={handleCancelScan}
            onTouchStart={handleStartScan} onTouchEnd={handleCancelScan}
            className="w-44 h-44 cursor-pointer flex flex-col items-center justify-center relative bg-transparent"
            style={{ touchAction: 'none' }}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" viewBox="0 0 100 100">
              <g className={theme === 'light' ? "opacity-25" : "opacity-15"}>
                <circle cx="50" cy="50" r="32" fill="none" stroke={theme === 'light' ? 'black' : 'white'} strokeWidth="0.4" strokeDasharray="3 3" />
                <circle cx="50" cy="50" r="24" fill="none" stroke={theme === 'light' ? 'black' : 'white'} strokeWidth="0.2" strokeDasharray="1 3" />
              </g>

              <motion.path
                d="M 50,16 C 72,19 84,33 80,54 C 76,75 64,81 50,81 C 36,81 20,72 21,50 C 22,28 28,13 50,16 Z"
                fill="none" stroke={theme === 'light' ? 'black' : 'white'} strokeWidth="0.3" className={theme === 'light' ? "opacity-30" : "opacity-20"}
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 25, ease: 'linear' }} style={{ transformOrigin: '50px 50px' }}
              />

              <g transform="rotate(-90 50 50)">
                <circle cx="50" cy="50" r="32" stroke={theme === 'light' ? '#e5e5ea' : '#161616'} strokeWidth="1.2" fill="transparent" />
                {isScanning && (
                  <circle
                    cx="50" cy="50" r="32" stroke={theme === 'light' ? '#000000' : '#ffffff'} strokeWidth="1.2" fill="transparent" strokeDasharray="201.06"
                    strokeDashoffset={201.06 - (201.06 * scanProgress) / 100} style={{ transition: 'stroke-dashoffset 0.08s linear' }}
                  />
                )}
              </g>
            </svg>

            <div className="z-10 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <Fingerprint className={`w-12 h-12 transition-all duration-300 ${isScanning ? (theme === 'light' ? 'text-black' : 'text-white') : 'text-neutral-500'}`} />
              <span className={`text-[11px] font-mono tracking-[0.22em] font-medium ${theme === 'light' ? 'text-neutral-600' : 'text-neutral-400'}`}>
                {isScanning ? `${scanProgress}%` : 'AUTENTICAR'}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Seletor Lateral (Bottom Slider) */}
      <div className="w-full select-none z-20">
        <motion.div className="relative w-full h-14 flex items-center justify-center cursor-ew-resize overflow-hidden" drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={handleSwipe}>
          <div className="absolute w-full flex items-center justify-center gap-4 sm:gap-10 font-mono text-xs px-4">
            <div onClick={handlePrev} className={`w-24 text-right opacity-15 hover:opacity-35 transition-all duration-300 text-[10px] sm:text-xs cursor-pointer truncate pr-1 ${theme === 'light' ? 'text-neutral-800' : 'text-neutral-400'}`}>
              {getLeftLabel()}
            </div>

            <div className={`flex items-center justify-center gap-2 font-extrabold tracking-widest text-xs sm:text-sm ${theme === 'light' ? 'text-neutral-900' : 'text-white'}`}>
              <button onClick={handlePrev} className={`text-[10px] px-1.5 py-1 ${theme === 'light' ? 'text-neutral-400 hover:text-black' : 'text-neutral-600 hover:text-white'}`}>&lt;</button>
              <div className="w-[140px] sm:w-[160px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex + PROFILES[activeIndex].label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                    className={`whitespace-nowrap flex items-center justify-center gap-1.5 ${theme === 'light' ? 'text-neutral-900' : 'text-white'}`}
                  >
                    {activeIndex === 2 && <UserPlus className="w-3.5 h-3.5 inline-block" />}
                    {PROFILES[activeIndex].label}
                  </motion.div>
                </AnimatePresence>
              </div>
              <button onClick={handleNext} className={`text-[10px] px-1.5 py-1 ${theme === 'light' ? 'text-neutral-400 hover:text-black' : 'text-neutral-600 hover:text-white'}`}>&gt;</button>
            </div>

            <div onClick={handleNext} className={`w-24 text-left opacity-15 hover:opacity-35 transition-all duration-300 text-[10px] sm:text-xs cursor-pointer truncate pl-1 ${theme === 'light' ? 'text-neutral-800' : 'text-neutral-400'}`}>
              {getRightLabel()}
            </div>
          </div>
        </motion.div>

        <div className={`relative w-full h-[1px] mb-3 px-8 ${theme === 'light' ? 'bg-neutral-300' : 'bg-neutral-900'}`}>
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-24 h-full bg-emerald-500 shadow-[0_0_12px_#10b981]" />
        </div>

        <div className={`text-center text-[8px] font-mono tracking-[0.25em] uppercase ${theme === 'light' ? 'text-neutral-500' : 'text-neutral-600'}`}>
          ★ ARRASTAR OU CLICAR PARA NAVEGAR
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0" style={{ opacity: theme === 'light' ? 0.05 : 0.15, backgroundImage: `linear-gradient(to right, #141414 1px, transparent 1px), linear-gradient(to bottom, #141414 1px, transparent 1px)`, backgroundSize: '16px 16px' }} />
    </div>
  );
}