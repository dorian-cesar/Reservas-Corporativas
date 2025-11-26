import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.URL_BACKEND ?? "";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Token no proporcionado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const backendUrl = `${API_BASE}/api/tickets`;

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || "Error en backend",
          resData: data,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error en al guardar en db (confirm)", error);
    return NextResponse.json(
      { success: false, error: "Error interno api confirm-db" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");

    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const res = await fetch(`${API_BASE}/api/tickets`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    console.error("Error listando tickets:", err);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}