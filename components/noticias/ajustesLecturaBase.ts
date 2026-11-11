/**
 * Lo de los ajustes de lectura que no usa React (el layout de servidor sólo necesita el script).
 * Ver ajustesLectura.ts.
 */

export const NIVELES_LETRA = [0.9, 1, 1.12, 1.25, 1.4] as const;
export const NOMBRE_NIVEL = ['Chica', 'Normal', 'Grande', 'Más grande', 'Muy grande'] as const;
export const CLAVE_AJUSTES = 'simar:noticias-lectura';

/** Se pone en el <head> de Noticias: aplica lo guardado antes de pintar */
export const SCRIPT_AJUSTES = `(function(){try{var a=JSON.parse(localStorage.getItem('${CLAVE_AJUSTES}')||'{}')||{};var n=${JSON.stringify(NIVELES_LETRA)};var h=document.documentElement;h.style.setProperty('--n-zoom',String(n[a.letra]||1));h.dataset.nContraste=a.contraste==='alto'?'alto':'normal';h.dataset.nInterlineado=a.interlineado==='amplio'?'amplio':'normal';h.dataset.nMovimiento=a.movimiento==='quieto'?'quieto':'normal';h.dataset.nEnlaces=a.enlaces==='subrayados'?'subrayados':'normal';}catch(e){}})();`;
