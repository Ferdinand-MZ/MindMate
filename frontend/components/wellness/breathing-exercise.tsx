"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Play, Square, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ExerciseType = "box" | "478";

interface ExercisePhase {
  label: string;
  duration: number; // seconds
  color: string;
  scale: number;
}

const EXERCISES: Record<
  ExerciseType,
  { name: string; description: string; phases: ExercisePhase[]; cycles: number }
> = {
  box: {
    name: "Box Breathing",
    description: "4 detik tiap fase — teknik Navy SEAL untuk ketenangan instan",
    cycles: 4,
    phases: [
      { label: "Hirup", duration: 4, color: "#6d28d9", scale: 1.4 },
      { label: "Tahan", duration: 4, color: "#7c3aed", scale: 1.4 },
      { label: "Buang", duration: 4, color: "#4c1d95", scale: 0.7 },
      { label: "Tahan", duration: 4, color: "#5b21b6", scale: 0.7 },
    ],
  },
  "478": {
    name: "4-7-8 Breathing",
    description: "Teknik relaksasi Dr. Andrew Weil untuk kecemasan & tidur",
    cycles: 3,
    phases: [
      { label: "Hirup 4 detik", duration: 4, color: "#0ea5e9", scale: 1.5 },
      { label: "Tahan 7 detik", duration: 7, color: "#0284c7", scale: 1.5 },
      { label: "Buang 8 detik", duration: 8, color: "#0369a1", scale: 0.6 },
    ],
  },
};

function BreathingCircle({
  phase,
  progress,
  timeLeft,
}: {
  phase: ExercisePhase;
  progress: number;
  timeLeft: number;
}) {
  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto my-6">
      {/* Outer ripple */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: phase.color + "15" }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Progress ring */}
      <svg
        className="absolute inset-0 w-full h-full -rotate-90"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={phase.color + "20"}
          strokeWidth="4"
        />
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={phase.color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 46}`}
          strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress)}`}
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      {/* Breathing circle */}
      <motion.div
        className="rounded-full flex items-center justify-center text-white font-medium text-center px-4"
        style={{ backgroundColor: phase.color }}
        animate={{ scale: phase.scale }}
        transition={{
          duration: phase.duration,
          ease: phase.label.includes("Buang") ? "easeIn" : "easeOut",
        }}
      >
        <div>
          <div className="text-2xl font-bold">{timeLeft}</div>
          <div className="text-xs opacity-90 mt-0.5">{phase.label}</div>
        </div>
      </motion.div>
    </div>
  );
}

export function BreathingExercise() {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<ExerciseType | null>(null);
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const exercise = selected ? EXERCISES[selected] : null;

  const startExercise = useCallback(
    (type: ExerciseType) => {
      setSelected(type);
      setRunning(true);
      setPhaseIndex(0);
      setCycleCount(0);
      setDone(false);
      setTimeLeft(EXERCISES[type].phases[0].duration);
    },
    []
  );

  const stopExercise = () => {
    setRunning(false);
    setSelected(null);
    setDone(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (!running || !exercise) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Move to next phase
          setPhaseIndex((pi) => {
            const nextPi = (pi + 1) % exercise.phases.length;
            if (nextPi === 0) {
              setCycleCount((c) => {
                const nextC = c + 1;
                if (nextC >= exercise.cycles) {
                  setRunning(false);
                  setDone(true);
                  if (intervalRef.current) clearInterval(intervalRef.current);
                }
                return nextC;
              });
            }
            return nextPi;
          });
          return exercise.phases[(phaseIndex + 1) % exercise.phases.length]
            .duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, exercise, phaseIndex]);

  const currentPhase = exercise?.phases[phaseIndex];
  const phaseDuration = currentPhase?.duration ?? 1;
  const phaseProgress = (phaseDuration - timeLeft) / phaseDuration;

  return (
    <Card className="border-primary/10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-cyan-500/5 to-transparent pointer-events-none z-0" />
      <CardContent className="p-6 relative z-10">
        <button
          className="w-full flex items-start justify-between gap-3 text-left"
          onClick={() => !running && setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center">
              <Wind className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Latihan Pernapasan</h3>
              <p className="text-xs text-muted-foreground">
                Tenangkan pikiran dalam 2–3 menit
              </p>
            </div>
          </div>
          {!running &&
            (expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground mt-3" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground mt-3" />
            ))}
        </button>

        <AnimatePresence>
          {(expanded || running) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-5">
                {/* Exercise picker */}
                {!running && !done && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Object.keys(EXERCISES) as ExerciseType[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => startExercise(key)}
                        className="text-left p-4 rounded-xl border border-border hover:border-sky-500/40 hover:bg-sky-500/5 transition-all group"
                      >
                        <div className="font-semibold text-sm mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {EXERCISES[key].name}
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {EXERCISES[key].description}
                        </div>
                        <div className="mt-2 flex gap-1">
                          {EXERCISES[key].phases.map((p, i) => (
                            <div
                              key={i}
                              className="h-1 rounded-full flex-1"
                              style={{ backgroundColor: p.color + "60" }}
                            />
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {EXERCISES[key].cycles} siklus •{" "}
                          {EXERCISES[key].phases.reduce(
                            (a, p) => a + p.duration,
                            0
                          ) * EXERCISES[key].cycles}{" "}
                          detik
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Running animation */}
                {running && exercise && currentPhase && (
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-2">
                      Siklus {cycleCount + 1} / {exercise.cycles}
                    </div>
                    <BreathingCircle
                      phase={currentPhase}
                      progress={phaseProgress}
                      timeLeft={timeLeft}
                    />
                    <p className="text-sm text-muted-foreground mb-4">
                      {exercise.name}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopExercise}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <Square className="w-3 h-3 mr-1" /> Berhenti
                    </Button>
                  </div>
                )}

                {/* Done state */}
                {done && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6"
                  >
                    <div className="text-4xl mb-3">🌿</div>
                    <h4 className="font-semibold text-lg mb-1">
                      Selesai! Bagus sekali.
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Tubuhmu sudah lebih rileks sekarang.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDone(false);
                        setSelected(null);
                      }}
                      className="border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
                    >
                      <Play className="w-3 h-3 mr-1" /> Coba lagi
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}