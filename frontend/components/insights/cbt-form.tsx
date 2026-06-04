"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useSession } from "@/lib/contexts/session-context";
import { createInsight } from "@/lib/api/insight";
import { toast } from "@/components/ui/use-toast";

// --------------------- Pertanyaan ---------------------
const questions = [
  "Apakah Anda merasa cemas atau khawatir sepanjang hari ini?",
  "Apakah Anda merasa sangat lelah atau tidak bertenaga?",
  "Apakah Anda merasa tidak tertarik pada aktivitas yang biasanya Anda nikmati?",
  "Apakah Anda merasa tertekan atau sedih hampir sepanjang hari ini?",
  "Apakah Anda merasa lebih mudah marah atau terganggu oleh hal-hal kecil?",
  "Apakah Anda merasa tidak ada harapan atau merasa putus asa?",
  "Apakah Anda merasa terisolasi atau tidak terhubung dengan orang lain?",
  "Apakah Anda merasa sangat senang atau penuh energi?",
  "Apakah perasaan Anda cepat berubah dari senang ke sedih?",
  "Apakah Anda merasa sangat khawatir tentang masa depan?",
  "Apakah Anda merasa takut atau cemas akan hal yang tidak pasti?",
  "Apakah Anda merasa khawatir tentang kesehatan fisik Anda?",
  "Apakah Anda sering merasa tegang atau sakit kepala karena stres?",
  "Apakah Anda merasa sulit mengontrol kecemasan bahkan saat situasi aman?",
  "Apakah Anda merasa kesulitan tidur atau sering terjaga di malam hari?",
  "Apakah Anda merasa lelah meskipun sudah tidur cukup lama?",
  "Apakah Anda tidur lebih banyak dari biasanya karena merasa tertekan?",
  "Apakah Anda terbangun terlalu pagi dan tidak bisa tidur lagi?",
  "Apakah tidur Anda terganggu oleh mimpi buruk?",
  "Apakah Anda merasa cemas saat berinteraksi dengan orang lain?",
];

// --------------------- Mapping Gejala & Penyakit ---------------------
const questionToSymptom: Record<number, string> = {
  1: "Kecemasan Berlebihan",
  2: "Kelelahan atau Kehilangan Energi",
  3: "Kehilangan Minat",
  4: "Perasaan Sedih atau Tertekan",
  5: "Perubahan Mood Cepat",
  6: "Perasaan Putus Asa",
  7: "Perasaan Tidak Terhubung dengan Orang Lain",
  8: "Kelelahan atau Kehilangan Energi",
  9: "Perubahan Mood Cepat",
  10: "Kecemasan Berlebihan",
  11: "Kecemasan Berlebihan",
  12: "Kecemasan Berlebihan",
  13: "Kecemasan Berlebihan",
  14: "Kecemasan Berlebihan",
  15: "Gangguan Tidur",
  16: "Kelelahan atau Kehilangan Energi",
  17: "Gangguan Tidur",
  18: "Gangguan Tidur",
  19: "Gangguan Tidur",
  20: "Rasa Takut akan Ujian",
};

const symptomToDisease: Record<string, string[]> = {
  "Kecemasan Berlebihan": ["Depresi Mayor", "Gangguan Kecemasan Umum"],
  "Kehilangan Minat": ["Depresi Mayor"],
  "Kelelahan atau Kehilangan Energi": ["Depresi Mayor", "Keletihan Mental"],
  "Perasaan Sedih atau Tertekan": ["Depresi Mayor", "PTSD (Gangguan Stres Pasca Trauma)"],
  "Perasaan Putus Asa": ["Depresi Mayor", "Keletihan Mental"],
  "Gangguan Tidur": ["Depresi Mayor", "PTSD (Gangguan Stres Pasca Trauma)", "Gangguan Tidur"],
  "Perasaan Tidak Terhubung dengan Orang Lain": [
    "Gangguan Kecemasan Umum",
    "Gangguan Sosial (Kecemasan Sosial)",
  ],
  "Rasa Takut akan Ujian": ["Gangguan Kecemasan Umum", "Gangguan Sosial (Kecemasan Sosial)"],
  "Perubahan Mood Cepat": ["PTSD (Gangguan Stres Pasca Trauma)"],
  "Gangguan Konsentrasi": ["Depresi Mayor", "Gangguan Tidur"],
};

