import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("authorization");
    if (!token)
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const res = await fetch(`${API_BASE}/api/pasajeros/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Backend PUT /api/pasajeros/:id error:", res.status, errorData);
      return NextResponse.json(
        { message: errorData.message || "Error del backend" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error actualizando pasajero:", err);
    return NextResponse.json(
      {
        message: err.message || "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}