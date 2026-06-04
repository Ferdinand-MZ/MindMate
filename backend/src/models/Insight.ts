import mongoose, { Document, Schema } from "mongoose";

export interface IInsight extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  symptoms: string[];
  solution: string[];
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const insightSchema = new Schema<IInsight>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      enum: [
        "Depresi Mayor",
        "Gangguan Kecemasan Umum",
        "PTSD (Gangguan Stres Pasca Trauma)",
        "Gangguan Tidur",
        "Gangguan Sosial (Kecemasan Sosial)",
        "Keletihan Mental",
        "Gangguan Makan",
      ],
    },
    description: {
      type: String,
      required: true,
      default: function (this: IInsight) {
        switch (this.name) {
          case "Depresi Mayor":
            return "Gangguan mood yang ditandai dengan perasaan sedih yang mendalam, kehilangan minat, dan kelelahan.";
          case "Gangguan Kecemasan Umum":
            return "Kecemasan berlebihan yang sulit dikendalikan terkait berbagai masalah dalam hidup.";
          case "PTSD (Gangguan Stres Pasca Trauma)":
            return "Gangguan emosional yang muncul setelah seseorang mengalami peristiwa traumatik.";
          case "Gangguan Tidur":
            return "Gangguan tidur yang dapat mencakup insomnia, tidur berlebihan, atau gangguan tidur lainnya.";
          case "Gangguan Sosial (Kecemasan Sosial)":
            return "Kecemasan yang berlebihan terhadap interaksi sosial atau presentasi di depan umum.";
          case "Keletihan Mental":
            return "Kelelahan mental akibat beban akademik, stres, atau masalah kehidupan pribadi.";
          case "Gangguan Makan":
            return "Gangguan makan yang bisa melibatkan anoreksia, bulimia, atau pola makan berlebihan karena stres.";
          default:
            return "";
        }
      },
    },
    symptoms: {
      type: [String],
      required: true,
      default: function (this: IInsight) {
        switch (this.name) {
          case "Depresi Mayor":
            return [
              "Kecemasan Berlebihan",
              "Kehilangan Minat",
              "Kelelahan atau Kehilangan Energi",
              "Perasaan Sedih atau Tertekan",
              "Gangguan Tidur",
              "Gangguan Konsentrasi",
              "Perasaan Putus Asa",
            ];
          case "Gangguan Kecemasan Umum":
            return [
              "Kecemasan Berlebihan",
              "Perasaan Tidak Terhubung dengan Orang Lain",
              "Rasa Takut akan Ujian",
            ];
          case "PTSD (Gangguan Stres Pasca Trauma)":
            return [
              "Perasaan Sedih atau Tertekan",
              "Gangguan Tidur",
              "Kehilangan Nafsu Makan",
              "Perubahan Mood Cepat",
            ];
          case "Gangguan Tidur":
            return ["Gangguan Tidur", "Gangguan Konsentrasi"];
          case "Gangguan Sosial (Kecemasan Sosial)":
            return [
              "Perasaan Tidak Terhubung dengan Orang Lain",
              "Rasa Takut akan Ujian",
            ];
          case "Keletihan Mental":
            return ["Kelelahan atau Kehilangan Energi", "Perasaan Putus Asa"];
          case "Gangguan Makan":
            return [
              "Kehilangan Nafsu Makan",
              "Keinginan untuk Menyakitkan Diri Sendiri",
            ];
          default:
            return [];
        }
      },
    },
    solution: {
      type: [String],
      required: true,
      default: function (this: IInsight) {
        const solutions: { [key: string]: string[] } = {
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
          "Gangguan Makan": [
            "Terapi untuk gangguan makan (CBT-ED)",
            "Makan dalam porsi kecil tapi sering",
            "Konsumsi makanan bergizi tinggi",
            "Konsultasi dokter untuk cek kesehatan",
            "Hindari stres saat makan",
          ],
        };
        return solutions[this.name] || [];
      },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
insightSchema.index({ userId: 1, timestamp: -1 });

export const Insight = mongoose.model<IInsight>("Insight", insightSchema);