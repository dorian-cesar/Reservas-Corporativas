import { NextResponse } from "next/server";

const NEXT_PUBLIC_URL_BACKEND = process.env.NEXT_PUBLIC_URL_BACKEND;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { error: "Token no proporcionado" },
      { status: 401 }
    );
  }

  if (!userId || userId === "undefined" || userId === "null") {
    return NextResponse.json({ error: "UserId no válido" }, { status: 400 });
  }

  try {
    const backendUrl = `${NEXT_PUBLIC_URL_BACKEND}/api/tickets/usuario/${userId}`;

    const res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        {
          error: "Error consultando backend",
          status: res.status,
          backendError: errorText,
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
