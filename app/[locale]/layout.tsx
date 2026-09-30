import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import { ThemeProvider } from '@/components/layout/ThemeContext';
import { AuthProvider } from "@/components/layout/AuthProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Avisos } from "@/components/layout/Avisos";

// Tipografía única de SiMAR (Braille Institute, pensada para baja visión). Ver DISEÑO_SIMAR.md.
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin", "latin-ext"],
  variable: "--font-atkinson",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "SiMAR — Sistema Integral de Manejo Ambiental de Residuos",
  description:
    "Gestión digital de manifiestos de residuos de embarcaciones pesqueras en Puerto Peñasco, Sonora. Formato MARPOL Anexo V.",
  // Instalada desde Safari (Agregar a inicio) abre como app, sin la barra del navegador.
  // El resto de la PWA está en app/manifest.ts
  appleWebApp: {
    capable: true,
    title: "SiMAR",
    statusBarStyle: "default",
  },
};

// Color de la barra del navegador en celular: papel en claro, abismo en oscuro
export const viewport: Viewport = {
  // cover: la página llega hasta los bordes y la barra inferior respeta la zona segura (env(safe-area-inset-*))
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E9E4D9" },
    { media: "(prefers-color-scheme: dark)", color: "#081624" },
  ],
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }
  const messages = await getMessages();

  return (
    <html lang={locale} className={atkinson.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="simar antialiased bg-simar-papel text-simar-texto" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <NextIntlClientProvider messages={messages}>
              {children}
              <ThemeToggle />
              <Avisos />
            </NextIntlClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