// --------------------- Insight Data from Backend Model ---------------------
const insightDescriptions: Record<string, string> = {
  "Depresi Mayor": "Gangguan mood yang ditandai dengan perasaan sedih yang mendalam, kehilangan minat, dan kelelahan.",
  "Gangguan Kecemasan Umum": "Kecemasan berlebihan yang sulit dikendalikan terkait berbagai masalah dalam hidup.",
  "PTSD (Gangguan Stres Pasca Trauma)": "Gangguan emosional yang muncul setelah seseorang mengalami peristiwa traumatik.",
  "Gangguan Tidur": "Gangguan tidur yang dapat mencakup insomnia, tidur berlebihan, atau gangguan tidur lainnya.",
  "Gangguan Sosial (Kecemasan Sosial)": "Kecemasan yang berlebihan terhadap interaksi sosial atau presentasi di depan umum.",
  "Keletihan Mental": "Kelelahan mental akibat beban akademik, stres, atau masalah kehidupan pribadi.",
};

const insightSymptoms: Record<string, string[]> = {
  "Depresi Mayor": [
    "Kecemasan Berlebihan",
    "Kehilangan Minat",
    "Kelelahan atau Kehilangan Energi",
    "Perasaan Sedih atau Tertekan",
    "Gangguan Tidur",
    "Gangguan Konsentrasi",
    "Perasaan Putus Asa",
  ],
  "Gangguan Kecemasan Umum": [
    "Kecemasan Berlebihan",
    "Perasaan Tidak Terhubung dengan Orang Lain",
    "Rasa Takut akan Ujian",
  ],
  "PTSD (Gangguan Stres Pasca Trauma)": [
    "Perasaan Sedih atau Tertekan",
    "Gangguan Tidur",
    "Kehilangan Nafsu Makan",
    "Perubahan Mood Cepat",
  ],
  "Gangguan Tidur": ["Gangguan Tidur", "Gangguan Konsentrasi"],
  "Gangguan Sosial (Kecemasan Sosial)": [
    "Perasaan Tidak Terhubung dengan Orang Lain",
    "Rasa Takut akan Ujian",
  ],
  "Keletihan Mental": ["Kelelahan atau Kehilangan Energi", "Perasaan Putus Asa"],
};

const insightSolutions: Record<string, string[]> = {
  "Depresi Mayor": [
    "Terapi interpersonal atau CBT",
    "Dukungan sosial (bicara dengan teman/keluarga)",
    "Olahraga teratur untuk meningkatkan mood",
    "Jurnal emosi untuk refleksi diri",
    "Konsultasi psikiater untuk pengobatan jika diperlukan",
  ],
  "Gangguan Kecemasan Umum": [
    "Teknik relaksasi (pernapasan dalam, meditasi)",
    "Konsultasi dengan psikolog/psikiater",
    "Olahraga teratur untuk mengurangi stres",
    "Hindari kafein dan stimulan",
    "Latihan mindfulness untuk fokus",
  ],
  "PTSD (Gangguan Stres Pasca Trauma)": [
    "Terapi trauma (EMDR atau CBT trauma-focused)",
    "Dukungan dari kelompok atau komunitas",
    "Latihan relaksasi untuk mengurangi flashback",
    "Konsultasi psikiater untuk gejala berat",
    "Jurnal untuk memproses emosi",
  ],
  "Gangguan Tidur": [
    "Rutin tidur teratur",
    "Hindari layar sebelum tidur",
    "Teknik relaksasi (meditasi, pernapasan)",
    "Hindari kafein di malam hari",
    "Konsultasi dokter jika kronis",
  ],
  "Gangguan Sosial (Kecemasan Sosial)": [
    "Terapi kelompok untuk latihan sosial",
    "Latihan keterampilan komunikasi",
    "Teknik manajemen stres (visualisasi, pernapasan)",
    "Ikut komunitas atau kelompok sosial",
    "Konsultasi psikolog untuk CBT spesifik",
  ],
  "Keletihan Mental": [
    "Tidur teratur dan cukup",
    "Manajemen stres (meditasi, mindfulness)",
    "Olahraga ringan (yoga, jalan kaki)",
    "Pola makan sehat dan seimbang",
    "Istirahat pendek antar aktivitas",
  ],
};

// --------------------- Hitung Skor ---------------------
interface InsightEntry {
  userId: string;
  name: string;
  description: string;
  symptoms: string[];
  solution: string[];
}

