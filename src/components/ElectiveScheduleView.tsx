import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Copy,
  Download,
  Edit3,
  FilePlus2,
  Plus,
  Printer,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import {
  addDaysToIsoDate,
  compareByDateAndSurgeon,
  compareElectiveSchedule,
  computeClinicalSummary,
  formatThaiScheduleDate,
  getEffectiveScheduleType,
  getTodayIsoDate,
  OR_ROOM_OPTIONS,
  PreAnestheticEvaluation,
} from '../types/evaluation';
import { exportEvaluationsCsv } from '../utils/exportReports';

interface ElectiveScheduleViewProps {
  records: PreAnestheticEvaluation[];
  activeId: string;
  wardOptions: string[];
  surgeonOptions: string[];
  isLoading: boolean;
  onEdit: (record: PreAnestheticEvaluation) => void;
  onDuplicate: (record: PreAnestheticEvaluation) => void;
  onDelete: (recordId: string) => Promise<void>;
  onPrintRecord: (record: PreAnestheticEvaluation) => void;
  onCreateNew: () => void;
  onCreateNewForDate: (dateOfOperation: string, orRoom?: string, surgeon?: string) => void;
}

type DateScope = 'all' | 'upcoming' | 'today' | 'tomorrow' | 'pending_preop' | 'past';
type CaseTypeScope = 'all' | 'elective';
type GroupMode = 'date_surgeon' | 'date_or';

