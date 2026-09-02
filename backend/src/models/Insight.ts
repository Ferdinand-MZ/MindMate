import { pool } from "../utils/db";

export const INSIGHT_NAMES = [
  "Depresi Mayor",
  "Gangguan Kecemasan Umum",
  "PTSD (Gangguan Stres Pasca Trauma)",
  "Gangguan Tidur",
  "Gangguan Sosial (Kecemasan Sosial)",
  "Keletihan Mental",
  "Gangguan Makan",
] as const;
export type InsightName = (typeof INSIGHT_NAMES)[number];

// Static per-category reference content. Previously implemented as
// Mongoose schema `default()` functions that keyed off `this.name`; moved
// to plain application-layer data since Postgres has no equivalent hook,
// and this is really static reference data, not user data.
export const INSIGHT_CONTENT: Record<
  InsightName,
  { description: string; symptoms: string[]; solution: string[] }
> = {
  "Depresi Mayor": {
    description:
      "Gangguan mood yang ditandai dengan perasaan sedih yang mendalam, kehilangan minat, dan kelelahan.",
    symptoms: [
      "Kecemasan Berlebihan",
      "Kehilangan Minat",
      "Kelelahan atau Kehilangan Energi",
      "Perasaan Sedih atau Tertekan",
      "Gangguan Tidur",
      "Gangguan Konsentrasi",
      "Perasaan Putus Asa",
    ],
    solution: [
      "Terapi interpersonal atau CBT",
      "Dukungan sosial (bicara dengan teman/keluarga)",
      "Olahraga teratur untuk meningkatkan mood",
      "Jurnal emosi untuk refleksi diri",
      "Konsultasi psikiater untuk pengobatan jika diperlukan",
    ],
  },
  "Gangguan Kecemasan Umum": {
    description:
      "Kecemasan berlebihan yang sulit dikendalikan terkait berbagai masalah dalam hidup.",
    symptoms: [
      "Kecemasan Berlebihan",
      "Perasaan Tidak Terhubung dengan Orang Lain",
      "Rasa Takut akan Ujian",
    ],
    solution: [
      "Teknik relaksasi (pernapasan dalam, meditasi)",
      "Konsultasi dengan psikolog/psikiater",
      "Olahraga teratur untuk mengurangi stres",
      "Hindari kafein dan stimulan",
      "Latihan mindfulness untuk fokus",
    ],
  },
  "PTSD (Gangguan Stres Pasca Trauma)": {
    description:
      "Gangguan emosional yang muncul setelah seseorang mengalami peristiwa traumatik.",
    symptoms: [
      "Perasaan Sedih atau Tertekan",
      "Gangguan Tidur",
      "Kehilangan Nafsu Makan",
      "Perubahan Mood Cepat",
    ],
    solution: [
      "Terapi trauma (EMDR atau CBT trauma-focused)",
      "Dukungan dari kelompok atau komunitas",
      "Latihan relaksasi untuk mengurangi flashback",
      "Konsultasi psikiater untuk gejala berat",
      "Jurnal untuk memproses emosi",
    ],
  },
  "Gangguan Tidur": {
    description:
      "Gangguan tidur yang dapat mencakup insomnia, tidur berlebihan, atau gangguan tidur lainnya.",
    symptoms: ["Gangguan Tidur", "Gangguan Konsentrasi"],
    solution: [
      "Rutin tidur teratur",
      "Hindari layar sebelum tidur",
      "Teknik relaksasi (meditasi, pernapasan)",
      "Hindari kafein di malam hari",
      "Konsultasi dokter jika kronis",
    ],
  },
  "Gangguan Sosial (Kecemasan Sosial)": {
    description:
      "Kecemasan yang berlebihan terhadap interaksi sosial atau presentasi di depan umum.",
    symptoms: [
      "Perasaan Tidak Terhubung dengan Orang Lain",
      "Rasa Takut akan Ujian",
    ],
    solution: [
      "Terapi kelompok untuk latihan sosial",
      "Latihan keterampilan komunikasi",
      "Teknik manajemen stres (visualisasi, pernapasan)",
      "Ikut komunitas atau kelompok sosial",
      "Konsultasi psikolog untuk CBT spesifik",
    ],
  },
  "Keletihan Mental": {
    description:
      "Kelelahan mental akibat beban akademik, stres, atau masalah kehidupan pribadi.",
    symptoms: ["Kelelahan atau Kehilangan Energi", "Perasaan Putus Asa"],
    solution: [
      "Tidur teratur dan cukup",
      "Manajemen stres (meditasi, mindfulness)",
      "Olahraga ringan (yoga, jalan kaki)",
      "Pola makan sehat dan seimbang",
      "Istirahat pendek antar aktivitas",
    ],
  },
  "Gangguan Makan": {
    description:
      "Gangguan makan yang bisa melibatkan anoreksia, bulimia, atau pola makan berlebihan karena stres.",
    symptoms: [
      "Kehilangan Nafsu Makan",
      "Keinginan untuk Menyakitkan Diri Sendiri",
    ],
    solution: [
      "Terapi untuk gangguan makan (CBT-ED)",
      "Makan dalam porsi kecil tapi sering",
      "Konsumsi makanan bergizi tinggi",
      "Konsultasi dokter untuk cek kesehatan",
      "Hindari stres saat makan",
    ],
  },
};

export interface Insight {
  id: string;
  userId: string;
  name: string;
  description: string;
  symptoms: string[];
  solution: string[];
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

function mapInsight(row: any): Insight {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    symptoms: row.symptoms,
    solution: row.solution,
    timestamp: row.timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createInsight(params: {
  userId: string;
  name: string;
  description?: string;
  symptoms?: string[];
  solution?: string[];
}): Promise<Insight> {
  if (!INSIGHT_NAMES.includes(params.name as InsightName)) {
    throw Object.assign(new Error(`Invalid insight name: ${params.name}`), {
      statusCode: 400,
    });
  }
  const defaults = INSIGHT_CONTENT[params.name as InsightName];
  const { rows } = await pool.query(
    `INSERT INTO insights (user_id, name, description, symptoms, solution)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      params.userId,
      params.name,
      params.description ?? defaults.description,
      params.symptoms ?? defaults.symptoms,
      params.solution ?? defaults.solution,
    ]
  );
  return mapInsight(rows[0]);
}

export async function getInsightsByUser(userId: string): Promise<Insight[]> {
  const { rows } = await pool.query(
    `SELECT * FROM insights WHERE user_id = $1 ORDER BY "timestamp" DESC`,
    [userId]
  );
  return rows.map(mapInsight);
}

export async function getInsightsInRange(
  userId: string,
  start: Date,
  end: Date
): Promise<Insight[]> {
  const { rows } = await pool.query(
    `SELECT * FROM insights WHERE user_id = $1 AND "timestamp" BETWEEN $2 AND $3`,
    [userId, start, end]
  );
  return rows.map(mapInsight);
}
