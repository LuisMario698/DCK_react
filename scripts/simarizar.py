"""
Convierte las clases de Tailwind "sueltas" (gray-*, blue-*, emerald-*…) de una pantalla al
lenguaje de diseño SiMAR (tokens simar-*). Ver DISEÑO_SIMAR.md → "Cómo migrar una pantalla".

Uso:
    python3 scripts/simarizar.py app/[locale]/ruta/page.tsx components/Algo.tsx
    python3 scripts/comparar-manejadores.py app/[locale]/ruta/page.tsx components/Algo.tsx

Qué hace (sólo toca textos de clases, nunca lógica):
  - Colores: grises -> neutros simar; azul -> marea; verde -> arrecife; rojo/naranja/ámbar -> coral;
    morado -> violeta. Quita las variantes dark: de color (los tokens ya cambian solos).
  - Quita degradados, blur, mayúsculas sostenidas, letras espaciadas y animaciones de escala.
  - Texto < 15 px -> 15 px; text-sm -> text-base. Sombras -> shadow-simar.
  - Etiquetas de campo a 17 px negritas; campos a 52 px con borde de 2 px; botones a 44/52 px.
  - Bordes sin color -> border-simar-borde. Botón de cerrar (X) -> 52 px con aria-label.

Después de correrlo SIEMPRE:
  1. Revisa el diff y la pantalla en claro y oscuro (a mano quedan: encabezado con
     EncabezadoPantalla, acomodo, botones de ícono y textos).
  2. Firmas y lienzos de firma deben quedar en bg-white (el script los pasa a superficie).
  3. Corre comparar-manejadores.py: los onClick/onChange/ref deben salir "iguales".
Es idempotente: correrlo dos veces no cambia nada la segunda vez.
"""
import re, sys

FAMILIA = {}
for c in ['gray', 'slate', 'zinc', 'neutral', 'stone']: FAMILIA[c] = 'neutro'
for c in ['blue', 'indigo', 'sky', 'cyan']: FAMILIA[c] = 'marea'
for c in ['teal', 'green', 'emerald', 'lime']: FAMILIA[c] = 'arrecife'
for c in ['red', 'rose', 'pink', 'orange', 'amber', 'yellow']: FAMILIA[c] = 'coral'
for c in ['purple', 'violet', 'fuchsia']: FAMILIA[c] = 'violeta'
COLORES = '|'.join(FAMILIA)

FUERTE = {'marea': 'simar-marea', 'arrecife': '[#127A5D]', 'coral': '[#A63F0E]', 'violeta': '[#5B3FA8]'}
FUERTE_HOVER = {'marea': 'simar-marea-hover', 'arrecife': '[#0E6A50]', 'coral': '[#8C340B]', 'violeta': '[#4A3289]'}
TINTA = {'marea': 'simar-marea-tinta', 'arrecife': 'simar-arrecife-tinta', 'coral': 'simar-coral', 'violeta': 'simar-violeta'}
SUAVE = {'marea': 'simar-marea-suave', 'arrecife': 'simar-arrecife-suave', 'coral': 'simar-coral-suave', 'violeta': 'simar-violeta-suave'}
BORDE = {'marea': 'simar-marea-tinta', 'arrecife': 'simar-arrecife', 'coral': 'simar-coral', 'violeta': 'simar-violeta'}

RE_COLOR = re.compile(rf'^(bg|text|border|ring|divide|from|to|via|placeholder|fill|stroke|outline|decoration|accent|caret)(-[trblxy])?-({COLORES})-(\d{{2,3}})(/\d+)?$')
UTIL_COLOR = re.compile(rf'^(bg|text|border|ring|divide|from|to|via|placeholder|fill|stroke|outline|shadow|decoration|accent|caret)(-[trblxy])?-(({COLORES})-\d|white|black|transparent)')


def tono(n):
    n = int(n)
    return 'claro' if n <= 200 else ('medio' if n <= 400 else 'fuerte')


