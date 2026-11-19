import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Calendar,
  Copy,
  Download,
  Edit3,
  FilePlus2,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  addDaysToIsoDate,
  compareElectiveSchedule,
  computeClinicalSummary,
  createEmptyEvaluation,
  formatThaiScheduleDate,
  getEffectiveScheduleType,
  getTodayIsoDate,
  OR_ROOM_OPTIONS,
  PreAnestheticEvaluation,
  ScheduleType,
} from '../types/evaluation';
import { exportEvaluationsCsv } from '../utils/exportReports';

interface ElectiveScheduleViewProps {
  records: PreAnestheticEvaluation[];
  activeId: string;
  wardOptions: string[];
  surgeonOptions: string[];
  isLoading: boolean;
  onSaveRecord: (record: PreAnestheticEvaluation) => Promise<PreAnestheticEvaluation | null>;
  onEdit: (record: PreAnestheticEvaluation) => void;
  onDuplicate: (record: PreAnestheticEvaluation) => void;
  onDelete: (recordId: string) => Promise<void>;
  onPrintRecord: (record: PreAnestheticEvaluation) => void;
  onCreateNewForDate: (dateOfOperation: string, orRoom?: string) => void;
}

type DateScope = 'all' | 'upcoming' | 'today' | 'tomorrow' | 'pending_preop' | 'past';
type CaseTypeScope = 'elective' | 'all';

interface QuickCreateDraft {
  dateOfOperation: string;
  dateOfVisit: string;
  scheduleType: ScheduleType;
  orRoom: string;
  caseOrder: string;
  operationTime: string;
  patientName: string;
  hn: string;
  an: string;
  age: string;
  ward: string;
  diagnosis: string;
  operation: string;
  surgeon: string;
}

function createInitialQuickDraft(dateOfOperation: string): QuickCreateDraft {
  return {
    dateOfOperation,
    dateOfVisit: '',
    scheduleType: 'elective',
    orRoom: 'OR 1',
    caseOrder: '1',
    operationTime: '08:30',
    patientName: '',
    hn: '',
    an: '',
    age: '',
    ward: '',
    diagnosis: '',
    operation: '',
    surgeon: '',
  };
}

