import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

// PUT /api/permisos/:id - Actualizar permiso de un rol específico
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("authorization");

    if (!token) {
      return NextResponse.json(
        { message: "Token no proporcionado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/api/permisos/${id}`, {
      method: "PUT",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson?.message) {
          return NextResponse.json(
            { message: errorJson.message },
            { status: res.status }
          );
        }
      } catch {}
      return NextResponse.json(
        { message: `Error del backend: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("Error al actualizar permiso:", err);
    return NextResponse.json(
      { message: "Error al actualizar permiso", error: err.message },
      { status: 500 }
    );
  }
}
