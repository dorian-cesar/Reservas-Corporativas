// app/api/users/cambiar-empresa/route.ts
import { NextResponse } from "next/server";

const NEXT_PUBLIC_URL_BACKEND = process.env.NEXT_PUBLIC_URL_BACKEND;

export async function PATCH(req: Request) {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
        return NextResponse.json(
            { error: "Token no proporcionado" },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();

        if (!body.nueva_empresa_id) {
            return NextResponse.json(
                { error: "Nueva Empresa ID es requerido" },
                { status: 400 }
            );
        }

        const backendUrl = `${NEXT_PUBLIC_URL_BACKEND}/api/users/cambiar-empresa`;

        const res = await fetch(backendUrl, {
            method: "PATCH",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                nueva_empresa_id: body.nueva_empresa_id
            }),
            cache: "no-store",
        });

        if (!res.ok) {
            const errorText = await res.text();
            return NextResponse.json(
                {
                    error: "Error consultando backend",
                    status: res.status,
                    backendError: errorText,
                },
                { status: res.status }
            );
        }

        const data = await res.json();

        // Asegurarnos de que recibimos los datos esperados
        if (!data.token) {
            console.warn("Backend no devolvió un nuevo token");
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error en API route:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}