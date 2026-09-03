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
      return NextResponse.json({ message: "ID de empresa requerido" }, { status: 400 });
    }

    // Clonar search params de la request
    const url = new URL(req.url);
    const incoming = new URLSearchParams(url.search);

    const exportAll = incoming.get("exportAll") === "true";

    // Normalizar page/limit
    const rawPage = incoming.get("page");
    const rawLimit = incoming.get("limit");
    const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
    const limit = Math.max(1, parseInt(rawLimit ?? "10", 10) || 10);

    const backendParams = new URLSearchParams();

    if (exportAll) {
      backendParams.set("exportAll", "true");
    } else {
      backendParams.set("page", String(page));
      backendParams.set("limit", String(limit));
    }

    const travelDateDesde = incoming.get("travelDate_desde");
    const travelDateHasta = incoming.get("travelDate_hasta");
    const ticketNumber = incoming.get("ticketNumber"); // nombre esperado por backend
    const filterStatus = incoming.get("filterStatus");

    if (travelDateDesde && travelDateDesde.trim() !== "") {
      backendParams.set("travelDate_desde", travelDateDesde.trim());
    }
    if (travelDateHasta && travelDateHasta.trim() !== "") {
      backendParams.set("travelDate_hasta", travelDateHasta.trim());
    }
    if (ticketNumber && ticketNumber.trim() !== "") {
      backendParams.set("pnrNumber", ticketNumber.trim());
    }
    if (filterStatus && filterStatus.trim() !== "") {
      backendParams.set("filterStatus", filterStatus.trim());
    }

    const backendUrl = `${API_BASE}/api/tickets/empresa/${encodeURIComponent(empresaId)}${backendParams.toString() ? `?${backendParams.toString()}` : ""}`;

    console.log("Llamando a backend:", backendUrl);

    const res = await fetch(backendUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      cache: "no-store",
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
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: res.status });
      } catch {
        return NextResponse.json({ message: errorText || "Error en backend" }, { status: res.status });
      }
    }

    const data = await res.json();
    // esperamos { tickets, pagination }
    return NextResponse.json(data, { status: 200 });

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