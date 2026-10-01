/**
 * Títulos de la pestaña del navegador. Lo usan los metadatos de app/[locale]/layout.tsx (servidor) y
 * useTituloPestana (cliente), por eso vive en un archivo sin 'use client'.
 */
export const TITULO_APP = 'SiMAR — Sistema Integral de Manejo Ambiental de Residuos';

/** "Manifiesto · SiMAR": el nombre de la pantalla primero, que es lo que se ve en una pestaña angosta */
export const tituloPantalla = (pantalla: string) => `${pantalla} · SiMAR`;
