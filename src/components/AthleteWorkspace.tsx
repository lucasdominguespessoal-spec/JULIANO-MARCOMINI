import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Zap, 
  Clock, 
  User, 
  LogOut, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  CheckCircle, 
  X, 
  Sliders,
  TrendingUp,
  Award,
  Circle,
  Play,
  Square,
  Pause,
  Heart,
  Flame,
  List,
  Calendar,
  Info,
  Cloud,
  Database,
  AlertTriangle,
  Check,
  Loader2,
  Copy
} from 'lucide-react';
import { supabase, saveStateToCloud, getStateFromCloud, SUPABASE_BOOTSTRAP_SQL, supabaseUrl } from '../lib/supabase';

interface AthleteWorkspaceProps {
  athleteName: string;
  onBack: () => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

type WorkoutStatus = 'CONCLUÍDO' | 'ADAPTADO' | 'PENDENTE' | 'NÃO FEITO';

interface DayPrescription {
  title: string;
  badge: string;
  subBadge: string;
  warmup: string;
  mainSet: string;
  coolDown: string;
}

interface PlanilhaZone {
  name: string;
  desc: string;
  pace: string;
}

interface PlanilhaData {
  athleteName: string;
  modalidade: string;
  semanaTreinamento: string;
  objetivo: string;
  focoMacrociclo: string;
  treinador: string;
  zones: PlanilhaZone[];
  prescriptions: Record<string, DayPrescription>;
}

const DEFAULT_ZONES: PlanilhaZone[] = [
  { name: "Z1", desc: "REGENERATIVO leve", pace: "5'54\" - 6'24\"" },
  { name: "Z2", desc: "AERÓBIO CONTÍNUO", pace: "5'30\" - 5'54\"" },
  { name: "Z3", desc: "MEIO RITMO FIRME", pace: "5'00\" - 5'30\"" },
  { name: "Z4", desc: "LIMIAR DE LACTATO", pace: "4'35\" - 5'00\"" },
  { name: "Z5", desc: "TIRO MÁXIMO VO2MAX", pace: "4'00\" - 4'30\"" }
];

const DEFAULT_PRESCRIPTIONS: Record<string, DayPrescription> = {
  SEG: {
    title: "SEG - 24MIN",
    badge: "CORRIDA PRESCRITA",
    subBadge: "ZONAS DE TREINAMENTO",
    warmup: "8min leve",
    mainSet: "6x(2min forte/ 2min leve) - 24min total",
    coolDown: "8min leve"
  },
  TER: {
    title: "TER - COMPL.",
    badge: "DESCANSO COMPLEMENTAR",
    subBadge: "REGENERATIVO PLANO",
    warmup: "-",
    mainSet: "Exercícios de fortalecimento abdominal ou descanso completo",
    coolDown: "-"
  },
  QUA: {
    title: "QUA - TIROS",
    badge: "TREINO DE RITMO",
    subBadge: "ZONAS DE TREINAMENTO",
    warmup: "10min trote bem leve",
    mainSet: "8x400m forte (1'30\"int) - Treino intervalado, fazer na percepção de esforço e manter o mesmo ritmo em todos os tiros!",
    coolDown: "10min trote leve"
  },
  QUI: {
    title: "QUI - AERÓBICO",
    badge: "ESTÍMULO TÉCNICO",
    subBadge: "ZONAS DE TREINAMENTO",
    warmup: "-",
    mainSet: "25min z2",
    coolDown: "-"
  },
  SAB: {
    title: "SAB - LONGO",
    badge: "LONGO DA SEMANA",
    subBadge: "ZONAS DE TREINAMENTO",
    warmup: "-",
    mainSet: "50min z2",
    coolDown: "-"
  }
};

type LightMode = 'SPOTLIGHT' | 'DIFFUSE' | 'STEALTH';

export default function AthleteWorkspace({ athleteName, onBack, theme, setTheme }: AthleteWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'TREINOS' | 'PERFIL'>('TREINOS');
  const [selectedDay, setSelectedDay] = useState<string>('SEG');
  const [isZonesExpanded, setIsZonesExpanded] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [selectedWeek, setSelectedWeek] = useState<string>('Semana 15');

  // Supabase Cloud Sincronização States
  const [supabaseStatus, setSupabaseStatus] = useState<'CONNECTING' | 'SYNCED' | 'LOCAL_ONLY' | 'ERROR'>('CONNECTING');
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [showSqlDialog, setShowSqlDialog] = useState<boolean>(false);
  const [isSyncLoading, setIsSyncLoading] = useState<boolean>(true);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // SANITIZED USER-SPECIFIC KEYS FOR SEGREGATED PERSISTENCE
  const athleteKeyRaw = athleteName.toUpperCase().replace(/\s+/g, '_');
  const isLegacyLucas = athleteKeyRaw === 'LUCAS' || athleteKeyRaw === 'LUCAS_DOMINGUES' || athleteKeyRaw === 'ATLETA_B_09';
  const athleteKey = isLegacyLucas ? 'LUCAS' : athleteKeyRaw;

  const planilhaKey = isLegacyLucas ? 'PLANILHA_CONFIG' : `PLANILHA_CONFIG_${athleteKey}`;
  const statesKey = isLegacyLucas ? 'LUCAS_WORKOUT_STATES' : `LUCAS_WORKOUT_STATES_${athleteKey}`;
  const feedbacksKey = isLegacyLucas ? 'LUCAS_ATHLETE_FEEDBACK_DICT' : `LUCAS_ATHLETE_FEEDBACK_DICT_${athleteKey}`;
  const logsKey = isLegacyLucas ? 'LUCAS_ACTIVITY_LOGS' : `LUCAS_ACTIVITY_LOGS_${athleteKey}`;

  // Dynamic planilha data synced directly with the Trainer Workspace config
  const [planilha, setPlanilha] = useState<PlanilhaData>(() => {
    const saved = localStorage.getItem(planilhaKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.prescriptions && parsed.zones) {
          return parsed;
        }
      } catch (e) {}
    }
    return {
      athleteName: athleteName.toUpperCase(),
      modalidade: "corrida de rua",
      semanaTreinamento: "18/05 - 24/05",
      objetivo: "TAF 12 minutos",
      focoMacrociclo: "POTÊNCIA AERÓBICA MÁXIMA & RESISTÊNCIA DE VELOCIDADE PARA 21K",
      treinador: "MARCOMINI_COACH",
      zones: DEFAULT_ZONES,
      prescriptions: DEFAULT_PRESCRIPTIONS
    };
  });

  // Initial loading from Supabase Cloud
  useEffect(() => {
    async function initSupabaseSync() {
      setIsSyncLoading(true);
      setSupabaseStatus('CONNECTING');

      try {
        // Try fetching current athlete custom config
        const resPlanilha = await getStateFromCloud<PlanilhaData>(planilhaKey, planilha);
        
        if (resPlanilha.error) {
          if (resPlanilha.error.includes('relation "athlete_sync" does not exist') || resPlanilha.error.includes('not found') || resPlanilha.error.includes('não existe')) {
            setSupabaseStatus('LOCAL_ONLY');
            setSupabaseError('Tabela athlete_sync não encontrada no Supabase.');
          } else {
            setSupabaseStatus('ERROR');
            setSupabaseError(resPlanilha.error);
          }
          setIsSyncLoading(false);
          return;
        }

        // Successfully synchronized! Load other structures
        if (resPlanilha.source === 'supabase') {
          setPlanilha(resPlanilha.data);
        }

        const resStates = await getStateFromCloud<Record<string, Record<string, WorkoutStatus>>>(statesKey, workoutStates);
        if (resStates.source === 'supabase' && resStates.data) {
          setWorkoutStates(resStates.data);
        }

        const resFeedbacks = await getStateFromCloud<any>(feedbacksKey, feedbacks);
        if (resFeedbacks.source === 'supabase' && resFeedbacks.data) {
          setFeedbacks(resFeedbacks.data);
        }

        const resLogs = await getStateFromCloud<StoredRunActivity[]>(logsKey, activityLogs);
        if (resLogs.source === 'supabase' && resLogs.data) {
          setActivityLogs(resLogs.data);
        }

        setSupabaseStatus('SYNCED');
        setSupabaseError(null);
      } catch (err: any) {
        setSupabaseStatus('ERROR');
        setSupabaseError(err.message || 'Falha de rede.');
      } finally {
        setIsSyncLoading(false);
      }
    }

    initSupabaseSync();
  }, []);

  // Poll for updates from trainer every 6 seconds to keep it live
  useEffect(() => {
    if (supabaseStatus !== 'SYNCED') return;
    const interval = setInterval(async () => {
      const resPlanilha = await getStateFromCloud<PlanilhaData>(planilhaKey, planilha);
      if (resPlanilha.source === 'supabase' && JSON.stringify(resPlanilha.data) !== JSON.stringify(planilha)) {
        setPlanilha(resPlanilha.data);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [supabaseStatus, planilha, planilhaKey]);

  // Track week from spreadsheet data if updated by coach
  useEffect(() => {
    if (planilha.semanaTreinamento) {
      setSelectedWeek(`Semana - ${planilha.semanaTreinamento}`);
    }
  }, [planilha.semanaTreinamento]);

  // Read updated values from localStorage whenever the tab becomes active or on visibility change
  useEffect(() => {
    const handleFocus = () => {
      const saved = localStorage.getItem(planilhaKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.prescriptions && parsed.zones) {
            setPlanilha(parsed);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [planilhaKey]);

  // Custom View Mode: Daily Card vs Weekly Overview Layout
  const [viewMode, setViewMode] = useState<'DIARIO' | 'SEMANAL'>('DIARIO');

  // Stored GPS Run Activity list
  interface StoredRunActivity {
    id: string;
    day: string;
    date: string;
    distance: number;
    durationSecs: number;
    pace: string;
    hrBpm: number;
    activityName: string;
  }

  const [activityLogs, setActivityLogs] = useState<StoredRunActivity[]>(() => {
    const saved = localStorage.getItem(logsKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: '1', day: 'SEG', date: '2026-05-18', distance: 4.8, durationSecs: 1440, pace: "5'00\"", hrBpm: 158, activityName: "8X(2MIN FORTE/ 2MIN LEVE)" },
      { id: '2', day: 'QUA', date: '2026-05-20', distance: 6.2, durationSecs: 2012, pace: "5'24\"", hrBpm: 164, activityName: "TIROS DE INTERVALO DE RITMO" }
    ];
  });

  useEffect(() => {
    localStorage.setItem(logsKey, JSON.stringify(activityLogs));
    if (!isSyncLoading && (supabaseStatus === 'SYNCED' || supabaseStatus === 'LOCAL_ONLY')) {
      saveStateToCloud(logsKey, activityLogs);
    }
  }, [activityLogs, isSyncLoading, supabaseStatus, logsKey]);

  // GPS Sim Tracker states
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [gpsPaused, setGpsPaused] = useState(false);
  const [gpsSecs, setGpsSecs] = useState(0);
  const [gpsDist, setGpsDist] = useState(0);
  const [gpsHr, setGpsHr] = useState(140);

  // GPS tracking simulated loop
  useEffect(() => {
    if (!isGpsActive || gpsPaused) return;
    const interval = setInterval(() => {
      setGpsSecs(prev => prev + 1);
      // Average pace around 5:15 min/km => adds 0.0031 km per second
      setGpsDist(prev => parseFloat((prev + 0.0031).toFixed(3)));
      // Fluctuating HR
      setGpsHr(prev => {
        const delta = Math.floor(Math.random() * 3) - 1;
        const newHr = prev + delta;
        return Math.max(130, Math.min(182, newHr));
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isGpsActive, gpsPaused]);

  // Simulated active stopwatch
  const [seconds, setSeconds] = useState(379); // start with 6m 19s
  
  // Custom theme background atmosphere matching Image references
  const [lightMode, setLightMode] = useState<LightMode>('SPOTLIGHT');

  // Reactive workout state manager with direct local updates
  const [workoutStates, setWorkoutStates] = useState<Record<string, Record<string, WorkoutStatus>>>(() => {
    const saved = localStorage.getItem(statesKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all 7 days have structure
        const days = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
        let hasAll = true;
        days.forEach(d => { if (!parsed[d]) hasAll = false; });
        if (hasAll) return parsed;
      } catch (e) {}
    }
    return {
      SEG: { warmup: 'CONCLUÍDO', mainSet: 'CONCLUÍDO', coolDown: 'CONCLUÍDO' },
      TER: { warmup: 'PENDENTE', mainSet: 'PENDENTE', coolDown: 'PENDENTE' },
      QUA: { warmup: 'CONCLUÍDO', mainSet: 'PENDENTE', coolDown: 'PENDENTE' },
      QUI: { warmup: 'PENDENTE', mainSet: 'PENDENTE', coolDown: 'PENDENTE' },
      SEX: { warmup: 'PENDENTE', mainSet: 'PENDENTE', coolDown: 'PENDENTE' },
      SAB: { warmup: 'PENDENTE', mainSet: 'PENDENTE', coolDown: 'PENDENTE' },
      DOM: { warmup: 'PENDENTE', mainSet: 'PENDENTE', coolDown: 'PENDENTE' }
    };
  });

  // Persist workout completion check states
  useEffect(() => {
    localStorage.setItem(statesKey, JSON.stringify(workoutStates));
    if (!isSyncLoading && (supabaseStatus === 'SYNCED' || supabaseStatus === 'LOCAL_ONLY')) {
      saveStateToCloud(statesKey, workoutStates);
    }
  }, [workoutStates, isSyncLoading, supabaseStatus, statesKey]);

  // Subjective student training feedbacks per day
  const [feedbacks, setFeedbacks] = useState<Record<string, { comment: string; effort: number; feeling: string; pain?: number; sleep?: number; energy?: number }>>(() => {
    const saved = localStorage.getItem(feedbacksKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      SEG: { comment: "Treino em Z2 bem suave. Ritmo excelente e respiração confortável.", effort: 4, feeling: "EXCELENTE", pain: 1, sleep: 8, energy: 9 },
      TER: { comment: "Fortalecimento focado em panturrilha e core. Tudo certo.", effort: 5, feeling: "BOM", pain: 2, sleep: 7, energy: 8 },
      QUA: { comment: "Tiros foram bem desgastantes, mas consegui fechar todos na média de 4'15\".", effort: 8, feeling: "CANSADO", pain: 4, sleep: 6, energy: 7 },
      QUI: { comment: "", effort: 5, feeling: "BOM", pain: 0, sleep: 8, energy: 8 },
      SEX: { comment: "", effort: 5, feeling: "BOM", pain: 0, sleep: 8, energy: 8 },
      SAB: { comment: "", effort: 5, feeling: "BOM", pain: 0, sleep: 8, energy: 8 },
      DOM: { comment: "", effort: 5, feeling: "BOM", pain: 0, sleep: 8, energy: 8 }
    };
  });

  const [currentFeedbackComment, setCurrentFeedbackComment] = useState('');
  const [currentEffort, setCurrentEffort] = useState(5);
  const [currentFeeling, setCurrentFeeling] = useState('BOM');
  const [currentPain, setCurrentPain] = useState<number>(0);
  const [currentSleep, setCurrentSleep] = useState<number>(8);
  const [currentEnergy, setCurrentEnergy] = useState<number>(8);
  const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);

  // Load current day's feedback values when selectedDay changes
  useEffect(() => {
    const dayFeedback = feedbacks[selectedDay] || { comment: '', effort: 5, feeling: 'BOM', pain: 0, sleep: 8, energy: 8 };
    setCurrentFeedbackComment(dayFeedback.comment || '');
    setCurrentEffort(dayFeedback.effort || 5);
    setCurrentFeeling(dayFeedback.feeling || 'BOM');
    setCurrentPain(dayFeedback.pain !== undefined ? dayFeedback.pain : 0);
    setCurrentSleep(dayFeedback.sleep !== undefined ? dayFeedback.sleep : 8);
    setCurrentEnergy(dayFeedback.energy !== undefined ? dayFeedback.energy : 8);
  }, [selectedDay, feedbacks]);

  const handleSaveFeedback = () => {
    setFeedbacks(prev => {
      const updated = {
        ...prev,
        [selectedDay]: {
          comment: currentFeedbackComment,
          effort: currentEffort,
          feeling: currentFeeling,
          pain: currentPain,
          sleep: currentSleep,
          energy: currentEnergy
        }
      };
      localStorage.setItem(feedbacksKey, JSON.stringify(updated));
      
      if (!isSyncLoading && (supabaseStatus === 'SYNCED' || supabaseStatus === 'LOCAL_ONLY')) {
        saveStateToCloud(feedbacksKey, updated);
      }
      
      // Force trigger window level update so trainer session picks it up
      window.dispatchEvent(new Event('focus'));
      
      return updated;
    });
    setShowFeedbackSuccess(true);
    setTimeout(() => {
      setShowFeedbackSuccess(false);
    }, 2500);
  };

  // Clock progression simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatStopwatch = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetStatus = (day: string, type: 'warmup' | 'mainSet' | 'coolDown', status: WorkoutStatus) => {
    setWorkoutStates(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: status
      }
    }));
  };

  // Metrics mathematics
  const totalSegments = 15;
  const getStatusWeight = (status: WorkoutStatus) => {
    if (status === 'CONCLUÍDO') return 1;
    if (status === 'ADAPTADO') return 0.5;
    return 0;
  };

  const calculatedScore = Object.keys(workoutStates).reduce((acc, day) => {
    const dayData = workoutStates[day];
    return acc + getStatusWeight(dayData.warmup) + getStatusWeight(dayData.mainSet) + getStatusWeight(dayData.coolDown);
  }, 0);

  const consistencyPercentage = Math.min(100, Math.round((calculatedScore / totalSegments) * 100));

  const getDayCompletionStatus = (day: string): 'FEITO' | 'PENDENTE' => {
    const dayData = workoutStates[day];
    const completedOrAdaptedCount = [dayData.warmup, dayData.mainSet, dayData.coolDown].filter(
      s => s === 'CONCLUÍDO' || s === 'ADAPTADO'
    ).length;
    return completedOrAdaptedCount >= 2 ? 'FEITO' : 'PENDENTE';
  };

  const completedDaysCount = Object.keys(workoutStates).filter(day => getDayCompletionStatus(day) === 'FEITO').length;

  const formattedAthleteName = athleteName === 'ATLETA_B_09' ? 'ANA SILVA' : athleteName.toUpperCase();

  return (
    <div 
      className={`relative w-full flex-grow flex flex-col justify-start items-center pt-4 pb-8 px-4 select-none min-h-screen overflow-y-auto transition-colors duration-300 ${
        theme === 'light' ? 'bg-[#f5f5f7] text-[#1c1c1e]' : 'bg-[#000000] text-white'
      }`}
      id="athlete-workspace-monochrome-root"
    >
      
      {/* 1. ATMOSPHERE LIGHTING LAYERS (Based strictly on user uploaded references with emerald touch) */}
      
      {/* Spotlight mode - Vertical high-end light beam (Image 1 reference) */}
      {lightMode === 'SPOTLIGHT' && (
        <>
          <div 
            id="spotlight-layer-glow"
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-80 h-[380px] blur-3xl rounded-t-full pointer-events-none z-0 transition-colors ${
              theme === 'light' ? 'bg-gradient-to-b from-emerald-500/[0.06] via-black/[0.005] to-transparent' : 'bg-gradient-to-b from-emerald-500/[0.045] via-white/[0.012] to-transparent'
            }`}
          />
          <div 
            id="spotlight-cone-geometry"
            className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-0 origin-top opacity-50"
            style={{
              width: '140px',
              height: '350px',
              background: theme === 'light' 
                ? 'conic-gradient(from 165deg at 50% 0%, rgba(16,185,129,0.06) 0deg, rgba(0,0,0,0.002) 15deg, transparent 30deg, transparent 330deg, rgba(0,0,0,0.002) 345deg, rgba(16,185,129,0.06) 360deg)'
                : 'conic-gradient(from 165deg at 50% 0%, rgba(16,185,129,0.08) 0deg, rgba(255,255,255,0.005) 15deg, transparent 30deg, transparent 330deg, rgba(255,255,255,0.005) 345deg, rgba(16,185,129,0.08) 360deg)',
              maskImage: 'linear-gradient(to bottom, black 10%, transparent 95%) rotate(180deg)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 10%, transparent 95%)',
              filter: 'blur(3px)',
            }}
          />
          <div 
            id="spotlight-top-device-source"
            className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-[2px] bg-emerald-400 rounded-full blur-[1px] pointer-events-none z-10 shadow-[0_0_8px_rgba(16,185,129,0.7)]" 
          />
        </>
      )}

      {/* Diffuse mode - Organic deep ambient glow behind panels */}
      {lightMode === 'DIFFUSE' && (
        <div 
          id="diffuse-layer-ambient"
          className="absolute top-[20%] left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-500/[0.025] rounded-full blur-[80px] pointer-events-none z-0" 
        />
      )}

      {/* Stealth mode - Solid dark high-performance look with zero distractions */}
      {lightMode === 'STEALTH' && (
        <div 
          id="stealth-ambient-crosshair"
          className={`absolute top-6 right-6 font-mono text-[7px] tracking-[0.2em] pointer-events-none select-none uppercase ${
            theme === 'light' ? 'text-neutral-400' : 'text-neutral-800'
          }`}
          style={{ contentVisibility: 'auto' }}
        >
          ● MODO STEALTH ATIVO // FOCO ABSOLUTO
        </div>
      )}

      {/* Micro diagonal slate textures on grid borders */}
      <div 
        id="background-microgrid-overlay"
        className={`absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none z-0 ${
          theme === 'light' 
            ? 'opacity-20 [background-image:linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)]' 
            : 'opacity-100'
        }`}
        style={{ backgroundPosition: 'center' }}
      />

      {/* 2. HEADER CONTAINER BAR */}
      <div 
        className={`w-full max-w-sm flex justify-between items-center z-10 py-2.5 relative rounded-2xl px-3 transition-all duration-300 ${
          theme === 'light' 
            ? 'liquid-glass-light' 
            : 'liquid-glass'
        }`}
        id="workspace-header-bar"
      >
        
        {/* Toggle Lighting Button styled like a premium metallic button */}
        <div 
          onClick={() => {
            const cycle: Record<LightMode, LightMode> = {
              SPOTLIGHT: 'DIFFUSE',
              DIFFUSE: 'STEALTH',
              STEALTH: 'SPOTLIGHT'
            };
            setLightMode(cycle[lightMode]);
          }}
          className="flex items-center gap-2 cursor-pointer group select-none transition-colors"
          id="lighting-mode-toggle"
          title="Toque para alternar o modo de iluminação (Foco / Difuso / Stealth)"
        >
          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-300 group-hover:border-emerald-500 shadow-inner group-active:scale-95 ${
            theme === 'light' ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-950 border-neutral-800'
          }`}>
            <Zap className={`w-3.5 h-3.5 transition-all duration-300 ${lightMode === 'SPOTLIGHT' ? 'text-emerald-500 fill-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-neutral-500'}`} />
          </div>
          <div className="flex flex-col">
            <span className={`text-[7px] font-mono tracking-[0.2em] uppercase leading-none ${
              theme === 'light' ? 'text-neutral-450' : 'text-neutral-500'
            }`}>LUZ</span>
            <span className={`text-[8px] font-mono tracking-widest font-bold uppercase mt-0.5 ${
              theme === 'light' ? 'text-neutral-850' : 'text-neutral-300'
            }`}>{lightMode}</span>
          </div>
        </div>

        {/* Stopwatch Active Display (Centered monochrome tech badge with emerald elements) */}
        <div 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-[10px] tracking-widest text-[#10b981] shadow-inner transition-colors ${
            theme === 'light' ? 'bg-neutral-100/80 border-neutral-250' : 'bg-neutral-950/70 border-neutral-900'
          }`}
          id="stopwatch-badge"
        >
          <Clock className="w-3.5 h-3.5 text-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
          <span className={`font-extrabold ${theme === 'light' ? 'text-neutral-850' : 'text-white'}`}>{formatStopwatch(seconds)}</span>
        </div>

        {/* Action icons row */}
        <div className="flex items-center gap-1" id="action-buttons-group">
          <button 
            onClick={() => setIsStatsOpen(!isStatsOpen)}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center hover:border-emerald-500 transition cursor-pointer ${
              theme === 'light' ? 'bg-white border-neutral-200 text-neutral-600' : 'bg-neutral-950 border-neutral-900 text-neutral-400'
            }`}
            id="statistics-toggle-btn"
            title="Sua Consistência Semanal"
          >
            <TrendingUp className="w-3.5 h-3.5 hover:text-emerald-500 transition" />
          </button>
          
          <button 
            onClick={() => setActiveTab(activeTab === 'TREINOS' ? 'PERFIL' : 'TREINOS')}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition cursor-pointer ${
              activeTab === 'PERFIL' 
                ? (theme === 'light' ? 'bg-neutral-100 border-emerald-500 text-emerald-650 font-bold' : 'bg-neutral-900 border-emerald-500 text-emerald-400') 
                : (theme === 'light' ? 'bg-white border-neutral-205 text-neutral-600 hover:border-emerald-500/50' : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:border-emerald-500/50')
            }`}
            id="tab-toggle-btn"
            title="Configurações de Conta / Perfil"
          >
            <User className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={onBack}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition cursor-pointer ${
              theme === 'light' ? 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900' : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:border-red-900/60 hover:text-neutral-200'
            }`}
            id="logout-btn"
            title="Encerrar Sessão"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* CLOUD SYNC BAR */}
      <div className="w-full max-w-sm mt-3 z-10 px-1" id="supabase-cloud-sync-bar">
        <div className={`p-2 rounded-xl border flex items-center justify-between text-[9px] font-mono transition-all ${
          supabaseStatus === 'SYNCED' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
            : supabaseStatus === 'CONNECTING'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
            : supabaseStatus === 'LOCAL_ONLY'
            ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-sm'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center gap-1.5">
            <Cloud className={`w-3.5 h-3.5 ${supabaseStatus === 'CONNECTING' ? 'animate-pulse' : ''}`} />
            <div>
              <span className="font-bold uppercase tracking-wider">SUPABASE CLOUD: </span>
              <span className="font-medium">
                {supabaseStatus === 'SYNCED' && 'Sincronizado'}
                {supabaseStatus === 'CONNECTING' && 'Conectando à Nuvem...'}
                {supabaseStatus === 'LOCAL_ONLY' && 'Banco Local (Sincronização pendente)'}
                {supabaseStatus === 'ERROR' && `Erro de Configuração`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {supabaseStatus === 'LOCAL_ONLY' && (
              <button 
                onClick={() => setShowSqlDialog(true)}
                className="px-2 py-0.5 rounded bg-[#0284c7] text-[#fff] hover:bg-sky-600 hover:text-white text-[8px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95 z-20"
                id="btn-active-supabase-cloud"
              >
                Configurar SQL
              </button>
            )}
            {supabaseStatus === 'ERROR' && (
              <span className="text-[8px] opacity-75 underline cursor-pointer" title={supabaseError || undefined}>Ver Erro</span>
            )}
            {supabaseStatus === 'SYNCED' && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. PRIMARY VIEW SWITCH TABS (TREINOS // PERFIL) */}
      <div className="w-full max-w-sm mt-5 z-10">
        <div 
          className={`grid grid-cols-2 gap-1.5 p-1 border rounded-xl transition-colors ${
            theme === 'light' ? 'bg-neutral-100 border-neutral-200' : 'bg-neutral-950/80 border-neutral-900'
          }`}
          id="view-tabs-container"
        >
          <button
            onClick={() => setActiveTab('TREINOS')}
            className={`flex items-center justify-center gap-1.5 font-mono text-[9px] tracking-[0.25em] uppercase py-2.5 rounded-lg transition-all duration-300 cursor-pointer ${
              activeTab === 'TREINOS'
                ? (theme === 'light' ? 'bg-white text-neutral-950 font-black shadow-sm' : 'bg-white text-black font-extrabold')
                : 'text-neutral-500 hover:text-neutral-200'
            }`}
            id="btn-tab-treinos"
          >
            <Activity className="w-3.5 h-3.5" />
            PLANILHA
          </button>
          <button
            onClick={() => setActiveTab('PERFIL')}
            className={`flex items-center justify-center gap-1.5 font-mono text-[9px] tracking-[0.25em] uppercase py-2.5 rounded-lg transition-all duration-300 cursor-pointer ${
              activeTab === 'PERFIL'
                ? (theme === 'light' ? 'bg-white text-neutral-950 font-black shadow-sm' : 'bg-white text-black font-extrabold')
                : 'text-neutral-500 hover:text-neutral-200'
            }`}
            id="btn-tab-perfil"
          >
            <User className="w-3.5 h-3.5" />
            MEU PERFIL
          </button>
        </div>

        {/* Illuminated track bar mirroring Onboarding layout directly */}
        <div className="relative w-full h-[1px] bg-neutral-900/50 mt-2">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-24 h-full bg-emerald-500 shadow-[0_0_12px_#10b981,0_0_3px_#34d399]" />
        </div>
      </div>

      {/* Main Column Grid */}
      <div 
        className="w-full max-w-sm flex-1 flex flex-col mt-4 gap-4 z-10 pb-4"
        id="main-scrolling-content-container"
      >
        <AnimatePresence mode="wait">
          {activeTab === 'TREINOS' ? (
            <motion.div
              key="trainings-content"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-grow flex flex-col gap-4"
              id="trainings-tab-active-view"
            >
              
              {/* 4. METRIC PROTOCOLO DE TREINO CARD */}
              <div 
                className={`w-full p-5 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 rounded-2xl liquid-sheen ${
                  theme === 'light' ? 'liquid-glass-light text-neutral-900 shadow-lg' : 'liquid-glass text-white shadow-2xl'
                }`}
                id="prescription-info-card"
              >
                {/* Thin horizontal strip accent at the bottom representing the landing page indicator line */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-neutral-900/50">
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 w-32 h-full bg-emerald-500" />
                </div>

                {/* Upper line: Category Tag + Dropdown */}
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-mono font-bold tracking-[0.25em] text-emerald-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
                    STATUS PLANILHA
                  </span>

                  {/* Elegant week dropdown */}
                  <div className="relative">
                    <select 
                      value={selectedWeek} 
                      onChange={(e) => setSelectedWeek(e.target.value)}
                      className={`border text-[8px] font-mono py-1 pl-2 pr-6 rounded-md focus:outline-none appearance-none cursor-pointer tracking-widest uppercase transition-colors ${
                        theme === 'light' 
                          ? 'bg-neutral-50 border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-black' 
                          : 'bg-black border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white'
                      }`}
                      id="week-selector-dropdown"
                    >
                      <option value="Semana 3 - Pico de Foco Lácteo">Sem. 3 - Lactato</option>
                      <option value="Semana 2 - Potência Aeróbica">Sem. 2 - Potência</option>
                      <option value="Semana 1 - Base de Resistência">Sem. 1 - Resistência</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-neutral-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Athlete Name styled with pure typography design matching original layout */}
                <div className="space-y-0.5">
                  <span className="text-[7px] font-mono text-neutral-500 tracking-[0.3em] uppercase block">ATLETA PRESCRITO</span>
                  <h2 className={`text-2xl font-black italic tracking-widest uppercase select-all ${
                    theme === 'light' ? 'text-neutral-950' : 'text-white'
                  }`} id="display-athlete-name">
                    {formattedAthleteName}
                  </h2>
                </div>

                {/* High Contrast Objective Line */}
                <div className={`flex flex-col gap-1.5 border-t pt-3.5 ${
                  theme === 'light' ? 'border-neutral-200' : 'border-neutral-900/60'
                }`}>
                  <span className="text-[7px] font-mono tracking-[0.3em] text-neutral-500 uppercase block">FOCO ATUAL DO MACROCICLO</span>
                  <p className={`font-extrabold text-[11px] leading-relaxed tracking-wider uppercase font-mono ${
                    theme === 'light' ? 'text-neutral-850' : 'text-white'
                  }`}>
                    {planilha.focoMacrociclo}
                  </p>
                </div>

                {/* Prescription Details */}
                <div className={`flex justify-between items-center text-[8px] font-mono border-t pt-3 mt-1 ${
                  theme === 'light' ? 'text-neutral-500 border-neutral-200' : 'text-neutral-500 border-neutral-900/40'
                }`}>
                  <div>
                    <span className="text-neutral-500 block text-[6px] tracking-widest uppercase">VALIDADE PRESCRITA:</span>
                    <span className={`font-bold ${theme === 'light' ? 'text-neutral-800' : 'text-neutral-300'}`}>{planilha.semanaTreinamento}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-neutral-500 block text-[6px] tracking-widest uppercase">TREINADOR RESPONSÁVEL:</span>
                    <span className={`font-black tracking-wider ${theme === 'light' ? 'text-neutral-950' : 'text-white'}`}>{planilha.treinador}</span>
                  </div>
                </div>

                {/* 5. COLLAPSIBLE ZONES CARD (Monochromatic list with emerald high-performance highlighting) */}
                <div className={`border-t pt-3 mt-1 ${
                  theme === 'light' ? 'border-neutral-200' : 'border-neutral-900/70'
                }`} id="pace-zones-collapsible">
                  <button
                    onClick={() => setIsZonesExpanded(!isZonesExpanded)}
                    className={`w-full flex items-center justify-between text-left py-1.5 px-3 border rounded-xl hover:border-emerald-500/40 transition-colors cursor-pointer ${
                      theme === 'light' ? 'bg-neutral-50 border-neutral-250 text-neutral-800' : 'bg-neutral-950 border-neutral-900 text-neutral-300'
                    }`}
                    id="btn-collapse-zones"
                  >
                    <span className="text-[8px] font-semibold font-mono tracking-[0.2em] flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-neutral-500" />
                      ZONAS CARDÍACAS / PACES
                    </span>
                    {isZonesExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isZonesExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 gap-1 pt-2 text-[9px] font-mono leading-none">
                          {planilha.zones.map((z) => {
                            const isZ2 = z.name === 'Z2';
                            return (
                              <div
                                key={z.name}
                                className={`flex justify-between items-center p-2 rounded-lg ${
                                  isZ2
                                    ? (theme === 'light' ? 'bg-emerald-50 border border-emerald-200' : 'bg-emerald-950/20 border border-emerald-900')
                                    : (theme === 'light' ? 'bg-neutral-50 border border-neutral-200/60' : 'bg-neutral-950/40 border border-neutral-900')
                                }`}
                              >
                                <span className={isZ2 ? "text-emerald-500 font-bold animate-pulse flex items-center gap-1" : "text-neutral-500 font-medium"}>
                                  {isZ2 && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                                  {z.name} ➔ {z.desc}
                                </span>
                                <span className={isZ2 ? "text-emerald-500 font-black" : (theme === 'light' ? 'text-neutral-800 font-bold' : 'text-neutral-250 font-bold')}>
                                  {z.pace}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* MODAL VIEW TOGGLE BUTTONS */}
              <div className="flex items-center justify-between mt-1 px-1 mb-2">
                <span className="text-[7.5px] font-mono font-bold tracking-[0.22em] text-neutral-550 uppercase">
                  Layout de Planilha
                </span>
                <div className={`flex p-0.5 border rounded-lg ${
                  theme === 'light' ? 'bg-neutral-100 border-neutral-200 shadow-inner' : 'bg-neutral-950 border-neutral-900'
                }`}>
                  <button
                    onClick={() => setViewMode('DIARIO')}
                    className={`px-3 py-1 font-mono text-[8px] tracking-widest uppercase rounded-md transition-all cursor-pointer ${
                      viewMode === 'DIARIO'
                        ? (theme === 'light' ? 'bg-white text-neutral-950 font-black shadow-sm border border-neutral-200' : 'bg-[#1c1c1e] text-emerald-400 font-extrabold')
                        : 'text-neutral-500 hover:text-neutral-350'
                    }`}
                  >
                    Card Diário
                  </button>
                  <button
                    onClick={() => setViewMode('SEMANAL')}
                    className={`px-3 py-1 font-mono text-[8px] tracking-widest uppercase rounded-md transition-all cursor-pointer ${
                      viewMode === 'SEMANAL'
                        ? (theme === 'light' ? 'bg-white text-neutral-950 font-black shadow-sm border border-neutral-200' : 'bg-[#1c1c1e] text-emerald-400 font-extrabold')
                        : 'text-neutral-500 hover:text-neutral-350'
                    }`}
                  >
                    Semana Completa
                  </button>
                </div>
              </div>

              {viewMode === 'DIARIO' ? (
                <div className="flex flex-col gap-4">
                  {/* 6. WEEKDAY DYNAMIC SEVEN DAY GRID MENU */}
                  <div 
                    className={`grid grid-cols-7 gap-1 p-1 transition-all duration-300 rounded-2xl ${
                      theme === 'light' ? 'liquid-glass-light border border-neutral-200 shadow-sm' : 'liquid-glass shadow-lg'
                    }`}
                    id="weekday-grid-menu"
                  >
                    {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].map((day) => {
                      const isActive = selectedDay === day;
                      const isDone = getDayCompletionStatus(day) === 'FEITO';
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDay(day)}
                          className={`relative font-mono font-bold text-[8.5px] tracking-wider py-2 transition-all duration-300 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                            isActive 
                              ? (theme === 'light' ? 'bg-neutral-950 text-white font-black shadow-md' : 'bg-white text-black font-black shadow-md scale-105') 
                              : (theme === 'light' ? 'text-neutral-500 hover:text-neutral-950 hover:bg-neutral-200/50' : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]')
                          }`}
                          id={`day-select-${day}`}
                        >
                          <span className="uppercase">{day}</span>
                          
                          {isDone ? (
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? (theme === 'light' ? 'bg-emerald-300' : 'bg-emerald-600') : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'} block`} />
                          ) : (
                            <span className={`w-1 h-1 rounded-full ${isActive ? (theme === 'light' ? 'bg-neutral-300' : 'bg-neutral-800') : 'bg-neutral-705 block'} block`} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* 6b. REAL-TIME SENSOR GPS CORRIDA SIMULATOR */}
                  <div 
                    className={`w-full p-4 border rounded-2xl relative overflow-hidden transition-all duration-300 ${
                      isGpsActive 
                        ? 'border-emerald-500 bg-emerald-950/[0.04] shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                        : (theme === 'light' ? 'bg-white border-neutral-200 shadow-xs' : 'bg-neutral-950/70 border-neutral-900')
                    }`}
                    id="gps-recording-hub"
                  >
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[8px] font-mono font-bold tracking-[0.25em] text-emerald-500 flex items-center gap-1.5 uppercase">
                        <span className={`w-2 h-2 rounded-full bg-emerald-500 ${isGpsActive && !gpsPaused ? 'animate-ping' : 'animate-pulse'}`} />
                        REGISTRO DE CORRIDA POR SENSOR (GPS ATIVO)
                      </span>
                      {isGpsActive && (
                        <span className="px-2 py-0.5 rounded text-[7px] font-bold tracking-wider bg-emerald-500 text-black font-mono animate-pulse">
                          ● TRANSMITINDO AO VIVO
                        </span>
                      )}
                    </div>

                    {!isGpsActive ? (
                      <div className="text-center py-2 flex flex-col items-center gap-2">
                        <p className="text-[10px] text-neutral-400 font-mono tracking-wide leading-relaxed uppercase">
                          Vai iniciar o treino de corrida hoje? Utilize o nosso simulador GPS sensorial integrado para sincronizar o cronômetro com sua planilha.
                        </p>
                        <button
                          onClick={() => {
                            setIsGpsActive(true);
                            setGpsPaused(false);
                            setGpsSecs(0);
                            setGpsDist(0);
                          }}
                          className="px-5 py-2 bg-emerald-500 text-black border border-emerald-400 font-mono font-black text-[9px] tracking-[0.2em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)] flex items-center gap-1.5 uppercase cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          CONECTAR SENSOR DE TREINO (GPS)
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3.5">
                        {/* Live Telemetry Display */}
                        <div className="grid grid-cols-3 gap-1.5 text-center" id="gps-telemetry-grid">
                          <div className={`p-2 rounded-lg border flex flex-col items-center justify-center ${
                            theme === 'light' ? 'bg-neutral-50 border-neutral-200' : 'bg-black border-neutral-905'
                          }`}>
                            <span className="text-[6.5px] text-neutral-500 font-bold tracking-wider uppercase block">DISTÂNCIA</span>
                            <span className="text-base font-black text-emerald-500 font-mono tracking-tight mt-0.5">
                              {gpsDist.toFixed(2)} km
                            </span>
                          </div>
                          <div className={`p-2 rounded-lg border flex flex-col items-center justify-center ${
                            theme === 'light' ? 'bg-neutral-50 border-neutral-200' : 'bg-black border-neutral-905'
                          }`}>
                            <span className="text-[6.5px] text-neutral-500 font-bold tracking-wider uppercase block">DURAÇÃO</span>
                            <span className={`text-base font-black font-mono tracking-tight mt-0.5 ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                              {Math.floor(gpsSecs / 60)}:{(gpsSecs % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <div className={`p-2 rounded-lg border flex flex-col items-center justify-center ${
                            theme === 'light' ? 'bg-neutral-50 border-neutral-200' : 'bg-black border-neutral-905'
                          }`}>
                            <span className="text-[6.5px] text-neutral-500 font-bold tracking-wider uppercase block">F. CARDÍACA</span>
                            <span className="text-base font-black text-emerald-500 font-mono tracking-tight flex items-center gap-1 justify-center mt-0.5 animate-pulse">
                              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                              {gpsHr} <span className="text-[7.5px] text-neutral-500 font-normal">bpm</span>
                            </span>
                          </div>
                        </div>

                        {/* Calculated stats */}
                        <div className="flex justify-between items-center text-[8px] font-mono px-0.5">
                          <div className="flex items-center gap-1 text-neutral-400">
                            <Flame className="w-3 h-3 text-amber-500" />
                            <span>PACE INSTANTÂNEO:</span>
                            <span className={`${theme === 'light' ? 'text-[#1c1c1e]' : 'text-white'} font-black`}>
                              {gpsDist > 0 ? ( () => {
                                const decimalMins = (gpsSecs / 60) / gpsDist;
                                const minsPart = Math.floor(decimalMins);
                                const secsPart = Math.round((decimalMins - minsPart) * 60);
                                return `${minsPart}'${secsPart.toString().padStart(2, '0')}"`;
                              } )() : "5'15\""} / km
                            </span>
                          </div>
                          <span className="text-neutral-500 font-bold">CALORIAS: {Math.round(gpsDist * 62)} kcal</span>
                        </div>

                        {/* Controls row */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <button
                            onClick={() => setGpsPaused(!gpsPaused)}
                            className={`flex-1 py-1.5 font-mono text-[8px] font-bold tracking-widest border rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              gpsPaused 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' 
                                : (theme === 'light' ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-250' : 'bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border-neutral-800')
                            }`}
                          >
                            {gpsPaused ? (
                              <>
                                <Play className="w-3 h-3" />
                                CONTINUAR CORRIDA
                              </>
                            ) : (
                              <>
                                <Pause className="w-3 h-3" />
                                PAUSAR CORRIDA
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              // Save GPS session run
                              const decimalMins = gpsDist > 0 ? (gpsSecs / 60) / gpsDist : 5.25;
                              const minsPart = Math.floor(decimalMins);
                              const secsPart = Math.round((decimalMins - minsPart) * 60);
                              const finalPace = `${minsPart}'${secsPart.toString().padStart(2, '0')}"`;

                              const newActivity: StoredRunActivity = {
                                id: Date.now().toString(),
                                day: selectedDay,
                                date: new Date().toISOString().split('T')[0],
                                distance: parseFloat(gpsDist.toFixed(2)) || 3.10,
                                durationSecs: gpsSecs || 1000,
                                pace: finalPace,
                                hrBpm: gpsHr,
                                activityName: `ATIVIDADE GPS SENSOR - ${selectedDay}`
                              };

                              setActivityLogs(prev => [newActivity, ...prev]);

                              // Autocomplete Day prescription segments
                              setWorkoutStates(prev => ({
                                ...prev,
                                [selectedDay]: {
                                  warmup: 'CONCLUÍDO',
                                  mainSet: 'CONCLUÍDO',
                                  coolDown: 'CONCLUÍDO'
                                }
                              }));

                              // Autofill Feedback comment structure
                              const autoReport = `SESSÃO GPS AUTOMÁTICA CONCLUÍDA: Percorridos ${gpsDist.toFixed(2)} km em ${Math.floor(gpsSecs / 60)} min com pace médio de ${finalPace}/km e F.C. de ${gpsHr} bpm. Mantenho a meta de evolução da consistência.`;
                              setCurrentFeedbackComment(prev => prev ? `${autoReport}\n\n${prev}` : autoReport);
                              setCurrentEffort(6);
                              setCurrentFeeling('EXCELENTE');

                              setIsGpsActive(false);
                              setGpsPaused(false);
                              setGpsSecs(0);
                              setGpsDist(0);
                              
                              // Trigger alert
                              setShowFeedbackSuccess(true);
                              setTimeout(() => setShowFeedbackSuccess(false), 2500);
                            }}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-900/30 text-red-500 font-mono font-bold text-[8px] tracking-widest rounded-xl transition-all flex items-center justify-center gap-1 uppercase cursor-pointer"
                          >
                            <Square className="w-3 h-3 animate-pulse" />
                            CONCLUIR E REGISTRAR
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Day Prescription Info Bar */}
                  <div 
                    className={`w-full p-4 flex items-center justify-between relative overflow-hidden transition-all duration-300 rounded-2xl ${
                      theme === 'light' ? 'liquid-glass-light text-neutral-900 shadow-md' : 'liquid-glass text-white shadow-lg'
                    }`}
                    id="current-day-label-bar"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-lg border flex flex-col items-center justify-center font-mono ${
                        theme === 'light' ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900 border-neutral-800'
                      }`}>
                        <span className={`text-[10px] font-black tracking-widest leading-none ${
                          theme === 'light' ? 'text-neutral-950' : 'text-white'
                        }`}>{selectedDay}</span>
                        <span className="text-[7px] text-neutral-500 font-bold block mt-1">
                          {planilha.prescriptions[selectedDay]?.title ? (planilha.prescriptions[selectedDay].title.split(' - ')[1] || 'TREINO') : 'TREINO'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[7px] font-mono tracking-[0.25em] text-emerald-500 uppercase block">
                          {planilha.prescriptions[selectedDay]?.badge || 'PRESCRIÇÃO'}
                        </span>
                        <h3 className={`text-[10px] font-bold tracking-widest uppercase font-mono mt-1 ${
                          theme === 'light' ? 'text-neutral-800' : 'text-white'
                        }`}>
                          {selectedDay === 'SEG' ? 'SEGUNDA' : selectedDay === 'TER' ? 'TERÇA' : selectedDay === 'QUA' ? 'QUARTA' : selectedDay === 'QUI' ? 'QUINTA' : selectedDay === 'SEX' ? 'SEXTA' : selectedDay === 'SAB' ? 'SÁBADO' : 'DOMINGO'}-FEIRA
                        </h3>
                      </div>
                    </div>

                    <span className={`px-2 py-1 text-[7.5px] font-black font-mono border tracking-widest uppercase rounded ${
                      theme === 'light' ? 'border-neutral-255 text-neutral-800 bg-neutral-100/60' : 'border-neutral-800 text-white bg-neutral-900'
                    }`}>
                      {planilha.prescriptions[selectedDay]?.subBadge || 'ATIVIDADES'}
                    </span>
                  </div>

                  {/* 7. THREE WORKOUT PORTIONS WITH DETAILED ACTION BUTTONS (Warm Up / Main Set / Cool Down) */}
                  <div className="flex flex-col gap-3.5" id="workout-portions-checklist flex-col">
                    
                    {/* 7a. WARM UP PORTION CARD */}
                    <div 
                      className={`p-4 flex flex-col gap-3 transition-all duration-300 relative rounded-2xl hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(16,185,129,0.12)] hover:border-emerald-500/60 ${
                        theme === 'light' ? 'liquid-glass-light border-neutral-200 shadow-sm' : 'liquid-glass'
                      }`}
                      id="portion-warmup-card"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className={`font-mono text-[9px] font-bold tracking-[0.2em] uppercase flex items-center gap-2 ${
                          theme === 'light' ? 'text-neutral-500' : 'text-neutral-400'
                        }`}>
                          <span className="w-1.5 h-3 bg-emerald-500 block rounded-full shadow-[0_0_6px_#10b981]" />
                          AQUECIMENTO (WARM UP)
                        </h4>
                        
                        {/* Status Badge Custom Sporty Emerald Styling */}
                        <span className={`px-2 py-0.5 font-mono text-[7px] font-bold tracking-widest border transition-all uppercase rounded ${
                          workoutStates[selectedDay]?.warmup === 'CONCLUÍDO' 
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                            : workoutStates[selectedDay]?.warmup === 'ADAPTADO'
                            ? 'bg-yellow-950/20 text-yellow-500 border-yellow-650/60'
                            : workoutStates[selectedDay]?.warmup === 'NÃO FEITO'
                            ? (theme === 'light' ? 'bg-neutral-100 text-neutral-450 border-neutral-200 line-through' : 'bg-neutral-900/40 text-neutral-605 border-neutral-950 line-through')
                            : (theme === 'light' ? 'bg-neutral-50 text-neutral-450 border-neutral-200' : 'bg-neutral-900/50 text-neutral-500 border-neutral-850')
                        }`}>
                          {workoutStates[selectedDay]?.warmup || 'PENDENTE'}
                        </span>
                      </div>

                      <p className={`text-[10px] font-mono leading-relaxed font-light lowercase ${
                        theme === 'light' ? 'text-neutral-650 font-normal' : 'text-neutral-400'
                      }`}>
                        {planilha.prescriptions[selectedDay]?.warmup || 'Nenhuma atividade programada'}
                      </p>

                      {/* High Contrast Interactive marking actions */}
                      <div className={`flex items-center gap-1 mt-1.5 border-t pt-2.5 ${
                        theme === 'light' ? 'border-neutral-150' : 'border-neutral-900/50'
                      }`}>
                        <span className={`font-mono text-[7px] tracking-wider mr-2 uppercase block ${
                          theme === 'light' ? 'text-neutral-400' : 'text-neutral-650'
                        }`}>MARCAR:</span>
                        <button
                          onClick={() => handleSetStatus(selectedDay, 'warmup', 'CONCLUÍDO')}
                          className={`flex-1 py-1 px-1 font-mono text-[8.5px] font-bold tracking-wider rounded border transition-all cursor-pointer ${
                            workoutStates[selectedDay]?.warmup === 'CONCLUÍDO'
                              ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] font-extrabold'
                              : (theme === 'light' ? 'bg-neutral-100 hover:bg-neutral-150 hover:text-neutral-900 text-neutral-700 border-neutral-200' : 'bg-neutral-900 hover:bg-neutral-850 hover:text-white text-neutral-400 border-neutral-800')
                          }`}
                          id="btn-warmup-concluido"
                        >
                          PRO PRNT
                        </button>
                        <button
                          onClick={() => handleSetStatus(selectedDay, 'warmup', 'ADAPTADO')}
                          className={`flex-1 py-1 px-1 font-mono text-[8.5px] font-bold tracking-wider rounded border transition-all cursor-pointer ${
                            workoutStates[selectedDay]?.warmup === 'ADAPTADO'
                              ? 'bg-yellow-500/25 text-yellow-650 border-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.1)] font-extrabold'
                              : (theme === 'light' ? 'bg-neutral-100 hover:bg-neutral-150 hover:text-neutral-900 text-neutral-700 border-neutral-200' : 'bg-neutral-900 hover:bg-neutral-850 hover:text-white text-neutral-400 border-neutral-800')
                          }`}
                          id="btn-warmup-adaptado"
                        >
                          ADAPTAR
                        </button>
                        <button
                          onClick={() => handleSetStatus(selectedDay, 'warmup', 'NÃO FEITO')}
                          className={`flex-1 py-1 px-1 font-mono text-[8.5px] font-bold tracking-wider rounded border transition-all cursor-pointer ${
                            workoutStates[selectedDay]?.warmup === 'NÃO FEITO'
                              ? (theme === 'light' ? 'bg-neutral-200 text-neutral-500 border-neutral-300 line-through font-extrabold' : 'bg-neutral-950 text-neutral-500 border-neutral-900 line-through')
                              : (theme === 'light' ? 'bg-neutral-100 hover:bg-neutral-150 hover:text-neutral-900 text-neutral-700 border-neutral-200' : 'bg-neutral-905 hover:bg-neutral-850 hover:text-white text-neutral-450 border-neutral-800')
                          }`}
                          id="btn-warmup-naofeito"
                        >
                          IGNORAR
                        </button>
                      </div>
                    </div>

                    {/* 7b. MAIN SET PORTION CARD */}
                    <div 
                      className={`p-4 flex flex-col gap-3 transition-all duration-300 relative rounded-2xl hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(16,185,129,0.12)] hover:border-emerald-500/60 ${
                        theme === 'light' ? 'liquid-glass-light border-neutral-200 shadow-sm' : 'liquid-glass'
                      }`}
                      id="portion-mainset-card"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className={`font-mono text-[9px] font-bold tracking-[0.2em] uppercase flex items-center gap-2 ${
                          theme === 'light' ? 'text-neutral-500' : 'text-neutral-400'
                        }`}>
                          <span className="w-1.5 h-3 bg-emerald-500 block rounded-full shadow-[0_0_6px_#10b981]" />
                          BLOCO PRINCIPAL (MAIN SET)
                        </h4>
                        
                        <span className={`px-2 py-0.5 font-mono text-[7px] font-bold tracking-widest border transition-all uppercase rounded ${
                          workoutStates[selectedDay]?.mainSet === 'CONCLUÍDO' 
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                            : workoutStates[selectedDay]?.mainSet === 'ADAPTADO'
                            ? 'bg-yellow-950/20 text-yellow-500 border-yellow-650/60'
                            : workoutStates[selectedDay]?.mainSet === 'NÃO FEITO'
                            ? (theme === 'light' ? 'bg-neutral-100 text-neutral-450 border-neutral-200 line-through font-bold' : 'bg-neutral-900/40 text-neutral-605 border-neutral-950 line-through')
                            : (theme === 'light' ? 'bg-neutral-50 text-neutral-450 border-neutral-200' : 'bg-neutral-900/50 text-neutral-500 border-neutral-850')
                        }`}>
                          {workoutStates[selectedDay]?.mainSet || 'PENDENTE'}
                        </span>
                      </div>

                      <p className={`text-[10px] font-mono leading-relaxed font-light lowercase ${
                        theme === 'light' ? 'text-neutral-650 font-normal' : 'text-neutral-400'
                      }`}>
                        {planilha.prescriptions[selectedDay]?.mainSet || 'Sem treinos prescritos'}
                      </p>

                      <div className={`flex items-center gap-1 mt-1.5 border-t pt-2.5 ${
                        theme === 'light' ? 'border-neutral-150' : 'border-neutral-900/50'
                      }`}>
                        <span className={`font-mono text-[7px] tracking-wider mr-2 uppercase block ${
                          theme === 'light' ? 'text-neutral-400' : 'text-neutral-605'
                        }`}>MARCAR:</span>
                        <button
                          onClick={() => handleSetStatus(selectedDay, 'mainSet', 'CONCLUÍDO')}
                          className={`flex-1 py-1 px-1 font-mono text-[8.5px] font-bold tracking-wider rounded border transition-all cursor-pointer ${
                            workoutStates[selectedDay]?.mainSet === 'CONCLUÍDO'
                              ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] font-extrabold'
                              : (theme === 'light' ? 'bg-neutral-100 hover:bg-neutral-150 hover:text-neutral-900 text-neutral-700 border-neutral-200' : 'bg-neutral-900 hover:bg-neutral-850 hover:text-white text-neutral-450 border-neutral-800')
                          }`}
                          id="btn-mainset-concluido"
                        >
                          CONCLUÍDO
                        </button>
                        <button
                          onClick={() => handleSetStatus(selectedDay, 'mainSet', 'ADAPTADO')}
                          className={`flex-1 py-1 px-1 font-mono text-[8.5px] font-bold tracking-wider rounded border transition-all cursor-pointer ${
                            workoutStates[selectedDay]?.mainSet === 'ADAPTADO'
                              ? 'bg-yellow-500/25 text-yellow-650 border-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.1)] font-extrabold'
                              : (theme === 'light' ? 'bg-neutral-100 hover:bg-neutral-150 hover:text-neutral-900 text-neutral-700 border-neutral-200' : 'bg-neutral-900 hover:bg-neutral-850 hover:text-white text-neutral-450 border-neutral-800')
                          }`}
                          id="btn-mainset-adaptado"
                        >
                          ADAPTAR
                        </button>
                        <button
                          onClick={() => handleSetStatus(selectedDay, 'mainSet', 'NÃO FEITO')}
                          className={`flex-1 py-1 px-1 font-mono text-[8.5px] font-bold tracking-wider rounded border transition-all cursor-pointer ${
                            workoutStates[selectedDay]?.mainSet === 'NÃO FEITO'
                              ? (theme === 'light' ? 'bg-neutral-200 text-neutral-500 border-neutral-300 line-through font-extrabold' : 'bg-neutral-950 text-neutral-500 border-neutral-900 line-through')
                              : (theme === 'light' ? 'bg-neutral-100 hover:bg-neutral-150 hover:text-neutral-900 text-neutral-700 border-neutral-200' : 'bg-neutral-905 hover:bg-neutral-850 hover:text-white text-neutral-450 border-neutral-800')
                          }`}
                          id="btn-mainset-naofeito"
                        >
                          IGNORAR
                        </button>
                      </div>
                    </div>

                    {/* 7c. COOL DOWN PORTION CARD */}
                    <div 
                      className={`p-4 flex flex-col gap-3 transition-all duration-300 relative rounded-2xl hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(16,185,129,0.12)] hover:border-emerald-500/60 ${
                        theme === 'light' ? 'liquid-glass-light border-neutral-200 shadow-sm' : 'liquid-glass'
                      }`}
                      id="portion-cooldown-card"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className={`font-mono text-[9px] font-bold tracking-[0.2em] uppercase flex items-center gap-2 ${
                          theme === 'light' ? 'text-neutral-500' : 'text-neutral-400'
                        }`}>
                          <span className="w-1.5 h-3 bg-emerald-500 block rounded-full shadow-[0_0_6px_#10b981]" />
                          RETORNO À CALMA (COOL DOWN)
                        </h4>
                        
                        <span className={`px-2 py-0.5 font-mono text-[7px] font-bold tracking-widest border transition-all uppercase rounded ${
                          workoutStates[selectedDay]?.coolDown === 'CONCLUÍDO' 
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                            : workoutStates[selectedDay]?.coolDown === 'ADAPTADO'
                            ? 'bg-yellow-950/20 text-yellow-500 border-yellow-650/60'
                            : workoutStates[selectedDay]?.coolDown === 'NÃO FEITO'
                            ? (theme === 'light' ? 'bg-neutral-100 text-neutral-450 border-neutral-200 line-through font-bold' : 'bg-neutral-900/40 text-neutral-605 border-neutral-950 line-through')
                            : (theme === 'light' ? 'bg-neutral-50 text-neutral-450 border-neutral-200' : 'bg-neutral-900/50 text-neutral-500 border-neutral-850')
                        }`}>
                          {workoutStates[selectedDay]?.coolDown || 'PENDENTE'}
                        </span>
                      </div>

                      <p className={`text-[10px] font-mono leading-relaxed font-light lowercase ${
                        theme === 'light' ? 'text-neutral-650 font-normal' : 'text-neutral-400'
                      }`}>
                        {planilha.prescriptions[selectedDay]?.coolDown || 'Nenhuma atividade programada'}
                      </p>

                      <div className={`flex items-center gap-1 mt-1.5 border-t pt-2.5 ${
                        theme === 'light' ? 'border-neutral-150' : 'border-neutral-900/50'
                      }`}>
                        <span className={`font-mono text-[7px] tracking-wider mr-2 uppercase block ${
                          theme === 'light' ? 'text-neutral-400' : 'text-neutral-605'
                        }`}>MARCAR:</span>
                        <button
                          onClick={() => handleSetStatus(selectedDay, 'coolDown', 'CONCLUÍDO')}
                          className={`flex-1 py-1 px-1 font-mono text-[8.5px] font-bold tracking-wider rounded border transition-all cursor-pointer ${
                            workoutStates[selectedDay]?.coolDown === 'CONCLUÍDO'
                              ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] font-extrabold'
                              : (theme === 'light' ? 'bg-neutral-100 hover:bg-neutral-150 hover:text-neutral-900 text-neutral-700 border-neutral-200' : 'bg-neutral-900 hover:bg-neutral-850 hover:text-white text-neutral-450 border-neutral-800')
                          }`}
                          id="btn-cooldown-concluido"
                        >
                          CONCLUÍDO
                        </button>
                        <button
                          onClick={() => handleSetStatus(selectedDay, 'coolDown', 'ADAPTADO')}
                          className={`flex-1 py-1 px-1 font-mono text-[8.5px] font-bold tracking-wider rounded border transition-all cursor-pointer ${
                            workoutStates[selectedDay]?.coolDown === 'ADAPTADO'
                              ? 'bg-yellow-500/25 text-yellow-650 border-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.1)] font-extrabold'
                              : (theme === 'light' ? 'bg-neutral-100 hover:bg-neutral-150 hover:text-neutral-900 text-neutral-700 border-neutral-200' : 'bg-neutral-900 hover:bg-neutral-850 hover:text-white text-neutral-450 border-neutral-800')
                          }`}
                          id="btn-cooldown-adaptado"
                        >
                          ADAPTAR
                        </button>
                        <button
                          onClick={() => handleSetStatus(selectedDay, 'coolDown', 'NÃO FEITO')}
                          className={`flex-1 py-1 px-1 font-mono text-[8.5px] font-bold tracking-wider rounded border transition-all cursor-pointer ${
                            workoutStates[selectedDay]?.coolDown === 'NÃO FEITO'
                              ? (theme === 'light' ? 'bg-neutral-200 text-neutral-500 border-neutral-300 line-through font-extrabold' : 'bg-neutral-950 text-neutral-500 border-neutral-900 line-through')
                              : (theme === 'light' ? 'bg-neutral-100 hover:bg-neutral-150 hover:text-neutral-150 text-neutral-500 border-neutral-200' : 'bg-neutral-900 hover:bg-neutral-850 hover:text-white text-neutral-450 border-neutral-800')
                          }`}
                          id="btn-cooldown-naofeito"
                        >
                          IGNORAR
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* STUDENT SUBJECTIVE EXPANDED FEEDBACK PANEL */}
                  <div 
                    className={`w-full border rounded-xl p-4 text-left font-mono animate-fade-in transition-colors ${
                      theme === 'light' ? 'bg-white border-neutral-200 shadow-xs' : 'bg-neutral-950/70 border-neutral-900'
                    }`}
                    id="athlete-feedback-input-panel"
                  >
                    <span className="text-[7.5px] font-mono tracking-[0.25em] text-emerald-500 font-bold block uppercase mb-3">
                      RELATO DE RENDIMENTO &amp; FEEDBACK SUBJETIVO ({selectedDay})
                    </span>

                    <div className="space-y-3.5">
                      {/* Feeling selectors */}
                      <div className="space-y-1">
                        <span className="text-[7px] text-neutral-500 font-bold uppercase block">COMO SE SENTIU NO TREINO GERAL?</span>
                        <div className="grid grid-cols-4 gap-1 pt-1">
                          {['EXCELENTE', 'BOM', 'CANSADO', 'FATIGADO'].map((f) => {
                            const isSelected = currentFeeling === f;
                            return (
                              <button
                                key={f}
                                type="button"
                                onClick={() => setCurrentFeeling(f)}
                                className={`py-1 text-[7px] font-bold rounded border transition-all cursor-pointer text-center ${
                                  isSelected
                                    ? (theme === 'light' ? 'bg-neutral-950 text-white border-neutral-950 font-black' : 'bg-white text-black border-white font-black')
                                    : (theme === 'light' ? 'bg-neutral-50 hover:bg-neutral-100 hover:text-neutral-955 text-neutral-600 border-neutral-200' : 'bg-neutral-900 hover:bg-neutral-850 hover:text-white text-neutral-400 border-neutral-800')
                                }`}
                              >
                                {f}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Effort scale slider */}
                      <div className="space-y-1 font-mono">
                        <div className="flex justify-between items-center text-[7px] text-neutral-500 font-bold uppercase">
                          <span>ESFORÇO ADAPTATIVO:</span>
                          <span className="text-emerald-500 font-black">{currentEffort}/10 ({currentEffort <= 3 ? 'LEVE' : currentEffort <= 6 ? 'MODERADO' : currentEffort <= 8 ? 'INTENSO' : 'MÁXIMO'})</span>
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="10"
                          value={currentEffort}
                          onChange={(e) => setCurrentEffort(parseInt(e.target.value))}
                          className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-emerald-500 ${
                            theme === 'light' ? 'bg-neutral-200' : 'bg-neutral-900 border border-neutral-800'
                          }`}
                        />
                      </div>

                      {/* 1. Sleep Quality (Quality score) */}
                      <div className="space-y-1 font-mono">
                        <div className="flex justify-between items-center text-[7px] text-neutral-500 font-bold uppercase">
                          <span>QUALIDADE DO SONO:</span>
                          <span className="text-emerald-500 font-black">{currentSleep}/10 ({currentSleep <= 4 ? 'RUIM' : currentSleep <= 7 ? 'REGULAR' : 'REGENERADOR'})</span>
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="10"
                          value={currentSleep}
                          onChange={(e) => setCurrentSleep(parseInt(e.target.value))}
                          className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-emerald-555 ${
                            theme === 'light' ? 'bg-neutral-200' : 'bg-neutral-900 border border-neutral-800'
                          }`}
                        />
                      </div>

                      {/* 2. Muscular Pain (Value score) */}
                      <div className="space-y-1 font-mono">
                        <div className="flex justify-between items-center text-[7px] text-neutral-500 font-bold uppercase">
                          <span>DOR / DESCONFORTO MUSCULAR:</span>
                          <span className="text-emerald-500 font-black">{currentPain}/10 ({currentPain === 0 ? 'NENHUMA' : currentPain <= 3 ? 'FRACA' : currentPain <= 6 ? 'MODERADA' : 'ATENÇÃO/SEVERA'})</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="10"
                          value={currentPain}
                          onChange={(e) => setCurrentPain(parseInt(e.target.value))}
                          className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-emerald-400 ${
                            theme === 'light' ? 'bg-neutral-200' : 'bg-neutral-900 border border-neutral-800'
                          }`}
                        />
                      </div>

                      {/* 3. Readiness/Disposição Level (disposicao score) */}
                      <div className="space-y-1 font-mono">
                        <div className="flex justify-between items-center text-[7px] text-neutral-500 font-bold uppercase">
                          <span>NÍVEL DE DISPOSIÇÃO / RECUPERAÇÃO:</span>
                          <span className="text-emerald-500 font-black">{currentEnergy}/10 ({currentEnergy <= 4 ? 'CRATIVO' : currentEnergy <= 7 ? 'ESTÁVEL' : 'EXCELENTE'})</span>
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="10"
                          value={currentEnergy}
                          onChange={(e) => setCurrentEnergy(parseInt(e.target.value))}
                          className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-emerald-500 ${
                            theme === 'light' ? 'bg-neutral-200' : 'bg-neutral-900 border border-neutral-800'
                          }`}
                        />
                      </div>

                      {/* Written report text-area */}
                      <div className="space-y-1">
                        <label className="text-[7px] text-neutral-450 font-bold uppercase block">DESCRITIVO DO SEU ESTADO:</label>
                        <textarea
                          rows={2}
                          value={currentFeedbackComment}
                          onChange={(e) => setCurrentFeedbackComment(e.target.value)}
                          placeholder="Relate dores, percepções, ou observações sobre o ritmo para o Coach analisar..."
                          className={`w-full border rounded-lg p-2 text-[9px] focus:border-emerald-500 focus:outline-none leading-relaxed transition-all resize-none font-mono ${
                            theme === 'light' 
                              ? 'bg-neutral-50 border-neutral-200 text-neutral-950 placeholder:text-neutral-400' 
                              : 'bg-black border-neutral-900 text-white placeholder:text-neutral-700'
                          }`}
                        />
                      </div>

                      {/* Save feedback execution triggers */}
                      <button
                        onClick={handleSaveFeedback}
                        className={`w-full py-2.5 font-bold text-[8.5px] tracking-widest text-center transition-all rounded-lg uppercase cursor-pointer flex items-center justify-center gap-1.5 border ${
                          theme === 'light'
                            ? 'bg-neutral-955 hover:bg-emerald-500 hover:text-black border-neutral-905 text-white'
                            : 'bg-neutral-900 hover:bg-emerald-500 hover:text-black border-neutral-800 text-white hover:border-emerald-450'
                        }`}
                      >
                        {showFeedbackSuccess ? (
                          <span className="text-emerald-500 font-black animate-pulse flex items-center gap-1">
                            ✓ RELATO PUBLICADO COM SUCESSO!
                          </span>
                        ) : (
                          <span>SALVAR RELATO DE {selectedDay}</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* LOCAL GPS ACTIVITIES CHRONICLE LOG LIST */}
                  <div className={`p-4 border rounded-xl font-mono text-left transition-colors ${
                    theme === 'light' ? 'bg-white border-neutral-200 shadow-xs' : 'bg-neutral-950/70 border-neutral-900'
                  }`}>
                    <span className="text-[7.5px] font-mono tracking-[0.25em] text-emerald-500 font-bold block uppercase mb-2">
                      HISTÓRICO SENSORIAL DE CORRIDAS ({selectedDay})
                    </span>
                    {activityLogs.filter(log => log.day === selectedDay).length === 0 ? (
                      <p className="text-[8.5px] text-neutral-500 uppercase leading-relaxed">
                        NENHUMA CORRIDA INTEGRADA VIA GPS SENSOR REGISTRADA PARA HOJE. CONECTE O SENSOR NO TOPO PARA ADICIONAR.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {activityLogs.filter(log => log.day === selectedDay).map((log) => (
                          <div 
                            key={log.id} 
                            className={`p-2.5 rounded-lg border flex justify-between items-center text-[8px] ${
                              theme === 'light' ? 'bg-neutral-50 border-neutral-200 text-neutral-800' : 'bg-black border-neutral-905 text-zinc-300'
                            }`}
                          >
                            <div>
                              <span className="text-emerald-500 font-bold uppercase">{log.activityName}</span>
                              <div className="flex items-center gap-2 mt-0.5 text-[7px] text-neutral-500 uppercase">
                                <span>Distância: {log.distance}km</span>
                                <span>Tempo: {Math.floor(log.durationSecs / 60)}m{log.durationSecs % 60}s</span>
                                <span>Pace: {log.pace}/km</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-red-500 font-bold flex items-center gap-1">
                                <Heart className="w-2.5 h-2.5 fill-red-500/20" />
                                {log.hrBpm} bpm
                              </span>
                              <button
                                onClick={() => {
                                  setActivityLogs(prev => prev.filter(item => item.id !== log.id));
                                }}
                                className="text-red-400 hover:text-red-500 text-[6.5px] font-bold mt-1 uppercase cursor-pointer"
                              >
                                [Excluir Log]
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* WEEKLY CALENDAR EXPANDED VIEW LAYOUT */
                <div className="flex flex-col gap-3.5" id="weekly-calendar-expanded-list">
                  
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    theme === 'light' ? 'bg-white border-neutral-200 shadow-sm' : 'bg-neutral-950/40 border-neutral-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-emerald-500 w-4 h-4" />
                      <span className="text-[9px] font-mono tracking-widest text-neutral-400 font-bold uppercase">VISÃO GERAL DO PLANEJAMENTO</span>
                    </div>
                    <span className="text-[8px] font-mono font-bold text-emerald-500 uppercase">
                      {completedDaysCount} de 7 CONCLUÍDOS
                    </span>
                  </div>

                  {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].map((day) => {
                    const isSelected = selectedDay === day;
                    const prescriptionExists = planilha.prescriptions[day] || DEFAULT_PRESCRIPTIONS[day];
                    const isDone = getDayCompletionStatus(day) === 'FEITO';
                    const dayFeedbackObj = feedbacks[day];

                    return (
                      <div
                        key={day}
                        className={`border rounded-2xl p-4 transition-all duration-300 relative ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-500/[0.015]' 
                            : (theme === 'light' ? 'bg-white border-neutral-200 hover:border-neutral-350' : 'bg-neutral-950/70 border-neutral-900 hover:border-neutral-850')
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center font-mono border ${
                              theme === 'light' ? 'bg-neutral-100 border-neutral-250 font-bold' : 'bg-black border-neutral-905 font-bold'
                            }`}>
                              <span className={`text-[10px] font-extrabold ${theme === 'light' ? 'text-neutral-950' : 'text-white'}`}>{day}</span>
                            </div>
                            <div>
                              <span className="text-[7px] font-mono tracking-[0.2em] text-emerald-500 uppercase block">
                                {prescriptionExists?.badge || 'DIRECIONAMENTO / DESCANSO'}
                              </span>
                              <h4 className={`text-[9.5px] font-extrabold tracking-wider uppercase font-mono mt-0.5 ${
                                theme === 'light' ? 'text-neutral-850' : 'text-white'
                              }`}>
                                {prescriptionExists?.title || `${day} - DESCANSO ESPORTIVO`}
                              </h4>
                            </div>
                          </div>

                          {/* Unified Done/Pendente Badge */}
                          <span className={`px-2 py-0.5 font-mono text-[6.5px] font-bold tracking-widest border rounded transition-all uppercase ${
                            isDone 
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                              : 'bg-neutral-900/40 text-neutral-500 border-neutral-850'
                          }`}>
                            {isDone ? 'COMPLETO' : 'PENDENTE'}
                          </span>
                        </div>

                        {/* Exercise description brief snippet */}
                        <div className="mt-3.5 space-y-1 text-[8.5px] font-mono leading-relaxed pl-1 text-neutral-400">
                          {prescriptionExists?.warmup && prescriptionExists?.warmup !== '-' && (
                            <div>
                              <span className="text-neutral-500">➔ Aq:</span> {prescriptionExists.warmup}
                            </div>
                          )}
                          <div>
                            <span className="text-neutral-500">➔ Foco:</span> {prescriptionExists?.mainSet || "Descanso completo ou fortalecimento opcional recomendado."}
                          </div>
                          {prescriptionExists?.coolDown && prescriptionExists?.coolDown !== '-' && (
                            <div>
                              <span className="text-neutral-500">➔ Retorno:</span> {prescriptionExists.coolDown}
                            </div>
                          )}
                        </div>

                        {/* Stored Feedback Preview */}
                        {dayFeedbackObj && dayFeedbackObj.comment && (
                          <div className={`mt-3 p-2.5 rounded-lg border text-[8px] leading-relaxed italic ${
                            theme === 'light' ? 'bg-neutral-50 border-neutral-150 text-neutral-600' : 'bg-black/40 border-neutral-905 text-neutral-450'
                          }`}>
                            <div className="flex justify-between items-center not-italic font-bold text-[6.5px] tracking-wider text-emerald-400 uppercase mb-1">
                              <span>SEU RELATO DIÁRIO:</span>
                              <span>ESFORÇO: {dayFeedbackObj.effort}/10 ({dayFeedbackObj.feeling})</span>
                            </div>
                            "{dayFeedbackObj.comment}"
                          </div>
                        )}

                        {/* Action buttons mapping */}
                        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-neutral-900/10">
                          <button
                            onClick={() => {
                              setSelectedDay(day);
                              setViewMode('DIARIO');
                            }}
                            className="flex-1 py-1.5 font-mono text-[7.5px] font-bold tracking-widest rounded border border-emerald-500/40 hover:bg-emerald-500 hover:text-black transition-all text-center cursor-pointer uppercase text-emerald-400 hover:border-emerald-500"
                          >
                            LANCAR GPS / FEEDBACKS DO DIA
                          </button>
                        </div>

                      </div>
                    );
                  })}

                </div>
              )}

              {/* 8. ACCESS COMPLEMENTARY STATS OVERLAY BUTTON */}
              <button
                onClick={() => setIsStatsOpen(true)}
                className={`w-full border hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/10 py-4 px-6 font-mono font-bold tracking-[0.25em] text-[9.5px] flex items-center justify-center gap-2.5 rounded-xl mt-4 transition-all cursor-pointer shadow-xs uppercase ${
                  theme === 'light' ? 'bg-neutral-50 border-neutral-200 text-neutral-700' : 'bg-neutral-900/40 border-neutral-800 text-neutral-300'
                }`}
                id="btn-open-weekly-statistics"
              >
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                DADOS DE RENDIMENTO &amp; TELEMETRIA
              </button>

            </motion.div>
          ) : (
            
            // ATHLETE PROFILE OPTIONS TAB VIEW
            <motion.div
              key="profile-content"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-grow flex flex-col gap-4"
              id="profile-tab-active-view"
            >
              <div className={`p-6 flex flex-col gap-6 text-center items-center py-7 transition-all duration-300 rounded-2xl liquid-sheen ${
                theme === 'light' ? 'liquid-glass-light text-neutral-955 shadow-lg' : 'liquid-glass'
              }`}>
                
                {/* Premium user identity element with emerald glow feedback */}
                <div 
                  className={`relative w-24 h-24 border rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/20 ${
                    theme === 'light' ? 'bg-white border-emerald-550' : 'bg-black/40 border-emerald-500/80'
                  }`}
                  id="profile-avatar-lockup"
                >
                  <User className="w-10 h-10 text-emerald-500 stroke-[1.25]" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border border-black rounded-full flex items-center justify-center text-[8px] font-black text-black font-mono shadow-[0_0_8px_#10b981]">
                    A3
                  </div>
                </div>

                <div className="space-y-1.5 text-center">
                  <h3 className={`text-xl font-bold font-mono tracking-widest uppercase ${
                    theme === 'light' ? 'text-neutral-950' : 'text-white'
                  }`}>{formattedAthleteName}</h3>
                  <span className="text-[8px] font-mono text-neutral-500 tracking-[0.22em] uppercase block">JULIANO MARCOMINI ATHLETICS INC.</span>
                </div>

                {/* Profile technical specifications metrics grid */}
                <div className="grid grid-cols-2 gap-2 w-full mt-2" id="profile-specifications-grid">
                  <div className={`p-3.5 rounded-xl border text-left transition-all duration-300 hover:scale-[1.02] ${
                    theme === 'light' ? 'bg-white/70 border-neutral-200' : 'bg-black/40 border-white/5 shadow-inner'
                  }`}>
                    <span className="text-[7.5px] font-mono tracking-[0.18em] text-neutral-500 uppercase block">PACE ALVO MEIA</span>
                    <span className="text-sm font-black font-mono tracking-tight text-emerald-500 block mt-1">4:30 / KM</span>
                  </div>
                  <div className={`p-3.5 rounded-xl border text-left transition-all duration-300 hover:scale-[1.02] ${
                    theme === 'light' ? 'bg-white/70 border-neutral-200' : 'bg-black/40 border-white/5 shadow-inner'
                  }`}>
                    <span className="text-[7.5px] font-mono tracking-[0.18em] text-neutral-500 uppercase block">FREQ. MÁXIMA</span>
                    <span className={`text-sm font-black font-mono tracking-tight block mt-1 ${
                      theme === 'light' ? 'text-neutral-900' : 'text-white'
                    }`}>189 BPM</span>
                  </div>
                  <div className={`p-3.5 rounded-xl border text-left transition-all duration-300 hover:scale-[1.02] ${
                    theme === 'light' ? 'bg-white/70 border-neutral-200' : 'bg-black/40 border-white/5 shadow-inner'
                  }`}>
                    <span className="text-[7.5px] font-mono tracking-[0.18em] text-neutral-500 uppercase block">LIMIAR LÁCTEO</span>
                    <span className={`text-sm font-black font-mono tracking-tight block mt-1 ${
                      theme === 'light' ? 'text-neutral-900' : 'text-white'
                    }`}>172 BPM</span>
                  </div>
                  <div className={`p-3.5 rounded-xl border text-left transition-all duration-300 hover:scale-[1.02] ${
                    theme === 'light' ? 'bg-white/70 border-neutral-200' : 'bg-black/40 border-white/5 shadow-inner'
                  }`}>
                    <span className="text-[7.5px] font-mono tracking-[0.18em] text-neutral-500 uppercase block">CADÊNCIA ALVO</span>
                    <span className={`text-sm font-black font-mono tracking-tight block mt-1 ${
                      theme === 'light' ? 'text-neutral-900' : 'text-white'
                    }`}>182 RPM</span>
                  </div>
                </div>

                {/* Database synchronization message */}
                <div className={`w-full p-4 border border-dashed rounded-xl text-left ${
                  theme === 'light' ? 'bg-emerald-50/20 border-emerald-300' : 'bg-black border-dashed border-emerald-900/50'
                }`}>
                  <span className="text-[8px] font-mono tracking-[0.25em] text-emerald-500 block mb-1">REGISTRO SÍNCRONO ATIVO</span>
                  <p className="text-[9px] font-mono text-neutral-500 leading-relaxed uppercase">
                    SEU TELEFONE CELULAR ESTÁ VINCULADO E TRANSMITE AS MARCAÇÕES EM TEMPO REAL PARA A CENTRAL DE CONTROLE DO TREINADOR.
                  </p>
                </div>

              </div>

              {/* Complete account closure option */}
              <button
                onClick={onBack}
                className={`w-full transition border font-mono font-bold tracking-[0.25em] text-[10px] flex items-center justify-center gap-2 rounded-xl py-4 px-6 uppercase mt-2 cursor-pointer ${
                  theme === 'light' 
                    ? 'bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 border-neutral-300 text-neutral-800' 
                    : 'bg-neutral-950 hover:bg-neutral-900/60 border-neutral-800 hover:border-emerald-500/40 text-neutral-400 hover:text-white'
                }`}
                id="btn-account-logout"
              >
                <LogOut className="w-4 h-4 text-emerald-500" />
                CONCLUIR TREINAMENTO // FAZER LOGOUT
              </button>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 9. TELEMETRIA PERFORMANCE MODAL OVERLAY (Pure high contrast monochromatic design) */}
      <AnimatePresence>
        {isStatsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 selection:bg-neutral-850 select-none font-mono ${
              theme === 'light' ? 'bg-[#ffffff]/95 text-neutral-950' : 'bg-[#000000]/95 text-white'
            }`}
            id="weekly-statistics-modal"
          >
            {/* Spotlight cone inside the modal strictly reflecting Image 1 */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-80 h-[300px] blur-3xl rounded-t-full pointer-events-none ${
              theme === 'light' ? 'bg-gradient-to-b from-neutral-300/[0.2] to-transparent' : 'bg-gradient-to-b from-white/[0.045] to-transparent shadow-none'
            }`} />

            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              transition={{ type: 'spring', damping: 24, stiffness: 200 }}
              className={`w-full max-w-sm border rounded-2xl p-5 flex flex-col gap-4 relative max-h-[92vh] overflow-y-auto ${
                theme === 'light' 
                  ? 'bg-white border-neutral-250 shadow-2xl text-neutral-950' 
                  : 'bg-[#000000] border-neutral-800 shadow-[0_0_50px_rgba(255,255,255,0.02)] text-white'
              }`}
              id="stats-modal-body"
            >
              
              {/* Close Button X */}
              <button 
                onClick={() => setIsStatsOpen(false)}
                className={`absolute top-4 right-4 w-7 h-7 rounded-lg border flex items-center justify-center hover:border-neutral-500 transition cursor-pointer ${
                  theme === 'light' ? 'bg-neutral-100 border-neutral-200' : 'bg-neutral-950 border-neutral-800'
                }`}
                id="btn-close-stats-modal"
                title="Fechar Painel"
              >
                <X className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-neutral-500 hover:text-neutral-950' : 'text-neutral-400 hover:text-white'}`} />
              </button>

              {/* Title Section */}
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-[8px] font-mono font-bold tracking-[0.3em] text-neutral-400 flex items-center gap-1.5 uppercase">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  RENDIMENTO DA PLANILHA
                </span>
                <h2 className={`text-lg font-black italic tracking-widest uppercase mt-1 ${
                  theme === 'light' ? 'text-neutral-950' : 'text-white'
                }`}>
                  TELEMETRIA ANALÍTICA
                </h2>
              </div>

              {/* Central Circle Progress Consistency Metric (High performance circular track) */}
              <div className={`border p-5 rounded-xl flex flex-col items-center justify-center gap-4 mt-1 relative overflow-hidden ${
                theme === 'light' ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-950/60 border-neutral-900'
              }`} id="gauge-container">
                
                {/* Simulated monochromatic micro wireframe ring structure (Image 2 reference) */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  
                  <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="42" 
                      stroke="rgba(16,185,129,0.05)" 
                      strokeWidth="5" 
                      fill="transparent" 
                    />
                    <motion.circle 
                      cx="50" 
                      cy="50" 
                      r="42" 
                      stroke="#10b981"
                      strokeWidth="5.5" 
                      fill="transparent" 
                      strokeDasharray="263.8"
                      initial={{ strokeDashoffset: 263.8 }}
                      animate={{ strokeDashoffset: 263.8 - (263.8 * consistencyPercentage) / 100 }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Percentage in high contrast white */}
                  <div className="flex flex-col items-center justify-center text-center z-10">
                    <span className="text-2xl font-black tracking-widest text-[#10b981] [text-shadow:0_0_10px_rgba(16,185,129,0.35)] leading-none">
                      {consistencyPercentage}%
                    </span>
                    <span className="text-[7px] font-mono tracking-[0.16em] text-emerald-500 font-bold uppercase mt-1">
                      ADERÊNCIA
                    </span>
                  </div>

                </div>

                {/* Numeric completion tag */}
                <div className="text-center">
                  <span className="text-[7.5px] font-mono tracking-[0.25em] text-neutral-500 uppercase block">TREINOS VÁLIDOS CONCLUÍDOS UNIDADE</span>
                  <span className={`text-sm font-black block mt-1 tracking-widest ${
                    theme === 'light' ? 'text-neutral-950' : 'text-white'
                  }`}>
                    {completedDaysCount} de 5 Dias Úteis
                  </span>
                </div>

                {/* Italic Coach Feedback text */}
                <div className={`border-t pt-3 mt-1.5 w-full text-center ${
                  theme === 'light' ? 'border-neutral-200' : 'border-neutral-900/60'
                }`}>
                  <span className="text-[6.5px] text-neutral-500 tracking-[0.22em] block uppercase">ANOTAÇÕES DO TREINADOR:</span>
                  <p className={`text-[9px] italic leading-relaxed uppercase mt-1 ${
                    theme === 'light' ? 'text-neutral-700 font-medium' : 'text-neutral-400'
                  }`}>
                    "O ALICERCE DA SUA MEIA MARATONA ESTÁ NO CUMPRIMENTO DAS PASSADAS LEVES E CADÊNCIA. SIGA A CORRIDA SEM EXCEÇÕES."
                  </p>
                </div>

              </div>

              {/* Graphic Pace bar meters styled with shades of silver and metal outlines */}
              <div className={`flex flex-col gap-2.5 border rounded-xl p-4 transition-colors ${
                theme === 'light' ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-950/60 border-neutral-900'
              }`} id="pace-distribution-graph">
                <span className="text-[8px] font-mono tracking-[0.25em] text-neutral-400 font-bold uppercase block mb-1">
                  ESTÍMULOS POR ZONAS (PACE)
                </span>

                {/* Z1 meter */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[8px] font-mono">
                    <span className="text-neutral-400 font-bold uppercase">Z1 ➔ REGENERATIVO CONFORTO</span>
                    <span className="text-neutral-500 font-bold">4 Treinos</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden border ${
                    theme === 'light' ? 'bg-neutral-200 border-neutral-300' : 'bg-neutral-900 border-neutral-850'
                  }`}>
                    <motion.div 
                      className={`h-full rounded-full opacity-[0.9] ${theme === 'light' ? 'bg-neutral-700' : 'bg-white'}`} 
                      initial={{ width: 0 }}
                      animate={{ width: '80%' }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    />
                  </div>
                </div>

                {/* Z2 meter */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex justify-between items-center text-[8px] font-mono">
                    <span className="text-emerald-555 font-black uppercase">Z2 ➔ AERÓBIO CONTÍNUO</span>
                    <span className="text-emerald-600 font-bold">2 Treinos</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden border ${
                    theme === 'light' ? 'bg-neutral-200 border-neutral-300' : 'bg-neutral-900 border-neutral-850'
                  }`}>
                    <motion.div 
                      className="h-full bg-emerald-500 rounded-full opacity-[1] shadow-[0_0_8px_rgba(16,185,129,0.7)]" 
                      initial={{ width: 0 }}
                      animate={{ width: '45%' }}
                      transition={{ duration: 0.6, delay: 0.15 }}
                    />
                  </div>
                </div>

                {/* Z3 meter */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex justify-between items-center text-[8px] font-mono">
                    <span className="text-neutral-400 font-bold uppercase">Z3 ➔ MEIO RITMO FIRME</span>
                    <span className="text-neutral-500 font-bold">1 Treino</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden border ${
                    theme === 'light' ? 'bg-neutral-200 border-neutral-300' : 'bg-neutral-900 border-neutral-850'
                  }`}>
                    <motion.div 
                      className={`h-full rounded-full opacity-[0.5] ${theme === 'light' ? 'bg-neutral-700' : 'bg-white'}`} 
                      initial={{ width: 0 }}
                      animate={{ width: '25%' }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    />
                  </div>
                </div>

                {/* Z4 meter */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex justify-between items-center text-[8px] font-mono">
                    <span className="text-neutral-400 font-bold uppercase">Z4 ➔ LIMIAR DE LACTATO</span>
                    <span className="text-neutral-500 font-bold">1 Treino</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden border ${
                    theme === 'light' ? 'bg-neutral-200 border-neutral-300' : 'bg-neutral-900 border-neutral-850'
                  }`}>
                    <motion.div 
                      className={`h-full rounded-full opacity-[0.3] ${theme === 'light' ? 'bg-neutral-700' : 'bg-white'}`} 
                      initial={{ width: 0 }}
                      animate={{ width: '20%' }}
                      transition={{ duration: 0.6, delay: 0.25 }}
                    />
                  </div>
                </div>

                {/* Z5 meter */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex justify-between items-center text-[8px] font-mono">
                    <span className="text-neutral-400 font-bold uppercase">Z5 ➔ TIROS MÁXIMOS VO2</span>
                    <span className="text-neutral-500 font-bold">1 Treino</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden border ${
                    theme === 'light' ? 'bg-neutral-200 border-neutral-300' : 'bg-neutral-900 border-neutral-850'
                  }`}>
                    <motion.div 
                      className={`h-full rounded-full opacity-[0.2] ${theme === 'light' ? 'bg-neutral-700' : 'bg-white'}`} 
                      initial={{ width: 0 }}
                      animate={{ width: '20%' }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    />
                  </div>
                </div>

              </div>

              {/* Day outline checklists summary */}
              <div className="flex flex-col gap-2" id="daily-workout-completion-matrix">
                <span className="text-[8px] font-mono tracking-[0.25em] text-neutral-400 font-bold uppercase block">
                  INDEXADORES DIÁRIOS
                </span>
                
                <div className="grid grid-cols-2 gap-1.5 text-[9px] tracking-widest font-mono">
                  {Object.keys(planilha.prescriptions).map(day => {
                    const status = getDayCompletionStatus(day);
                    return (
                      <div 
                        key={day} 
                        className={`flex justify-between items-center p-2 border rounded-lg ${
                          theme === 'light' ? 'bg-neutral-100 border-neutral-200' : 'bg-neutral-950 border-neutral-905'
                        }`}
                      >
                        <span className="text-neutral-400 font-bold uppercase">{day}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold ${
                          status === 'FEITO' 
                            ? (theme === 'light' ? 'bg-neutral-950 text-white font-black uppercase' : 'bg-white text-black font-black uppercase') 
                            : (theme === 'light' ? 'bg-neutral-150 text-neutral-500 border border-neutral-300' : 'bg-neutral-900 text-neutral-500 border border-neutral-850')
                        }`}>
                          {status === 'FEITO' ? 'FEITO' : 'PENDENTE'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Confirm Back button */}
              <button
                onClick={() => setIsStatsOpen(false)}
                className={`w-full py-3.5 px-6 font-mono font-black tracking-[0.28em] text-[9.5px] rounded-xl shadow-md text-center mt-2 cursor-pointer uppercase transition-all ${
                  theme === 'light' 
                    ? 'bg-neutral-950 text-white hover:bg-neutral-800' 
                    : 'bg-white text-black hover:bg-neutral-200'
                }`}
                id="btn-stats-back-to-runsheet"
              >
                RETORNAR PARA A CORRIDA
              </button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUPABASE SQL BOOTSTRAP OVERLAY */}
      <AnimatePresence>
        {showSqlDialog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-md border rounded-2xl p-5 font-mono text-[10px] shadow-2xl relative flex flex-col gap-4 ${
                theme === 'light' ? 'bg-[#f5f5f7] border-neutral-300 text-[#19191b]' : 'bg-[#0a0a0c] border-neutral-900 text-neutral-300'
              }`}
            >
              <button 
                onClick={() => setShowSqlDialog(false)}
                className="absolute top-4 right-4 p-1 hover:text-red-500 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 border-b border-neutral-800/10 dark:border-neutral-800 pb-3">
                <Database className="w-5 h-5 text-[#0284c7]" />
                <div>
                  <h3 className={`text-xs font-black tracking-widest uppercase ${theme === 'light' ? 'text-black' : 'text-white'}`}>Configurar Supabase Cloud</h3>
                  <p className="text-[8px] text-neutral-500 font-bold uppercase mt-0.5">Siga as instruções para ativar sincronização bi-direcional</p>
                </div>
              </div>

              <p className="leading-relaxed text-[9px]">
                O seu aplicativo do atleta e painel do treinador já estão vinculados à API do Supabase (<span className="text-sky-500 font-bold">{(supabaseUrl || 'https://kgmnvjhyuhpxglpsvpnz.supabase.co').replace('https://', '').split('.')[0]}</span>).
              </p>
              
              <div className="bg-sky-500/10 border border-sky-500/25 rounded-xl p-3 flex gap-2 text-sky-500 text-[9px]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-sky-400" />
                <p className="leading-relaxed font-semibold">
                  A tabela <code className="bg-sky-950/40 border border-sky-900 px-1 py-0.5 rounded text-white text-[8px]">athlete_sync</code> está ausente ou ainda não foi criada. Copie o script SQL abaixo, acesse o painel de controle do Supabase, cole no <strong className={theme === 'light' ? 'text-[#19191b]' : 'text-white'}>SQL Editor</strong> do projeto e clique em <strong className={theme === 'light' ? 'text-[#19191b]' : 'text-white'}>Run</strong>.
                </p>
              </div>

              <div className="space-y-1.5 flex flex-col flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-neutral-450 tracking-wider font-bold uppercase">SCRIPT DE CRIAÇÃO (DQL / DDL):</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(SUPABASE_BOOTSTRAP_SQL);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#10b981] hover:bg-emerald-400 text-[8px] font-black text-[#000] uppercase tracking-wider cursor-pointer transition"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-2.5 h-2.5" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5" />
                        Copiar Script SQL
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl overflow-x-auto text-[8px] text-[#10b981] font-mono leading-relaxed max-h-48 whitespace-pre">
                  {SUPABASE_BOOTSTRAP_SQL}
                </pre>
              </div>

              <div className="border-t border-neutral-800/10 dark:border-neutral-900 pt-3 flex justify-end gap-2 text-[9px] uppercase font-bold tracking-widest mt-1">
                <button 
                  onClick={() => setShowSqlDialog(false)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded-lg cursor-pointer"
                >
                  Continuar Local
                </button>
                <button 
                  onClick={() => {
                    setShowSqlDialog(false);
                    window.location.reload();
                  }}
                  className={`px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider transition ${
                    theme === 'light' ? 'bg-neutral-950 text-white hover:bg-neutral-800' : 'bg-white text-black hover:bg-neutral-250'
                  }`}
                >
                  Confirmar e Recarregar ✓
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
