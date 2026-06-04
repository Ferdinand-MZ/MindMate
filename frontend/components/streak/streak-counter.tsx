"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Star, Zap, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStreak, recordCheckIn } from "@/lib/api/features";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckInDate: string | null;
  checkedInToday: boolean;
}

const MILESTONES = [3, 7, 14, 30, 60, 100];

function getMilestoneLabel(streak: number): string | null {
  if (streak >= 100) return "🏆 Legenda!";
  if (streak >= 60) return "💎 Luar Biasa!";
  if (streak >= 30) return "🌟 Sebulan Penuh!";
  if (streak >= 14) return "🔥 Dua Minggu!";
  if (streak >= 7) return "⚡ Satu Minggu!";
  if (streak >= 3) return "✨ 3 Hari!";
  return null;
}

function getFlameColor(streak: number): string {
  if (streak >= 30) return "text-purple-500";
  if (streak >= 14) return "text-orange-500";
  if (streak >= 7) return "text-amber-500";
  if (streak >= 3) return "text-yellow-500";
  return "text-primary";
}

export function StreakCounter() {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneText, setMilestoneText] = useState("");

  const loadStreak = useCallback(async () => {
    try {
      const res = await getStreak();
      setStreakData(res.data);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  const handleCheckIn = async () => {
    if (checkingIn || streakData?.checkedInToday) return;
    setCheckingIn(true);
    try {
      const res = await recordCheckIn();
      const data = res.data;
      setStreakData((prev) =>
        prev
          ? {
              ...prev,
              currentStreak: data.currentStreak,
              longestStreak: data.longestStreak,
              totalCheckIns: data.totalCheckIns,
              checkedInToday: true,
            }
          : prev
      );
      if (data.milestoneReached) {
        const label = getMilestoneLabel(data.currentStreak);
        if (label) {
          setMilestoneText(label);
          setShowMilestone(true);
          setTimeout(() => setShowMilestone(false), 3000);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading || !streakData) {
    return (
      <Card className="border-primary/10">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 bg-primary/10 rounded animate-pulse w-24" />
            <div className="h-2 bg-primary/5 rounded animate-pulse w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { currentStreak, longestStreak, totalCheckIns, checkedInToday } = streakData;
  const flameColor = getFlameColor(currentStreak);
  const milestoneLabel = getMilestoneLabel(currentStreak);
  const nextMilestone = MILESTONES.find((m) => m > currentStreak) ?? null;

  return (
    <Card className="border-primary/10 relative overflow-hidden">
      <AnimatePresence>
        {showMilestone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-xl"
          >
            <div className="text-center space-y-2">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
                className="text-4xl"
              >
                🎉
              </motion.div>
              <p className="font-bold text-lg text-foreground">{milestoneText}</p>
              <p className="text-sm text-muted-foreground">Pencapaian baru!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div
                animate={currentStreak > 0 ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Flame className={`w-8 h-8 ${flameColor}`} />
              </motion.div>
              {currentStreak >= 7 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  ★
                </span>
              )}
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-foreground">{currentStreak}</span>
                <span className="text-sm text-muted-foreground">hari berturut</span>
              </div>
              {milestoneLabel ? (
                <p className="text-xs text-primary font-medium">{milestoneLabel}</p>
              ) : nextMilestone ? (
                <p className="text-xs text-muted-foreground">
                  {nextMilestone - currentStreak} hari lagi ke {nextMilestone} 🎯
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Mulai streak-mu!</p>
              )}
            </div>
          </div>

          <Button
            size="sm"
            variant={checkedInToday ? "outline" : "default"}
            onClick={handleCheckIn}
            disabled={checkingIn || checkedInToday}
            className={`gap-1.5 transition-all ${
              checkedInToday
                ? "border-green-500/30 text-green-600 bg-green-500/5"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {checkedInToday ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs">Sudah!</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span className="text-xs">Check-in</span>
              </>
            )}
          </Button>
        </div>

        <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-muted-foreground">
              Terpanjang: <span className="font-semibold text-foreground">{longestStreak}h</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{totalCheckIns}</span>
            </span>
          </div>
        </div>

        {nextMilestone && currentStreak > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{currentStreak}</span>
              <span>{nextMilestone}</span>
            </div>
            <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(currentStreak / nextMilestone) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}