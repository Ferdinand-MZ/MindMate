"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createChatSession } from "@/lib/api/chat";
import { ScrollArea } from "@/components/ui/scroll-area";

// Daftar pertanyaan untuk kuesioner (pertanyaan lama + baru)
const questions = [
  { id: "q1", text: "Apakah anda merasa cemas atau khawatir sepanjang hari ini ?" },
  { id: "q2", text: "Apakah anda merasa sangat lelah atau tidak bertenaga ?" },
  { id: "q3", text: "Apakah anda merasa tidak tertarik atau kehilangan minat pada aktivitas yang biasanya anda nikmati ?" },
  { id: "q4", text: "Apakah Anda merasa tertekan atau sedih hampir sepanjang hari ini?" },
  { id: "q5", text: "Apakah Anda merasa lebih mudah marah atau terganggu oleh hal-hal kecil?" },
  { id: "q6", text: "Apakah Anda merasa tidak ada harapan atau merasa putus asa?" },
  { id: "q7", text: "Apakah Anda merasa terisolasi atau tidak terhubung dengan orang lain?" },
  { id: "q8", text: "Apakah Anda merasa sangat senang atau penuh energi?" },
  { id: "q9", text: "Apakah Anda merasa perasaan Anda sangat cepat berubah dari senang menjadi sedih?" },
  { id: "q10", text: "Apakah Anda merasa sangat khawatir atau cemas tentang masa depan?" },
  { id: "q11", text: "Apakah Anda merasa takut atau cemas akan kejadian yang tidak pasti atau tidak dapat dikendalikan?" },
  { id: "q12", text: "Apakah Anda merasa khawatir tentang kesehatan fisik Anda?" },
  { id: "q13", text: "Apakah Anda sering merasa ketegangan tubuh atau sakit kepala karena stres?" },
  { id: "q14", text: "Apakah Anda merasa tidak bisa mengontrol kecemasan Anda, bahkan saat situasi sudah aman?" },
  { id: "q15", text: "Apakah Anda merasa kesulitan tidur atau sering terjaga di malam hari?" },
  { id: "q16", text: "Apakah Anda merasa lelah atau tidak segar meskipun sudah tidur cukup lama?" },
  { id: "q17", text: "Apakah Anda tidur lebih banyak dari biasanya karena merasa tertekan atau cemas?" },
  { id: "q18", text: "Apakah Anda terbangun terlalu pagi dan tidak bisa tidur kembali?" },
  { id: "q19", text: "Apakah Anda merasa tidur Anda terganggu oleh mimpi buruk atau kilas balik yang tidak menyenangkan?" },
  { id: "q20", text: "Apakah Anda merasa cemas atau khawatir saat berinteraksi dengan orang lain?" },
];

// Inisialisasi state jawaban secara dinamis
const initialAnswers = questions.reduce((acc, q) => {
  acc[q.id] = "";
  return acc;
}, {} as Record<string, string>);


export function MoodForm({ onFinished }: { onFinished?: () => void }) {
  const [answers, setAnswers] = useState(initialAnswers);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validasi dinamis: Pastikan semua pertanyaan dijawab
    const unansweredQuestions = questions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      toast({
        title: "Belum Selesai",
        description: `Silakan jawab ${unansweredQuestions.length} pertanyaan lagi.`,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Format hasil kuesioner menjadi sebuah pesan secara dinamis
    const messageBody = questions.map((q, index) => {
      return `${index + 1}. **${q.text}**\n   Jawaban: ${answers[q.id]}`;
    }).join("\n\n");

    const formattedMessage = `Halo MindMate, saya baru saja menyelesaikan kuesioner suasana hati harian. Berikut hasilnya:\n\n${messageBody}\n\nBerdasarkan jawaban ini, bisakah kamu memberikan analisis singkat dan beberapa saran untuk saya?`;

    try {
      const newSessionId = await createChatSession();
      if (newSessionId && typeof newSessionId === 'string') {
        localStorage.setItem(
          `mindmate_initial_message_${newSessionId}`,
          formattedMessage
        );
        
        if(onFinished) {
          onFinished();
        }

        router.push(`/therapy/${newSessionId}`);
      } else {
        throw new Error("Gagal membuat sesi chat baru.");
      }
    } catch (error) {
      console.error("Error submitting mood questionnaire:", error);
      toast({
        title: "Terjadi Kesalahan",
        description: "Tidak dapat mengirimkan data. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Kuesioner Suasana Hati Harian</CardTitle>
          <CardDescription>
            Jawab pertanyaan berikut untuk membantu AI menganalisis kondisi Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-6">
              {questions.map((q, index) => (
                <div key={q.id}>
                  <Label className="font-semibold">
                    {index + 1}. {q.text}
                  </Label>
                  <RadioGroup
                    className="mt-2 flex space-x-4"
                    onValueChange={(value) => handleAnswerChange(q.id, value)}
                    value={answers[q.id]}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Ya" id={`${q.id}-yes`} />
                      <Label htmlFor={`${q.id}-yes`}>Ya</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Tidak" id={`${q.id}-no`} />
                      <Label htmlFor={`${q.id}-no`}>Tidak</Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Menyimpan..." : "Simpan dan Analisa dengan AI"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}