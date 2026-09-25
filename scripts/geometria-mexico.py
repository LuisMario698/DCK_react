"""
Genera components/landing/mapa/geometria.ts (silueta de México y vecinos para
el mapa SVG de la landing) a partir de Natural Earth 1:50m (dominio público).

Uso:
    curl -sL -o ne50.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
    python3 scripts/geometria-mexico.py      # escribe geometria.ts en el directorio actual
"""
import json, math
d = json.load(open('ne50.geojson'))
LON0, LON1, LAT0, LAT1 = -119.6, -85.2, 13.2, 33.6
ANCHO = 1000.0
def merc(lat): return math.degrees(math.log(math.tan(math.pi/4 + math.radians(lat)/2)))
K = ANCHO / (LON1 - LON0)
YMAX = merc(LAT1)
ALTO = (YMAX - merc(LAT0)) * K
def proy(lon, lat): return ((lon - LON0) * K, (YMAX - merc(lat)) * K)

def dp(pts, tol):
    if len(pts) < 3: return pts
    (x1,y1),(x2,y2) = pts[0], pts[-1]
    dx, dy = x2-x1, y2-y1; L = math.hypot(dx,dy) or 1e-9
    imax, dmax = 0, 0
    for i in range(1, len(pts)-1):
        x,y = pts[i]; dd = abs(dy*x - dx*y + x2*y1 - y2*x1)/L
        if dd > dmax: imax, dmax = i, dd
    if dmax > tol: return dp(pts[:imax+1], tol)[:-1] + dp(pts[imax:], tol)
    return [pts[0], pts[-1]]

def clip(ring, xmin, ymin, xmax, ymax):
    def c(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            a, b = pts[i-1], pts[i]
            if inside(b):
                if not inside(a): out.append(inter(a,b))
                out.append(b)
            elif inside(a): out.append(inter(a,b))
        return out
    def ix(a,b,x): t=(x-a[0])/(b[0]-a[0]); return (x, a[1]+t*(b[1]-a[1]))
    def iy(a,b,y): t=(y-a[1])/(b[1]-a[1]); return (a[0]+t*(b[0]-a[0]), y)
    p = ring
    for inside, inter in [(lambda q: q[0]>=xmin, lambda a,b: ix(a,b,xmin)), (lambda q: q[0]<=xmax, lambda a,b: ix(a,b,xmax)),
                          (lambda q: q[1]>=ymin, lambda a,b: iy(a,b,ymin)), (lambda q: q[1]<=ymax, lambda a,b: iy(a,b,ymax))]:
        if not p: break
        p = c(p, inside, inter)
    return p

def area(r): return abs(sum(r[i-1][0]*r[i][1]-r[i][0]*r[i-1][1] for i in range(len(r))))/2

def path(codigos, tol, area_min):
    partes = []
    for f in d['features']:
        if f['properties'].get('ADM0_A3') not in codigos: continue
        g = f['geometry']
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        for poly in polys:
            ring = [proy(lon, lat) for lon, lat in poly[0]]
            ring = clip(ring, -20, -20, ANCHO + 20, ALTO + 20)
            if len(ring) < 3 or area(ring) < area_min: continue
            if ring[0] == ring[-1]: ring = ring[:-1]
            ring = dp(ring, tol)
            if len(ring) < 3: continue
            partes.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in ring) + 'Z')
    return ''.join(partes)

mex = path({'MEX'}, 0.6, 4)
vec = path({'USA','GTM','BLZ','HND','SLV','CUB'}, 1.0, 30)
ts = f'''// Geometría de México y países vecinos para el mapa SVG de la landing.
// Generada a partir de Natural Earth 1:50m (dominio público,
// https://www.naturalearthdata.com), proyección Mercator, simplificada.
// No editar a mano: regenerar con el script si cambia el encuadre.

export const LIMITES = {{ lonMin: {LON0}, lonMax: {LON1}, latMin: {LAT0}, latMax: {LAT1} }} as const;
export const VIEWBOX = {{ ancho: {ANCHO:.0f}, alto: {ALTO:.1f} }} as const;

const K = {K!r};
const Y_MAX = {YMAX!r};

/** Proyecta latitud/longitud a coordenadas del viewBox (Mercator). */
export function proyectar(lat: number, lng: number): {{ x: number; y: number }} {{
    const yMerc = (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
    return {{ x: (lng - LIMITES.lonMin) * K, y: (Y_MAX - yMerc) * K }};
}}

export const MEXICO_PATH =
    '{mex}';

/** Estados Unidos (sur), Guatemala, Belice, Honduras, El Salvador y Cuba, recortados al encuadre. */
export const VECINOS_PATH =
    '{vec}';
'''
open('geometria.ts', 'w').write(ts)
print('viewBox', ANCHO, round(ALTO,1), '| MEX', len(mex), 'bytes | vecinos', len(vec), 'bytes')

# El contorno en lng/lat para MapLibre (components/landing/mapa/contorno-mexico.ts)
# se genera con el mismo archivo: anillos de MEX con área > 0.05°², simplificados
# con Douglas-Peucker (tolerancia 0.02°) y redondeados a 3 decimales.
