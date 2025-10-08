import {NextRequest, NextResponse} from "next/server";

const BACKEND_API_URL = process.env.API_URL || "http://localhost:3001";

export async function GET (
    req: NextRequest,
    {params} : {params: {sessionId: string} }
) {
    try {
        const {sessionId} = params;
        console.log(`Mendapatkan histori chat untuk sesi: ${sessionId}`);

        const response = await fetch(
            `${BACKEND_API_URL}/chat/sessions/${sessionId}/history`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        )

        if(!response.ok) {
            const error = await response.json();
            console.error("Gagal Mendapatkan histori chat:", error);
            return NextResponse.json(
                {error: error.error || "Gagal untuk mendapatkan histori chat" },
                { status: response.status }
            )
        }

        const data = await response.json();
        console.log("Histori chat berhasil didapatkan:", data);

        // Format ulang data jika perlu
        const formattedMessages = data.map((msg:any) => ({
            role: msg.role,
            content: msg.content,
            timeStamp: msg.timeStamp
        }))

        return NextResponse.json(formattedMessages);
    } catch (error) {
        console.error("Error mencoba mendapatkan chat histori:", error);
        return NextResponse.json(
            {error: "Gagal mengirim pesan" },
            {status: 500}
        )
    }
}
