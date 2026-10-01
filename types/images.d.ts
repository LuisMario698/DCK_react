declare module '*.png' {
    const content: import('next/dist/shared/lib/image-external').StaticImageData;
    export default content;
}

declare module '*.jpg' {
    const content: import('next/dist/shared/lib/image-external').StaticImageData;
    export default content;
}

declare module '*.svg' {
    // Igual que la declaración de Next para *.svg (si difiere, TypeScript marca conflicto)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any;
    export default content;
}
