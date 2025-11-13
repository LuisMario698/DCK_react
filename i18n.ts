import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['es', 'en'] as const;
export const defaultLocale = 'es' as const;

export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;
 
  // Ensure that a locale is set
  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
