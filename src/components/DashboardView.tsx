import React, { useMemo, useState } from 'react';
import { Download, FilePlus2, Printer, RotateCcw } from 'lucide-react';
import {
  AsaClass,
  formatPostponementReasons,
  formatPreOpNotVisitedReasons,
  formatThaiDateBE,
  generateAutoProblemEntries,
  getEffectiveEvaluationStatus,
  getEffectiveScheduleType,
  getPostOpVisitCompleteness,
  inferPatientGender,
  isPostOpVisited,
  isPreOpDraftNotVisited,
  isPreOpVisited,
  isSurgeryPostponed,
  parseAgeInYears,
  POST_OP_ALL_COMPLICATIONS,
  POST_OP_OUTCOME_OPTIONS,
  POST_OP_SEVERITY_LEVELS,
  PostOpComplicationKey,
  PRE_OP_NOT_VISITED_REASON_OPTIONS,
  PreAnestheticEvaluation,
  PreOpNotVisitedReasonKey,
  summarizePostOpComplications,
  SURGERY_POSTPONEMENT_REASON_OPTIONS,
  SurgeryPostponementReasonKey,
} from '../types/evaluation';
import { exportEvaluationsCsv } from '../utils/exportReports';
import {
  AgeBracketChart,
  AgeBracketItem,
  AsaElectiveEmergencyChart,
  AsaSplitRow,
  DonutChart,
  DonutSegment,
  ElectiveMonthlyVisitChart,
  MonthlyElectiveVisitPoint,
} from './DashboardCharts';

interface DashboardViewProps {
  records: PreAnestheticEvaluation[];
  wardOptions: string[];
  onCreateNew: () => void;
  onSelectRecord: (record: PreAnestheticEvaluation) => void;
  onSelectRecordPostOp?: (record: PreAnestheticEvaluation) => void;
  isLoading: boolean;
}

const LEGACY_POST_OP_COMP_KEY = '__LEGACY_POST_ANESTHESIA__';
const UNSPECIFIED_REASON_KEY = '__UNSPECIFIED_REASON__';
type ComplicationItemKey = PostOpComplicationKey | typeof LEGACY_POST_OP_COMP_KEY;
type ActiveComplicationFilter = { phase: 'peri' | 'post'; key: ComplicationItemKey } | null;
type ActivePostponementFilter = 'ALL_POSTPONED' | SurgeryPostponementReasonKey | typeof UNSPECIFIED_REASON_KEY | null;
type ActiveNotVisitedFilter = 'ALL_NOT_VISITED' | 'ALL_DRAFTS' | PreOpNotVisitedReasonKey | typeof UNSPECIFIED_REASON_KEY | null;

function getShortComplicationLabel(key: PostOpComplicationKey, fallbackLabel: string): string {
  if (key === 'hypotension') return 'Hypotension';
  if (key === 'difficult_intubation') return 'Difficult intubation';
  if (key === 'pain_score_gt4') return 'Pain score >4';
  if (key === 'other_complication') return 'อื่นๆ';
  return fallbackLabel;
}

const UNSPECIFIED_KEY = '__UNSPECIFIED__';

const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

