import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const ticketNumber = req.nextUrl.searchParams.get("ticketNumber");

    if (!ticketNumber) {
      return NextResponse.json(
        { error: "Falta el parámetro ticketNumber" },
        { status: 400 }
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_URL_BACKEND}/api/pdf/${ticketNumber}?format=pdf`;

    const pdfRes = await fetch(backendUrl, {
      method: "GET",
    });

    if (!pdfRes.ok) {
      return NextResponse.json(
        { error: "Error al obtener el PDF desde el backend" },
        { status: pdfRes.status }
      );
    }

    const pdfBuffer = await pdfRes.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=ticket-${ticketNumber}.pdf`,
      },
    });
  } catch (error) {
    console.error("Error API PDF:", error);
    return NextResponse.json(
      { error: "Error interno obteniendo PDF" },
      { status: 500 }
    );
  }
}
