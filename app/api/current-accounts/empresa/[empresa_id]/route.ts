import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

async function getParams(context: any) {
  const { params } = await context;
  return params as { empresa_id: string };
}

export async function GET(req: NextRequest, context: any) {
  try {
    const { empresa_id } = await getParams(context);
    const token = req.headers.get("authorization");
    if (!token)
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    // Obtener los query parameters de la request
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Construir los parámetros para el backend
    const params = new URLSearchParams();

    // Parámetros de paginación
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    params.append("page", page);
    params.append("limit", limit);

    // Parámetros de filtro
    const tipo = searchParams.get("tipo");
    const pagado = searchParams.get("pagado");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    if (tipo) params.append("tipo", tipo);
    if (pagado) params.append("pagado", pagado);
    if (desde) params.append("desde", desde);
    if (hasta) params.append("hasta", hasta);

    const apiUrl = `${API_BASE}/api/cuenta-corriente/empresa/${empresa_id}?${params.toString()}`;

    console.log("Llamando a API con URL:", apiUrl); // Para debugging

    const res = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error del backend:", errorText);
      return NextResponse.json(
        { message: "Error obteniendo movimientos", error: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Verificar que la respuesta tenga el formato esperado
    if (!data.movimientos && !Array.isArray(data)) {
      console.warn("Respuesta inesperada del backend:", data);
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Error obteniendo movimientos por empresa:", err);
    return NextResponse.json(
      { message: "Error interno del servidor", error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}