def mapear_color(util, lado, fam, n, alfa, variantes):
    t = tono(n)
    hover = 'hover' in variantes
    lado = lado or ''
    if util == 'bg':
        if fam == 'neutro':
            v = {'claro': 'simar-papel', 'medio': 'simar-campo-borde', 'fuerte': 'simar-texto-2' if int(n) <= 600 else 'simar-abismo'}[t]
            if int(n) == 200: v = 'simar-borde-suave'
            if hover and t == 'claro': v = 'simar-papel' if int(n) <= 100 else 'simar-borde-suave'
        elif t == 'fuerte':
            v = FUERTE_HOVER[fam] if hover and int(n) >= 600 else FUERTE[fam]
        else:
            v = SUAVE[fam]
        return f'bg-{v}{alfa or ""}'
    if util in ('text', 'fill', 'stroke', 'decoration', 'caret', 'accent'):
        if fam == 'neutro':
            v = {'claro': 'simar-texto-2', 'medio': 'simar-texto-2', 'fuerte': 'simar-texto-2' if int(n) <= 600 else 'simar-texto'}[t]
        elif t == 'claro' and util == 'text':
            return 'text-white/85'
        else:
            v = TINTA[fam]
        return f'{util}-{v}'
    if util == 'placeholder':
        return 'placeholder:text-simar-texto-3'
    if util in ('border', 'outline'):
        if fam == 'neutro':
            v = 'simar-borde' if int(n) <= 200 else ('simar-campo-borde' if int(n) <= 500 else 'simar-texto-2')
            if hover: v = 'simar-marea-tinta'
            return f'{util}{lado}-{v}'
        return f'{util}{lado}-{BORDE[fam]}' + ('' if t == 'fuerte' else '/30')
    if util == 'divide':
        return 'divide-simar-borde-suave' if fam == 'neutro' else f'divide-{BORDE[fam]}/30'
    if util == 'ring':
        return f'ring-simar-marea-tinta{alfa or ""}' if fam != 'neutro' else f'ring-simar-borde{alfa or ""}'
    if util == 'from':
        return None  # se resuelve en la pasada de degradados
    if util in ('to', 'via'):
        return ''
    return None


QUITAR = {'uppercase', 'tracking-wider', 'tracking-widest', 'tracking-wide', 'animate-ping', 'animate-bounce',
          'hover:scale-105', 'hover:scale-110', 'hover:scale-[1.02]', 'active:scale-95', 'active:scale-[0.98]',
          'group-hover:scale-110', 'group-hover:scale-105', 'hover:-translate-y-0.5', 'hover:-translate-y-1',
          'hover:shadow-md', 'hover:shadow-lg', 'hover:shadow-xl', 'hover:shadow-sm', 'hover:shadow-2xl', 'animate-scale-in', 'animate-fade-in'}
TEXTO_CHICO = {'text-xs', 'text-[9px]', 'text-[10px]', 'text-[11px]', 'text-[12px]', 'text-[13px]'}


def mapear_token(tok, clase_completa):
    # separa variantes (sm:, dark:, hover:...) de la utilidad
    partes = tok.split(':')
    util = partes[-1]
    variantes = partes[:-1]
    neg = ''
    if util.startswith('!'):
        neg, util = '!', util[1:]
    if 'dark' in variantes:
        # los tokens simar-* ya cambian solos con el tema
        if UTIL_COLOR.match(util) or util.startswith(('bg-', 'from-', 'to-', 'via-', 'shadow-', 'divide-', 'placeholder-', 'ring-')) or re.match(r'^(text|border)-(white|black)', util) or re.match(r'^border(-[trblxy])?-(slate|gray|zinc)', util):
            return ''
        if util.startswith('border-') and re.search(COLORES, util):
            return ''
        return tok
    base = util
    if base in QUITAR or tok in QUITAR:
        return ''
    if re.match(r'^backdrop-blur', base) or re.match(r'^backdrop-saturate', base):
        return ''
    if re.match(r'^bg-gradient-to-', base):
        return ''
    if re.match(r'^shadow-(sm|md|lg|xl)$', base) or base == 'shadow':
        return ':'.join(variantes + ['shadow-simar']) if 'hover' not in variantes else ''
    if re.match(rf'^shadow-({COLORES})-\d+(/\d+)?$', base) or re.match(r'^shadow-(black|white)/\d+$', base):
        return ''
    if base in TEXTO_CHICO:
        return ':'.join(variantes + ['text-[15px]'])
    if base == 'text-sm':
        return ':'.join(variantes + ['text-base'])
    if base == 'bg-white':
        return ':'.join(variantes + ['bg-simar-superficie'])
    if re.match(r'^bg-white/\d+$', base):
        # blanco translúcido: casi siempre va sobre un fondo de color; se queda blanco
        return tok
    if re.match(r'^bg-black/\d+$', base) or base == 'bg-black':
        return ':'.join(variantes + ['bg-[rgba(11,34,54,0.55)]'])
    if base == 'text-black':
        return ':'.join(variantes + ['text-simar-texto'])
    if base in ('placeholder-gray-400', 'placeholder-gray-500', 'placeholder-slate-400'):
        return ':'.join(variantes + ['placeholder:text-simar-texto-3'])
    if base.startswith('placeholder:') :
        pass
    m = RE_COLOR.match(base)
    if m:
        util_, lado, color, n, alfa = m.groups()
        fam = FAMILIA[color]
        if util_ == 'from':
            nuevo = mapear_color('bg', None, fam, n, None, variantes)
            return ':'.join(variantes + [nuevo])
        nuevo = mapear_color(util_, lado, fam, n, alfa, variantes)
        if nuevo is None:
            return tok
        if nuevo == '':
            return ''
        if nuevo.startswith('placeholder:'):
            return nuevo
        return neg + ':'.join(variantes + [nuevo]) if not neg else ':'.join(variantes + ['!' + nuevo])
    # placeholder:text-gray-400
    m2 = re.match(rf'^text-({COLORES})-(\d{{2,3}})$', base)
    return tok


