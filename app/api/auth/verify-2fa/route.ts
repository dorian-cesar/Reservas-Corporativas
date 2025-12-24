import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, code } = body;

        if (!userId || !code) {
            return NextResponse.json(
                { message: "Usuario y código son requeridos" },
                { status: 400 }
            );
        }

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_URL_BACKEND}/api/auth/verify-code`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, code }),
            }
        );

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                { message: data.message || "Error verificando código" },
                { status: res.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (err) {
        console.error("Verify 2FA interno error:", err);
        return NextResponse.json(
            { message: "Error interno" },
            { status: 500 }
        );
    }
}
