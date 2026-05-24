import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Athlete } from '../types';
import { 
  TrendingUp, Users, Radio, ShieldAlert, Sparkles, Activity, Plus, Save, 
  Send, Calendar, Clock, Sliders, CheckSquare, Trash2, Edit3, Award, Grid,
  Palette, User, LogOut, FileText
} from 'lucide-react';

interface TrainerDashboardSimulatorProps {
  onBackToRunner: () => void;
  theme?: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

interface PlanilhaZone {
  name: string;
  desc: string;
  pace: string;
}

interface DayPrescription {
  title: string;
  badge: string;
  subBadge: string;
  warmup: string;
  mainSet: string;
  coolDown: string;
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
    mainSet: "Exercícios de fortalecimento muscular ou descanso completo",
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

export default function TrainerDashboardSimulator({ 
  onBackToRunner,
  theme = 'dark',
  setTheme
}: TrainerDashboardSimulatorProps) {
  // Saved Trainer credential profile to keep consistent branding
  const [trainerProfile, setTrainerProfile] = useState(() => {
    const saved = localStorage.getItem('TRAINER_PROFILE_DATA');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      name: "Juliano Marcomini",
      role: "Treinador Principal",
      bio: "CREF 012345-G/SP. Especializado em corrida de rua, TAF, alta performance e assessoria esportiva.",
      experience: "15+ Anos",
      specialty: "Meia Maratona & TAF"
    };
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ ...trainerProfile });

  // Update edit form values on modal load
  useEffect(() => {
    if (isProfileModalOpen) {
      setEditProfileForm({ ...trainerProfile });
    }
  }, [isProfileModalOpen, trainerProfile]);

  const handleSaveProfile = () => {
    setTrainerProfile(editProfileForm);
    localStorage.setItem('TRAINER_PROFILE_DATA', JSON.stringify(editProfileForm));
    setIsProfileModalOpen(false);
  };

  // Evolution Report & Interactive SVG Chart data mappings
  const compileAthleteReportText = (ath: Athlete) => {
    const adherence = athleteAdherence[ath.id] ?? 0;
    const diagnostic = ath.id === 'lucas' 
      ? `O atleta Lucas Domingues demonstra evolução sólida na estabilização do ritmo e cadência na zona de endurance (Z2), correndo a 4'31"/km com média de 154 BPM e 180 PPM. A aderência de ${adherence}% reflete consistência adequada. Recomenda-se manter o foco na rodagem leve transicional para o TAF.`
      : `O atleta apresenta consistência geral e aderência de ${adherence}%. Nota-se bom controle cardíaco de ${ath.heartRate} BPM sob ritmo de ${ath.currentPace}/km. Continue supervisionando os estímulos regenerativos.`;

    return `========================================
RELATÓRIO DE EVOLUÇÃO ESPORTIVA
TREINADOR: ${trainerProfile.name.toUpperCase()}
========================================
ATLETA: ${ath.name.toUpperCase()}
PACE ALVO (META): ${ath.targetPace} / KM
PACE ATUAL REGISTRADO: ${ath.currentPace} / KM
DISTÂNCIA DO ÚLTIMO CICLO: ${ath.distanceKm} KM
FREQUÊNCIA CARDÍACA MÉDIA: ${ath.heartRate} BPM
CADÊNCIA DE PASSADAS DO CICLO: ${ath.cadence} PPM
ÍNDICE DE ADERÊNCIA ATUAL: ${adherence}%

DIAGNÓSTICO TÉCNICO E DIRETRIZES:
"${diagnostic}"

Gerado eletronicamente via Livelink Simulator.
========================================`;
  };

  const getEvolutionData = (id: string) => {
    switch (id) {
      case 'lucas':
        return [
          { week: 'Semana 1', pace: '04:55', rawPace: 295, volume: 8.0, hr: 158, adherence: 100 },
          { week: 'Semana 2', pace: '04:48', rawPace: 288, volume: 10.0, hr: 155, adherence: 80 },
          { week: 'Semana 3', pace: '04:42', rawPace: 282, volume: 11.0, hr: 153, adherence: 80 },
          { week: 'Semana 4', pace: '04:35', rawPace: 275, volume: 12.0, hr: 151, adherence: 100 },
          { week: 'Semana Atual', pace: '04:31', rawPace: 271, volume: 12.15, hr: 154, adherence: athleteAdherence.lucas }
        ];
      case '1':
        return [
          { week: 'Semana 1', pace: '04:22', rawPace: 262, volume: 10.0, hr: 165, adherence: 90 },
          { week: 'Semana 2', pace: '04:18', rawPace: 258, volume: 12.0, hr: 163, adherence: 85 },
          { week: 'Semana 3', pace: '04:15', rawPace: 255, volume: 13.5, hr: 162, adherence: 90 },
          { week: 'Semana 4', pace: '04:11', rawPace: 251, volume: 14.0, hr: 161, adherence: 100 },
          { week: 'Semana Atual', pace: '04:08', rawPace: 248, volume: 14.82, hr: 162, adherence: athleteAdherence['1'] }
        ];
      case '2':
        return [
          { week: 'Semana 1', pace: '04:45', rawPace: 285, volume: 6.0, hr: 155, adherence: 60 },
          { week: 'Semana 2', pace: '04:38', rawPace: 278, volume: 7.5, hr: 153, adherence: 60 },
          { week: 'Semana 3', pace: '04:35', rawPace: 275, volume: 8.0, hr: 152, adherence: 80 },
          { week: 'Semana 4', pace: '04:30', rawPace: 270, volume: 9.0, hr: 151, adherence: 40 },
          { week: 'Semana Atual', pace: '04:28', rawPace: 268, volume: 9.34, hr: 151, adherence: athleteAdherence['2'] }
        ];
      case '4':
      default:
        return [
          { week: 'Semana 1', pace: '05:20', rawPace: 320, volume: 4.0, hr: 142, adherence: 0 },
          { week: 'Semana 2', pace: '05:15', rawPace: 315, volume: 5.0, hr: 140, adherence: 0 },
          { week: 'Semana 3', pace: '05:10', rawPace: 310, volume: 5.5, hr: 139, adherence: 0 },
          { week: 'Semana 4', pace: '05:05', rawPace: 305, volume: 6.0, hr: 138, adherence: 0 },
          { week: 'Semana Atual', pace: '05:03', rawPace: 303, volume: 6.20, hr: 138, adherence: athleteAdherence['4'] }
        ];
    }
  };

  const handleCopyReportText = (ath: Athlete) => {
    const text = compileAthleteReportText(ath);
    navigator.clipboard.writeText(text);
    setReportCopied(true);
    setTimeout(() => setReportCopied(false), 2000);
  };

  // Configured initial athletes with raw telemetry waves 
  // Including Lucas Domingues connected to localStorage active progression!
  const [athletes, setAthletes] = useState<Athlete[]>([
    {
      id: 'lucas',
      name: 'Lucas Domingues',
      avatarSeed: 'L',
      targetPace: '04:30',
      currentPace: '04:31',
      distanceKm: 12.15,
      heartRate: 154,
      cadence: 180,
      status: 'active',
      telemetryStream: [42, 45, 48, 43, 40, 42, 44, 46, 45, 43, 41, 44]
    },
    {
      id: '1',
      name: 'Gustavo Henrique (Alfa)',
      avatarSeed: 'G',
      targetPace: '04:10',
      currentPace: '04:08',
      distanceKm: 14.82,
      heartRate: 162,
      cadence: 182,
      status: 'active',
      telemetryStream: [30, 45, 25, 60, 40, 75, 45, 50, 40, 85, 30, 50]
    },
    {
      id: '2',
      name: 'Mariana Costa (Beta)',
      avatarSeed: 'M',
      targetPace: '04:25',
      currentPace: '04:28',
      distanceKm: 9.34,
      heartRate: 151,
      cadence: 176,
      status: 'active',
      telemetryStream: [50, 40, 45, 30, 55, 65, 40, 60, 45, 52, 58, 62]
    },
    {
      id: '4',
      name: 'Paula Albuquerque (Delta)',
      avatarSeed: 'P',
      targetPace: '05:00',
      currentPace: '05:03',
      distanceKm: 6.2,
      heartRate: 138,
      cadence: 168,
      status: 'idle',
      telemetryStream: [20, 20, 20, 20, 20, 20, 18, 22, 20, 20, 20, 20]
    }
  ]);

  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('lucas');
  const [criticalFilter, setCriticalFilter] = useState(false);
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'PRESCREVER' | 'FEEDBACK'>('MONITOR');