PARECE_CLASE = re.compile(r'^[!a-z0-9:\-\[\]\/\.#%(),_&>*=+~\'"@]+$')


def es_lista_clases(txt):
    toks = txt.split()
    if not toks:
        return False
    if not all(PARECE_CLASE.match(t) for t in toks):
        return False
    return any(('-' in t) for t in toks)


def transformar_clases(txt):
    toks = txt.split()
    out = []
    for t in toks:
        # variantes con color en placeholder: placeholder:text-gray-400
        if t.startswith('placeholder:text-') and re.search(COLORES, t):
            out.append('placeholder:text-simar-texto-3'); continue
        if re.match(rf'^(focus|focus-within|focus-visible):(ring|border)-({COLORES})-\d+(/\d+)?$', t):
            pre, resto = t.split(':', 1)
            out.append(f'{pre}:{"ring" if resto.startswith("ring") else "border"}-simar-marea-tinta'); continue
        n = mapear_token(t, txt)
        if n:
            out.append(n)
    # quita duplicados conservando orden
    vistos, final = set(), []
    for t in out:
        if t not in vistos:
            vistos.add(t); final.append(t)
    return ' '.join(final)


def procesar(src):
    cambios = 0

    def sub_simple(m):
        nonlocal cambios
        q, txt = m.group(1), m.group(2)
        if not es_lista_clases(txt):
            return m.group(0)
        nuevo = transformar_clases(txt)
        # conserva espacios al inicio/fin (concatenaciones)
        lead = ' ' if txt.startswith(' ') else ''
        trail = ' ' if txt.endswith(' ') else ''
        nuevo = lead + nuevo + trail
        if nuevo != txt:
            cambios += 1
        return q + nuevo + q

    src = re.sub(r'(["\'])((?:(?!\1)[^\\\n])*)\1', sub_simple, src)

    # literales de plantilla: transforma los tramos estáticos
    def sub_tpl(m):
        nonlocal cambios
        cuerpo = m.group(1)
        partes = re.split(r'(\$\{(?:[^{}]|\{[^{}]*\})*\})', cuerpo)
        res = []
        for p in partes:
            if p.startswith('${'):
                res.append(p)
            else:
                if p.strip() and es_lista_clases(p):
                    lead = ' ' if p[:1].isspace() else ''
                    trail = ' ' if p[-1:].isspace() else ''
                    nuevo = lead + transformar_clases(p) + trail
                    if nuevo != p:
                        cambios += 1
                    res.append(nuevo)
                else:
                    res.append(p)
        return '`' + ''.join(res) + '`'

    src = re.sub(r'`((?:[^`\\]|\\.)*)`', sub_tpl, src)
    return src, cambios




# ---------------------------------------------------------------------------
# Segunda pasada: estructura (etiquetas, campos, botones, bordes sin color)
# ---------------------------------------------------------------------------
BORDE_SIN_COLOR = re.compile(r'^border(-[trblxy])?(-\d)?$')
BORDE_NO_COLOR = re.compile(r'^border(-[trblxy])?-(\d|dashed|solid|dotted|none|double|hidden|collapse|separate)')

