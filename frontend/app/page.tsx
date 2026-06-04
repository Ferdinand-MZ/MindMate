"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Brain,
  Shield,
  Waves,
  ArrowRight,
  Sparkles,
  HeartPulse,
  Lightbulb,
  Lock,
  MessageSquareHeart,
} from "lucide-react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import React from "react";
import { Ripple } from "@/components/ui/ripple";

export default function Home() {
  const emotions = [
    { value: 0, label: "😔 Murung", color: "from-blue-500/50" },
    { value: 25, label: "😊 Puas", color: "from-green-500/50" },
    { value: 50, label: "😌 Tenang", color: "from-purple-500/50" },
    { value: 75, label: "🤗 Senang", color: "from-yellow-500/50" },
    { value: 100, label: "✨ Semangat", color: "from-pink-500/50" },
  ];

  const [emotion, setEmotion] = useState(50);
  const [mounted, setMounted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const welcomeSteps = [
    {
      title: "Hi, Saya MindMate 👋",
      description:
        "Teman AI kamu untuk kesejahteraan emosional. Saya hadir untuk menyediakan ruang aman tanpa penilaian agar kamu bisa bebas berekspresi.",
      icon: Waves,
    },
    {
      title: "Dukungan Personal 🌱",
      description:
        "Saya beradaptasi dengan kebutuhan dan kondisi emosional kamu, menawarkan teknik berbasis bukti dan panduan lembut saat kamu paling membutuhkannya.",
      icon: Brain,
    },
    {
      title: "Privasi kamu Terjamin 🛡️",
      description:
        "Percakapan kita sepenuhnya pribadi dan aman. Saya mengikuti pedoman etis yang ketat dan menghormati batasan kamu.",
      icon: Shield,
    },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentEmotion =
    emotions.find((em) => Math.abs(emotion - em.value) < 15) || emotions[2];

  const features = [
    {
      icon: HeartPulse,
      title: "Dukungan 24/7",
      description: "Selalu ada untuk mendengarkan dan mendukung kamu, kapan saja.",
      color: "from-rose-500/20",
      delay: 0.2,
    },
    {
      icon: Lightbulb,
      title: "Wawasan Cerdas",
      description: "Panduan personal didukung oleh kecerdasan emosional.",
      color: "from-amber-500/20",
      delay: 0.4,
    },
    {
      icon: Lock,
      title: "Pribadi & Aman",
      description: "Percakapan kamu selalu bersifat rahasia dan terenkripsi.",
      color: "from-emerald-500/20",
      delay: 0.6,
    },
    {
      icon: MessageSquareHeart,
      title: "Berbasis Bukti",
      description: "Teknik terapeutik yang didukung oleh riset klinis.",
      color: "from-blue-500/20",
      delay: 0.8,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] mt-16 sm:mt-20 flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
        {/* Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div
            className={`absolute w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] rounded-full blur-3xl top-0 -left-20 transition-all duration-700 ease-in-out
             bg-gradient-to-r ${currentEmotion.color} to-transparent opacity-60`}
          />
          <div className="absolute w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] rounded-full bg-secondary/10 blur-3xl bottom-0 right-0 animate-pulse delay-700" />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />
        </div>
        <Ripple className="opacity-60" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative space-y-6 sm:space-y-8"
        >
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm border border-primary/20 bg-primary/5 backdrop-blur-sm hover:border-primary/40 transition-all duration-300">
            <Waves className="w-4 h-4 text-primary" />
            <span className="text-foreground/90 dark:text-foreground">
              Teman Kesehatan Mental Berbasis AI
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            <span className="inline-block bg-gradient-to-r from-primary via-primary/90 to-secondary bg-clip-text text-transparent">
              Temukan Ketenangan
            </span>
            <br />
            <span className="inline-block mt-2 bg-gradient-to-b from-foreground to-foreground/90 bg-clip-text text-transparent">
              Pikiranmu
            </span>
          </h1>

          {/* Description */}
          <p className="max-w-[600px] mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed tracking-wide">
            Cobalah cara baru mendapatkan dukungan emosional. Teman AI kami siap
            mendengarkan, memahami, dan memandu kamu.
          </p>

          {/* Emotions */}
          <motion.div
            className="w-full max-w-[600px] mx-auto space-y-6 py-6 sm:py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground/80 font-medium">
                Apa pun yang kamu rasakan, kami siap mendengarkan
              </p>
              <div className="flex justify-between items-center px-1 sm:px-2">
                {emotions.map((em) => (
                  <div
                    key={em.value}
                    className={`transition-all duration-500 ease-out cursor-pointer hover:scale-105 ${
                      Math.abs(emotion - em.value) < 15
                        ? "opacity-100 scale-110"
                        : "opacity-50"
                    }`}
                    onClick={() => setEmotion(em.value)}
                  >
                    <div className="text-xl sm:text-2xl">{em.label.split(" ")[0]}</div>
                    <div className="text-[10px] sm:text-xs mt-1 text-muted-foreground font-medium">
                      {em.label.split(" ")[1]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative px-2">
              <div
                className={`absolute inset-0 bg-gradient-to-r ${currentEmotion.color} to-transparent blur-2xl -z-10 transition-all duration-500`}
              />
              <Slider
                value={[emotion]}
                onValueChange={(value) => setEmotion(value[0])}
                min={0}
                max={100}
                step={1}
                className="py-3 sm:py-4"
              />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground animate-pulse">
              Geser untuk mengekspresikan perasaan kamu hari ini
            </p>
          </motion.div>

          {/* Button */}
          <Button
            size="lg"
            onClick={() => setShowDialog(true)}
            className="h-11 sm:h-12 px-6 sm:px-8 rounded-full bg-gradient-to-r from-primary via-primary/90 to-secondary hover:to-primary shadow-lg shadow-primary/20 transition-all duration-500"
          >
            <span className="flex items-center gap-2">
              Mulai Perjalanan kamu
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Button>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-12 sm:mb-16 space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
              Bagaimana MindMate Membantu kamu
            </h2>
            <p className="text-sm sm:text-base text-foreground/80 max-w-2xl mx-auto">
              Rasakan dukungan emosional baru, didukung oleh AI yang empatik.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: feature.delay, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Card className="group relative overflow-hidden border border-primary/10 hover:border-primary/20 transition-all duration-300 bg-card/30 backdrop-blur-sm h-auto sm:h-[200px]">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                  />
                  <CardHeader className="pb-2 sm:pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">
                        {feature.title}
                      </h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px] bg-card/80 backdrop-blur-lg">
          <DialogHeader>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {React.createElement(welcomeSteps[currentStep].icon, {
                  className: "w-7 h-7 sm:w-8 sm:h-8 text-primary",
                })}
              </div>
              <DialogTitle className="text-xl sm:text-2xl text-center">
                {welcomeSteps[currentStep].title}
              </DialogTitle>
              <DialogDescription className="text-center text-sm sm:text-base leading-relaxed">
                {welcomeSteps[currentStep].description}
              </DialogDescription>
            </motion.div>
          </DialogHeader>
          <div className="flex justify-between items-center mt-8">
            <div className="flex gap-2">
              {welcomeSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentStep ? "bg-primary w-4" : "bg-primary/20"
                  }`}
                />
              ))}
            </div>
            <Button
              onClick={() => {
                if (currentStep < welcomeSteps.length - 1) {
                  setCurrentStep((c) => c + 1);
                } else {
                  setShowDialog(false);
                  setCurrentStep(0);
                }
              }}
              className="px-5 sm:px-6"
            >
              {currentStep === welcomeSteps.length - 1 ? (
                <>
                  Mari Mulai <Sparkles className="w-4 h-4 animate-pulse" />
                </>
              ) : (
                <>
                  Lanjut{" "}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
