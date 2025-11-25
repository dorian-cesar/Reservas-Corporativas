import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.URL_BACKEND ?? "";

export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get("authorization");
        if (!token) {
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }

        // reenviar query string (si hay filtros: searchQuery, roleFilter, etc.)
        const search = req.nextUrl.search || "";
        const res = await fetch(`${API_BASE}/api/users${search}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.ok ? 200 : res.status });
    } catch (err) {
        console.error("Error listando usuarios:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get("authorization");
        if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

        const body = await req.json();

        const res = await fetch(`${API_BASE}/api/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.ok ? 201 : res.status });
    } catch (err) {
        console.error("Error creando usuario:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}
