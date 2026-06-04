import { NextRequest, NextResponse } from "next/server";
const BACKEND = process.env.BACKEND_API_URL || "http://localhost:3001";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization");
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") || "20";
  const res = await fetch(`${BACKEND}/api/journal/history?limit=${limit}`, {
    headers: { Authorization: token },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
