/** Los mismos datos que la hoja a mano (HojaPapel): así se ve que es el mismo manifiesto */
const RESIDUOS = [
    { valor: '70', etiqueta: 'Aceite (L)', x: 28, principal: true },
    { valor: '3', etiqueta: 'Filtros', x: 145, principal: false },
    { valor: '122', etiqueta: 'Basura (kg)', x: 262, principal: false },
] as const;

/** La firma de quien entrega: el mismo trazo que en la hoja, ahora en la pantalla */
export const FIRMA_ENTREGA =
    'M58 402 C60 388 66 376 72 378 C79 381 72 398 66 404 C62 408 64 396 74 390 C82 386 86 398 92 396 C98 394 98 384 104 386 C110 388 106 398 112 398 C118 398 120 386 126 388 C132 390 128 400 136 398 C146 396 160 388 176 384';
export const FIRMA_ENTREGA_RAYA = 'M64 410 C96 405 140 401 184 396';

/**
 * El mismo manifiesto, ya en SiMAR: copia la ficha de la app (ícono suave, folio, «Residuos
 * recolectados» en mosaicos, la firma y «Firmado y guardado»). Usa los colores de la app: cambia
 * sola con el modo oscuro. La palomita de guardado va aparte, en HTML (DonFrancisco), para
 * animarla sin repintar el dibujo.
 */
export function ManifiestoDigital() {
    return (
        <svg viewBox="0 0 400 520" className="df-svg" aria-hidden="true" focusable="false">
            <rect className="df-d-tarjeta" x="0.5" y="0.5" width="399" height="519" rx="20" />

            {/* Encabezado: el ícono de documento en su círculo suave, el título y el folio */}
            <circle className="df-d-icono-fondo" cx="52" cy="52" r="24" />
            <g className="df-d-icono" transform="translate(39 39) scale(1.08)">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M10 9H8M16 13H8M16 17H8" />
            </g>
            <text className="df-d-texto" x="90" y="48" fontSize="19" fontWeight="800">Manifiesto</text>
            <text className="df-d-texto-2" x="90" y="70" fontSize="13" fontWeight="600" letterSpacing="0.2">
                Folio MAN30102026003
            </text>
            <line className="df-d-linea" x1="0" y1="98" x2="400" y2="98" />

            {/* Embarcación y fecha */}
            <text className="df-d-texto-2" x="28" y="128" fontSize="12.5" fontWeight="700">Embarcación</text>
            <text className="df-d-texto" x="28" y="153" fontSize="18" fontWeight="700">Estrella del Golfo</text>
            <text className="df-d-texto-2" x="372" y="128" fontSize="12.5" fontWeight="700" textAnchor="end">
                Fecha de emisión
            </text>
            <text className="df-d-texto" x="372" y="153" fontSize="18" fontWeight="700" textAnchor="end">
                30 oct 2026
            </text>

            {/* Residuos recolectados: el aceite resaltado, como en la ficha de la app */}
            <text className="df-d-texto" x="28" y="196" fontSize="14.5" fontWeight="800">Residuos recolectados</text>
            {RESIDUOS.map((r) => (
                <g key={r.etiqueta}>
                    <rect
                        className={r.principal ? 'df-d-mosaico-principal' : 'df-d-mosaico'}
                        x={r.x}
                        y="210"
                        width="110"
                        height="80"
                        rx="14"
                    />
                    <text
                        className={r.principal ? 'df-d-cifra-principal' : 'df-d-texto'}
                        x={r.x + 55}
                        y="252"
                        fontSize="27"
                        fontWeight="800"
                        textAnchor="middle"
                    >
                        {r.valor}
                    </text>
                    <text className="df-d-texto-2" x={r.x + 55} y="274" fontSize="12" fontWeight="700" textAnchor="middle">
                        {r.etiqueta}
                    </text>
                </g>
            ))}

            {/* La firma, en su recuadro, con cuántas van */}
            <rect className="df-d-firma-fondo" x="28" y="310" width="344" height="106" rx="16" />
            <text className="df-d-texto-2" x="44" y="335" fontSize="12.5" fontWeight="700">Firma del motorista</text>
            <rect className="df-d-insignia" x="256" y="320" width="102" height="24" rx="12" />
            <text className="df-d-insignia-texto" x="307" y="336.5" fontSize="12" fontWeight="800" textAnchor="middle">
                4 de 4 firmas
            </text>
            <g transform="translate(74 -20)">
                <path className="df-d-firma" d={FIRMA_ENTREGA} />
                <path className="df-d-firma" d={FIRMA_ENTREGA_RAYA} />
            </g>
            <line className="df-d-base-firma" x1="44" y1="398" x2="356" y2="398" />

            <line className="df-d-linea" x1="0" y1="436" x2="400" y2="436" />

            {/* Firmado y guardado (la palomita se monta encima, en HTML) y el PDF */}
            <text className="df-d-texto" x="84" y="464" fontSize="15.5" fontWeight="800">Firmado y guardado</text>
            <text className="df-d-texto-2" x="84" y="484" fontSize="12.5" fontWeight="600">Puerto Peñasco, Sonora</text>
            <rect className="df-d-accion" x="290" y="452" width="82" height="36" rx="18" />
            <text className="df-d-accion-texto" x="331" y="475" fontSize="13.5" fontWeight="800" textAnchor="middle">
                Ver PDF
            </text>
        </svg>
    );
}
