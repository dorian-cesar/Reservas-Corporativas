import { NextRequest, NextResponse } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_URL_BACKEND ?? "").replace(/\/$/, "");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    const token = req.headers.get("authorization");
    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;

    const empresaId =
      resolvedParams?.empresaId ??
      resolvedParams?.empresa_id ??
      req.nextUrl.searchParams.get("empresaId") ??
      req.nextUrl.searchParams.get("empresa_id");

    if (!empresaId) {
      return NextResponse.json(
        { message: "Parámetro empresaId faltante" },
        { status: 400 }
      );
    }

    if (!API_BASE) {
      return NextResponse.json(
        { message: "Server misconfiguration: NEXT_PUBLIC_URL_BACKEND not set" },
        { status: 500 }
      );
    }

    const showInactives = req.nextUrl.searchParams.get("showInactives");

    const backendUrl = new URL(
      `/api/centros-costo/empresa/${empresaId}`,
      API_BASE
    );

    if (showInactives === 'true') {
      backendUrl.searchParams.set("includeInactives", "true");
    }

    const res = await fetch(backendUrl.toString(), {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    const text = await res.text();

    if (!res.ok) {
      let body: any = text;
      try {
        body = JSON.parse(text);
      } catch { }

      if (res.status === 404) {
        return NextResponse.json([], { status: 200 });
      }

      return NextResponse.json(
        { message: "Error desde backend", status: res.status, body },
        { status: 502 }
      );
    }

    return NextResponse.json(JSON.parse(text));
  } catch (err) {
    console.error("Proxy: unexpected error:", err);
    return NextResponse.json(
      { message: "Error interno del servidor", error: String(err) },
      { status: 500 }
    );
  }
}
