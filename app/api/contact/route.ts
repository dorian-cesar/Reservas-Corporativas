import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.email || !body.nombre) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    // Aquí llamas a tu backend externo
    const response = await fetch(process.env.EXTERNAL_API_URL as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // puedes agregar auth si necesitas
        // Authorization: `Bearer ${process.env.API_TOKEN}`,
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
