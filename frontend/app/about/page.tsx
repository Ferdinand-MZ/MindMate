"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Heart, Target, Sparkles } from "lucide-react";

const missions = [
  {
    icon: <Heart className="w-8 h-8 text-primary" />,
    title: "Misi Kami",
    description:
      "Menyediakan ruang percakapan reflektif yang ramah dan bebas stigma, menerapkan CBT untuk mengubah pola pikir negatif, mendorong kebiasaan berpikir positif dan kesadaran diri, serta menjaga privasi data sebagai prioritas, sambil menjadi teman virtual yang mendukung secara emosional dan edukatif.",
  },
  {
    icon: <Target className="w-8 h-8 text-primary" />,
    title: "Visi Kami",
    description:
      "Mewujudkan pendamping digital yang membantu pelajar dan mahasiswa memahami diri, mengelola emosi, serta menjaga kesehatan mental secara positif, mudah, dan aman.",
  },
  {
    icon: <Sparkles className="w-8 h-8 text-primary" />,
    title: "Nilai-Nilai Kami",
    description:
      "Berlandaskan empati, menjaga kerahasiaan, mendorong keterbukaan dan refleksi diri, serta mendukung pertumbuhan positif pengguna dalam setiap percakapan.",
  },
];

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-24">
      {/* Bagian Utama */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-20"
      >
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Tentang MindMate
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
        Chatbot berbasis web yang menggabungkan kecerdasan buatan (AI) dengan pendekatan Cognitive Behavioral Therapy (CBT)
        metode psikologis yang membantu seseorang memahami hubungan antara pikiran, perasaan, dan perilakunya.
        </p>
      </motion.div>

      {/* Kartu Misi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {missions.map((mission, index) => (
          <motion.div
            key={mission.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="p-6 text-center h-full bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="mb-4 flex justify-center">{mission.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{mission.title}</h3>
              <p className="text-muted-foreground">{mission.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}