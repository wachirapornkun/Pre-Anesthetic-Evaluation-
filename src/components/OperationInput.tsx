import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ListFilter, Plus, X } from 'lucide-react';

export interface OperationPresetGroup {
  id: string;
  label: string;
  items: string[];
}

export const OPERATION_PRESET_GROUPS: OperationPresetGroup[] = [
  {
    id: 'surgery',
    label: 'ศัลยกรรม (Surgery)',
    items: [
      'Appendectomy',
      'Hernioplasty',
      'Explor lap',
      'EGD + Colonoscope',
      'DB',
      'Lap. cholecystectomy',
      'I&D',
      'EGD',
      'Colonoscope',
      'Hemorrhoidectomy',
      'Thyroidectomy',
      'Excision',
    ],
  },
  {
    id: 'obgyn',
    label: 'สูติ-นรีเวช (OB-GYN)',
    items: [
      'C/S',
      'C/S c TR',
      'TR',
      'Rt.Salpingectomy',
      'Lt.Salpingectomy',
      'TAH',
      'TAH with BSO',
      'Myomectomy',
      'F/C',
    ],
  },
  {
    id: 'ortho',
    label: 'ออร์โธปิดิกส์ (Ortho)',
    items: [
      'ORIF c P/S',
      'ORIF c PFNA',
      'ORIF c K-wire',
      'THA',
      'Bipolar hemiarthroplasty',
      'Arthrotomy',
      'Arthroscope',
      'Repair tendon',
      'TKR',
      'Close reduction',
      'Off implant',
    ],
  },
];

const CUSTOM_OPERATIONS_STORAGE_KEY = 'bph_custom_operation_presets_v1';

function loadCustomOperations(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_OPERATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === 'string')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 60);
  } catch {
    return [];
  }
}

