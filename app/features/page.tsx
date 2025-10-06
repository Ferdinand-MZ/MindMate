"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  Brain,
  Shield,
  Fingerprint,
  Activity,
  Bot,
  LineChart,
  Wifi,
  Heart,
} from "lucide-react";

const features = [
  {
    icon: <Bot className="w-10 h-10 text-primary" />,
    title: "Terapi Berbasis AI",
    description:
      "Akses 24/7 ke agen AI yang empatik dan terlatih dalam berbagai pendekatan terapi, memberikan dukungan kesehatan mental yang dipersonalisasi.",
  },
  {
    icon: <Shield className="w-10 h-10 text-primary" />,
    title: "Keamanan Blockchain",
    description:
      "Sesi terapi Anda diamankan dengan teknologi blockchain, memastikan privasi penuh dan pencatatan yang transparan.",
  },
  {
    icon: <Brain className="w-10 h-10 text-primary" />,
    title: "Analisis Cerdas",
    description:
      "NLP dan deteksi emosi tingkat lanjut membantu memahami kondisi mental Anda dan memberikan intervensi yang tepat.",
  },
  {
    icon: <Activity className="w-10 h-10 text-primary" />,
    title: "Deteksi Krisis",
    description:
      "Pemantauan real-time dan protokol respons darurat memastikan keselamatan Anda dalam situasi kritis.",
  },
  
  {
    icon: <LineChart className="w-10 h-10 text-primary" />,
    title: "Pelacakan Perkembangan",
    description:
      "Analitik dan wawasan detail tentang perjalanan kesehatan mental Anda, dengan catatan sesi yang diverifikasi blockchain.",
  },
  {
    icon: <Fingerprint className="w-10 h-10 text-primary" />,
    title: "Privasi Utama",
    description:
      "Enkripsi end-to-end dan zero-knowledge proof memastikan data Anda tetap sepenuhnya rahasia.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Fitur Platform
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Temukan bagaimana platform berbasis AI kami merevolusi dukungan
          kesehatan mental dengan teknologi mutakhir dan perlindungan privasi
          yang tak tergoyahkan.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="p-6 h-full hover:shadow-lg transition-shadow duration-300 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="text-center mt-16"
      >
        <h2 className="text-2xl font-semibold mb-4">Siap untuk Memulai?</h2>
        <p className="text-muted-foreground mb-8">
          Bergabunglah dengan banyak pengguna yang telah merasakan manfaat dari
          dukungan kesehatan mental berbasis AI.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Mulai Perjalanan Anda
          <Heart className="ml-2 w-5 h-5" />
        </a>
      </motion.div>
    </div>
  );
}
