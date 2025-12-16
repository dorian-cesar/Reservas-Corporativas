import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

export async function GET(req: NextRequest) {
  try {
    if (!API_BASE) {
      console.error("Missing API_BASE (NEXT_PUBLIC_URL_BACKEND)");
      return NextResponse.json({ message: "Configuración del servidor incompleta" }, { status: 500 });
    }

    const token = req.headers.get("authorization");
    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const params = new URLSearchParams(req.nextUrl.searchParams as any);

    const rawPage = params.get("page");
    const rawLimit = params.get("limit");
    const rawEmail = params.get("email");
    const empresa = params.get("empresa_id");

    const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
    const limit = Math.max(1, parseInt(rawLimit ?? "10", 10) || 10);

    params.set("page", page.toString());
    params.set("limit", limit.toString());

    if (rawEmail && rawEmail.trim() !== "") {
      params.set("email", rawEmail.trim());
    } else {
      params.delete("email");
    }

    if (empresa) {
      params.set("empresa_id", empresa)
    }

    const queryString = params.toString() ? `?${params.toString()}` : "";

    const backendRes = await fetch(`${API_BASE}/api/users${queryString}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      cache: "no-store",
    });

    const respBody = await backendRes.json().catch(() => ({ message: "Respuesta no JSON del backend" }));
    return NextResponse.json(respBody, { status: backendRes.status });

  } catch (err) {
    console.error("Error listando usuarios (internal route):", err);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");
    if (!token)
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });

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
