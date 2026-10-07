// Una ubicación es "aproximada" cuando el punto es de calle o zona (o está marcado
// como sospechoso): sirve para ver la zona en el mapa, pero no para guiar al
// asesor hasta la puerta. Los clientes sin estado de geocodificación (cargados con
// coordenadas del Excel) y los verificados conservan su punto.
export function esUbicacionAproximada(cliente: any): boolean {
  const estado = cliente?.estado_geocodificacion;
  if (estado === "REVISAR") return true;
  if (estado !== "LOCALIZADO") return false;
  return (
    cliente?.confianza_geocodificacion !== "ALTA" &&
    cliente?.precision_geocodificacion !== "IMPORTADA"
  );
}

export function coordenadasConfiables(
  cliente: any,
): { latitud: number; longitud: number } | null {
  const latitud = Number(cliente?.latitud);
  const longitud = Number(cliente?.longitud);
  const validas =
    cliente?.latitud != null &&
    cliente?.latitud !== "" &&
    cliente?.longitud != null &&
    cliente?.longitud !== "" &&
    Number.isFinite(latitud) &&
    Number.isFinite(longitud) &&
    Math.abs(latitud) <= 90 &&
    Math.abs(longitud) <= 180;
  return validas && !esUbicacionAproximada(cliente) ? { latitud, longitud } : null;
}

export function textoDireccion(cliente: any): string {
  const partes: string[] = [
    cliente?.direccion,
    cliente?.distrito,
    cliente?.provincia,
    "Perú",
  ]
    .filter(Boolean)
    .map((parte: any) => String(parte).trim());
  return partes
    .filter(
      (parte, indice) =>
        partes.findIndex((otra) => otra.toLowerCase() === parte.toLowerCase()) === indice,
    )
    .join(", ");
}
