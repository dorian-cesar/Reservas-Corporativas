import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_URL_BACKEND;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rut = searchParams.get("rut");
    const id_empresa = searchParams.get("id_empresa");
    const correo = searchParams.get("correo");
    const id_centro_costo = searchParams.get("id_centro_costo");
    const nombre = searchParams.get("nombre");

    const backendQuery = new URLSearchParams();

    if (rut && rut.toUpperCase() !== "NO") {
      const rutClean = rut.replace(/\./g, "").toUpperCase();
      backendQuery.set("rut", rutClean);
    }

    if (id_empresa) backendQuery.set("id_empresa", id_empresa);
    if (correo) backendQuery.set("correo", correo);
    if (id_centro_costo) backendQuery.set("id_centro_costo", id_centro_costo);
    if (nombre) backendQuery.set("nombre", nombre);

    const backendUrl =
      backendQuery.toString().length > 0
        ? `${BACKEND_URL}/api/pasajeros?${backendQuery.toString()}`
        : `${BACKEND_URL}/api/pasajeros`;

    const authHeader = request.headers.get("authorization") || "";

    const backendResponse = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    if (!backendResponse.ok) {
      const errBody = await backendResponse.json().catch(() => null);
      console.error("Backend GET error:", backendResponse.status, errBody);
      return NextResponse.json(
        { error: errBody?.error || "Error del servidor backend" },
        { status: backendResponse.status === 502 ? 502 : backendResponse.status }
      );
    }

    const data = await backendResponse.json();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error en proxy de pasajeros (GET):", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { nombre, rut, correo, telefono, id_empresa, id_centro_costo } = body;

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
      telefono: telefono || null,
      id_empresa,
      id_centro_costo: id_centro_costo || null,
    };

    const authHeader = request.headers.get("authorization");

    const backendResponse = await fetch(`${BACKEND_URL}/api/pasajeros`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => null);
      console.error("Backend POST error:", backendResponse.status, errorData);

      const message = errorData?.error || errorData?.message || `Error del backend: ${backendResponse.status}`;

      return NextResponse.json({ error: message }, { status: backendResponse.status });
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
