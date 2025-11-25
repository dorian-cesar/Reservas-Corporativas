import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.URL_BACKEND ?? "";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ empresa_id: string }> }
) {
    try {
        const token = req.headers.get("authorization");
        if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

        // Desempaquetar los params
        const { empresa_id } = await params;

        const res = await fetch(`${API_BASE}/api/centros-costo/empresa/${empresa_id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });

        if (!res.ok) {
            throw new Error(`Backend responded with status: ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        console.error("Error listando centros de costo por empresa:", err);
        return NextResponse.json({
            message: "Error interno del servidor"
        }, { status: 500 });
    }
}