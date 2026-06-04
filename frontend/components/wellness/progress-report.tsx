"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Download,
  Loader2,
  BarChart2,
  BookOpen,
  MessageSquare,
  Brain,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProgressReport } from "@/lib/api/features";

interface WeeklyMood {
  week: number;
  avg: number;
  count: number;
}

interface ProgressData {
  period: { label: string };
  mood: {
    totalEntries: number;
    average: number | null;
    min: number | null;
    max: number | null;
    weeklyTrend: WeeklyMood[];
  };
  sessions: {
    total: number;
    totalMessages: number;
    topThemes: { theme: string; count: number }[];
  };
  journals: { total: number };
  insights: { total: number };
  aiSummary: string;
}

function MoodBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  const color =
    value < 33 ? "#ef4444" : value < 66 ? "#f59e0b" : "#22c55e";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-muted rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">
        {value}
      </span>
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/40 text-center">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: color + "20" }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <span className="text-xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function ProgressReport() {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleToggle = async () => {
    if (report) {
      // Data already loaded — just toggle
      setExpanded((prev) => !prev);
      return;
    }
    if (expanded) {
      setExpanded(false);
      return;
    }
    // First open — fetch data
    setExpanded(true);
    setLoading(true);
    setError(null);
    try {
      const data = await getProgressReport();
      setReport(data.data);
    } catch {
      setError("Gagal memuat laporan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!report || !reportRef.current) return;
    setExporting(true);

    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const moodLabel =
        report.mood.average === null
          ? "Tidak ada data"
          : report.mood.average < 33
          ? "Perlu perhatian"
          : report.mood.average < 66
          ? "Sedang"
          : "Baik";

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Laporan Kemajuan MindMate — ${report.period.label}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; max-width: 720px; margin: 40px auto; color: #1a1a1a; padding: 0 24px; }
            h1 { color: #6d28d9; font-size: 28px; margin-bottom: 4px; }
            .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 32px; }
            .section { margin-bottom: 28px; }
            h2 { font-size: 16px; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 16px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .stat-box { background: #f9fafb; border-radius: 12px; padding: 14px; text-align: center; }
            .stat-value { font-size: 28px; font-weight: 700; color: #111827; }
            .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
            .summary-box { background: linear-gradient(135deg, #f5f3ff, #ede9fe); border-radius: 16px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #6d28d9; }
            .summary-text { font-size: 14px; line-height: 1.7; color: #374151; font-style: italic; }
            .theme-tag { display: inline-block; background: #ede9fe; color: #5b21b6; border-radius: 20px; padding: 3px 12px; font-size: 12px; margin: 3px; }
            .mood-bar-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
            .mood-bar-wrap { background: #e5e7eb; border-radius: 4px; height: 8px; margin-bottom: 8px; }
            .mood-bar-fill { height: 8px; border-radius: 4px; background: #6d28d9; }
            .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <h1>📊 Laporan Kemajuan MindMate</h1>
          <p class="subtitle">${report.period.label} • Dibuat oleh MindMate AI</p>
          
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-value" style="color:#6d28d9">${report.mood.totalEntries}</div>
              <div class="stat-label">📈 Check-in Mood</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" style="color:#0ea5e9">${report.sessions.total}</div>
              <div class="stat-label">💬 Sesi Chat</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" style="color:#8b5cf6">${report.journals.total}</div>
              <div class="stat-label">📓 Entri Jurnal</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" style="color:#ec4899">${report.insights.total}</div>
              <div class="stat-label">🧠 CBT Selesai</div>
            </div>
          </div>

          ${
            report.aiSummary
              ? `<div class="section">
            <h2>✨ Ringkasan AI</h2>
            <div class="summary-box">
              <p class="summary-text">${report.aiSummary}</p>
            </div>
          </div>`
              : ""
          }

          <div class="section">
            <h2>😊 Statistik Mood</h2>
            <p>Rata-rata: <strong>${report.mood.average ?? "N/A"}/100</strong> (${moodLabel})</p>
            ${report.mood.weeklyTrend
              .map(
                (w) => `
              <div class="mood-bar-label">Minggu ${w.week} (${w.count} entri)</div>
              <div class="mood-bar-wrap">
                <div class="mood-bar-fill" style="width:${w.avg}%;background:${
                  w.avg < 33 ? "#ef4444" : w.avg < 66 ? "#f59e0b" : "#22c55e"
                }"></div>
              </div>
            `
              )
              .join("")}
          </div>

          ${
            report.sessions.topThemes.length > 0
              ? `<div class="section">
            <h2>🏷️ Tema Terbanyak</h2>
            ${report.sessions.topThemes
              .map((t) => `<span class="theme-tag">${t.theme} (${t.count}x)</span>`)
              .join("")}
          </div>`
              : ""
          }

          <div class="footer">
            Laporan ini dibuat oleh MindMate AI untuk penggunaan pribadi.<br>
            Bisa dibagikan ke konselor atau profesional kesehatan mental terpercaya.
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        setExporting(false);
      }, 500);
    } catch {
      setExporting(false);
    }
  };

  return (
    <Card className="border-primary/10 overflow-hidden">
      {/* Decorative gradient — pointer-events-none so it never blocks clicks */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-green-500/5 to-transparent pointer-events-none z-0" />
      <CardContent className="p-6 relative z-10">
        <button
          type="button"
          className="w-full flex items-start justify-between gap-3 text-left"
          onClick={handleToggle}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Laporan Kemajuan</h3>
              <p className="text-xs text-muted-foreground">
                Ringkasan bulanan untuk konselor atau dirimu sendiri
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground mt-3 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground mt-3 shrink-0" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="progress-report-content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: "hidden" }}
            >
              <div className="mt-5" ref={reportRef}>
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Membuat laporan bulan ini...
                  </div>
                )}

                {error && (
                  <p className="text-sm text-destructive text-center py-4">
                    {error}
                  </p>
                )}

                {report && !loading && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs text-muted-foreground">
                        📅 {report.period.label}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={exportToPDF}
                        disabled={exporting}
                        className="text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      >
                        {exporting ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <Download className="w-3 h-3 mr-1" />
                        )}
                        Ekspor PDF
                      </Button>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                      <StatBox
                        icon={BarChart2}
                        label="Check-in Mood"
                        value={report.mood.totalEntries}
                        color="#6d28d9"
                      />
                      <StatBox
                        icon={MessageSquare}
                        label="Sesi Chat"
                        value={report.sessions.total}
                        color="#0ea5e9"
                      />
                      <StatBox
                        icon={BookOpen}
                        label="Jurnal"
                        value={report.journals.total}
                        color="#8b5cf6"
                      />
                      <StatBox
                        icon={Brain}
                        label="CBT Selesai"
                        value={report.insights.total}
                        color="#ec4899"
                      />
                    </div>

                    {/* AI Summary */}
                    {report.aiSummary && (
                      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 mb-5">
                        <div className="flex gap-2 items-start">
                          <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <p className="text-sm leading-relaxed text-foreground/85 italic">
                            {report.aiSummary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Mood trend */}
                    {report.mood.weeklyTrend.length > 0 && (
                      <div className="mb-5">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          Tren Mood Mingguan
                        </h4>
                        <div className="space-y-2">
                          {report.mood.weeklyTrend.map((w) => (
                            <div key={w.week}>
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Minggu {w.week}</span>
                                <span>{w.count} entri</span>
                              </div>
                              <MoodBar value={Math.round(w.avg)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Top themes */}
                    {report.sessions.topThemes.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          Tema Terbanyak Bulan Ini
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {report.sessions.topThemes.map((t) => (
                            <span
                              key={t.theme}
                              className="text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 px-3 py-1 rounded-full"
                            >
                              {t.theme}{" "}
                              <span className="opacity-60">({t.count}x)</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      Laporan ini bisa kamu bagikan ke konselor atau psikolog terpercaya.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}