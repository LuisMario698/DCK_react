/**
 * Hace `hacer` cuando la página ya terminó de cargar y el navegador está en reposo
 * (requestIdleCallback; en Safari, poco después de `load`). Para lo que conviene tener listo pero no
 * debe competir con la carga: bajar los modelos 3D, la siguiente foto del carrusel… Devuelve cómo
 * cancelarlo (para la limpieza de un efecto).
 */
export function cuandoEnReposo(hacer: () => void, espera = 2500) {
    let id = 0;
    let temporizador = 0;
    const pedir = () => {
        if (typeof window.requestIdleCallback === 'function') id = window.requestIdleCallback(hacer, { timeout: espera });
        else temporizador = window.setTimeout(hacer, 600);
    };
    if (document.readyState === 'complete') pedir();
    else window.addEventListener('load', pedir, { once: true });
    return () => {
        window.removeEventListener('load', pedir);
        if (id) window.cancelIdleCallback(id);
        window.clearTimeout(temporizador);
    };
}
