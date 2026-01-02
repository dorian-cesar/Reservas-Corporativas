import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get("authorization");

        if (!token) {
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("user_id");
        const empresaId = searchParams.get("empresa_id");

        if (userId) {
            const res = await fetch(`${API_BASE}/api/user-empresa/user/${userId}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
            });

            const data = await res.json();
            return NextResponse.json(data, { status: res.ok ? 200 : res.status });
        }

        if (empresaId) {
            const res = await fetch(`${API_BASE}/api/user-empresa/empresa/${empresaId}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
            });

            const data = await res.json();
            return NextResponse.json(data, { status: res.ok ? 200 : res.status });
        }

        return NextResponse.json(
            { message: "Se requiere user_id o empresa_id" },
            { status: 400 }
        );
    } catch (err) {
        console.error("Error obteniendo relaciones usuario-empresa:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}

// POST: Asignar empresa a usuario
export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get("authorization");
        if (!token)
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });

        const body = await req.json();
        const { bulk, ...restBody } = body;

        if (bulk === true) {
            const res = await fetch(`${API_BASE}/api/user-empresa/bulk`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
                body: JSON.stringify(restBody),
            });

            const data = await res.json();
            return NextResponse.json(data, { status: res.ok ? 201 : res.status });
        }

        const res = await fetch(`${API_BASE}/api/user-empresa`, {
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
        console.error("Error asignando empresa a usuario:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const token = req.headers.get("authorization");
        if (!token)
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });

        const body = await req.json();
        const { user_id, empresa_id } = body;

        if (!user_id || !empresa_id) {
            return NextResponse.json(
                { message: "Se requiere user_id y empresa_id" },
                { status: 400 }
            );
        }

        const res = await fetch(`${API_BASE}/api/user-empresa`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
            body: JSON.stringify({ user_id, empresa_id }),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.ok ? 200 : res.status });
    } catch (err) {
        console.error("Error eliminando relación usuario-empresa:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}