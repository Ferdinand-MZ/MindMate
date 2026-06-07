"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Loader2,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDailyPrompt } from "@/lib/api/features";
import Link from "next/link";

interface JournalState {
  prompt: string;
  journalId: string;
  hasEntry: boolean;
  isExisting: boolean;
}

export function GuidedJournalPrompt() {
  const [journal, setJournal] = useState<JournalState | null>(null);
  const [loading, setLoading] = useState(true);
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
    } catch (err) {
      setError("Gagal memuat prompt hari ini");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Card className="border-primary/10 overflow-hidden h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-transparent pointer-events-none z-0" />
      <CardContent className="p-6 relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
              {journal?.hasEntry ? (
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
          {journal?.hasEntry && (
            <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-full font-medium">
              ✓ Selesai
            </span>
          )}
        </div>

        {/* Prompt preview */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat prompt hari ini...
          </div>
        ) : error ? (
          <p className="text-sm text-destructive py-2">{error}</p>
        ) : journal ? (
          <div className="flex-1 flex flex-col justify-between">
            {/* Prompt */}
            <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-4 mb-4">
              <div className="flex gap-2 items-start">
                <Sparkles className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                <p className="text-sm leading-relaxed text-foreground/90 italic">
                  &ldquo;{journal.prompt}&rdquo;
                </p>
              </div>
            </div>

            {/* CTA */}
            <div>
              {journal.hasEntry ? (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-2"
                >
                  <p className="text-sm text-muted-foreground text-center mb-2">
                    🌟 Jurnal hari ini sudah tersimpan.
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-full border-violet-500/25 hover:border-violet-500/50 hover:bg-violet-500/5">
                    <Link href="/journal">
                      <BookOpen className="w-4 h-4 mr-2 text-violet-500" />
                      Lihat semua jurnal
                      <ArrowRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
                    </Link>
                  </Button>
                </motion.div>
              ) : (
                <Button asChild className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                  <Link href="/journal">
                    <PenLine className="w-4 h-4 mr-2" />
                    Tulis jurnal sekarang
                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// Need to import PenLine
import { PenLine } from "lucide-react";