import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  Building2,
  Calendar,
  CheckSquare,
  ClipboardCheck,
  CloudDownload,
  Copy,
  Database,
  Download,
  Edit3,
  Eye,
  FileCode2,
  FilePlus2,
  LogIn,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  Square,
  Trash2,
  Upload,
  UploadCloud,
  UserRound,
  X,
  XSquare,
} from 'lucide-react';
import {
  addDaysToIsoDate,
  compareByDateAndSurgeon,
  compareElectiveSchedule,
  computeClinicalSummary,
  formatBloodGroup,
  formatPostponementReasons,
  formatPreOpNotVisitedReasons,
  formatShortThaiDate,
  formatThaiScheduleDate,
  formatWardWithBed,
  getEffectiveEvaluationStatus,
  getEffectiveScheduleType,
  getPostOpVisitCompleteness,
  getTodayIsoDate,
  isPostOpVisited,
  isPreOpDraftNotVisited,
  isPreOpVisited,
  isSurgeryPostponed,
  matchesEvaluationSearch,
  OR_ROOM_OPTIONS,
  PreAnestheticEvaluation,
} from '../types/evaluation';
import {
  exportAllEvaluationsJson,
  exportEvaluationsCsv,
  exportSingleHtmlReport,
} from '../utils/exportReports';
import {
  downloadPrintableHtmlFile,
  tryPrintViaHiddenIframe,
} from '../utils/hospitalPrintEngine';
import { A4PrintSheet } from './A4PrintSheet';
import { ThaiDateInput } from './ThaiDateInput';

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
  wardOptions: string[];
  surgeonOptions: string[];
  isLoading?: boolean;
  userEmail?: string | null;
  cloudCount?: number;
  unsyncedLocalCount?: number;
  isSyncingLocal?: boolean;
  isPullingCloud?: boolean;
  focusSearchNonce?: number;
  unsavedCurrentForm?: PreAnestheticEvaluation | null;
  onSaveCurrentForm?: () => void;
  onSignIn?: () => void;
  onSyncLocalToCloud?: () => void;
  onPullFromCloud?: () => void;
  onImportJsonFile?: (file: File) => void;
  onEdit: (record: PreAnestheticEvaluation) => void;
  onOpenPostOp?: (record: PreAnestheticEvaluation) => void;
  onDuplicate: (record: PreAnestheticEvaluation) => void;
  onDelete: (recordId: string) => Promise<void>;
  onPrintRecord: (record: PreAnestheticEvaluation) => void;
  onCreateNew: () => void;
  onCreateNewForDate?: (dateOfOperation: string, orRoom?: string, surgeon?: string) => void;
}

type DateScope = 'all' | 'upcoming' | 'today' | 'tomorrow' | 'past';
type SortGroupMode =
  | 'op_ward_desc'
  | 'op_ward_asc'
  | 'ward_name'
  | 'op_or_asc'
  | 'op_surgeon_desc'
  | 'op_surgeon_asc'
  | 'op_desc'
  | 'updated';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function compareWardOrder(wardA: string, wardB: string, wardOptions: string[]): number {
  const wA = (wardA || '').trim();
  const wB = (wardB || '').trim();
  if (wA === wB) return 0;
  if (!wA) return 1;
  if (!wB) return -1;
  const idxA = wardOptions.indexOf(wA);
  const idxB = wardOptions.indexOf(wB);
  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
  if (idxA !== -1) return -1;
  if (idxB !== -1) return 1;
  return wA.localeCompare(wB, 'th');
}

function compareByPatientNameAndBed(a: PreAnestheticEvaluation, b: PreAnestheticEvaluation): number {
  const nameA = (a.patientName || '').trim();
  const nameB = (b.patientName || '').trim();
  if (nameA && !nameB) return -1;
  if (!nameA && nameB) return 1;
  const cmpName = nameA.localeCompare(nameB, 'th');
  if (cmpName !== 0) return cmpName;
  const bedCmp = (a.bed || '').trim().localeCompare((b.bed || '').trim(), 'th', { numeric: true });
  if (bedCmp !== 0) return bedCmp;
  return (a.hn || '').localeCompare(b.hn || '', 'th', { numeric: true });
}

