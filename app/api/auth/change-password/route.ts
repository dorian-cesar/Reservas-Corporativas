import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, currentPassword, newPassword } = body;

        if (!userId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "ID de usuario es requerido"
                },
                { status: 400 }
            );
        }

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_URL_BACKEND}/api/password/change-password`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ userId, currentPassword, newPassword }),
            }
        );

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                {
                    success: false,
                    message: data.message || "Error cambiando contraseña",
                    error: data.error || null
                },
                { status: res.status }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: data.message || "Contraseña actualizada exitosamente",
                data
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("Force change password error:", err);
        return NextResponse.json(
            {
                success: false,
                message: "Error interno del servidor",
                error: err instanceof Error ? err.message : "Error desconocido"
            },
            { status: 500 }
        );
    }
}