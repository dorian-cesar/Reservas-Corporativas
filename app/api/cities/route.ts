import { NextResponse } from "next/server";

type City = {
  id: number;
  name: string;
  origin_count: number;
  destination_count: number;
};

export async function GET() {
  try {
    const apiKey = process.env.KUPOS_API_KEY_PROD;
    const URL_KUPOS = process.env.URL_KUPOS_PROD;

    if (!apiKey) {
      return NextResponse.json(
        { error: "KUPOS_API_KEY no configurada" },
        { status: 500 }
      );
    }

    const res = await fetch(`${URL_KUPOS}/cities.json?api_key=${apiKey}`, {
      cache: "no-cache",
    });

    const data = await res.json();

    const [headers, ...rows] = data.result;

    let cities: City[] = rows.map((row: any[]) => ({
      id: row[0],
      name: row[1],
      origin_count: row[2],
      destination_count: row[3],
    }));

    cities = cities.filter(
      (c) => !c.name.toLowerCase().includes("hackedbykode")
    );

    return NextResponse.json({ cities });
  } catch (error) {
    console.error("Kupos error:", error);
    return NextResponse.json(
      { error: "Error al obtener ciudades" },
      { status: 500 }
    );
  }
}
