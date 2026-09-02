import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_API_URL || "http://localhost:3001";

// POST /api/activity : log an activity
export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization");
  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, name, description, duration, difficulty, feedback } = body;

    if (!type || !name) {
      return NextResponse.json({ error: "type and name are required" }, { status: 400 });
    }

    const response = await fetch(`${BACKEND}/api/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ type, name, description, duration, difficulty, feedback }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error logging activity:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/activity : get activity count or list
// Supports ?mode=count or ?mode=all or ?mode=today
export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization");
  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "count";

  const endpointMap: Record<string, string> = {
    count: "/api/activity/count",
    all: "/api/activity/all",
    today: "/api/activity/today",
  };

  const backendPath = endpointMap[mode] || "/api/activity/count";

  try {
    const response = await fetch(`${BACKEND}${backendPath}`, {
      headers: { Authorization: token },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
