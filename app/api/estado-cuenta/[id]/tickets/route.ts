import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

export async function GET(
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

    const searchParams = req.nextUrl.searchParams;
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    const url = new URL(`${BACKEND_URL}/api/estado-cuenta/${id}/tickets`);

    if (page) url.searchParams.append("page", page);
    if (limit) url.searchParams.append("limit", limit);

    const res = await fetch(url.toString(), {
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Backend error: ${res.status} - ${errorText}`);
      return NextResponse.json(
        { message: `Error del backend: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });

  } catch (err) {
    console.error("Error al obtener tickets del estado de cuenta:", err);
    return NextResponse.json(
      { message: "Error al obtener tickets del estado de cuenta" },
      { status: 500 }
    );
  }
}