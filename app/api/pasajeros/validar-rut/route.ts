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

    // Limpiar RUT
    const rutClean = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();

    if (rutClean.length < 2) {
      return NextResponse.json(
        { valido: false, error: "RUT demasiado corto" },
        { status: 200 }
      );
    }

    const cuerpo = rutClean.slice(0, -1);
    const dv = rutClean.slice(-1);

    // Validar que el cuerpo sean solo números
    if (!/^\d+$/.test(cuerpo)) {
      return NextResponse.json(
        { valido: false, error: "Cuerpo del RUT debe contener solo números" },
        { status: 200 }
      );
    }

    // Validar longitud del cuerpo
    if (cuerpo.length < 7 || cuerpo.length > 8) {
      return NextResponse.json(
        { valido: false, error: "Cuerpo del RUT debe tener 7 u 8 dígitos" },
        { status: 200 }
      );
    }

    // Calcular dígito verificador
    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo.charAt(i)) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = suma % 11;
    const dvEsperado = 11 - resto;

    const dvCalculado =
      dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : dvEsperado.toString();

    const valido = dvCalculado === dv;

    return NextResponse.json(
      {
        valido,
        rutFormateado: cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv,
        mensaje: valido
          ? "RUT válido"
          : `Dígito verificador inválido. Esperado: ${dvCalculado}`,
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
