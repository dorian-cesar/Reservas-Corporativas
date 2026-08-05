import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Falta el parámetro id de edp" },
        { status: 400 },
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_URL_BACKEND}/api/pdf/${id}/edp/excel`;

    const excelRes = await fetch(backendUrl, {
      method: "GET",
    });

    if (!excelRes.ok) {
      return NextResponse.json(
        { error: "Error al obtener el Excel desde el backend" },
        { status: excelRes.status },
      );
    }

    const excelBuffer = await excelRes.arrayBuffer();

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=tickets_edp_${id}.xlsx`,
      },
    });
  } catch (error) {
    console.error("Error API Excel:", error);
    return NextResponse.json(
      { error: "Error interno obteniendo Excel" },
      { status: 500 },
    );
  }
}