function calculateDiseaseScores(answers: number[]) {
  const diseaseScores: Record<string, number[]> = {};
  const collectedSymptoms: Record<string, string[]> = {};

  answers.forEach((score, i) => {
    const symptom = questionToSymptom[i + 1];
    const diseases = symptomToDisease[symptom] || [];
    diseases.forEach((disease) => {
      if (!diseaseScores[disease]) {
        diseaseScores[disease] = [];
        collectedSymptoms[disease] = [];
      }
      if (score >= 3) {
        diseaseScores[disease].push(score);
        if (!collectedSymptoms[disease].includes(symptom)) {
          collectedSymptoms[disease].push(symptom);
        }
      }
    });
  });

  const result = Object.entries(diseaseScores)
    .filter(([_, scores]) => scores.length > 0)
    .map(([name, scores]) => ({
      name,
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      symptoms: collectedSymptoms[name] || [],
    }))
    .sort((a, b) => {
      // Hitung kecocokan gejala dengan insightSymptoms
      const matchA = a.symptoms.length >= insightSymptoms[a.name].filter(sym => Object.values(questionToSymptom).includes(sym)).length &&
                     insightSymptoms[a.name].every(sym => !Object.values(questionToSymptom).includes(sym) || a.symptoms.includes(sym));
      const matchB = b.symptoms.length >= insightSymptoms[b.name].filter(sym => Object.values(questionToSymptom).includes(sym)).length &&
                     insightSymptoms[b.name].every(sym => !Object.values(questionToSymptom).includes(sym) || b.symptoms.includes(sym));

      if (matchA && !matchB) return -1;
      if (!matchA && matchB) return 1;
      if (matchA && matchB) {
        // Jika keduanya cocok, prioritaskan berdasarkan jumlah gejala yang cocok, lalu rata-rata
        const countA = a.symptoms.length;
        const countB = b.symptoms.length;
        if (countA !== countB) return countB - countA;
        return b.average - a.average;
      }

      // Hindari Depresi Mayor kecuali semua gejalanya (yang ada di pertanyaan) cocok
      if (a.name === "Depresi Mayor" && !matchA) return 1;
      if (b.name === "Depresi Mayor" && !matchB) return -1;

      return b.average - a.average;
    });

  return result.length > 0 ? result[0] : null;
}

// --------------------- Komponen CBT ---------------------
export function CBTQuiz({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useSession();
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(1));
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ name: string; average: number; symptoms: string[] } | null>(null);

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user?._id) {
      toast({
        title: "Error",
        description: "User tidak terautentikasi",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const topResult = calculateDiseaseScores(answers);

    if (!topResult) {
      toast({
        title: "Tidak Ada Insight Signifikan",
        description: "Tidak ada gejala signifikan yang terdeteksi dari jawaban Anda.",
        variant: "default",
      });
      setSubmitting(false);
      return;
    }

    setResult(topResult);

    try {
      const insightData: InsightEntry = {
        userId: user._id,
        name: topResult.name,
        description: insightDescriptions[topResult.name] || "Tidak ada deskripsi tersedia",
        symptoms: topResult.symptoms.filter((s) => insightSymptoms[topResult.name].includes(s)),
        solution: insightSolutions[topResult.name] || [],
      };

      await createInsight(insightData);
      toast({
        title: "Insight Tersimpan",
        description: `Insight "${topResult.name}" berhasil disimpan.`,
      });
    } catch (err: any) {
      console.error("Gagal menyimpan insight:", err);
      toast({
        title: "Error",
        description: err.message || "Gagal menyimpan insight. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {
      if (!submitting) {
        setStep(0);
        setAnswers(Array(questions.length).fill(1));
        setResult(null);
        onClose();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {!result
              ? `CBT Questions (${step + 1}/${questions.length})`
              : "Hasil Analisis CBT"}
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <>
            <p className="text-base mb-4">{questions[step]}</p>
            <div className="space-y-2">
              <Slider
                value={[answers[step]]}
                min={1}
                max={5}
                step={1}
                onValueChange={(val) => {
                  const newAns = [...answers];
                  newAns[step] = val[0];
                  setAnswers(newAns);
                }}
                disabled={submitting}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tidak Pernah</span>
                <span>Selalu</span>
              </div>
              <p className="text-center text-sm font-medium">
                Skor: {answers[step]}
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleNext} disabled={submitting}>
                {submitting ? "Mengirim..." : step === questions.length - 1 ? "Selesai" : "Lanjut"}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-bold">{result.name}</h2>
            <p className="text-muted-foreground">
              Skor rata-rata: {result.average.toFixed(2)}
            </p>
            <p className="text-muted-foreground">
              Gejala: {result.symptoms.join(", ") || "Tidak ada gejala signifikan"}
            </p>
            <Button className="mt-4" onClick={() => {
              setStep(0);
              setAnswers(Array(questions.length).fill(1));
              setResult(null);
              onClose();
            }}>
              Tutup
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}