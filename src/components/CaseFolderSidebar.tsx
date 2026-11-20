import React, { useMemo, useState } from 'react';
import { Calendar, ChevronDown, ChevronRight, FilePlus2, FolderOpen, Plus, Search, X } from 'lucide-react';
import {
  compareByDateAndSurgeon,
  formatThaiScheduleDate,
  PreAnestheticEvaluation,
} from '../types/evaluation';

interface CaseFolderSidebarProps {
  records: PreAnestheticEvaluation[];
  activeId: string;
  surgeonOptions: string[];
  wardOptions: string[];
  onSelectRecord: (record: PreAnestheticEvaluation) => void;
  onCreateNew: () => void;
  onCreateNewForDate: (dateOfOperation: string, orRoom?: string, surgeon?: string) => void;
  onClose?: () => void;
}

export function CaseFolderSidebar({
  records,
  activeId,
  surgeonOptions,
  wardOptions,
  onSelectRecord,
  onCreateNew,
  onCreateNewForDate,
  onClose,
}: CaseFolderSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [surgeonFilter, setSurgeonFilter] = useState('ALL');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'draft' | 'evaluated'>('ALL');
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

  const availableSurgeons = useMemo(() => {
    const set = new Set<string>(surgeonOptions);
    records.forEach((r) => {
      if (r.surgeon?.trim()) set.add(r.surgeon.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [records, surgeonOptions]);

  const availableWards = useMemo(() => {
    const set = new Set<string>(wardOptions);
    records.forEach((r) => {
      if (r.ward?.trim()) set.add(r.ward.trim());
    });
    return Array.from(set);
  }, [records, wardOptions]);

  const groupedFolders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = records
      .filter((r) => {
        if (surgeonFilter !== 'ALL') {
          const s = (r.surgeon || '').trim() || '__NONE__';
          if (s !== surgeonFilter) return false;
        }
        if (wardFilter !== 'ALL' && (r.ward || '').trim() !== wardFilter) {
          return false;
        }
        if (statusFilter === 'draft' && r.status !== 'draft') return false;
        if (
          statusFilter === 'evaluated' &&
          r.status !== 'evaluated' &&
          r.status !== 'post_op_completed' &&
          r.status !== 'locked'
        ) {
          return false;
        }
        if (!q) return true;
        return (
          r.patientName.toLowerCase().includes(q) ||
          r.hn.toLowerCase().includes(q) ||
          r.an.toLowerCase().includes(q) ||
          (r.surgeon || '').toLowerCase().includes(q) ||
          (r.ward || '').toLowerCase().includes(q) ||
          r.operation.toLowerCase().includes(q) ||
          r.diagnosis.toLowerCase().includes(q) ||
          (r.dateOfOperation || '').includes(q)
        );
      })
      .sort((a, b) => compareByDateAndSurgeon(a, b, 'asc'));

    const dateGroups: {
      date: string;
      total: number;
      draftCount: number;
      surgeons: { surgeon: string; items: PreAnestheticEvaluation[] }[];
    }[] = [];
    const dateIdxMap = new Map<string, number>();

    for (const item of filtered) {
      const dateKey = (item.dateOfOperation || '').trim() || '__UNSPECIFIED__';
      let dIdx = dateIdxMap.get(dateKey);
      if (dIdx === undefined) {
        dIdx = dateGroups.length;
        dateIdxMap.set(dateKey, dIdx);
        dateGroups.push({ date: dateKey, total: 0, draftCount: 0, surgeons: [] });
      }
      const dGroup = dateGroups[dIdx];
      dGroup.total += 1;
      if (item.status === 'draft') dGroup.draftCount += 1;

      const surgKey = (item.surgeon || '').trim() || 'ยังไม่ระบุแพทย์ผ่าตัด';
      let sGroup = dGroup.surgeons.find((s) => s.surgeon === surgKey);
      if (!sGroup) {
        sGroup = { surgeon: surgKey, items: [] };
        dGroup.surgeons.push(sGroup);
      }
      sGroup.items.push(item);
    }

    return dateGroups;
  }, [records, searchQuery, surgeonFilter, wardFilter, statusFilter]);

  const toggleDateCollapse = (dateKey: string) => {
    setCollapsedDates((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const statusMeta = (status: PreAnestheticEvaluation['status']) => {
    switch (status) {
      case 'post_op_completed':
        return { label: 'Post-Op แล้ว', cls: 'text-emerald-700' };
      case 'evaluated':
        return { label: 'เยี่ยม Pre-Op แล้ว', cls: 'text-blue-800' };
      case 'locked':
        return { label: 'ปิดบันทึก', cls: 'text-slate-600' };
      default:
        return { label: 'รอเยี่ยมที่หอผู้ป่วย', cls: 'text-amber-700' };
    }
  };

  const totalFiltered = groupedFolders.reduce((sum, g) => sum + g.total, 0);
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    surgeonFilter !== 'ALL' ||
    wardFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  return (
    <aside
      aria-label="แฟ้มเก็บใบเยี่ยมเรียงตามวันที่และแพทย์ผ่าตัด"
      className="no-print bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-3.5 py-3 border-b border-slate-200 bg-slate-50/70 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <FolderOpen className="w-4 h-4 text-blue-800 shrink-0" />
            <h2 className="text-xs font-bold text-slate-900 truncate">
              แฟ้มเก็บใบเยี่ยม ({records.length})
            </h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-white bg-blue-800 rounded-md hover:bg-blue-900 transition-colors whitespace-nowrap"
            >
              <FilePlus2 className="w-3 h-3" />
              สร้างใบใหม่
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="ซ่อนแฟ้มเก็บใบเยี่ยม"
                title="ซ่อนแฟ้มเก็บใบเยี่ยม"
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-snug">
          เรียงตามวันผ่าตัดและแพทย์ผ่าตัด คลิกชื่อผู้ป่วยเพื่อเปิดฟอร์มเต็มกรอกต่อเมื่อไปเยี่ยม
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา ชื่อ, HN, แพทย์, หอผู้ป่วย..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="ล้างคำค้นหา"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Surgeon & Ward Filter */}
        <div className="grid grid-cols-2 gap-1.5">
          <select
            aria-label="กรองตามแพทย์ผ่าตัด"
            value={surgeonFilter}
            onChange={(e) => setSurgeonFilter(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] text-slate-800 focus:outline-none focus:border-blue-800"
          >
            <option value="ALL">ทุกแพทย์ผ่าตัด</option>
            {availableSurgeons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value="__NONE__">ยังไม่ระบุแพทย์</option>
          </select>

          <select
            aria-label="กรองตามหอผู้ป่วย"
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] text-slate-800 focus:outline-none focus:border-blue-800"
          >
            <option value="ALL">ทุกหอผู้ป่วย</option>
            {availableWards.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        {/* Status Segmented Filter */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-md">
          {(
            [
              { key: 'ALL', label: 'ทั้งหมด' },
              { key: 'draft', label: 'รอเยี่ยม' },
              { key: 'evaluated', label: 'เยี่ยมแล้ว' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`flex-1 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Folder Tree Body */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-290px)] divide-y divide-slate-200">
        {records.length === 0 ? (
          <div className="p-4 space-y-2.5 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">ยังไม่มีใบเยี่ยมที่บันทึกไว้</p>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-slate-600">
              <li>
                กด <strong>สร้างใบใหม่</strong> แล้วเลือก<strong>วันที่ผ่าตัด</strong>และ<strong>แพทย์ผ่าตัด</strong>
              </li>
              <li>
                กรอกข้อมูลบางส่วนในฟอร์มเต็ม แล้วกดปุ่ม <strong>บันทึกข้อมูล</strong> ด้านบนขวา
              </li>
              <li>
                รายชื่อจะถูกจัดเก็บเรียงตามวันผ่าตัดและแพทย์ที่นี่ เพื่อเปิดกรอกต่อเมื่อไปเยี่ยมที่หอผู้ป่วย
              </li>
            </ol>
          </div>
        ) : totalFiltered === 0 ? (
          <div className="p-4 text-center space-y-2">
            <p className="text-xs text-slate-600">ไม่พบใบเยี่ยมตามเงื่อนไขที่กรอง</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSurgeonFilter('ALL');
                  setWardFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="text-xs font-medium text-blue-800 hover:underline"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        ) : (
          groupedFolders.map((group) => {
            const isUnspecified = group.date === '__UNSPECIFIED__';
            const isCollapsed = Boolean(collapsedDates[group.date]);
            const dateMeta = isUnspecified
              ? { label: 'ยังไม่ระบุวันผ่าตัด', relativeTag: '' }
              : formatThaiScheduleDate(group.date);

            return (
              <div key={group.date}>
                {/* Date Folder Header */}
                <div className="px-3 py-2 bg-slate-50/90 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleDateCollapse(group.date)}
                    className="flex items-center gap-1.5 min-w-0 flex-1 text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    <Calendar className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {isUnspecified ? 'ยังไม่ระบุวันผ่าตัด' : group.date}
                        {dateMeta.relativeTag ? (
                          <span
                            className={`ml-1.5 font-semibold ${
                              dateMeta.relativeTag === 'วันนี้'
                                ? 'text-blue-800'
                                : dateMeta.relativeTag === 'พรุ่งนี้'
                                ? 'text-emerald-700'
                                : 'text-slate-500'
                            }`}
                          >
                            {dateMeta.relativeTag}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate tabular-nums">
                        {!isUnspecified ? `${dateMeta.label} · ` : ''}
                        {group.total} ราย
                        {group.draftCount > 0 ? ` (รอเยี่ยม ${group.draftCount})` : ''}
                      </div>
                    </div>
                  </button>

                  {!isUnspecified && (
                    <button
                      type="button"
                      onClick={() => onCreateNewForDate(group.date)}
                      title={`สร้างใบเยี่ยมใหม่สำหรับวันผ่าตัด ${group.date}`}
                      aria-label={`สร้างใบเยี่ยมใหม่สำหรับวันผ่าตัด ${group.date}`}
                      className="p-1 text-blue-800 hover:bg-blue-50 rounded shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Surgeons inside this Date */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100">
                    {group.surgeons.map((sGroup) => (
                      <div key={sGroup.surgeon} className="bg-white">
                        <div className="px-3.5 py-1.5 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-slate-700 truncate">
                            {sGroup.surgeon}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums text-slate-500 shrink-0">
                            {sGroup.items.length} ราย
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {sGroup.items.map((item) => {
                            const isActive = item.id === activeId;
                            const st = statusMeta(item.status);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onSelectRecord(item)}
                                className={`w-full text-left px-3.5 py-2 transition-colors ${
                                  isActive
                                    ? 'bg-blue-50/80 text-slate-950'
                                    : 'hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <div className="flex items-baseline justify-between gap-2">
                                  <span
                                    className={`text-xs truncate ${
                                      isActive ? 'font-bold text-blue-950' : 'font-semibold text-slate-900'
                                    }`}
                                  >
                                    {item.patientName || 'ยังไม่ระบุชื่อ'}
                                  </span>
                                  <span className="text-[10px] font-mono tabular-nums text-slate-500 shrink-0">
                                    {item.hn || '—'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {item.ward || 'ไม่ระบุหอผู้ป่วย'}
                                  {item.operation ? ` · ${item.operation}` : ''}
                                </div>
                                <div className="flex items-center justify-between gap-2 mt-0.5 text-[10px]">
                                  <span className={`font-medium ${st.cls}`}>{st.label}</span>
                                  <span className="font-mono tabular-nums text-slate-400">
                                    {[item.orRoom, item.caseOrder ? `#${item.caseOrder}` : '', item.operationTime]
                                      .filter(Boolean)
                                      .join(' ')}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
