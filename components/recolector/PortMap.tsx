'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { PuertoMock } from '@/lib/mock/recolector';

interface PortMapProps {
    puertos: PuertoMock[];
    selectedId?: string | null;
    onSelect?: (id: string) => void;
    height?: string;
}

const STATUS_COLOR: Record<string, string> = {
    disponible: '#00c9a7',
    sin_disponibilidad: '#64748b',
};

function buildIcon(L: any, color: string, selected: boolean) {
    const size = selected ? 32 : 24;
    const inner = selected ? 12 : 8;
    const glow = selected ? `0 0 20px ${color}, 0 0 40px ${color}44` : `0 0 10px ${color}88`;
    const ring = selected
        ? `border: 3px solid ${color}; box-shadow: ${glow};`
        : `border: 2px solid ${color}; box-shadow: ${glow};`;

    const pulse = color !== '#64748b'
        ? `<div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${color};animation:portPing 1.8s ease-out infinite;opacity:0;"></div>`
        : '';

    const html = `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${pulse}
        <div style="
          width:${size}px;height:${size}px;
          border-radius:50%;
          background:${color}22;
          ${ring}
          display:flex;align-items:center;justify-content:center;
          transition:all 0.25s ease;
        ">
          <div style="width:${inner}px;height:${inner}px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};"></div>
        </div>
      </div>`;

    return L.divIcon({
        html,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        tooltipAnchor: [size / 2 + 4, 0],
    });
}

export function PortMap({ puertos, selectedId, onSelect, height = 'h-80' }: PortMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<Map<string, any>>(new Map());
    const initialized = useRef(false);

    // Init map once
    useEffect(() => {
        if (initialized.current || !containerRef.current) return;
        initialized.current = true;

        const init = async () => {
            const L = (await import('leaflet')).default;
            if (!containerRef.current || mapRef.current) return;

            // Inject keyframes for ping animation
            if (!document.getElementById('port-ping-style')) {
                const style = document.createElement('style');
                style.id = 'port-ping-style';
                style.textContent = `
                  @keyframes portPing {
                    0% { transform: scale(1); opacity: 0.7; }
                    80%, 100% { transform: scale(2.2); opacity: 0; }
                  }
                `;
                document.head.appendChild(style);
            }

            const map = L.map(containerRef.current, {
                center: [23.5, -102],
                zoom: 5,
                zoomControl: false,
                attributionControl: false,
            });
            mapRef.current = map;

            // Teselas de OpenStreetMap: no requieren API key.
            // El aspecto oscuro se consigue con un filtro CSS sobre la capa
            // (.mapa-teselas-oscuras en globals.css), porque las teselas
            // dark_all de CartoDB ahora exigen clave y se marcan con agua.
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                className: 'mapa-teselas-oscuras',
            }).addTo(map);

            // Custom zoom control bottom-right
            L.control.zoom({ position: 'bottomright' }).addTo(map);

            // Attribution minimal
            L.control.attribution({ position: 'bottomright', prefix: '© OpenStreetMap' }).addTo(map);
        };

        init();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                initialized.current = false;
                markersRef.current.clear();
            }
        };
    }, []);

    // Sync markers when puertos or selectedId change
    useEffect(() => {
        const syncMarkers = async () => {
            if (!mapRef.current) return;
            const L = (await import('leaflet')).default;
            const map = mapRef.current;

            // IDs currently on map
            const existingIds = new Set(markersRef.current.keys());
            const newIds = new Set(puertos.map((p) => p.id));

            // Remove markers no longer in puertos
            existingIds.forEach((id) => {
                if (!newIds.has(id)) {
                    markersRef.current.get(id)?.remove();
                    markersRef.current.delete(id);
                }
            });

            // Add or update markers
            puertos.forEach((p) => {
                const color = STATUS_COLOR[p.estado] ?? '#64748b';
                const isSelected = p.id === selectedId;
                const icon = buildIcon(L, color, isSelected);
                const tooltipContent = `
                  <div style="
                    background:#0f172a;border:1px solid #1e293b;border-radius:8px;
                    padding:6px 12px;font-family:Inter,sans-serif;color:#f0faf6;
                    font-size:12px;font-weight:700;white-space:nowrap;
                    display:flex;align-items:center;gap:6px;
                  ">
                    <div style="width:7px;height:7px;border-radius:50%;background:${color};box-shadow:0 0 4px ${color};"></div>
                    ${p.nombre}
                  </div>`;

                if (markersRef.current.has(p.id)) {
                    // Update icon
                    markersRef.current.get(p.id)!.setIcon(icon);
                } else {
                    const marker = L.marker([p.lat, p.lng], { icon })
                        .addTo(map)
                        .bindTooltip(tooltipContent, {
                            className: '',
                            direction: 'top',
                            offset: [0, -16],
                            permanent: false,
                            opacity: 1,
                        });

                    marker.on('click', () => {
                        onSelect?.(p.id);
                    });

                    markersRef.current.set(p.id, marker);
                }
            });

            // Fly to selected
            if (selectedId) {
                const target = puertos.find((p) => p.id === selectedId);
                if (target) {
                    map.flyTo([target.lat, target.lng], 7, { animate: true, duration: 0.8 });
                }
            }
        };

        syncMarkers();
    }, [puertos, selectedId, onSelect]);

    return (
        <div
            ref={containerRef}
            className={`w-full ${height} rounded-xl overflow-hidden`}
            style={{ background: '#0b1220' }}
        />
    );
}
