'use client';

/**
 * El viaje a la isla: cuando un botón que está FUERA de la isla (en la nota: «Escuchar», «Letra»)
 * abre algo que vive en ella, una gotita sale del botón y sube hasta su lugar en la isla; al llegar,
 * la isla la recibe (un pulso) y de ahí cae la gota. Así se entiende de dónde salió y adónde se fue.
 *
 * El camino es una curva que sale hacia arriba y entra a la isla por abajo (por donde salen las
 * gotas). Sólo anima transform y opacidad con la Web Animations API: corre en el compositor, sin
 * React ni medidas a media animación. Con «reducir movimiento» (del sistema o de los ajustes de
 * lectura) no viaja.
 */

/** «Sin animaciones»: lo pide el sistema o los ajustes de lectura de Noticias */
export function movimientoQuieto() {
    if (typeof window === 'undefined') return true;
    return document.documentElement.dataset.nMovimiento === 'quieto' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Destinos con una gotita en camino (un segundo clic no lanza otra) */
const enCamino = new WeakSet<HTMLElement>();

/** El color de fondo del botón, si es sólido (la gotita sale de su mismo color); si no, vidrio */
function colorDe(el: HTMLElement) {
    const fondo = getComputedStyle(el).backgroundColor;
    const m = fondo.match(/^rgba?\(([^)]+)\)$/);
    if (!m) return null;
    const partes = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    const alfa = partes.length > 3 ? partes[3] : 1;
    return alfa >= 0.6 ? fondo : null;
}

const enPantalla = (r: DOMRect) => r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;

/** El botón de la isla recibe la gotita: un pulso; si estaba escondido esperándola, aparece */
function recibir(destino: HTMLElement, aparece: boolean) {
    destino.style.visibility = '';
    destino.animate(
        aparece
            ? [
                  { transform: 'scale(0.5)', opacity: 0.2 },
                  { transform: 'scale(1.07)', opacity: 1, offset: 0.55 },
                  { transform: 'scale(1)', opacity: 1 },
              ]
            : [{ transform: 'scale(1)' }, { transform: 'scale(1.1)', offset: 0.4 }, { transform: 'scale(1)' }],
        { duration: 380, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)' },
    );
}

/**
 * Lanza la gotita de `origen` a `destino` y resuelve cuando llega (un poco antes de acabar, para
 * que la gota empiece a caer mientras la isla la recibe). Con `aparece`, el destino se esconde
 * mientras tanto (la cápsula del reproductor «llega» con la gotita).
 */
export function volar(origen: HTMLElement, destino: HTMLElement, { aparece = false }: { aparece?: boolean } = {}): Promise<void> {
    if (movimientoQuieto() || enCamino.has(destino)) return Promise.resolve();
    const a = origen.getBoundingClientRect();
    const b = destino.getBoundingClientRect();
    if (!enPantalla(a) || !enPantalla(b)) return Promise.resolve();

    enCamino.add(destino);
    if (aparece) destino.style.visibility = 'hidden';

    const d = Math.round(Math.min(44, Math.max(30, a.height * 0.82)));
    const gotita = document.createElement('div');
    gotita.className = 'isla-viaje';
    gotita.setAttribute('aria-hidden', 'true');
    const color = colorDe(origen);
    if (color) {
        gotita.style.background = color;
        gotita.dataset.tinta = 'true';
    }
    gotita.style.width = gotita.style.height = `${d}px`;
    document.body.appendChild(gotita);

    // Del centro del botón al centro del destino, por una curva: sale hacia arriba y entra desde abajo
    const x0 = a.left + a.width / 2 - d / 2;
    const y0 = a.top + a.height / 2 - d / 2;
    const x1 = b.left + b.width / 2 - d / 2;
    const y1 = b.top + b.height / 2 - d / 2;
    const alza = Math.max(70, Math.abs(y0 - y1) * 0.55);
    const p1 = { x: x0 + (x1 - x0) * 0.08, y: y0 - alza * 0.7 };
    const p2 = { x: x1, y: y1 + alza };
    const llega = Math.min(1, (b.height * 0.7) / d);
    const distancia = Math.hypot(x1 - x0, y1 - y0);
    const duracion = Math.round(Math.min(620, Math.max(440, 360 + distancia * 0.2)));

    const PASOS = 16;
    const cuadros: Keyframe[] = [];
    for (let i = 0; i <= PASOS; i++) {
        const u = i / PASOS;
        const v = 1 - u;
        const x = v * v * v * x0 + 3 * v * v * u * p1.x + 3 * v * u * u * p2.x + u * u * u * x1;
        const y = v * v * v * y0 + 3 * v * v * u * p1.y + 3 * v * u * u * p2.y + u * u * u * y1;
        // Brota del botón, se estira al subir (como una gota que va rápido) y se encoge al entrar
        const brota = Math.min(1, 0.45 + u * 4.6);
        const estira = Math.sin(Math.PI * u);
        const entra = u > 0.78 ? 1 - ((u - 0.78) / 0.22) * (1 - llega) : 1;
        const s = brota * entra;
        cuadros.push({
            transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${(s * (1 - 0.1 * estira)).toFixed(3)}, ${(s * (1 + 0.16 * estira)).toFixed(3)})`,
            opacity: u > 0.86 ? Math.max(0, 1 - (u - 0.86) / 0.14) : 1,
        });
    }

    return new Promise((listo) => {
        const vuelo = gotita.animate(cuadros, { duration: duracion, easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'forwards' });
        const llegada = window.setTimeout(() => {
            recibir(destino, aparece);
            listo();
        }, duracion * 0.84);
        let acabado = false;
        const acabar = () => {
            if (acabado) return;
            acabado = true;
            window.clearTimeout(llegada);
            window.clearTimeout(seguro);
            gotita.remove();
            enCamino.delete(destino);
            if (destino.style.visibility === 'hidden') recibir(destino, aparece);
            listo();
        };
        vuelo.finished.then(acabar, acabar);
        // Por si el navegador no avisa que terminó (pestaña en segundo plano): nunca se queda la gotita
        const seguro = window.setTimeout(acabar, duracion + 120);
    });
}
