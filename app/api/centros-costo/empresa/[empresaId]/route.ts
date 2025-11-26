import { NextRequest, NextResponse } from "next/server";

const API_BASE = (process.env.URL_BACKEND ?? "").replace(/\/$/, ""); // quitar slash final

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<Record<string, string>> } // params llega como Promise en este entorno
) {
    try {
        const token = req.headers.get("authorization");
        if (!token) {
            console.warn("Proxy: Authorization header missing");
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }

        const resolvedParams = await params;

        const empresaId =
            resolvedParams?.empresaId ??
            resolvedParams?.empresa_id ??
            req.nextUrl.searchParams.get("empresaId") ??
            req.nextUrl.searchParams.get("empresa_id");

        if (!empresaId) {
            console.warn("Proxy: parámetro empresaId faltante");
            return NextResponse.json({ message: "Parámetro empresaId faltante" }, { status: 400 });
        }

        if (!API_BASE) {
            console.error("Proxy: URL_BACKEND no está definido (API_BASE vacío)");
            return NextResponse.json({ message: "Server misconfiguration: URL_BACKEND not set" }, { status: 500 });
        }

        const backendUrl = `${API_BASE}/api/centros-costo/empresa/${empresaId}`;

        const res = await fetch(backendUrl, {
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });


        const text = await res.text();

        if (!res.ok) {
            let body: any = text;
            try { body = JSON.parse(text); } catch { }
            console.error("Proxy: upstream error:", res.status, body);

            if (res.status === 404) {
                // UX: devolver array vacío en lugar de propagar 404
                return NextResponse.json([], { status: 200 });
            }

            return NextResponse.json({ message: "Error desde backend", status: res.status, body }, { status: 502 });
        }

        const data = JSON.parse(text);

        return NextResponse.json(data);
    } catch (err) {
        console.error("Proxy: unexpected error:", err);
        return NextResponse.json({ message: "Error interno del servidor", error: String(err) }, { status: 500 });
    }
}
