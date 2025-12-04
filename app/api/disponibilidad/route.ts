import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Token no enviado" }, { status: 401 });
    }

    const backendURL = process.env.NEXT_PUBLIC_URL_BACKEND;
    if (!backendURL) {
      return NextResponse.json(
        { error: "URL_BACKEND no configurada" },
        { status: 500 }
      );
    }

    const response = await fetch(`${backendURL}/api/tickets/disponibilidad`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error("Error API disponibilidad:", err);
    return NextResponse.json(
      { error: "Error interno en disponibilidad" },
      { status: 500 }
    );
  }
}