CAMPO = 'min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60'
QUITAR_CAMPO = re.compile(r'^(px|py|p|pt|pb)-|^rounded|^border|^text-(xs|sm|base|lg|xl|\[\d+px\])$|^bg-|^focus:|^focus-visible:|^outline|^ring|^shadow|^placeholder|^transition|^text-simar|^text-white|^font-(medium|normal|semibold)$|^hover:border|^hover:bg|^duration')


def bordes_con_color(txt):
    toks = txt.split()
    tiene_borde = any(BORDE_SIN_COLOR.match(t) for t in toks)
    if not tiene_borde:
        return txt
    con_color = any(t.startswith('border-') and not BORDE_NO_COLOR.match(t) and not BORDE_SIN_COLOR.match(t) for t in toks)
    if con_color:
        return txt
    return txt.rstrip() + ' border-simar-borde' + (' ' if txt.endswith(' ') else '')


def campo(txt):
    toks = txt.split()
    quedan = []
    lados = ''
    for t in toks:
        if re.match(r'^(pl|pr)-(\d+|\[.+\])$', t):
            v = t.split('-', 1)[1]
            try:
                grande = v.startswith('[') or float(v) >= 8
            except ValueError:
                grande = True
            if grande:
                quedan.append(t); lados += t[:2]; continue
            continue
        if QUITAR_CAMPO.match(t) or t in CAMPO.split() or t.startswith('min-h-') or t == 'disabled:opacity-60':
            continue
        quedan.append(t)
    extra = CAMPO
    if 'pl' not in lados and 'pr' not in lados:
        extra = 'px-4 ' + extra
    elif 'pl' not in lados:
        extra = 'pl-4 ' + extra
    elif 'pr' not in lados:
        extra = 'pr-4 ' + extra
    return ' '.join(quedan + extra.split())


def etiqueta(txt):
    toks = txt.split()
    if not ('block' in toks or any(t.startswith('mb-') for t in toks)):
        return txt
    out = []
    for t in toks:
        if re.match(r'^text-(xs|sm|base|\[1[0-6]px\])$', t): t = 'text-[17px]'
        elif t in ('font-medium', 'font-semibold', 'font-normal'): t = 'font-bold'
        elif t in ('mb-1', 'mb-1.5', 'mb-0.5'): t = 'mb-2'
        elif t in ('text-simar-texto-2', 'text-simar-texto-3'): t = 'text-simar-texto'
        out.append(t)
    if not any(t.startswith('text-[') or t.startswith('text-lg') for t in out): out.append('text-[17px]')
    if 'font-bold' not in out and 'font-extrabold' not in out: out.append('font-bold')
    if not any(t.startswith('text-simar') or t.startswith('text-white') for t in out): out.append('text-simar-texto')
    vistos, fin = set(), []
    for t in out:
        if t not in vistos: vistos.add(t); fin.append(t)
    return ' '.join(fin)


def boton(txt):
    toks = txt.split()
    if any(t.startswith('min-h-') or t.startswith('h-') or t.startswith('w-') and t != 'w-full' for t in toks):
        return txt
    py = [t for t in toks if re.match(r'^py-(\d+(\.\d+)?)$', t)]
    p = [t for t in toks if re.match(r'^p-(\d+(\.\d+)?)$', t)]
    out = list(toks)
    if py:
        v = float(py[0].split('-')[1])
        out.append('min-h-[44px]' if v < 2 else 'min-h-[52px]')
    elif p and float(p[0].split('-')[1]) <= 2.5:
        out.append('min-w-[44px] min-h-[44px]')
        if not any(t in ('flex', 'inline-flex', 'grid', 'block') for t in toks):
            out.append('inline-flex items-center justify-center')
    else:
        return txt
    out = ['font-bold' if t in ('font-medium', 'font-semibold') else t for t in out]
    return ' '.join(out)


