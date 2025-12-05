export const formatRutInput = (value: string): string => {
  // Eliminar todo excepto números y K
  const clean = value.replace(/[^0-9kK]/g, "");

  if (clean.length === 0) return "";

  // Separar cuerpo y dígito verificador
  const cuerpo = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();

  // Formatear cuerpo con puntos
  let cuerpoFormateado = cuerpo;
  if (cuerpo.length > 3) {
    cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  return `${cuerpoFormateado}-${dv}`;
};

export const cleanRut = (rut: string): string => {
  return rut.replace(/\./g, "").toUpperCase();
};

export const validarRut = (rut: string): boolean => {
  if (!rut) return false;

  const rutLimpio = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
  if (rutLimpio.length < 2) return false;

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  // Validar que el cuerpo sean solo números
  if (!/^\d+$/.test(cuerpo)) return false;

  // Validar longitud del cuerpo
  if (cuerpo.length < 7 || cuerpo.length > 8) return false;

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

  return dvCalculado === dv;
};

export const formatearRutParaMostrar = (rut: string): string => {
  if (!rut) return "";
  const rutLimpio = rut.replace(/\./g, "");
  if (rutLimpio.length < 2) return rut;

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
};
