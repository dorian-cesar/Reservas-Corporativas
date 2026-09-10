import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const backendUrl = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";
    if (!backendUrl) {
      console.error("Missing NEXT_PUBLIC_URL_BACKEND");
      return NextResponse.json({ message: "Configuración del servidor incompleta" }, { status: 500 });
    }

    const res = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({ message: "Respuesta no válida del backend" }));

    if (!res.ok) {
      return NextResponse.json(
        {
          message: data.message || "Error en servidor backend",
          ...data,
        },
        { status: res.status },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("Login interno error:", err);
    return NextResponse.json(
      { message: "Error interno al conectar con el backend", error: err.message },
      { status: 500 },
    );
  }
}
