interface InsightEntry {
  name: string;
  description: string;
  symptoms: string[];
  solution: string[];
}

interface Insight {
  _id: string;
  userId: string;
  name: string;
  description: string;
  symptoms: string[];
  solution: string[];
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export async function createInsight(
  data: InsightEntry
): Promise<{ success: boolean; data: Insight }> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const response = await fetch("/api/insight", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create insight");
  }

  return response.json();
}

export async function getInsightHistory(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<{ success: boolean; data: Insight[] }> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const response = await fetch(`/api/insight?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch insight history");
  }

  return response.json();
}