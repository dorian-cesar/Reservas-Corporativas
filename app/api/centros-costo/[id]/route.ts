import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("authorization");
    if (!token)
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { id } = await params;

    const res = await fetch(`${API_BASE}/api/centros-costo/empresa/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!res.ok) {
      throw new Error(`Backend responded with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error obteniendo centro de costo:", err);
    return NextResponse.json(
      {
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("authorization");
    if (!token)
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    // Desempaquetar los params
    const { id } = await params;
    const body = await req.json();

    const res = await fetch(`${API_BASE}/api/centros-costo/${id}`, {
      method: "PUT",
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
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error actualizando centro de costo:", err);
    return NextResponse.json(
      {
        message: err.message || "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("authorization");
    if (!token)
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    // Desempaquetar los params
    const { id } = await params;

    const res = await fetch(`${API_BASE}/api/centros-costo/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!res.ok) {
      throw new Error(`Backend responded with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error eliminando centro de costo:", err);
    return NextResponse.json(
      {
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
