'use client';

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

export interface SignaturePadRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
}

interface SignaturePadProps {
  onSave?: (signature: string) => void;
  label?: string;
  height?: number;
  responsive?: boolean;
}

/**
 * Componente de Firma Electrónica
 * Diseñado para ser fácil de usar en dispositivos táctiles
 */
const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({ 
  onSave, 
  label = "Firma",
  height = 200,
  responsive = false
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Exponer métodos al componente padre
  useImperativeHandle(ref, () => ({
    clear: () => {
      clearCanvas();
    },
    isEmpty: () => !hasSignature,
    toDataURL: () => {
      return canvasRef.current?.toDataURL('image/png') || '';
    }
  }));

  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  // Obtener coordenadas correctas para mouse y touch
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  // Iniciar dibujo
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  // Dibujar
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  // Terminar dibujo
  const stopDrawing = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    ctx.closePath();
    setIsDrawing(false);
  };

  // Limpiar canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Guardar firma
  const handleSave = () => {
    if (canvasRef.current && hasSignature && onSave) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-lg font-semibold text-gray-700 mb-3">
        {label}
      </label>
      
      <div className="relative border-2 border-gray-300 rounded-xl overflow-hidden bg-white">
        {/* Línea de firma */}
        <div 
          className="absolute bottom-12 left-4 right-4 border-b-2 border-dashed border-gray-300 pointer-events-none"
        />
        
        {/* Texto indicativo */}
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-500 text-base">Firme aquí con el dedo o mouse</p>
          </div>
        )}
        
        {/* Canvas */}
        <canvas 
          ref={canvasRef}
          width={600}
          height={responsive ? 300 : height}
          className={`w-full cursor-crosshair touch-none ${responsive ? 'h-full' : ''}`}
          style={responsive ? undefined : { height: `${height}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      
      {/* Botones pequeños */}
      <div className="flex gap-2 mt-2">
        <button 
          type="button"
          onClick={clearCanvas}
          className="flex-1 py-1.5 px-3 bg-gray-100 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Limpiar
        </button>
        
        {onSave && (
          <button 
            type="button"
            onClick={handleSave}
            disabled={!hasSignature}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1 ${
              hasSignature 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            OK
          </button>
        )}
      </div>
    </div>
  );
});

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
