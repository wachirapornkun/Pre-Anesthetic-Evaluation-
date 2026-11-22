import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  formatThaiDateBE,
  getTodayIsoDate,
  parseThaiInputToIsoDate,
} from '../types/evaluation';

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const THAI_WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function parseIsoParts(iso: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso || '').trim());
  if (!m) return null;
  const rawY = Number(m[1]);
  const year = rawY > 2400 ? rawY - 543 : rawY;
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function toIsoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export interface ThaiDateInputProps {
  value: string;
  onChange: (nextIsoDate: string) => void;
  id?: string;
  ariaLabel?: string;
  title?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
  allowClear?: boolean;
}

/**
 * Date input that displays and lets users pick/type dates in Thai Buddhist Era (พ.ศ., วว/ดด/ปปปป)
 * while storing standard ISO YYYY-MM-DD (ค.ศ.) internally for sorting and database compatibility.
 */
export function ThaiDateInput({
  value,
  onChange,
  id,
  ariaLabel,
  title,
  placeholder = 'วว/ดด/ปปปป (พ.ศ.)',
  required = false,
  disabled = false,
  className = '',
  wrapperClassName = '',
  allowClear = true,
}: ThaiDateInputProps) {
  const [text, setText] = useState<string>(() => formatThaiDateBE(value));
  const [isOpen, setIsOpen] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  const todayIso = getTodayIsoDate();
  const initialParts = parseIsoParts(value) || parseIsoParts(todayIso)!;
  const [viewYear, setViewYear] = useState<number>(initialParts.year);
  const [viewMonth, setViewMonth] = useState<number>(initialParts.month);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  // Sync displayed BE text whenever external ISO value changes
  useEffect(() => {
    setText(formatThaiDateBE(value));
    setIsInvalid(false);
    const parsed = parseIsoParts(value);
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [value]);

  const updatePopoverPosition = () => {
    const anchor = wrapperRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const popWidth = 276;
    const popHeight = 312;
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
      if (value !== '') onChange('');
      setText('');
      return;
    }
    const parsedIso = parseThaiInputToIsoDate(trimmed);
    if (parsedIso === null) {
      // Revert to last valid formatted date if invalid
      setIsInvalid(false);
      setText(formatThaiDateBE(value));
      return;
    }
    setIsInvalid(false);
    setText(formatThaiDateBE(parsedIso));
    if (parsedIso !== value) {
      onChange(parsedIso);
    }
    const parts = parseIsoParts(parsedIso);
    if (parts) {
      setViewYear(parts.year);
      setViewMonth(parts.month);
    }
  };

  const handleSelectIso = (iso: string) => {
    onChange(iso);
    setText(formatThaiDateBE(iso));
    setIsInvalid(false);
    const parts = parseIsoParts(iso);
    if (parts) {
      setViewYear(parts.year);
      setViewMonth(parts.month);
    }
    setIsOpen(false);
  };

  const calendarCells = useMemo(() => {
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{
      iso: string;
      day: number;
      inCurrentMonth: boolean;
    }> = [];

    for (let i = firstDow - 1; i >= 0; i -= 1) {
      const d = prevMonthDays - i;
      const py = viewMonth === 0 ? viewYear - 1 : viewYear;
      const pm = viewMonth === 0 ? 11 : viewMonth - 1;
      cells.push({ iso: toIsoDate(py, pm, d), day: d, inCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push({ iso: toIsoDate(viewYear, viewMonth, d), day: d, inCurrentMonth: true });
    }

    let nextDay = 1;
    const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nm = viewMonth === 11 ? 0 : viewMonth + 1;
    while (cells.length % 7 !== 0 || cells.length < 35) {
      cells.push({ iso: toIsoDate(ny, nm, nextDay), day: nextDay, inCurrentMonth: false });
      nextDay += 1;
    }

    return cells;
  }, [viewYear, viewMonth]);

  const yearOptions = useMemo(() => {
    const center = viewYear;
    const minY = Math.min(center - 15, new Date().getFullYear() - 15);
    const maxY = Math.max(center + 10, new Date().getFullYear() + 10);
    const years: number[] = [];
    for (let y = minY; y <= maxY; y += 1) {
      years.push(y);
    }
    return years;
  }, [viewYear]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const openCalendar = () => {
    if (disabled) return;
    const parts = parseIsoParts(value) || parseIsoParts(getTodayIsoDate())!;
    setViewYear(parts.year);
    setViewMonth(parts.month);
    setIsOpen(true);
  };

  const normalizedValue = useMemo(() => {
    const parts = parseIsoParts(value);
    return parts ? toIsoDate(parts.year, parts.month, parts.day) : '';
  }, [value]);

  return (
    <div ref={wrapperRef} className={`relative inline-flex items-center ${wrapperClassName}`}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        data-thai-date-input="true"
        aria-label={ariaLabel}
        title={title || 'กรอกวันที่ พ.ศ. (วว/ดด/ปปปป) หรือคลิกปฏิทิน'}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        value={text}
        onChange={(e) => {
          const nextText = e.target.value;
          setText(nextText);
          const trimmed = nextText.trim();
          if (!trimmed) {
            setIsInvalid(false);
            if (value !== '') onChange('');
            return;
          }
          // Auto-commit cleanly once user completes full DD/MM/YYYY (e.g. 21/11/2569)
          if (/^\d{1,2}[/.-]\d{1,2}[/.-]\d{4}$/.test(trimmed)) {
            const parsed = parseThaiInputToIsoDate(trimmed);
            if (parsed) {
              setIsInvalid(false);
              if (parsed !== value) onChange(parsed);
              const parts = parseIsoParts(parsed);
              if (parts) {
                setViewYear(parts.year);
                setViewMonth(parts.month);
              }
            } else {
              setIsInvalid(true);
            }
          } else {
            setIsInvalid(false);
          }
        }}
        onBlur={() => {
          commitTypedValue(text);
        }}
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
            openCalendar();
          }
        }}
        className={`${className} pr-7 ${isInvalid ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : ''}`}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            openCalendar();
          }
        }}
        aria-label={ariaLabel ? `เปิดปฏิทิน พ.ศ. ${ariaLabel}` : 'เปิดปฏิทิน พ.ศ.'}
        title="เลือกวันที่จากปฏิทิน พ.ศ."
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-blue-800 rounded disabled:opacity-40"
      >
        <Calendar className="w-3.5 h-3.5" />
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
              width: 276,
            }}
            className="no-print z-[120] bg-white border border-slate-300 rounded-xl shadow-xl p-2.5 select-none"
          >
            {/* Header: Month & BE Year selectors */}
            <div className="flex items-center justify-between gap-1 mb-2">
              <button
                type="button"
                onClick={goPrevMonth}
                aria-label="เดือนก่อนหน้า"
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 flex-1 justify-center">
                <select
                  aria-label="เลือกเดือน"
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-800"
                >
                  {THAI_MONTHS.map((label, idx) => (
                    <option key={label} value={idx}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="เลือกปี พ.ศ."
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs font-mono font-semibold text-blue-900 focus:outline-none focus:border-blue-800"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y + 543}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={goNextMonth}
                aria-label="เดือนถัดไป"
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {THAI_WEEKDAYS.map((wd, idx) => (
                <div
                  key={wd}
                  className={`text-center text-[11px] font-semibold py-0.5 ${
                    idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-700' : 'text-slate-500'
                  }`}
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarCells.map((cell) => {
                const isSelected = normalizedValue === cell.iso;
                const isToday = todayIso === cell.iso;
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => handleSelectIso(cell.iso)}
                    className={`h-8 rounded-md text-xs font-mono tabular-nums transition-colors ${
                      isSelected
                        ? 'bg-blue-800 text-white font-bold shadow-xs'
                        : isToday
                        ? 'bg-blue-50 text-blue-900 font-bold border border-blue-400 hover:bg-blue-100'
                        : cell.inCurrentMonth
                        ? 'text-slate-800 hover:bg-slate-100'
                        : 'text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => handleSelectIso(getTodayIsoDate())}
                className="px-2 py-1 font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md"
              >
                วันนี้ ({formatThaiDateBE(getTodayIsoDate())})
              </button>
              {allowClear && normalizedValue && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setText('');
                    setIsOpen(false);
                  }}
                  className="px-2 py-1 font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                >
                  ล้าง
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
