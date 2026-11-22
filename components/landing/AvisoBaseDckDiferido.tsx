'use client';

import dynamic from 'next/dynamic';

/**
 * El aviso de la base de DCK en su propio pedazo de código: sólo baja cuando el superadmin eligió esa
 * base. Tiene que cargarse desde un componente de cliente: con `next/dynamic` en la página (de
 * servidor) Next igual lo mandaba junto con la landing.
 */
export const AvisoBaseDck = dynamic(() => import('./AvisoBaseDck').then((m) => m.AvisoBaseDck));
