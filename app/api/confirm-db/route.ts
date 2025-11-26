import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Token no proporcionado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const backendUrl = `${process.env.URL_BACKEND}/api/tickets`;

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || "Error en backend",
          resData: data,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error en al guardar en db (confirm)", error);
    return NextResponse.json(
      { success: false, error: "Error interno api confirm-db" },
      { status: 500 }
    );
  }
}
