import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Copy,
  Download,
  Edit3,
  FileCode2,
  FilePlus2,
  Plus,
  Printer,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  compareElectiveSchedule,
  computeClinicalSummary,
  formatThaiScheduleDate,
  getEffectiveScheduleType,
  PreAnestheticEvaluation,
} from '../types/evaluation';
import { exportEvaluationsCsv, exportSingleHtmlReport } from '../utils/exportReports';

function getUpdatedMillis(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'object' && ts !== null && 'toMillis' in ts) {
    const fn = (ts as { toMillis?: () => number }).toMillis;
    if (typeof fn === 'function') return fn();
  }
  return 0;
}

interface RegistryViewProps {
  records: PreAnestheticEvaluation[];
  activeId: string;
  onEdit: (record: PreAnestheticEvaluation) => void;
  onDuplicate: (record: PreAnestheticEvaluation) => void;
  onDelete: (recordId: string) => Promise<void>;
  onPrintRecord: (record: PreAnestheticEvaluation) => void;
  onCreateNew: () => void;
  onCreateNewForDate?: (dateOfOperation: string, orRoom?: string) => void;
  onLoadSamples: () => void;
}

export function RegistryView({
  records,
  activeId,
  onEdit,
  onDuplicate,
  onDelete,
  onPrintRecord,
  onCreateNew,
  onCreateNewForDate,
  onLoadSamples,
}: RegistryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'draft' | 'evaluated' | 'post_op_completed'>('ALL');
  const [scheduleFilter, setScheduleFilter] = useState<'ALL' | 'elective' | 'emergency'>('ALL');
  const [operationDateFilter, setOperationDateFilter] = useState('');
  const [sortMode, setSortMode] = useState<'op_asc' | 'op_desc' | 'updated'>('op_asc');
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState<PreAnestheticEvaluation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = records.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (scheduleFilter !== 'ALL' && getEffectiveScheduleType(r) !== scheduleFilter) return false;
      if (operationDateFilter && (r.dateOfOperation || '').trim() !== operationDateFilter) {
        return false;
      }
      if (!q) return true;
      return (
        r.patientName.toLowerCase().includes(q) ||
        r.hn.toLowerCase().includes(q) ||
        r.an.toLowerCase().includes(q) ||
        r.ward.toLowerCase().includes(q) ||
        (r.surgeon || '').toLowerCase().includes(q) ||
        (r.orRoom || '').toLowerCase().includes(q) ||
        r.diagnosis.toLowerCase().includes(q) ||
        r.operation.toLowerCase().includes(q)
      );
    });
    if (sortMode === 'op_asc') {
      return [...list].sort((a, b) => compareElectiveSchedule(a, b, 'asc'));
    }
    if (sortMode === 'op_desc') {
      return [...list].sort((a, b) => compareElectiveSchedule(a, b, 'desc'));
    }
    return [...list].sort((a, b) => getUpdatedMillis(b.updatedAt) - getUpdatedMillis(a.updatedAt));
  }, [records, searchQuery, statusFilter, scheduleFilter, operationDateFilter, sortMode]);

  const groupedByDate = useMemo(() => {
    if (sortMode === 'updated') return null;
    const groups: { date: string; items: PreAnestheticEvaluation[] }[] = [];
    const idxByDate = new Map<string, number>();
    for (const item of filtered) {
      const key = (item.dateOfOperation || '').trim() || '__UNSPECIFIED__';
      const idx = idxByDate.get(key);
      if (idx === undefined) {
        idxByDate.set(key, groups.length);
        groups.push({ date: key, items: [item] });
      } else {
        groups[idx].items.push(item);
      }
    }
    return groups;
  }, [filtered, sortMode]);

  const statusText = (s: PreAnestheticEvaluation['status']) => {
    switch (s) {
      case 'post_op_completed':
        return 'เยี่ยมหลังผ่าตัดแล้ว';
      case 'evaluated':
        return 'ประเมินก่อนผ่าตัดแล้ว';
      case 'locked':
        return 'ปิดบันทึกแล้ว';
      default:
        return 'ฉบับร่าง';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Controls Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหา ชื่อ, HN, AN, หอผู้ป่วย, การผ่าตัด..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-800"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { key: 'ALL', label: 'ทั้งหมด' },
                { key: 'draft', label: 'ฉบับร่าง' },
                { key: 'evaluated', label: 'ประเมินแล้ว' },
                { key: 'post_op_completed', label: 'Post-Op แล้ว' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            aria-label="ประเภทตารางผ่าตัด"
            value={scheduleFilter}
            onChange={(e) => setScheduleFilter(e.target.value as 'ALL' | 'elective' | 'emergency')}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
          >
            <option value="ALL">ทุกประเภทเคส</option>
            <option value="elective">เฉพาะ Elective</option>
            <option value="emergency">เฉพาะ Emergency</option>
          </select>

          <div className="flex items-center gap-1">
            <input
              type="date"
              aria-label="กรองตามวันที่ทำผ่าตัด"
              title="กรองเฉพาะวันที่ทำผ่าตัด"
              value={operationDateFilter}
              onChange={(e) => setOperationDateFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-800"
            />
            {operationDateFilter && (
              <button
                type="button"
                onClick={() => setOperationDateFilter('')}
                title="ล้างการกรองวันที่ผ่าตัด"
                aria-label="ล้างการกรองวันที่ผ่าตัด"
                className="p-1.5 text-slate-500 hover:text-slate-900 bg-white border border-slate-300 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            aria-label="เรียงลำดับข้อมูล"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as 'op_asc' | 'op_desc' | 'updated')}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
          >
            <option value="op_asc">เรียงตามวันผ่าตัด (ใกล้ → ไกล)</option>
            <option value="op_desc">เรียงตามวันผ่าตัด (ล่าสุด → เก่า)</option>
            <option value="updated">เรียงตามแก้ไขล่าสุด</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onLoadSamples}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-800" />
            เพิ่มตัวอย่าง 5 เคส
          </button>
          <button
            type="button"
            onClick={() => exportEvaluationsCsv(filtered)}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-blue-800" />
            ส่งออก CSV
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors whitespace-nowrap shrink-0"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            เพิ่มรายการใหม่
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700">
              ไม่พบข้อมูลผู้ป่วยตามเงื่อนไขที่ค้นหา
            </p>
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors"
            >
              <FilePlus2 className="w-4 h-4" />
              สร้างแบบฟอร์มผู้ป่วยใหม่
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-4 font-semibold whitespace-nowrap">วันที่ผ่าตัด / OR</th>
                  <th className="py-2.5 px-4 font-semibold whitespace-nowrap">HN / AN</th>
                  <th className="py-2.5 px-4 font-semibold">ผู้ป่วย</th>
                  <th className="py-2.5 px-4 font-semibold">หอผู้ป่วย · การผ่าตัด</th>
                  <th className="py-2.5 px-4 font-semibold">ASA / Plan</th>
                  <th className="py-2.5 px-4 font-semibold">สถานะ</th>
                  <th className="py-2.5 px-4 font-semibold text-right">จัดการข้อมูล / ส่งออก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const renderRow = (r: PreAnestheticEvaluation) => {
                    const summary = computeClinicalSummary(r);
                    const isActive = r.id === activeId;
                    const isEmergency = getEffectiveScheduleType(r) === 'emergency';
                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isActive ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 font-mono tabular-nums whitespace-nowrap">
                          <div className="font-semibold text-slate-900">
                            {r.dateOfOperation || 'ยังไม่ระบุ'}
                            {r.operationTime ? ` ${r.operationTime}` : ''}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {r.orRoom || 'ไม่ระบุห้อง'}
                            {r.caseOrder ? ` #${r.caseOrder}` : ''}
                            {' · '}
                            <span className={isEmergency ? 'text-red-700 font-semibold' : ''}>
                              {isEmergency ? 'Emergency' : 'Elective'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                          <div>{r.hn || '—'}</div>
                          <div className="text-[11px] text-slate-500">{r.an || '—'}</div>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {r.patientName}{' '}
                            {r.age ? (
                              <span className="font-normal text-slate-600">({r.age} ปี)</span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                            {r.dateOfVisit ? `Visit: ${r.dateOfVisit}` : 'ยังไม่ลงวันเยี่ยม'}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 max-w-xs">
                          <div className="font-medium text-slate-800 truncate">
                            {r.ward || 'ไม่ระบุหอผู้ป่วย'}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {r.operation || r.diagnosis || '—'}
                            {r.surgeon ? ` · ${r.surgeon}` : ''}
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-mono tabular-nums font-semibold text-slate-900">
                            {summary.asaLabel}
                            {r.expectedDifficultAirway ? ' · Diff Airway' : ''}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {summary.planSummary}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                          {statusText(r.status)}
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEdit(r)}
                              title="เปิดแก้ไขในแบบฟอร์ม"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              แก้ไข
                            </button>
                            <button
                              type="button"
                              onClick={() => onPrintRecord(r)}
                              title="พิมพ์ 1 หน้า A4 / PDF"
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => exportSingleHtmlReport(r)}
                              title="ดาวน์โหลดไฟล์รายงาน HTML (1 หน้า)"
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            >
                              <FileCode2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDuplicate(r)}
                              title="ทำสำเนาเป็นรายการใหม่"
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteRecord(r)}
                              title="ลบข้อมูล"
                              className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  };

                  if (!groupedByDate) {
                    return filtered.map(renderRow);
                  }

                  return groupedByDate.map((group) => {
                    const isUnspecified = group.date === '__UNSPECIFIED__';
                    const meta = isUnspecified
                      ? { label: 'ยังไม่ระบุวันที่ทำผ่าตัด', relativeTag: '' }
                      : formatThaiScheduleDate(group.date);
                    return (
                      <React.Fragment key={group.date}>
                        <tr className="bg-slate-50/90 border-t border-slate-200">
                          <td colSpan={7} className="py-2 px-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <Calendar className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                                <span className="font-bold text-slate-900">{meta.label}</span>
                                {!isUnspecified && (
                                  <span className="font-mono tabular-nums text-slate-600">
                                    ({group.date})
                                  </span>
                                )}
                                {meta.relativeTag && (
                                  <span
                                    className={`font-semibold ${
                                      meta.relativeTag === 'วันนี้'
                                        ? 'text-blue-800'
                                        : meta.relativeTag === 'พรุ่งนี้'
                                        ? 'text-emerald-700'
                                        : 'text-slate-600'
                                    }`}
                                  >
                                    · {meta.relativeTag}
                                  </span>
                                )}
                                <span className="text-slate-500 tabular-nums">
                                  · {group.items.length} เคส
                                </span>
                              </div>
                              {!isUnspecified && onCreateNewForDate && (
                                <button
                                  type="button"
                                  onClick={() => onCreateNewForDate(group.date)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-blue-800 bg-white border border-slate-300 rounded hover:bg-blue-50 transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  เพิ่มฟอร์มวันนี้
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {group.items.map(renderRow)}
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteRecord && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-5 space-y-4 shadow-lg">
            <h3 className="text-base font-semibold text-slate-900">
              ยืนยันการลบข้อมูลแบบประเมิน
            </h3>
            <p className="text-sm text-slate-600">
              ต้องการลบข้อมูลของ <strong>{confirmDeleteRecord.patientName}</strong> (HN:{' '}
              <span className="font-mono">{confirmDeleteRecord.hn || '—'}</span>) ใช่หรือไม่?
              การลบนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteRecord(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await onDelete(confirmDeleteRecord.id);
                    setConfirmDeleteRecord(null);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="px-4 py-2 text-xs font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 disabled:opacity-60"
              >
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบข้อมูล'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
