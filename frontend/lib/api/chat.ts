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

// Menggunakan backend eksternal Anda yang sebenarnya
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Fungsi helper untuk mendapatkan header autentikasi
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const createChatSession = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/chat/sessions`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create chat session");
    }

    const data = await response.json();
    return data.sessionId;
  } catch (error) {
    console.error("Error creating chat session:", error);
    throw error;
  }
};

// KEMBALIKAN FUNGSI INI KE VERSI ASLI
export const sendChatMessage = async (
  sessionId: string,
  message: string
): Promise<ApiResponse> => {
  try {
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
      throw new Error(error.error || "Failed to send message");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};


export const getChatHistory = async (
  sessionId: string
): Promise<ChatMessage[]> => {
  try {
    const response = await fetch(
      `${API_BASE}/chat/sessions/${sessionId}/history`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch chat history");
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Invalid chat history format");
    }
    
    return data.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

// export const getAllChatSessions = async (): Promise<ChatSession[]> => {
//   try {
//     const response = await fetch(`${API_BASE}/chat/sessions`, {
//       headers: getAuthHeaders(),
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.error || "Failed to fetch chat sessions");
//     }

//     const data = await response.json();
//     return data.map((session: any) => ({
//       ...session,
//       createdAt: new Date(session.createdAt),
//       updatedAt: new Date(session.updatedAt),
//       messages: (session.messages || []).map((msg: any) => ({
//         ...msg,
//         timestamp: new Date(msg.timestamp),
//       })),
//     }));
//   } catch (error) {
//     console.error("Error fetching chat sessions:", error);
//     throw error;
//   }
// };

export const getAllChatSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await fetch(`${API_BASE}/chat/sessions`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch chat sessions");
    }
    const data = await response.json();
    console.log("Raw sessions data:", data); // Tambahkan logging
    return data.map((session: any) => {
      console.log("Session createdAt:", session.createdAt, "updatedAt:", session.updatedAt); // Log nilai tanggal
      return {
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: (session.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      };
    });
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    throw error;
  }
};

export const deleteChatSession = async (sessionId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete chat session");
    }
  } catch (error) {
    console.error("Error deleting chat session:", error);
    throw error;
  }
};