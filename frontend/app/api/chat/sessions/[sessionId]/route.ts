import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_API_URL || "http://localhost:3001";

// GET /api/chat/sessions/:sessionId — fetch chat history
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;
  const auth = req.headers.get("Authorization");

  if (!auth) {
    return NextResponse.json({ error: "Authorization required" }, { status: 401 });
  }

  try {
    const response = await fetch(
      `${BACKEND}/chat/sessions/${sessionId}/history`,
      { headers: { Authorization: auth } }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}

// POST /api/chat/sessions/:sessionId — send a message
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;
  const auth = req.headers.get("Authorization");

  if (!auth) {
    return NextResponse.json({ error: "Authorization required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const response = await fetch(
      `${BACKEND}/chat/sessions/${sessionId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
        body: JSON.stringify({ message }),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/sessions/:sessionId
export async function DELETE(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;
  const auth = req.headers.get("Authorization");

  if (!auth) {
    return NextResponse.json({ error: "Authorization required" }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND}/chat/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: auth },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
