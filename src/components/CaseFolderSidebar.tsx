import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronDown, ChevronRight, FilePlus2, FolderOpen, Plus, Search, X } from 'lucide-react';
import {
  compareByDateAndSurgeon,
  formatShortThaiDate,
  formatThaiScheduleDate,
  formatWardWithBed,
  getEffectiveEvaluationStatus,
  getPostOpVisitCompleteness,
  matchesEvaluationSearch,
  PreAnestheticEvaluation,
} from '../types/evaluation';
import { ThaiDateInput } from './ThaiDateInput';

interface CaseFolderSidebarProps {
  records: PreAnestheticEvaluation[];
  activeId: string;
  surgeonOptions: string[];
  wardOptions: string[];
  onSelectRecord: (record: PreAnestheticEvaluation) => void;
  onCreateNew: () => void;
  onCreateNewForDate: (dateOfOperation: string, orRoom?: string, surgeon?: string) => void;
  onOpenFullRegistry?: () => void;
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
  onOpenFullRegistry,
  onClose,
}: CaseFolderSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [surgeonFilter, setSurgeonFilter] = useState('ALL');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'draft' | 'evaluated'>('ALL');
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

  // Automatically expand the active record's date folder so newly created/saved visits are immediately visible
  useEffect(() => {
    const activeRecord = records.find((r) => r.id === activeId);
    if (!activeRecord) return;
    const dateKey = (activeRecord.dateOfOperation || '').trim() || '__UNSPECIFIED__';
    setCollapsedDates((prev) => (prev[dateKey] ? { ...prev, [dateKey]: false } : prev));
  }, [activeId, records]);

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
    const filtered = records
      .filter((r) => {
        if (dateFilter) {
          const opDate = (r.dateOfOperation || '').trim();
          const visitDate = (r.dateOfVisit || '').trim();
          const postOpDate = (r.formData?.postAnesthesia?.visitDate || '').trim();
          const cbcDate = (r.formData?.laboratory?.cbcDate || '').trim();
          const chemDate = (r.formData?.laboratory?.chemDate || '').trim();
          const labDate = (r.formData?.laboratory?.labDate || '').trim();
          if (
            opDate !== dateFilter &&
            visitDate !== dateFilter &&
            postOpDate !== dateFilter &&
            cbcDate !== dateFilter &&
            chemDate !== dateFilter &&
            labDate !== dateFilter
          ) {
            return false;
          }
        }
        if (surgeonFilter !== 'ALL') {
          const s = (r.surgeon || '').trim() || '__NONE__';
          if (s !== surgeonFilter) return false;
        }
        if (wardFilter !== 'ALL' && (r.ward || '').trim() !== wardFilter) {
          return false;
        }
        const effStatus = getEffectiveEvaluationStatus(r);
        if (statusFilter === 'draft' && effStatus !== 'draft') return false;
        if (
          statusFilter === 'evaluated' &&
          effStatus !== 'evaluated' &&
          effStatus !== 'post_op_completed' &&
          effStatus !== 'locked'
        ) {
          return false;
        }
        return matchesEvaluationSearch(r, searchQuery);
      })
      .sort((a, b) => compareByDateAndSurgeon(a, b, 'desc'));

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
  }, [records, searchQuery, dateFilter, surgeonFilter, wardFilter, statusFilter]);

  const toggleDateCollapse = (dateKey: string) => {
    setCollapsedDates((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const statusMeta = (item: PreAnestheticEvaluation) => {
    const effStatus = getEffectiveEvaluationStatus(item);
    const postOp = getPostOpVisitCompleteness(
      item.formData?.postAnesthesia,
      item.formData?.postOpComplication,
    );
    switch (effStatus) {
      case 'post_op_completed':
        return { label: 'เยี่ยม Post-Op แล้ว', cls: 'text-pgreen-800' };
      case 'evaluated':
        return {
          label: postOp.hasAnyInput
            ? 'Pre-Op แล้ว · ยังไม่เยี่ยม Post-Op (ไม่ครบ)'
            : 'Pre-Op แล้ว · ยังไม่เยี่ยม Post-Op',
          cls: 'text-pblue-800',
        };
      case 'locked':
        return { label: 'ปิดบันทึก', cls: 'text-slate-500' };
      default:
        return { label: 'รอเยี่ยมที่หอผู้ป่วย', cls: 'text-pyellow-800' };
    }
  };

  const totalFiltered = groupedFolders.reduce((sum, g) => sum + g.total, 0);
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    Boolean(dateFilter) ||
    surgeonFilter !== 'ALL' ||
    wardFilter !== 'ALL' ||
    statusFilter !== 'ALL';
  const activeRecordExists = useMemo(
    () => records.some((r) => r.id === activeId),
    [records, activeId],
  );
  const activeRecordVisible = useMemo(
    () =>
      groupedFolders.some((g) =>
        g.surgeons.some((s) => s.items.some((item) => item.id === activeId)),
      ),
    [groupedFolders, activeId],
  );
  const resetSidebarFilters = () => {
    setSearchQuery('');
    setDateFilter('');
    setSurgeonFilter('ALL');
    setWardFilter('ALL');
    setStatusFilter('ALL');
  };

  return (
    <aside
      aria-label="ทะเบียนผ่าตัดและใบเยี่ยมทั้งหมด"
      className="no-print bg-white border border-pborder rounded-xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-3.5 py-3 border-b border-pborder bg-gradient-to-br from-pblue-50/90 via-white to-ppink-50/50 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <FolderOpen className="w-4 h-4 text-pblue-600 shrink-0" />
            <h2 className="text-xs font-bold text-[#243040] truncate">
              ทะเบียนผ่าตัด ({records.length})
            </h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-white bg-pblue-600 rounded-md hover:bg-pblue-700 transition-colors whitespace-nowrap"
            >
              <FilePlus2 className="w-3 h-3" />
              สร้างใบใหม่
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="ซ่อนทะเบียนข้าง"
                title="ซ่อนทะเบียนข้าง"
                className="p-1 text-slate-400 hover:text-prose-800 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500 leading-snug">
            รวมแฟ้มวันผ่าตัดและใบเยี่ยมทั้งหมด แสดงค้างไว้ตลอดเวลา
          </p>
          {onOpenFullRegistry && (
            <button
              type="button"
              onClick={onOpenFullRegistry}
              className="text-[11px] font-semibold text-prose-800 hover:underline whitespace-nowrap shrink-0"
            >
              ดูทะเบียนเต็ม
            </button>
          )}
        </div>

        {/* Search by HN / Name & Date */}
        <div className="space-y-1.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="สืบค้น HN, ชื่อ, แพทย์, หอผู้ป่วย..."
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
          <div className="flex items-center gap-1">
            <ThaiDateInput
              ariaLabel="สืบค้นตามวันที่ (พ.ศ.)"
              title="สืบค้นตามวันที่ผ่าตัดหรือวันที่เยี่ยม (พ.ศ.)"
              value={dateFilter}
              onChange={(next) => setDateFilter(next)}
              placeholder="วันที่ พ.ศ. (วว/ดด/ปปปป)"
              wrapperClassName="flex-1 min-w-0"
              className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] font-mono tabular-nums text-slate-800 focus:outline-none focus:border-blue-800"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                aria-label="ล้างการกรองวันที่"
                title="ล้างการกรองวันที่"
                className="p-1 text-slate-500 hover:text-slate-900 bg-white border border-slate-300 rounded-md"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
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
        <div className="flex items-center gap-1 p-0.5 bg-pblue-100/60 rounded-md">
          {(
            [
              { key: 'ALL', label: 'ทั้งหมด', activeCls: 'bg-white text-pblue-800 shadow-2xs' },
              { key: 'draft', label: 'รอเยี่ยม', activeCls: 'bg-pyellow-50 text-pyellow-800 shadow-2xs' },
              { key: 'evaluated', label: 'เยี่ยมแล้ว', activeCls: 'bg-pgreen-50 text-pgreen-800 shadow-2xs' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`flex-1 py-1 text-[11px] font-semibold rounded transition-colors whitespace-nowrap ${
                statusFilter === tab.key
                  ? tab.activeCls
                  : 'text-slate-600 hover:text-[#243040]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Folder Tree Body */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-290px)] divide-y divide-pborder">
        {hasActiveFilters && activeRecordExists && !activeRecordVisible && totalFiltered > 0 && (
          <div className="px-3 py-2 bg-pyellow-50 border-b border-pyellow-200 flex items-center justify-between gap-2 text-[11px] text-pyellow-800">
            <span>ใบเยี่ยมที่เปิดอยู่ถูกซ่อนโดยตัวกรอง</span>
            <button
              type="button"
              onClick={resetSidebarFilters}
              className="font-semibold text-pblue-800 hover:underline whitespace-nowrap shrink-0"
            >
              แสดงทั้งหมด
            </button>
          </div>
        )}
        {records.length === 0 ? (
          <div className="p-4 space-y-2.5 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">ยังไม่มีใบเยี่ยมที่บันทึกไว้</p>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-slate-600">
              <li>
                กด <strong>สร้างใบใหม่</strong> แล้วระบุ <strong>HN / ชื่อผู้ป่วย</strong> และ <strong>วันที่ผ่าตัด</strong>
              </li>
              <li>
                ระบบจะจัดเก็บข้อมูลลงใน <strong>ทะเบียน</strong> ทันที และสามารถกด <strong>อัปเดตข้อมูล</strong> เมื่อกรอกรายละเอียดเพิ่มเติม
              </li>
              <li>
                สามารถสืบค้นย้อนหลังได้ทันทีจาก <strong>HN</strong> และ <strong>วันที่</strong> ทั้งที่นี่และในหน้าทะเบียน
              </li>
            </ol>
          </div>
        ) : totalFiltered === 0 ? (
          <div className="p-4 text-center space-y-2">
            <p className="text-xs text-slate-600">ไม่พบใบเยี่ยมตามเงื่อนไขที่กรอง</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetSidebarFilters}
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
                <div className="px-3 py-2 bg-pblue-50/55 flex items-center justify-between gap-1.5">
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
                    <Calendar className="w-3.5 h-3.5 text-pblue-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#243040] truncate">
                        {isUnspecified ? 'ยังไม่ระบุวันผ่าตัด' : formatShortThaiDate(group.date)}
                        {dateMeta.relativeTag ? (
                          <span
                            className={`ml-1.5 font-semibold ${
                              dateMeta.relativeTag === 'วันนี้'
                                ? 'text-prose-800'
                                : dateMeta.relativeTag === 'พรุ่งนี้'
                                ? 'text-pgreen-800'
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
                      className="p-1 text-pblue-800 hover:bg-pblue-100 rounded shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Surgeons inside this Date */}
                {!isCollapsed && (
                  <div className="divide-y divide-pborder/60">
                    {group.surgeons.map((sGroup) => (
                      <div key={sGroup.surgeon} className="bg-white">
                        <div className="px-3.5 py-1.5 bg-ppink-50/45 border-b border-ppink-100/80 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-prose-800 truncate">
                            {sGroup.surgeon}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums text-slate-500 shrink-0">
                            {sGroup.items.length} ราย
                          </span>
                        </div>

                        <div className="divide-y divide-pborder/60">
                          {sGroup.items.map((item) => {
                            const isActive = item.id === activeId;
                            const st = statusMeta(item);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onSelectRecord(item)}
                                className={`w-full text-left px-3.5 py-2 transition-colors ${
                                  isActive
                                    ? 'bg-pblue-50 text-[#243040]'
                                    : 'hover:bg-pblue-50/40 text-slate-800'
                                }`}
                              >
                                <div className="flex items-baseline justify-between gap-2">
                                  <span
                                    className={`text-xs truncate ${
                                      isActive ? 'font-bold text-pblue-800' : 'font-semibold text-[#243040]'
                                    }`}
                                  >
                                    {item.patientName || 'ยังไม่ระบุชื่อ'}
                                  </span>
                                  <span className="text-[10px] font-mono tabular-nums text-slate-500 shrink-0">
                                    {item.hn || '—'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {formatWardWithBed(item.ward, item.bed) || 'ไม่ระบุหอผู้ป่วย'}
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
