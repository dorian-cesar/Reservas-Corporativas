import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_URL_BACKEND;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rut, nombre, correo, id_empresa, id_centro_costo, telefono } = body;
    const token = request.headers.get("authorization");

    if (!rut || !nombre || !id_empresa) {
      return NextResponse.json(
        { error: "RUT, nombre y empresa son requeridos" },
        { status: 400 }
      );
    }

    const rutClean = rut.replace(/\./g, "").toUpperCase();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = token;
    }

    const crearPayload = {
      nombre: nombre.trim(),
      rut: rutClean,
      correo: correo ? correo.trim() : null,
      id_empresa: Number(id_empresa),
      id_centro_costo: id_centro_costo || null,
      telefono: telefono ? telefono.trim() : null,
    };

    // console.log("Crear pasajero payload:", crearPayload);

    const crearResponse = await fetch(`${BACKEND_URL}/api/pasajeros`, {
      method: "POST",
      headers,
      body: JSON.stringify(crearPayload),
    });

    // console.log("Crear pasajero response:", crearResponse);

    const backendBody = await crearResponse
      .json()
      .catch(() => ({ error: "Respuesta no válida del backend" }));

    if (!crearResponse.ok) {
      return NextResponse.json(
        {
          error: backendBody.error || backendBody.message || "Error en backend",
          detalles: backendBody,
        },
        { status: crearResponse.status }
      );
    }

    return NextResponse.json({
      pasajero: backendBody,
      creado: true,
      mensaje: "Pasajero creado exitosamente",
    });
  } catch (error: any) {
    console.error("Error en crear pasajero:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        detalles: error?.message || error,
      },
      { status: 500 }
    );
  }
}
