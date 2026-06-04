"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Calendar,
  Dumbbell,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getWeeklyMoodPattern } from "@/lib/api/features";

interface PatternData {
  summary: string;
  worstDayOfWeek: { name: string; avg: number } | null;
  bestDayOfWeek: { name: string; avg: number } | null;
  worstTimeOfDay: { hour: number; avg: number } | null;
  bestTimeOfDay: { hour: number; avg: number } | null;
  helpfulActivities: string[];
  thisWeekAvg: number | null;
  lastWeekAvg: number | null;
  totalMoodEntries: number;
  generatedAt: string;
}

const ACTIVITY_ICONS: Record<string, string> = {
  meditation: "🧘",
  exercise: "🏃",
  walking: "🚶",
  reading: "📚",
  journaling: "✍️",
  therapy: "💬",
};

const HOUR_LABEL: Record<number, string> = {
  0: "tengah malam", 6: "pagi-pagi", 9: "pagi", 12: "siang",
  15: "sore awal", 18: "sore", 21: "malam",
};

function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const color =
    score >= 70 ? "text-green-500 bg-green-500/10" :
    score >= 50 ? "text-yellow-500 bg-yellow-500/10" :
    "text-red-500 bg-red-500/10";

  return (
    <span className={`${color} font-bold rounded-md px-1.5 py-0.5 ${size === "sm" ? "text-xs" : "text-sm"}`}>
      {Math.round(score)}
    </span>
  );
}

export function MoodPatternInsights() {
  const [data, setData] = useState<PatternData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPatterns = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await getWeeklyMoodPattern();
      setData(res.data);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPatterns();
  }, [loadPatterns]);

  const weekTrend =
    data?.thisWeekAvg != null && data?.lastWeekAvg != null
      ? data.thisWeekAvg - data.lastWeekAvg
      : null;

  if (loading) {
    return (
      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Pola Suasana Hati
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-16 bg-primary/5 rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-14 bg-primary/5 rounded-xl animate-pulse" />
            <div className="h-14 bg-primary/5 rounded-xl animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Pola Suasana Hati
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{data.totalMoodEntries} entri</span>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={() => loadPatterns(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Summary */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border border-primary/10 relative overflow-hidden"
        >
          <div className="absolute top-2 right-2 opacity-20">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <p className="text-sm text-foreground leading-relaxed relative">{data.summary}</p>
        </motion.div>

        {/* Week-over-week trend */}
        {weekTrend !== null && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/40">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                weekTrend > 0
                  ? "bg-green-500/10"
                  : weekTrend < 0
                  ? "bg-red-500/10"
                  : "bg-muted"
              }`}
            >
              {weekTrend > 2 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : weekTrend < -2 ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Minggu ini vs minggu lalu</p>
              <div className="flex items-center gap-2">
                <ScoreBadge score={data.thisWeekAvg!} size="sm" />
                <span className="text-xs text-muted-foreground">vs</span>
                <ScoreBadge score={data.lastWeekAvg!} size="sm" />
                {Math.abs(weekTrend) > 1 && (
                  <span className={`text-xs font-medium ${weekTrend > 0 ? "text-green-500" : "text-red-500"}`}>
                    {weekTrend > 0 ? "+" : ""}{weekTrend.toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Day & Time patterns */}
        <div className="grid grid-cols-2 gap-2">
          {data.worstDayOfWeek && (
            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 space-y-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-muted-foreground font-medium">Hari terberat</span>
              </div>
              <p className="font-semibold text-sm text-foreground">{data.worstDayOfWeek.name}</p>
              <ScoreBadge score={data.worstDayOfWeek.avg} size="sm" />
            </div>
          )}
          {data.bestDayOfWeek && (
            <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10 space-y-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-muted-foreground font-medium">Hari terbaik</span>
              </div>
              <p className="font-semibold text-sm text-foreground">{data.bestDayOfWeek.name}</p>
              <ScoreBadge score={data.bestDayOfWeek.avg} size="sm" />
            </div>
          )}
          {data.worstTimeOfDay && (
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-muted-foreground font-medium">Waktu terberat</span>
              </div>
              <p className="font-semibold text-sm text-foreground">
                {HOUR_LABEL[data.worstTimeOfDay.hour] ?? `${data.worstTimeOfDay.hour}:00`}
              </p>
              <ScoreBadge score={data.worstTimeOfDay.avg} size="sm" />
            </div>
          )}
          {data.helpfulActivities.length > 0 && (
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-1">
              <div className="flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-muted-foreground font-medium">Yang membantu</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.helpfulActivities.slice(0, 2).map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded-md font-medium"
                  >
                    {ACTIVITY_ICONS[a] ?? "•"} {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {data.generatedAt && (
          <p className="text-[10px] text-muted-foreground/60 text-right">
            Diperbarui {new Date(data.generatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}