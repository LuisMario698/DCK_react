import React from 'react';

// ComponentProps (y no ButtonHTMLAttributes) para aceptar `ref`, que en React 19 llega como prop
interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  // Lenguaje de diseño SiMAR (DISEÑO_SIMAR.md → Botones): alto mínimo 44/52/60 px, letra ≥ 15 px
  const baseStyles = 'simar-presiona font-bold rounded-2xl inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'min-h-[44px] px-4 text-[15px]',
    md: 'min-h-[52px] px-5 text-[17px]',
    lg: 'min-h-[60px] px-7 text-[19px]',
  };

  const variantStyles = {
    primary: 'bg-simar-marea text-white hover:bg-simar-marea-hover',
    secondary: 'bg-simar-superficie text-simar-texto border-2 border-simar-campo-borde hover:border-simar-marea-tinta',
    // Coral sólido (6.3:1 con blanco), igual en oscuro, donde el token coral es claro
    danger: 'bg-simar-coral-solido text-white hover:bg-simar-coral-solido-hover',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

