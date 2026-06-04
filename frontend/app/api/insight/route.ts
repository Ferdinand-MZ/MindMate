import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const API_URL = process.env.BACKEND_API_URL || "http://localhost:3001";
  const token = req.headers.get("Authorization");

  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, symptoms, solution } = body;

    if (!name || !description || !Array.isArray(symptoms) || !Array.isArray(solution)) {
      return NextResponse.json(
        { error: "Invalid insight data" },
        { status: 400 }
      );
    }

    console.log("Proxying POST to backend:", { API_URL, body, token }); // Debug log
    const response = await fetch(`${API_URL}/api/insight`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ name, description, symptoms, solution }),
    });

    const text = await response.text(); // Use text() to inspect response
    console.log("Backend response:", { status: response.status, body: text }); // Debug log

    if (!response.ok) {
      let errorMessage = "Failed to create insight";
      try {
        const error = JSON.parse(text);
        errorMessage = error.message || errorMessage;
      } catch (e) {
        console.error("Non-JSON response:", text); // Log HTML or unexpected response
        if (text.startsWith("<!DOCTYPE")) {
          errorMessage = "Backend returned an HTML error page (likely 404 or 500)";
        }
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating insight:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const API_URL = process.env.BACKEND_API_URL || "http://localhost:3001";
  const token = req.headers.get("Authorization");

  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  try {
    console.log("Proxying GET to backend:", { API_URL, token }); // Debug log
    const response = await fetch(`${API_URL}/api/insight`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    const text = await response.text(); // Use text() to inspect response
    console.log("Backend response:", { status: response.status, body: text }); // Debug log

    if (!response.ok) {
      let errorMessage = "Failed to fetch insights";
      try {
        const error = JSON.parse(text);
        errorMessage = error.message || errorMessage;
      } catch (e) {
        console.error("Non-JSON response:", text); // Log HTML or unexpected response
        if (text.startsWith("<!DOCTYPE")) {
          errorMessage = "Backend returned an HTML error page (likely 404 or 500)";
        }
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching insights:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}