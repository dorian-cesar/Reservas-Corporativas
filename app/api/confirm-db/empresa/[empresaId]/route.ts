import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> }
) {
  try {
    const token = req.headers.get("authorization");
    if (!token) {
      console.error("No token provided");
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { empresaId } = await params;

    if (!empresaId) {
      console.error("No empresaId provided");
      return NextResponse.json(
        { message: "ID de empresa requerido" },
        { status: 400 }
      );
    }

    const res = await fetch(`${API_BASE}/api/tickets/empresa/${empresaId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (res.status === 404) {
      const errorData = await res.json();
      return NextResponse.json(
        {
          message:
            errorData.message || "No se encontraron tickets para esa empresa",
          empty: true,
        },
        { status: 200 }
      );
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Backend error: ${res.status} - ${errorText}`);
      throw new Error(
        `Backend responded with status: ${res.status} - ${errorText}`
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      {
        message: "Error interno del servidor",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
