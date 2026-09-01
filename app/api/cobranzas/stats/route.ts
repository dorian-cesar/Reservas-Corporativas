import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

// GET /api/cobranzas/stats
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");

    if (!token) {
      return NextResponse.json(
        { message: "Token no proporcionado" },
        { status: 401 },
      );
    }

    const res = await fetch(`${BACKEND_URL}/api/cobranzas/stats`, {
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson?.message) {
          return NextResponse.json(
            { message: errorJson.message },
            { status: res.status },
          );
        }
      } catch {}
      return NextResponse.json(
        { message: `Error del backend: ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Error al obtener estadísticas de cobranza:", err);
    return NextResponse.json(
      { message: "Error al obtener estadísticas de cobranza" },
      { status: 500 },
    );
  }
}
