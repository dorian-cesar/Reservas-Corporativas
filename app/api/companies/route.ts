import { se } from "date-fns/locale";
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_URL_BACKEND ?? "";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");

    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const params = new URLSearchParams(req.nextUrl.searchParams as any);

    const page = params.get("page");
    const limit = params.get("limit");
    const search = params.get("search");

    if (page && limit) {
      params.set("page", page.toString());
      params.set("limit", limit.toString());
    }

    if (search && search.trim() !== "") {
      params.set("search", search);
    } else {
      params.delete("search");
    }

    const queryString = params.toString() ? `?${params.toString()}` : "";

    const res = await fetch(`${API_BASE}/api/empresas${queryString}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    console.error("Error listando empresas:", err);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");
    if (!token)
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const body = await req.json();

    const res = await fetch(`${API_BASE}/api/empresas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 201 : res.status });
  } catch (err) {
    console.error("Error creando empresa:", err);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
