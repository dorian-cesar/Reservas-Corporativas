import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get("authorization");
        if (!token) {
            return NextResponse.json(
                { message: "No autorizado" },
                { status: 401 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json(
                { message: "Archivo CSV requerido" },
                { status: 400 }
            );
        }

        const backendFormData = new FormData();
        backendFormData.append("file", file);

        const res = await fetch(`${API_BASE}/api/upload/passengers/csv`, {
            method: "POST",
            headers: {
                Authorization: token,
            },
            body: backendFormData,
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                { message: data.message || "Error del backend" },
                { status: res.status }
            );
        }

        return NextResponse.json(data, { status: 200 });

    } catch (err: any) {
        console.error("Error subiendo CSV pasajeros:", err);
        return NextResponse.json(
            { message: err.message || "Error interno del servidor" },
            { status: 500 }
        );
    }
}