export function RegistryView({
  records,
  activeId,
  wardOptions,
  surgeonOptions,
  isLoading = false,
  userEmail,
  cloudCount = 0,
  unsyncedLocalCount = 0,
  isSyncingLocal = false,
  isPullingCloud = false,
  focusSearchNonce = 0,
  unsavedCurrentForm,
  onSaveCurrentForm,
  onSignIn,
  onSyncLocalToCloud,
  onPullFromCloud,
  onImportJsonFile,
  onEdit,
  onOpenPostOp,
  onDuplicate,
  onDelete,
  onPrintRecord,
  onCreateNew,
  onCreateNewForDate,
}: RegistryViewProps) {
  const today = getTodayIsoDate();
  const tomorrow = addDaysToIsoDate(today, 1);

  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateScope, setDateScope] = useState<DateScope>('all');
  const [statusFilter, setStatusFilter] = useState<
    | 'ALL'
    | 'draft'
    | 'not_visited'
    | 'postponed'
    | 'evaluated'
    | 'not_post_op'
    | 'post_op_completed'
    | 'both_done'
  >('ALL');
  const [scheduleFilter, setScheduleFilter] = useState<'ALL' | 'elective' | 'emergency'>('ALL');
  const [surgeonFilter, setSurgeonFilter] = useState('ALL');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [dateField, setDateField] = useState<'all' | 'operation' | 'visit' | 'post_op'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortMode, setSortMode] = useState<SortGroupMode>('op_ward_desc');
  const [previewRecord, setPreviewRecord] = useState<PreAnestheticEvaluation | null>(null);
  const livePreviewRecord = useMemo(() => {
    if (!previewRecord) return null;
    return records.find((r) => r.id === previewRecord.id) ?? previewRecord;
  }, [previewRecord, records]);
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState<PreAnestheticEvaluation | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (focusSearchNonce > 0) {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }
  }, [focusSearchNonce]);

  const hasActiveSearchOrFilter = Boolean(
    searchQuery.trim() ||
      dateScope !== 'all' ||
      dateFrom ||
      dateTo ||
      statusFilter !== 'ALL' ||
      scheduleFilter !== 'ALL' ||
      surgeonFilter !== 'ALL' ||
      wardFilter !== 'ALL' ||
      roomFilter !== 'ALL',
  );

  const resetAllFilters = () => {
    setSearchQuery('');
    setDateScope('all');
    setDateField('all');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('ALL');
    setScheduleFilter('ALL');
    setSurgeonFilter('ALL');
    setWardFilter('ALL');
    setRoomFilter('ALL');
  };

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

  const availableOrRooms = useMemo(() => {
    const set = new Set<string>(OR_ROOM_OPTIONS);
    records.forEach((r) => {
      if (r.orRoom?.trim()) set.add(r.orRoom.trim());
    });
    return Array.from(set);
  }, [records]);

  const registryCounts = useMemo(() => {
    let draft = 0;
    let notVisited = 0;
    let postponed = 0;
    let preOpDone = 0;
    let postOpDone = 0;
    let bothDone = 0;
    let todayCount = 0;
    let tomorrowCount = 0;
    let upcomingCount = 0;
    const uniqueDates = new Set<string>();

    for (const r of records) {
      const opDate = (r.dateOfOperation || '').trim();
      if (opDate) {
        uniqueDates.add(opDate);
        if (opDate === today) todayCount += 1;
        if (opDate === tomorrow) tomorrowCount += 1;
        if (opDate >= today) upcomingCount += 1;
      }
      const preDone = isPreOpVisited(r);
      const postDone = isPostOpVisited(r);
      const isMarkedNotVisited = isPreOpDraftNotVisited(r);

      if (!preDone && !isMarkedNotVisited) draft += 1;
      if (isMarkedNotVisited) notVisited += 1;
      if (isSurgeryPostponed(r)) postponed += 1;
      if (preDone) preOpDone += 1;
      if (postDone) postOpDone += 1;
      if (preDone && postDone) bothDone += 1;
    }

    return {
      total: records.length,
      draft,
      notVisited,
      postponed,
      preOpDone,
      postOpDone,
      notPostOp: records.length - postOpDone,
      bothDone,
      todayCount,
      tomorrowCount,
      upcomingCount,
      dateCount: uniqueDates.size,
    };
  }, [records, today, tomorrow]);

  const filtered = useMemo(() => {
    const list = records.filter((r) => {
      const opDate = (r.dateOfOperation || '').trim();
      if (dateScope === 'upcoming' && (!opDate || opDate < today)) return false;
      if (dateScope === 'today' && opDate !== today) return false;
      if (dateScope === 'tomorrow' && opDate !== tomorrow) return false;
      if (dateScope === 'past' && (!opDate || opDate >= today)) return false;

      const preDone = isPreOpVisited(r);
      const postDone = isPostOpVisited(r);
      const isMarkedNotVisited = isPreOpDraftNotVisited(r);

      if (statusFilter === 'draft' && (preDone || isMarkedNotVisited)) return false;
      if (statusFilter === 'not_visited' && !isMarkedNotVisited) return false;
      if (statusFilter === 'postponed' && !isSurgeryPostponed(r)) return false;
      if (statusFilter === 'evaluated' && !preDone) return false;
      if (statusFilter === 'not_post_op' && postDone) return false;
      if (statusFilter === 'post_op_completed' && !postDone) return false;
      if (statusFilter === 'both_done' && !(preDone && postDone)) return false;

      if (scheduleFilter !== 'ALL' && getEffectiveScheduleType(r) !== scheduleFilter) return false;
      if (surgeonFilter !== 'ALL') {
        const s = (r.surgeon || '').trim() || '__NONE__';
        if (s !== surgeonFilter) return false;
      }
      if (wardFilter !== 'ALL' && (r.ward || '').trim() !== wardFilter) return false;
      if (roomFilter !== 'ALL' && (r.orRoom || '').trim() !== roomFilter) return false;

      if (dateFrom || dateTo) {
        const visitDate = (r.dateOfVisit || '').trim();
        const labDates = [
          (r.formData?.laboratory?.cbcDate || '').trim(),
          (r.formData?.laboratory?.chemDate || '').trim(),
          (r.formData?.laboratory?.labDate || '').trim(),
        ].filter(Boolean);
        const postOpDates = [
          (r.formData?.postAnesthesia?.visitDate || '').trim(),
          (r.formData?.postOpComplication?.postOpDate || '').trim(),
          (r.formData?.postOpComplication?.periOpDate || '').trim(),
        ].filter(Boolean);

        const candidateDates =
          dateField === 'operation'
            ? [opDate].filter(Boolean)
            : dateField === 'visit'
            ? [visitDate].filter(Boolean)
            : dateField === 'post_op'
            ? postOpDates
            : [opDate, visitDate, ...postOpDates, ...labDates].filter(Boolean);

        if (candidateDates.length === 0) return false;

        const matchesDate = candidateDates.some((d) => {
          if (dateFrom && dateTo) {
            const start = dateFrom <= dateTo ? dateFrom : dateTo;
            const end = dateFrom <= dateTo ? dateTo : dateFrom;
            return d >= start && d <= end;
          }
          if (dateFrom) return d === dateFrom;
          if (dateTo) return d <= dateTo;
          return true;
        });
        if (!matchesDate) return false;
      }

      return matchesEvaluationSearch(r, searchQuery);
    });

    if (sortMode === 'op_ward_desc' || sortMode === 'op_ward_asc') {
      const dir = sortMode === 'op_ward_desc' ? -1 : 1;
      return [...list].sort((a, b) => {
        const dA = (a.dateOfOperation || '').trim();
        const dB = (b.dateOfOperation || '').trim();
        if (dA !== dB) {
          if (!dA) return 1;
          if (!dB) return -1;
          return dA.localeCompare(dB) * dir;
        }
        const wCmp = compareWardOrder(a.ward || '', b.ward || '', wardOptions);
        if (wCmp !== 0) return wCmp;
        return compareByPatientNameAndBed(a, b);
      });
    }
    if (sortMode === 'ward_name') {
      return [...list].sort((a, b) => {
        const wCmp = compareWardOrder(a.ward || '', b.ward || '', wardOptions);
        if (wCmp !== 0) return wCmp;
        return compareByPatientNameAndBed(a, b);
      });
    }
    if (sortMode === 'op_surgeon_desc') {
      return [...list].sort((a, b) => compareByDateAndSurgeon(a, b, 'desc'));
    }
    if (sortMode === 'op_surgeon_asc') {
      return [...list].sort((a, b) => compareByDateAndSurgeon(a, b, 'asc'));
    }
    if (sortMode === 'op_or_asc') {
      return [...list].sort((a, b) => compareElectiveSchedule(a, b, 'asc'));
    }
    if (sortMode === 'op_desc') {
      return [...list].sort((a, b) => compareElectiveSchedule(a, b, 'desc'));
    }
    return [...list].sort((a, b) => getUpdatedMillis(b.updatedAt) - getUpdatedMillis(a.updatedAt));
  }, [
    records,
    dateScope,
    today,
    tomorrow,
    searchQuery,
    statusFilter,
    scheduleFilter,
    surgeonFilter,
    wardFilter,
    roomFilter,
    dateField,
    dateFrom,
    dateTo,
    sortMode,
    wardOptions,
  ]);

  const filteredChecklistSummary = useMemo(() => {
    let preDone = 0;
    let preNotVisited = 0;
    let postDone = 0;
    let bothDone = 0;
    for (const r of filtered) {
      const pre = isPreOpVisited(r);
      const post = isPostOpVisited(r);
      if (pre) preDone += 1;
      else if (isPreOpDraftNotVisited(r)) preNotVisited += 1;
      if (post) postDone += 1;
      if (pre && post) bothDone += 1;
    }
    return {
      total: filtered.length,
      preDone,
      prePending: filtered.length - preDone - preNotVisited,
      preNotVisited,
      postDone,
      postPending: filtered.length - postDone,
      bothDone,
    };
  }, [filtered]);

  const showWardSubgroups = sortMode === 'op_ward_desc' || sortMode === 'op_ward_asc';
  const showSurgeonSubgroups = sortMode === 'op_surgeon_desc' || sortMode === 'op_surgeon_asc';

  const groupedByWard = useMemo(() => {
    if (sortMode !== 'ward_name') return null;
    const map = new Map<string, PreAnestheticEvaluation[]>();
    for (const item of filtered) {
      const key = (item.ward || '').trim() || '__UNSPECIFIED__';
      const arr = map.get(key);
      if (arr) arr.push(item);
      else map.set(key, [item]);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      wardKey: key,
      wardLabel: key === '__UNSPECIFIED__' ? 'ไม่ระบุหอผู้ป่วย' : key,
      isUnspecified: key === '__UNSPECIFIED__',
      items,
      preDone: items.filter((r) => isPreOpVisited(r)).length,
      postDone: items.filter((r) => isPostOpVisited(r)).length,
    }));
  }, [filtered, sortMode]);

  const groupedByDate = useMemo(() => {
    if (sortMode === 'updated' || sortMode === 'ward_name') return null;
    const groups: {
      date: string;
      items: PreAnestheticEvaluation[];
      wardGroups: { ward: string; isUnspecified: boolean; items: PreAnestheticEvaluation[] }[];
      surgeonGroups: { surgeon: string; isUnspecified: boolean; items: PreAnestheticEvaluation[] }[];
    }[] = [];
    const idxByDate = new Map<string, number>();

    for (const item of filtered) {
      const key = (item.dateOfOperation || '').trim() || '__UNSPECIFIED__';
      let idx = idxByDate.get(key);
      if (idx === undefined) {
        idx = groups.length;
        idxByDate.set(key, idx);
        groups.push({ date: key, items: [], wardGroups: [], surgeonGroups: [] });
      }
      const grp = groups[idx];
      grp.items.push(item);

      const rawWard = (item.ward || '').trim();
      const wardLabel = rawWard || 'ไม่ระบุหอผู้ป่วย';
      let wGrp = grp.wardGroups.find((wg) => wg.ward === wardLabel);
      if (!wGrp) {
        wGrp = { ward: wardLabel, isUnspecified: !rawWard, items: [] };
        grp.wardGroups.push(wGrp);
      }
      wGrp.items.push(item);

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
  }, [filtered, sortMode]);

  const handlePrintChecklist = async () => {
    if (filtered.length === 0) return;

    // Group by ward (same ward together, flat by patient name) for ward round printing
    const wardMap = new Map<string, PreAnestheticEvaluation[]>();
    for (const r of filtered) {
      const key = (r.ward || '').trim() || '__UNSPECIFIED__';
      const arr = wardMap.get(key);
      if (arr) arr.push(r);
      else wardMap.set(key, [r]);
    }
    const sortedWards = Array.from(wardMap.entries()).sort(([wA], [wB]) => {
      if (wA === '__UNSPECIFIED__') return 1;
      if (wB === '__UNSPECIFIED__') return -1;
      const idxA = wardOptions.indexOf(wA);
      const idxB = wardOptions.indexOf(wB);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return wA.localeCompare(wB, 'th');
    });

    const sectionsHtml = sortedWards
      .map(([wKey, items]) => {
        const sortedItems = [...items].sort(compareByPatientNameAndBed);
        const wardTitle = wKey === '__UNSPECIFIED__' ? 'ไม่ระบุหอผู้ป่วย' : wKey;
        const preCount = sortedItems.filter((r) => isPreOpVisited(r)).length;
        const postCount = sortedItems.filter((r) => isPostOpVisited(r)).length;

        const rowsHtml = sortedItems
          .map((r, i) => {
            const preDone = isPreOpVisited(r);
            const preNot = isPreOpDraftNotVisited(r);
            const postDone = isPostOpVisited(r);
            const postDate =
              (r.formData?.postAnesthesia?.visitDate || '').trim() ||
              (r.formData?.postOpComplication?.postOpDate || '').trim();
            const preCell = preDone
              ? `<span style="color:#047857;font-weight:700;">☑ เยี่ยมแล้ว</span>${
                  r.dateOfVisit ? `<br/><span style="font-size:10px;color:#475569;">${escapeHtml(formatShortThaiDate(r.dateOfVisit))}</span>` : ''
                }`
              : preNot
              ? `<span style="color:#be123c;font-weight:700;">✕ ไม่ได้เยี่ยม</span>`
              : `<span style="color:#b45309;font-weight:600;">☐ ยังไม่เยี่ยม</span>`;
            const postCell = postDone
              ? `<span style="color:#047857;font-weight:700;">☑ เยี่ยมแล้ว</span>${
                  postDate ? `<br/><span style="font-size:10px;color:#475569;">${escapeHtml(formatShortThaiDate(postDate))}</span>` : ''
                }`
              : `<span style="color:#475569;">☐ ยังไม่เยี่ยม</span>`;

            return `<tr>
              <td style="text-align:center;">${i + 1}</td>
              <td><strong>${escapeHtml(r.patientName || 'ยังไม่ระบุชื่อ')}</strong>${
                r.age ? ` <span style="color:#475569;">(${escapeHtml(r.age)} ปี)</span>` : ''
              }</td>
              <td style="white-space:nowrap;">${escapeHtml(r.bed ? `เตียง ${r.bed}` : '—')}<br/><span style="font-size:10px;color:#475569;">HN ${escapeHtml(r.hn || '—')}</span></td>
              <td>${escapeHtml(r.operation || r.diagnosis || '—')}<br/><span style="font-size:10px;color:#475569;">ผ่าตัด: ${
                r.dateOfOperation ? escapeHtml(formatShortThaiDate(r.dateOfOperation)) : 'ยังไม่ระบุ'
              }${r.orRoom ? ` · ${escapeHtml(r.orRoom)}` : ''}</span></td>
              <td style="text-align:center;white-space:nowrap;">${preCell}</td>
              <td style="text-align:center;white-space:nowrap;">${postCell}</td>
            </tr>`;
          })
          .join('');

        return `<div style="margin-bottom:14px;break-inside:avoid;">
          <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-bottom:none;padding:6px 10px;font-weight:700;font-size:12px;display:flex;justify-content:space-between;">
            <span>หอผู้ป่วย: ${escapeHtml(wardTitle)} (${sortedItems.length} ราย)</span>
            <span style="font-weight:600;color:#334155;">Pre-op ${preCount}/${sortedItems.length} · Post-op ${postCount}/${sortedItems.length}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:32px;text-align:center;">#</th>
                <th style="width:24%;">ชื่อ-นามสกุลผู้ป่วย</th>
                <th style="width:14%;">เตียง / HN</th>
                <th>การผ่าตัด / วันผ่าตัด</th>
                <th style="width:15%;text-align:center;">เยี่ยม Pre-op</th>
                <th style="width:15%;text-align:center;">เยี่ยม Post-op</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>`;
      })
      .join('');

    const html = `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>เช็คลิสต์เยี่ยมผู้ป่วย Pre-op / Post-op</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; color: #0f172a; font-size: 11.5px; margin: 0; }
    h1 { font-size: 15px; margin: 0 0 3px 0; }
    .meta { font-size: 11px; color: #475569; margin-bottom: 10px; display: flex; justify-content: space-between; border-bottom: 1.5px solid #0f172a; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #cbd5e1; padding: 4px 6px; vertical-align: top; }
    th { background: #f8fafc; font-weight: 700; font-size: 11px; text-align: left; }
  </style>
</head>
<body>
  <h1>เช็คลิสต์ตรวจสอบการเยี่ยมผู้ป่วย (Pre-op / Post-op) — แยกตามหอผู้ป่วย</h1>
  <div class="meta">
    <span>ทั้งหมด ${filteredChecklistSummary.total} ราย · เยี่ยม Pre-op แล้ว ${filteredChecklistSummary.preDone}/${filteredChecklistSummary.total} · เยี่ยม Post-op แล้ว ${filteredChecklistSummary.postDone}/${filteredChecklistSummary.total}</span>
    <span>พิมพ์เมื่อ: ${escapeHtml(formatShortThaiDate(today))}</span>
  </div>
  ${sectionsHtml}
</body>
</html>`;

    const printed = await tryPrintViaHiddenIframe(html);
    if (!printed) {
      downloadPrintableHtmlFile(html, `ward_visit_checklist_${today}.html`);
    }
  };

  if (isLoading && records.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-white border border-slate-200 rounded-xl animate-pulse" />
        <div className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
        <div className="h-72 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Storage & Backup Archive Bar */}
      <div
        className={`rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
          userEmail
            ? 'bg-pgreen-50/80 border-pgreen-200'
            : 'bg-pblue-50/80 border-pblue-200'
        }`}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <Database
            className={`w-4 h-4 mt-0.5 shrink-0 ${
              userEmail ? 'text-pgreen-800' : 'text-pblue-800'
            }`}
          />
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#243040]">
              {userEmail
                ? `แหล่งจัดเก็บข้อมูล: ฐานข้อมูล Cloud (${userEmail}) · ${cloudCount} ราย${
                    unsyncedLocalCount > 0 ? ` · ในเครื่องรอซิงค์ ${unsyncedLocalCount} ราย` : ''
                  }`
                : `แหล่งจัดเก็บปัจจุบัน: เฉพาะในเครื่องนี้ (${records.length} ราย) — ยังไม่ได้เชื่อมต่อ Cloud`}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {userEmail
                ? 'ใบ Pre-op ทุกใบถูกเก็บถาวรบน Cloud ผูกกับบัญชี Google นี้ สามารถค้นหาย้อนหลังได้ทุกเครื่อง และดาวน์โหลดไฟล์สำรอง (.json) เก็บไว้ในคอมพิวเตอร์/Google Drive เพิ่มเติมได้'
                : 'หากต้องการค้นหาข้อมูลเก่าข้ามเครื่องหรือเปิดจากลิงก์อื่น แนะนำให้เข้าสู่ระบบ Google เพื่อจัดเก็บบน Cloud ถาวร หรือดาวน์โหลดไฟล์สำรอง (.json) เก็บไว้'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!userEmail && onSignIn && (
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-pblue-600 rounded-lg hover:bg-pblue-700 transition-colors whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              เข้าสู่ระบบ Google (เก็บบน Cloud)
            </button>
          )}
          {userEmail && unsyncedLocalCount > 0 && onSyncLocalToCloud && (
            <button
              type="button"
              disabled={isSyncingLocal}
              onClick={onSyncLocalToCloud}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-pgreen-600 rounded-lg hover:bg-pgreen-800 disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              {isSyncingLocal
                ? 'กำลังซิงค์...'
                : `ซิงค์ขึ้น Cloud (${unsyncedLocalCount} ราย)`}
            </button>
          )}
          {userEmail && onPullFromCloud && (
            <button
              type="button"
              onClick={onPullFromCloud}
              disabled={isPullingCloud}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-pgreen-800 bg-white border border-pgreen-300 rounded-lg hover:bg-pgreen-50 disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              <CloudDownload className="w-3.5 h-3.5" />
              {isPullingCloud ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลล่าสุดจาก Cloud'}
            </button>
          )}
          <button
            type="button"
            onClick={() => exportAllEvaluationsJson(records)}
            disabled={records.length === 0}
            title="ดาวน์โหลดใบ Pre-op และ Post-op ทั้งหมดเก็บเป็นไฟล์สำรอง (.json)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-pborder rounded-lg hover:bg-pblue-50 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <Archive className="w-3.5 h-3.5 text-pblue-600" />
            สำรองข้อมูลทั้งหมด (.json)
          </button>
          {onImportJsonFile && (
            <>
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    onImportJsonFile(f);
                  }
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => jsonInputRef.current?.click()}
                title="นำเข้าใบ Pre-op เดี่ยว หรือไฟล์สำรองทั้งหมด (.json) กลับเข้าทะเบียน"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5 text-blue-800" />
                นำเข้าไฟล์สำรอง (.json)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Unsaved open Pre-op form reminder */}
      {unsavedCurrentForm && onSaveCurrentForm && (
        <div className="bg-pyellow-50 border border-pyellow-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-pyellow-800">
          <span>
            มีใบ Pre-op ที่กำลังเปิดกรอกอยู่ยังไม่ได้กดบันทึกเข้าทะเบียน:{' '}
            <strong>{unsavedCurrentForm.patientName || `HN ${unsavedCurrentForm.hn}`}</strong>
            {unsavedCurrentForm.dateOfOperation
              ? ` (วันผ่าตัด ${formatShortThaiDate(unsavedCurrentForm.dateOfOperation)})`
              : ''}
          </span>
          <button
            type="button"
            onClick={onSaveCurrentForm}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-pyellow-600 rounded-lg hover:bg-pyellow-800 whitespace-nowrap shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            บันทึกเข้าทะเบียนทันที
          </button>
        </div>
      )}

      {/* Unified Surgery Folder & Registry Overview Strip */}
      <div className="bg-white border border-pborder rounded-xl px-4 py-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#243040]">
              ทะเบียนผ่าตัดและเช็คลิสต์การเยี่ยมผู้ป่วย ({registryCounts.total} ราย)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              ตรวจสอบสถานะเยี่ยม Pre-op / Post-op รายเคสได้ทันที · คลิกที่ช่องเช็คลิสต์ของแต่ละรายเพื่อเปิดบันทึกข้อมูล
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => resetAllFilters()}
              className={`px-2.5 py-1 rounded-md border font-medium tabular-nums transition-colors ${
                !hasActiveSearchOrFilter
                  ? 'bg-pblue-600 text-white border-pblue-600'
                  : 'bg-white text-slate-700 border-pborder hover:bg-pblue-50'
              }`}
            >
              ทั้งหมด {registryCounts.total}
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setDateScope((prev) => (prev === 'today' ? 'all' : 'today'));
              }}
              className={`px-2.5 py-1 rounded-md border font-medium tabular-nums transition-colors ${
                dateScope === 'today'
                  ? 'bg-pblue-50 text-pblue-800 border-pblue-300 font-semibold'
                  : 'bg-white text-slate-700 border-pborder hover:bg-pblue-50/50'
              }`}
            >
              วันนี้ {registryCounts.todayCount}
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setDateScope((prev) => (prev === 'tomorrow' ? 'all' : 'tomorrow'));
              }}
              className={`px-2.5 py-1 rounded-md border font-medium tabular-nums transition-colors ${
                dateScope === 'tomorrow'
                  ? 'bg-pgreen-50 text-pgreen-800 border-pgreen-300 font-semibold'
                  : 'bg-white text-slate-700 border-pborder hover:bg-pgreen-50/50'
              }`}
            >
              พรุ่งนี้ {registryCounts.tomorrowCount}
            </button>
            <button
              type="button"
              onClick={() =>
                setStatusFilter((prev) => (prev === 'postponed' ? 'ALL' : 'postponed'))
              }
              className={`px-2.5 py-1 rounded-md border font-medium tabular-nums transition-colors ${
                statusFilter === 'postponed'
                  ? 'bg-pyellow-100 text-pyellow-800 border-pyellow-300 font-semibold'
                  : 'bg-white text-slate-700 border-pborder hover:bg-pyellow-50/50'
              }`}
            >
              เลื่อนผ่าตัด {registryCounts.postponed}
            </button>
            <button
              type="button"
              onClick={() =>
                setStatusFilter((prev) => (prev === 'not_visited' ? 'ALL' : 'not_visited'))
              }
              className={`px-2.5 py-1 rounded-md border font-medium tabular-nums transition-colors ${
                statusFilter === 'not_visited'
                  ? 'bg-prose-50 text-prose-800 border-prose-300 font-semibold'
                  : 'bg-white text-slate-700 border-pborder hover:bg-prose-50/50'
              }`}
            >
              ไม่ได้เยี่ยม Pre-op {registryCounts.notVisited}
            </button>
          </div>
        </div>

        {/* Visit Checklist Quick Status Strip */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter((prev) => (prev === 'draft' ? 'ALL' : 'draft'))}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium tabular-nums transition-colors ${
                statusFilter === 'draft'
                  ? 'bg-amber-100 text-amber-900 border-amber-400 font-semibold'
                  : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100/70'
              }`}
            >
              <Square className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              ยังไม่เยี่ยม Pre-op: <strong>{registryCounts.draft}</strong>
            </button>
            <button
              type="button"
              onClick={() =>
                setStatusFilter((prev) => (prev === 'evaluated' ? 'ALL' : 'evaluated'))
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium tabular-nums transition-colors ${
                statusFilter === 'evaluated'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-semibold'
                  : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100/70'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              เยี่ยม Pre-op แล้ว: <strong>{registryCounts.preOpDone}</strong>
            </button>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <button
              type="button"
              onClick={() =>
                setStatusFilter((prev) => (prev === 'not_post_op' ? 'ALL' : 'not_post_op'))
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium tabular-nums transition-colors ${
                statusFilter === 'not_post_op'
                  ? 'bg-slate-200 text-slate-900 border-slate-400 font-semibold'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Square className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              ยังไม่เยี่ยม Post-op: <strong>{registryCounts.notPostOp}</strong>
            </button>
            <button
              type="button"
              onClick={() =>
                setStatusFilter((prev) =>
                  prev === 'post_op_completed' ? 'ALL' : 'post_op_completed',
                )
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium tabular-nums transition-colors ${
                statusFilter === 'post_op_completed'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-semibold'
                  : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100/70'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              เยี่ยม Post-op แล้ว: <strong>{registryCounts.postOpDone}</strong>
            </button>
            <button
              type="button"
              onClick={() =>
                setStatusFilter((prev) => (prev === 'both_done' ? 'ALL' : 'both_done'))
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium tabular-nums transition-colors ${
                statusFilter === 'both_done'
                  ? 'bg-blue-100 text-blue-900 border-blue-400 font-semibold'
                  : 'bg-blue-50/60 text-blue-900 border-blue-200 hover:bg-blue-100/70'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              เยี่ยมครบทั้งคู่: <strong>{registryCounts.bothDone}</strong>
            </button>
          </div>
          {filtered.length > 0 && (
            <div className="text-[11px] font-mono tabular-nums text-slate-600 whitespace-nowrap">
              ในรายการนี้: Pre-op <strong className="text-emerald-700">{filteredChecklistSummary.preDone}</strong>/{filteredChecklistSummary.total} · Post-op <strong className="text-emerald-700">{filteredChecklistSummary.postDone}</strong>/{filteredChecklistSummary.total}
            </div>
          )}
        </div>
      </div>

      {/* Search & Controls Toolbar */}
      <div className="bg-white border border-pborder rounded-xl p-4 space-y-3">
        {/* Row 1: Unified Quick Search + Date Lookup + Primary Actions */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-2.5 flex-1 min-w-[260px]">
            {/* Unified Smart Search (HN / AN / Name / Date BE-CE / Doctor / Ward / Operation) */}
            <label className="flex flex-col gap-1 flex-1 min-w-[240px] max-w-md">
              <span className="text-[11px] font-semibold text-slate-700">
                ค้นหาใบ Pre-op เก่า (HN, AN, ชื่อ-สกุล, วันที่ พ.ศ. เช่น 25/11/69, แพทย์, หัตถการ)
              </span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-pblue-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="พิมพ์เลข HN (ไม่ต้องใส่ 0 นำหน้าก็ได้), ชื่อผู้ป่วย หรือวันที่ เช่น 25/11/69..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-pborder rounded-lg text-[#243040] placeholder:text-slate-400 focus:outline-none focus:border-pblue-400 focus:ring-2 focus:ring-pblue-200/50"
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
            </label>

            {/* Date Field Scope */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-600">กรองตามวันที่</span>
              <select
                aria-label="ประเภทวันที่ที่ต้องการค้นหา"
                value={dateField}
                onChange={(e) =>
                  setDateField(e.target.value as 'all' | 'operation' | 'visit' | 'post_op')
                }
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
              >
                <option value="all">ทุกวันที่ (ผ่าตัด / เยี่ยม / Lab)</option>
                <option value="operation">วันที่ทำผ่าตัด</option>
                <option value="visit">วันที่เยี่ยม Pre-op</option>
                <option value="post_op">วันที่เยี่ยม Post-op</option>
              </select>
            </label>

            {/* Single Date or Date Range Start */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-600">
                {dateTo ? 'ตั้งแต่วันที่ (พ.ศ.)' : 'เลือกวันที่ (พ.ศ.)'}
              </span>
              <ThaiDateInput
                ariaLabel="เลือกวันที่เริ่มต้นหรือวันที่ต้องการค้นหา (พ.ศ.)"
                value={dateFrom}
                onChange={(next) => {
                  setDateFrom(next);
                  if (next) setDateScope('all');
                }}
                placeholder="วว/ดด/ปปปป"
                className="w-36 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-800"
              />
            </label>

            {/* Optional Range End */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-500">
                ถึงวันที่ (พ.ศ., ไม่บังคับ)
              </span>
              <ThaiDateInput
                ariaLabel="เลือกวันที่สิ้นสุด (พ.ศ.)"
                value={dateTo}
                onChange={(next) => {
                  setDateTo(next);
                  if (next) setDateScope('all');
                }}
                placeholder="วว/ดด/ปปปป"
                className="w-36 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-800"
              />
            </label>

            {/* Quick Date Scope Segmented Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { key: 'all', label: 'ทั้งหมด' },
                  { key: 'upcoming', label: 'กำลังจะถึง' },
                  { key: 'today', label: 'วันนี้' },
                  { key: 'tomorrow', label: 'พรุ่งนี้' },
                  { key: 'past', label: 'ย้อนหลัง' },
                ] as const
              ).map((scope) => (
                <button
                  key={scope.key}
                  type="button"
                  onClick={() => {
                    setDateScope(scope.key);
                    if (scope.key !== 'all') {
                      setDateFrom('');
                      setDateTo('');
                    }
                  }}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    dateScope === scope.key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {scope.label}
                </button>
              ))}
            </div>

            {hasActiveSearchOrFilter && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                ล้างค้นหา
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSortMode((prev) => (prev === 'ward_name' ? 'op_ward_desc' : 'ward_name'))
              }
              title="สลับระหว่างแยกตามวันผ่าตัด→หอผู้ป่วย หรือรวมทุกวันแยกตามหอผู้ป่วย"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                sortMode === 'ward_name'
                  ? 'bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800'
                  : 'text-slate-700 bg-white border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              {sortMode === 'ward_name' ? 'รวมทุกวันตามหอผู้ป่วย' : 'รวมทุกวันตามหอ'}
            </button>
            <button
              type="button"
              onClick={() => void handlePrintChecklist()}
              disabled={filtered.length === 0}
              title="พิมพ์ใบเช็คลิสต์การเยี่ยม Pre-op / Post-op แยกตามหอผู้ป่วย (ขนาด A4)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700" />
              พิมพ์เช็คลิสต์เยี่ยม
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
            {onCreateNewForDate && (
              <button
                type="button"
                onClick={() => onCreateNewForDate(tomorrow)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-blue-800" />
                เปิดฟอร์ม (ผ่าตัดพรุ่งนี้)
              </button>
            )}
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              เพิ่มรายการใหม่
            </button>
          </div>
        </div>

        {/* Row 2: Status / Case Type / Surgeon / Ward / OR Room / Sort */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              {(
                [
                  { key: 'ALL', label: 'ทั้งหมด' },
                  { key: 'draft', label: 'ยังไม่เยี่ยม Pre-op' },
                  { key: 'evaluated', label: 'Pre-op แล้ว' },
                  { key: 'not_post_op', label: 'ยังไม่เยี่ยม Post-op' },
                  { key: 'post_op_completed', label: 'Post-op แล้ว' },
                  { key: 'both_done', label: 'ครบทั้งคู่' },
                  { key: 'postponed', label: 'เลื่อนผ่าตัด' },
                  { key: 'not_visited', label: 'ไม่ได้เยี่ยม' },
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

            <select
              aria-label="กรองตามแพทย์ผ่าตัด"
              value={surgeonFilter}
              onChange={(e) => setSurgeonFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
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
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
            >
              <option value="ALL">ทุกหอผู้ป่วย</option>
              {availableWards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>

            <select
              aria-label="กรองห้องผ่าตัด"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
            >
              <option value="ALL">ทุกห้อง OR</option>
              {availableOrRooms.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>

            <select
              aria-label="จัดกลุ่มและเรียงลำดับข้อมูล"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortGroupMode)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
            >
              <option value="op_ward_desc">วันผ่าตัด → หอผู้ป่วยเดียวกันอยู่ด้วยกัน (ล่าสุด → เก่า)</option>
              <option value="op_ward_asc">วันผ่าตัด → หอผู้ป่วยเดียวกันอยู่ด้วยกัน (ใกล้ → ไกล)</option>
              <option value="ward_name">รวมทุกวัน → แยกตามหอผู้ป่วย</option>
              <option value="op_or_asc">วันผ่าตัด → ห้อง OR (ใกล้ → ไกล)</option>
              <option value="op_surgeon_desc">วันผ่าตัด → แพทย์ผ่าตัด (ล่าสุด → เก่า)</option>
              <option value="op_surgeon_asc">วันผ่าตัด → แพทย์ผ่าตัด (ใกล้ → ไกล)</option>
              <option value="op_desc">วันผ่าตัด (ล่าสุด → เก่า · ไม่แยกกลุ่ม)</option>
              <option value="updated">เรียงตามแก้ไขล่าสุด</option>
            </select>
          </div>

          <div className="text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
            พบ <strong className="text-slate-900">{filtered.length}</strong> จาก {records.length} รายการ
          </div>
        </div>
      </div>

      {/* Active Filter Notice so user always knows all saved records are still in Registry */}
      {hasActiveSearchOrFilter && filtered.length < records.length && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
          <span>
            กำลังกรองแสดง <strong>{filtered.length}</strong> จากใบเยี่ยมที่บันทึกไว้ทั้งหมด{' '}
            <strong>{records.length}</strong> รายในทะเบียนผ่าตัด
          </span>
          <button
            type="button"
            onClick={resetAllFilters}
            className="font-semibold text-blue-800 hover:underline whitespace-nowrap"
          >
            แสดงทั้งหมด ({records.length} ราย)
          </button>
        </div>
      )}

      {/* Unified Surgery Folder & Registry Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700">
              {records.length > 0
                ? 'ไม่พบข้อมูลตามเงื่อนไขที่กรอง (ข้อมูลที่บันทึกไว้ทั้งหมดยังคงอยู่ในทะเบียนผ่าตัด)'
                : 'ยังไม่มีรายการที่บันทึกไว้ในทะเบียนผ่าตัด'}
            </p>
            <div className="flex items-center justify-center gap-2">
              {hasActiveSearchOrFilter && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  แสดงทั้งหมด ({records.length} ราย)
                </button>
              )}
              <button
                type="button"
                onClick={onCreateNew}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors"
              >
                <FilePlus2 className="w-4 h-4" />
                สร้างแบบฟอร์มผู้ป่วยใหม่
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">หอผู้ป่วย / เตียง</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">HN</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">ชื่อ-นามสกุลผู้ป่วย</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">การผ่าตัด / ห้อง OR</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">ASA / Plan</th>
                  <th className="py-2.5 px-2.5 font-semibold whitespace-nowrap text-center">
                    Pre-op
                  </th>
                  <th className="py-2.5 px-2.5 font-semibold whitespace-nowrap text-center">
                    Post-op
                  </th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const showInlineOpDate = !groupedByDate;

                  const renderRow = (r: PreAnestheticEvaluation) => {
                    const summary = computeClinicalSummary(r);
                    const isActive = r.id === activeId;
                    const isEmergency = getEffectiveScheduleType(r) === 'emergency';
                    const isPostponed = Boolean(r.formData?.surgeryPostponement?.isPostponed);
                    const preOpDone = isPreOpVisited(r);
                    const preOpNotVisited = isPreOpDraftNotVisited(r);
                    const postOpDone = isPostOpVisited(r);
                    const postOp = getPostOpVisitCompleteness(
                      r.formData?.postAnesthesia,
                      r.formData?.postOpComplication,
                    );
                    const postOpDate =
                      (r.formData?.postAnesthesia?.visitDate || '').trim() ||
                      (r.formData?.postOpComplication?.postOpDate || '').trim();
                    const bloodGroupText = formatBloodGroup(
                      r.formData?.laboratory?.bloodGroup,
                      r.formData?.laboratory?.bloodRh,
                    );

                    const wardBedText = formatWardWithBed(r.ward, r.bed) || 'ไม่ระบุหอ';
                    const opDetailTitle = [
                      r.dateOfOperation ? `วันผ่าตัด: ${formatShortThaiDate(r.dateOfOperation)}` : '',
                      r.operationTime ? `เวลา ${r.operationTime}` : '',
                      r.orRoom ? `${r.orRoom}${r.caseOrder ? ` #${r.caseOrder}` : ''}` : '',
                      isEmergency ? 'Emergency' : 'Elective',
                      r.operation ? `หัตถการ: ${r.operation}` : '',
                      r.diagnosis ? `Dx: ${r.diagnosis}` : '',
                      r.surgeon ? `แพทย์: ${r.surgeon}` : '',
                    ]
                      .filter(Boolean)
                      .join(' · ');

                    const asaPlanTitle = [
                      summary.asaLabel,
                      r.expectedDifficultAirway ? 'Difficult Airway' : '',
                      bloodGroupText ? `Gr. ${bloodGroupText}` : '',
                      summary.planSummary,
                    ]
                      .filter(Boolean)
                      .join(' · ');

                    const postponeTooltip = isPostponed
                      ? `เลื่อนผ่าตัด${
                          r.formData?.surgeryPostponement?.postponedToDate
                            ? ` → ${formatShortThaiDate(r.formData.surgeryPostponement.postponedToDate)}`
                            : ''
                        }${
                          formatPostponementReasons(r.formData?.surgeryPostponement)
                            ? ` (${formatPostponementReasons(r.formData?.surgeryPostponement)})`
                            : ''
                        }`
                      : '';

                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-slate-50/90 transition-colors ${
                          isActive ? 'bg-blue-50/45' : 'bg-white'
                        }`}
                      >
                        {/* 1. Ward / Bed (single line) */}
                        <td
                          className="py-2 px-3 whitespace-nowrap max-w-[165px] truncate text-slate-700 font-medium align-middle"
                          title={wardBedText}
                        >
                          {r.ward?.trim() ? (
                            <>
                              <span>{r.ward.trim()}</span>
                              {r.bed?.trim() ? (
                                <span className="text-slate-400 font-normal">
                                  {' · '}เตียง {r.bed.trim()}
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <span className="text-slate-400 font-normal">ไม่ระบุหอ</span>
                          )}
                        </td>

                        {/* 2. HN (single line, AN in tooltip) */}
                        <td
                          className="py-2 px-3 font-mono tabular-nums text-slate-600 whitespace-nowrap align-middle"
                          title={r.an ? `HN ${r.hn || '—'} · AN ${r.an}` : `HN ${r.hn || '—'}`}
                        >
                          {r.hn || '—'}
                        </td>

                        {/* 3. Patient Name + Age + inline flag (single line) */}
                        <td className="py-2 px-3 whitespace-nowrap align-middle">
                          <span className="font-semibold text-slate-900">
                            {r.patientName || 'ยังไม่ระบุชื่อ'}
                          </span>
                          {r.age ? (
                            <span className="ml-1.5 text-[11px] text-slate-400 font-normal tabular-nums">
                              {r.age} ปี
                            </span>
                          ) : null}
                          {isEmergency && (
                            <span
                              title="Emergency case"
                              className="ml-1.5 inline-block px-1 py-0 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 rounded"
                            >
                              E
                            </span>
                          )}
                          {isPostponed && (
                            <span
                              title={postponeTooltip}
                              className="ml-1.5 inline-block px-1.5 py-0 text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded"
                            >
                              เลื่อน
                            </span>
                          )}
                        </td>

                        {/* 4. Operation / OR Room (single line) */}
                        <td
                          className="py-2 px-3 whitespace-nowrap max-w-[250px] truncate text-slate-700 align-middle"
                          title={opDetailTitle}
                        >
                          {showInlineOpDate && (
                            <span className="font-mono text-[11px] text-slate-400 mr-1.5">
                              {r.dateOfOperation ? formatShortThaiDate(r.dateOfOperation) : '—'}
                            </span>
                          )}
                          {r.orRoom ? (
                            <span className="font-mono text-[11px] font-semibold text-slate-500 mr-1.5">
                              {r.orRoom}
                              {r.caseOrder ? `#${r.caseOrder}` : ''}
                            </span>
                          ) : null}
                          <span>{r.operation || r.diagnosis || '—'}</span>
                        </td>

                        {/* 5. ASA / Plan (single line) */}
                        <td
                          className="py-2 px-3 whitespace-nowrap max-w-[160px] truncate font-mono tabular-nums text-slate-600 align-middle"
                          title={asaPlanTitle}
                        >
                          <span className="font-semibold text-slate-800">{summary.asaLabel}</span>
                          {r.expectedDifficultAirway && (
                            <span className="ml-1 text-[10px] font-bold text-red-700">DA</span>
                          )}
                          {summary.planSummary && summary.planSummary !== '—' && (
                            <span className="text-slate-400 font-sans">
                              {' · '}
                              {summary.planSummary}
                            </span>
                          )}
                        </td>

                        {/* 6. Pre-op Checklist (single line) */}
                        <td className="py-2 px-2.5 text-center whitespace-nowrap align-middle">
                          {preOpDone ? (
                            <button
                              type="button"
                              onClick={() => onEdit(r)}
                              title={
                                r.dateOfVisit
                                  ? `เยี่ยม Pre-op แล้ว (${formatShortThaiDate(r.dateOfVisit)}) · คลิกเพื่อดู/แก้ไข`
                                  : 'เยี่ยม Pre-op แล้ว · คลิกเพื่อดู/แก้ไข'
                              }
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100 transition-colors"
                            >
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              เยี่ยมแล้ว
                            </button>
                          ) : preOpNotVisited ? (
                            <button
                              type="button"
                              onClick={() => onEdit(r)}
                              title={`ไม่ได้เยี่ยม Pre-op${
                                formatPreOpNotVisitedReasons(r.formData.preOpNotVisited)
                                  ? `: ${formatPreOpNotVisitedReasons(r.formData.preOpNotVisited)}`
                                  : ''
                              } · คลิกเพื่อแก้ไข`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-rose-200 bg-rose-50 text-rose-800 font-medium hover:bg-rose-100 transition-colors"
                            >
                              <XSquare className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              ไม่ได้เยี่ยม
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onEdit(r)}
                              title="ยังไม่เยี่ยม Pre-op · คลิกเพื่อเปิดบันทึก"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-200 bg-amber-50 text-amber-800 font-medium hover:bg-amber-100 transition-colors"
                            >
                              <Square className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              ยังไม่เยี่ยม
                            </button>
                          )}
                        </td>

                        {/* 7. Post-op Checklist (single line) */}
                        <td className="py-2 px-2.5 text-center whitespace-nowrap align-middle">
                          {postOpDone ? (
                            <button
                              type="button"
                              onClick={() => (onOpenPostOp ? onOpenPostOp(r) : onEdit(r))}
                              title={
                                postOpDate
                                  ? `เยี่ยม Post-op แล้ว (${formatShortThaiDate(postOpDate)}) · คลิกเพื่อดู/แก้ไข`
                                  : 'เยี่ยม Post-op แล้ว · คลิกเพื่อดู/แก้ไข'
                              }
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100 transition-colors"
                            >
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              เยี่ยมแล้ว
                            </button>
                          ) : postOp.hasAnyInput ? (
                            <button
                              type="button"
                              onClick={() => (onOpenPostOp ? onOpenPostOp(r) : onEdit(r))}
                              title={`กำลังบันทึก Post-op (${postOp.filledCount}/${postOp.totalRequired}) · คลิกเพื่อกรอกต่อ`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-200 bg-amber-50 text-amber-800 font-medium hover:bg-amber-100 transition-colors"
                            >
                              <Square className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              ไม่ครบ {postOp.filledCount}/{postOp.totalRequired}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => (onOpenPostOp ? onOpenPostOp(r) : onEdit(r))}
                              title="ยังไม่เยี่ยม Post-op · คลิกเพื่อเปิดบันทึก"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-slate-500 font-medium hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 transition-colors"
                            >
                              <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              ยังไม่เยี่ยม
                            </button>
                          )}
                        </td>

                        {/* 8. Compact single-line Actions */}
                        <td className="py-2 px-3 text-right whitespace-nowrap align-middle">
                          <div className="inline-flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => setPreviewRecord(r)}
                              title="ดูใบ Pre-op"
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEdit(r)}
                              title="เปิดแก้ไขใบ Pre-op"
                              className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {onOpenPostOp && (
                              <button
                                type="button"
                                onClick={() => onOpenPostOp(r)}
                                title="เปิดบันทึก Post-op"
                                className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded transition-colors"
                              >
                                <ClipboardCheck className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onPrintRecord(r)}
                              title="พิมพ์ 1 หน้า A4 / PDF"
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => exportSingleHtmlReport(r)}
                              title="ดาวน์โหลดไฟล์รายงาน HTML (1 หน้า)"
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            >
                              <FileCode2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDuplicate(r)}
                              title="ทำสำเนาเป็นรายการใหม่"
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
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

                  if (groupedByWard) {
                    return groupedByWard.map((wGrp) => (
                      <React.Fragment key={wGrp.wardKey}>
                        <tr className="bg-emerald-50/70 border-t border-emerald-200">
                          <td colSpan={8} className="py-1.5 px-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-xs">
                                <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span className="font-bold text-slate-900">
                                  หอผู้ป่วย: {wGrp.wardLabel}
                                </span>
                                <span className="text-slate-500 tabular-nums">
                                  · {wGrp.items.length} ราย
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums text-slate-600">
                                <span
                                  className={
                                    wGrp.preDone === wGrp.items.length
                                      ? 'text-emerald-700 font-semibold'
                                      : 'text-amber-700 font-semibold'
                                  }
                                >
                                  Pre-op {wGrp.preDone}/{wGrp.items.length}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span
                                  className={
                                    wGrp.postDone === wGrp.items.length
                                      ? 'text-emerald-700 font-semibold'
                                      : 'text-slate-600 font-semibold'
                                  }
                                >
                                  Post-op {wGrp.postDone}/{wGrp.items.length}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {wGrp.items.map(renderRow)}
                      </React.Fragment>
                    ));
                  }

                  if (!groupedByDate) {
                    return filtered.map(renderRow);
                  }

                  return groupedByDate.map((group) => {
                    const isUnspecified = group.date === '__UNSPECIFIED__';
                    const meta = isUnspecified
                      ? { label: 'ยังไม่ระบุวันที่ทำผ่าตัด', relativeTag: '' }
                      : formatThaiScheduleDate(group.date);
                    const preDoneInGroup = group.items.filter((i) => isPreOpVisited(i)).length;
                    const postDoneInGroup = group.items.filter((i) => isPostOpVisited(i)).length;

                    return (
                      <React.Fragment key={group.date}>
                        <tr className="bg-slate-100/90 border-t-2 border-slate-200">
                          <td colSpan={8} className="py-2 px-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <Calendar className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                                <span className="font-bold text-slate-900">{meta.label}</span>
                                {!isUnspecified && (
                                  <span className="font-mono tabular-nums text-slate-500">
                                    ({formatShortThaiDate(group.date)})
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
                                <span className="text-slate-600 tabular-nums">
                                  · {group.items.length} เคส ·{' '}
                                  <span
                                    className={
                                      preDoneInGroup === group.items.length
                                        ? 'text-emerald-700 font-semibold'
                                        : 'text-amber-800 font-semibold'
                                    }
                                  >
                                    Pre-op {preDoneInGroup}/{group.items.length}
                                  </span>
                                  {' · '}
                                  <span
                                    className={
                                      postDoneInGroup === group.items.length
                                        ? 'text-emerald-700 font-semibold'
                                        : 'text-slate-700 font-semibold'
                                    }
                                  >
                                    Post-op {postDoneInGroup}/{group.items.length}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
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
                                <button
                                  type="button"
                                  onClick={() =>
                                    exportEvaluationsCsv(
                                      group.items,
                                      `bangplee_or_${isUnspecified ? 'unscheduled' : group.date}`,
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                                >
                                  <Download className="w-3 h-3" />
                                  CSV วันนี้
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {showWardSubgroups
                          ? group.wardGroups.map((wGrp) => {
                              const wPreDone = wGrp.items.filter((i) => isPreOpVisited(i)).length;
                              const wPostDone = wGrp.items.filter((i) => isPostOpVisited(i)).length;
                              return (
                                <React.Fragment key={`${group.date}__ward__${wGrp.ward}`}>
                                  <tr className="bg-emerald-50/45 border-t border-emerald-100">
                                    <td colSpan={8} className="py-1 px-3.5">
                                      <div className="flex items-center justify-between gap-2 text-[11px]">
                                        <div className="flex items-center gap-1.5">
                                          <Building2 className="w-3 h-3 text-emerald-700 shrink-0" />
                                          <span className="font-semibold text-emerald-900">
                                            {wGrp.ward}
                                          </span>
                                          <span className="text-slate-500 tabular-nums">
                                            · {wGrp.items.length} ราย
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 font-mono tabular-nums text-slate-500">
                                          <span
                                            className={
                                              wPreDone === wGrp.items.length
                                                ? 'text-emerald-700 font-semibold'
                                                : 'text-amber-700'
                                            }
                                          >
                                            Pre {wPreDone}/{wGrp.items.length}
                                          </span>
                                          <span>·</span>
                                          <span
                                            className={
                                              wPostDone === wGrp.items.length
                                                ? 'text-emerald-700 font-semibold'
                                                : 'text-slate-600'
                                            }
                                          >
                                            Post {wPostDone}/{wGrp.items.length}
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  {wGrp.items.map(renderRow)}
                                </React.Fragment>
                              );
                            })
                          : showSurgeonSubgroups
                          ? group.surgeonGroups.map((sGrp) => {
                              const sPreDone = sGrp.items.filter((i) => isPreOpVisited(i)).length;
                              const sPostDone = sGrp.items.filter((i) => isPostOpVisited(i)).length;
                              return (
                                <React.Fragment key={`${group.date}__${sGrp.surgeon}`}>
                                  <tr className="bg-slate-50/70 border-t border-slate-200/80">
                                    <td colSpan={8} className="py-1.5 px-4">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                          <UserRound className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                                          <span className="font-semibold text-slate-800">
                                            แพทย์ผ่าตัด: {sGrp.surgeon}
                                          </span>
                                          <span className="text-slate-500 tabular-nums">
                                            · {sGrp.items.length} เคส (Pre-op {sPreDone}/
                                            {sGrp.items.length} · Post-op {sPostDone}/
                                            {sGrp.items.length})
                                          </span>
                                        </div>
                                        {!isUnspecified &&
                                          !sGrp.isUnspecified &&
                                          onCreateNewForDate && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                onCreateNewForDate(
                                                  group.date,
                                                  undefined,
                                                  sGrp.surgeon,
                                                )
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
                                  {sGrp.items.map(renderRow)}
                                </React.Fragment>
                              );
                            })
                          : group.items.map(renderRow)}
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inline Pre-op Sheet Preview Modal (View without leaving ทะเบียนผ่าตัด) */}
      {livePreviewRecord && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ดูใบ Pre-op"
          className="no-print fixed inset-0 z-50 bg-slate-900/50 flex flex-col items-center justify-start p-4 overflow-y-auto"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-[900px] shadow-xl overflow-hidden my-4">
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  ใบประเมิน Pre-op: {livePreviewRecord.patientName} (HN: {livePreviewRecord.hn || '—'})
                </h3>
                <p className="text-xs text-slate-500">
                  วันผ่าตัด:{' '}
                  {livePreviewRecord.dateOfOperation
                    ? formatShortThaiDate(livePreviewRecord.dateOfOperation)
                    : 'ยังไม่ระบุ'}{' '}
                  · {livePreviewRecord.operation || livePreviewRecord.diagnosis || '—'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const target = livePreviewRecord;
                    setPreviewRecord(null);
                    onEdit(target);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  เปิดแก้ไขในฟอร์ม
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = livePreviewRecord;
                    setPreviewRecord(null);
                    onPrintRecord(target);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  พิมพ์ A4
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewRecord(null)}
                  aria-label="ปิดหน้าต่าง"
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-100 overflow-x-auto">
              <A4PrintSheet evaluation={livePreviewRecord} previewMode />
            </div>
          </div>
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
