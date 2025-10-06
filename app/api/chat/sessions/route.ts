import { auth } from "@/backend/src/middleware/auth";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:3001";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");

        if(!authHeader) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const response = await fetch(`${BACKEND_API_URL}/chat/sessions`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
        })

        if(!response.ok) {
            const error = await response.json();
            console.error("Error Membuat sesi chat:", error);
            return NextResponse.json({error:error.error || "Gagal untuk membuat sesi chat" }, { status: response.status });
        }

        const data = await response.json();
        console.log("Sesi chat berhasil dibuat:", data);
        return NextResponse.json(data);
    }   catch (error) {
        console.error("Error Membuat sesi chat:", error);
        return NextResponse.json(
        {error: "Gagal Membuat sesi chat" },
        {status: 500}
        );
    }
}