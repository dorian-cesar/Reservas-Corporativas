import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get("authorization");
        if (!token) {
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();

        // Validaciones básicas
        if (!body.movimientoId || !body.monto) {
            return NextResponse.json(
                { message: "Faltan parámetros: movimientoId y monto" },
                { status: 400 }
            );
        }

        const res = await fetch(`${API_BASE}/api/cuenta-corriente/pagar-cargo`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                { message: data.message || "Error al procesar el pago" },
                { status: res.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (err) {
        console.error("Error procesando pago:", err);
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}