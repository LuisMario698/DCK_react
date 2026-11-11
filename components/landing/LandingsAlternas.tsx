'use client';

import dynamic from 'next/dynamic';

/**
 * Las dos landings que no son la actual (?landing=nueva y ?landing=3d) y el aviso de la base de DCK,
 * cada una en su propio pedazo de código. Tienen que cargarse desde un componente de cliente: con
 * `next/dynamic` en la página (de servidor) Next igual las mandaba con la landing actual, y con ellas
 * Motion (≈ 235 KB en total que nadie veía). Así sólo bajan cuando se enseñan.
 */
export const LandingNueva = dynamic(() => import('./nueva/LandingNueva').then((m) => m.LandingNueva));
export const LandingTresD = dynamic(() => import('./tresd/LandingTresD').then((m) => m.LandingTresD));
export const AvisoBaseDck = dynamic(() => import('./AvisoBaseDck').then((m) => m.AvisoBaseDck));
