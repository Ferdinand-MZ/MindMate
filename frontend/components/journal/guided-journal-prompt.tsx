"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getDailyPrompt, saveJournalEntry } from "@/lib/api/features";

interface JournalState {
  prompt: string;
  journalId: string;
  hasEntry: boolean;
  isExisting: boolean;
}

export function GuidedJournalPrompt() {
  const [journal, setJournal] = useState<JournalState | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPrompt();
  }, []);

  const loadPrompt = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDailyPrompt();
      setJournal(data);
      setSaved(data.hasEntry);
      if (data.hasEntry) {
        setExpanded(false);
      }
    } catch (err) {
      setError("Gagal memuat prompt hari ini");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!journal || !content.trim()) return;
    try {
      setSaving(true);
      await saveJournalEntry(journal.journalId, content);
      setSaved(true);
      setExpanded(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Card className="border-primary/10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-transparent pointer-events-none z-0" />
      <CardContent className="p-6 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
              {saved ? (
                <CheckCircle2 className="w-5 h-5 text-violet-500" />
              ) : (
                <BookOpen className="w-5 h-5 text-violet-500" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-base">Jurnal Harian</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {today}
              </p>
            </div>
          </div>
          {saved && (
            <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-full font-medium">
              ✓ Selesai
            </span>
          )}
        </div>

        {/* Prompt */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat prompt hari ini...
          </div>
        ) : error ? (
          <p className="text-sm text-destructive py-2">{error}</p>
        ) : journal ? (
          <>
            <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-4 mb-4">
              <div className="flex gap-2 items-start">
                <Sparkles className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                <p className="text-sm leading-relaxed text-foreground/90 italic">
                  &ldquo;{journal.prompt}&rdquo;
                </p>
              </div>
            </div>

            {/* Write toggle */}
            {!saved && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-violet-500 hover:text-violet-600 hover:bg-violet-500/10 mb-3"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" /> Tutup
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" /> Tulis jawabanku
                  </>
                )}
              </Button>
            )}

            <AnimatePresence>
              {expanded && !saved && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <Textarea
                    placeholder="Tuliskan pikiranmu di sini... Tidak ada yang salah atau benar."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="mb-3 min-h-[120px] resize-none text-sm border-violet-500/20 focus-visible:ring-violet-500/30"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {content.length} karakter
                    </span>
                    <Button
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-700 text-white"
                      onClick={handleSave}
                      disabled={!content.trim() || saving}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                      )}
                      Simpan
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {saved && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-muted-foreground text-center"
              >
                🌟 Jurnal hari ini sudah tersimpan. Sampai jumpa besok!
              </motion.p>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}