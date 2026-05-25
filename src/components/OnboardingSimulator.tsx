import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [activeIndex, setActiveIndex] = useState(0); // ATLETA is now the default (index 0) per user specification
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [message, setMessage] = useState('');
  
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hrs = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      setTimeStr(`${hrs}:${mins}`);
      
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      const formattedDate = d.toLocaleDateString('pt-BR', options).toUpperCase();
      setDateStr(formattedDate);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);
  
  // Login fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(false);

  // Loaded system accounts list state
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

      // Force clean start default initially - Wipes all testing data silently programmatically
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
      
      // Ensure the active/default list is never emptier than our pre-registered default users
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

  // Clear states when user changes active index profile
  useEffect(() => {
    setFormError('');
    setIsScanning(false);
    setScanProgress(0);
    setMessage('');
  }, [activeIndex]);

  // Simulating the fingerprint scanning sequence and final unlock
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
              
              // Simulate database encryption check
              setTimeout(async () => {
                setIsSubmitting(false);
                if (activeIndex === 2) {
                  const cleanPhone = phoneNumber.trim();
                  const cleanPassword = password.trim();
                  const cleanName = `ALUNO ${cleanPhone}`;

                  // Save registration to dynamic cloud users list
                  const newUser = {
                    id: `aluno_${cleanPhone}`,
                    name: cleanName,
                    phone: cleanPhone,
                    password: cleanPassword,
                    role: 'ATHLETE'
                  };

                  const updatedList = [...usersList, newUser];
                  setUsersList(updatedList);
                  await saveStateToCloud('APP_USERS', updatedList);

                  onLoginSuccess(newUser.name);
                } else {
                  // Direct login matched from system list
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
  }, [isScanning, activeIndex, phoneNumber, password, usersList, onLoginSuccess]);

  const validateFields = () => {
    if (activeIndex === 2) {
      if (!phoneNumber.trim()) {
        setFormError('DIGITE SEU CELULAR');
        setShakeTrigger(true);
        return false;
      }
      if (password.length < 4) {
        setFormError('SENHA MÍNIMO 4 DÍG');
        setShakeTrigger(true);
        return false;
      }
      const duplicate = usersList.some(u => u.phone === phoneNumber);
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

      // Check matching credentials against dynamised usersList
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
      if (e.cancelable) {
        e.preventDefault();
      }
    }
    if (isSubmitting || isScanning) return;
    setFormError('');
    
    // Validate inline fields before starting scan
    if (!validateFields()) return;

    // Start real biometric press-and-hold scan process
    setIsScanning(true);
  };

  const handleCancelScan = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e && e.type === 'touchend') {
      if (e.cancelable) {
        e.preventDefault();
      }
    }
    if (scanProgress < 100) {
      setIsScanning(false);
      setScanProgress(0);
      setMessage('');
    }
  };

  // Swiper Navigation handlers
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

  const isLight = theme === 'light';

  return (
    <div className={`relative w-full flex-1 flex flex-col justify-between items-center py-4 px-6 overflow-hidden select-none h-screen max-h-screen transition-all duration-500 bg-transparent ${
      isLight ? 'text-neutral-900' : 'text-white'
    }`} id="onboarding-simulator-root">
      
      {/* Absolute elegant merged twilight background transitions */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 transition-all duration-[800ms]"
        style={{
          background: 'transparent'
        }}
      />

      {/* Absolute top glowing ambient header element */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-[1px] bg-gradient-to-r from-transparent to-transparent pointer-events-none ${
        isLight ? 'via-neutral-400/30' : 'via-white/10'
      }`} />

      {/* Brand Header */}
      <div className="text-center w-full z-10 pt-2 select-none flex flex-col items-center">
        <motion.h1 
          className={`text-2xl font-black tracking-[0.22em] font-display uppercase leading-tight transition-all duration-500 ${
            isLight ? 'text-neutral-900 drop-shadow-[0_1px_4px_rgba(255,255,255,0.25)]' : 'text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.65)]'
          }`}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          JULIANO MARCOMINI
        </motion.h1>
        
        <motion.div
          className={`flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full border backdrop-blur-md text-[8px] font-mono tracking-[0.18em] font-bold transition-all duration-300 ${
            isLight ? 'border-black/5 bg-black/[0.04] text-neutral-600' : 'border-white/5 bg-white/5 text-neutral-400'
          }`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-350 animate-pulse" />
          <span>SISTEMA PARA ATLETAS CORREDORES</span>
        </motion.div>

        {/* Dynamic Clock Badge capsule & Date timeline (Inspired by Reference 1) */}
        <motion.div
          className="flex items-center gap-2 mt-3 z-25"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="px-2.5 py-0.5 rounded-md text-[9px] font-mono tracking-widest font-black transition-all bg-neutral-900 text-white dark:bg-white dark:text-black shadow-sm">
            {timeStr || '12:00'}
          </div>
          <span className={`text-[8.5px] font-mono tracking-[0.2em] font-extrabold ${isLight ? 'text-neutral-500' : 'text-neutral-450'}`}>
            • {dateStr || '25 DE MAIO DE 2026'}
          </span>
        </motion.div>
      {/* Main Card: Seamless minimalist container without borders or background cards */}
      <div 
        id="main-glassmorphic-panel"
        className="w-full max-w-[315px] px-2 py-2 flex flex-col items-center gap-4 transition-all duration-500 select-none z-10"
      >
        
        {/* Glow behind the secondary interaction region */}
        <div className="absolute top-1/4 w-32 h-32 rounded-full blur-3xl pointer-events-none bg-white/[0.03] opacity-15" />

        {/* Seamless content container without background card blocks or borders with fixed height to prevent movement */}
        <div className="w-full relative flex flex-col h-[180px] justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                x: shakeTrigger ? [0, -6, 6, -6, 6, 0] : 0
              }}
              exit={{ opacity: 0, scale: 0.98, y: -8 }}
              transition={{ 
                duration: 0.28,
                x: { duration: 0.4 }
              }}
              onAnimationComplete={() => setShakeTrigger(false)}
              className="w-full flex flex-col gap-3.5 justify-center"
            >
              {/* Dynamic Title */}
              <div className="text-center">
                <span className="text-[10px] font-mono tracking-[0.22em] uppercase font-black text-zinc-400">
                  {activeIndex === 2 ? 'CRIAR NOVO PERFIL' : `ENTRAR COMO ${PROFILES[activeIndex].label}`}
                </span>
              </div>

              {/* Form Input fields: only cellular and password */}
              <div className="h-[96px] flex flex-col justify-center space-y-4">
                {/* Phone Input */}
                <div className="relative group transition-all duration-300">
                  <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-white transition-colors duration-300 stroke-[1.5]" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value.replace(/\D/g, ''));
                      setFormError('');
                    }}
                    placeholder="DIGITE SEU CELULAR"
                    className="w-full bg-transparent border-b border-white/10 hover:border-white/20 focus:border-white/40 text-[11px] pl-6 pr-1 py-1.5 rounded-none focus:outline-none focus:ring-0 tracking-widest transition-all placeholder:text-[9.5px] placeholder:tracking-widest text-white placeholder-zinc-500"
                  />
                </div>

                {/* Password Input */}
                <div className="relative group transition-all duration-300">
                  <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-white transition-colors duration-300 stroke-[1.5]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFormError('');
                    }}
                    placeholder="SENHA DE ACESSO"
                    className="w-full bg-transparent border-b border-white/10 hover:border-white/20 focus:border-white/40 text-[11px] pl-6 pr-1 py-1.5 rounded-none focus:outline-none focus:ring-0 tracking-widest transition-all placeholder:text-[9.5px] placeholder:tracking-widest text-white placeholder-zinc-500"
                  />
                </div>
              </div>

              {/* Alert/Form Error message display */}
              {formError && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[9.5px] text-red-400 font-mono tracking-wide text-center uppercase block mt-1 font-bold"
                >
                  ⚠ {formError}
                </motion.span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dynamic status/loading feedback */}
        <div className="text-center h-4 select-none mt-1">
          {isScanning ? (
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] animate-pulse text-white font-bold">
              {message}
            </p>
          ) : isSubmitting ? (
            <span className="flex items-center gap-1.5 justify-center font-mono text-[10px] tracking-[0.14em] text-white uppercase font-bold">
              <span className="w-2.5 h-2.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
              SISTEMA CARREGANDO PERFIL...
            </span>
          ) : null}
        </div>

        {/* Centered Biometric Area surrounded by fluid glowing concentric rings */}
        <div className="relative flex items-center justify-center w-36 h-36 mt-0.5">
          <AnimatePresence>
            {isScanning && (
              // Moving scanning vertical laser highlight
              <motion.div 
                className="absolute left-5 right-5 h-[1.5px] z-20 bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]"
                style={{ top: `${15 + (scanProgress * 0.7)}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            )}
          </AnimatePresence>

          {/* Touch Trigger area */}
          <motion.div
            id="biometric-shape-trigger"
            onMouseDown={handleStartScan}
            onMouseUp={handleCancelScan}
            onMouseLeave={handleCancelScan}
            onTouchStart={handleStartScan}
            onTouchEnd={handleCancelScan}
            className={`w-32 h-32 cursor-pointer flex flex-col items-center justify-center relative bg-transparent transition-all duration-300 ${
              isScanning ? 'scale-105' : 'hover:scale-102 active:scale-98'
            }`}
            style={{ touchAction: 'none' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Concentric high-end glass rings SVG outline - restored organic wavy shapes */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" viewBox="0 0 100 100">
              {/* Neutral concentric support rings */}
              <g className="opacity-20">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" strokeDasharray="2 4" />
                <circle cx="50" cy="50" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" />
              </g>

              {/* Seamless glass glowing organic orbit 1 */}
              <motion.path
                d="M 50,12 C 70,15 82,28 78,48 C 74,68 64,74 50,74 C 36,74 22,66 23,45 C 24,24 30,10 50,12 Z"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="0.35"
                className="opacity-45"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
                style={{ transformOrigin: '50px 50px' }}
              />

              {/* Seamless glass glowing organic orbit 2 */}
              <motion.path
                d="M 50,6 C 76,10 88,28 82,54 C 76,80 61,78 50,76 C 30,73 13,59 15,42 C 17,25 22,2 50,6 Z"
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="0.5"
                className="opacity-35 inline"
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 32, ease: 'linear' }}
                style={{ transformOrigin: '50px 50px' }}
              />

              {/* Growing active scanning indicator dial */}
              <g transform="rotate(-90 50 50)">
                <circle
                  cx="50"
                  cy="50"
                  r="34"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1.5"
                  fill="transparent"
                />
                {isScanning && (
                  <circle
                     cx="50"
                     cy="50"
                     r="34"
                     stroke="#ffffff"
                     strokeWidth="2.2"
                     fill="transparent"
                     strokeDasharray="213.63"
                     strokeDashoffset={213.63 - (213.63 * scanProgress) / 100}
                     style={{ transition: 'stroke-dashoffset 0.08s linear' }}
                  />
                )}
              </g>
            </svg>

            {/* Micro layout inside biom authenticator */}
            <div className="z-10 flex flex-col items-center justify-center gap-1.5 pointer-events-none select-none">
              <Fingerprint className={`w-10 h-10 transition-all duration-300 ${
                isScanning 
                  ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] scale-[1.03]' 
                  : 'text-white/85 drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]'
              }`} />
              <span className={`text-[10px] font-mono tracking-[0.2em] font-extrabold whitespace-nowrap transition-colors duration-300 ${
                isScanning ? 'text-white' : 'text-zinc-200'
              }`}>
                {isScanning ? `${scanProgress}%` : 'AUTENTICAR'}
              </span>
            </div>
          </motion.div>
        </div>
      </div>     </div>

      {/* Navigation bar with green indicator line showing active page & footer note */}
      <div className="w-full max-w-[315px] select-none z-20 mt-1 mb-2 flex flex-col items-center">
        
        {/* Swiper gesture drag controller */}
        <motion.div 
          className="relative w-full h-10 flex items-center justify-center cursor-ew-resize overflow-hidden"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleSwipe}
        >
          <div className="absolute w-full flex items-center justify-center gap-3 sm:gap-6 font-mono text-xs px-2">
            
            {/* Left sliding option label */}
            <div 
              onClick={handlePrev}
              className="w-20 text-right opacity-25 hover:opacity-50 transition-all duration-300 select-none whitespace-nowrap text-[9px] cursor-pointer truncate pr-1 text-neutral-300"
            >
              {getLeftLabel()}
            </div>

            {/* Central focused label */}
            <div className="flex items-center justify-center gap-1 font-black tracking-widest text-xs text-white">
              <button 
                onClick={handlePrev} 
                className="transition-colors duration-200 text-[10px] px-1 text-neutral-400 hover:text-white cursor-pointer select-none"
              >
                &lt;
              </button>
              
              <div className="w-[120px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex + PROFILES[activeIndex].label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 select-none text-white font-extrabold"
                  >
                    {activeIndex === 2 && <UserPlus className="w-3 h-3 inline-block text-neutral-200" />}
                    {PROFILES[activeIndex].label}
                  </motion.div>
                </AnimatePresence>
              </div>

              <button 
                onClick={handleNext} 
                className="transition-colors duration-200 text-[10px] px-1 text-neutral-400 hover:text-white cursor-pointer select-none"
              >
                &gt;
              </button>
            </div>

            {/* Right sliding option label */}
            <div 
              onClick={handleNext}
              className="w-20 text-left opacity-25 hover:opacity-50 transition-all duration-300 select-none whitespace-nowrap text-[9px] cursor-pointer truncate pl-1 text-neutral-300"
            >
              {getRightLabel()}
            </div>

          </div>
        </motion.div>

        {/* Illuminated minimalist white indicator bar showing active tab */}
        <div className="relative w-32 h-[1.5px] bg-white/5 mb-3 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]" 
            style={{ 
              left: `${(activeIndex * 100) / 3}%`, 
              width: '33.33%',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' 
            }} 
          />
        </div>

        {/* Swipe instructions footer */}
        <div className="text-center text-[7.5px] font-mono tracking-[0.25em] text-zinc-400 uppercase font-extrabold select-none">
          ★ ARRASTAR OU CLICAR PARA NAVEGAR
        </div>

      </div>

      {/* Glass line Floor Grid */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0 transition-opacity duration-300 opacity-[0.05]" 
        style={{
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      />

    </div>
  );
}
