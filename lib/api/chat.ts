export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    technique: string;
    goal: string;
    progress: any[];
    analysis?: {
      emotionalState: string;
      themes: string[];
      riskLevel: number;
      recommendedApproach: string;
      progressIndicators: string[];
    };
  };
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse {
  message: string;
  response?: string;
  analysis?: {
    emotionalState: string;
    themes: string[];
    riskLevel: number;
    recommendedApproach: string;
    progressIndicators: string[];
  };
  metadata?: {
    technique: string;
    goal: string;
    progress: any[];
  };
}

const API_BASE =
  process.env.API_URL ||"http://localhost:3001";

// Fungsi helper untuk mendapatkan header dengan token autentikasi (auth Header)
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const createChatSession = async (): Promise<string> => {
  try {
    console.log("Membuat sesi chat baru...");
    const response = await fetch(`${API_BASE}/chat/sessions`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Gagal untuk membuat sesi chat:", error);
      throw new Error(error.error || "Gagal untuk membuat sesi chat");
    }

    const data = await response.json();
    console.log("Chat sesi dibuat:", data);
    return data.sessionId;
  } catch (error) {
    console.error("Gagal membuat sesi chat:", error);
    throw error;
  }
};

export const sendChatMessage = async (
  sessionId: string,
  message: string
): Promise<ApiResponse> => {
  try {
    console.log(`Mengirim pesan untuk sesi ${sessionId}:`, message);
    const response = await fetch(
      `${API_BASE}/chat/sessions/${sessionId}/messages`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Gagal mengirim pesan:", error);
      throw new Error(error.error || "Gagal mengirim pesan");
    }

    const data = await response.json();
    console.log("Pesan berhasil dikirim:", data);
    return data;
  } catch (error) {
    console.error("Error mengirim pesan", error);
    throw error;
  }
};

export const getChatHistory = async (
  sessionId: string
): Promise<ChatMessage[]> => {
  try {
    console.log(`Fetching histori chat untuk sesi ${sessionId}`);
    const response = await fetch(
      `${API_BASE}/chat/sessions/${sessionId}/history`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Gagal untuk fetch histori chat:", error);
      throw new Error(error.error || "Gagal untuk fetch histori chat");
    }

    const data = await response.json();
    console.log("Histori chat diterima:", data);

    if (!Array.isArray(data)) {
      console.error("Invalid format histori chat:", data);
      throw new Error("Invalid format histori chat");
    }

    // Meyakinkan tiap pesan memiliki format yang benar
    return data.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      metadata: msg.metadata,
    }));
  } catch (error) {
    console.error("Error fetching histori chat:", error);
    throw error;
  }
};

export const getAllChatSessions = async (): Promise<ChatSession[]> => {
  try {
    console.log("Fetching semua sesi chat...");
    const response = await fetch(`${API_BASE}/chat/sessions`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Gagal untuk fetch sesi chat:", error);
      throw new Error(error.error || "Gagal untuk fetch sesi chat");
    }

    const data = await response.json();
    console.log("Menerima sesi chat:", data);

    return data.map((session: any) => {
      // Meyakinkan setiap data memiliki format yang benar
      const createdAt = new Date(session.createdAt || Date.now());
      const updatedAt = new Date(session.updatedAt || Date.now());

      return {
        ...session,
        createdAt: isNaN(createdAt.getTime()) ? new Date() : createdAt,
        updatedAt: isNaN(updatedAt.getTime()) ? new Date() : updatedAt,
        messages: (session.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp || Date.now()),
        })),
      };
    });
  } catch (error) {
    console.error("Error fetchingsesi chat:", error);
    throw error;
  }
};