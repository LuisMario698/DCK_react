/**
 * Fondo del lenguaje de diseño SiMAR: papel con curvas de profundidad (batimetría)
 * y dos manchas de luz muy suaves detrás del menú lateral. Existe para que el vidrio
 * del menú tenga algo que difuminar. Es decorativo: no recibe clics ni lo leen los
 * lectores de pantalla. Colores en variables CSS (--simar-*), cambian con el tema.
 * Ver DISEÑO_SIMAR.md.
 */
export function FondoSimar() {
    return (
        <div aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-simar-papel">
            <svg
                width="760"
                height="760"
                viewBox="400 -220 560 560"
                className="absolute -left-[260px] -top-[60px] origin-top-left max-sm:scale-75"
            >
                <ellipse cx="560" cy="40" rx="190" ry="150" style={{ fill: 'var(--simar-blob-1)' }} />
                <ellipse cx="640" cy="170" rx="140" ry="110" style={{ fill: 'var(--simar-blob-2)' }} />
                <g style={{ fill: 'none', stroke: 'var(--simar-curva)', strokeWidth: 1.5 }}>
                    <path d="M637 40 C636 48 627 57 620 64 C612 70 602 75 592 78 C582 81 572 82 560 83 C548 85 530 91 520 88 C509 85 504 72 499 64 C495 56 493 48 493 40 C493 32 494 23 499 16 C505 9 515 2 525 -2 C535 -6 549 -11 560 -10 C571 -9 579 0 590 4 C601 8 617 8 625 14 C633 20 638 32 637 40 Z" />
                    <path d="M722 40 C718 57 690 72 674 86 C659 100 648 115 629 124 C610 133 585 136 560 139 C535 142 498 149 478 141 C457 132 448 106 438 89 C429 73 424 57 421 40 C419 23 412 -1 423 -15 C435 -30 466 -40 488 -47 C511 -55 537 -62 560 -60 C583 -59 601 -46 625 -39 C648 -32 685 -30 701 -17 C717 -4 726 23 722 40 Z" />
                    <path d="M800 40 C791 66 745 84 724 107 C702 130 698 161 671 176 C644 192 598 197 560 198 C522 200 473 199 442 185 C412 171 394 139 377 115 C361 91 349 67 343 40 C337 13 324 -28 343 -49 C362 -70 421 -76 457 -86 C494 -96 525 -107 560 -107 C595 -108 630 -100 666 -90 C702 -81 754 -70 776 -49 C799 -27 809 14 800 40 Z" />
                    <path d="M869 40 C859 74 805 98 779 130 C754 163 754 213 717 234 C681 255 610 258 560 255 C510 253 457 238 414 220 C372 201 333 174 307 144 C280 114 262 77 256 40 C249 3 239 -53 268 -80 C297 -107 382 -107 431 -119 C479 -132 513 -151 560 -156 C607 -162 668 -165 715 -151 C762 -138 817 -108 843 -76 C868 -44 880 6 869 40 Z" />
                </g>
            </svg>
        </div>
    );
}
