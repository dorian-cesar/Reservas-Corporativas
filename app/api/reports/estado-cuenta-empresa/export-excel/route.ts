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

    const url = new URL(
      `${BACKEND_URL}/api/reports/estado-cuenta-empresa/export-excel`,
    );
    req.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: token,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: `Error del backend: ${res.status}` },
        { status: res.status },
      );
    }

    const blob = await res.arrayBuffer();
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          res.headers.get("content-disposition") ||
          'attachment; filename="estado_cuenta_empresa.xlsx"',
      },
    });
  } catch (err) {
    console.error("Error al exportar Excel por empresa:", err);
    return NextResponse.json(
      { message: "Error al exportar reporte Excel" },
      { status: 500 },
    );
  }
}
