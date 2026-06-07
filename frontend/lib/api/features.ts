const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

const authHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ─── Journal ──────────────────────────────────────────────────────────────────
export async function getDailyPrompt() {
  const res = await fetch("/api/journal/prompt", { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to get prompt");
  return res.json();
}

export async function saveJournalEntry(journalId: string, content: string) {
  const res = await fetch("/api/journal/entry", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ journalId, content }),
  });
  if (!res.ok) throw new Error("Failed to save entry");
  return res.json();
}

export async function getJournalHistory(params?: { limit?: number }) {
  const qs = params?.limit ? `?limit=${params.limit}` : "";
  const res = await fetch(`/api/journal/history${qs}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch journal history");
  return res.json();
}

export async function analyzeJournalEntry(journalId: string) {
  const res = await fetch("/api/journal/analyze", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ journalId }),
  });
  if (!res.ok) throw new Error("Failed to analyze journal entry");
  return res.json();
}

// ─── Community Board ──────────────────────────────────────────────────────────
export async function getCommunityPosts(page = 1) {
  const res = await fetch(`/api/community/posts?page=${page}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
}

export async function createCommunityPost(content: string) {
  const res = await fetch("/api/community/posts", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.json();
    if (err.blocked && err.crisis) {
      const crisisErr: any = new Error(err.message || "Content blocked");
      crisisErr.isCrisis = true;
      throw crisisErr;
    }
    throw new Error(err.message || "Failed to create post");
  }
  return res.json();
}

export async function reactToPost(
  postId: string,
  reaction: "heart" | "hug" | "strength" | "peace" | "sparkle"
) {
  const res = await fetch(`/api/community/posts/${postId}/react`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ reaction }),
  });
  if (!res.ok) throw new Error("Failed to react");
  return res.json();
}

export async function deleteCommunityPost(postId: string) {
  const res = await fetch(`/api/community/posts/${postId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete post");
  return res.json();
}

// ─── Streak ───────────────────────────────────────────────────────────────────
export async function getStreak() {
  const res = await fetch("/api/streak", { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch streak");
  return res.json();
}

export async function recordCheckIn() {
  const res = await fetch("/api/streak/checkin", {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to record check-in");
  return res.json();
}

// ─── Mood Patterns ────────────────────────────────────────────────────────────
export async function getWeeklyMoodPattern() {
  const res = await fetch("/api/mood-patterns/weekly", { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch mood patterns");
  return res.json();
}

// ─── Progress Report ──────────────────────────────────────────────────────────
export async function getProgressReport(month?: string) {
  const qs = month ? `?month=${month}` : "";
  const res = await fetch(`/api/progress${qs}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch progress report");
  return res.json();
}