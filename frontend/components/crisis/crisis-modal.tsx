"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Wind,
  Eye,
  X,
  ChevronRight,
  Heart,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Indonesian crisis hotlines
const HOTLINES = [
  { name: "Into The Light", number: "119 ext 8", description: "Hotline krisis & pencegahan bunuh diri" },
  { name: "Yayasan Pulih", number: "(021) 788-42580", description: "Konseling kesehatan mental" },
  { name: "LSM Jangan Menyerah", number: "021-7884-5555", description: "Dukungan emosional 24/7" },
  { name: "HALO Kemkes", number: "1500-567", description: "Kementerian Kesehatan RI" },
];

// 5-4-3-2-1 grounding steps
const GROUNDING_STEPS = [
  {
    count: 5,
    sense: "Lihat",
    emoji: "👁️",
    instruction: "Sebutkan 5 hal yang bisa kamu LIHAT di sekitarmu sekarang.",
    color: "from-blue-500/20 to-blue-600/10",
    accent: "text-blue-500",
  },
  {
    count: 4,
    sense: "Sentuh",
    emoji: "✋",
    instruction: "Sentuh 4 benda yang berbeda dan rasakan teksturnya.",
    color: "from-green-500/20 to-green-600/10",
    accent: "text-green-500",
  },
  {
    count: 3,
    sense: "Dengar",
    emoji: "👂",
    instruction: "Fokus pada 3 suara yang bisa kamu DENGAR saat ini.",
    color: "from-yellow-500/20 to-yellow-600/10",
    accent: "text-yellow-500",
  },
  {
    count: 2,
    sense: "Cium",
    emoji: "👃",
    instruction: "Identifikasi 2 hal yang bisa kamu CIUM : makanan, udara, atau aroma sekitar.",
    color: "from-orange-500/20 to-orange-600/10",
    accent: "text-orange-500",
  },
  {
    count: 1,
    sense: "Rasa",
    emoji: "👅",
    instruction: "Fokus pada 1 hal yang bisa kamu RASAKAN di mulutmu sekarang.",
    color: "from-rose-500/20 to-rose-600/10",
    accent: "text-rose-500",
  },
];

// Box breathing state machine
type BreathPhase = "inhale" | "hold1" | "exhale" | "hold2" | "idle";
const BREATH_DURATIONS: Record<BreathPhase, number> = {
  inhale: 4,
  hold1: 4,
  exhale: 4,
  hold2: 4,
  idle: 0,
};
const BREATH_LABELS: Record<BreathPhase, string> = {
  inhale: "Hirup...",
  hold1: "Tahan...",
  exhale: "Buang...",
  hold2: "Tahan...",
  idle: "Mulai",
};
const BREATH_SEQUENCE: BreathPhase[] = ["inhale", "hold1", "exhale", "hold2"];

type Tab = "hotlines" | "breathing" | "grounding";

interface CrisisModalProps {
  open: boolean;
  onClose: () => void;
}

