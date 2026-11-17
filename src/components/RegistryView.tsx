import React, { useMemo, useState } from 'react';
import {
  Copy,
  Download,
  Edit3,
  FileCode2,
  FilePlus2,
  Printer,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { computeClinicalSummary, PreAnestheticEvaluation } from '../types/evaluation';
import { exportEvaluationsCsv, exportSingleHtmlReport } from '../utils/exportReports';

interface RegistryViewProps {
  records: PreAnestheticEvaluation[];
  activeId: string;
  onEdit: (record: PreAnestheticEvaluation) => void;
  onDuplicate: (record: PreAnestheticEvaluation) => void;
  onDelete: (recordId: string) => Promise<void>;
  onPrintRecord: (record: PreAnestheticEvaluation) => void;
  onCreateNew: () => void;
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
  onLoadSamples,
}: RegistryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'draft' | 'evaluated' | 'post_op_completed'>('ALL');
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState<PreAnestheticEvaluation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.patientName.toLowerCase().includes(q) ||
        r.hn.toLowerCase().includes(q) ||
        r.an.toLowerCase().includes(q) ||
        r.ward.toLowerCase().includes(q) ||
        (r.surgeon || '').toLowerCase().includes(q) ||
        r.diagnosis.toLowerCase().includes(q) ||
        r.operation.toLowerCase().includes(q)
      );
    });
  }, [records, searchQuery, statusFilter]);

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
                  <th className="py-2.5 px-4 font-semibold">HN / AN</th>
                  <th className="py-2.5 px-4 font-semibold">ผู้ป่วย</th>
                  <th className="py-2.5 px-4 font-semibold">หอผู้ป่วย · การผ่าตัด</th>
                  <th className="py-2.5 px-4 font-semibold">ASA / Plan</th>
                  <th className="py-2.5 px-4 font-semibold">สถานะ</th>
                  <th className="py-2.5 px-4 font-semibold text-right">จัดการข้อมูล / ส่งออก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const summary = computeClinicalSummary(r);
                  const isActive = r.id === activeId;
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isActive ? 'bg-blue-50/40' : ''
                      }`}
                    >
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
                          Visit: {r.dateOfVisit || '—'} · Op: {r.dateOfOperation || '—'}
                          {r.operationTime ? ` ${r.operationTime}` : ''}
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
                })}
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
