import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  images: {
    // Desde Next 16 sólo se acepta la calidad de esta lista (si no, se usa la más cercana): 60 es la
    // de las fotos grandes de fondo de la landing, que van detrás de un velo y no necesitan más
    qualities: [60, 75],
  },
};

export default withNextIntl(nextConfig);
