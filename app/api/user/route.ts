import { NextResponse } from "next/server";

const URL_BACKEND = process.env.URL_BACKEND;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID es requerido" },
        { status: 400 }
      );
    }

    if (!URL_BACKEND) {
      return NextResponse.json(
        { error: "URL_BACKEND no configurada" },
        { status: 500 }
      );
    }

    const url = `${URL_BACKEND}/api/users/${userId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error backend:", errorText);
      return NextResponse.json(
        {
          error: "Error obteniendo usuario del backend",
          status: response.status,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in user API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
