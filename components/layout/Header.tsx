import { LogoSimar } from './LogoSimar';
import { BotonTemaIcono } from './ThemeToggle';

/**
 * Barra superior sólo en celular y tableta, en vidrio flotante: el logo y el botón de tema.
 * El menú se abre desde la barra inferior ("Menú"), al alcance del pulgar.
 */
export function Header() {
  return (
    <header className="lg:hidden sticky top-3 z-30 mx-4 mt-3 md:mx-6 min-h-[68px] rounded-3xl simar-vidrio flex items-center justify-between gap-3 pl-4 pr-2">
      <LogoSimar tamano={42} />
      <BotonTemaIcono compacto />
    </header>
  );
}