export function ElectiveScheduleView({
  records,
  activeId,
  wardOptions,
  surgeonOptions,
  isLoading,
  onSaveRecord,
  onEdit,
  onDuplicate,
  onDelete,
  onPrintRecord,
  onCreateNewForDate,
}: ElectiveScheduleViewProps) {
  const today = getTodayIsoDate();
  const tomorrow = addDaysToIsoDate(today, 1);
  const dayAfterTomorrow = addDaysToIsoDate(today, 2);

  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickDraft, setQuickDraft] = useState<QuickCreateDraft>(() =>
    createInitialQuickDraft(tomorrow),
  );
  const [quickError, setQuickError] = useState('');
  const [isSavingQuick, setIsSavingQuick] = useState(false);

  const [dateScope, setDateScope] = useState<DateScope>('all');
  const [caseTypeScope, setCaseTypeScope] = useState<CaseTypeScope>('elective');
  const [specificDate, setSpecificDate] = useState('');
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState<PreAnestheticEvaluation | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const orRoomChoices = useMemo(() => {
    const set = new Set<string>(OR_ROOM_OPTIONS);
    records.forEach((r) => {
      if (r.orRoom?.trim()) set.add(r.orRoom.trim());
    });
    return Array.from(set);
  }, [records]);

  const counts = useMemo(() => {
    const electiveList = records.filter((r) => getEffectiveScheduleType(r) === 'elective');
    const emergencyList = records.filter((r) => getEffectiveScheduleType(r) === 'emergency');
    const upcomingElective = electiveList.filter(
      (r) => (r.dateOfOperation || '').trim() >= today,
    );
    const todayElective = electiveList.filter((r) => (r.dateOfOperation || '').trim() === today);
    const tomorrowElective = electiveList.filter(
      (r) => (r.dateOfOperation || '').trim() === tomorrow,
    );
    const pendingPreOp = electiveList.filter((r) => r.status === 'draft');
    const evaluatedPreOp = electiveList.filter(
      (r) => r.status === 'evaluated' || r.status === 'post_op_completed' || r.status === 'locked',
    );
    const uniqueDates = new Set(
      electiveList.map((r) => (r.dateOfOperation || '').trim()).filter(Boolean),
    );
    return {
      electiveTotal: electiveList.length,
      emergencyTotal: emergencyList.length,
      allTotal: records.length,
      upcomingCount: upcomingElective.length,
      todayCount: todayElective.length,
      tomorrowCount: tomorrowElective.length,
      pendingCount: pendingPreOp.length,
      evaluatedCount: evaluatedPreOp.length,
      dateCount: uniqueDates.size,
    };
  }, [records, today, tomorrow]);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = records.filter((r) => {
      const effType = getEffectiveScheduleType(r);
      if (caseTypeScope === 'elective' && effType !== 'elective') return false;

      const opDate = (r.dateOfOperation || '').trim();
      if (specificDate && opDate !== specificDate) return false;

      if (dateScope === 'upcoming' && (!opDate || opDate < today)) return false;
      if (dateScope === 'today' && opDate !== today) return false;
      if (dateScope === 'tomorrow' && opDate !== tomorrow) return false;
      if (dateScope === 'pending_preop' && r.status !== 'draft') return false;
      if (dateScope === 'past' && (!opDate || opDate >= today)) return false;

      if (roomFilter !== 'ALL' && (r.orRoom || '').trim() !== roomFilter) return false;

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

    return [...filtered].sort((a, b) => compareElectiveSchedule(a, b, sortDirection));
  }, [
    records,
    caseTypeScope,
    specificDate,
    dateScope,
    today,
    tomorrow,
    roomFilter,
    searchQuery,
    sortDirection,
  ]);

  const groupedByDate = useMemo(() => {
    const groups: { date: string; items: PreAnestheticEvaluation[] }[] = [];
    const indexByDate = new Map<string, number>();

    for (const item of filteredAndSorted) {
      const key = (item.dateOfOperation || '').trim() || '__UNSPECIFIED__';
      const existingIdx = indexByDate.get(key);
      if (existingIdx === undefined) {
        indexByDate.set(key, groups.length);
        groups.push({ date: key, items: [item] });
      } else {
        groups[existingIdx].items.push(item);
      }
    }
    return groups;
  }, [filteredAndSorted]);

  const openQuickCreateForDate = (targetDate: string, targetRoom?: string) => {
    const existingOnDate = records.filter(
      (r) =>
        (r.dateOfOperation || '').trim() === targetDate &&
        (!targetRoom || (r.orRoom || '').trim() === targetRoom),
    );
    const nextOrder = String(existingOnDate.length + 1);
    setQuickDraft((prev) => ({
      ...prev,
      dateOfOperation: targetDate,
      orRoom: targetRoom ?? prev.orRoom,
      caseOrder: nextOrder,
    }));
    setQuickError('');
    setShowQuickCreate(true);
  };

  const handleQuickSubmit = async (openFormAfter: boolean) => {
    if (!quickDraft.patientName.trim()) {
      setQuickError('กรุณาระบุชื่อ-นามสกุลผู้ป่วย');
      return;
    }
    if (!quickDraft.dateOfOperation.trim()) {
      setQuickError('กรุณาระบุวันที่นัดผ่าตัด (Date of Operation)');
      return;
    }

    setQuickError('');
    setIsSavingQuick(true);
    try {
      const base = createEmptyEvaluation('local', {
        dateOfOperation: quickDraft.dateOfOperation.trim(),
        dateOfVisit: quickDraft.dateOfVisit.trim(),
        scheduleType: quickDraft.scheduleType,
        asaEmergency: quickDraft.scheduleType === 'emergency',
        orRoom: quickDraft.orRoom.trim(),
        caseOrder: quickDraft.caseOrder.trim(),
        operationTime: quickDraft.operationTime.trim(),
      });

      const prepared: PreAnestheticEvaluation = {
        ...base,
        patientName: quickDraft.patientName.trim(),
        hn: quickDraft.hn.trim(),
        an: quickDraft.an.trim(),
        age: quickDraft.age.trim(),
        ward: quickDraft.ward.trim(),
        diagnosis: quickDraft.diagnosis.trim(),
        operation: quickDraft.operation.trim(),
        surgeon: quickDraft.surgeon.trim(),
        status: 'draft',
      };

      const saved = await onSaveRecord(prepared);
      if (!saved) return;

      if (openFormAfter) {
        setShowQuickCreate(false);
        onEdit(saved);
        return;
      }

      const parsedOrder = parseInt(quickDraft.caseOrder.trim(), 10);
      const nextOrder = Number.isFinite(parsedOrder) ? String(parsedOrder + 1) : '';
      setQuickDraft((prev) => ({
        ...prev,
        caseOrder: nextOrder,
        patientName: '',
        hn: '',
        an: '',
        age: '',
        diagnosis: '',
        operation: '',
      }));
    } finally {
      setIsSavingQuick(false);
    }
  };

  const statusLabel = (r: PreAnestheticEvaluation) => {
    switch (r.status) {
      case 'post_op_completed':
        return { text: 'เยี่ยม Post-Op แล้ว', cls: 'text-emerald-800' };
      case 'evaluated':
        return { text: 'ประเมิน Pre-Op แล้ว', cls: 'text-blue-800' };
      case 'locked':
        return { text: 'ปิดบันทึกแล้ว', cls: 'text-slate-700' };
      default:
        return { text: 'รอเยี่ยม Pre-Op (เตรียมใบแล้ว)', cls: 'text-amber-700' };
    }
  };

  const inputBase =
    'bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-800';

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="h-72 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">เคส Elective ในตาราง</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {counts.electiveTotal}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            กระจาย {counts.dateCount} วันผ่าตัด · ที่กำลังจะถึง {counts.upcomingCount} ราย
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">นัดผ่าตัดวันนี้ / พรุ่งนี้</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-blue-900">
            {counts.todayCount}
            <span className="text-base font-normal text-slate-400"> / </span>
            {counts.tomorrowCount}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            วันนี้ ({today}) · พรุ่งนี้ ({tomorrow})
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">เตรียมใบเยี่ยมแล้ว (รอเยี่ยม)</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-amber-700">
            {counts.pendingCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            สร้างใบล่วงหน้า รอเข้าเยี่ยมประเมินผู้ป่วย
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">ประเมิน Pre-Op เสร็จสิ้น</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {counts.evaluatedCount}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            Emergency เพิ่มเติมในระบบ {counts.emergencyTotal} ราย
          </div>
        </div>
      </div>

      {/* Top Action & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              ตารางนัดผ่าตัดและจัดเตรียมใบเยี่ยม Pre-Op ล่วงหน้า (เรียงตามวันที่ผ่าตัด)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              สร้างใบเยี่ยมผู้ป่วยล่วงหน้าตามตาราง OR Elective Case และจัดเรียงตามวันผ่าตัด ห้องผ่าตัด ลำดับคิว และเวลา
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openQuickCreateForDate(tomorrow)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              เตรียมใบเยี่ยม Pre-Op ล่วงหน้า
            </button>
            <button
              type="button"
              onClick={() => onCreateNewForDate(tomorrow, 'OR 1')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-blue-800" />
              เปิดฟอร์มเต็ม (นัดพรุ่งนี้)
            </button>
            <button
              type="button"
              onClick={() =>
                exportEvaluationsCsv(filteredAndSorted, 'bangplee_elective_or_schedule')
              }
              disabled={filteredAndSorted.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-blue-800" />
              ส่งออก CSV ตารางนี้
            </button>
          </div>
        </div>

        {/* Quick-Create Pre-Op Schedule Drawer */}
        {showQuickCreate && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-800" />
                <span className="text-xs font-semibold text-slate-900">
                  เตรียมใบเยี่ยม Pre-Op ล่วงหน้าตามตารางนัดผ่าตัด
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickCreate(false)}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
              >
                <X className="w-3.5 h-3.5" />
                ปิดหน้าต่างนี้
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
              <div className="lg:col-span-4 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-slate-700">
                    วันที่นัดผ่าตัด (Date of Operation) <span className="text-red-600">*</span>
                  </span>
                  <div className="flex items-center gap-1">
                    {[
                      { label: 'วันนี้', val: today },
                      { label: 'พรุ่งนี้', val: tomorrow },
                      { label: 'มะรืน', val: dayAfterTomorrow },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() =>
                          setQuickDraft((prev) => ({ ...prev, dateOfOperation: opt.val }))
                        }
                        className={`px-1.5 py-0.5 text-[11px] rounded border transition-colors ${
                          quickDraft.dateOfOperation === opt.val
                            ? 'bg-blue-800 text-white border-blue-800'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="date"
                  value={quickDraft.dateOfOperation}
                  onChange={(e) =>
                    setQuickDraft((prev) => ({ ...prev, dateOfOperation: e.target.value }))
                  }
                  className={`${inputBase} font-mono tabular-nums`}
                />
              </div>

              <div className="lg:col-span-2 flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">ประเภทเคส</span>
                <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg">
                  {(
                    [
                      { key: 'elective', label: 'Elective' },
                      { key: 'emergency', label: 'Emergency' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() =>
                        setQuickDraft((prev) => ({ ...prev, scheduleType: t.key }))
                      }
                      className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                        quickDraft.scheduleType === t.key
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="lg:col-span-2 flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">ห้องผ่าตัด (OR)</span>
                <select
                  value={orRoomChoices.includes(quickDraft.orRoom) ? quickDraft.orRoom : 'OTHER'}
                  onChange={(e) =>
                    setQuickDraft((prev) => ({
                      ...prev,
                      orRoom: e.target.value === 'OTHER' ? '' : e.target.value,
                    }))
                  }
                  className={inputBase}
                >
                  <option value="">-- ไม่ระบุ --</option>
                  {orRoomChoices.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                  <option value="OTHER">พิมพ์ห้องอื่น...</option>
                </select>
              </label>

              <label className="lg:col-span-2 flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">ลำดับคิวในห้อง</span>
                <input
                  type="text"
                  value={quickDraft.caseOrder}
                  onChange={(e) =>
                    setQuickDraft((prev) => ({ ...prev, caseOrder: e.target.value }))
                  }
                  placeholder="เช่น 1, 2"
                  maxLength={16}
                  className={`${inputBase} font-mono tabular-nums`}
                />
              </label>

              <label className="lg:col-span-2 flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">เวลาผ่าตัด</span>
                <input
                  type="time"
                  value={quickDraft.operationTime}
                  onChange={(e) =>
                    setQuickDraft((prev) => ({ ...prev, operationTime: e.target.value }))
                  }
                  className={`${inputBase} font-mono tabular-nums`}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
              <label className="lg:col-span-4 flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">
                  ชื่อ-นามสกุล ผู้ป่วย <span className="text-red-600">*</span>
                </span>
                <input
                  type="text"
                  value={quickDraft.patientName}
                  onChange={(e) =>
                    setQuickDraft((prev) => ({ ...prev, patientName: e.target.value }))
                  }
                  placeholder="เช่น นายสมหมาย ใจดี"
                  maxLength={120}
                  className={inputBase}
                />
              </label>

              <label className="lg:col-span-2 flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">HN</span>
                <input
                  type="text"
                  value={quickDraft.hn}
                  onChange={(e) =>
                    setQuickDraft((prev) => ({ ...prev, hn: e.target.value }))
                  }
                  placeholder="เช่น 67012345"
                  maxLength={40}
                  className={`${inputBase} font-mono tabular-nums`}
                />
              </label>

              <label className="lg:col-span-2 flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">AN</span>
                <input
                  type="text"
                  value={quickDraft.an}
                  onChange={(e) =>
                    setQuickDraft((prev) => ({ ...prev, an: e.target.value }))
                  }
                  placeholder="เช่น 67-001234"
                  maxLength={40}
                  className={`${inputBase} font-mono tabular-nums`}
                />
              </label>

              <label className="lg:col-span-1 flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">อายุ (ปี)</span>
                <input
                  type="text"
                  value={quickDraft.age}
                  onChange={(e) =>
                    setQuickDraft((prev) => ({ ...prev, age: e.target.value }))
                  }
                  placeholder="ปี"
                  maxLength={16}
                  className={`${inputBase} font-mono tabular-nums`}
                />
              </label>

              <label className="lg:col-span-3 flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">หอผู้ป่วย (Ward)</span>
                <select
                  value={wardOptions.includes(quickDraft.ward) ? quickDraft.ward : ''}
                  onChange={(e) =>
                    setQuickDraft((prev) => ({ ...prev, ward: e.target.value }))
                  }
                  className={inputBase}
                >
                  <option value="">-- เลือกหอผู้ป่วย --</option>
                  {wardOptions.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
              <label className="lg:col-span-4 flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">Diagnosis</span>
                <input
                  type="text"
                  value={quickDraft.diagnosis}
                  onChange={(e) =>
                    setQuickDraft((prev) => ({ ...prev, diagnosis: e.target.value }))
                  }
                  placeholder="การวินิจฉัยโรค"
                  maxLength={300}
                  className={inputBase}
                />
              </label>

              <label className="lg:col-span-4 flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">Operation</span>
                <input
                  type="text"
                  value={quickDraft.operation}
                  onChange={(e) =>
                    setQuickDraft((prev) => ({ ...prev, operation: e.target.value }))
                  }
                  placeholder="การผ่าตัดที่วางแผน"
                  maxLength={300}
                  className={inputBase}
                />
              </label>

              <label className="lg:col-span-4 flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">Surgeon (แพทย์ผ่าตัด)</span>
                <select
                  value={surgeonOptions.includes(quickDraft.surgeon) ? quickDraft.surgeon : ''}
                  onChange={(e) =>
                    setQuickDraft((prev) => ({ ...prev, surgeon: e.target.value }))
                  }
                  className={inputBase}
                >
                  <option value="">-- เลือกรายชื่อแพทย์ผ่าตัด --</option>
                  {surgeonOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {quickError && (
              <div className="text-xs font-medium text-red-700">{quickError}</div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-xs text-slate-500">
                บันทึกเป็นใบเยี่ยมล่วงหน้า (รอเยี่ยม Pre-Op) และสามารถคีย์เคสถัดไปในวันเดียวกันได้ต่อเนื่อง
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isSavingQuick}
                  onClick={() => handleQuickSubmit(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 disabled:opacity-60 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isSavingQuick ? 'กำลังบันทึก...' : 'บันทึกเข้าตาราง & เพิ่มเคสถัดไป'}
                </button>
                <button
                  type="button"
                  disabled={isSavingQuick}
                  onClick={() => handleQuickSubmit(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-60 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-800" />
                  บันทึก & เปิดกรอก Pre-Op ทันที
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { key: 'all', label: 'ทั้งหมด' },
                  { key: 'upcoming', label: 'กำลังจะถึง' },
                  { key: 'today', label: 'วันนี้' },
                  { key: 'tomorrow', label: 'พรุ่งนี้' },
                  { key: 'pending_preop', label: 'รอเยี่ยม Pre-Op' },
                  { key: 'past', label: 'ย้อนหลัง' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDateScope(tab.key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    dateScope === tab.key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setCaseTypeScope('elective')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  caseTypeScope === 'elective'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เฉพาะ Elective ({counts.electiveTotal})
              </button>
              <button
                type="button"
                onClick={() => setCaseTypeScope('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  caseTypeScope === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รวม Emergency ({counts.allTotal})
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหา ชื่อ, HN, OR, แพทย์..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-800 w-48 sm:w-56"
              />
            </div>

            <div className="flex items-center gap-1">
              <input
                type="date"
                aria-label="กรองเฉพาะวันที่ผ่าตัด"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className={`${inputBase} font-mono tabular-nums`}
              />
              {specificDate && (
                <button
                  type="button"
                  onClick={() => setSpecificDate('')}
                  title="ล้างการกรองวันที่"
                  className="p-1.5 text-slate-400 hover:text-slate-700 border border-slate-300 rounded-lg bg-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              aria-label="กรองห้องผ่าตัด"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className={inputBase}
            >
              <option value="ALL">ทุกห้อง OR</option>
              {orRoomChoices.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowDownUp className="w-3.5 h-3.5 text-blue-800" />
              {sortDirection === 'asc' ? 'วันผ่าตัด: ใกล้ → ไกล' : 'วันผ่าตัด: ล่าสุด → เก่า'}
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Schedule List */}
      {groupedByDate.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-800">
            ยังไม่มีเคสนัดผ่าตัดตามเงื่อนไขที่เลือก
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            กดปุ่มด้านล่างเพื่อเตรียมใบเยี่ยม Pre-Op ล่วงหน้าตามวันผ่าตัดในตาราง Elective Case
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => openQuickCreateForDate(tomorrow)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
              เตรียมใบเยี่ยม Pre-Op ล่วงหน้า (วันพรุ่งนี้)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map((group) => {
            const isUnspecified = group.date === '__UNSPECIFIED__';
            const dateMeta = isUnspecified
              ? { label: 'ยังไม่ระบุวันที่ผ่าตัด', relativeTag: '' }
              : formatThaiScheduleDate(group.date);
            const pendingInGroup = group.items.filter((i) => i.status === 'draft').length;
            const doneInGroup = group.items.length - pendingInGroup;

            return (
              <section
                key={group.date}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                {/* Date Group Header */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-sm font-bold text-slate-900">{dateMeta.label}</span>
                    {!isUnspecified && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="font-mono tabular-nums text-slate-600">
                          {group.date}
                        </span>
                      </>
                    )}
                    {dateMeta.relativeTag && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span
                          className={`font-semibold ${
                            dateMeta.relativeTag === 'วันนี้'
                              ? 'text-blue-800'
                              : dateMeta.relativeTag === 'พรุ่งนี้'
                              ? 'text-emerald-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {dateMeta.relativeTag}
                        </span>
                      </>
                    )}
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="text-slate-600 tabular-nums">
                      ทั้งหมด {group.items.length} เคส · รอเยี่ยม {pendingInGroup} · ประเมินแล้ว{' '}
                      {doneInGroup}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isUnspecified && (
                      <button
                        type="button"
                        onClick={() => openQuickCreateForDate(group.date)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-800 bg-white border border-slate-300 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        เพิ่มเคสวันนี้
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        exportEvaluationsCsv(
                          group.items,
                          `bangplee_or_${isUnspecified ? 'unscheduled' : group.date}`,
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      CSV วันนี้
                    </button>
                  </div>
                </div>

                {/* Cases Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="py-2 px-4 font-semibold whitespace-nowrap">OR / คิว / เวลา</th>
                        <th className="py-2 px-4 font-semibold whitespace-nowrap">HN / AN</th>
                        <th className="py-2 px-4 font-semibold">ผู้ป่วย · Ward</th>
                        <th className="py-2 px-4 font-semibold">Diagnosis / Operation · แพทย์</th>
                        <th className="py-2 px-4 font-semibold">สถานะ Pre-Op / แผน</th>
                        <th className="py-2 px-4 font-semibold text-right">จัดการใบเยี่ยม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.items.map((r) => {
                        const summary = computeClinicalSummary(r);
                        const st = statusLabel(r);
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
                                {r.orRoom || 'ไม่ระบุห้อง'}
                                {r.caseOrder ? ` · #${r.caseOrder}` : ''}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {r.operationTime || 'ไม่ระบุเวลา'}
                                {isEmergency ? (
                                  <span className="text-red-700 font-semibold"> · Emergency</span>
                                ) : (
                                  <span> · Elective</span>
                                )}
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
                              <div className="text-[11px] text-slate-500">
                                {r.ward || 'ไม่ระบุหอผู้ป่วย'}
                                {r.dateOfVisit ? ` · เยี่ยม ${r.dateOfVisit}` : ' · ยังไม่ลงวันเยี่ยม'}
                              </div>
                            </td>

                            <td className="py-2.5 px-4 max-w-xs">
                              <div className="font-medium text-slate-900 truncate">
                                {r.operation || r.diagnosis || 'ยังไม่ระบุหัตถการ'}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {r.diagnosis && r.operation ? `${r.diagnosis} · ` : ''}
                                {r.surgeon || 'ไม่ระบุแพทย์ผ่าตัด'}
                              </div>
                            </td>

                            <td className="py-2.5 px-4">
                              <div className={`font-semibold ${st.cls}`}>{st.text}</div>
                              <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                                {r.asaClass ? `${summary.asaLabel} · ` : ''}
                                {summary.planSummary}
                              </div>
                            </td>

                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => onEdit(r)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                                    r.status === 'draft'
                                      ? 'text-white bg-blue-800 hover:bg-blue-900'
                                      : 'text-blue-800 bg-blue-50 hover:bg-blue-100'
                                  }`}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  {r.status === 'draft' ? 'บันทึกการเยี่ยม' : 'เปิดแก้ไข'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onPrintRecord(r)}
                                  title="พิมพ์ใบเยี่ยม 1 หน้า A4"
                                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDuplicate(r)}
                                  title="คัดลอกเป็นรายการใหม่"
                                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteRecord(r)}
                                  title="ลบรายการ"
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
              </section>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteRecord && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-5 space-y-4 shadow-lg">
            <h3 className="text-base font-semibold text-slate-900">
              ยืนยันการลบข้อมูลนัดผ่าตัดและใบเยี่ยม Pre-Op
            </h3>
            <p className="text-sm text-slate-600">
              ต้องการลบข้อมูลของ <strong>{confirmDeleteRecord.patientName}</strong> (วันผ่าตัด:{' '}
              <span className="font-mono">{confirmDeleteRecord.dateOfOperation || '—'}</span>)
              ใช่หรือไม่? การลบนี้ไม่สามารถย้อนกลับได้
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
