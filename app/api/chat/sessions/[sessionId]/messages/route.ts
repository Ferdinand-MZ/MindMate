import {NextRequest, NextResponse} from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:3001";

export async function GET (
    req: NextRequest,
    {params} : {params: {sessionId: string} }
) {
    try {
        const {sessionId} = params;
        const response = await fetch(
            `${BACKEND_API_URL}/chat/sessions/${sessionId}/history`,
        )

        if(!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error di histori chat API:", error);
        return NextResponse.json(
            {error: "Gagal mengambil histori chat" },
            {status: 500}
        )
    }
}

export async function POST (
    req: NextRequest,
    {params} : {params: {sessionId: string} }
) {
    try {
        const {sessionId} = params;
        const {message} = await req.json();

        if(!message) {
            return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
        }

        const response = await fetch(
            `${BACKEND_API_URL}/chat/sessions/${sessionId}/messages`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message }),
            }
        )

        if(!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error di chat API:", error);
        return NextResponse.json(
            {error: "Gagal memproses pesan" },
            {status: 500}
        )
    }
}