  // Planilha Form editing states
  const [planilhaForm, setPlanilhaForm] = useState<PlanilhaData>(() => {
    const saved = localStorage.getItem('PLANILHA_CONFIG');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.prescriptions && parsed.zones) {
          return parsed;
        }
      } catch (e) {}
    }
    return {
      athleteName: "LUCAS DOMINGUES",
      modalidade: "corrida de rua",
      semanaTreinamento: "18 MAI ➔ 24 MAI",
      objetivo: "TAF 12 minutos",
      focoMacrociclo: "POTÊNCIA AERÓBICA MÁXIMA & RESISTÊNCIA DE VELOCIDADE PARA 21K",
      treinador: "MARCOMINI_COACH",
      zones: DEFAULT_ZONES,
      prescriptions: DEFAULT_PRESCRIPTIONS
    };
  });

  const [formSelectedDay, setFormSelectedDay] = useState<string>('SEG');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [broadcastStatusText, setBroadcastStatusText] = useState('');
  const [saveSuccessNotification, setSaveSuccessNotification] = useState(false);

  // Sync workout states marked on the athlete's screen
  const [athleteAdherence, setAthleteAdherence] = useState<Record<string, number>>({
    lucas: 60, // Fallback updated by true states
    1: 85,
    2: 40,
    4: 0
  });

  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({ curr: true, prev: false });

  // Evolution Report & Interactive SVG Chart modals states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(4);

  // Synced states and written comments for Lucas
  const [lucasFeedbacks, setLucasFeedbacks] = useState<Record<string, { comment: string; effort: number; feeling: string }>>({
    SEG: { comment: "Treino em Z2 bem suave. Ritmo excelente e respiração confortável.", effort: 4, feeling: "EXCELENTE" },
    TER: { comment: "Fortalecimento focado em panturrilha e core. Tudo certo.", effort: 5, feeling: "BOM" },
    QUA: { comment: "Tiros foram bem desgastantes, mas consegui fechar todos na média de 4'15\".", effort: 8, feeling: "CANSADO" },
    QUI: { comment: "", effort: 5, feeling: "BOM" },
    SEX: { comment: "", effort: 5, feeling: "BOM" },
    SAB: { comment: "", effort: 5, feeling: "BOM" },
    DOM: { comment: "", effort: 5, feeling: "BOM" }
  });

  const [lucasWorkoutStates, setLucasWorkoutStates] = useState<Record<string, Record<string, string>>>({
    SEG: { warmup: 'CONCLUÍDO', mainSet: 'CONCLUÍDO', coolDown: 'CONCLUÍDO' },
    TER: { warmup: 'PENDENTE', mainSet: 'PENDENTE', coolDown: 'PENDENTE' },
    QUA: { warmup: 'CONCLUÍDO', mainSet: 'PENDENTE', coolDown: 'PENDENTE' },
    QUI: { warmup: 'PENDENTE', mainSet: 'PENDENTE', coolDown: 'PENDENTE' },
    SEX: { warmup: 'PENDENTE', mainSet: 'PENDENTE', coolDown: 'PENDENTE' },
    SAB: { warmup: 'PENDENTE', mainSet: 'PENDENTE', coolDown: 'PENDENTE' },
    DOM: { warmup: 'PENDENTE', mainSet: 'PENDENTE', coolDown: 'PENDENTE' }
  });

  const getAthleteWeeklyFeedback = (athleteId: string) => {
    // 1. Lucas Domingues
    if (athleteId === 'lucas') {
      return [
        {
          id: 'curr',
          weekName: 'Semana Atual (18 Mai ➔ 24 Mai)',
          status: 'Em andamento',
          adherencePct: athleteAdherence.lucas || 60,
          days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].map((day) => {
            const dayState = lucasWorkoutStates[day] || { warmup: 'PENDENTE', mainSet: 'PENDENTE', coolDown: 'PENDENTE' };
            const dayFeedback = lucasFeedbacks[day] || { comment: '', effort: 5, feeling: 'BOM' };
            const dayPrescription = planilhaForm.prescriptions[day] || { title: `${day} - TREINO` };
            
            return {
              day,
              title: dayPrescription.title || `${day} - TREINO INTERATIVO`,
              warmup: dayState.warmup,
              mainSet: dayState.mainSet,
              coolDown: dayState.coolDown,
              comment: dayFeedback.comment,
              effort: dayFeedback.effort,
              feeling: dayFeedback.feeling,
              hasFeedback: !!dayFeedback.comment
            };
          })
        },
        {
          id: 'prev',
          weekName: 'Semana Anterior (11 Mai ➔ 17 Mai)',
          status: 'Semana Concluída',
          adherencePct: 90,
          days: [
            {
              day: 'SEG',
              title: 'SEG - 8KM CONTINUO',
              warmup: 'CONCLUÍDO',
              mainSet: 'CONCLUÍDO',
              coolDown: 'CONCLUÍDO',
              comment: 'Corrida progredindo bem. Joelho zero dores, ritmado.',
              effort: 5,
              feeling: 'EXCELENTE',
              hasFeedback: true
            },
            {
              day: 'TER',
              title: 'TER - COMPLEMENTAR',
              warmup: 'CONCLUÍDO',
              mainSet: 'CONCLUÍDO',
              coolDown: 'CONCLUÍDO',
              comment: 'Prescrição de fortalecimento focada em panturrilha e quadríceps comprida com êxito.',
              effort: 4,
              feeling: 'BOM',
              hasFeedback: true
            },
            {
              day: 'QUA',
              title: 'QUA - INTERVALADO VO2',
              warmup: 'CONCLUÍDO',
              mainSet: 'CONCLUÍDO',
              coolDown: 'CONCLUÍDO',
              comment: 'Extremamente forte o vento contra hoje, mas sustentei o ritmo em todos os tiros!',
              effort: 8,
              feeling: 'CANSADO',
              hasFeedback: true
            },
            {
              day: 'SAB',
              title: 'SAB - LONGO DA SEMANA',
              warmup: 'CONCLUÍDO',
              mainSet: 'CONCLUÍDO',
              coolDown: 'CONCLUÍDO',
              comment: 'Concluí os 50 minutos de rodagem em ritmo constante. Fôlego excelente no final.',
              effort: 6,
              feeling: 'EXCELENTE',
              hasFeedback: true
            }
          ]
        }
      ];
    }

    // 2. Gustavo Henrique
    if (athleteId === '1') {
      return [
        {
          id: 'curr',
          weekName: 'Semana Atual (18 Mai ➔ 24 Mai)',
          status: 'Em andamento',
          adherencePct: 85,
          days: [
            {
              day: 'SEG',
              title: 'SEG - TIROS LONGOS de 1000m',
              warmup: 'CONCLUÍDO',
              mainSet: 'CONCLUÍDO',
              coolDown: 'CONCLUÍDO',
              comment: 'Os tiros saíram todos abaixo da meta de 4:10/km. Me senti excelente!',
              effort: 7,
              feeling: 'EXCELENTE',
              hasFeedback: true
            },
            {
              day: 'QUA',
              title: 'QUA - RITMO FIRME 10K',
              warmup: 'CONCLUÍDO',
              mainSet: 'CONCLUÍDO',
              coolDown: 'CONCLUÍDO',
              comment: 'Rodagem leve de 10km mantendo cadência média de 182. Coração respondeu bem.',
              effort: 5,
              feeling: 'EXCELENTE',
              hasFeedback: true
            },
            {
              day: 'SAB',
              title: 'SAB - LONGO PROGRESSIVO',
              warmup: 'CONCLUÍDO',
              mainSet: 'PENDENTE',
              coolDown: 'PENDENTE',
              comment: 'Senti um leve incômodo no quadril após 12km, preferi encurtar os últimos 2km por segurança.',
              effort: 6,
              feeling: 'CANSADO',
              hasFeedback: true
            }
          ]
        },
        {
          id: 'prev',
          weekName: 'Semana Anterior (11 Mai ➔ 17 Mai)',
          status: 'Semana Concluída',
          adherencePct: 95,
          days: [
            {
              day: 'SEG',
              title: 'SEG - DESENVOLVIMENTO',
              warmup: 'CONCLUÍDO',
              mainSet: 'CONCLUÍDO',
              coolDown: 'CONCLUÍDO',
              comment: 'Rendimento muito robusto. Total controle nos batimentos cardíacos médios.',
              effort: 4,
              feeling: 'EXCELENTE',
              hasFeedback: true
            },
            {
              day: 'QUA',
              title: 'QUA - INTERVALADO EXTREMO',
              warmup: 'CONCLUÍDO',
              mainSet: 'CONCLUÍDO',
              coolDown: 'CONCLUÍDO',
              comment: 'Pace de tiro batendo 3:55/km fácil. Força nos treinos de rampa deu ótimo resultado.',
              effort: 8,
              feeling: 'EXCELENTE',
              hasFeedback: true
            }
          ]
        }
      ];
    }

    // 3. Mariana Costa
    if (athleteId === '2') {
      return [
        {
          id: 'curr',
          weekName: 'Semana Atual (18 Mai ➔ 24 Mai)',
          status: 'Em andamento',
          adherencePct: 40,
          days: [
            {
              day: 'SEG',
              title: 'SEG - TIROS INTENSOS',
              warmup: 'CONCLUÍDO',
              mainSet: 'CONCLUÍDO',
              coolDown: 'CONCLUÍDO',
              comment: 'Treino com bastante vento lateral. Tiros desafiadores mas meta cumprida.',
              effort: 7,
              feeling: 'BOM',
              hasFeedback: true
            },
            {
              day: 'QUA',
              title: 'QUA - RITMO DE BASE',
              warmup: 'CONCLUÍDO',
              mainSet: 'PENDENTE',
              coolDown: 'PENDENTE',
              comment: 'Precisei adaptar o volume devido ao trabalho, fiz apenas aquecimento e rodagem curta de 20min.',
              effort: 5,
              feeling: 'BOM',
              hasFeedback: true
            }
          ]
        },
        {
          id: 'prev',
          weekName: 'Semana Anterior (11 Mai ➔ 17 Mai)',
          status: 'Semana Concluída',
          adherencePct: 75,
          days: [
            {
              day: 'SEG',
              title: 'SEG - PROGRESSÃO Z1-Z2-Z3',
              warmup: 'CONCLUÍDO',
              mainSet: 'CONCLUÍDO',
              coolDown: 'CONCLUÍDO',
              comment: 'Início confortável in Z1, progredindo sem sobressaltos para Z3 no final.',
              effort: 5,
              feeling: 'BOM',
              hasFeedback: true
            },
            {
              day: 'SAB',
              title: 'SAB - LONGO DE RESISTÊNCIA',
              warmup: 'CONCLUÍDO',
              mainSet: 'CONCLUÍDO',
              coolDown: 'CONCLUÍDO',
              comment: 'Senti cansaço acumulado nas panturrilhas após o km 10. Alonguei bem no pós.',
              effort: 6,
              feeling: 'CANSADO',
              hasFeedback: true
            }
          ]
        }
      ];
    }

    // 4. Paula Albuquerque
    if (athleteId === '4') {
      return [
        {
          id: 'curr',
          weekName: 'Semana Atual (18 Mai ➔ 24 Mai)',
          status: 'Suspenso',
          adherencePct: 0,
          days: [
            {
              day: 'SEG',
              title: 'SEG - TECNICA & POSTURA',
              warmup: 'PENDENTE',
              mainSet: 'PENDENTE',
              coolDown: 'PENDENTE',
              comment: 'Ainda com sintomas fortes de resfriado e com febre. Não tenho condições físicas para rodar.',
              effort: 9,
              feeling: 'FATIGADO',
              hasFeedback: true
            }
          ]
        },
        {
          id: 'prev',
          weekName: 'Semana Anterior (11 Mai ➔ 17 Mai)',
          status: 'Semana Concluída',
          adherencePct: 80,
          days: [
            {
              day: 'SEG',
              title: 'SEG - RITMO CONTROLADO',
              warmup: 'CONCLUÍDO',
              mainSet: 'CONCLUÍDO',
              coolDown: 'CONCLUÍDO',
              comment: 'Fôlego ótimo. Consegui completar os 30 minutos previstos.',
              effort: 5,
              feeling: 'EXCELENTE',
              hasFeedback: true
            },
            {
              day: 'QUA',
              title: 'QUA - FORTALECIMENTO',
              warmup: 'CONCLUÍDO',
              mainSet: 'CONCLUÍDO',
              coolDown: 'CONCLUÍDO',
              comment: 'Sem dores na tíbia. Fortalecimento de quadríceps ajudou na estabilização.',
              effort: 4,
              feeling: 'EXCELENTE',
              hasFeedback: true
            }
          ]
        }
      ];
    }

    return [];
  };

  // Fetch real-time states checklist dynamic data
  const updateRealAdherence = () => {
    const savedStates = localStorage.getItem('LUCAS_WORKOUT_STATES');
    if (savedStates) {
      try {
        const parsed = JSON.parse(savedStates);
        setLucasWorkoutStates(parsed);
        let checkedCount = 0;
        let totalCount = 0;
        Object.values(parsed).forEach((dayState: any) => {
          if (dayState.warmup === 'CONCLUÍDO') checkedCount++;
          if (dayState.mainSet === 'CONCLUÍDO') checkedCount++;
          if (dayState.coolDown === 'CONCLUÍDO') checkedCount++;
          
          if (dayState.warmup === 'ADAPTADO') checkedCount += 0.5;
          if (dayState.mainSet === 'ADAPTADO') checkedCount += 0.5;
          if (dayState.coolDown === 'ADAPTADO') checkedCount += 0.5;
          
          totalCount += 3;
        });
        const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 60;
        setAthleteAdherence(prev => ({
          ...prev,
          lucas: pct
        }));
      } catch (e) {}
    }

    const savedFeedbacks = localStorage.getItem('LUCAS_ATHLETE_FEEDBACK_DICT');
    if (savedFeedbacks) {
      try {
        const parsed = JSON.parse(savedFeedbacks);
        setLucasFeedbacks(parsed);
      } catch (e) {}
    }
  };

  useEffect(() => {
    updateRealAdherence();
    // Also attach focusing updates to reflect changes in the storage
    window.addEventListener('focus', updateRealAdherence);
    return () => window.removeEventListener('focus', updateRealAdherence);
  }, []);

  // Background physiological fluctuation drift stream
  useEffect(() => {
    const interval = setInterval(() => {
      setAthletes(prevAthletes => 
        prevAthletes.map(ath => {
          if (ath.status !== 'active') return ath;
          
          const hrDrift = Math.random() > 0.5 ? 1 : -1;
          const cadenceDrift = Math.random() > 0.6 ? (Math.random() > 0.5 ? 2 : -2) : 0;
          
          const lastStreams = [...ath.telemetryStream.slice(1)];
          const t = Date.now() / 1000;
          const nextVal = Math.max(15, Math.min(95, 
            40 + Math.sin(t * 1.5) * 20 + Math.cos(t * 0.8) * 15 + (Math.random() * 8)
          ));
          lastStreams.push(nextVal);

          return {
            ...ath,
            heartRate: Math.max(120, Math.min(185, ath.heartRate + hrDrift)),
            cadence: Math.max(160, Math.min(195, ath.cadence + cadenceDrift)),
            distanceKm: parseFloat((ath.distanceKm + 0.003).toFixed(3)),
            telemetryStream: lastStreams
          };
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Filter out athletes
  const displayedAthletes = criticalFilter 
    ? athletes.filter(a => a.heartRate > 160 && a.status === 'active')
    : athletes;

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId) || athletes[0];

  // Render fluid telemetry sparklines
  const renderFlowLine = (dataPoints: number[], colorGradient: string = "url(#curveGlowGrad)") => {
    const totalWidth = 320;
    const totalHeight = 48;
    const padding = 6;
    
    const count = dataPoints.length;
    const points = dataPoints.map((val, index) => {
      const x = padding + (index / (count - 1)) * (totalWidth - padding * 2);
      const y = totalHeight - padding - (val / 100) * (totalHeight - padding * 2);
      return { x, y };
    });

    let dPattern = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cpX = points[i-1].x + (points[i].x - points[i-1].x) / 2;
      dPattern += ` C ${cpX} ${points[i-1].y}, ${cpX} ${points[i].y}, ${points[i].x} ${points[i].y}`;
    }

    return (
      <svg className="w-full h-11 opacity-90" viewBox={`0 0 ${totalWidth} ${totalHeight}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="curveGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="curveGlowGradLucas" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path
          d={dPattern}
          fill="none"
          stroke={selectedAthleteId === 'lucas' ? "url(#curveGlowGradLucas)" : colorGradient}
          strokeWidth="2"
          className="transition-all"
        />
        <path
          d={dPattern}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  // Broadcast prescription sync simulator 
  const handlePublishPlanilha = () => {
    setIsBroadcasting(true);
    setBroadcastProgress(0);
    setBroadcastStatusText("Conectando à rede de telemetria esportiva...");

    const steps = [
      { p: 15, t: "Sincronizando ID do Atleta: LUCAS DOMINGUES" },
      { p: 40, t: "Alocando limites de intensidade cardíaca Z1-Z5..." },
      { p: 70, t: "Transmitindo cronogramas e blocos de treinamento (.GXP)" },
      { p: 90, t: "Compilando consistência biométrica..." },
      { p: 100, t: "Planilha transmitida com sucesso para o atleta!" }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setBroadcastProgress(steps[currentStep].p);
        setBroadcastStatusText(steps[currentStep].t);
        currentStep++;
      } else {
        clearInterval(interval);
        // Persist to localStorage!
        localStorage.setItem('PLANILHA_CONFIG', JSON.stringify(planilhaForm));
        
        // Triggers storage events on active tabs
        window.dispatchEvent(new Event('focus'));
        
        setTimeout(() => {
          setIsBroadcasting(false);
          setSaveSuccessNotification(true);
          updateRealAdherence();
          setTimeout(() => setSaveSuccessNotification(false), 3000);
        }, 1000);
      }
    }, 700);
  };

  // Modify individual fields
  const updateGeneralField = (field: keyof PlanilhaData, val: string) => {
    setPlanilhaForm(prev => ({
      ...prev,
      [field]: val
    }));
  };

  // Modify cardiac zones pace
  const updateZonePace = (index: number, newPace: string) => {
    const updatedZones = [...planilhaForm.zones];
    updatedZones[index].pace = newPace;
    setPlanilhaForm(prev => ({
      ...prev,
      zones: updatedZones
    }));
  };

  // Modify cardiac zones description
  const updateZoneDesc = (index: number, newDesc: string) => {
    const updatedZones = [...planilhaForm.zones];
    updatedZones[index].desc = newDesc;
    setPlanilhaForm(prev => ({
      ...prev,
      zones: updatedZones
    }));
  };

  // Modify daily details
  const updatePrescriptionField = (day: string, field: keyof DayPrescription, val: string) => {
    const dayData = planilhaForm.prescriptions[day] || {
      title: `${day} - TREINO`,
      badge: "CORRIDA PRESCRITA",
      subBadge: "ZONAS DE TREINAMENTO",
      warmup: "-",
      mainSet: "-",
      coolDown: "-"
    };

    setPlanilhaForm(prev => ({
      ...prev,
      prescriptions: {
        ...prev.prescriptions,
        [day]: {
          ...dayData,
          [field]: val
        }
      }
    }));
  };

  return (
    <div className={`relative w-full min-h-screen transition-colors duration-300 flex flex-col justify-between p-4 ${
      theme === 'light' ? 'bg-[#f5f5f7] text-[#1c1c1e]' : 'bg-[#000000] text-white'
    }`} id="trainer-dashboard-root">
      
      {/* INTERACTIVE TRAINER PROFILE EDITOR MODAL */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            id="trainer-profile-modal"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-sm p-5 border rounded-2xl shadow-xl font-mono text-[10px] ${
                theme === 'light' ? 'bg-white border-neutral-200 text-neutral-900' : 'bg-neutral-950 border-neutral-850 text-white'
              }`}
            >
              <div className="flex justify-between items-center border-b pb-3 mb-4 border-neutral-250 dark:border-neutral-850">
                <span className="text-xs font-black tracking-widest uppercase">EDITAR CREDENCIAIS DE TREINADOR</span>
                <button 
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-2 py-0.5 border rounded cursor-pointer transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900 uppercase font-black tracking-wide"
                >
                  X
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-neutral-500 font-bold block uppercase">NOME DO TREINADOR</label>
                  <input 
                    type="text"
                    value={editProfileForm.name}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                    className={`w-full px-2.5 py-2 text-[10px] border rounded focus:outline-none uppercase ${
                      theme === 'light' 
                        ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-neutral-500' 
                        : 'bg-black border-neutral-850 text-white focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-500 font-bold block uppercase">CARGO / FUNÇÃO</label>
                  <input 
                    type="text"
                    value={editProfileForm.role}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, role: e.target.value })}
                    className={`w-full px-2.5 py-2 text-[10px] border rounded focus:outline-none uppercase ${
                      theme === 'light' 
                        ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-neutral-500' 
                        : 'bg-black border-neutral-850 text-white focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-500 font-bold block uppercase">BIOGRAFIA & REGISTRO</label>
                  <textarea 
                    rows={3}
                    value={editProfileForm.bio}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })}
                    className={`w-full p-2 text-[10px] border rounded focus:outline-none uppercase resize-none ${
                      theme === 'light' 
                        ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-neutral-500' 
                        : 'bg-black border-neutral-850 text-white focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-neutral-500 font-bold block uppercase">EXPERIÊNCIA</label>
                    <input 
                      type="text"
                      value={editProfileForm.experience}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, experience: e.target.value })}
                      className={`w-full px-2.5 py-2 text-[10px] border rounded focus:outline-none uppercase ${
                        theme === 'light' 
                          ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-neutral-500' 
                          : 'bg-black border-neutral-850 text-white focus:border-emerald-500'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-neutral-500 font-bold block uppercase">ESPECIALIDADE</label>
                    <input 
                      type="text"
                      value={editProfileForm.specialty}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, specialty: e.target.value })}
                      className={`w-full px-2.5 py-2 text-[10px] border rounded focus:outline-none uppercase ${
                        theme === 'light' 
                          ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-neutral-500' 
                          : 'bg-black border-neutral-850 text-white focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 text-[9px]">
                <button 
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className={`px-3 py-2 border rounded uppercase transition-colors cursor-pointer ${
                    theme === 'light' ? 'border-neutral-305 text-neutral-605 hover:bg-neutral-100' : 'border-neutral-800 text-neutral-400 hover:bg-neutral-900'
                  }`}
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded uppercase transition-colors hover:bg-emerald-550 cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wireless synchronization simulated interface */}
      <AnimatePresence>
        {isBroadcasting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-md ${
              theme === 'light' ? 'bg-white/95 text-neutral-900' : 'bg-black/95 text-white'
            }`}
            id="transmission-overlay"
          >
            <div className="w-full max-w-xs space-y-6 text-center">
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping" />
                <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-500 flex items-center justify-center text-emerald-400">
                  <Send className="w-5 h-5 animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-2">
                <span className="text-[8px] font-mono tracking-[0.3em] text-emerald-500 uppercase font-black block">TRANSMISSÃO TELEMÉTRICA</span>
                <p className={`text-[10px] font-mono min-h-8 px-2 font-medium ${
                  theme === 'light' ? 'text-neutral-600' : 'text-neutral-400'
                }`}>
                  {broadcastStatusText}
                </p>
              </div>

              {/* High precision loading percentage bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-mono text-neutral-500">
                  <span>GPX_STREAM</span>
                  <span>{broadcastProgress}%</span>
                </div>
                <div className={`w-full h-1 rounded-full overflow-hidden border ${
                  theme === 'light' ? 'bg-neutral-200 border-neutral-300' : 'bg-neutral-900 border-neutral-950'
                }`}>
                  <motion.div 
                    className="h-full bg-emerald-500 shadow-[0_0_8px_#10b981]"
                    animate={{ width: `${broadcastProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Success Floating feedback toast */}
      <AnimatePresence>
        {saveSuccessNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-40 bg-emerald-900 border border-emerald-500 text-emerald-100 font-mono text-[9px] font-bold py-2.5 px-4 tracking-widest uppercase rounded-lg shadow-lg flex items-center gap-2"
          >
            <Award className="w-3.5 h-3.5" />
            Sincronizado &amp; Publicado com Sucesso!
          </motion.div>
        )}
      </AnimatePresence>

      {/* ATHLETE EVOLUTION REPORT MODAL */}
      <AnimatePresence>
        {isReportModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 selection:bg-emerald-950 font-mono"
            id="athlete-report-modal"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-sm p-5 border rounded-2xl shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto ${
                theme === 'light' ? 'bg-white border-neutral-200 text-neutral-900' : 'bg-neutral-950 border-neutral-850 text-white'
              }`}
            >
              <div className="flex justify-between items-center border-b pb-3 border-neutral-200 dark:border-neutral-850">
                <div className="flex flex-col">
                  <span className="text-[7px] text-emerald-500 font-bold tracking-widest uppercase mb-0.5">TELEMETRIA COMPILADA</span>
                  <span className="text-xs font-black tracking-widest uppercase">RELATÓRIO DE EVOLUÇÃO</span>
                </div>
                <button 
                  onClick={() => setIsReportModalOpen(false)}
                  className={`px-2 py-1.5 border rounded-lg cursor-pointer text-xs font-black transition-all ${
                    theme === 'light' ? 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                  title="Fechar"
                >
                  X
                </button>
              </div>

              {/* Patient/Athlete meta details */}
              <div className={`p-3 rounded-xl border flex flex-col gap-1 tracking-wide ${
                theme === 'light' ? 'bg-neutral-50 border-neutral-150' : 'bg-neutral-900/40 border-neutral-900'
              }`}>
                <div className="flex justify-between items-center text-[7.5px] uppercase border-b pb-1.5 border-neutral-200 dark:border-neutral-800/80 mb-1.5">
                  <span className="text-neutral-500 font-bold">ATLETA SELECIONADO</span>
                  <span className={`px-1.5 py-0.2 rounded font-black ${theme === 'light' ? 'bg-neutral-950 text-white animate-none' : 'bg-white text-black'}`}>{selectedAthlete.name}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[8.5px]">
                  <div>
                    <span className="text-neutral-500 block uppercase font-bold text-[6.5px]">Pace Esperado (Meta)</span>
                    <span className="font-extrabold text-emerald-500">{selectedAthlete.targetPace} / km</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block uppercase font-bold text-[6.5px]">Pace Real do Ciclo</span>
                    <span className={`font-extrabold ${theme === 'light' ? 'text-neutral-950' : 'text-white'}`}>{selectedAthlete.currentPace} / km</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block uppercase font-bold text-[6.5px]">Aderência Mensurada</span>
                    <span className="font-extrabold text-emerald-500">{athleteAdherence[selectedAthlete.id] || 0}%</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block uppercase font-bold text-[6.5px]">Volume Acumulado</span>
                    <span className={`font-extrabold ${theme === 'light' ? 'text-neutral-950' : 'text-white'}`}>{selectedAthlete.id === 'lucas' ? '48.60' : '36.80'} KM</span>
                  </div>
                </div>
              </div>

              {/* Coach text-clinical diagnosis block card */}
              <div className="space-y-1 text-left">
                <span className="text-[7.5px] tracking-widest text-neutral-500 uppercase font-black block">ANÁLISE DO TREINADOR</span>
                <div className={`p-3 rounded-xl border italic leading-relaxed text-[9px] ${
                  theme === 'light' ? 'bg-neutral-50 border-neutral-150 text-neutral-700' : 'bg-neutral-950 border-neutral-900 text-neutral-400 font-medium'
                }`}>
                  "{selectedAthlete.id === 'lucas' 
                    ? `O atleta Lucas Domingues demonstra evolução sólida na estabilização do ritmo e cadência na zona de endurance (Z2), correndo a 4'31"/km com média de 154 BPM e 180 PPM. A aderência de ${athleteAdherence.lucas}% reflete consistência adequada. Recomenda-se manter o foco na rodagem leve transicional para o TAF.`
                    : `O atleta apresenta consistência geral e aderência de ${athleteAdherence[selectedAthlete.id] || 0}%. Nota-se bom controle cardíaco de ${selectedAthlete.heartRate} BPM sob ritmo de ${selectedAthlete.currentPace}/km. Continue supervisionando os estímulos regenerativos.`}"
                </div>
              </div>

              {/* Interactive buttons bar */}
              <div className="flex flex-col gap-1.5 mt-2">
                <button
                  onClick={() => handleCopyReportText(selectedAthlete)}
                  className="w-full py-2.5 px-4 font-mono font-black tracking-widest text-[9px] rounded-lg text-black bg-emerald-400 hover:bg-emerald-350 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                >
                  {reportCopied ? '✓ COPIADO COM SUCESSO!' : 'COPIAR TEXTO DO RELATÓRIO'}
                </button>
                <button
                  onClick={() => {
                    alert('Livelink: Relatório exportado com sucesso no formato PDF executivo! Salvo na pasta /exports/.')
                  }}
                  className={`w-full py-2.5 px-4 font-mono font-black tracking-widest text-[9px] rounded-lg border transition-all active:scale-98 cursor-pointer uppercase ${
                    theme === 'light' ? 'bg-neutral-100 border-neutral-300 text-neutral-900 hover:bg-neutral-200' : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  SALVAR EM PDF (SIMULADO)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ATHLETE PROGRESSION TREND SVG CHART MODAL */}
      <AnimatePresence>
        {isEvolutionModalOpen && (() => {
          const evolutionData = getEvolutionData(selectedAthlete.id);
          const minPaceObj = Math.min(...evolutionData.map(d => d.rawPace));
          const maxPaceObj = Math.max(...evolutionData.map(d => d.rawPace));
          const paceDiff = maxPaceObj - minPaceObj || 1;
          
          // Coordinate mappings for the dynamic SVG chart (width=300, height=120)
          const points = evolutionData.map((d, index) => {
            const x = 35 + (index * 58);
            // Mathematically mapped: fastest pace index (minPaceObj) translates to top (y=20), slowest (maxPaceObj) to bottom (y=85)
            const y = 20 + ((d.rawPace - minPaceObj) / paceDiff) * 65;
            return { x, y, data: d, index };
          });

          // Draw bezier curve or segmented lines
          const pathD = points.reduce((acc, p, index) => {
            return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
          }, '');

          const fillD = points.length > 0 
            ? `${pathD} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z` 
            : '';

          const selectedPoint = points[hoveredPointIndex !== null ? hoveredPointIndex : 4] || points[4];

          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 selection:bg-emerald-950 font-mono"
              id="athlete-chart-modal"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className={`w-full max-w-sm p-5 border rounded-2xl shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto ${
                  theme === 'light' ? 'bg-white border-neutral-200 text-neutral-900' : 'bg-neutral-950 border-neutral-850 text-white'
                }`}
              >
                <div className="flex justify-between items-center border-b pb-3 border-neutral-200 dark:border-neutral-850">
                  <div className="flex flex-col">
                    <span className="text-[7px] text-emerald-500 font-bold tracking-widest uppercase mb-0.5">TELEMETRIA PROGRESSIVA</span>
                    <span className="text-xs font-black tracking-widest uppercase">GRAFICO DE EVOLUÇÃO</span>
                  </div>
                  <button 
                    onClick={() => setIsEvolutionModalOpen(false)}
                    className={`px-2 py-1.5 border rounded-lg cursor-pointer text-xs font-black transition-all ${
                      theme === 'light' ? 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                    title="Fechar"
                  >
                    X
                  </button>
                </div>

                {/* Main Graph View panel */}
                <div className={`p-4 rounded-xl border text-center flex flex-col gap-1 relative overflow-hidden ${
                  theme === 'light' ? 'bg-neutral-50 border-neutral-150' : 'bg-[#000000] border-neutral-900'
                }`}>
                  <span className="text-[8px] uppercase text-neutral-500 font-bold tracking-widest block mb-1 text-left">
                    RITMO DE EVOLUÇÃO GERAL (MIN:SEGUNDOS)
                  </span>

                  {/* SVG Chart area */}
                  <div className="relative w-full h-32 flex items-center justify-center">
                    <svg viewBox="0 0 300 120" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="chart-fill-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
                        </linearGradient>
                      </defs>

                      {/* Dashed background reference lines */}
                      <line x1="20" y1="20" x2="280" y2="20" stroke={theme === 'light' ? '#e5e5e5' : '#171717'} strokeDasharray="3 3" />
                      <line x1="20" y1="52.5" x2="280" y2="52.5" stroke={theme === 'light' ? '#e5e5e5' : '#171717'} strokeDasharray="3 3" />
                      <line x1="20" y1="85" x2="280" y2="85" stroke={theme === 'light' ? '#e5e5e5' : '#171717'} strokeDasharray="3 3" />
                      <line x1="20" y1="100" x2="280" y2="100" stroke={theme === 'light' ? '#e5e5e5' : '#171717'} strokeDasharray="2 2" />

                      {/* UNDER FLOW ACCENT FILL */}
                      {fillD && <path d={fillD} fill="url(#chart-fill-grad)" />}

                      {/* PATH LINE */}
                      {pathD && <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                      {/* DATA INTERACTIVE KNOB DOTS */}
                      {points.map((p) => {
                        const isSelected = selectedPoint.index === p.index;
                        return (
                          <g key={p.index} className="cursor-pointer">
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r={isSelected ? 10 : 7} 
                              className="fill-emerald-500/10 pointer-events-auto transition-all"
                              onMouseEnter={() => setHoveredPointIndex(p.index)}
                              onClick={() => setHoveredPointIndex(p.index)}
                            />
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r={isSelected ? 4 : 3} 
                              className={`transition-all ${isSelected ? 'fill-emerald-400' : 'fill-emerald-650'}`}
                            />
                            {/* Label underneath point */}
                            <text 
                              x={p.x} 
                              y="114" 
                              textAnchor="middle" 
                              className="fill-neutral-500 text-[6.5px] font-sans font-black tracking-wide uppercase"
                            >
                              {p.index === 4 ? 'HOJE' : `S0${p.index + 1}`}
                            </text>
                            {/* Pace value printed near peak dot */}
                            <text 
                              x={p.x} 
                              y={p.y - 8} 
                              textAnchor="middle" 
                              className={`text-[6.5px] font-mono font-black ${
                                isSelected 
                                  ? (theme === 'light' ? 'fill-neutral-950 text-[7px]' : 'fill-white text-[7px]') 
                                  : 'fill-neutral-400'
                              }`}
                            >
                              {p.data.pace}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <span className="text-[6px] text-neutral-500 block text-right mt-1.5 uppercase">
                    ANÁLISE ADAPTATIVA (PASSE O MOUSE OU CLIQUE)
                  </span>
                </div>

                {/* Point details viewer card panel */}
                <div className={`p-3 rounded-xl border flex flex-col gap-1 tracking-wide ${
                  theme === 'light' ? 'bg-neutral-50 border-neutral-150' : 'bg-neutral-900/40 border-neutral-900'
                }`}>
                  <div className="flex justify-between items-center text-[7.5px] uppercase border-b pb-1.5 border-neutral-200 dark:border-neutral-800/80 mb-2">
                    <span className="text-neutral-500 font-bold">CICLO SELECIONADO</span>
                    <span className="font-extrabold text-emerald-500">{selectedPoint.data.week.toUpperCase()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-[8px]">
                    <div>
                      <span className="text-neutral-500 block uppercase font-bold text-[6px]">Ritmo Registrado</span>
                      <span className={`font-black text-xs ${theme === 'light' ? 'text-neutral-950' : 'text-white'}`}>{selectedPoint.data.pace} / km</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block uppercase font-bold text-[6px]">Aderência Mensurada</span>
                      <span className="font-black text-emerald-500">{selectedPoint.data.adherence}%</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block uppercase font-bold text-[6px]">Frequência Cardíaca</span>
                      <span className={`font-bold ${theme === 'light' ? 'text-neutral-950' : 'text-white'}`}>{selectedPoint.data.hr} BPM</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block uppercase font-bold text-[6px]">Metragem Rodada</span>
                      <span className={`font-bold ${theme === 'light' ? 'text-neutral-950' : 'text-white'}`}>{selectedPoint.data.volume} KM</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-2 border-neutral-200 dark:border-neutral-900">
                  <p className="text-[7px] italic text-neutral-500 leading-relaxed uppercase text-center">
                    "O ALICERCE HISTÓRICO DE DADOS PERMITE DETERMINAR COM EXATIDÃO A MARGEM DE RENDIMENTO E SUPLEMENTAR O MACROCICLO."
                  </p>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* TOP HEADER STATUS PANEL */}
      <div className={`flex flex-col gap-3.5 p-4 rounded-xl relative transition-all duration-300 ${
        theme === 'light' ? 'liquid-glass-light text-neutral-900 shadow-lg' : 'liquid-glass text-white shadow-2xl'
      }`}>
        {/* Animated fluid scanning line inside header glass container */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent shadow-[0_0_8px_#10b981]" />

        <div className="flex justify-between items-center pt-0.5 pointer-events-auto">
          <div className="flex flex-col">
            <h1 className={`text-xs sm:text-sm font-black font-mono tracking-[0.20em] transition-colors leading-tight uppercase ${
              theme === 'light' ? 'text-neutral-950' : 'text-white'
            }`}>
              {trainerProfile.name}
            </h1>
            <span className={`text-[8.5px] font-mono tracking-[0.20em] uppercase block font-semibold ${
              theme === 'light' ? 'text-neutral-500' : 'text-neutral-400'
            }`}>
              PARA ATLETAS CORREDORES
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded-full font-mono text-[7px] tracking-widest uppercase font-black transition-all ${
            theme === 'light' 
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-600 shadow-sm' 
              : 'bg-[#10b981]/15 border border-[#10b981]/40 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
          }`}>
            LIVELINK ACTIVE
          </span>
        </div>

        {/* PROFILE OPTIONS UTILITY CONTROLS BAR (Matches exactly with initial menu, toggle clear/dark adapt, and edit button) */}
        <div className="flex items-center justify-between gap-2.5 mt-0.5 font-mono">
          <span className={`px-1.5 py-0.5 rounded text-[7px] tracking-wider uppercase font-black transition-colors ${
            theme === 'light' 
              ? 'bg-neutral-100 border border-neutral-200 text-neutral-800' 
              : 'bg-neutral-950 border border-neutral-900 text-emerald-400'
          }`}>
            CONEXÃO ATIVA
          </span>

          <div className="flex items-center gap-1.5">
            {/* Palette button (theme toggle) */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className={`w-8.5 h-8.5 rounded-lg border flex items-center justify-center transition-all duration-300 shadow-xs active:scale-95 cursor-pointer ${
                theme === 'light' 
                  ? 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-black hover:border-neutral-350 shadow-neutral-100' 
                  : 'bg-neutral-950 border-neutral-850 text-neutral-300 hover:bg-neutral-900 hover:text-white hover:border-neutral-750 shadow-none'
              }`}
              title="Trocar Tema da Paleta"
            >
              <Palette className="w-4 h-4 stroke-[1.8]" />
            </button>

            {/* Profile view/edit button */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className={`w-8.5 h-8.5 rounded-lg border flex items-center justify-center transition-all duration-300 shadow-xs active:scale-95 cursor-pointer ${
                theme === 'light' 
                  ? 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-black hover:border-neutral-350 shadow-neutral-100' 
                  : 'bg-neutral-950 border-neutral-850 text-neutral-300 hover:bg-neutral-900 hover:text-white hover:border-neutral-750 shadow-none'
              }`}
              title="Visualizar Perfil"
            >
              <User className="w-4 h-4 stroke-[1.8]" />
            </button>

            {/* Logout/Sair button styled exactly like reference image */}
            <button
              onClick={onBackToRunner}
              className={`w-8.5 h-8.5 rounded-lg border flex items-center justify-center transition-all duration-300 shadow-xs active:scale-95 cursor-pointer ${
                theme === 'light' 
                  ? 'bg-white border-neutral-200 text-neutral-700 hover:bg-red-50 hover:border-red-200 hover:text-red-650' 
                  : 'bg-neutral-950 border-neutral-850 text-neutral-300 hover:bg-red-950/40 hover:border-red-900/40 hover:text-red-400'
              }`}
              title="Sair / Fechar Simulador"
            >
              <LogOut className="w-4 h-4 stroke-[1.8]" />
            </button>
          </div>
        </div>

        {/* Dynamic Workspace tab controllers */}
        <div className={`grid grid-cols-3 p-1 rounded-xl transition-all ${
          theme === 'light' ? 'bg-neutral-950/5 border border-neutral-950/10' : 'bg-white/5 border border-white/5 shadow-inner'
        }`}>
          <button
            onClick={() => setActiveTab('MONITOR')}
            className={`py-2 px-1 font-mono font-bold text-[8.5px] tracking-widest rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'MONITOR' 
                ? 'bg-emerald-500 text-black font-black shadow-md' 
                : `${theme === 'light' ? 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-950/5' : 'text-neutral-350 hover:text-white hover:bg-white/5'}`
            }`}
          >
            <Users className="w-3.5 h-3.5 animate-pulse" />
            ATLETAS
          </button>
          
          <button
            onClick={() => setActiveTab('PRESCREVER')}
            className={`py-2 px-1 font-mono font-bold text-[8.5px] tracking-widest rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'PRESCREVER' 
                ? 'bg-emerald-500 text-black font-black shadow-md' 
                : `${theme === 'light' ? 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-950/5' : 'text-neutral-350 hover:text-white hover:bg-white/5'}`
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            PRESCREVER
          </button>

          <button
            onClick={() => setActiveTab('FEEDBACK')}
            className={`py-2 px-1 font-mono font-bold text-[8.5px] tracking-widest rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'FEEDBACK' 
                ? 'bg-emerald-500 text-black font-black shadow-md' 
                : `${theme === 'light' ? 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-950/5' : 'text-neutral-350 hover:text-white hover:bg-white/5'}`
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            FEEDBACKS
          </button>
        </div>
      </div>

      {/* TAB 1: RUNNERS METRICS & SELECTION INDEX */}
      {activeTab === 'MONITOR' && (
        <div className="flex-grow flex flex-col gap-4 mt-4" id="monitor-content-area">
          <div className={`flex justify-between items-center text-[8.5px] font-mono tracking-widest uppercase ${
            theme === 'light' ? 'text-neutral-600' : 'text-neutral-500'
          }`}>
            <span>ATLETAS CADASTRADOS (ORDEM ALFABÉTICA)</span>
            <span>TOTAL: {athletes.length} Alunos</span>
          </div>

          <div className={`flex flex-col overflow-hidden transition-all duration-300 rounded-2xl ${
            theme === 'light' 
              ? 'liquid-glass-light shadow-md divide-y divide-neutral-200/50' 
              : 'liquid-glass divide-y divide-white/5'
          }`}>
            {[...athletes]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((ath) => {
                const isSelected = ath.id === selectedAthleteId;

                return (
                  <div
                    key={ath.id}
                    onClick={() => {
                      setSelectedAthleteId(ath.id);
                      setPlanilhaForm(prev => ({
                        ...prev,
                        athleteName: ath.name.toUpperCase()
                      }));
                      setActiveTab('PRESCREVER');
                    }}
                    className={`px-5 py-4 transition-all duration-300 cursor-pointer flex items-center justify-between group active:scale-[0.99] ${
                      isSelected
                        ? (theme === 'light' ? 'bg-emerald-500/10 text-[#047857] font-black' : 'bg-emerald-500/10 text-emerald-400 font-extrabold shadow-inner')
                        : (theme === 'light' ? 'hover:bg-neutral-950/5 text-neutral-800' : 'hover:bg-white/5 text-neutral-200')
                    }`}
                  >
                    <span className="font-mono text-[10.5px] tracking-widest uppercase group-hover:text-emerald-500 transition-colors">
                      {ath.name}
                    </span>
                    <span className={`text-[9px] group-hover:text-emerald-500 tracking-wider transition-all font-bold ${
                      theme === 'light' ? 'text-neutral-500 font-medium' : 'text-neutral-400'
                    }`}>
                      {isSelected ? '✓ SELECIONADO ➔' : 'SELECIONAR ➔'}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: STRUCTURAL TRAINING PRESCRIPTION ENGINE */}
      {activeTab === 'PRESCREVER' && (
        <div className="flex-grow flex flex-col gap-4 mt-4" id="prescribir-content-area">
          
          {/* Athlete Profile Summary configuration indicators */}
          <div className={`p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl liquid-sheen ${
            theme === 'light' ? 'liquid-glass-light shadow-md' : 'liquid-glass shadow-xl'
          }`}>
            <span className={`text-[7.5px] font-mono tracking-widest uppercase block font-black border-b pb-2 ${
              theme === 'light' ? 'border-neutral-200 text-neutral-600' : 'border-neutral-900 text-neutral-400'
            }`}>
              DADOS GERAIS DO ALUNO PRINCIPAL
            </span>

            <div className="grid grid-cols-2 gap-3 text-[9px] font-mono p-1">
              <div className="space-y-1">
                <label className={`${theme === 'light' ? 'text-neutral-500 font-bold block' : 'text-neutral-450 font-bold block'}`}>NOME DO ATLETA</label>
                <input 
                  type="text"
                  value={planilhaForm.athleteName}
                  onChange={(e) => updateGeneralField('athleteName', e.target.value)}
                  className={`px-3 py-2 w-full text-[10px] rounded focus:outline-none uppercase font-mono tracking-wide ${
                    theme === 'light' 
                      ? 'bg-neutral-50 border border-neutral-250 text-neutral-950 focus:border-neutral-500' 
                      : 'bg-black border border-neutral-850 text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className={`${theme === 'light' ? 'text-neutral-500 font-bold block' : 'text-neutral-450 font-bold block'}`}>MODELO / ESPORTE</label>
                <input 
                  type="text"
                  value={planilhaForm.modalidade}
                  onChange={(e) => updateGeneralField('modalidade', e.target.value)}
                  className={`px-3 py-2 w-full text-[10px] rounded focus:outline-none uppercase font-mono tracking-wide ${
                    theme === 'light' 
                      ? 'bg-neutral-50 border border-neutral-250 text-neutral-950 focus:border-neutral-500' 
                      : 'bg-black border border-neutral-850 text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className={`${theme === 'light' ? 'text-neutral-500 font-bold block' : 'text-neutral-450 font-bold block'}`}>VALIDADE / DATA</label>
                <input 
                  type="text"
                  value={planilhaForm.semanaTreinamento}
                  onChange={(e) => updateGeneralField('semanaTreinamento', e.target.value)}
                  className={`px-3 py-2 w-full text-[10px] rounded focus:outline-none uppercase font-mono tracking-wide ${
                    theme === 'light' 
                      ? 'bg-neutral-50 border border-neutral-250 text-neutral-950 focus:border-neutral-500' 
                      : 'bg-black border border-neutral-850 text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className={`${theme === 'light' ? 'text-neutral-500 font-bold block' : 'text-neutral-450 font-bold block'}`}>OBJETIVO DO ALUNO</label>
                <input 
                  type="text"
                  value={planilhaForm.objetivo}
                  onChange={(e) => updateGeneralField('objetivo', e.target.value)}
                  className={`px-3 py-2 w-full text-[10px] rounded focus:outline-none uppercase font-mono tracking-wide ${
                    theme === 'light' 
                      ? 'bg-neutral-50 border border-neutral-250 text-neutral-950 focus:border-neutral-500' 
                      : 'bg-black border border-neutral-850 text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className={`${theme === 'light' ? 'text-neutral-500 font-bold block' : 'text-neutral-450 font-bold block'}`}>FOCO ATUAL DO MACROCICLO</label>
                <textarea 
                  rows={2}
                  value={planilhaForm.focoMacrociclo}
                  onChange={(e) => updateGeneralField('focoMacrociclo', e.target.value)}
                  className={`p-2.5 w-full text-[10px] rounded focus:outline-none uppercase font-mono tracking-wide resize-none ${
                    theme === 'light' 
                      ? 'bg-neutral-50 border border-neutral-250 text-neutral-950 focus:border-neutral-500' 
                      : 'bg-black border border-neutral-850 text-white focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* INTENSITY PACES CONFIGURATOR Z1-Z5 (Swiss precision style) */}
          <div className={`p-5 flex flex-col gap-3 transition-all duration-300 rounded-2xl liquid-sheen ${
            theme === 'light' ? 'liquid-glass-light shadow-md' : 'liquid-glass shadow-xl'
          }`}>
            <span className={`text-[7.5px] font-mono tracking-widest uppercase block font-black border-b pb-2 ${
              theme === 'light' ? 'border-neutral-200 text-neutral-600' : 'border-neutral-900 text-neutral-500'
            }`}>
              INTENSIDADES DE PACE / DISTRIBUIÇÃO DAS ZONAS
            </span>

            <div className="flex flex-col gap-2">
              {planilhaForm.zones.map((zone, i) => {
                const isZ2 = zone.name === 'Z2';
                return (
                  <div key={zone.name} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3 flex items-center gap-1">
                      <span className={`font-mono text-[9px] font-black ${
                        isZ2 ? 'text-emerald-500' : (theme === 'light' ? 'text-neutral-700' : 'text-neutral-400')
                      }`}>{zone.name}</span>
                    </div>
                    
                    <div className="col-span-5">
                      <input 
                        type="text"
                        value={zone.desc}
                        onChange={(e) => updateZoneDesc(i, e.target.value)}
                        placeholder="Descrição da zona"
                        className={`px-2 py-1.5 w-full text-[9px] rounded focus:outline-none uppercase font-mono leading-none ${
                          theme === 'light' 
                            ? 'bg-neutral-50 border border-neutral-250 text-neutral-950 focus:border-neutral-500' 
                            : 'bg-black border border-neutral-850 text-white focus:border-emerald-500'
                        }`}
                      />
                    </div>
                    
                    <div className="col-span-4">
                      <input 
                        type="text"
                        value={zone.pace}
                        onChange={(e) => updateZonePace(i, e.target.value)}
                        placeholder="Pace (ex: 5:00 - 5:30)"
                        className={`px-2 py-1.5 w-full font-mono text-[9px] font-bold text-center rounded focus:outline-none ${
                          theme === 'light' 
                            ? 'bg-neutral-50 border border-neutral-250 text-neutral-950 focus:border-neutral-500' 
                            : 'bg-black border border-neutral-850 text-white focus:border-emerald-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SESSIONS BY DAY TABS SELECTOR */}
          <div className={`p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl liquid-sheen ${
            theme === 'light' ? 'liquid-glass-light shadow-md' : 'liquid-glass shadow-xl'
          }`}>
            <div className={`flex justify-between items-center border-b pb-2 ${
              theme === 'light' ? 'border-neutral-200' : 'border-neutral-900'
            }`}>
              <span className={`text-[7.5px] font-mono tracking-widest uppercase block font-black ${
                theme === 'light' ? 'text-neutral-600' : 'text-neutral-500'
              }`}>
                PRESCREVER ROTINA DIÁRIA
              </span>
              <span className="text-[8px] font-mono font-black text-emerald-500">
                EDITANDO: {formSelectedDay}
              </span>
            </div>

            {/* Symmetrical day tab picker */}
            <div className="grid grid-cols-7 gap-1" id="form-day-selector">
              {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].map((d) => {
                const isConfigured = !!planilhaForm.prescriptions[d];
                const isSelected = d === formSelectedDay;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFormSelectedDay(d)}
                    className={`py-2 text-[8px] font-mono tracking-wider text-center font-bold rounded-md cursor-pointer transition-all ${
                      isSelected 
                        ? (theme === 'light' ? 'bg-neutral-900 text-white font-black' : 'bg-white text-black font-black')
                        : isConfigured
                        ? (theme === 'light' ? 'bg-neutral-200 text-neutral-800 border border-neutral-300' : 'bg-neutral-905 text-neutral-300 border border-neutral-800')
                        : (theme === 'light' ? 'bg-neutral-100 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200' : 'bg-neutral-950 text-neutral-700 hover:text-neutral-400')
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            {/* Daily Sessions form fields representation inside card */}
            <div className="space-y-3 pt-1 text-[9px] font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className={`${theme === 'light' ? 'text-neutral-550 block font-bold' : 'text-neutral-500 block font-bold'}`}>TÍTULO (Ex: SEG - 24MIN)</label>
                  <input 
                    type="text"
                    value={planilhaForm.prescriptions[formSelectedDay]?.title || ''}
                    onChange={(e) => updatePrescriptionField(formSelectedDay, 'title', e.target.value)}
                    placeholder="SEG - 24MIN"
                    className={`px-2.5 py-2 w-full text-[9.5px] rounded focus:outline-none uppercase font-mono ${
                      theme === 'light' 
                        ? 'bg-neutral-50 border border-neutral-250 text-neutral-950 focus:border-neutral-500' 
                        : 'bg-black border border-neutral-850 text-white focus:border-emerald-500'
                    }`}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className={`${theme === 'light' ? 'text-neutral-550 block font-bold' : 'text-neutral-555 block font-bold'}`}>TIPO DE ATIVIDADE (Badge)</label>
                  <input 
                    type="text"
                    value={planilhaForm.prescriptions[formSelectedDay]?.badge || ''}
                    onChange={(e) => updatePrescriptionField(formSelectedDay, 'badge', e.target.value)}
                    placeholder="CORRIDA PRESCRITA"
                    className={`px-2.5 py-2 w-full text-[9.5px] rounded focus:outline-none uppercase font-mono ${
                      theme === 'light' 
                        ? 'bg-neutral-50 border border-neutral-250 text-neutral-950 focus:border-neutral-500' 
                        : 'bg-black border border-neutral-850 text-white focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={`${theme === 'light' ? 'text-neutral-550 block font-bold' : 'text-neutral-555 block font-bold'}`}>ESTRUTURA DE SUBCATEGORIA (Sub-badge)</label>
                <input 
                  type="text"
                  value={planilhaForm.prescriptions[formSelectedDay]?.subBadge || ''}
                  onChange={(e) => updatePrescriptionField(formSelectedDay, 'subBadge', e.target.value)}
                  placeholder="ZONAS DE TREINAMENTO"
                  className={`px-2.5 py-2 w-full text-[9.5px] rounded focus:outline-none uppercase font-mono ${
                    theme === 'light' 
                      ? 'bg-neutral-50 border border-neutral-250 text-neutral-950 focus:border-neutral-500' 
                      : 'bg-black border border-neutral-850 text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-neutral-550 dark:text-neutral-400">1. AQUECIMENTO (Warm Up)</label>
                <textarea 
                  rows={2}
                  value={planilhaForm.prescriptions[formSelectedDay]?.warmup || ''}
                  onChange={(e) => updatePrescriptionField(formSelectedDay, 'warmup', e.target.value)}
                  placeholder="Descreva o aquecimento (ex: 8min leve)..."
                  className={`p-2.5 w-full text-[9.5px] rounded focus:outline-none lowercase font-mono leading-relaxed resize-none ${
                    theme === 'light' 
                      ? 'bg-neutral-50 border border-neutral-250 text-neutral-950 focus:border-neutral-500' 
                      : 'bg-black border border-neutral-850 text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-neutral-550 dark:text-neutral-350">2. BLOCO PRINCIPAL (Main Set)</label>
                <textarea 
                  rows={3}
                  value={planilhaForm.prescriptions[formSelectedDay]?.mainSet || ''}
                  onChange={(e) => updatePrescriptionField(formSelectedDay, 'mainSet', e.target.value)}
                  placeholder="Descreva o bloco principal (ex: 6x2min forte/2min leve)..."
                  className={`p-2.5 w-full text-[9.5px] rounded focus:outline-none lowercase font-mono leading-relaxed resize-none ${
                    theme === 'light' 
                      ? 'bg-neutral-50 border border-neutral-250 text-neutral-955 focus:border-neutral-500' 
                      : 'bg-black border border-neutral-850 text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-neutral-550 dark:text-neutral-450">3. RETORNO À CALMA (Cool Down)</label>
                <textarea 
                  rows={2}
                  value={planilhaForm.prescriptions[formSelectedDay]?.coolDown || ''}
                  onChange={(e) => updatePrescriptionField(formSelectedDay, 'coolDown', e.target.value)}
                  placeholder="Descreva o retorno à calma (ex: 8min leve)..."
                  className={`p-2.5 w-full text-[9.5px] rounded focus:outline-none lowercase font-mono leading-relaxed resize-none ${
                    theme === 'light' 
                      ? 'bg-neutral-50 border border-neutral-250 text-neutral-955 focus:border-neutral-500' 
                      : 'bg-black border border-neutral-850 text-white focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* TRIGGER PUBLISHING ACTION BUTTON */}
          <button
            onClick={handlePublishPlanilha}
            className="w-full mt-2 py-4 px-6 border border-emerald-500 bg-emerald-500 text-black font-mono font-black text-[10px] tracking-[0.25em] text-center cursor-pointer hover:bg-emerald-400 hover:border-emerald-400 transition-all rounded-xl uppercase flex items-center justify-center gap-2.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            id="btn-publish-gxp-stream"
          >
            <Send className="w-4 h-4" />
            Salvar &amp; Projetar Planilha
          </button>
        </div>
      )}

      {/* TAB 3: WORKOUT REGISTRATION FEEDBACKS */}
      {activeTab === 'FEEDBACK' && (
        <div className="flex-1 flex flex-col gap-4 mt-4 animate-fade-in" id="feedback-content-area">
          <div className={`text-[8.5px] font-mono tracking-widest uppercase flex justify-between ${
            theme === 'light' ? 'text-neutral-600' : 'text-neutral-500'
          }`}>
            <span>FEEDBACK SEMANAL</span>
            <span className="text-emerald-500 font-bold">ATUALIZAÇÃO EM TEMPO REAL</span>
          </div>

          {/* SELECTED ATHLETE PROFILE SUMMARY CARD */}
          <div className={`p-4 flex justify-between items-center transition-all duration-300 rounded-2xl liquid-sheen ${
            theme === 'light' ? 'liquid-glass-light shadow-md' : 'liquid-glass shadow-lg'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500 text-emerald-500 flex items-center justify-center font-mono font-black text-sm">
                {selectedAthlete.avatarSeed}
              </div>
              <div>
                <h3 className={`text-xs font-bold font-mono tracking-wide capitalize ${
                  theme === 'light' ? 'text-neutral-950' : 'text-white'
                }`}>{selectedAthlete.name}</h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-mono text-emerald-500 font-bold block">
                META: {selectedAthlete.targetPace} / KM
              </span>
              <span className={`text-[7px] font-mono block uppercase ${
                theme === 'light' ? 'text-neutral-550' : 'text-neutral-550'
              }`}>
                Pace Alvo do Treino
              </span>
            </div>
          </div>

          {/* ANALYTICS HUB TRIGGER ACTIONS (RELATÓRIO & EVOLUÇÃO GRÁFICA) */}
          <div className="grid grid-cols-2 gap-2.5 font-mono">
            <button
              onClick={() => {
                setReportCopied(false);
                setIsReportModalOpen(true);
              }}
              className={`py-3.5 px-3 border rounded-xl font-black text-[9px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-97 select-none ${
                theme === 'light'
                  ? 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-800 shadow-xs'
                  : 'bg-neutral-950 border-neutral-900 text-neutral-300 hover:bg-neutral-900 hover:border-neutral-800'
              }`}
              id="btn-trigger-athlete-report"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-500 stroke-[2]" />
              Gerar Relatório
            </button>

            <button
              onClick={() => {
                setHoveredPointIndex(4);
                setIsEvolutionModalOpen(true);
              }}
              className={`py-3.5 px-3 border rounded-xl font-black text-[9px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-97 select-none ${
                theme === 'light'
                  ? 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-800 shadow-xs'
                  : 'bg-neutral-950 border-neutral-900 text-neutral-300 hover:bg-neutral-900 hover:border-emerald-950/20'
              }`}
              id="btn-trigger-athlete-chart"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500 stroke-[2]" />
              Evolução Real
            </button>
          </div>

          {/* Render Weeks dynamically */}
          <div className="flex flex-col gap-3">
            {getAthleteWeeklyFeedback(selectedAthlete.id).map((week) => {
              const isExpanded = !!expandedWeeks[week.id];
              return (
                <div key={week.id} className={`overflow-hidden transition-all duration-300 rounded-2xl ${
                  theme === 'light' ? 'liquid-glass-light shadow-sm' : 'liquid-glass'
                }`}>
                  {/* Accordion Trigger/Header */}
                  <button
                    onClick={() => {
                      setExpandedWeeks(prev => ({
                        ...prev,
                        [week.id]: !prev[week.id]
                      }));
                    }}
                    className={`w-full text-left p-4 border-b flex justify-between items-center transition-colors cursor-pointer ${
                      theme === 'light' 
                        ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200' 
                        : 'bg-neutral-950 hover:bg-neutral-900/40 border-neutral-900'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className={`text-[9px] font-mono font-bold tracking-wide uppercase ${
                        theme === 'light' ? 'text-neutral-850' : 'text-white'
                      }`}>
                        {week.weekName}
                      </span>
                      <div className="flex items-center gap-2 text-[7.5px] font-mono">
                        <span className={`px-1 rounded ${
                          week.status === 'Em andamento' 
                            ? (theme === 'light' ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-amber-950/40 text-amber-500 border border-amber-500/40') 
                            : (theme === 'light' ? 'bg-emerald-100 text-emerald-750 border border-emerald-300' : 'bg-emerald-950/40 text-emerald-500 border border-emerald-500/40')
                        } font-bold`}>
                          {week.status.toUpperCase()}
                        </span>
                        <span className={theme === 'light' ? 'text-neutral-500' : 'text-neutral-500'}>
                          ADERÊNCIA: {week.adherencePct}%
                        </span>
                      </div>
                    </div>
                    <span className="text-[8.5px] text-emerald-500 font-bold transition-transform font-mono">
                      {isExpanded ? '▲ ENCOLHER' : '▼ EXPANDIR'}
                    </span>
                  </button>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className={`p-4 flex flex-col gap-3 animate-fade-in font-mono text-[8px] ${
                      theme === 'light' ? 'bg-neutral-50/60' : 'bg-black/20'
                    }`}>
                      {week.days.length === 0 ? (
                        <span className={`text-[8px] italic uppercase text-center py-2 ${
                          theme === 'light' ? 'text-neutral-500' : 'text-neutral-600'
                        }`}>Sem sessões registradas nesta semana</span>
                      ) : (
                        week.days.map((d) => (
                          <div key={d.day} className={`p-3 rounded-lg flex flex-col gap-2.5 border ${
                            theme === 'light' ? 'bg-white border-neutral-150 shadow-xs' : 'bg-black/50 border-neutral-900/60'
                          }`}>
                            <div className={`flex justify-between items-center border-b pb-1.5 ${
                              theme === 'light' ? 'border-neutral-150' : 'border-neutral-900/60'
                            }`}>
                              <span className={`font-extrabold text-[8.5px] tracking-wide ${
                                theme === 'light' ? 'text-neutral-900' : 'text-white'
                              }`}>{d.day}</span>
                              <span className={`text-[7px] truncate max-w-[180px] uppercase ${
                                theme === 'light' ? 'text-neutral-500' : 'text-neutral-500'
                              }`}>
                                {d.title}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-1 text-[7.5px] text-center font-bold">
                              <div className="flex flex-col gap-0.5">
                                <span className={theme === 'light' ? 'text-neutral-450 uppercase text-[5.5px]' : 'text-neutral-600 uppercase text-[5.5px]'}>AQUECIMENTO</span>
                                <span className={`${
                                  d.warmup === 'CONCLUÍDO' 
                                    ? (theme === 'light' ? 'text-emerald-600 font-extrabold' : 'text-emerald-400 font-extrabold') 
                                    : d.warmup === 'ADAPTADO' 
                                    ? 'text-yellow-650 font-extrabold' 
                                    : 'text-neutral-400 line-through font-normal'
                                }`}>
                                  {d.warmup || 'PENDENTE'}
                                </span>
                              </div>
                              <div className={`flex flex-col gap-0.5 border-x ${
                                theme === 'light' ? 'border-neutral-200' : 'border-neutral-900'
                              }`}>
                                <span className={theme === 'light' ? 'text-neutral-450 uppercase text-[5.5px]' : 'text-neutral-600 uppercase text-[5.5px]'}>BLOCO PRINCIPAL</span>
                                <span className={`${
                                  d.mainSet === 'CONCLUÍDO' 
                                    ? (theme === 'light' ? 'text-emerald-600 font-extrabold' : 'text-emerald-400 font-extrabold') 
                                    : d.mainSet === 'ADAPTADO' 
                                    ? 'text-yellow-650 font-extrabold' 
                                    : 'text-neutral-400 line-through font-normal'
                                }`}>
                                  {d.mainSet || 'PENDENTE'}
                                </span>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className={theme === 'light' ? 'text-neutral-450 uppercase text-[5.5px]' : 'text-neutral-600 uppercase text-[5.5px]'}>RECUPERAÇÃO</span>
                                <span className={`${
                                  d.coolDown === 'CONCLUÍDO' 
                                    ? (theme === 'light' ? 'text-emerald-600 font-extrabold' : 'text-emerald-400 font-extrabold') 
                                    : d.coolDown === 'ADAPTADO' 
                                    ? 'text-yellow-650 font-extrabold' 
                                    : 'text-neutral-400 line-through font-normal'
                                }`}>
                                  {d.coolDown || 'PENDENTE'}
                                </span>
                              </div>
                            </div>

                            {/* Direct subjective feedbacks */}
                            {d.comment ? (
                              <div className={`p-2 rounded border mt-1 ${
                                theme === 'light' ? 'bg-neutral-50 border-neutral-150' : 'bg-[#050505] border-neutral-950'
                              }`}>
                                <div className="flex justify-between items-center text-[7px] font-bold mb-1 tracking-wide">
                                  <span className={`px-1 py-0.2 rounded text-[6.5px] ${
                                    theme === 'light' ? 'bg-neutral-200 text-neutral-800' : 'bg-neutral-900 text-neutral-300'
                                  }`}>PERCEPÇÃO: {d.feeling}</span>
                                  <span className="text-emerald-500 font-black">ESFORÇO: {d.effort}/10</span>
                                </div>
                                <p className={`text-[8px] italic uppercase leading-relaxed font-sans pl-1.5 border-l border-emerald-500/50 ${
                                  theme === 'light' ? 'text-neutral-700' : 'text-neutral-400'
                                }`}>
                                  "{d.comment}"
                                </p>
                              </div>
                            ) : (
                              <span className="text-neutral-400 text-[6.5px] uppercase italic text-left pl-1">
                                Sem relato de fluxo disponível para este dia
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FOOTER SYSTEM DETAILS COMPONENT */}
      <div 
        className={`mt-6 border-t pt-4 flex justify-between items-center text-[8px] font-mono tracking-widest ${
          theme === 'light' ? 'border-neutral-200 text-neutral-500' : 'border-neutral-900 text-neutral-600'
        }`}
        id="trainer-footer-status"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
          <span>SINAL ESTÁVEL TELE_NET</span>
        </div>
        <span>FREQUÊNCIA DE BROADCAST [LOCAL]</span>
      </div>

    </div>
  );
}

// Helpers
function selectedPaceDisplay(ath: Athlete): string {
  if (ath.status !== 'active') return '--:--';
  return `${ath.currentPace} /km`;
}
