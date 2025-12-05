import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");
    if (!token)
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const body = await req.json();

    const res = await fetch(`${API_BASE}/api/centros-costo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Error del backend");
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("Error creando centro de costo:", err);
    return NextResponse.json(
      {
        message: err.message || "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

// GET no existe en el backend para listar todos, solo por empresa
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const empresaId = searchParams.get("empresaId");
    const token = request.headers.get("authorization");
    if (!token)
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    if (!empresaId) {
      return NextResponse.json(
        { error: "El parámetro empresaId es requerido" },
        { status: 400 }
      );
    }

    const empresaIdNum = parseInt(empresaId);
    if (isNaN(empresaIdNum) || empresaIdNum <= 0) {
      return NextResponse.json(
        { error: "El empresaId debe ser un número válido" },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(
      `${API_BASE}/api/centros-costo?empresaId=${empresaIdNum}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    );

    if (!backendResponse.ok) {
      if (backendResponse.status === 404) {
        return NextResponse.json([], { status: 200 });
      }

      throw new Error(`Error del backend: ${backendResponse.status}`);
    }

    const data = await backendResponse.json();

    const centrosCosto = Array.isArray(data)
      ? data.map((centro: any) => ({
          id: centro.id || centro.ID || centro.Id,
          nombre: centro.nombre || centro.Nombre || centro.name,
          estado: centro.estado || centro.Estado || centro.status || true,
          empresaId: centro.empresaId || centro.empresa_id || centro.id_empresa,
        }))
      : [];

    return NextResponse.json(centrosCosto, { status: 200 });
  } catch (error) {
    console.error("Error en proxy de centros de costo:", error);

    if (error instanceof Error) {
      if (error.message.includes("Error del backend")) {
        return NextResponse.json(
          { error: "Error del servidor backend" },
          { status: 502 }
        );
      }
    }
    return NextResponse.json([], { status: 200 });
  }
}
