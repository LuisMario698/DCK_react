"""
Verifica que un rediseño no cambió la lógica: compara los manejadores (onClick, onChange, ref…)
de cada archivo contra la rama de referencia. Deben salir "iguales".

Uso:
    python3 scripts/comparar-manejadores.py archivo.tsx [...]
    REF=origin/main python3 scripts/comparar-manejadores.py archivo.tsx   # otra rama de referencia
"""
import os
import re,subprocess,collections,sys
def handlers(src):
    return collections.Counter(re.sub(r'\s+',' ',m) for m in re.findall(r'\b(on[A-Z]\w*|ref)=\{((?:[^{}]|\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*)\}', src) for m in [m[0]+'='+m[1]])
todo_ok=True
for F in sys.argv[1:]:
    try: old=subprocess.check_output(['git','show',f"{os.environ.get('REF', 'origin/online')}:{F}"],stderr=subprocess.DEVNULL).decode()
    except subprocess.CalledProcessError: print('NUEVO', F); continue
    new=open(F,encoding='utf-8').read()
    a,b=handlers(old),handlers(new)
    if a==b: print(f'iguales {sum(a.values()):4d}  {F}')
    else:
        todo_ok=False
        print(f'DIFERENTES {F}')
        for k,v in (a-b).items(): print('   falta :', k[:160])
        for k,v in (b-a).items(): print('   sobra :', k[:160])
