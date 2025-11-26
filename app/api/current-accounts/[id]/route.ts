import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.URL_BACKEND ?? "";

async function getParams(context: any) {
    const { params } = await context;
    return params as { id: string };
}

export async function GET(req: NextRequest, context: any) {
    try {
        const { id } = await getParams(context);
        const token = req.headers.get("authorization");
        if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

        const res = await fetch(`${API_BASE}/api/cuenta-corriente/${id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });

        const data = await res.json().catch(() => null);
        return NextResponse.json(data ?? { message: "Error" }, { status: res.status });
    } catch (err) {
        console.error("GET /api/current-accounts/[id] error:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: any) {
    try {
        const { id } = await getParams(context);
        const token = req.headers.get("authorization");
        if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

        const res = await fetch(`${API_BASE}/api/cuenta-corriente/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });

        const data = await res.json().catch(() => null);
        return NextResponse.json(data ?? { message: "Error" }, { status: res.status });
    } catch (err) {
        console.error("DELETE /api/current-accounts/[id] error:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}