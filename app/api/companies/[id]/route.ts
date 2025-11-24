// app/api/companies/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.URL_BACKEND ?? "";

async function getParams(context: any) {
    // context.params puede ser una Promise en Next; await para asegurarnos
    const { params } = await context;
    return params as { id: string };
}

export async function GET(req: NextRequest, context: any) {
    try {
        const { id } = await getParams(context);
        const token = req.headers.get("authorization");
        if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

        const res = await fetch(`${API_BASE}/api/empresas/${id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });

        const data = await res.json().catch(() => null);
        return NextResponse.json(data ?? { message: "Error" }, { status: res.status });
    } catch (err) {
        console.error("GET /api/companies/[id] error:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: any) {
    try {
        const { id } = await getParams(context);
        const token = req.headers.get("authorization");
        if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

        const body = await req.json();

        const res = await fetch(`${API_BASE}/api/empresas/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
            body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => null);
        return NextResponse.json(data ?? { message: "Error" }, { status: res.status });
    } catch (err) {
        console.error("PUT /api/companies/[id] error:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: any) {
    try {
        const { id } = await getParams(context);
        const token = req.headers.get("authorization");
        if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

        const res = await fetch(`${API_BASE}/api/empresas/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });

        const data = await res.json().catch(() => null);
        return NextResponse.json(data ?? { message: "Error" }, { status: res.status });
    } catch (err) {
        console.error("DELETE /api/companies/[id] error:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}
