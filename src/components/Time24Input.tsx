import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

/**
 * Parses flexible user time input (e.g. "8:30", "08.30", "1430", "2:30 PM", "24:00")
 * into strict 24-hour "HH:mm" ("00:00"–"23:59"), or returns null if invalid.
 */
export function normalizeTime24(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/\s*น\.?$/i, '').trim();
  if (!cleaned) return null;

  // Handle 12-hour AM/PM if present in legacy values
  const ampmMatch = /^(\d{1,2})[:.](\d{2})\s*(am|pm)$/i.exec(cleaned);
  if (ampmMatch) {
    let h = Number(ampmMatch[1]);
    const m = Number(ampmMatch[2]);
    const period = ampmMatch[3].toLowerCase();
    if (h < 1 || h > 12 || m < 0 || m > 59) return null;
    if (period === 'am') {
      h = h === 12 ? 0 : h;
    } else {
      h = h === 12 ? 12 : h + 12;
    }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // Handle HH:mm or HH.mm (including 24:00 -> 00:00)
  const sepMatch = /^(\d{1,2})[:.](\d{1,2})$/.exec(cleaned);
  if (sepMatch) {
    const h = Number(sepMatch[1]);
    const m = Number(sepMatch[2]);
    if (h === 24 && m === 0) return '00:00';
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // Handle compact 4-digit HHmm (e.g. "0830", "1445", "2400")
  if (/^\d{4}$/.test(cleaned)) {
    const h = Number(cleaned.slice(0, 2));
    const m = Number(cleaned.slice(2, 4));
    if (h === 24 && m === 0) return '00:00';
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // Handle compact 3-digit Hmm (e.g. "830" -> "08:30")
  if (/^\d{3}$/.test(cleaned)) {
    const h = Number(cleaned.slice(0, 1));
    const m = Number(cleaned.slice(1, 3));
    if (h < 0 || h > 9 || m < 0 || m > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  return null;
}

/** Formats a stored time value into 24-hour HH:mm when recognizable, otherwise returns trimmed text */
export function formatTime24(raw: string | undefined | null): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';
  return normalizeTime24(trimmed) ?? trimmed;
}

function getCurrentTime24(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export interface Time24InputProps {
  value: string;
  onChange: (nextTime24: string) => void;
  id?: string;
  ariaLabel?: string;
  title?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
  allowClear?: boolean;
}

/**
 * 24-hour time input ("00:00"–"23:59") that always displays and picks 24-hour time
 * regardless of browser or OS locale (replacing native <input type="time"> AM/PM).
 */
export function Time24Input({
  value,
  onChange,
  id,
  ariaLabel,
  title,
  placeholder = 'HH:mm',
  disabled = false,
  className = '',
  wrapperClassName = '',
  allowClear = true,
}: Time24InputProps) {
  const normalizedProp = formatTime24(value);
  const [text, setText] = useState<string>(normalizedProp);
  const [isOpen, setIsOpen] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setText(formatTime24(value));
    setIsInvalid(false);
  }, [value]);

  const parsedParts = (() => {
    const norm = normalizeTime24(value);
    if (!norm) return { hour: '', minute: '' };
    const [hour, minute] = norm.split(':');
    return { hour, minute };
  })();

  const updatePopoverPosition = () => {
    const anchor = wrapperRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const popWidth = 204;
    const popHeight = 256;
    const margin = 8;

    let left = rect.left;
    if (left + popWidth > window.innerWidth - margin) {
      left = Math.max(margin, rect.right - popWidth);
    }
    if (left < margin) left = margin;

    const spaceBelow = window.innerHeight - rect.bottom;
    let top = rect.bottom + 4;
    if (spaceBelow < popHeight && rect.top > popHeight) {
      top = Math.max(margin, rect.top - popHeight - 4);
    } else if (top + popHeight > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - popHeight - margin);
    }

    setPopoverPos({ top, left });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePopoverPosition();
    const handleReposition = () => updatePopoverPosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    // Scroll active hour and minute buttons into view smoothly when opening
    const timer = window.setTimeout(() => {
      const activeHourEl = hourListRef.current?.querySelector<HTMLElement>('[data-active="true"]');
      activeHourEl?.scrollIntoView({ block: 'center' });
      const activeMinEl = minuteListRef.current?.querySelector<HTMLElement>('[data-active="true"]');
      activeMinEl?.scrollIntoView({ block: 'center' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (wrapperRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  const commitTypedValue = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setIsInvalid(false);
      setText('');
      if (value !== '') onChange('');
      return;
    }
    const normalized = normalizeTime24(trimmed);
    if (normalized === null) {
      setIsInvalid(false);
      setText(formatTime24(value));
      return;
    }
    setIsInvalid(false);
    setText(normalized);
    if (normalized !== value) {
      onChange(normalized);
    }
  };

  const handleSelectHour = (h: string) => {
    const nextMin = parsedParts.minute || '00';
    const nextVal = `${h}:${nextMin}`;
    setText(nextVal);
    setIsInvalid(false);
    onChange(nextVal);
  };

  const handleSelectMinute = (m: string) => {
    const nextHour = parsedParts.hour || getCurrentTime24().split(':')[0];
    const nextVal = `${nextHour}:${m}`;
    setText(nextVal);
    setIsInvalid(false);
    onChange(nextVal);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative inline-flex items-center ${wrapperClassName}`}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        maxLength={5}
        data-time24-input="true"
        aria-label={ariaLabel}
        title={title || 'กรอกเวลาแบบ 24 ชั่วโมง (เช่น 08:30, 14:00) หรือคลิกเลือกเวลา'}
        placeholder={placeholder}
        disabled={disabled}
        value={text}
        onChange={(e) => {
          const rawNext = e.target.value;
          setText(rawNext);
          const trimmed = rawNext.trim();
          if (!trimmed) {
            setIsInvalid(false);
            if (value !== '') onChange('');
            return;
          }
          // Auto-commit immediately when user finishes HH:mm, HH.mm, or 4-digit HHmm
          if (/^\d{1,2}[:.]\d{2}$/.test(trimmed) || /^\d{4}$/.test(trimmed)) {
            const normalized = normalizeTime24(trimmed);
            if (normalized) {
              setIsInvalid(false);
              if (normalized !== value) onChange(normalized);
            } else {
              setIsInvalid(true);
            }
          } else {
            setIsInvalid(false);
          }
        }}
        onBlur={() => commitTypedValue(text)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitTypedValue(text);
            setIsOpen(false);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          } else if (e.key === 'Tab') {
            commitTypedValue(text);
            setIsOpen(false);
          } else if (e.key === 'ArrowDown' && e.altKey) {
            e.preventDefault();
            if (!disabled) setIsOpen(true);
          }
        }}
        className={`${className} pr-7 ${isInvalid ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : ''}`}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        aria-label={ariaLabel ? `เลือกเวลา 24 ชั่วโมง ${ariaLabel}` : 'เลือกเวลา 24 ชั่วโมง'}
        title="เลือกเวลาแบบ 24 ชั่วโมง (00:00–23:59)"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-blue-800 rounded disabled:opacity-40"
      >
        <Clock className="w-3.5 h-3.5" />
      </button>

      {isOpen &&
        popoverPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: popoverPos.top,
              left: popoverPos.left,
              width: 204,
            }}
            className="no-print z-[120] bg-white border border-slate-300 rounded-xl shadow-xl p-2 select-none"
          >
            <div className="flex items-center justify-between px-1 pb-1.5 mb-1.5 border-b border-slate-200">
              <span className="text-[11px] font-semibold text-slate-700">เวลา (24 ชม.)</span>
              <span className="text-xs font-mono font-bold text-blue-900 tabular-nums">
                {parsedParts.hour || '--'}:{parsedParts.minute || '--'} น.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {/* Hours 00–23 */}
              <div className="flex flex-col">
                <div className="text-[10px] font-semibold text-slate-500 text-center pb-1">
                  ชั่วโมง
                </div>
                <div
                  ref={hourListRef}
                  className="h-40 overflow-y-auto border border-slate-200 rounded-md p-0.5 space-y-0.5"
                >
                  {HOURS_24.map((h) => {
                    const active = parsedParts.hour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        data-active={active ? 'true' : undefined}
                        onClick={() => handleSelectHour(h)}
                        className={`w-full py-1 rounded text-xs font-mono tabular-nums transition-colors ${
                          active
                            ? 'bg-blue-800 text-white font-bold'
                            : 'text-slate-700 hover:bg-blue-50'
                        }`}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minutes 00–59 */}
              <div className="flex flex-col">
                <div className="text-[10px] font-semibold text-slate-500 text-center pb-1">
                  นาที
                </div>
                <div
                  ref={minuteListRef}
                  className="h-40 overflow-y-auto border border-slate-200 rounded-md p-0.5 space-y-0.5"
                >
                  {MINUTES_60.map((m) => {
                    const active = parsedParts.minute === m;
                    const isQuarter = m === '00' || m === '15' || m === '30' || m === '45';
                    return (
                      <button
                        key={m}
                        type="button"
                        data-active={active ? 'true' : undefined}
                        onClick={() => handleSelectMinute(m)}
                        className={`w-full py-1 rounded text-xs font-mono tabular-nums transition-colors ${
                          active
                            ? 'bg-blue-800 text-white font-bold'
                            : isQuarter
                            ? 'text-slate-900 font-semibold hover:bg-blue-50'
                            : 'text-slate-600 hover:bg-blue-50'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-1.5 mt-2 pt-1.5 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  const now = getCurrentTime24();
                  setText(now);
                  setIsInvalid(false);
                  onChange(now);
                  setIsOpen(false);
                }}
                className="px-2 py-1 font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md"
              >
                ตอนนี้ ({getCurrentTime24()})
              </button>
              <div className="flex items-center gap-1">
                {allowClear && normalizedProp && (
                  <button
                    type="button"
                    onClick={() => {
                      setText('');
                      setIsInvalid(false);
                      onChange('');
                      setIsOpen(false);
                    }}
                    className="px-2 py-1 font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                  >
                    ล้าง
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100 rounded-md"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
