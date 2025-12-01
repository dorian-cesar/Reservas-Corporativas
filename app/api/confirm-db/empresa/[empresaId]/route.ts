// api/confirm-db/empresa/[empresaId]/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> }
) {
  try {
    if (!API_BASE) {
      console.error("NEXT_PUBLIC_URL_BACKEND no está configurada.");
      return NextResponse.json({ message: "Configuración del servidor incompleta" }, { status: 500 });
    }

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

    // Obtener parámetros de query string
    const url = new URL(req.url);
    const travelDateDesde = url.searchParams.get("travelDate_desde");
    const travelDateHasta = url.searchParams.get("travelDate_hasta");

    // Construir URL para el backend
    let backendUrl = `${API_BASE}/api/tickets/empresa/${empresaId}`;
    
    // Añadir parámetros de fecha si existen
    if (travelDateDesde && travelDateHasta) {
      backendUrl += `?travelDate_desde=${encodeURIComponent(travelDateDesde)}&travelDate_hasta=${encodeURIComponent(travelDateHasta)}`;
    } else if (travelDateDesde) {
      backendUrl += `?travelDate_desde=${encodeURIComponent(travelDateDesde)}`;
    } else if (travelDateHasta) {
      backendUrl += `?travelDate_hasta=${encodeURIComponent(travelDateHasta)}`;
    }

    console.log("Llamando a backend:", backendUrl); // Para debug

    const res = await fetch(backendUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (res.status === 404) {
      const errorData = await res.json().catch(() => null);
      return NextResponse.json(
        {
          message: errorData?.message || "No se encontraron tickets para esa empresa",
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
    console.error("Error en API interna:", err);
    return NextResponse.json(
      {
        message: "Error interno del servidor",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}