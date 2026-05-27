import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get("authorization");

    // Para el formulario de contacto público, el token de autorización puede ser opcional
    const token = authHeader || "Bearer system-default-token";

    if (!body.email || !body.nombre) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    // Determinamos la URL del backend externo de correos
    const targetUrl = process.env.EMAIL_URL || "";

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Error en backend externo", detail: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno en API de Next" },
      { status: 500 },
    );
  }
}
