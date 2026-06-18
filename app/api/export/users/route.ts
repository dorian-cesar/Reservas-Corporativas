import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");
    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const backendRes = await fetch(`${API_BASE}/api/users/export`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      cache: "no-store",
    });

    const respBody = await backendRes.json().catch(() => ({ message: "Respuesta no JSON del backend" }));
    return NextResponse.json(respBody, { status: backendRes.status });
  } catch (err: any) {
    console.error("Error al exportar usuarios (proxy):", err);
    return NextResponse.json(
      { message: "Error interno del servidor", error: err.message },
      { status: 500 }
    );
  }
}