def estructura(src):
    cambios = 0

    def sub_tag(m):
        nonlocal cambios
        tag, antes, q, cls = m.group(1), m.group(2), m.group(3), m.group(4)
        if tag in ('input', 'select', 'textarea'):
            if re.search(r'type=["\'](checkbox|radio|file|color|range|hidden)["\']', antes) or 'sr-only' in cls.split() or 'hidden' in cls.split():
                return m.group(0)
            if 'bg-transparent' in cls.split():
                return m.group(0)  # campo "desnudo" dentro de una caja con borde propio
            if any(t.startswith('min-h-') for t in cls.split()) and 'border-simar-campo-borde' in cls and 'border-2' in cls:
                return m.group(0)  # ya es un campo SiMAR (quizá con otra medida a propósito)
            nuevo = campo(cls)
        elif tag == 'label':
            nuevo = etiqueta(cls)
        elif tag == 'button':
            nuevo = boton(cls)
        else:
            return m.group(0)
        if nuevo != cls:
            cambios += 1
        return f'<{tag}{antes}className={q}{nuevo}{q}'

    src = re.sub(r'<(input|select|textarea|label|button)\b((?:(?!className=)(?:=>|[^>]))*?)className=(["\'])([^"\']*)\3', sub_tag, src, flags=re.S)

    def sub_borde(m):
        nonlocal cambios
        q, txt = m.group(1), m.group(2)
        if not es_lista_clases(txt):
            return m.group(0)
        nuevo = bordes_con_color(txt)
        if nuevo != txt: cambios += 1
        return q + nuevo + q
    src = re.sub(r'(["\'])((?:(?!\1)[^\\\n])*)\1', sub_borde, src)

    def sub_panel(m):
        nonlocal cambios
        q, txt = m.group(1), m.group(2)
        if not es_lista_clases(txt):
            return m.group(0)
        toks = txt.split()
        nuevo = toks
        # panel de ventana modal
        if 'shadow-2xl' in toks and any(t.startswith('bg-simar-superficie') for t in toks):
            nuevo = ['rounded-[28px]' if re.match(r'^rounded-(lg|xl|2xl|3xl)$', t) else t for t in nuevo]
            if 'simar-aparece' not in nuevo: nuevo = ['simar-aparece'] + nuevo
        # fondo de ventana modal: margen para que no toque los bordes en celular
        if 'fixed' in toks and 'inset-0' in toks and 'bg-[rgba(11,34,54,0.55)]' in toks and not any(re.match(r'^p-\d', t) for t in toks) and 'flex' in toks:
            nuevo = nuevo + ['p-4']
        # títulos: más peso
        if any(t in ('text-xl', 'text-2xl', 'text-3xl', 'sm:text-2xl', 'md:text-3xl', 'sm:text-3xl', 'md:text-4xl') for t in toks):
            nuevo = ['font-extrabold' if t in ('font-bold', 'font-semibold') else t for t in nuevo]
        r = ' '.join(nuevo)
        lead = ' ' if txt.startswith(' ') else ''
        trail = ' ' if txt.endswith(' ') else ''
        r = lead + r + trail
        if r != txt: cambios += 1
        return q + r + q
    src = re.sub(r'(["\'])((?:(?!\1)[^\\\n])*)\1', sub_panel, src)
    return src, cambios


CERRAR = 'w-[52px] h-[52px] flex-shrink-0 rounded-2xl bg-simar-papel text-simar-texto flex items-center justify-center hover:bg-simar-borde-suave transition-colors'


def botones_cerrar(src):
    """Botón de cerrar (una X en SVG) -> 52 px con aria-label."""
    cambios = 0
    patron = re.compile(r'<button\b((?:(?!className=)(?:=>|[^>]))*?)className=(["\'])([^"\']*)\2((?:=>|[^>])*)>(\s*)<svg className=(["\'])[^"\']*\6([^>]*)>(\s*)<path([^>]*)d="M6 18L18 6M6 6l12 12"', re.S)

    def sub(m):
        nonlocal cambios
        antes, q, cls, despues, esp1, q2, svgattrs, esp2, pathattrs = m.groups()
        if 'min-h-' in cls or 'w-[52px]' in cls:
            return m.group(0)
        aria = '' if 'aria-label' in antes + despues else ' aria-label="Cerrar"'
        cambios += 1
        return f'<button{aria}{antes}className={q}{CERRAR}{q}{despues}>{esp1}<svg className="w-6 h-6"{svgattrs}>{esp2}<path{pathattrs}d="M6 18L18 6M6 6l12 12"'
    src = patron.sub(sub, src)
    return src, cambios


if __name__ == '__main__':
    for f in sys.argv[1:]:
        s = open(f, encoding='utf-8').read()
        n, c1 = procesar(s)
        n, c2 = estructura(n)
        n, c3 = botones_cerrar(n)
        open(f, 'w', encoding='utf-8').write(n)
        print(f'{c1:4d} color  {c2:4d} estructura  {c3:2d} cerrar  {f}')