function saveCustomOperations(list: string[]) {
  try {
    localStorage.setItem(CUSTOM_OPERATIONS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore storage quota error
  }
}

interface OperationInputProps {
  value: string;
  onChange: (nextValue: string) => void;
  label?: string;
  placeholder?: string;
  inputClassName?: string;
  labelClassName?: string;
  compact?: boolean;
}

export function OperationInput({
  value,
  onChange,
  label = 'Operation',
  placeholder = 'พิมพ์หรือเลือกหัตถการ เช่น Appendectomy, C/S, ORIF c PFNA...',
  inputClassName = 'w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800',
  labelClassName = 'text-xs font-medium text-slate-600',
  compact = false,
}: OperationInputProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [appendMode, setAppendMode] = useState(false);
  const [customOps, setCustomOps] = useState<string[]>(() => loadCustomOperations());
  const [newCustomOp, setNewCustomOp] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; groupLabel: string; isCustom?: boolean }[] = [];

    for (const grp of OPERATION_PRESET_GROUPS) {
      for (const item of grp.items) {
        const key = item.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({ name: item, groupLabel: grp.label });
      }
    }
    for (const item of customOps) {
      const key = item.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ name: item, groupLabel: 'อื่นๆ (บันทึกไว้)', isCustom: true });
    }
    return list;
  }, [customOps]);

  const filteredSuggestions = useMemo(() => {
    const rawQuery = value.trim().toLowerCase();
    // If user typed "A + B", filter based on the last segment after "+"
    const segments = rawQuery.split('+');
    const q = (segments[segments.length - 1] || '').trim();
    if (!q) return allSuggestions.slice(0, 18);

    const normalizedQ = q.replace(/^atrthro/, 'arthro');
    return allSuggestions
      .filter((item) => {
        const lower = item.name.toLowerCase();
        return lower.includes(q) || lower.includes(normalizedQ);
      })
      .slice(0, 14);
  }, [value, allSuggestions]);

  const applyOperation = (opName: string, forceAppend = false) => {
    const trimmedCurrent = value.trim();
    const shouldAppend = forceAppend || appendMode;

    if (shouldAppend && trimmedCurrent) {
      const existingParts = trimmedCurrent.split(/\s*\+\s*/).map((p) => p.toLowerCase());
      if (!existingParts.includes(opName.toLowerCase())) {
        onChange(`${trimmedCurrent} + ${opName}`);
      }
    } else if (trimmedCurrent.includes('+')) {
      // Replace only the segment currently being typed after the last "+"
      const parts = value.split('+');
      parts[parts.length - 1] = ` ${opName}`;
      onChange(parts.join('+').replace(/\s+\+\s+/g, ' + ').trim());
    } else {
      onChange(opName);
    }

    setIsDropdownOpen(false);
  };

  const applySidePrefix = (side: 'Rt.' | 'Lt.' | 'Bilat.') => {
    const trimmed = value.trim();
    if (!trimmed) {
      onChange(`${side} `);
      inputRef.current?.focus();
      return;
    }
    const stripped = trimmed.replace(/^(?:Rt\.|Lt\.|Bilat\.)\s*/i, '');
    onChange(`${side} ${stripped}`);
  };

  const handleAddCustomOperation = () => {
    const cleaned = newCustomOp.trim();
    if (!cleaned) return;
    const exists = allSuggestions.some((s) => s.name.toLowerCase() === cleaned.toLowerCase());
    if (!exists) {
      const next = [cleaned, ...customOps].slice(0, 60);
      setCustomOps(next);
      saveCustomOperations(next);
    }
    applyOperation(cleaned, false);
    setNewCustomOp('');
  };

  const handleRemoveCustomOperation = (name: string) => {
    const next = customOps.filter((item) => item !== name);
    setCustomOps(next);
    saveCustomOperations(next);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      {/* Label & Quick-Pick Toggle */}
      <div className="flex items-center justify-between gap-2">
        <span className={labelClassName}>{label}</span>
        <button
          type="button"
          onClick={() => {
            setIsPickerOpen((prev) => !prev);
            setIsDropdownOpen(false);
          }}
          className="no-print inline-flex items-center gap-1 text-[11px] font-medium text-blue-800 hover:text-blue-950 whitespace-nowrap"
        >
          <ListFilter className="w-3 h-3" />
          {isPickerOpen ? 'ซ่อนคำช่วย' : 'คำช่วยหัตถการ'}
        </button>
      </div>

      {/* Main Input with Clear & Dropdown Trigger */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onFocus={() => setIsDropdownOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsDropdownOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsDropdownOpen(false);
            }
          }}
          maxLength={300}
          placeholder={placeholder}
          className={`${inputClassName} pr-12`}
        />
        <div className="no-print absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                inputRef.current?.focus();
              }}
              aria-label="ล้างช่อง Operation"
              className="p-1 text-slate-400 hover:text-slate-700 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-label="เปิดรายการคำช่วย Operation"
            className="p-1 text-slate-400 hover:text-blue-800 rounded"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Live Autocomplete Dropdown */}
        {isDropdownOpen && (
          <div className="no-print absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>เลือกหัตถการ หรือพิมพ์ระบุเองได้ทันที</span>
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsPickerOpen(true);
                }}
                className="font-medium text-blue-800 hover:underline whitespace-nowrap"
              >
                ดูทั้งหมด
              </button>
            </div>

            {filteredSuggestions.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-slate-500 flex items-center justify-between gap-2">
                <span className="truncate">ใช้ข้อความที่พิมพ์: &ldquo;{value.trim()}&rdquo;</span>
                {value.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      const cleaned = value.trim();
                      const next = [cleaned, ...customOps].slice(0, 60);
                      setCustomOps(next);
                      saveCustomOperations(next);
                      setIsDropdownOpen(false);
                    }}
                    className="shrink-0 text-[11px] font-medium text-blue-800 hover:underline"
                  >
                    + บันทึกเป็นคำช่วย
                  </button>
                )}
              </div>
            ) : (
              <ul className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                {filteredSuggestions.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 hover:bg-blue-50/70 transition-colors"
                  >
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyOperation(item.name, false);
                      }}
                      className="flex-1 text-left text-xs font-medium text-slate-900 truncate"
                    >
                      {item.name}
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        {item.groupLabel.split(' ')[0]}
                      </span>
                      {value.trim() &&
                        value.trim().toLowerCase() !== item.name.toLowerCase() && (
                          <button
                            type="button"
                            title={`ต่อท้ายด้วย + ${item.name}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              applyOperation(item.name, true);
                            }}
                            className="px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                          >
                            + ต่อท้าย
                          </button>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Categorized Quick-Pick Helper Panel */}
      {isPickerOpen && (
        <div
          className={`no-print mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 ${
            compact ? 'text-[11px]' : 'text-xs'
          }`}
        >
          {/* Controls Strip: Side Prefixes + Replace/Append Mode */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">ข้าง:</span>
              {(['Rt.', 'Lt.', 'Bilat.'] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => applySidePrefix(side)}
                  className="px-2 py-0.5 text-[11px] font-medium bg-white border border-slate-300 rounded hover:border-blue-800 hover:text-blue-900 transition-colors"
                >
                  {side}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-md text-[11px]">
              <button
                type="button"
                onClick={() => setAppendMode(false)}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  !appendMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                เลือกแทนที่
              </button>
              <button
                type="button"
                onClick={() => setAppendMode(true)}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  appendMode ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                + ต่อท้ายหัตถการ
              </button>
            </div>
          </div>

          {/* Preset Groups */}
          <div className="space-y-2">
            {OPERATION_PRESET_GROUPS.map((group) => (
              <div key={group.id} className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-600">{group.label}</div>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((op) => {
                    const isActive = value
                      .split(/\s*\+\s*/)
                      .some((part) => part.trim().toLowerCase() === op.toLowerCase());
                    return (
                      <button
                        key={op}
                        type="button"
                        onClick={() => applyOperation(op)}
                        className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-colors ${
                          isActive
                            ? 'bg-blue-800 text-white border-blue-800'
                            : 'bg-white text-slate-800 border-slate-300 hover:border-blue-700 hover:bg-blue-50/50'
                        }`}
                      >
                        {op}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Custom / อื่นๆ */}
            <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
              <div className="text-[11px] font-semibold text-slate-600">อื่นๆ / เพิ่มคำช่วยเอง</div>
              {customOps.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {customOps.map((op) => {
                    const isActive = value
                      .split(/\s*\+\s*/)
                      .some((part) => part.trim().toLowerCase() === op.toLowerCase());
                    return (
                      <span
                        key={op}
                        className={`inline-flex items-center gap-1 rounded-md border text-[11px] ${
                          isActive
                            ? 'bg-blue-800 text-white border-blue-800'
                            : 'bg-white text-slate-800 border-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => applyOperation(op)}
                          className="pl-2 py-1 font-medium"
                        >
                          {op}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomOperation(op)}
                          aria-label={`ลบ ${op}`}
                          className={`pr-1.5 py-1 ${
                            isActive
                              ? 'text-blue-200 hover:text-white'
                              : 'text-slate-400 hover:text-red-600'
                          }`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                <input
                  type="text"
                  value={newCustomOp}
                  onChange={(e) => setNewCustomOp(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomOperation();
                    }
                  }}
                  placeholder="พิมพ์หัตถการอื่นๆ เพื่อเพิ่มเป็นคำช่วย..."
                  maxLength={120}
                  className="flex-1 min-w-[180px] bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
                />
                <button
                  type="button"
                  onClick={handleAddCustomOperation}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-blue-800 rounded-md hover:bg-blue-900 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มคำช่วย
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPickerOpen(false);
                    inputRef.current?.focus();
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 whitespace-nowrap"
                >
                  พิมพ์ระบุเอง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
