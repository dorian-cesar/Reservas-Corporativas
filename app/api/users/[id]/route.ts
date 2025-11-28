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

    const body = await req.json();

    const { id } = await params;

    const res = await fetch(`${API_BASE}/api/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    console.error("Error actualizando usuario:", err);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
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

    const { id } = await params;

    console.log("🔍 DELETE User - ID:", id);

    const res = await fetch(`${API_BASE}/api/users/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    console.error("Error eliminando usuario:", err);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
