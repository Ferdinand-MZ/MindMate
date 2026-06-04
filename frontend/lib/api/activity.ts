export interface ActivityEntry {
  type: string;
  name: string;
  description?: string;
  duration?: number;
  difficulty?: string;
  feedback?: string;
}

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

const authHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export async function logActivity(
  data: ActivityEntry
): Promise<{ success: boolean; data: any }> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch("/api/activity", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || "Failed to log activity");
  }

  return response.json();
}

export async function getAllActivities(): Promise<{
  success: boolean;
  data: ActivityEntry[];
}> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch("/api/activity?mode=all", {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || "Failed to fetch activities");
  }

  return response.json();
}

export async function getTodayActivities(): Promise<{
  success: boolean;
  data: ActivityEntry[];
}> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch("/api/activity?mode=today", {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch today's activities");
  }

  return response.json();
}

export async function fetchTotalActivitiesAPI(): Promise<number> {
  const token = getToken();
  if (!token) throw new Error("User not authenticated");

  const response = await fetch("/api/activity?mode=count", {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to fetch total activities");
  }

  const data = await response.json();
  return typeof data.totalActivities === "number" ? data.totalActivities : 0;
}
