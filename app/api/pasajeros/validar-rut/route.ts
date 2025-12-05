import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rut } = body;

    if (!rut) {
      return NextResponse.json(
        { error: "El RUT es requerido" },
        { status: 400 }
      );
    }

    const rutClean = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();

    if (rutClean.length < 2) {
      return NextResponse.json(
        { valido: false, error: "RUT demasiado corto" },
        { status: 200 }
      );
    }

    const cuerpo = rutClean.slice(0, -1);
    const dv = rutClean.slice(-1);

    if (!/^\d+$/.test(cuerpo)) {
      return NextResponse.json(
        { valido: false, error: "Cuerpo del RUT debe contener solo números" },
        { status: 200 }
      );
    }

    if (cuerpo.length < 7 || cuerpo.length > 8) {
      return NextResponse.json(
        { valido: false, error: "Cuerpo del RUT debe tener 7 u 8 dígitos" },
        { status: 200 }
      );
    }

    if (!/^[0-9kK]$/.test(dv)) {
      return NextResponse.json(
        {
          valido: false,
          error: "Dígito verificador debe ser un número (0-9) o K",
        },
        { status: 200 }
      );
    }

    const valido = true;

    return NextResponse.json(
      {
        valido,
        rutFormateado:
          cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv.toUpperCase(),
        mensaje: "Formato de RUT válido",
        cuerpo,
        dv: dv.toUpperCase(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validando RUT:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
