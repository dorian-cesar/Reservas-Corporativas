import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.URL_BACKEND ?? "";

async function getParams(context: any) {
    const { params } = await context;
    return params as { empresa_id: string };
}

export async function GET(req: NextRequest, context: any) {
    try {
        const { empresa_id } = await getParams(context);
        const token = req.headers.get("authorization");
        if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

        const res = await fetch(`${API_BASE}/api/cuenta-corriente/empresa/${empresa_id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.ok ? 200 : res.status });
    } catch (err) {
        console.error("Error obteniendo movimientos por empresa:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}