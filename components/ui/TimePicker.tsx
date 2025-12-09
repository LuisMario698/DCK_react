'use client';

import { useState, useRef, useEffect } from 'react';

interface TimePickerProps {
  value: string; // formato "HH:MM"
  onChange: (time: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
}

export function TimePicker({
  value,
  onChange,
  onFocus,
  onBlur,
  className = '',
  placeholder = 'HH:MM',
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parsear el valor actual
  const [selectedHour, setSelectedHour] = useState<number>(() => {
    if (value) {
      const [h] = value.split(':');
      return parseInt(h, 10) || 0;
    }
    return new Date().getHours();
  });

  const [selectedMinute, setSelectedMinute] = useState<number>(() => {
    if (value) {
      const [, m] = value.split(':');
      return parseInt(m, 10) || 0;
    }
    return new Date().getMinutes();
  });

  // Sincronizar cuando cambia el value externo
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setSelectedHour(parseInt(h, 10) || 0);
      setSelectedMinute(parseInt(m, 10) || 0);
    }
  }, [value]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onBlur?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onBlur]);

  const handleOpen = () => {
    setIsOpen(true);
    onFocus?.();
  };

  const handleHourChange = (hour: number) => {
    setSelectedHour(hour);
    const newTime = `${String(hour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    onChange(newTime);
  };

  const handleMinuteChange = (minute: number) => {
    setSelectedMinute(minute);
    const newTime = `${String(selectedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onChange(newTime);
  };

  const setCurrentTime = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    setSelectedHour(hour);
    setSelectedMinute(minute);
    const newTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onChange(newTime);
  };

  // Generar arrays de horas y minutos
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const displayValue = value || placeholder;

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Input display */}
      <div
        onClick={handleOpen}
        className={`w-full px-3 py-2 cursor-pointer ${className}`}
      >
        {displayValue}
      </div>

      {/* Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 timepicker-popup">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden" style={{ minWidth: '240px' }}>
            {/* Header con selectores grandes */}
            <div className="flex items-center justify-center gap-3 p-5 bg-white dark:bg-gray-800">
              {/* Selector de Hora */}
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Hora</span>
                <select
                  value={selectedHour}
                  onChange={(e) => handleHourChange(parseInt(e.target.value, 10))}
                  className="timepicker-select-large"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-3xl font-bold text-gray-400 dark:text-gray-500 mt-5">:</span>

              {/* Selector de Minutos */}
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Minutos</span>
                <select
                  value={selectedMinute}
                  onChange={(e) => handleMinuteChange(parseInt(e.target.value, 10))}
                  className="timepicker-select-large"
                >
                  {minutes.map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botón Ahora */}
            <button
              type="button"
              onClick={setCurrentTime}
              className="w-full py-3 text-blue-500 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-t border-gray-100 dark:border-gray-700"
            >
              Ahora
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