const THAI_MONTHS_FULL = [
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

function extractMonthKey(record: PreAnestheticEvaluation): string {
  const candidates: unknown[] = [
    record.dateOfOperation,
    record.dateOfVisit,
    record.formData?.postAnesthesia?.visitDate,
    record.createdAt,
    record.updatedAt,
  ];
  for (const raw of candidates) {
    if (typeof raw === 'string') {
      const match = raw.trim().match(/^(\d{4})-(\d{2})/);
      if (match) return `${match[1]}-${match[2]}`;
    } else if (
      raw &&
      typeof raw === 'object' &&
      'toDate' in raw &&
      typeof (raw as { toDate?: unknown }).toDate === 'function'
    ) {
      const dt = (raw as { toDate: () => Date }).toDate();
      if (dt instanceof Date && !Number.isNaN(dt.getTime())) {
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
      }
    }
  }
  return 'UNDATED';
}

function formatThaiMonthMeta(monthKey: string): { short: string; full: string; year: string } {
  if (monthKey === 'UNDATED') {
    return { short: 'ไม่ระบุ', full: 'ไม่ระบุเดือนผ่าตัด', year: 'UNDATED' };
  }
  const [yStr, mStr] = monthKey.split('-');
  const year = parseInt(yStr, 10);
  const monthIdx = parseInt(mStr, 10) - 1;
  if (Number.isNaN(year) || monthIdx < 0 || monthIdx > 11) {
    return { short: monthKey, full: monthKey, year: yStr || 'UNDATED' };
  }
  const beYear = year + 543;
  const beShort = String(beYear).slice(-2);
  return {
    short: `${THAI_MONTHS_SHORT[monthIdx]} ${beShort}`,
    full: `${THAI_MONTHS_FULL[monthIdx]} ${beYear}`,
    year: yStr,
  };
}

const ASA_RISK_POINTS: Record<Exclude<AsaClass, ''>, number> = {
  I: 10,
  II: 24,
  III: 52,
  IV: 78,
  V: 94,
  VI: 100,
};

function getSurgicalProcedureRiskPoints(operation: string): number {
  const op = operation.trim();
  if (!op) return 0;
  // High-risk major surgical procedures (ESC/ACC perioperative risk)
  if (
    /\b(?:craniotomy|craniectomy|burr\s+hole|neurosurg|thoracotomy|lobectomy|cardiac|cabg|valve|aortic|aaa|vascular|bypass|whipple|hepatectomy|pancreatectomy|esophagectomy|explore?\s+lap|exploratory\s+laparotomy|laparotomy|bowel\s+resection|colectomy|gastrectomy|splenectomy|nephrectomy|spine|laminectomy|pedicle|hip\s+arthroplasty|thr|hemiarthroplasty|amputation|tracheostomy)\b|เปิดช่องท้อง|ผ่าตัดสมอง|ผ่าตัดทรวงอก|ผ่าตัดหัวใจ|ผ่าตัดหลอดเลือด/i.test(
      op,
    )
  ) {
    return 24;
  }
  // Intermediate-risk procedures
  if (
    /\b(?:lap\.?\s*chole|cholecystectomy|appendectomy|hysterectomy|myomectomy|c\/s|cesarean|caesarean|orif|tkr|arthroplasty|turp|prostatectomy|thyroidectomy|tonsillectomy|hernioplasty|herniorrhaphy|mastectomy|ureteroscopy|pcnl|debridement|laporoscop|laparoscop)\b|ผ่าตัดคลอด|ไส้ติ่ง|มดลูก|ดามเหล็ก|กระดูก/i.test(
      op,
    )
  ) {
    return 14;
  }
  // Low-risk minor/superficial procedures
  return 6;
}

interface CaseRiskProfile {
  score: number;
  isHighRisk: boolean;
  topProblems: string[];
}

function computeCaseRiskProfile(record: PreAnestheticEvaluation): CaseRiskProfile {
  const autoProblems = generateAutoProblemEntries(record);
  let score = 0;

  if (record.asaClass) {
    score += ASA_RISK_POINTS[record.asaClass];
  }
  if (record.asaEmergency || record.scheduleType === 'emergency') {
    score += 22;
  }
  if (record.expectedDifficultAirway) {
    score += 20;
  }
  const mallampati = record.formData?.physicalExam?.mallampatiClass;
  if (mallampati === 'IV') score += 12;
  else if (mallampati === 'III') score += 6;

  score += getSurgicalProcedureRiskPoints(record.operation);

  if (autoProblems.length > 0) {
    const topProblemScore = autoProblems[0].severityScore;
    if (topProblemScore >= 90) score += 26;
    else if (topProblemScore >= 75) score += 16;
    else if (topProblemScore >= 55) score += 9;
    else score += 4;
    score += Math.min(14, (autoProblems.length - 1) * 3);
  }

  if (record.hasComplication) {
    score += 10;
  }

  const normalizedScore = Math.min(100, score);
  const isHighRisk =
    ['III', 'IV', 'V', 'VI'].includes(record.asaClass) ||
    record.asaEmergency ||
    record.scheduleType === 'emergency' ||
    record.expectedDifficultAirway ||
    (autoProblems.length > 0 && autoProblems[0].severityScore >= 80) ||
    normalizedScore >= 55;

  return {
    score: normalizedScore,
    isHighRisk,
    topProblems: autoProblems.slice(0, 2).map((p) => p.text),
  };
}

export function DashboardView({
  records,
  wardOptions,
  onCreateNew,
  onSelectRecord,
  onSelectRecordPostOp,
  isLoading,
}: DashboardViewProps) {
  const [wardFilter, setWardFilter] = useState<string>('ALL');
  const [operationFilter, setOperationFilter] = useState<string>('ALL');
  const [asaFilter, setAsaFilter] = useState<string>('ALL');
  const [complicationFilter, setComplicationFilter] = useState<ActiveComplicationFilter>(null);
  const [postponementFilter, setPostponementFilter] = useState<ActivePostponementFilter>(null);
  const [notVisitedFilter, setNotVisitedFilter] = useState<ActiveNotVisitedFilter>(null);
  const [showAllPostponedList, setShowAllPostponedList] = useState<boolean>(false);
  const [showAllNotVisitedList, setShowAllNotVisitedList] = useState<boolean>(false);
  const [showAllPeriComplications, setShowAllPeriComplications] = useState<boolean>(false);
  const [showAllPostComplications, setShowAllPostComplications] = useState<boolean>(false);
  const [operationSortBy, setOperationSortBy] = useState<'risk' | 'count'>('risk');
  const [tableSortBy, setTableSortBy] = useState<'risk' | 'date'>('risk');
  const [showAllRows, setShowAllRows] = useState<boolean>(false);
  const [visitYearFilter, setVisitYearFilter] = useState<string>('ALL');

  const riskById = useMemo(() => {
    const map = new Map<string, CaseRiskProfile>();
    records.forEach((r) => {
      map.set(r.id, computeCaseRiskProfile(r));
    });
    return map;
  }, [records]);

  const wards = useMemo(() => {
    const set = new Set<string>([...wardOptions, 'อื่นๆ']);
    records.forEach((r) => {
      if (r.ward.trim()) set.add(r.ward.trim());
    });
    return Array.from(set);
  }, [records, wardOptions]);

  const hasUnspecifiedWard = useMemo(
    () => records.some((r) => !r.ward.trim()),
    [records],
  );

  const operations = useMemo(() => {
    const statsMap = new Map<string, { count: number; maxRisk: number }>();
    records.forEach((r) => {
      const op = r.operation.trim();
      if (!op) return;
      const riskScore = riskById.get(r.id)?.score ?? 0;
      const prev = statsMap.get(op) || { count: 0, maxRisk: 0 };
      statsMap.set(op, {
        count: prev.count + 1,
        maxRisk: Math.max(prev.maxRisk, riskScore),
      });
    });
    return Array.from(statsMap.entries())
      .sort((a, b) => b[1].maxRisk - a[1].maxRisk || b[1].count - a[1].count || a[0].localeCompare(b[0], 'th'))
      .map(([op]) => op);
  }, [records, riskById]);

  const hasUnspecifiedOperation = useMemo(
    () => records.some((r) => !r.operation.trim()),
    [records],
  );

  const hasActiveFilters =
    wardFilter !== 'ALL' ||
    operationFilter !== 'ALL' ||
    asaFilter !== 'ALL' ||
    complicationFilter !== null ||
    postponementFilter !== null ||
    notVisitedFilter !== null;

  const resetFilters = () => {
    setWardFilter('ALL');
    setOperationFilter('ALL');
    setAsaFilter('ALL');
    setComplicationFilter(null);
    setPostponementFilter(null);
    setNotVisitedFilter(null);
  };

  const baseFiltered = useMemo(() => {
    return records.filter((r) => {
      const wardVal = r.ward.trim();
      if (wardFilter === UNSPECIFIED_KEY) {
        if (wardVal !== '') return false;
      } else if (wardFilter !== 'ALL' && wardVal !== wardFilter) {
        return false;
      }

      const opVal = r.operation.trim();
      if (operationFilter === UNSPECIFIED_KEY) {
        if (opVal !== '') return false;
      } else if (operationFilter !== 'ALL' && opVal !== operationFilter) {
        return false;
      }

      if (asaFilter !== 'ALL' && r.asaClass !== asaFilter) return false;
      return true;
    });
  }, [records, wardFilter, operationFilter, asaFilter]);

  const filtered = useMemo(() => {
    return baseFiltered.filter((r) => {
      if (complicationFilter) {
        const pc = r.formData?.postOpComplication;
        const periList = pc?.periOpComplications ?? [];
        const postList = pc?.postOpComplications ?? [];
        if (complicationFilter.key === LEGACY_POST_OP_COMP_KEY) {
          if (
            !(
              r.formData?.postAnesthesia?.complicationStatus === 'yes' &&
              periList.length === 0 &&
              postList.length === 0
            )
          ) {
            return false;
          }
        } else if (complicationFilter.phase === 'peri') {
          if (!periList.includes(complicationFilter.key)) return false;
        } else {
          if (!postList.includes(complicationFilter.key)) return false;
        }
      }

      if (postponementFilter) {
        const sp = r.formData?.surgeryPostponement;
        if (!sp?.isPostponed) return false;
        if (postponementFilter === UNSPECIFIED_REASON_KEY) {
          if ((sp.reasons ?? []).length > 0) return false;
        } else if (postponementFilter !== 'ALL_POSTPONED') {
          if (!(sp.reasons ?? []).includes(postponementFilter)) return false;
        }
      }

      if (notVisitedFilter) {
        const nv = r.formData?.preOpNotVisited;
        const isDraft = getEffectiveEvaluationStatus(r) === 'draft';
        if (notVisitedFilter === 'ALL_DRAFTS') {
          if (!isDraft) return false;
        } else if (notVisitedFilter === 'ALL_NOT_VISITED') {
          if (!nv?.isNotVisited) return false;
        } else if (notVisitedFilter === UNSPECIFIED_REASON_KEY) {
          if (!isDraft) return false;
          if (nv?.isNotVisited && (nv.reasons ?? []).length > 0) return false;
        } else {
          if (!nv?.isNotVisited || !(nv.reasons ?? []).includes(notVisitedFilter)) return false;
        }
      }

      return true;
    });
  }, [baseFiltered, complicationFilter, postponementFilter, notVisitedFilter]);

  const sortedFiltered = useMemo(() => {
    const list = [...filtered];
    if (tableSortBy === 'risk') {
      list.sort((a, b) => {
        const ra = riskById.get(a.id)?.score ?? 0;
        const rb = riskById.get(b.id)?.score ?? 0;
        if (rb !== ra) return rb - ra;
        return (a.dateOfOperation || '').localeCompare(b.dateOfOperation || '');
      });
    }
    return list;
  }, [filtered, tableSortBy, riskById]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const emergencyCount = filtered.filter(
      (r) => getEffectiveScheduleType(r) === 'emergency',
    ).length;
    const electiveCount = total - emergencyCount;
    const highRiskAsa = filtered.filter((r) =>
      ['III', 'IV', 'V', 'VI'].includes(r.asaClass),
    ).length;
    const difficultAirway = filtered.filter((r) => r.expectedDifficultAirway).length;
    const mallampatiHigh = filtered.filter((r) =>
      ['III', 'IV'].includes(r.formData.physicalExam.mallampatiClass),
    ).length;
    const postOpDone = filtered.filter(
      (r) => isPostOpVisited(r) || getPostOpVisitCompleteness(r.formData?.postAnesthesia).isComplete,
    ).length;
    const postOpPending = total - postOpDone;
    const complications = filtered.filter((r) => r.hasComplication).length;

    let prcUnits = 0;
    let ffpUnits = 0;
    let pltUnits = 0;
    let cryoUnits = 0;
    filtered.forEach((r) => {
      prcUnits += parseInt(r.formData.laboratory.prepPrc || '0', 10) || 0;
      ffpUnits += parseInt(r.formData.laboratory.prepFfp || '0', 10) || 0;
      pltUnits += parseInt(r.formData.laboratory.prepPlt || '0', 10) || 0;
      cryoUnits += parseInt(r.formData.laboratory.prepCryo || '0', 10) || 0;
    });

    // ASA Class I-VI split Elective vs Emergency
    const asaOrder: Array<Exclude<AsaClass, ''> | 'Unspecified'> = [
      'I',
      'II',
      'III',
      'IV',
      'V',
      'VI',
      'Unspecified',
    ];
    const asaSplitMap = new Map<
      Exclude<AsaClass, ''> | 'Unspecified',
      { elective: number; emergency: number }
    >();
    asaOrder.forEach((cls) => asaSplitMap.set(cls, { elective: 0, emergency: 0 }));

    filtered.forEach((r) => {
      const cls = r.asaClass || 'Unspecified';
      const entry = asaSplitMap.get(cls);
      if (!entry) return;
      if (getEffectiveScheduleType(r) === 'emergency') {
        entry.emergency += 1;
      } else {
        entry.elective += 1;
      }
    });

    const asaSplitRows: AsaSplitRow[] = asaOrder.map((cls) => {
      const counts = asaSplitMap.get(cls) ?? { elective: 0, emergency: 0 };
      return {
        cls,
        label: cls === 'Unspecified' ? 'ยังไม่ระบุ' : `ASA Class ${cls}`,
        shortLabel: cls === 'Unspecified' ? 'ไม่ระบุ' : `ASA ${cls}`,
        elective: counts.elective,
        emergency: counts.emergency,
        total: counts.elective + counts.emergency,
      };
    });

    // Anesthetic Technique: primary mutually exclusive GA, RA, GA+RA, MAC + sub-methods
    const anesthesiaCategory = {
      GA: 0,
      RA: 0,
      GA_RA: 0,
      MAC: 0,
      Unspecified: 0,
    };
    const planCounts = {
      GA_Intubation: 0,
      GA_LMA: 0,
      GA_TIVA_Mask: 0,
      RA_Spinal: 0,
      RA_Epidural_Nerve: 0,
      MAC: 0,
    };

    filtered.forEach((r) => {
      const ap = r.formData.anestheticPlan;
      const gaOtherText = (ap.gaOther || '').trim();
      const raOtherText = (ap.raOther || '').trim();
      const gaOtherIsOnlyMac = /^mac$/i.test(gaOtherText);
      const raOtherIsOnlyMac = /^mac$/i.test(raOtherText);
      const hasGa =
        Boolean(ap.gaSelected) ||
        ap.gaMethods.length > 0 ||
        (Boolean(gaOtherText) && !gaOtherIsOnlyMac);
      const hasRa =
        Boolean(ap.raSelected) ||
        ap.raMethods.length > 0 ||
        (Boolean(raOtherText) && !raOtherIsOnlyMac);
      const hasMac =
        Boolean(ap.macSelected) ||
        r.anesthesiaType === 'MAC' ||
        /\bmac\b/i.test(gaOtherText) ||
        /\bmac\b/i.test(raOtherText);

      if (hasGa && hasRa) {
        anesthesiaCategory.GA_RA += 1;
      } else if (hasGa) {
        anesthesiaCategory.GA += 1;
      } else if (hasRa) {
        anesthesiaCategory.RA += 1;
      } else if (hasMac) {
        anesthesiaCategory.MAC += 1;
      } else if (r.anesthesiaType === 'GA+RA') {
        anesthesiaCategory.GA_RA += 1;
      } else if (r.anesthesiaType === 'GA') {
        anesthesiaCategory.GA += 1;
      } else if (r.anesthesiaType === 'RA') {
        anesthesiaCategory.RA += 1;
      } else {
        anesthesiaCategory.Unspecified += 1;
      }

      if (ap.gaMethods.includes('Intubation')) planCounts.GA_Intubation += 1;
      if (ap.gaMethods.includes('LMA')) planCounts.GA_LMA += 1;
      if (ap.gaMethods.includes('TIVA') || ap.gaMethods.includes('Mask')) {
        planCounts.GA_TIVA_Mask += 1;
      }
      if (ap.raMethods.includes('Spinal block')) planCounts.RA_Spinal += 1;
      if (ap.raMethods.includes('Epidural') || ap.raMethods.includes('Nerve block')) {
        planCounts.RA_Epidural_Nerve += 1;
      }
      if (hasMac) planCounts.MAC += 1;
    });

    const anesthesiaDonutSegments: DonutSegment[] = [
      { key: 'GA', label: 'GA (อย่างเดียว)', value: anesthesiaCategory.GA, color: '#1e40af' },
      { key: 'RA', label: 'RA (อย่างเดียว)', value: anesthesiaCategory.RA, color: '#059669' },
      { key: 'GA_RA', label: 'GA + RA (ร่วมกัน)', value: anesthesiaCategory.GA_RA, color: '#d97706' },
      { key: 'MAC', label: 'MAC', value: anesthesiaCategory.MAC, color: '#7c3aed' },
    ];
    if (anesthesiaCategory.Unspecified > 0) {
      anesthesiaDonutSegments.push({
        key: 'Unspecified',
        label: 'ยังไม่ระบุแผน',
        value: anesthesiaCategory.Unspecified,
        color: '#cbd5e1',
      });
    }

    // Age Distribution: <=1, 1-12, 12-65, >65
    let ageInfant = 0; // <= 1 ปี
    let ageChild = 0; // > 1 - 12 ปี
    let ageAdult = 0; // > 12 - 65 ปี
    let ageElderly = 0; // > 65 ปี
    let ageUnspecified = 0;

    // Gender Distribution: Male / Female / Unspecified
    let genderMale = 0;
    let genderFemale = 0;
    let genderUnspecified = 0;

    // Elective Monthly Visit Coverage (% Pre-op & % Post-op per month)
    const monthlyElectiveMap = new Map<
      string,
      { totalElective: number; preOpVisited: number; postOpVisited: number }
    >();

    filtered.forEach((r) => {
      const ageNum = parseAgeInYears(r.age);
      if (ageNum === null) {
        ageUnspecified += 1;
      } else if (ageNum <= 1) {
        ageInfant += 1;
      } else if (ageNum <= 12) {
        ageChild += 1;
      } else if (ageNum <= 65) {
        ageAdult += 1;
      } else {
        ageElderly += 1;
      }

      const g = inferPatientGender(r.patientName, r.gender);
      if (g === 'male') genderMale += 1;
      else if (g === 'female') genderFemale += 1;
      else genderUnspecified += 1;

      if (getEffectiveScheduleType(r) === 'elective') {
        const mKey = extractMonthKey(r);
        const prev = monthlyElectiveMap.get(mKey) ?? {
          totalElective: 0,
          preOpVisited: 0,
          postOpVisited: 0,
        };
        prev.totalElective += 1;
        if (isPreOpVisited(r)) prev.preOpVisited += 1;
        if (isPostOpVisited(r)) prev.postOpVisited += 1;
        monthlyElectiveMap.set(mKey, prev);
      }
    });

    const ageBrackets: AgeBracketItem[] = [
      { key: 'le1', label: '≤ 1 ปี', subtitle: 'ทารก / Infant', count: ageInfant, color: '#0284c7' },
      { key: '1to12', label: '1 – 12 ปี', subtitle: 'เด็ก / Pediatric', count: ageChild, color: '#0d9488' },
      { key: '12to65', label: '12 – 65 ปี', subtitle: 'ผู้ใหญ่ / Adult', count: ageAdult, color: '#1e40af' },
      { key: 'gt65', label: '> 65 ปี', subtitle: 'ผู้สูงอายุ / Geriatric', count: ageElderly, color: '#d97706' },
    ];

    const genderSegments: DonutSegment[] = [
      { key: 'male', label: 'ชาย (Male)', value: genderMale, color: '#2563eb' },
      { key: 'female', label: 'หญิง (Female)', value: genderFemale, color: '#e11d48' },
    ];
    if (genderUnspecified > 0) {
      genderSegments.push({
        key: 'unspecified',
        label: 'ไม่ระบุเพศ',
        value: genderUnspecified,
        color: '#cbd5e1',
      });
    }

    const allMonthlyElective: MonthlyElectiveVisitPoint[] = Array.from(monthlyElectiveMap.entries())
      .sort(([a], [b]) => {
        if (a === 'UNDATED') return 1;
        if (b === 'UNDATED') return -1;
        return a.localeCompare(b);
      })
      .map(([monthKey, counts]) => {
        const meta = formatThaiMonthMeta(monthKey);
        const preOpPct =
          counts.totalElective > 0
            ? Math.round((counts.preOpVisited / counts.totalElective) * 1000) / 10
            : 0;
        const postOpPct =
          counts.totalElective > 0
            ? Math.round((counts.postOpVisited / counts.totalElective) * 1000) / 10
            : 0;
        return {
          monthKey,
          label: meta.short,
          fullLabel: meta.full,
          year: meta.year,
          totalElective: counts.totalElective,
          preOpVisited: counts.preOpVisited,
          postOpVisited: counts.postOpVisited,
          preOpPct,
          postOpPct,
        };
      });

    const availableVisitYears = Array.from(
      new Set(
        allMonthlyElective
          .map((m) => m.year)
          .filter((y) => y !== 'UNDATED' && /^\d{4}$/.test(y)),
      ),
    ).sort();

    const comorbidityCounts = [
      { label: 'Diabetes Mellitus (DM)', count: filtered.filter((r) => r.formData.history.dm).length },
      { label: 'Hypertension (HT)', count: filtered.filter((r) => r.formData.history.ht).length },
      { label: 'Dyslipidemia (DLP)', count: filtered.filter((r) => r.formData.history.dlp).length },
      { label: 'โรคไต (CKD / Renal)', count: filtered.filter((r) => r.formData.history.ckd).length },
      { label: 'โรคหัวใจ (Heart Disease)', count: filtered.filter((r) => r.formData.history.heartDisease).length },
      { label: 'Drug/Food Allergy', count: filtered.filter((r) => r.formData.history.allergyStatus === 'yes').length },
      { label: 'Active Smoking', count: filtered.filter((r) => r.formData.history.smokingStatus === 'yes').length },
      { label: 'Mallampati III–IV', count: mallampatiHigh },
    ].sort((a, b) => b.count - a.count);

    const wardCounts = new Map<string, number>();
    const operationAgg = new Map<
      string,
      {
        count: number;
        totalRisk: number;
        maxRisk: number;
        highRiskCount: number;
        highAsaCount: number;
        emergencyCount: number;
        airwayCount: number;
      }
    >();

    filtered.forEach((r) => {
      const wKey = r.ward.trim() || UNSPECIFIED_KEY;
      wardCounts.set(wKey, (wardCounts.get(wKey) || 0) + 1);

      const opKey = r.operation.trim() || UNSPECIFIED_KEY;
      const risk = riskById.get(r.id) ?? computeCaseRiskProfile(r);
      const prev = operationAgg.get(opKey) || {
        count: 0,
        totalRisk: 0,
        maxRisk: 0,
        highRiskCount: 0,
        highAsaCount: 0,
        emergencyCount: 0,
        airwayCount: 0,
      };
      operationAgg.set(opKey, {
        count: prev.count + 1,
        totalRisk: prev.totalRisk + risk.score,
        maxRisk: Math.max(prev.maxRisk, risk.score),
        highRiskCount: prev.highRiskCount + (risk.isHighRisk ? 1 : 0),
        highAsaCount: prev.highAsaCount + (['III', 'IV', 'V', 'VI'].includes(r.asaClass) ? 1 : 0),
        emergencyCount:
          prev.emergencyCount + (r.asaEmergency || r.scheduleType === 'emergency' ? 1 : 0),
        airwayCount: prev.airwayCount + (r.expectedDifficultAirway ? 1 : 0),
      });
    });

    const wardList = Array.from(wardCounts.entries())
      .map(([key, count]) => ({
        key,
        label: key === UNSPECIFIED_KEY ? 'ไม่ระบุหอผู้ป่วย' : key,
        count,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'th'));

    const operationList = Array.from(operationAgg.entries())
      .map(([key, agg]) => ({
        key,
        label: key === UNSPECIFIED_KEY ? 'ไม่ระบุการผ่าตัด' : key,
        count: agg.count,
        maxRisk: agg.maxRisk,
        avgRisk: agg.count > 0 ? Math.round(agg.totalRisk / agg.count) : 0,
        highRiskCount: agg.highRiskCount,
        highAsaCount: agg.highAsaCount,
        emergencyCount: agg.emergencyCount,
        airwayCount: agg.airwayCount,
      }))
      .sort((a, b) => {
        if (operationSortBy === 'count') {
          return b.count - a.count || b.maxRisk - a.maxRisk || a.label.localeCompare(b.label, 'th');
        }
        return (
          b.maxRisk - a.maxRisk ||
          b.avgRisk - a.avgRisk ||
          b.highRiskCount - a.highRiskCount ||
          b.count - a.count ||
          a.label.localeCompare(b.label, 'th')
        );
      });

    const postOpComplicationSummary = (() => {
      const compMap = new Map<
        PostOpComplicationKey | typeof LEGACY_POST_OP_COMP_KEY,
        {
          key: PostOpComplicationKey | typeof LEGACY_POST_OP_COMP_KEY;
          label: string;
          fullLabel: string;
          periCount: number;
          postCount: number;
          totalCases: number;
          sampleDetails: string[];
        }
      >();

      for (const item of POST_OP_ALL_COMPLICATIONS) {
        compMap.set(item.key, {
          key: item.key,
          label: getShortComplicationLabel(item.key, item.label),
          fullLabel: item.label,
          periCount: 0,
          postCount: 0,
          totalCases: 0,
          sampleDetails: [],
        });
      }

      let casesWithAnyComplication = 0;
      let casesWithPeriComplication = 0;
      let casesWithPostComplication = 0;
      let noneProblemCases = 0;
      let totalPeriEvents = 0;
      let totalPostEvents = 0;

      const outcomeCounts = new Map<string, { key: string; label: string; count: number }>();
      for (const opt of POST_OP_OUTCOME_OPTIONS) {
        outcomeCounts.set(opt.key, { key: opt.key, label: opt.label, count: 0 });
      }

      const severityCounts = new Map<string, number>();
      for (const lv of POST_OP_SEVERITY_LEVELS) {
        severityCounts.set(lv, 0);
      }

      baseFiltered.forEach((r) => {
        const pc = r.formData?.postOpComplication;
        const pa = r.formData?.postAnesthesia;
        const periSet = new Set(pc?.periOpComplications ?? []);
        const postSet = new Set(pc?.postOpComplications ?? []);

        const hasStructuredComp = periSet.size > 0 || postSet.size > 0;
        const hasLegacyComp = !hasStructuredComp && pa?.complicationStatus === 'yes';

        if (hasStructuredComp || hasLegacyComp) {
          casesWithAnyComplication += 1;
        }
        if (periSet.size > 0) {
          casesWithPeriComplication += 1;
          totalPeriEvents += periSet.size;
        }
        if (postSet.size > 0 || hasLegacyComp) {
          casesWithPostComplication += 1;
          totalPostEvents += postSet.size + (hasLegacyComp ? 1 : 0);
        }
        if (pc?.noneProblem && !hasStructuredComp && !hasLegacyComp) {
          noneProblemCases += 1;
        }

        const unionKeys = new Set<PostOpComplicationKey>([...periSet, ...postSet]);
        unionKeys.forEach((k) => {
          const entry = compMap.get(k);
          if (!entry) return;
          if (periSet.has(k)) entry.periCount += 1;
          if (postSet.has(k)) entry.postCount += 1;
          entry.totalCases += 1;
          if (k === 'other_complication' && pc?.otherComplicationDetail?.trim()) {
            const detail = pc.otherComplicationDetail.trim();
            if (!entry.sampleDetails.includes(detail) && entry.sampleDetails.length < 3) {
              entry.sampleDetails.push(detail);
            }
          }
        });

        if (hasLegacyComp) {
          const existing = compMap.get(LEGACY_POST_OP_COMP_KEY) ?? {
            key: LEGACY_POST_OP_COMP_KEY,
            label: 'ภาวะแทรกซ้อน (บันทึกสรุป Post Anesthesia)',
            fullLabel: 'ภาวะแทรกซ้อนที่ระบุในส่วน Post Anesthesia Evaluation (ยังไม่ติ๊กหัวข้อในตาราง)',
            periCount: 0,
            postCount: 0,
            totalCases: 0,
            sampleDetails: [],
          };
          existing.postCount += 1;
          existing.totalCases += 1;
          if (pa?.complicationDetail?.trim()) {
            const detail = pa.complicationDetail.trim();
            if (!existing.sampleDetails.includes(detail) && existing.sampleDetails.length < 3) {
              existing.sampleDetails.push(detail);
            }
          }
          compMap.set(LEGACY_POST_OP_COMP_KEY, existing);
        }

        (pc?.outcomes ?? []).forEach((oKey) => {
          const entry = outcomeCounts.get(oKey);
          if (entry) entry.count += 1;
        });

        if (pc?.severityLevel && severityCounts.has(pc.severityLevel)) {
          severityCounts.set(pc.severityLevel, (severityCounts.get(pc.severityLevel) || 0) + 1);
        }
      });

      const rankedPeriComplications = Array.from(compMap.values())
        .filter((item) => item.periCount > 0)
        .map((item) => ({
          key: item.key,
          label: item.label,
          fullLabel: item.fullLabel,
          count: item.periCount,
          sampleDetails: item.sampleDetails,
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'th'));

      const rankedPostComplications = Array.from(compMap.values())
        .filter((item) => item.postCount > 0)
        .map((item) => ({
          key: item.key,
          label: item.label,
          fullLabel: item.fullLabel,
          count: item.postCount,
          sampleDetails: item.sampleDetails,
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'th'));

      const rankedOutcomes = Array.from(outcomeCounts.values())
        .filter((o) => o.count > 0)
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'th'));

      const rankedSeverities = Array.from(severityCounts.entries())
        .filter(([, count]) => count > 0)
        .map(([level, count]) => ({ level, count }))
        .sort((a, b) => b.count - a.count || a.level.localeCompare(b.level));

      return {
        totalEvaluated: baseFiltered.length,
        casesWithAnyComplication,
        casesWithPeriComplication,
        casesWithPostComplication,
        noneProblemCases,
        totalPeriEvents,
        totalPostEvents,
        rankedPeriComplications,
        rankedPostComplications,
        rankedOutcomes,
        rankedSeverities,
      };
    })();

    const postponementSummary = (() => {
      const reasonMap = new Map<
        SurgeryPostponementReasonKey | typeof UNSPECIFIED_REASON_KEY,
        {
          key: SurgeryPostponementReasonKey | typeof UNSPECIFIED_REASON_KEY;
          label: string;
          count: number;
          sampleDetails: string[];
        }
      >();
      for (const opt of SURGERY_POSTPONEMENT_REASON_OPTIONS) {
        reasonMap.set(opt.key, {
          key: opt.key,
          label: opt.label,
          count: 0,
          sampleDetails: [],
        });
      }
      const postponedRecords: PreAnestheticEvaluation[] = [];
      let unspecifiedCount = 0;

      baseFiltered.forEach((r) => {
        const sp = r.formData?.surgeryPostponement;
        if (!sp?.isPostponed) return;
        postponedRecords.push(r);
        const reasons = Array.isArray(sp.reasons) ? sp.reasons : [];
        if (reasons.length === 0) {
          unspecifiedCount += 1;
        } else {
          reasons.forEach((k) => {
            const entry = reasonMap.get(k);
            if (!entry) return;
            entry.count += 1;
            const detail =
              k === 'other'
                ? (sp.otherReasonDetail || sp.note || '').trim()
                : (sp.note || '').trim();
            if (detail && !entry.sampleDetails.includes(detail) && entry.sampleDetails.length < 3) {
              entry.sampleDetails.push(detail);
            }
          });
        }
      });

      const rankedReasons = Array.from(reasonMap.values())
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'th'));

      if (unspecifiedCount > 0) {
        rankedReasons.push({
          key: UNSPECIFIED_REASON_KEY,
          label: 'ยังไม่ระบุเหตุผลที่เลื่อน',
          count: unspecifiedCount,
          sampleDetails: [],
        });
      }

      const ratePct =
        baseFiltered.length > 0
          ? Math.round((postponedRecords.length / baseFiltered.length) * 1000) / 10
          : 0;

      return {
        totalBase: baseFiltered.length,
        totalPostponed: postponedRecords.length,
        ratePct,
        rankedReasons,
        postponedRecords,
      };
    })();

    const preOpDraftSummary = (() => {
      const reasonMap = new Map<
        PreOpNotVisitedReasonKey | typeof UNSPECIFIED_REASON_KEY,
        {
          key: PreOpNotVisitedReasonKey | typeof UNSPECIFIED_REASON_KEY;
          label: string;
          count: number;
          sampleDetails: string[];
        }
      >();
      for (const opt of PRE_OP_NOT_VISITED_REASON_OPTIONS) {
        reasonMap.set(opt.key, {
          key: opt.key,
          label: opt.label,
          count: 0,
          sampleDetails: [],
        });
      }

      const draftRecords: PreAnestheticEvaluation[] = [];
      const notVisitedRecords: PreAnestheticEvaluation[] = [];
      let pendingReasonCount = 0;

      baseFiltered.forEach((r) => {
        const isDraft = getEffectiveEvaluationStatus(r) === 'draft';
        const nv = r.formData?.preOpNotVisited;
        const isNv = Boolean(nv?.isNotVisited);
        if (isDraft) draftRecords.push(r);
        if (isNv) {
          notVisitedRecords.push(r);
          const reasons = Array.isArray(nv?.reasons) ? nv.reasons : [];
          if (reasons.length === 0) {
            pendingReasonCount += 1;
          } else {
            reasons.forEach((k) => {
              const entry = reasonMap.get(k);
              if (!entry) return;
              entry.count += 1;
              const detail =
                k === 'other'
                  ? (nv?.otherReasonDetail || nv?.note || '').trim()
                  : (nv?.note || '').trim();
              if (
                detail &&
                !entry.sampleDetails.includes(detail) &&
                entry.sampleDetails.length < 3
              ) {
                entry.sampleDetails.push(detail);
              }
            });
          }
        } else if (isDraft) {
          pendingReasonCount += 1;
        }
      });

      const rankedReasons = Array.from(reasonMap.values())
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'th'));

      if (pendingReasonCount > 0) {
        rankedReasons.push({
          key: UNSPECIFIED_REASON_KEY,
          label: 'ฉบับร่างรอเยี่ยม / ยังไม่ระบุเหตุผล',
          count: pendingReasonCount,
          sampleDetails: [],
        });
      }

      const displayList =
        notVisitedRecords.length > 0
          ? [
              ...notVisitedRecords,
              ...draftRecords.filter((d) => !notVisitedRecords.some((n) => n.id === d.id)),
            ]
          : draftRecords;

      return {
        totalBase: baseFiltered.length,
        totalDrafts: draftRecords.length,
        notVisitedCount: notVisitedRecords.length,
        rankedReasons,
        displayList,
      };
    })();

    return {
      total,
      electiveCount,
      emergencyCount,
      highRiskAsa,
      difficultAirway,
      postOpDone,
      postOpPending,
      complications,
      prcUnits,
      ffpUnits,
      pltUnits,
      cryoUnits,
      asaSplitRows,
      anesthesiaCategory,
      anesthesiaDonutSegments,
      planCounts,
      ageBrackets,
      ageUnspecified,
      genderSegments,
      allMonthlyElective,
      availableVisitYears,
      comorbidityCounts,
      wardList,
      operationList,
      postOpComplicationSummary,
      postponementSummary,
      preOpDraftSummary,
    };
  }, [filtered, baseFiltered, riskById, operationSortBy]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
          <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          ยังไม่มีข้อมูลการเยี่ยมผู้ป่วยก่อนผ่าตัดในระบบ
        </h2>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          เริ่มบันทึกแบบประเมินผู้ป่วยรายใหม่ เพื่อแสดงผลสรุปบน Dashboard และรายงานต่างๆ
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors"
          >
            <FilePlus2 className="w-4 h-4" />
            สร้างแบบประเมินใหม่
          </button>
        </div>
      </div>
    );
  }

  const maxWard = Math.max(1, ...stats.wardList.map((item) => item.count));
  const maxOperationCount = Math.max(1, ...stats.operationList.map((item) => item.count));
  const maxOperationRisk = Math.max(1, ...stats.operationList.map((item) => item.maxRisk));
  const maxPeriComplicationCount = Math.max(
    1,
    ...stats.postOpComplicationSummary.rankedPeriComplications.map((item) => item.count),
  );
  const maxPostComplicationCount = Math.max(
    1,
    ...stats.postOpComplicationSummary.rankedPostComplications.map((item) => item.count),
  );
  const visiblePeriComplications = showAllPeriComplications
    ? stats.postOpComplicationSummary.rankedPeriComplications
    : stats.postOpComplicationSummary.rankedPeriComplications.slice(0, 10);
  const visiblePostComplications = showAllPostComplications
    ? stats.postOpComplicationSummary.rankedPostComplications
    : stats.postOpComplicationSummary.rankedPostComplications.slice(0, 10);
  const maxPlan = Math.max(1, ...Object.values(stats.planCounts));
  const effectiveVisitYear =
    visitYearFilter !== 'ALL' && stats.availableVisitYears.includes(visitYearFilter)
      ? visitYearFilter
      : 'ALL';
  const visibleMonthlyElective =
    effectiveVisitYear === 'ALL'
      ? stats.allMonthlyElective
      : stats.allMonthlyElective.filter((m) => m.year === effectiveVisitYear);
  const visibleRows = showAllRows ? sortedFiltered : sortedFiltered.slice(0, 8);

  return (
    <div className="space-y-5">
      {/* Filter & Export Bar */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-600 whitespace-nowrap">หอผู้ป่วย (Ward)</span>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
            >
              <option value="ALL">ทุกหอผู้ป่วย</option>
              {wards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
              {hasUnspecifiedWard && (
                <option value={UNSPECIFIED_KEY}>ไม่ระบุหอผู้ป่วย</option>
              )}
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-600 whitespace-nowrap">การผ่าตัด (Operation)</span>
            <select
              value={operationFilter}
              onChange={(e) => setOperationFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 max-w-[240px] focus:outline-none focus:border-blue-800"
            >
              <option value="ALL">ทุกการผ่าตัด</option>
              {operations.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
              {hasUnspecifiedOperation && (
                <option value={UNSPECIFIED_KEY}>ไม่ระบุการผ่าตัด</option>
              )}
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-600 whitespace-nowrap">ASA Class</span>
            <select
              value={asaFilter}
              onChange={(e) => setAsaFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
            >
              <option value="ALL">ทุก ASA Class</option>
              {(['I', 'II', 'III', 'IV', 'V', 'VI'] as const).map((cls) => (
                <option key={cls} value={cls}>
                  ASA Class {cls}
                </option>
              ))}
            </select>
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ล้างตัวกรอง
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportEvaluationsCsv(sortedFiltered)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-blue-800" />
            ส่งออก CSV (Excel)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            พิมพ์สรุป Dashboard
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">จำนวนผู้ป่วยประเมินทั้งหมด</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {stats.total}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            Elective: {stats.electiveCount} · Emergency (E): {stats.emergencyCount} ราย
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">กลุ่มเสี่ยงสูง (ASA III–VI)</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-amber-700">
            {stats.highRiskAsa}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {stats.total > 0 ? Math.round((stats.highRiskAsa / stats.total) * 100) : 0}% ของผู้ป่วย
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">Expected Difficult Airway</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-red-700">
            {stats.difficultAirway}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            ควรเตรียม Video laryngoscope
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">Post-Op &amp; Complication</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {stats.postOpDone}
            <span className="text-sm font-normal text-slate-500"> / {stats.total}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            รอเยี่ยมหลังผ่าตัด: {stats.postOpPending} · แทรกซ้อน: {stats.complications}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">การจองเลือดรวม (Units)</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-blue-900">
            {stats.prcUnits + stats.ffpUnits + stats.pltUnits + stats.cryoUnits}
          </div>
          <div className="mt-1 text-xs font-mono tabular-nums text-slate-500">
            PRC {stats.prcUnits} · FFP {stats.ffpUnits} · Plt {stats.pltUnits} · Cryo {stats.cryoUnits}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">เลื่อนผ่าตัด / ไม่ได้เยี่ยม Pre-op</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-amber-800">
            {stats.postponementSummary.totalPostponed}
            <span className="text-sm font-normal text-slate-500">
              {' '}
              / {stats.preOpDraftSummary.notVisitedCount}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            เลื่อน {stats.postponementSummary.ratePct}% · ฉบับร่าง {stats.preOpDraftSummary.totalDrafts} ราย
          </div>
        </div>
      </div>

      {/* Surgery Postponement & Pre-op Draft / Not-Visited Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT: Surgery Postponements Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                สรุปการเลื่อนวันผ่าตัด (Surgery Postponement)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                เก็บข้อมูลเหตุผลการเลื่อนผ่าตัด เช่น ไม่มีเลือด, พบ PE, หายใจเหนื่อย, Investigation / Consult เพิ่ม · คลิกเพื่อกรองรายชื่อ
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setPostponementFilter((prev) =>
                    prev === 'ALL_POSTPONED' ? null : 'ALL_POSTPONED',
                  )
                }
                className={`text-xs font-mono tabular-nums px-2 py-1 rounded-md border transition-colors whitespace-nowrap ${
                  postponementFilter === 'ALL_POSTPONED'
                    ? 'bg-amber-100 border-amber-400 text-amber-950 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {stats.postponementSummary.totalPostponed} ราย ({stats.postponementSummary.ratePct}%)
              </button>
              {postponementFilter && (
                <button
                  type="button"
                  onClick={() => setPostponementFilter(null)}
                  className="no-print text-xs font-medium text-amber-800 hover:underline whitespace-nowrap"
                >
                  ล้างกรอง
                </button>
              )}
            </div>
          </div>

          {stats.postponementSummary.totalPostponed === 0 ? (
            <div className="py-8 px-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50 space-y-1">
              <p className="text-xs font-medium text-slate-700">
                ยังไม่มีรายการเลื่อนวันผ่าตัดในช่วงข้อมูลที่เลือก
              </p>
              <p className="text-[11px] text-slate-500">
                ติ๊กช่อง &ldquo;เลื่อนวันผ่าตัด&rdquo; ในแบบฟอร์ม Pre-op พร้อมระบุเหตุผลเพื่อเก็บสถิติที่นี่
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {(() => {
                  const maxReason = Math.max(
                    1,
                    ...stats.postponementSummary.rankedReasons.map((r) => r.count),
                  );
                  return stats.postponementSummary.rankedReasons.map((item, idx) => {
                    const barPct = Math.round((item.count / maxReason) * 100);
                    const isSelected = postponementFilter === item.key;
                    const sharePct =
                      stats.postponementSummary.totalPostponed > 0
                        ? Math.round((item.count / stats.postponementSummary.totalPostponed) * 100)
                        : 0;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          setPostponementFilter(isSelected ? null : item.key)
                        }
                        className={`w-full py-2 px-2 -mx-2 rounded-lg text-left grid grid-cols-[minmax(0,1fr)_88px_74px] items-center gap-3 text-xs transition-colors ${
                          isSelected
                            ? 'bg-amber-50 text-amber-950'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-slate-400 shrink-0">
                              {idx + 1}.
                            </span>
                            <span className="font-medium truncate">{item.label}</span>
                          </div>
                          {item.sampleDetails.length > 0 && (
                            <div className="text-[11px] text-slate-500 truncate pl-4 mt-0.5">
                              {item.sampleDetails.join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isSelected ? 'bg-amber-700' : 'bg-amber-500'
                            }`}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        <span className="text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                          {item.count} ราย ({sharePct}%)
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>รายชื่อผู้ป่วยที่เลื่อนผ่าตัด (คลิกเพื่อเปิดดู/แก้ไข)</span>
                  {stats.postponementSummary.postponedRecords.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllPostponedList((prev) => !prev)}
                      className="no-print text-blue-800 hover:underline font-medium"
                    >
                      {showAllPostponedList
                        ? 'แสดง 5 รายการแรก'
                        : `ดูทั้งหมด (${stats.postponementSummary.postponedRecords.length} ราย)`}
                    </button>
                  )}
                </div>
                <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto pr-1">
                  {(showAllPostponedList
                    ? stats.postponementSummary.postponedRecords
                    : stats.postponementSummary.postponedRecords.slice(0, 5)
                  ).map((rec) => {
                    const sp = rec.formData?.surgeryPostponement;
                    const reasonStr = formatPostponementReasons(sp, true);
                    return (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => onSelectRecord(rec)}
                        className="w-full py-2 px-2 -mx-2 rounded-md text-left hover:bg-amber-50/60 transition-colors flex flex-wrap items-baseline justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-mono tabular-nums text-slate-500 mr-1.5">
                            {rec.hn || '—'}
                          </span>
                          <span className="font-semibold text-slate-900">{rec.patientName}</span>
                          {reasonStr && (
                            <div className="text-[11px] text-amber-900 truncate mt-0.5">
                              {reasonStr}
                            </div>
                          )}
                        </div>
                        <span className="font-mono tabular-nums text-[11px] text-slate-600 whitespace-nowrap shrink-0">
                          {sp?.originalDateOfOperation
                            ? formatThaiDateBE(sp.originalDateOfOperation)
                            : formatThaiDateBE(rec.dateOfOperation) || '—'}
                          {' → '}
                          <strong className="text-amber-900">
                            {sp?.postponedToDate ? formatThaiDateBE(sp.postponedToDate) : 'รอระบุวัน'}
                          </strong>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Pre-op Draft / Not-Visited Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                ใบเยี่ยม Pre-op ฉบับร่าง / ไม่ได้เยี่ยมผู้ป่วย
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ติดตามใบเยี่ยม Pre-op ฉบับร่างและเหตุผลที่ไม่ได้เยี่ยม เช่น ผู้ป่วยไม่มาตามนัด ยกเลิกผ่าตัด อื่นๆ · คลิกเพื่อกรองรายชื่อ
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setNotVisitedFilter((prev) =>
                    prev === 'ALL_NOT_VISITED' ? null : 'ALL_NOT_VISITED',
                  )
                }
                className={`text-xs font-mono tabular-nums px-2 py-1 rounded-md border transition-colors whitespace-nowrap ${
                  notVisitedFilter === 'ALL_NOT_VISITED'
                    ? 'bg-rose-100 border-rose-400 text-rose-950 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                ไม่ได้เยี่ยม {stats.preOpDraftSummary.notVisitedCount} · ร่าง{' '}
                {stats.preOpDraftSummary.totalDrafts}
              </button>
              {notVisitedFilter && (
                <button
                  type="button"
                  onClick={() => setNotVisitedFilter(null)}
                  className="no-print text-xs font-medium text-rose-800 hover:underline whitespace-nowrap"
                >
                  ล้างกรอง
                </button>
              )}
            </div>
          </div>

          {stats.preOpDraftSummary.totalDrafts === 0 &&
          stats.preOpDraftSummary.notVisitedCount === 0 ? (
            <div className="py-8 px-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50 space-y-1">
              <p className="text-xs font-medium text-slate-700">
                ไม่มีใบเยี่ยม Pre-op ฉบับร่างหรือเคสที่ไม่ได้เยี่ยมในช่วงข้อมูลนี้
              </p>
              <p className="text-[11px] text-slate-500">
                หากไม่ได้เยี่ยมผู้ป่วย ให้ติ๊ก &ldquo;ใบเยี่ยม Pre-op ฉบับร่าง (ไม่ได้เยี่ยม)&rdquo; และระบุเหตุผลในแบบฟอร์ม
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {(() => {
                  const maxReason = Math.max(
                    1,
                    ...stats.preOpDraftSummary.rankedReasons.map((r) => r.count),
                  );
                  const denom = Math.max(
                    1,
                    stats.preOpDraftSummary.totalDrafts,
                    stats.preOpDraftSummary.notVisitedCount,
                  );
                  return stats.preOpDraftSummary.rankedReasons.map((item, idx) => {
                    const barPct = Math.round((item.count / maxReason) * 100);
                    const isSelected = notVisitedFilter === item.key;
                    const sharePct = Math.round((item.count / denom) * 100);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          setNotVisitedFilter(isSelected ? null : item.key)
                        }
                        className={`w-full py-2 px-2 -mx-2 rounded-lg text-left grid grid-cols-[minmax(0,1fr)_88px_74px] items-center gap-3 text-xs transition-colors ${
                          isSelected
                            ? 'bg-rose-50 text-rose-950'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-slate-400 shrink-0">
                              {idx + 1}.
                            </span>
                            <span className="font-medium truncate">{item.label}</span>
                          </div>
                          {item.sampleDetails.length > 0 && (
                            <div className="text-[11px] text-slate-500 truncate pl-4 mt-0.5">
                              {item.sampleDetails.join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isSelected
                                ? 'bg-rose-700'
                                : item.key === UNSPECIFIED_REASON_KEY
                                ? 'bg-slate-400'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        <span className="text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                          {item.count} ราย ({sharePct}%)
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>รายชื่อเคสฉบับร่าง / ไม่ได้เยี่ยม Pre-op (คลิกเพื่อเปิดกรอก/ระบุเหตุผล)</span>
                  {stats.preOpDraftSummary.displayList.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllNotVisitedList((prev) => !prev)}
                      className="no-print text-blue-800 hover:underline font-medium"
                    >
                      {showAllNotVisitedList
                        ? 'แสดง 5 รายการแรก'
                        : `ดูทั้งหมด (${stats.preOpDraftSummary.displayList.length} ราย)`}
                    </button>
                  )}
                </div>
                <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto pr-1">
                  {(showAllNotVisitedList
                    ? stats.preOpDraftSummary.displayList
                    : stats.preOpDraftSummary.displayList.slice(0, 5)
                  ).map((rec) => {
                    const nv = rec.formData?.preOpNotVisited;
                    const reasonStr = formatPreOpNotVisitedReasons(nv, true);
                    return (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => onSelectRecord(rec)}
                        className="w-full py-2 px-2 -mx-2 rounded-md text-left hover:bg-rose-50/60 transition-colors flex flex-wrap items-baseline justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-mono tabular-nums text-slate-500 mr-1.5">
                            {rec.hn || '—'}
                          </span>
                          <span className="font-semibold text-slate-900">{rec.patientName}</span>
                          <div
                            className={`text-[11px] truncate mt-0.5 ${
                              nv?.isNotVisited ? 'text-rose-800' : 'text-slate-500'
                            }`}
                          >
                            {nv?.isNotVisited
                              ? reasonStr || 'ไม่ได้เยี่ยม Pre-op (ยังไม่ระบุเหตุผล)'
                              : 'ฉบับร่าง (รอเยี่ยม Pre-op)'}
                          </div>
                        </div>
                        <span className="font-mono tabular-nums text-[11px] text-slate-600 whitespace-nowrap shrink-0">
                          {rec.dateOfOperation
                            ? formatThaiDateBE(rec.dateOfOperation)
                            : 'ไม่ระบุวันผ่าตัด'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Elective Monthly Pre-op & Post-op Visit Coverage Chart */}
      <ElectiveMonthlyVisitChart
        monthlyData={visibleMonthlyElective}
        availableYears={stats.availableVisitYears}
        selectedYear={effectiveVisitYear}
        onSelectYear={setVisitYearFilter}
      />

      {/* ASA I-VI (Elective vs Emergency) & Anesthetic Technique (GA / RA / GA+RA / MAC) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AsaElectiveEmergencyChart
          rows={stats.asaSplitRows}
          totalCases={stats.total}
          totalElective={stats.electiveCount}
          totalEmergency={stats.emergencyCount}
          activeAsaFilter={asaFilter}
          onSelectAsa={setAsaFilter}
        />

        {/* Anesthetic Plan Breakdown (GA / RA / GA+RA / MAC + Sub-methods) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                ประเภทการระงับความรู้สึก (GA / RA / GA+RA / MAC)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                แยกเคสที่ใช้ GA อย่างเดียว, RA อย่างเดียว, GA+RA ร่วมกัน และ MAC
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
              {stats.total} ราย
            </span>
          </div>

          <DonutChart
            segments={stats.anesthesiaDonutSegments}
            total={stats.total}
            centerLabel="ผู้ป่วยทั้งหมด"
          />

          <div className="border-t border-slate-100 pt-3.5 space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              รายละเอียดเทคนิคย่อย (นับรวมทุกวิธีที่เลือก)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2">
              {[
                { label: 'GA — Intubation', count: stats.planCounts.GA_Intubation, color: 'bg-blue-800' },
                { label: 'GA — LMA', count: stats.planCounts.GA_LMA, color: 'bg-blue-600' },
                { label: 'GA — TIVA / Mask', count: stats.planCounts.GA_TIVA_Mask, color: 'bg-sky-600' },
                { label: 'RA — Spinal block', count: stats.planCounts.RA_Spinal, color: 'bg-emerald-600' },
                { label: 'RA — Epidural / Nerve', count: stats.planCounts.RA_Epidural_Nerve, color: 'bg-teal-600' },
                { label: 'MAC (Monitored Care)', count: stats.planCounts.MAC, color: 'bg-violet-600' },
              ].map((item) => {
                const pct = Math.round((item.count / maxPlan) * 100);
                return (
                  <div
                    key={item.label}
                    className="grid grid-cols-[124px_1fr_30px] items-center gap-2 text-xs"
                  >
                    <span className="font-medium text-slate-700 truncate">{item.label}</span>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.count > 0 ? Math.max(4, pct) : 0}%` }}
                      />
                    </div>
                    <span className="text-right font-mono tabular-nums font-semibold text-slate-900">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Patient Demographics (Age Brackets & Gender) + Comorbidities Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Age Distribution: <=1, 1-12, 12-65, >65 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                สัดส่วนผู้ป่วยแยกตามกลุ่มอายุ
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                แบ่งช่วง ≤ 1 ปี · 1–12 ปี · 12–65 ปี · &gt; 65 ปี
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
              {stats.total} ราย
            </span>
          </div>
          <AgeBracketChart
            brackets={stats.ageBrackets}
            unspecifiedCount={stats.ageUnspecified}
            total={stats.total}
          />
        </div>

        {/* Gender Distribution: Male / Female */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                สัดส่วนผู้ป่วยแยกตามเพศ (ชาย / หญิง)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                อ่านจากช่องเพศหรือคำนำหน้าชื่อผู้ป่วยอัตโนมัติ
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
              {stats.total} ราย
            </span>
          </div>
          <DonutChart
            segments={stats.genderSegments}
            total={stats.total}
            centerLabel="ผู้ป่วยทั้งหมด"
          />
        </div>

        {/* Comorbidities & Airway Findings */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            โรคประจำตัวและปัจจัยเสี่ยงทางคลินิก
          </h3>
          <div className="divide-y divide-slate-100">
            {stats.comorbidityCounts.map((item) => (
              <div
                key={item.label}
                className="py-1.5 flex items-center justify-between gap-2 text-xs"
              >
                <span className="text-slate-700 font-medium truncate">{item.label}</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                  {item.count} ราย (
                  {stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peri-op & Post-op Complication Summary Dashboard (Side-by-Side, Sorted Highest -> Lowest) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              แดชบอร์ดสรุป Complication แยกช่วง Peri-op และ Post-op (เรียงจากมากสุด → น้อยสุด)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              สรุปจากแบบฟอร์ม ANE-FM-006-01 · คลิกที่หัวข้อ Complication ฝั่ง Peri-op หรือ Post-op เพื่อกรองรายชื่อผู้ป่วยที่พบเหตุการณ์นั้น
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums text-slate-600">
            <span>
              เคสมีภาวะแทรกซ้อน:{' '}
              <strong className="text-red-700">
                {stats.postOpComplicationSummary.casesWithAnyComplication}
              </strong>{' '}
              ราย (
              {stats.postOpComplicationSummary.totalEvaluated > 0
                ? (
                    (stats.postOpComplicationSummary.casesWithAnyComplication /
                      stats.postOpComplicationSummary.totalEvaluated) *
                    100
                  ).toFixed(1)
                : '0.0'}
              %)
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span>
              None problem:{' '}
              <strong className="text-emerald-700">
                {stats.postOpComplicationSummary.noneProblemCases}
              </strong>{' '}
              ราย
            </span>
            {complicationFilter && (
              <button
                type="button"
                onClick={() => setComplicationFilter(null)}
                className="no-print font-sans inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                ล้างตัวกรอง ({complicationFilter.phase === 'peri' ? 'Peri-op' : 'Post-op'})
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Side-by-Side: Peri-op Complication vs Post-op Complication */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Complication Peri-op */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Complication — Peri-op (เรียงมากสุด → น้อยสุด)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ภาวะแทรกซ้อนระหว่างให้ยาระงับความรู้สึก / ระหว่างผ่าตัด
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-600 whitespace-nowrap">
                <strong className="text-amber-800">
                  {stats.postOpComplicationSummary.casesWithPeriComplication}
                </strong>{' '}
                ราย · {stats.postOpComplicationSummary.totalPeriEvents} ครั้ง
              </span>
            </div>

            {stats.postOpComplicationSummary.rankedPeriComplications.length === 0 ? (
              <div className="py-9 px-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50 space-y-1">
                <p className="text-xs font-medium text-slate-700">
                  ยังไม่มีรายงาน Complication ช่วง Peri-op
                </p>
                <p className="text-[11px] text-slate-500">
                  ติ๊กช่อง Peri op ในหน้า Post-op Evaluation เพื่อแสดงอันดับที่นี่
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                  {visiblePeriComplications.map((item, idx) => {
                    const barPct = Math.round((item.count / maxPeriComplicationCount) * 100);
                    const baseDenom = Math.max(1, stats.postOpComplicationSummary.totalEvaluated);
                    const casePct = ((item.count / baseDenom) * 100).toFixed(1);
                    const isSelected =
                      complicationFilter?.phase === 'peri' &&
                      complicationFilter.key === item.key;
                    const barColor = isSelected
                      ? 'bg-blue-800'
                      : idx === 0
                      ? 'bg-amber-700'
                      : idx <= 2
                      ? 'bg-amber-500'
                      : 'bg-slate-600';

                    return (
                      <button
                        key={`peri-${item.key}`}
                        type="button"
                        onClick={() =>
                          setComplicationFilter(
                            isSelected ? null : { phase: 'peri', key: item.key },
                          )
                        }
                        title={item.fullLabel}
                        className={`w-full py-2.5 px-2 -mx-2 rounded-lg text-left grid grid-cols-[minmax(0,1fr)_96px_84px] items-center gap-3 text-xs transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-950'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono tabular-nums text-[11px] font-semibold w-5 shrink-0 ${
                                idx === 0
                                  ? 'text-amber-800'
                                  : idx <= 2
                                  ? 'text-amber-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {idx + 1}.
                            </span>
                            <span className="font-medium truncate">{item.label}</span>
                          </div>
                          {item.sampleDetails.length > 0 && (
                            <div className="text-[11px] text-slate-500 truncate pl-6 mt-0.5">
                              {item.sampleDetails.join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${barColor}`}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        <span className="text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                          {item.count} ราย ({casePct}%)
                        </span>
                      </button>
                    );
                  })}
                </div>

                {stats.postOpComplicationSummary.rankedPeriComplications.length > 10 && (
                  <div className="no-print pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAllPeriComplications((prev) => !prev)}
                      className="text-xs font-medium text-blue-800 hover:underline"
                    >
                      {showAllPeriComplications
                        ? 'แสดงเฉพาะ 10 อันดับแรก'
                        : `ดูทั้งหมด (${stats.postOpComplicationSummary.rankedPeriComplications.length} หัวข้อ)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT: Complication Post-op */}
          <div className="flex flex-col gap-3 lg:border-l lg:border-slate-200 lg:pl-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-red-900">
                  Complication — Post-op (เรียงมากสุด → น้อยสุด)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ภาวะแทรกซ้อนหลังผ่าตัด / ช่วงเยี่ยมหลังให้ยาระงับความรู้สึก
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-600 whitespace-nowrap">
                <strong className="text-red-700">
                  {stats.postOpComplicationSummary.casesWithPostComplication}
                </strong>{' '}
                ราย · {stats.postOpComplicationSummary.totalPostEvents} ครั้ง
              </span>
            </div>

            {stats.postOpComplicationSummary.rankedPostComplications.length === 0 ? (
              <div className="py-9 px-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50 space-y-1">
                <p className="text-xs font-medium text-slate-700">
                  ยังไม่มีรายงาน Complication ช่วง Post-op
                </p>
                <p className="text-[11px] text-slate-500">
                  ติ๊กช่อง Post op ในหน้า Post-op Evaluation เพื่อแสดงอันดับที่นี่
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                  {visiblePostComplications.map((item, idx) => {
                    const barPct = Math.round((item.count / maxPostComplicationCount) * 100);
                    const baseDenom = Math.max(1, stats.postOpComplicationSummary.totalEvaluated);
                    const casePct = ((item.count / baseDenom) * 100).toFixed(1);
                    const isSelected =
                      complicationFilter?.phase === 'post' &&
                      complicationFilter.key === item.key;
                    const barColor = isSelected
                      ? 'bg-blue-800'
                      : idx === 0
                      ? 'bg-red-600'
                      : idx <= 2
                      ? 'bg-rose-500'
                      : 'bg-slate-700';

                    return (
                      <button
                        key={`post-${item.key}`}
                        type="button"
                        onClick={() =>
                          setComplicationFilter(
                            isSelected ? null : { phase: 'post', key: item.key },
                          )
                        }
                        title={item.fullLabel}
                        className={`w-full py-2.5 px-2 -mx-2 rounded-lg text-left grid grid-cols-[minmax(0,1fr)_96px_84px] items-center gap-3 text-xs transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-950'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono tabular-nums text-[11px] font-semibold w-5 shrink-0 ${
                                idx === 0
                                  ? 'text-red-700'
                                  : idx <= 2
                                  ? 'text-rose-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {idx + 1}.
                            </span>
                            <span className="font-medium truncate">{item.label}</span>
                          </div>
                          {item.sampleDetails.length > 0 && (
                            <div className="text-[11px] text-slate-500 truncate pl-6 mt-0.5">
                              {item.sampleDetails.join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${barColor}`}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        <span className="text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                          {item.count} ราย ({casePct}%)
                        </span>
                      </button>
                    );
                  })}
                </div>

                {stats.postOpComplicationSummary.rankedPostComplications.length > 10 && (
                  <div className="no-print pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAllPostComplications((prev) => !prev)}
                      className="text-xs font-medium text-blue-800 hover:underline"
                    >
                      {showAllPostComplications
                        ? 'แสดงเฉพาะ 10 อันดับแรก'
                        : `ดูทั้งหมด (${stats.postOpComplicationSummary.rankedPostComplications.length} หัวข้อ)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom 2-Column Strip: OUT COME & Severity (A-I) */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Outcomes ranked highest -> lowest */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-800">
              สรุป OUT COME (เรียงมากสุด → น้อยสุด)
            </div>
            {stats.postOpComplicationSummary.rankedOutcomes.length === 0 ? (
              <div className="text-xs text-slate-500">ยังไม่มีข้อมูล OUT COME ที่บันทึก</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.postOpComplicationSummary.rankedOutcomes.map((o) => (
                  <div
                    key={o.key}
                    className="py-1.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-slate-700 truncate">{o.label}</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {o.count} ราย
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Severity A-I ranked highest -> lowest */}
          <div className="space-y-1.5 lg:border-l lg:border-slate-200 lg:pl-6">
            <div className="text-xs font-semibold text-slate-800">
              ระดับความรุนแรง (A–I · เรียงมากสุด → น้อยสุด)
            </div>
            {stats.postOpComplicationSummary.rankedSeverities.length === 0 ? (
              <div className="text-xs text-slate-500">ยังไม่มีการระบุระดับความรุนแรง</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.postOpComplicationSummary.rankedSeverities.map((s) => (
                  <div
                    key={s.level}
                    className="py-1.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <span
                      className={`font-semibold ${
                        ['G', 'H', 'I'].includes(s.level)
                          ? 'text-red-700'
                          : ['E', 'F'].includes(s.level)
                          ? 'text-amber-700'
                          : 'text-slate-700'
                      }`}
                    >
                      ระดับ {s.level}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {s.count} ราย
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dedicated Ward vs Operation Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ward Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                สรุปจำนวนผู้ป่วยแยกตามหอผู้ป่วย (Ward)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                คลิกชื่อหอผู้ป่วยเพื่อกรองข้อมูลเฉพาะหอผู้ป่วยนั้น
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap shrink-0">
              {stats.wardList.length} หอผู้ป่วย · {stats.total} ราย
            </span>
          </div>

          {stats.wardList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              ไม่พบข้อมูลหอผู้ป่วยตามเงื่อนไขที่เลือก
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {stats.wardList.map((item) => {
                const barPct = Math.round((item.count / maxWard) * 100);
                const sharePct =
                  stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                const isSelected = wardFilter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setWardFilter(isSelected ? 'ALL' : item.key)}
                    title={item.label}
                    className={`w-full py-2.5 px-2 -mx-2 rounded-lg text-left grid grid-cols-[minmax(0,1fr)_96px_78px] items-center gap-3 text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span className="font-medium truncate">{item.label}</span>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isSelected ? 'bg-blue-800' : 'bg-blue-700'}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className="text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {item.count} ราย ({sharePct}%)
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Operation Breakdown (Sorted by Risk Highest -> Lowest by default) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                ลำดับความเสี่ยงหัตถการ (Operation Risk)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {operationSortBy === 'risk'
                  ? 'เรียงจากความเสี่ยงมากสุด → น้อยสุด (คลิกเพื่อกรองหัตถการ)'
                  : 'เรียงตามจำนวนเคสมากสุด → น้อยสุด (คลิกเพื่อกรองหัตถการ)'}
              </p>
            </div>
            <div className="no-print inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setOperationSortBy('risk')}
                className={`px-2 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                  operationSortBy === 'risk'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เรียงตาม Risk
              </button>
              <button
                type="button"
                onClick={() => setOperationSortBy('count')}
                className={`px-2 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                  operationSortBy === 'count'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เรียงตามจำนวนเคส
              </button>
            </div>
          </div>

          {stats.operationList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              ไม่พบข้อมูลการผ่าตัดตามเงื่อนไขที่เลือก
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {stats.operationList.map((item, idx) => {
                const barPct =
                  operationSortBy === 'risk'
                    ? Math.round((item.maxRisk / maxOperationRisk) * 100)
                    : Math.round((item.count / maxOperationCount) * 100);
                const isSelected = operationFilter === item.key;
                const riskBarColor =
                  item.maxRisk >= 75
                    ? 'bg-red-600'
                    : item.maxRisk >= 50
                    ? 'bg-amber-500'
                    : 'bg-blue-700';

                const riskMetaParts: string[] = [];
                if (item.highAsaCount > 0) riskMetaParts.push(`ASA III–VI: ${item.highAsaCount}`);
                if (item.emergencyCount > 0) riskMetaParts.push(`E: ${item.emergencyCount}`);
                if (item.airwayCount > 0) riskMetaParts.push(`Airway: ${item.airwayCount}`);

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setOperationFilter(isSelected ? 'ALL' : item.key)}
                    title={item.label}
                    className={`w-full py-2.5 px-2 -mx-2 rounded-lg text-left grid grid-cols-[minmax(0,1fr)_84px_62px] items-center gap-3 text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-slate-400 shrink-0">
                          {idx + 1}.
                        </span>
                        <span className="font-medium truncate">{item.label}</span>
                      </div>
                      {riskMetaParts.length > 0 && (
                        <div className="text-[11px] text-slate-500 truncate pl-4 mt-0.5">
                          {riskMetaParts.join(' · ')}
                        </div>
                      )}
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          isSelected
                            ? 'bg-blue-800'
                            : operationSortBy === 'risk'
                            ? riskBarColor
                            : 'bg-slate-700'
                        }`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className="text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {item.count} ราย
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>


      {/* Patient List Table (Sorted by Operation Risk Highest -> Lowest by default) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            {tableSortBy === 'risk'
              ? 'รายการผู้ป่วยเรียงตามความเสี่ยงหัตถการ (มากสุด → น้อยสุด)'
              : 'รายการผู้ป่วยเรียงตามวันที่ทำผ่าตัด'}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 tabular-nums">
            <div className="no-print inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setTableSortBy('risk')}
                className={`px-2 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                  tableSortBy === 'risk'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เรียงตาม Risk
              </button>
              <button
                type="button"
                onClick={() => setTableSortBy('date')}
                className={`px-2 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                  tableSortBy === 'date'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เรียงตามวันที่ผ่าตัด
              </button>
            </div>
            <span>
              แสดง {visibleRows.length} จาก {sortedFiltered.length} รายการ
            </span>
            {sortedFiltered.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllRows((prev) => !prev)}
                className="no-print font-medium text-blue-800 hover:underline whitespace-nowrap"
              >
                {showAllRows ? 'ย่อรายการ' : `ดูทั้งหมด (${sortedFiltered.length} ราย)`}
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2.5 px-4 font-semibold whitespace-nowrap">HN / AN</th>
                <th className="py-2.5 px-4 font-semibold whitespace-nowrap">ชื่อผู้ป่วย</th>
                <th className="py-2.5 px-4 font-semibold whitespace-nowrap">หอผู้ป่วย (Ward)</th>
                <th className="py-2.5 px-4 font-semibold whitespace-nowrap">การผ่าตัด (Operation)</th>
                <th className="py-2.5 px-4 font-semibold whitespace-nowrap">ASA</th>
                <th className="py-2.5 px-4 font-semibold whitespace-nowrap">ความเสี่ยง / ภาวะแทรกซ้อน</th>
                <th className="py-2.5 px-4 font-semibold text-right whitespace-nowrap">วันที่ผ่าตัด</th>
                {onSelectRecordPostOp && (
                  <th className="no-print py-2.5 px-4 font-semibold text-right whitespace-nowrap">
                    Post-op
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={onSelectRecordPostOp ? 8 : 7}
                    className="py-8 px-4 text-center text-slate-500"
                  >
                    <div className="space-y-2">
                      <p>ไม่พบรายการผู้ป่วยตามเงื่อนไขตัวกรองที่เลือก</p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          ล้างตัวกรองทั้งหมด
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                visibleRows.map((r) => {
                  const risk = riskById.get(r.id) ?? computeCaseRiskProfile(r);
                  const compSummary = summarizePostOpComplications(r.formData?.postOpComplication);
                  const flags: string[] = [...risk.topProblems];
                  if (isSurgeryPostponed(r)) {
                    const pReason = formatPostponementReasons(r.formData?.surgeryPostponement, true);
                    flags.unshift(pReason ? `เลื่อนผ่าตัด (${pReason})` : 'เลื่อนผ่าตัด');
                  }
                  if (isPreOpDraftNotVisited(r)) {
                    const nvReason = formatPreOpNotVisitedReasons(r.formData?.preOpNotVisited, true);
                    flags.unshift(nvReason ? `ไม่ได้เยี่ยม (${nvReason})` : 'ไม่ได้เยี่ยม Pre-op');
                  }
                  if (compSummary) {
                    flags.push(compSummary);
                  } else if (r.hasComplication && !flags.some((f) => /complication/i.test(f))) {
                    flags.push('Post-Op Complication');
                  }
                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelectRecord(r)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {r.hn || '—'}
                        {r.an ? ` · ${r.an}` : ''}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {r.patientName} {r.age ? `(${r.age} ปี)` : ''}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 whitespace-nowrap">
                        {r.ward || '—'}
                      </td>
                      <td
                        className="py-2.5 px-4 text-slate-800 max-w-[240px] truncate"
                        title={r.operation || ''}
                      >
                        {r.operation || '—'}
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                        {r.asaClass ? `ASA ${r.asaClass}${r.asaEmergency ? 'E' : ''}` : '—'}
                      </td>
                      <td
                        className="py-2.5 px-4 text-slate-700 max-w-[280px] truncate"
                        title={flags.join(' · ')}
                      >
                        {flags.length > 0 ? (
                          <span
                            className={`font-medium ${
                              risk.score >= 75 || r.hasComplication || isPreOpDraftNotVisited(r)
                                ? 'text-red-700'
                                : risk.score >= 50 || isSurgeryPostponed(r)
                                ? 'text-amber-800'
                                : 'text-slate-700'
                            }`}
                          >
                            {flags.join(' · ')}
                          </span>
                        ) : (
                          <span className="text-slate-500">ปกติตามแผน</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        <div>{r.dateOfOperation ? formatThaiDateBE(r.dateOfOperation) : '—'}</div>
                        {r.formData?.surgeryPostponement?.isPostponed &&
                          r.formData.surgeryPostponement.postponedToDate &&
                          r.formData.surgeryPostponement.postponedToDate !== r.dateOfOperation && (
                            <div className="text-[11px] text-amber-800 font-semibold">
                              → {formatThaiDateBE(r.formData.surgeryPostponement.postponedToDate)}
                            </div>
                          )}
                      </td>
                      {onSelectRecordPostOp && (
                        <td className="no-print py-2.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRecordPostOp(r);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap"
                          >
                            แก้ไข Post-op
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

