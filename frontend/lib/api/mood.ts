export interface MoodEntry {
  score: number;
  note?: string;
  context?: string;
  activities?: string[];
}

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

const authHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export async function trackMood(
  data: MoodEntry
): Promise<{ success: boolean; data: any }> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch("/api/mood", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || "Failed to track mood");
  }

  return response.json();
}

export async function getMoodHistory(params?: {
  limit?: number;
}): Promise<{ success: boolean; data: any[] }> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const qs = params?.limit ? `?limit=${params.limit}` : "";

  // Uses GET /api/mood which now proxies to backend GET /api/mood
  const response = await fetch(`/api/mood${qs}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || "Failed to fetch mood history");
  }

  return response.json();
}
