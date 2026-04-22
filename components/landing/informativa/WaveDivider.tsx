'use client';

export function WaveDivider({
  fromColor = '#0a1628',
  toColor = '#0a1628',
  flip = false,
}: {
  fromColor?: string;
  toColor?: string;
  flip?: boolean;
}) {
  return (
    <div className="relative w-full h-24 md:h-32 overflow-hidden pointer-events-none" style={{ background: fromColor }} aria-hidden>
      <div className={`absolute inset-x-0 ${flip ? 'top-0' : 'bottom-0'} h-full`} style={{ transform: flip ? 'scaleY(-1)' : 'none' }}>
        {/* Capa 1 - onda lenta */}
        <svg className="absolute inset-x-0 bottom-0 w-[200%] h-full animate-wave-slide-slow" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`wave-grad-1-${fromColor}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(34,211,238,0.10)" />
              <stop offset="100%" stopColor={toColor} />
            </linearGradient>
          </defs>
          <path
            d="M0,80 C180,40 360,120 540,80 C720,40 900,120 1080,80 C1260,40 1440,100 1440,100 L1440,120 L0,120 Z
               M1440,80 C1620,40 1800,120 1980,80 C2160,40 2340,120 2520,80 C2700,40 2880,100 2880,100 L2880,120 L1440,120 Z"
            fill={`url(#wave-grad-1-${fromColor})`}
          />
        </svg>
        {/* Capa 2 - onda media */}
        <svg className="absolute inset-x-0 bottom-0 w-[200%] h-full animate-wave-slide" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path
            d="M0,90 C240,60 480,110 720,90 C960,70 1200,110 1440,90 L1440,120 L0,120 Z
               M1440,90 C1680,60 1920,110 2160,90 C2400,70 2640,110 2880,90 L2880,120 L1440,120 Z"
            fill="rgba(45,212,191,0.08)"
          />
        </svg>
        {/* Capa 3 - onda rápida + color destino */}
        <svg className="absolute inset-x-0 bottom-0 w-[200%] h-full animate-wave-slide-reverse" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path
            d="M0,100 C200,80 400,120 600,100 C800,85 1000,115 1200,100 C1320,92 1440,105 1440,105 L1440,120 L0,120 Z
               M1440,100 C1640,80 1840,120 2040,100 C2240,85 2440,115 2640,100 C2760,92 2880,105 2880,105 L2880,120 L1440,120 Z"
            fill={toColor}
          />
        </svg>
      </div>
    </div>
  );
}
