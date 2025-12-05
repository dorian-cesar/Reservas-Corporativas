import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_URL_BACKEND;

// POST /api/pasajeros/buscar-o-crear
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rut, nombre, correo, id_empresa, id_centro_costo } = body;
    const token = request.headers.get("authorization");

    if (!rut) {
      return NextResponse.json(
        { error: "El RUT es requerido" },
        { status: 400 }
      );
    }

    // Limpiar el RUT
    const rutClean = rut.replace(/\./g, "").toUpperCase();

    // Preparar headers común para todas las solicitudes
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Agregar Authorization si existe el token
    if (token) {
      headers["Authorization"] = token;
    }

    // 1. Primero buscar el pasajero
    const buscarResponse = await fetch(
      `${BACKEND_URL}/api/pasajeros?rut=${rutClean}`,
      {
        method: "GET",
        headers,
      }
    );

    let pasajero = null;
    let creado = false;

    if (buscarResponse.ok) {
      const data = await buscarResponse.json();
      if (Array.isArray(data) && data.length > 0) {
        pasajero = data[0];
      }
    }

    // 2. Si no existe y tenemos datos para crear, crear nuevo
    if (!pasajero && nombre && id_empresa) {
      const crearPayload = {
        nombre,
        rut: rutClean,
        correo: correo || null,
        id_empresa,
        id_centro_costo: id_centro_costo || null,
      };

      const crearResponse = await fetch(`${BACKEND_URL}/api/pasajeros`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(crearPayload),
      });

      if (crearResponse.ok) {
        pasajero = await crearResponse.json();
        creado = true;
      } else {
        const errorData = await crearResponse.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          errorData.message ||
          `Error al crear pasajero: ${crearResponse.status}`;

        // Si es error 401, dar un mensaje más específico
        if (crearResponse.status === 401) {
          throw new Error(
            "No autorizado para crear pasajero. Verifique sus credenciales."
          );
        }

        throw new Error(errorMessage);
      }
    }

    // 3. Preparar respuesta
    if (pasajero) {
      return NextResponse.json(
        {
          pasajero,
          creado,
          mensaje: creado
            ? "Pasajero creado exitosamente"
            : "Pasajero encontrado",
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          encontrado: false,
          creado: false,
          mensaje:
            "Pasajero no encontrado. Proporcione datos para crear uno nuevo.",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error en buscar-o-crear pasajero:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