export function ElectiveScheduleView({
  records,
  activeId,
  wardOptions,
  surgeonOptions,
  isLoading,
  onEdit,
  onDuplicate,
  onDelete,
  onPrintRecord,
  onCreateNew,
  onCreateNewForDate,
}: ElectiveScheduleViewProps) {
  const today = getTodayIsoDate();
  const tomorrow = addDaysToIsoDate(today, 1);

  const [dateScope, setDateScope] = useState<DateScope>('all');
  const [caseTypeScope, setCaseTypeScope] = useState<CaseTypeScope>('all');
  const [groupMode, setGroupMode] = useState<GroupMode>('date_surgeon');
  const [specificDate, setSpecificDate] = useState('');
  const [surgeonFilter, setSurgeonFilter] = useState('ALL');
  const [wardFilter, setWardFilter] = useState('ALL');
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

  const surgeonChoices = useMemo(() => {
    const set = new Set<string>(surgeonOptions);
    records.forEach((r) => {
      if (r.surgeon?.trim()) set.add(r.surgeon.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [records, surgeonOptions]);

  const wardChoices = useMemo(() => {
    const set = new Set<string>(wardOptions);
    records.forEach((r) => {
      if (r.ward?.trim()) set.add(r.ward.trim());
    });
    return Array.from(set);
  }, [records, wardOptions]);

  const counts = useMemo(() => {
    const electiveList = records.filter((r) => getEffectiveScheduleType(r) === 'elective');
    const emergencyList = records.filter((r) => getEffectiveScheduleType(r) === 'emergency');
    const upcomingCount = records.filter((r) => (r.dateOfOperation || '').trim() >= today).length;
    const todayCount = records.filter((r) => (r.dateOfOperation || '').trim() === today).length;
    const tomorrowCount = records.filter(
      (r) => (r.dateOfOperation || '').trim() === tomorrow,
    ).length;
    const pendingCount = records.filter((r) => r.status === 'draft').length;
    const evaluatedCount = records.filter(
      (r) => r.status === 'evaluated' || r.status === 'post_op_completed' || r.status === 'locked',
    ).length;
    const uniqueDates = new Set(
      records.map((r) => (r.dateOfOperation || '').trim()).filter(Boolean),
    );
    return {
      electiveTotal: electiveList.length,
      emergencyTotal: emergencyList.length,
      allTotal: records.length,
      upcomingCount,
      todayCount,
      tomorrowCount,
      pendingCount,
      evaluatedCount,
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

      if (surgeonFilter !== 'ALL') {
        const s = (r.surgeon || '').trim() || '__NONE__';
        if (s !== surgeonFilter) return false;
      }
      if (wardFilter !== 'ALL' && (r.ward || '').trim() !== wardFilter) return false;
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

    return [...filtered].sort((a, b) =>
      groupMode === 'date_surgeon'
        ? compareByDateAndSurgeon(a, b, sortDirection)
        : compareElectiveSchedule(a, b, sortDirection),
    );
  }, [
    records,
    caseTypeScope,
    specificDate,
    dateScope,
    today,
    tomorrow,
    surgeonFilter,
    wardFilter,
    roomFilter,
    searchQuery,
    sortDirection,
    groupMode,
  ]);

  const groupedByDate = useMemo(() => {
    const groups: {
      date: string;
      items: PreAnestheticEvaluation[];
      surgeonGroups: { surgeon: string; isUnspecified: boolean; items: PreAnestheticEvaluation[] }[];
    }[] = [];
    const indexByDate = new Map<string, number>();

    for (const item of filteredAndSorted) {
      const key = (item.dateOfOperation || '').trim() || '__UNSPECIFIED__';
      let existingIdx = indexByDate.get(key);
      if (existingIdx === undefined) {
        existingIdx = groups.length;
        indexByDate.set(key, existingIdx);
        groups.push({ date: key, items: [], surgeonGroups: [] });
      }
      const grp = groups[existingIdx];
      grp.items.push(item);

      const rawSurgeon = (item.surgeon || '').trim();
      const surgLabel = rawSurgeon || 'ยังไม่ระบุแพทย์ผ่าตัด';
      let sGrp = grp.surgeonGroups.find((sg) => sg.surgeon === surgLabel);
      if (!sGrp) {
        sGrp = { surgeon: surgLabel, isUnspecified: !rawSurgeon, items: [] };
        grp.surgeonGroups.push(sGrp);
      }
      sGrp.items.push(item);
    }
    return groups;
  }, [filteredAndSorted]);

  const statusLabel = (r: PreAnestheticEvaluation) => {
    switch (r.status) {
      case 'post_op_completed':
        return { text: 'เยี่ยม Post-Op แล้ว', cls: 'text-emerald-800' };
      case 'evaluated':
        return { text: 'เยี่ยม Pre-Op แล้ว', cls: 'text-blue-800' };
      case 'locked':
        return { text: 'ปิดบันทึกแล้ว', cls: 'text-slate-700' };
      default:
        return { text: 'บันทึกข้อมูลบางส่วน (รอไปเยี่ยมที่หอผู้ป่วย)', cls: 'text-amber-700' };
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

  const renderCaseRow = (r: PreAnestheticEvaluation) => {
    const summary = computeClinicalSummary(r);
    const st = statusLabel(r);
    const isActive = r.id === activeId;
    const isEmergency = getEffectiveScheduleType(r) === 'emergency';

    return (
      <tr
        key={r.id}
        className={`hover:bg-slate-50 transition-colors ${isActive ? 'bg-blue-50/40' : ''}`}
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
            {r.age ? <span className="font-normal text-slate-600">({r.age} ปี)</span> : null}
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
            {r.surgeon || 'ยังไม่ระบุแพทย์ผ่าตัด'}
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
              {r.status === 'draft' ? 'เปิดฟอร์มกรอกต่อ' : 'เปิดแก้ไข'}
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
  };

  return (
    <div className="space-y-4">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">ใบเยี่ยมที่จัดเก็บทั้งหมด</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {counts.allTotal}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            แยกเก็บ {counts.dateCount} วันผ่าตัด · ที่กำลังจะถึง {counts.upcomingCount} ราย
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">วันผ่าตัดวันนี้ / พรุ่งนี้</div>
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
          <div className="text-xs font-medium text-slate-500">บันทึกไว้ล่วงหน้า (รอไปเยี่ยม)</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-amber-700">
            {counts.pendingCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            เปิดฟอร์มกรอกต่อเมื่อไปเยี่ยมผู้ป่วยที่หอผู้ป่วย
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">เยี่ยมประเมิน Pre-Op แล้ว</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {counts.evaluatedCount}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            Elective {counts.electiveTotal} · Emergency {counts.emergencyTotal}
          </div>
        </div>
      </div>

      {/* Top Action & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              แฟ้มจัดเก็บใบเยี่ยม Pre-Op ล่วงหน้า (เรียงตามวันที่ผ่าตัดและแพทย์ผ่าตัด)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              กดสร้างใบเยี่ยมใหม่เพื่อเปิดฟอร์มเต็ม กรอกข้อมูลบางส่วนเก็บไว้ล่วงหน้า แล้วค้นหาตามวันที่ผ่าตัด แพทย์ผ่าตัด หรือหอผู้ป่วยเพื่อไปเยี่ยมต่อ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              สร้างใบเยี่ยมใหม่ (เปิดฟอร์มเต็ม)
            </button>
            <button
              type="button"
              onClick={() => onCreateNewForDate(tomorrow)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-blue-800" />
              เปิดฟอร์มเต็ม (ผ่าตัดพรุ่งนี้)
            </button>
            <button
              type="button"
              onClick={() =>
                exportEvaluationsCsv(filteredAndSorted, 'bangplee_preop_schedule_by_date')
              }
              disabled={filteredAndSorted.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-blue-800" />
              ส่งออก CSV
            </button>
          </div>
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { key: 'all', label: 'ทั้งหมด' },
                  { key: 'upcoming', label: 'กำลังจะถึง' },
                  { key: 'today', label: 'วันนี้' },
                  { key: 'tomorrow', label: 'พรุ่งนี้' },
                  { key: 'pending_preop', label: 'รอไปเยี่ยม' },
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
                onClick={() => setGroupMode('date_surgeon')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  groupMode === 'date_surgeon'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                จัดกลุ่ม: วันผ่าตัด → แพทย์
              </button>
              <button
                type="button"
                onClick={() => setGroupMode('date_or')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  groupMode === 'date_or'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                จัดกลุ่ม: วันผ่าตัด → ห้อง OR
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setCaseTypeScope('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  caseTypeScope === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทุกเคส ({counts.allTotal})
              </button>
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
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหา ชื่อ, HN, แพทย์, หัตถการ..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-800 w-44 sm:w-52"
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
              aria-label="กรองตามแพทย์ผ่าตัด"
              value={surgeonFilter}
              onChange={(e) => setSurgeonFilter(e.target.value)}
              className={inputBase}
            >
              <option value="ALL">ทุกแพทย์ผ่าตัด</option>
              {surgeonChoices.map((s) => (
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
              className={inputBase}
            >
              <option value="ALL">ทุกหอผู้ป่วย</option>
              {wardChoices.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>

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
            ยังไม่มีใบเยี่ยมที่จัดเก็บตามเงื่อนไขที่เลือก
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            กดปุ่มด้านล่างเพื่อเลือกวันผ่าตัดและแพทย์ผ่าตัด แล้วเปิดฟอร์มเต็มเพื่อบันทึกข้อมูลล่วงหน้าไว้ไปเยี่ยมผู้ป่วยที่หอผู้ป่วย
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors"
            >
              <FilePlus2 className="w-4 h-4" />
              สร้างใบเยี่ยมใหม่ (เปิดฟอร์มเต็ม)
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
                        <span className="font-mono tabular-nums text-slate-600">{group.date}</span>
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
                      ทั้งหมด {group.items.length} เคส · รอไปเยี่ยม {pendingInGroup} · เยี่ยมแล้ว{' '}
                      {doneInGroup}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isUnspecified && (
                      <button
                        type="button"
                        onClick={() => onCreateNewForDate(group.date)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-800 bg-white border border-slate-300 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        เปิดฟอร์มเต็มสำหรับวันนี้
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
                        <th className="py-2 px-4 font-semibold">ผู้ป่วย · หอผู้ป่วย</th>
                        <th className="py-2 px-4 font-semibold">หัตถการ · แพทย์ผ่าตัด</th>
                        <th className="py-2 px-4 font-semibold">สถานะใบเยี่ยม / แผน</th>
                        <th className="py-2 px-4 font-semibold text-right">จัดการใบเยี่ยม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupMode === 'date_surgeon'
                        ? group.surgeonGroups.map((sGrp) => (
                            <React.Fragment key={sGrp.surgeon}>
                              <tr className="bg-slate-50/60 border-t border-slate-200">
                                <td colSpan={6} className="py-1.5 px-4">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <UserRound className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                                      <span className="font-semibold text-slate-900">
                                        แพทย์ผ่าตัด: {sGrp.surgeon}
                                      </span>
                                      <span className="text-slate-500 tabular-nums">
                                        · {sGrp.items.length} เคส
                                      </span>
                                    </div>
                                    {!isUnspecified && !sGrp.isUnspecified && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onCreateNewForDate(group.date, undefined, sGrp.surgeon)
                                        }
                                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-blue-800 bg-white border border-slate-300 rounded hover:bg-blue-50 transition-colors"
                                      >
                                        <Plus className="w-3 h-3" />
                                        เพิ่มเคสแพทย์นี้
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {sGrp.items.map(renderCaseRow)}
                            </React.Fragment>
                          ))
                        : group.items.map(renderCaseRow)}
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
              ยืนยันการลบข้อมูลใบเยี่ยม Pre-Op
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
