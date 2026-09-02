"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  PenLine,
  Brain,
  X,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/contexts/session-context";
import {
  getDailyPrompt,
  saveJournalEntry,
  getJournalHistory,
  analyzeJournalEntry,
} from "@/lib/api/features";

// ─── Types ────────────────────────────────────────────────────────────────────
interface JournalEntry {
  id: string;
  prompt: string;
  content: string;
  createdAt: string;
  themes?: string[];
  aiAnalysis?: {
    mood: string;
    moodEmoji: string;
    themes: string[];
    insight: string;
    affirmation: string;
  };
}

interface TodayJournal {
  prompt: string;
  journalId: string;
  hasEntry: boolean;
  isExisting: boolean;
}

// ─── Calendar mini ────────────────────────────────────────────────────────────
function MiniCalendar({
  entries,
  selectedDate,
  onSelectDate,
}: {
  entries: JournalEntry[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}) {
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate));

  const entryDates = new Set(
    entries.map((e) => {
      const d = new Date(e.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthNames = [
    "Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des",
  ];

  const isToday = (day: number) => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
  };

  const isSelected = (day: number) => {
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  const hasEntry = (day: number) =>
    entryDates.has(`${year}-${month}-${day}`);

  return (
    <div className="select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          className="p-1 rounded hover:bg-violet-500/10 text-muted-foreground hover:text-violet-500 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {monthNames[month]} {year}
        </span>
        <button
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          className="p-1 rounded hover:bg-violet-500/10 text-muted-foreground hover:text-violet-500 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((d) => (
          <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const active = hasEntry(day);
          const selected = isSelected(day);
          const today = isToday(day);
          return (
            <button
              key={day}
              onClick={() => active && onSelectDate(new Date(year, month, day))}
              disabled={!active}
              className={`
                relative h-7 w-7 mx-auto rounded-full text-xs font-medium transition-all duration-150
                ${selected
                  ? "bg-violet-500 text-white shadow-sm shadow-violet-500/30"
                  : active
                  ? "hover:bg-violet-500/15 text-foreground cursor-pointer"
                  : "text-muted-foreground/40 cursor-default"}
                ${today && !selected ? "ring-1 ring-violet-400/60" : ""}
              `}
            >
              {day}
              {active && !selected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI Analysis panel ────────────────────────────────────────────────────────
function AIAnalysisPanel({
  journalId,
  existingAnalysis,
  onAnalysisDone,
}: {
  journalId: string;
  existingAnalysis?: JournalEntry["aiAnalysis"];
  onAnalysisDone: (analysis: NonNullable<JournalEntry["aiAnalysis"]>) => void;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    existingAnalysis ? "done" : "idle"
  );
  const [analysis, setAnalysis] = useState(existingAnalysis);

  const handleAnalyze = async () => {
    setState("loading");
    try {
      const res = await analyzeJournalEntry(journalId);
      if (res.success) {
        setAnalysis(res.analysis);
        onAnalysisDone(res.analysis);
        setState("done");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  };

  if (state === "idle") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 border border-violet-500/20 rounded-xl p-4 bg-violet-500/5"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <Brain className="w-4 h-4 text-violet-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-0.5">Mau dapat insight dari AI?</p>
            <p className="text-xs text-muted-foreground mb-3">
              MindMate akan membaca jurnalmu dan memberikan refleksi singkat : bukan saran, tapi cerminan hangat.
            </p>
            <Button
              size="sm"
              onClick={handleAnalyze}
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs h-8"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Analisa dengan AI
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (state === "loading") {
    return (
      <div className="mt-6 border border-violet-500/20 rounded-xl p-5 bg-violet-500/5 flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-violet-500 animate-spin shrink-0" />
        <p className="text-sm text-muted-foreground">Membaca jurnalmu dengan penuh perhatian...</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mt-6 border border-destructive/20 rounded-xl p-4 bg-destructive/5">
        <p className="text-sm text-destructive">Gagal menganalisa. Coba lagi nanti.</p>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 border border-violet-500/20 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-violet-500/8 border-b border-violet-500/15 px-4 py-3 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
        <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">Insight dari MindMate</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Mood */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">{analysis.moodEmoji}</span>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Mood Utama</p>
            <p className="text-sm font-semibold capitalize">{analysis.mood}</p>
          </div>
        </div>

        {/* Themes */}
        {analysis.themes?.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2">Tema</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.themes.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium"
                >
                  <Hash className="w-2.5 h-2.5" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Insight */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1.5">Refleksi</p>
          <p className="text-sm leading-relaxed text-foreground/85">{analysis.insight}</p>
        </div>

        {/* Affirmation */}
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 rounded-lg p-3 border border-violet-500/15">
          <p className="text-sm font-medium text-violet-700 dark:text-violet-300 italic">
            &ldquo;{analysis.affirmation}&rdquo;
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Entry reader panel ───────────────────────────────────────────────────────
function EntryReader({
  entry,
  onUpdate,
}: {
  entry: JournalEntry;
  onUpdate: (updated: JournalEntry) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveJournalEntry(entry.id, draft);
      onUpdate({ ...entry, content: draft });
      setEditing(false);
    } catch {
      // silent for now
    } finally {
      setSaving(false);
    }
  };

  const dateStr = new Date(entry.createdAt).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col h-full">
      {/* Entry header */}
      <div className="mb-5">
        <p className="text-xs text-muted-foreground mb-1">{dateStr}</p>
        <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-4">
          <div className="flex gap-2 items-start">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground/80 italic leading-relaxed">&ldquo;{entry.prompt}&rdquo;</p>
          </div>
        </div>
      </div>

      {/* Content */}
      {editing ? (
        <div className="flex flex-col gap-3 flex-1">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 min-h-[180px] resize-none text-sm leading-relaxed border-violet-500/20 focus-visible:ring-violet-500/30"
            placeholder="Tuliskan pikiranmu..."
            autoFocus
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{draft.length} karakter</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setDraft(entry.content); setEditing(false); }}>
                <X className="w-3.5 h-3.5 mr-1" /> Batal
              </Button>
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white"
                onClick={handleSave}
                disabled={!draft.trim() || saving}
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                Simpan
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Tulisanmu</p>
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-muted-foreground hover:text-violet-500 transition-colors flex items-center gap-1"
            >
              <PenLine className="w-3 h-3" /> Edit
            </button>
          </div>
          <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
            {entry.content || <span className="text-muted-foreground/50 italic">Belum ada isi.</span>}
          </p>
        </div>
      )}

      {/* AI analysis : only show if entry has content and not editing */}
      {!editing && entry.content && (
        <AIAnalysisPanel
          journalId={entry.id}
          existingAnalysis={entry.aiAnalysis}
          onAnalysisDone={(analysis) => onUpdate({ ...entry, aiAnalysis: analysis })}
        />
      )}
    </div>
  );
}

// ─── Today's new entry panel ──────────────────────────────────────────────────
function TodayWriter({
  today,
  onSaved,
}: {
  today: TodayJournal;
  onSaved: (entry: JournalEntry) => void;
}) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(today.hasEntry);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await saveJournalEntry(today.journalId, content);
      if (res.success) {
        setSaved(true);
        onSaved(res.data);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full gap-4 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-500" />
        </div>
        <div>
          <p className="font-semibold text-base mb-1">Jurnal hari ini sudah tersimpan 🌟</p>
          <p className="text-sm text-muted-foreground">Pilih tanggal di kalender untuk membaca entri lama.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <p className="text-xs text-muted-foreground mb-1">
          {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-4">
          <div className="flex gap-2 items-start">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground/80 italic leading-relaxed">&ldquo;{today.prompt}&rdquo;</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tidak ada yang salah atau benar. Tulis saja apa yang ada di pikiranmu..."
          className="flex-1 min-h-[200px] resize-none text-sm leading-relaxed border-violet-500/20 focus-visible:ring-violet-500/30"
          autoFocus
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{content.length} karakter</span>
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleSave}
            disabled={!content.trim() || saving}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            )}
            Simpan Jurnal
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function JournalPage() {
  const { isAuthenticated, loading: authLoading } = useSession();
  const router = useRouter();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [today, setToday] = useState<TodayJournal | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [viewingToday, setViewingToday] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login?redirect=/journal");
  }, [isAuthenticated, authLoading, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [historyRes, todayRes] = await Promise.all([
        getJournalHistory({ limit: 50 }),
        getDailyPrompt(),
      ]);
      const history: JournalEntry[] = historyRes.data ?? [];
      setEntries(history);
      setToday(todayRes);
      setViewingToday(true);
      setSelectedEntry(null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, loadData]);

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const found = entries.find((e) => key(new Date(e.createdAt)) === key(date));
    if (found) {
      setSelectedEntry(found);
      setViewingToday(false);
    }
  };

  const handleEntryUpdate = (updated: JournalEntry) => {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setSelectedEntry(updated);
  };

  const handleTodaySaved = (entry: JournalEntry) => {
    setEntries((prev) => {
      const exists = prev.find((e) => e.id === entry.id);
      return exists ? prev.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...prev];
    });
    setToday((prev) => prev ? { ...prev, hasEntry: true } : prev);
  };

  const todayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const todayDate = new Date();

  if (authLoading || (!isAuthenticated && !authLoading)) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="fixed top-14 sm:top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b border-primary/10">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-500" />
              <span className="font-semibold text-sm">Jurnal Harianku</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="md:hidden p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground transition-colors"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="pt-[7rem] sm:pt-[7.5rem] max-w-6xl mx-auto px-4 pb-12">
        <div className="flex gap-5 relative">

          {/* Sidebar */}
          <AnimatePresence>
            {(sidebarOpen) && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-64 shrink-0 hidden md:block"
              >
                <div className="sticky top-[7.5rem] space-y-5">
                  {/* Calendar */}
                  <div className="border border-primary/10 rounded-2xl p-4 bg-card">
                    <MiniCalendar
                      entries={entries}
                      selectedDate={selectedDate}
                      onSelectDate={handleSelectDate}
                    />
                  </div>

                  {/* Today button */}
                  <button
                    onClick={() => { setViewingToday(true); setSelectedEntry(null); setSelectedDate(todayDate); }}
                    className={`
                      w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${viewingToday
                        ? "bg-violet-500 text-white shadow-sm shadow-violet-500/30"
                        : "border border-primary/10 bg-card hover:border-violet-500/30 hover:bg-violet-500/5 text-foreground"}
                    `}
                  >
                    <PenLine className="w-4 h-4" />
                    Jurnal Hari Ini
                  </button>

                  {/* Recent entries list */}
                  {entries.length > 0 && (
                    <div className="border border-primary/10 rounded-2xl overflow-hidden bg-card">
                      <div className="px-4 py-3 border-b border-primary/10">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entri Terbaru</p>
                      </div>
                      <div className="divide-y divide-primary/10 max-h-64 overflow-y-auto">
                        {entries.slice(0, 10).map((entry) => {
                          const d = new Date(entry.createdAt);
                          const isSelected = selectedEntry?.id === entry.id;
                          return (
                            <button
                              key={entry.id}
                              onClick={() => { setSelectedEntry(entry); setViewingToday(false); setSelectedDate(d); }}
                              className={`
                                w-full text-left px-4 py-3 transition-colors
                                ${isSelected ? "bg-violet-500/10" : "hover:bg-primary/5"}
                              `}
                            >
                              <p className="text-xs font-medium text-foreground mb-0.5">
                                {d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {entry.aiAnalysis
                                  ? `${entry.aiAnalysis.moodEmoji} ${entry.aiAnalysis.mood}`
                                  : entry.content.slice(0, 40) + (entry.content.length > 40 ? "…" : "")}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="border border-primary/10 rounded-2xl bg-card min-h-[520px] p-6 md:p-8">
              {loading ? (
                <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Memuat jurnal...</span>
                </div>
              ) : viewingToday && today ? (
                <TodayWriter today={today} onSaved={handleTodaySaved} />
              ) : selectedEntry ? (
                <EntryReader entry={selectedEntry} onUpdate={handleEntryUpdate} />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-violet-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-base mb-1">Pilih tanggal di kalender</p>
                    <p className="text-sm text-muted-foreground">Titik ungu = ada entri di hari itu</p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}