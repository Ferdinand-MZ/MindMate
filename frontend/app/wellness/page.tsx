"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Container } from "@/components/ui/container";
import { GuidedJournalPrompt } from "@/components/journal/guided-journal-prompt";
import { BreathingExercise } from "@/components/wellness/breathing-exercise";
import { ProgressReport } from "@/components/wellness/progress-report";
import { CommunityBoard } from "@/components/community/community-board";
import { useSession } from "@/lib/hooks/use-session";

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function WellnessPage() {
  const { isAuthenticated, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login?redirect=/wellness");
    }
  }, [isAuthenticated, loading, router]);

  // Show nothing while checking auth, redirect happens in effect
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-20 pb-12 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Heart className="w-4 h-4" />
            Wellness Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Ruang Kesehatan Mentalmu
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Jurnal harian, latihan pernapasan, laporan kemajuan, dan komunitas
            anonim — semua dalam satu tempat.
          </p>
        </motion.div>

        {/* Features grid — each cell is isolated (no overflow issues) */}
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        >
          <motion.div variants={fadeUp} className="relative min-w-0">
            <GuidedJournalPrompt />
          </motion.div>

          <motion.div variants={fadeUp} className="relative min-w-0">
            <BreathingExercise />
          </motion.div>

          <motion.div variants={fadeUp} className="relative min-w-0">
            <ProgressReport />
          </motion.div>

          <motion.div variants={fadeUp} className="relative min-w-0">
            <CommunityBoard />
          </motion.div>
        </motion.div>
      </Container>
    </div>
  );
}