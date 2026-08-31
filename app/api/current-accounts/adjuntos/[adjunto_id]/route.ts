import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ adjunto_id: string }> }
) {
  try {
    const token = req.headers.get("authorization");
    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { adjunto_id } = await params;

    const res = await fetch(
      `${API_BASE}/api/cuenta-corriente/adjuntos/${adjunto_id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Error eliminando adjunto:", err);
    return NextResponse.json(
      { message: "Error interno del servidor al eliminar adjunto" },
      { status: 500 }
    );
  }
}
