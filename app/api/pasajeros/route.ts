import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_URL_BACKEND;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rut = searchParams.get("rut");

    if (!rut) {
      return NextResponse.json(
        { error: "El parámetro RUT es requerido" },
        { status: 400 }
      );
    }

    const rutClean = rut.replace(/\./g, "").toUpperCase();

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/pasajeros?rut=${rutClean}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!backendResponse.ok) {
      throw new Error(`Error del backend: ${backendResponse.status}`);
    }

    const data = await backendResponse.json();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error en proxy de pasajeros (GET):", error);

    if (error instanceof Error) {
      if (error.message.includes("Error del backend")) {
        return NextResponse.json(
          { error: "Error del servidor backend" },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { nombre, rut, correo, id_empresa, id_centro_costo } = body;

    if (!nombre || !rut || !id_empresa) {
      return NextResponse.json(
        { error: "Nombre, RUT e ID de empresa son requeridos" },
        { status: 400 }
      );
    }

    const rutClean = rut.replace(/\./g, "").toUpperCase();

    const payload = {
      nombre,
      rut: rutClean,
      correo: correo || null,
      id_empresa,
      id_centro_costo: id_centro_costo || null,
    };

    const backendResponse = await fetch(`${BACKEND_URL}/api/pasajeros`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Error del backend: ${backendResponse.status}`
      );
    }

    const data = await backendResponse.json();

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error en proxy de pasajeros (POST):", error);

    if (error instanceof Error) {
      if (
        error.message.includes("Formato de RUT inválido") ||
        error.message.includes("ya existe")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
