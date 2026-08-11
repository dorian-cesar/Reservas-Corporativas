import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");

    if (!token) {
      return NextResponse.json(
        { message: "Token no proporcionado" },
        { status: 401 },
      );
    }

    const url = new URL(`${BACKEND_URL}/api/reports/estado-cuenta-empresa`);
    req.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Backend error: ${res.status} - ${errorText}`);
      return NextResponse.json(
        { message: `Error del backend: ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Error al obtener reporte por empresa:", err);
    return NextResponse.json(
      { message: "Error al obtener reporte de estado de cuenta por empresa" },
      { status: 500 },
    );
  }
}