function BreathingTab() {
  const [phase, setPhase] = useState<BreathPhase>("idle");
  const [timeLeft, setTimeLeft] = useState(4);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startBreathing = () => {
    setCycles(0);
    setPhaseIndex(0);
    const firstPhase = BREATH_SEQUENCE[0];
    setPhase(firstPhase);
    setTimeLeft(BREATH_DURATIONS[firstPhase]);
  };

  const stopBreathing = () => {
    clearTimer();
    setPhase("idle");
    setTimeLeft(4);
  };

  useEffect(() => {
    if (phase === "idle") return;
    clearTimer();

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer();
          setPhaseIndex((pi) => {
            const nextPi = (pi + 1) % BREATH_SEQUENCE.length;
            if (nextPi === 0) setCycles((c) => c + 1);
            const nextPhase = BREATH_SEQUENCE[nextPi];
            setPhase(nextPhase);
            setTimeLeft(BREATH_DURATIONS[nextPhase]);
            return nextPi;
          });
          return 1;
        }
        return t - 1;
      });
    }, 1000);

    return clearTimer;
  }, [phase]);

  const isActive = phase !== "idle";
  const progress = isActive
    ? ((BREATH_DURATIONS[phase] - timeLeft) / BREATH_DURATIONS[phase]) * 100
    : 0;

  const circleScale =
    phase === "inhale" ? 1.35 : phase === "hold1" ? 1.35 : phase === "exhale" ? 0.7 : 0.7;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Box Breathing membantu menenangkan sistem saraf. Ikuti ritme lingkaran ini.
      </p>

      {/* Breathing circle */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Outer ring progress */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="72" fill="none" stroke="hsl(var(--primary)/0.1)" strokeWidth="4" />
          <motion.circle
            cx="80"
            cy="80"
            r="72"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 72}`}
            animate={{ strokeDashoffset: `${2 * Math.PI * 72 * (1 - progress / 100)}` }}
            transition={{ duration: 0.3, ease: "linear" }}
          />
        </svg>

        {/* Inner expanding circle */}
        <motion.div
          animate={isActive ? { scale: circleScale } : { scale: 1 }}
          transition={{ duration: isActive ? BREATH_DURATIONS[phase] * 0.9 : 0.3, ease: "easeInOut" }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center"
        >
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{isActive ? BREATH_LABELS[phase] : "Siap"}</p>
            {isActive && <p className="text-2xl font-bold text-primary">{timeLeft}</p>}
          </div>
        </motion.div>
      </div>

      {isActive && (
        <p className="text-xs text-muted-foreground">
          Siklus ke-{cycles + 1} : target 4 siklus
        </p>
      )}

      <div className="flex gap-3">
        {!isActive ? (
          <Button onClick={startBreathing} className="gap-2 bg-primary hover:bg-primary/90">
            <Wind className="w-4 h-4" />
            Mulai Napas
          </Button>
        ) : (
          <Button variant="outline" onClick={stopBreathing} className="gap-2">
            <X className="w-4 h-4" />
            Berhenti
          </Button>
        )}
      </div>
    </div>
  );
}

function GroundingTab() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>(Array(5).fill(false));
  const [started, setStarted] = useState(false);

  const step = GROUNDING_STEPS[currentStep];
  const allDone = completed.every(Boolean);

  const markDone = () => {
    const next = [...completed];
    next[currentStep] = true;
    setCompleted(next);
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const reset = () => {
    setCurrentStep(0);
    setCompleted(Array(5).fill(false));
    setStarted(false);
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <Eye className="w-12 h-12 text-primary/50" />
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Teknik 5-4-3-2-1</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Teknik grounding ini membantu membawamu kembali ke momen sekarang ketika kamu merasa cemas atau overwhelmed.
          </p>
        </div>
        <Button onClick={() => setStarted(true)} className="gap-2 bg-primary hover:bg-primary/90">
          <Eye className="w-4 h-4" />
          Mulai Sekarang
        </Button>
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center"
        >
          <Heart className="w-8 h-8 text-green-500" />
        </motion.div>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Selesai! 🌿</h3>
          <p className="text-sm text-muted-foreground">
            Kamu sudah menyelesaikan teknik grounding. Bagaimana perasaanmu sekarang?
          </p>
        </div>
        <Button variant="outline" onClick={reset} className="gap-2">
          Ulangi
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Step indicators */}
      <div className="flex justify-center gap-2">
        {GROUNDING_STEPS.map((s, i) => (
          <div
            key={i}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              completed[i]
                ? "bg-green-500/20 text-green-500"
                : i === currentStep
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {completed[i] ? "✓" : s.count}
          </div>
        ))}
      </div>

      {/* Current step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`rounded-xl p-5 bg-gradient-to-br ${step.color} border border-border/30`}
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl">{step.emoji}</span>
            <div className="space-y-1.5">
              <p className={`font-bold text-sm ${step.accent}`}>
                {step.count} hal untuk di{step.sense.toLowerCase()}
              </p>
              <p className="text-sm text-foreground">{step.instruction}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <Button onClick={markDone} className="gap-2 w-full bg-primary hover:bg-primary/90">
        Selesai, lanjut
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function CrisisModal({ open, onClose }: CrisisModalProps) {
  const [tab, setTab] = useState<Tab>("hotlines");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500/10 via-primary/10 to-purple-500/10 p-5 pb-4 border-b border-border/50">
          {/* No custom close button here : DialogContent already renders one
              (top-right ✕); adding a second one produced a double ✕. */}
          <div className="flex items-center gap-2.5 pr-8">
            <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">Bantuan Segera</h2>
              <p className="text-xs text-muted-foreground">Kamu tidak sendirian 💙</p>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border/50 bg-muted/30">
          {(
            [
              { key: "hotlines", label: "Hotline", icon: Phone },
              { key: "breathing", label: "Napas", icon: Wind },
              { key: "grounding", label: "Grounding", icon: Eye },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-all ${
                tab === key
                  ? "text-primary border-b-2 border-primary bg-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4 max-h-[400px] overflow-y-auto">
          <AnimatePresence mode="wait">
            {tab === "hotlines" && (
              <motion.div
                key="hotlines"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Jika dalam bahaya langsung, hubungi 112 (Darurat Nasional)</span>
                </div>
                {HOTLINES.map((h) => (
                  <a
                    key={h.number}
                    href={`tel:${h.number.replace(/[^0-9]/g, "")}`}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {h.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{h.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="font-mono text-sm font-bold text-primary">{h.number}</span>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </a>
                ))}
              </motion.div>
            )}

            {tab === "breathing" && (
              <motion.div key="breathing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <BreathingTab />
              </motion.div>
            )}

            {tab === "grounding" && (
              <motion.div key="grounding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GroundingTab />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// The persistent floating SOS button
export function SOSButton() {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Subtle attention pulse every 30s to remind users it exists
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        animate={pulse ? { scale: [1, 1.1, 1] } : {}}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30 flex items-center justify-center transition-colors"
        aria-label="Bantuan Krisis"
        title="Butuh bantuan segera?"
      >
        <Shield className="w-5 h-5 text-white" />
      </motion.button>

      <CrisisModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}