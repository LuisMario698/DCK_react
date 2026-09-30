/**
 * Clases de la pastilla con el dato vivo de una tarjeta del Panel ("Último: hace 2 h"). Aparte de
 * PanelInicio porque también la usa PastillaManifiesto (componente de cliente).
 * Si la tarjeta es angosta (mosaicos del celular, laptop con el menú abierto) pasa a dos renglones:
 * por eso esquinas de 16 px y no de píldora. `destacada`: algo que pide atención (en blanco sobre la
 * tarjeta azul).
 */
export function clasePastilla(principal: boolean, destacada = false) {
  const tono = destacada
    ? 'inline-flex items-center gap-1.5 bg-white text-[#1B5FC9]'
    : principal
      ? 'bg-white/15 text-white'
      : 'bg-simar-papel text-simar-texto-2';
  return `mt-2 md:mt-3 self-start max-w-full rounded-[16px] px-3 py-1 text-[17px] leading-snug font-semibold movil:mt-1.5 movil:px-2.5 movil:py-0.5 movil:rounded-[12px] movil:text-[13px] ${tono}`;
}
