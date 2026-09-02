import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_API_URL || "http://localhost:3001";

// POST /api/mood : log a mood entry
export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization");

  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { score, note, context, activities } = body;

    if (typeof score !== "number" || score < 0 || score > 100) {
      return NextResponse.json({ error: "Invalid mood score (0–100)" }, { status: 400 });
    }

    const response = await fetch(`${BACKEND}/api/mood`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ score, note, context, activities }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error tracking mood:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/mood : fetch mood history
export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization");

  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") || "30";

  try {
    const response = await fetch(`${BACKEND}/api/mood?limit=${limit}`, {
      headers: { Authorization: token },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching mood history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
