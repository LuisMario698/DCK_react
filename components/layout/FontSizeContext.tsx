'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type FontSize = 'pequeño' | 'normal' | 'grande';

const ROOT_SIZES: Record<FontSize, string> = {
    pequeño: '13px',
    normal:  '15px',
    grande:  '17px',
};

const LS_KEY = 'dck_font_size';

interface FontSizeContextValue {
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextValue>({
    fontSize: 'normal',
    setFontSize: () => {},
});

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
    const [fontSize, setFontSizeState] = useState<FontSize>('normal');

    useEffect(() => {
        const saved = localStorage.getItem(LS_KEY) as FontSize | null;
        if (saved && saved in ROOT_SIZES) {
            setFontSizeState(saved);
            document.documentElement.style.fontSize = ROOT_SIZES[saved];
        }
    }, []);

    const setFontSize = (size: FontSize) => {
        setFontSizeState(size);
        localStorage.setItem(LS_KEY, size);
        document.documentElement.style.fontSize = ROOT_SIZES[size];
    };

    return (
        <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
            {children}
        </FontSizeContext.Provider>
    );
}

export function useFontSize() {
    return useContext(FontSizeContext);
}
