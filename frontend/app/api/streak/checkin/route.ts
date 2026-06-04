import { NextRequest, NextResponse } from "next/server";
const BACKEND = process.env.BACKEND_API_URL || "http://localhost:3001";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization");
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const res = await fetch(`${BACKEND}/api/streak/checkin`, {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json" },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}