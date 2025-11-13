'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

type Locale = 'es' | 'en';

export default function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggleLocale = () => {
    const newLocale: Locale = currentLocale === 'es' ? 'en' : 'es';
    
    // Remove the current locale from the pathname
    const pathWithoutLocale = pathname.replace(/^\/(es|en)/, '');
    
    startTransition(() => {
      router.replace(`/${newLocale}${pathWithoutLocale}`);
    });
  };

  return (
    <button
      onClick={toggleLocale}
      disabled={isPending}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50"
      title={currentLocale === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish'}
    >
      {/* Globe Icon */}
      <svg
        className="w-5 h-5 text-gray-600 dark:text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      
      {/* Locale Initials */}
      <span className="font-semibold text-sm text-gray-700 dark:text-gray-200 uppercase">
        {currentLocale}
      </span>
    </button>
  );
}
