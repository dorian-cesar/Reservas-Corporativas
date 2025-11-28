import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

// GET no existe en el backend para listar todos
export async function GET() {
  return NextResponse.json(
    {
      message:
        "Use /api/current-accounts/empresa/[empresa_id] para listar estados de pago",
    },
    { status: 404 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");
    if (!token)
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const body = await req.json();

    const res = await fetch(`${API_BASE}/api/cuenta-corriente`, {
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
    console.error("Error creando movimiento:", err);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
