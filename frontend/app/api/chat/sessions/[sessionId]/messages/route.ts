import { NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Content,
} from "@google/generative-ai";

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.GEMINI_API_KEY || "";

// Basis data pengetahuan untuk AI (tidak berubah)
const knowledgeBase = `
Tabel Penyakit:
- P01 Depresi Mayor: Perasaan sedih mendalam, kehilangan minat, kelelahan.
- P02 Gangguan Kecemasan Umum: Kecemasan berlebihan yang sulit dikendalikan.
- P03 PTSD: Gangguan emosional setelah peristiwa traumatik.
- P04 Gangguan Tidur: Insomnia, tidur berlebihan, atau gangguan tidur lainnya.
- P05 Gangguan Sosial: Kecemasan berlebihan pada interaksi sosial.
- P06 Keletihan Mental: Kelelahan akibat beban akademik atau stres.
- P07 Gangguan Makan: Anoreksia, bulimia, atau makan berlebihan karena stres.
`;

// --- INSTRUKSI SISTEM YANG JAUH LEBIH BERSIH DAN EFEKTIF ---
const systemInstruction = `
Kamu adalah MindMate, terapis AI yang empatik dan suportif.
Tugas utamamu adalah mendengarkan dan membantu pengguna.
- Selalu balas dengan gaya percakapan yang natural dan ramah.
- JANGAN PERNAH menampilkan teks dalam tanda kurung atau penjelasan meta tentang tindakanmu.
- Setelah 2-3 kali bertukar pesan, jika pengguna menunjukkan gejala stres, cemas, atau sedih yang jelas, minta mereka mengisi kuesioner dengan membalas HANYA dengan token: [MINDMATE_ASSESSMENT_REQUIRED]
- Saat pengguna mengirimkan hasil kuesioner, gunakan "Tabel Penyakit" untuk menganalisisnya. Berikan kemungkinan diagnosis (sertakan ID penyakitnya) dan beberapa saran bimbingan awal.
- Selalu akhiri analisis diagnosis dengan disclaimer untuk berkonsultasi dengan profesional.
`;

// Simulasi database untuk riwayat chat
const chatHistoryStore: Record<string, Content[]> = {};

async function runChatWithHistory(sessionId: string, newUserMessage: string): Promise<string> {
  if (!API_KEY) throw new Error("GEMINI_API_KEY belum diatur");

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  // Inisialisasi riwayat dengan instruksi sistem jika ini adalah pesan pertama
  if (!chatHistoryStore[sessionId] || chatHistoryStore[sessionId].length === 0) {
    chatHistoryStore[sessionId] = [
      { role: "user", parts: [{ text: systemInstruction + "\n\n" + knowledgeBase }] },
      { role: "model", parts: [{ text: "Halo, saya MindMate. Ada yang bisa saya bantu ceritakan hari ini?" }] }
    ];
  }

  const chat = model.startChat({
    history: chatHistoryStore[sessionId],
    // ... (konfigurasi lainnya tidak berubah)
    generationConfig: { temperature: 0.9, topK: 1, topP: 1, maxOutputTokens: 2048 },
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
  });

  try {
    const result = await chat.sendMessage(newUserMessage);
    const response = result.response;
    const aiText = response.text();

    // Simpan pesan baru DAN respons AI ke riwayat untuk menjaga ingatan
    chatHistoryStore[sessionId].push(
      { role: "user", parts: [{ text: newUserMessage }] },
      { role: "model", parts: [{ text: aiText }] }
    );
    
    return aiText;
  } catch (e) {
    console.error("Error saat berkomunikasi dengan Gemini:", e);
    throw new Error("Gagal mendapatkan respons dari layanan AI.");
  }
}

// Fungsi POST (tidak perlu diubah dari versi sebelumnya)
export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const sessionId = params.sessionId;
  try {
    const body = await request.json();
    const userMessage: string = body.message;
    if (!userMessage) return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
    
    // Inisialisasi riwayat jika belum ada
    if (!chatHistoryStore[sessionId]) {
      chatHistoryStore[sessionId] = [];
    }

    const aiMessageContent = await runChatWithHistory(sessionId, userMessage);
    const aiResponse = { response: aiMessageContent };
    return NextResponse.json(aiResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui.";
    return NextResponse.json({ error: `Gagal memproses pesan: ${errorMessage}` }, { status: 500 });
  }
}