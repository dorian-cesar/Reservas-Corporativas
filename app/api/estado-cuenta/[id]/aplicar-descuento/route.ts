import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = req.headers.get("authorization");
        if (!token)
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });

        const body = await req.json();

        const { id } = await params;

        const res = await fetch(`${API_BASE}/api/estado-cuenta/${id}/aplicar-descuento`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        return NextResponse.json(data, { status: res.ok ? 200 : res.status });
    } catch (err) {
        console.error("Error aplicando descuento:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}
