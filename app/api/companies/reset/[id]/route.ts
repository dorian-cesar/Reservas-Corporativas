import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

async function getParams(context: any) {
    const { params } = await context;
    return params as { id: string };
}

export async function PUT(req: NextRequest, context: any) {
    try {
        const { id } = await getParams(context);
        const token = req.headers.get("authorization");

        if (!token) {
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }

        const empresaId = parseInt(id, 10);
        if (isNaN(empresaId)) {
            return NextResponse.json({ message: "ID inválido" }, { status: 400 });
        }

        const res = await fetch(`${API_BASE}/api/empresas/reset/${empresaId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });

        const data = await res.json().catch(() => null);
        return NextResponse.json(data ?? { message: "Error" }, {
            status: res.status,
        });

    } catch (err) {
        console.error("PUT /api/companies/reset/[id] error:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}