export type EvaluationStatus = 'draft' | 'evaluated' | 'post_op_completed' | 'locked';
export type ScheduleType = 'elective' | 'emergency';
export type AsaClass = '' | 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
export type AnesthesiaSummaryType = '' | 'GA' | 'RA' | 'GA+RA';

export const OR_ROOM_OPTIONS = [
  'OR 1',
  'OR 2',
  'OR 3',
  'OR 4',
  'OR 5',
  'ห้องคลอด',
] as const;
export type TriStatus = 'none' | 'no' | 'yes';
export type NormalAbnormal = '' | 'normal' | 'abnormal';
export type NormalLimited = '' | 'normal' | 'limited';
export type ThyromentalDist = '' | '<6' | '>=6';
export type MallampatiClass = '' | 'I' | 'II' | 'III' | 'IV';
export type ToothCondition = 'Normal' | 'Denture' | 'Loose' | 'Avulsion';
export type ToothMarkMode = 'cycle' | 'missing' | 'loose' | 'clear';
export type GaMethod = 'Intubation' | 'LMA' | 'Mask' | 'TIVA' | 'Other';
export type RaMethod = 'Spinal block' | 'Epidural' | 'Nerve block' | 'Other';
export type DurationUnit = 'months' | 'years';
export type OxygenSupportMode = '' | 'cannula' | 'mask_bag' | 'ett' | 'other';
export type VentilatorMode = '' | 'vcv' | 'pcv';
export type BloodPrepStatus = 'no_blood' | 'ready' | 'not_ready' | 'waiting_red_cross' | 'other';

export const BLOOD_PREP_STATUS_OPTIONS: readonly { value: BloodPrepStatus; label: string }[] = [
  { value: 'no_blood', label: 'ไม่มีจองเลือด' },
  { value: 'ready', label: 'พร้อมใช้' },
  { value: 'not_ready', label: 'ไม่พร้อมใช้' },
  { value: 'waiting_red_cross', label: 'รอเลือดจากกาชาด' },
  { value: 'other', label: 'อื่นๆ' },
] as const;

export const TOOTH_IDS = [
  'u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8',
  'l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10',
] as const;

export type ToothId = (typeof TOOTH_IDS)[number];

export const TOOTH_LABELS: Record<ToothId, string> = {
  u1: 'บนขวา 4',
  u2: 'เขี้ยวบนขวา',
  u3: 'หน้าข้างบนขวา',
  u4: 'หน้ากลางบนขวา',
  u5: 'หน้ากลางบนซ้าย',
  u6: 'หน้าข้างบนซ้าย',
  u7: 'เขี้ยวบนซ้าย',
  u8: 'บนซ้าย 4',
  l1: 'ล่างขวา 5',
  l2: 'ล่างขวา 4',
  l3: 'เขี้ยวล่างขวา',
  l4: 'หน้าข้างล่างขวา',
  l5: 'หน้ากลางล่างขวา',
  l6: 'หน้ากลางล่างซ้าย',
  l7: 'หน้าข้างล่างซ้าย',
  l8: 'เขี้ยวล่างซ้าย',
  l9: 'ล่างซ้าย 4',
  l10: 'ล่างซ้าย 5',
};

export const DEFAULT_OXYGEN_OTHER_PRESETS = [
  'Room air',
  'HFNC',
  'On T-piece',
  'On Collar mask',
  'BiPAP / NIV',
] as const;

export const DRUG_ADDICTION_OPTIONS = [
  'ยาบ้า',
  'กัญชา',
  'น้ำกระท่อม',
  'เฮโรอีน',
  'ยาไอซ์',
] as const;

export const DEFAULT_WARD_LIST = [
  'ศัลยกรรมชาย',
  'ศัลยกรรมหญิง',
  'ห้องคลอด',
  'หลังคลอด',
  'พิเศษ',
  'พิเศษรวม',
  'กุมาร',
  'ICU',
  'อายุรกรรมชาย',
  'อายุรกรรมหญิง',
] as const;

export const WARD_OPTIONS = [...DEFAULT_WARD_LIST, 'อื่นๆ'] as const;

export const DEFAULT_SURGEON_LIST = [
  'นพ.คริส ผลประเสริฐ',
  'นพ.ชยธร การุณวรรธนะ',
  'นพ.ชัชวาล สืบนุการณ์',
  'นพ.ไชยฤทธิ์ แสงสุรีย์วัชชรา',
  'พญ.ฐิติกา ลิ้มธเนศกุล',
  'พญ.ฑิตาพร รุ่งระวี',
  'พญ.ตรีรินทร์ ยิ่งยงวัฒนวิทยา',
  'นพ.ธนพรรษ ลือวิเศษไพบูลย์',
  'นพ.ธนวัฒน์ เต็งศิริโกมล',
  'นพ.ธนิศร ตั้งประยูรเลิศ',
  'พญ.ปวีณา อมรเพชรกุล',
  'พญ.ปรางทิพย์ อัครานุรักษ์กุล',
  'พญ.ผกาภรณ์ พุฒิวิญญู',
  'นพ.พงศ์ธร หาญบุญคุณูปการ',
  'นพ.วรภพ ไตรรัตนาภิกุล',
  'นพ.สมศักดิ์ ใช้ทรัพย์สถาพร',
  'ทพญ.สุชญา พืชน์ไพบูลย์',
  'พญ.หฤทัยทิพย์ ภัทรวิทย์',
  'ทพ.อนุพงศ์ สุรเศรณีวงศ์',
  'นพ.อภิชาติ เหมะ',
  'นพ.อรรณพ มณีนุตร์',
  'พญ.อุษา ชัยวัตรสกุล',
] as const;

export const DEFAULT_SUMMARIZER_LIST = [
  'น.ส.จิณห์วรา ภาระเวช',
  'นางจุรีพร ระวัง',
  'นางธัญลักษณ์ อุบลวรรณา',
  'น.ส.บัณฑิตา คเชนทร์พลอย',
  'น.ส.พัชราภรณ์ วงศ์คำไชย',
  'น.ส.พิมพ์พร วงศ์วิฉาย',
  'พว.วชิราภรณ์ กุลสันติธรรม',
] as const;

export interface HistoryData {
  presentIllness: string;
  pastIllness: string;
  allergyStatus: TriStatus;
  allergyDetail: string;
  underlyingStatus: TriStatus;
  dm: boolean;
  dmYears: string;
  ht: boolean;
  htYears: string;
  dlp: boolean;
  dlpYears: string;
  ckd: boolean;
  ckdYears: string;
  heartDisease: boolean;
  heartDiseaseYears: string;
  otherUnderlying: string[];
  medication: string;
  previousOps: string[];
  previousOpComplication: string;
  drinkingStatus: TriStatus;
  drinkingDaysPerWeek: string;
  drinkingYears: string;
  drinkingDurationUnit: DurationUnit;
  drinkingQuit: boolean;
  drinkingQuitDuration: string;
  drinkingQuitUnit: DurationUnit;
  smokingStatus: TriStatus;
  smokingCigsPerDay: string;
  smokingYears: string;
  smokingDurationUnit: DurationUnit;
  smokingQuit: boolean;
  smokingQuitDuration: string;
  smokingQuitUnit: DurationUnit;
  drugAddictionStatus: TriStatus;
  drugAddictionTypes: string[];
  drugAddictionOther: string;
  drugAddictionAmount: string;
  drugAddictionYears: string;
  drugAddictionDurationUnit: DurationUnit;
  drugAddictionQuit: boolean;
  drugAddictionQuitDuration: string;
  drugAddictionQuitUnit: DurationUnit;
}

export interface OxygenSupportData {
  mode: OxygenSupportMode;
  cannulaLpm: string;
  maskBagLpm: string;
  ettSize: string;
  ettDeep: string;
  ventMode: VentilatorMode;
  tv: string;
  rr: string;
  fio2: string;
  peep: string;
  pins: string;
  otherItems: string[];
}

export interface PhysicalExamData {
  bw: string;
  ht: string;
  bmi: string;
  bp: string;
  pulse: string;
  rr: string;
  temp: string;
  spo2: string;
  oxygenSupport: OxygenSupportData;
  toothStatus: ToothCondition[];
  toothDetail: string;
  missingTeeth: string[];
  looseTeeth: string[];
  mouthOpening: NormalLimited;
  mouthOpeningDetail: string;
  neckMovement: NormalLimited;
  neckMovementDetail: string;
  thyromentalDistance: ThyromentalDist;
  thyromentalDistanceDetail: string;
  mallampatiClass: MallampatiClass;
  expectedDifficultAirway: TriStatus;
  breathSound: NormalAbnormal;
  breathSoundDetail: string;
  heartSound: NormalAbnormal;
  heartSoundDetail: string;
  functionalCapacity: string;
}

export interface InvestigationData {
  cxrStatus: NormalAbnormal;
  cxrDetail: string;
  ekgStatus: NormalAbnormal;
  ekgDetail: string;
  other: string;
}

export interface LaboratoryData {
  hb: string;
  hct: string;
  wbc: string;
  plt: string;
  neutrophil: string;
  lymphocyte: string;
  na: string;
  k: string;
  cl: string;
  co2: string;
  bun: string;
  cr: string;
  pt: string;
  ptt: string;
  inr: string;
  sgot: string;
  sgpt: string;
  alp: string;
  alb: string;
  glucose: string;
  hba1c: string;
  other: string;
  prepTs: boolean;
  prepPrc: string;
  prepFfp: string;
  prepPlt: string;
  prepStatuses: BloodPrepStatus[];
  prepStatusDetail: string;
}

export interface PremedicationData {
  items: string[];
  npoTime: string;
  onIvf: string;
}

export interface AnestheticPlanData {
  gaSelected: boolean;
  gaMethods: GaMethod[];
  gaOther: string;
  raSelected: boolean;
  raMethods: RaMethod[];
  raOther: string;
}

export interface PostAnesthesiaData {
  summarizedBy: string;
  summarizedDate: string;
  bp: string;
  pulse: string;
  rr: string;
  temp: string;
  spo2: string;
  painScore: string;
  complicationStatus: TriStatus;
  complicationDetail: string;
  visitBy: string;
  visitDate: string;
}

export interface EvaluationFormData {
  history: HistoryData;
  physicalExam: PhysicalExamData;
  investigation: InvestigationData;
  laboratory: LaboratoryData;
  premedication: PremedicationData;
  consult: string;
  problemList: string[];
  anestheticPlan: AnestheticPlanData;
  preparationOrders: string[];
  postAnesthesia: PostAnesthesiaData;
}

export interface PreAnestheticEvaluation {
  id: string;
  ownerId: string;
  status: EvaluationStatus;
  patientName: string;
  hn: string;
  an: string;
  age: string;
  ward: string;
  dateOfVisit: string;
  dateOfOperation: string;
  operationTime: string;
  scheduleType?: ScheduleType;
  orRoom?: string;
  caseOrder?: string;
  surgeon: string;
  diagnosis: string;
  operation: string;
  asaClass: AsaClass;
  asaEmergency: boolean;
  expectedDifficultAirway: boolean;
  hasComplication: boolean;
  anesthesiaType: AnesthesiaSummaryType;
  formData: EvaluationFormData;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MedicationGroup {
  id: string;
  label: string;
  items: string[];
  autoUnderlying?: 'ht' | 'dm' | 'dlp' | 'heartDisease';
}

export const DEFAULT_MEDICATION_GROUPS: MedicationGroup[] = [
  {
    id: 'ht',
    label: '1. HT',
    items: ['Amlodipine (5) 1x1', 'Amlodipine (10) 1x1', 'Atenolol (50) 1x1'],
    autoUnderlying: 'ht',
  },
  {
    id: 'dm',
    label: '2. DM',
    items: ['MFM (500) 1x1', 'GPZ', 'Mixtard', 'Insulin'],
    autoUnderlying: 'dm',
  },
  {
    id: 'lipid',
    label: '3. ยาไขมัน',
    items: ['Simvastatin (10) 1x1', 'Atorvastatin (40) 1x1'],
    autoUnderlying: 'dlp',
  },
  {
    id: 'heart',
    label: '4. โรคหัวใจ',
    items: ['Isordil'],
    autoUnderlying: 'heartDisease',
  },
  {
    id: 'anticoag',
    label: '5. Anticoagulant',
    items: ['ASA'],
  },
  {
    id: 'antiplatelet',
    label: '6. Antiplatelet',
    items: ['Clopidogrel'],
  },
  {
    id: 'hiv',
    label: '7. ยาต้าน HIV',
    items: ['ยาต้าน HIV'],
  },
  {
    id: 'asthma_copd',
    label: '8. ยา Asthma / COPD',
    items: ['Berodual MDI', 'Salbutamol MDI'],
  },
  {
    id: 'tb',
    label: '9. ยาต้าน TB',
    items: ['ยาต้าน TB'],
  },
  {
    id: 'other',
    label: '10. ยาอื่นๆ',
    items: [],
  },
];

export function sanitizeMedicationGroups(raw: unknown): MedicationGroup[] {
  if (!Array.isArray(raw)) return DEFAULT_MEDICATION_GROUPS.map((g) => ({ ...g, items: [...g.items] }));
  const cleaned: MedicationGroup[] = [];
  for (const entry of raw.slice(0, 20)) {
    if (!entry || typeof entry !== 'object') continue;
    const obj = entry as Record<string, unknown>;
    const id = typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim().slice(0, 64) : `grp_${cleaned.length + 1}`;
    if (id === 'hepatitis') {
      cleaned.push({
        id: 'asthma_copd',
        label: '8. ยา Asthma / COPD',
        items: ['Berodual MDI', 'Salbutamol MDI'],
      });
      continue;
    }
    const label = typeof obj.label === 'string' && obj.label.trim() ? obj.label.trim().slice(0, 100) : `กลุ่มที่ ${cleaned.length + 1}`;
    const items = Array.isArray(obj.items)
      ? obj.items
          .filter((it): it is string => typeof it === 'string' && it.trim().length > 0)
          .map((it) => it.trim().slice(0, 120))
          .slice(0, 30)
      : [];
    const groupObj: MedicationGroup = { id, label, items };
    if (
      obj.autoUnderlying === 'ht' ||
      obj.autoUnderlying === 'dm' ||
      obj.autoUnderlying === 'dlp' ||
      obj.autoUnderlying === 'heartDisease'
    ) {
      groupObj.autoUnderlying = obj.autoUnderlying;
    } else if (id === 'lipid') {
      groupObj.autoUnderlying = 'dlp';
    }
    cleaned.push(groupObj);
  }
  return cleaned.length > 0 ? cleaned : DEFAULT_MEDICATION_GROUPS.map((g) => ({ ...g, items: [...g.items] }));
}

export function sanitizeWardList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_WARD_LIST];
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim().slice(0, 80);
    if (!trimmed || trimmed === 'อื่นๆ' || seen.has(trimmed)) continue;
    seen.add(trimmed);
    cleaned.push(trimmed);
    if (cleaned.length >= 40) break;
  }
  return cleaned;
}

const SURGEON_PREFIX_RE =
  /^(?:พว\.|ทพญ\.|ทพ\.|พญ\.|นพ\.|ศ\.นพ\.|รศ\.นพ\.|ผศ\.นพ\.|ศ\.พญ\.|รศ\.พญ\.|ผศ\.พญ\.|ดร\.|พ\.ต\.อ\.|พ\.ต\.ท\.|พ\.ต\.ต\.|ร\.ต\.อ\.|น\.ส\.|นาย|นางสาว|นาง)\s*/;

export function sortSurgeonNames(list: readonly string[]): string[] {
  const collator = new Intl.Collator('th', { sensitivity: 'base' });
  return [...list].sort((a, b) => {
    const cleanA = a.replace(SURGEON_PREFIX_RE, '').trim();
    const cleanB = b.replace(SURGEON_PREFIX_RE, '').trim();
    const cmp = collator.compare(cleanA, cleanB);
    return cmp !== 0 ? cmp : collator.compare(a, b);
  });
}

export function sanitizeSurgeonList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return sortSurgeonNames(DEFAULT_SURGEON_LIST);
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'string') continue;
    let trimmed = entry.trim().slice(0, 120);
    if (trimmed === 'พญ.อุษา นาคะ' || trimmed === 'พญ. อุษา นาคะ') {
      trimmed = 'พญ.อุษา ชัยวัตรสกุล';
    }
    if (!trimmed || trimmed === 'อื่นๆ' || seen.has(trimmed)) continue;
    seen.add(trimmed);
    cleaned.push(trimmed);
    if (cleaned.length >= 100) break;
  }
  return sortSurgeonNames(cleaned);
}

export function sanitizeSummarizerList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return sortSurgeonNames(DEFAULT_SUMMARIZER_LIST);
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim().slice(0, 120);
    if (!trimmed || trimmed === 'อื่นๆ' || seen.has(trimmed)) continue;
    seen.add(trimmed);
    cleaned.push(trimmed);
    if (cleaned.length >= 100) break;
  }
  return sortSurgeonNames(cleaned);
}

export function sanitizeOxygenPresets(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_OXYGEN_OTHER_PRESETS];
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim().slice(0, 120);
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    cleaned.push(trimmed);
    if (cleaned.length >= 40) break;
  }
  return cleaned;
}

export function createEmptyOxygenSupport(): OxygenSupportData {
  return {
    mode: '',
    cannulaLpm: '',
    maskBagLpm: '',
    ettSize: '',
    ettDeep: '',
    ventMode: '',
    tv: '',
    rr: '',
    fio2: '',
    peep: '',
    pins: '',
    otherItems: [],
  };
}

export interface SelectedMedicationEntry {
  name: string;
  dose: string;
  regimen: string;
}

function normalizeDoseDisplay(rawDose: string): string {
  const trimmed = rawDose.trim();
  if (!trimmed) return '';
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return `${trimmed} mg`;
  }
  return trimmed;
}

export function parseMedicationEntry(raw: string): SelectedMedicationEntry {
  const text = raw.trim();
  if (!text) return { name: '', dose: '', regimen: '' };

  // Pattern 1: "Name (5) 1x1" or "Name (500 mg) 1x2 pc"
  const parenMatch = text.match(/^([^(]+?)\s*\(([^)]+)\)\s*(.*)$/);
  if (parenMatch) {
    const inside = parenMatch[2].trim();
    if (/^\d+(?:\.\d+)?(?:\s*(?:mg|mcg|g|ml|u|iu|unit|units|%|tab|tabs|เม็ด))?$/i.test(inside) || /\d/.test(inside)) {
      return {
        name: parenMatch[1].trim(),
        dose: normalizeDoseDisplay(inside),
        regimen: parenMatch[3].trim(),
      };
    }
  }

  // Pattern 2: "Name 500 mg 1x1"
  const inlineDoseMatch = text.match(/^(.+?)\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|u|iu|unit|units))\s*(.*)$/i);
  if (inlineDoseMatch) {
    return {
      name: inlineDoseMatch[1].trim(),
      dose: inlineDoseMatch[2].trim(),
      regimen: inlineDoseMatch[3].trim(),
    };
  }

  // Pattern 3: "Name 1x1 ..."
  const regOnlyMatch = text.match(/^(.+?)\s+(\d+x\d+.*)$/i);
  if (regOnlyMatch) {
    return {
      name: regOnlyMatch[1].trim(),
      dose: '',
      regimen: regOnlyMatch[2].trim(),
    };
  }

  return { name: text, dose: '', regimen: '' };
}

export function formatMedicationEntry(entry: SelectedMedicationEntry): string {
  const n = entry.name.trim();
  const d = entry.dose.trim();
  const r = entry.regimen.trim();
  if (!n) return '';
  return `${n}${d ? ` (${d})` : ''}${r ? ` ${r}` : ''}`;
}

export function parseMedicationList(medicationText: string): SelectedMedicationEntry[] {
  return medicationText
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(parseMedicationEntry);
}

export function serializeMedicationList(entries: SelectedMedicationEntry[]): string {
  return entries
    .map(formatMedicationEntry)
    .filter(Boolean)
    .join(', ');
}

function entriesMatchPreset(entry: SelectedMedicationEntry, presetEntry: SelectedMedicationEntry): boolean {
  if (entry.name.trim().toLowerCase() !== presetEntry.name.trim().toLowerCase()) {
    return false;
  }
  const presetDigits = presetEntry.dose.match(/\d+(?:\.\d+)?/)?.[0];
  if (!presetDigits) return true;
  const entryDigits = entry.dose.match(/\d+(?:\.\d+)?/)?.[0];
  return entryDigits === presetDigits;
}

export function hasMedicationToken(medicationText: string, drugPreset: string): boolean {
  const presetEntry = parseMedicationEntry(drugPreset);
  const entries = parseMedicationList(medicationText);
  return entries.some((entry) => entriesMatchPreset(entry, presetEntry));
}

export function toggleMedicationToken(medicationText: string, drugPreset: string): string {
  const presetEntry = parseMedicationEntry(drugPreset);
  const entries = parseMedicationList(medicationText);
  const exists = entries.some((entry) => entriesMatchPreset(entry, presetEntry));
  if (exists) {
    return serializeMedicationList(
      entries.filter((entry) => !entriesMatchPreset(entry, presetEntry)),
    );
  }
  return serializeMedicationList([...entries, presetEntry]);
}

export type AutoPremedDrugClass = 'CCB' | 'Beta-blocker';

const CCB_DRUG_PATTERNS: readonly RegExp[] = [
  /\bamlodipin(?:e)?\b/i,
  /\bs-amlodipin(?:e)?\b/i,
  /\blevamlodipin(?:e)?\b/i,
  /\besamlodipin(?:e)?\b/i,
  /\bnorvasc\b/i,
  /\bamlopine\b/i,
  /\bnifedipin(?:e)?\b/i,
  /\badalat\b/i,
  /\bnifecard\b/i,
  /\bnelapine\b/i,
  /\bnifelat\b/i,
  /\bmanidipin(?:e)?\b/i,
  /\bmadiplot\b/i,
  /\bfelodipin(?:e)?\b/i,
  /\bplendil\b/i,
  /\bler(?:ca)?nidipin(?:e)?\b/i,
  /\bzanidip\b/i,
  /\bnicardipin(?:e)?\b/i,
  /\bnimodipin(?:e)?\b/i,
  /\bbenidipin(?:e)?\b/i,
  /\bbarnidipin(?:e)?\b/i,
  /\bcilnidipin(?:e)?\b/i,
  /\bazelnidipin(?:e)?\b/i,
  /\bisradipin(?:e)?\b/i,
  /\blacidipin(?:e)?\b/i,
  /\bnisoldipin(?:e)?\b/i,
  /\bnitrendipin(?:e)?\b/i,
  /\bclevidipin(?:e)?\b/i,
  /\bdiltiazem\b/i,
  /\bherbesser\b/i,
  /\bcardizem\b/i,
  /\bverapamil\b/i,
  /\bisoptin\b/i,
  /\bcalcium\s*channel\s*block(?:er)?s?\b/i,
  /\bccb\b/i,
];

const BETA_BLOCKER_PATTERNS: readonly RegExp[] = [
  /\batenolol\b/i,
  /\btenormin\b/i,
  /\bprenolol\b/i,
  /\bmetoprolol\b/i,
  /\bbetaloc\b/i,
  /\blopressor\b/i,
  /\btoprol\b/i,
  /\bbisoprolol\b/i,
  /\bconcor\b/i,
  /\bnovacor\b/i,
  /\bpropranolol\b/i,
  /\binderal\b/i,
  /\bbetalol\b/i,
  /\bcarvedilol\b/i,
  /\bdilatrend\b/i,
  /\bcarvid\b/i,
  /\bnebivolol\b/i,
  /\bnebilet\b/i,
  /\blabetalol\b/i,
  /\btrandate\b/i,
  /\bnadolol\b/i,
  /\bpindolol\b/i,
  /\bsotalol\b/i,
  /\btimolol\b/i,
  /\bbetaxolol\b/i,
  /\bacebutolol\b/i,
  /\bceliprolol\b/i,
  /\besmolol\b/i,
  /\boxprenolol\b/i,
  /\bpenbutolol\b/i,
  /\bcarteolol\b/i,
  /\bbeta[\s-]*block(?:er)?s?\b/i,
];

export function detectAutoPremedDrugClass(medText: string): AutoPremedDrugClass | null {
  const cleaned = medText.trim();
  if (!cleaned) return null;
  if (CCB_DRUG_PATTERNS.some((re) => re.test(cleaned))) return 'CCB';
  if (BETA_BLOCKER_PATTERNS.some((re) => re.test(cleaned))) return 'Beta-blocker';
  return null;
}

export interface AutoPremedEntry {
  entry: SelectedMedicationEntry;
  drugClass: AutoPremedDrugClass;
  orderText: string;
}

function formatLegacyAutoPremedOrder(entry: SelectedMedicationEntry): string {
  const formatted = formatMedicationEntry(entry);
  if (!formatted) return '';
  return `Continue ${formatted} เช้าวันผ่าตัด (with sip of water)`.slice(0, 200);
}

export function formatAutoPremedOrder(entry: SelectedMedicationEntry): string {
  const formatted = formatMedicationEntry(entry);
  if (!formatted) return '';
  return `${formatted} เวลา 06.00 น. เช้าวันผ่าตัด`.slice(0, 200);
}

export function getAutoPremedEntries(medicationText: string): AutoPremedEntry[] {
  const entries = parseMedicationList(medicationText);
  const results: AutoPremedEntry[] = [];
  const seenOrders = new Set<string>();
  for (const entry of entries) {
    const drugClass = detectAutoPremedDrugClass(entry.name);
    if (!drugClass) continue;
    const orderText = formatAutoPremedOrder(entry);
    if (!orderText) continue;
    const key = orderText.toLowerCase();
    if (seenOrders.has(key)) continue;
    seenOrders.add(key);
    results.push({ entry, drugClass, orderText });
  }
  return results;
}

function insertPremedLine(items: string[], line: string): void {
  const emptyIdx = items.findIndex((x) => !x.trim());
  if (emptyIdx !== -1) {
    items[emptyIdx] = line;
  } else if (items.length < 10) {
    items.push(line);
  }
}

function normalizePremedSlots(items: string[], compactNonEmpty: boolean): string[] {
  const list = compactNonEmpty ? items.filter((x) => x.trim().length > 0) : [...items];
  const minSlots = Math.max(4, list.length);
  while (list.length < minSlots && list.length < 10) {
    list.push('');
  }
  return list.slice(0, 10);
}

export function syncPremedicationWithMedications(
  currentItems: string[],
  prevMedicationText: string,
  nextMedicationText: string,
): string[] {
  const prevAuto = getAutoPremedEntries(prevMedicationText);
  const nextAuto = getAutoPremedEntries(nextMedicationText);

  if (prevAuto.length === 0 && nextAuto.length === 0) {
    return currentItems;
  }

  const nextOrderSet = new Set(nextAuto.map((a) => a.orderText.toLowerCase()));
  const items = [...currentItems];
  const consumedNextOrders = new Set<string>();
  let removedAny = false;

  // 1. Update in-place or remove previous auto-generated orders
  for (const prev of prevAuto) {
    const prevLower = prev.orderText.toLowerCase();
    if (nextOrderSet.has(prevLower)) {
      consumedNextOrders.add(prevLower);
      continue;
    }

    const prevLegacyLower = formatLegacyAutoPremedOrder(prev.entry).toLowerCase();
    const existingIdx = items.findIndex((it) => {
      const trimmedLower = it.trim().toLowerCase();
      return trimmedLower === prevLower || trimmedLower === prevLegacyLower;
    });
    if (existingIdx === -1) continue;

    // Look for an updated entry with the same drug name in nextAuto
    const prevNameLower = prev.entry.name.trim().toLowerCase();
    const replacement = nextAuto.find(
      (n) =>
        n.entry.name.trim().toLowerCase() === prevNameLower &&
        !consumedNextOrders.has(n.orderText.toLowerCase()) &&
        !items.some((it) => it.trim().toLowerCase() === n.orderText.toLowerCase()),
    );

    if (replacement) {
      items[existingIdx] = replacement.orderText;
      consumedNextOrders.add(replacement.orderText.toLowerCase());
    } else {
      items[existingIdx] = '';
      removedAny = true;
    }
  }

  // 2. Insert newly added CCB / Beta-blocker entries
  const nameCounts = new Map<string, number>();
  for (const n of nextAuto) {
    const nm = n.entry.name.trim().toLowerCase();
    nameCounts.set(nm, (nameCounts.get(nm) || 0) + 1);
  }

  for (const next of nextAuto) {
    const nextLower = next.orderText.toLowerCase();
    if (consumedNextOrders.has(nextLower)) continue;
    if (items.some((it) => it.trim().toLowerCase() === nextLower)) continue;

    const nm = next.entry.name.trim().toLowerCase();
    const isSingleOfName = (nameCounts.get(nm) || 0) === 1;
    if (isSingleOfName && items.some((it) => it.trim().toLowerCase().includes(nm))) {
      continue;
    }

    insertPremedLine(items, next.orderText);
  }

  return normalizePremedSlots(items, removedAny);
}

export function getMissingAutoPremedEntries(
  currentItems: string[],
  medicationText: string,
): AutoPremedEntry[] {
  const autoEntries = getAutoPremedEntries(medicationText);
  if (autoEntries.length === 0) return [];
  const lowerItems = currentItems.map((it) => it.trim().toLowerCase()).filter(Boolean);
  return autoEntries.filter((auto) => {
    const orderLower = auto.orderText.toLowerCase();
    const nameLower = auto.entry.name.trim().toLowerCase();
    return !lowerItems.some((it) => it === orderLower || it.includes(nameLower));
  });
}

export function applyMissingAutoPremeds(
  currentItems: string[],
  medicationText: string,
): string[] {
  const missing = getMissingAutoPremedEntries(currentItems, medicationText);
  if (missing.length === 0) return currentItems;
  const items = [...currentItems];
  for (const entry of missing) {
    insertPremedLine(items, entry.orderText);
  }
  return normalizePremedSlots(items, false);
}

export const FIELD_LIMITS = {
  id: 64,
  ownerId: 128,
  patientName: 120,
  hn: 40,
  an: 40,
  age: 16,
  ward: 80,
  date: 32,
  operationTime: 32,
  orRoom: 32,
  caseOrder: 16,
  surgeon: 120,
  diagnosis: 300,
  operation: 300,
  shortStr: 20,
  medStr: 200,
  longStr: 1000,
  consult: 1500,
} as const;

export function generateEvaluationId(): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `eval_${Date.now()}_${random}`;
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  const base = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date();
  base.setDate(base.getDate() + days);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getEffectiveScheduleType(record: PreAnestheticEvaluation): ScheduleType {
  if (record.scheduleType === 'emergency' || record.scheduleType === 'elective') {
    return record.scheduleType;
  }
  return record.asaEmergency ? 'emergency' : 'elective';
}

export function formatThaiScheduleDate(isoDate: string): { label: string; relativeTag: string } {
  const trimmed = (isoDate || '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return { label: 'ยังไม่ระบุวันที่ผ่าตัด', relativeTag: '' };
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const target = new Date(year, month, day);

  const todayStr = getTodayIsoDate();
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const todayDate = new Date(ty, tm - 1, td);
  const diffDays = Math.round((target.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

  const weekdays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const months = [
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
  const beYear = year + 543;
  const label = `วัน${weekdays[target.getDay()]}ที่ ${day} ${months[month]} ${beYear}`;

  let relativeTag = '';
  if (diffDays === 0) relativeTag = 'วันนี้';
  else if (diffDays === 1) relativeTag = 'พรุ่งนี้';
  else if (diffDays === 2) relativeTag = 'มะรืนนี้';
  else if (diffDays > 2) relativeTag = `อีก ${diffDays} วัน`;
  else if (diffDays === -1) relativeTag = 'เมื่อวาน';
  else relativeTag = `ผ่านมาแล้ว ${Math.abs(diffDays)} วัน`;

  return { label, relativeTag };
}

export function compareElectiveSchedule(
  a: PreAnestheticEvaluation,
  b: PreAnestheticEvaluation,
  direction: 'asc' | 'desc' = 'asc',
): number {
  const dateA = (a.dateOfOperation || '').trim();
  const dateB = (b.dateOfOperation || '').trim();

  if (dateA !== dateB) {
    if (!dateA) return 1;
    if (!dateB) return -1;
    return direction === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
  }

  const roomA = (a.orRoom || '').trim();
  const roomB = (b.orRoom || '').trim();
  if (roomA !== roomB) {
    if (!roomA) return 1;
    if (!roomB) return -1;
    const roomCmp = roomA.localeCompare(roomB, 'th', { numeric: true });
    if (roomCmp !== 0) return roomCmp;
  }

  const orderA = parseInt((a.caseOrder || '').trim(), 10);
  const orderB = parseInt((b.caseOrder || '').trim(), 10);
  const hasOrderA = Number.isFinite(orderA);
  const hasOrderB = Number.isFinite(orderB);
  if (hasOrderA !== hasOrderB) return hasOrderA ? -1 : 1;
  if (hasOrderA && hasOrderB && orderA !== orderB) return orderA - orderB;

  const timeA = (a.operationTime || '').trim();
  const timeB = (b.operationTime || '').trim();
  if (timeA !== timeB) {
    if (!timeA) return 1;
    if (!timeB) return -1;
    const timeCmp = timeA.localeCompare(timeB);
    if (timeCmp !== 0) return timeCmp;
  }

  return (a.patientName || '').localeCompare(b.patientName || '', 'th');
}

export function createEmptyEvaluation(
  ownerId = 'local',
  overrides?: Partial<Pick<PreAnestheticEvaluation, 'dateOfOperation' | 'dateOfVisit' | 'orRoom' | 'caseOrder' | 'operationTime' | 'scheduleType' | 'asaEmergency'>>,
): PreAnestheticEvaluation {
  const today = getTodayIsoDate();
  const scheduleType: ScheduleType =
    overrides?.scheduleType ?? (overrides?.asaEmergency ? 'emergency' : 'elective');
  return {
    id: generateEvaluationId(),
    ownerId,
    status: 'draft',
    patientName: '',
    hn: '',
    an: '',
    age: '',
    ward: '',
    dateOfVisit: overrides?.dateOfVisit ?? today,
    dateOfOperation: overrides?.dateOfOperation ?? today,
    operationTime: overrides?.operationTime ?? '',
    scheduleType,
    orRoom: overrides?.orRoom ?? '',
    caseOrder: overrides?.caseOrder ?? '',
    surgeon: '',
    diagnosis: '',
    operation: '',
    asaClass: '',
    asaEmergency: false,
    expectedDifficultAirway: false,
    hasComplication: false,
    anesthesiaType: '',
    formData: {
      history: {
        presentIllness: '',
        pastIllness: '',
        allergyStatus: 'none',
        allergyDetail: '',
        underlyingStatus: 'none',
        dm: false,
        dmYears: '',
        ht: false,
        htYears: '',
        dlp: false,
        dlpYears: '',
        ckd: false,
        ckdYears: '',
        heartDisease: false,
        heartDiseaseYears: '',
        otherUnderlying: [''],
        medication: '',
        previousOps: ['', '', ''],
        previousOpComplication: '',
        drinkingStatus: 'none',
        drinkingDaysPerWeek: '',
        drinkingYears: '',
        drinkingDurationUnit: 'years',
        drinkingQuit: false,
        drinkingQuitDuration: '',
        drinkingQuitUnit: 'years',
        smokingStatus: 'none',
        smokingCigsPerDay: '',
        smokingYears: '',
        smokingDurationUnit: 'years',
        smokingQuit: false,
        smokingQuitDuration: '',
        smokingQuitUnit: 'years',
        drugAddictionStatus: 'none',
        drugAddictionTypes: [],
        drugAddictionOther: '',
        drugAddictionAmount: '',
        drugAddictionYears: '',
        drugAddictionDurationUnit: 'years',
        drugAddictionQuit: false,
        drugAddictionQuitDuration: '',
        drugAddictionQuitUnit: 'years',
      },
      physicalExam: {
        bw: '',
        ht: '',
        bmi: '',
        bp: '',
        pulse: '',
        rr: '',
        temp: '',
        spo2: '',
        oxygenSupport: createEmptyOxygenSupport(),
        toothStatus: [],
        toothDetail: '',
        missingTeeth: [],
        looseTeeth: [],
        mouthOpening: '',
        mouthOpeningDetail: '',
        neckMovement: '',
        neckMovementDetail: '',
        thyromentalDistance: '',
        thyromentalDistanceDetail: '',
        mallampatiClass: '',
        expectedDifficultAirway: 'none',
        breathSound: '',
        breathSoundDetail: '',
        heartSound: '',
        heartSoundDetail: '',
        functionalCapacity: '',
      },
      investigation: {
        cxrStatus: '',
        cxrDetail: '',
        ekgStatus: '',
        ekgDetail: '',
        other: '',
      },
      laboratory: {
        hb: '',
        hct: '',
        wbc: '',
        plt: '',
        neutrophil: '',
        lymphocyte: '',
        na: '',
        k: '',
        cl: '',
        co2: '',
        bun: '',
        cr: '',
        pt: '',
        ptt: '',
        inr: '',
        sgot: '',
        sgpt: '',
        alp: '',
        alb: '',
        glucose: '',
        hba1c: '',
        other: '',
        prepTs: false,
        prepPrc: '',
        prepFfp: '',
        prepPlt: '',
        prepStatuses: [],
        prepStatusDetail: '',
      },
      premedication: {
        items: ['', '', '', ''],
        npoTime: '',
        onIvf: '',
      },
      consult: '',
      problemList: ['', '', '', '', '', ''],
      anestheticPlan: {
        gaSelected: false,
        gaMethods: [],
        gaOther: '',
        raSelected: false,
        raMethods: [],
        raOther: '',
      },
      preparationOrders: ['', '', '', ''],
      postAnesthesia: {
        summarizedBy: '',
        summarizedDate: '',
        bp: '',
        pulse: '',
        rr: '',
        temp: '',
        spo2: '',
        painScore: '',
        complicationStatus: 'none',
        complicationDetail: '',
        visitBy: '',
        visitDate: '',
      },
    },
  };
}

export function calculateBmi(bwStr: string, htStr: string): string {
  const bw = parseFloat(bwStr);
  const htCm = parseFloat(htStr);
  if (!Number.isFinite(bw) || !Number.isFinite(htCm) || bw <= 0 || htCm <= 0) {
    return '';
  }
  const htM = htCm / 100;
  const bmi = bw / (htM * htM);
  if (!Number.isFinite(bmi) || bmi <= 0 || bmi > 120) return '';
  return bmi.toFixed(1);
}

export function deriveAnesthesiaType(plan: AnestheticPlanData): AnesthesiaSummaryType {
  if (plan.gaSelected && plan.raSelected) return 'GA+RA';
  if (plan.gaSelected) return 'GA';
  if (plan.raSelected) return 'RA';
  return '';
}

function clampStr(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.slice(0, maxLen);
}

function clampStrArray(arr: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, maxItems)
    .map((item) => clampStr(item, maxLen));
}

export function sanitizeEvaluationForFirestore(
  evalRecord: PreAnestheticEvaluation,
  ownerId: string,
): PreAnestheticEvaluation {
  const fd = evalRecord.formData;
  const toothAllow: ToothCondition[] = ['Normal', 'Denture', 'Loose', 'Avulsion'];
  const gaAllow: GaMethod[] = ['Intubation', 'LMA', 'Mask', 'TIVA', 'Other'];
  const raAllow: RaMethod[] = ['Spinal block', 'Epidural', 'Nerve block', 'Other'];

  const sanitizedPlan: AnestheticPlanData = {
    gaSelected: Boolean(fd.anestheticPlan.gaSelected),
    gaMethods: fd.anestheticPlan.gaMethods.filter((m): m is GaMethod => gaAllow.includes(m)).slice(0, 5),
    gaOther: clampStr(fd.anestheticPlan.gaOther, 200),
    raSelected: Boolean(fd.anestheticPlan.raSelected),
    raMethods: fd.anestheticPlan.raMethods.filter((m): m is RaMethod => raAllow.includes(m)).slice(0, 4),
    raOther: clampStr(fd.anestheticPlan.raOther, 200),
  };

  const sanitizedId = /^[a-zA-Z0-9_-]+$/.test(evalRecord.id)
    ? evalRecord.id.slice(0, FIELD_LIMITS.id)
    : generateEvaluationId();

  const expectedDiff = fd.physicalExam.expectedDifficultAirway === 'yes';
  const hasComp = fd.postAnesthesia.complicationStatus === 'yes';
  const computedStatus: EvaluationStatus =
    evalRecord.status === 'locked'
      ? 'locked'
      : fd.postAnesthesia.summarizedBy.trim() || fd.postAnesthesia.visitBy.trim() || fd.postAnesthesia.complicationStatus !== 'none'
      ? 'post_op_completed'
      : evalRecord.asaClass || sanitizedPlan.gaSelected || sanitizedPlan.raSelected
      ? 'evaluated'
      : 'draft';

  return {
    id: sanitizedId,
    ownerId: clampStr(ownerId, FIELD_LIMITS.ownerId),
    status: computedStatus,
    patientName: clampStr(evalRecord.patientName.trim(), FIELD_LIMITS.patientName),
    hn: clampStr(evalRecord.hn.trim(), FIELD_LIMITS.hn),
    an: clampStr(evalRecord.an.trim(), FIELD_LIMITS.an),
    age: clampStr(evalRecord.age.trim(), FIELD_LIMITS.age),
    ward: clampStr(evalRecord.ward.trim(), FIELD_LIMITS.ward),
    dateOfVisit: clampStr(evalRecord.dateOfVisit, FIELD_LIMITS.date),
    dateOfOperation: clampStr(evalRecord.dateOfOperation, FIELD_LIMITS.date),
    operationTime: clampStr(evalRecord.operationTime ?? '', FIELD_LIMITS.operationTime),
    scheduleType:
      evalRecord.scheduleType === 'emergency' || (evalRecord.scheduleType !== 'elective' && evalRecord.asaEmergency)
        ? 'emergency'
        : 'elective',
    orRoom: clampStr((evalRecord.orRoom ?? '').trim(), FIELD_LIMITS.orRoom),
    caseOrder: clampStr((evalRecord.caseOrder ?? '').trim(), FIELD_LIMITS.caseOrder),
    surgeon: clampStr((evalRecord.surgeon ?? '').trim(), FIELD_LIMITS.surgeon),
    diagnosis: clampStr(evalRecord.diagnosis, FIELD_LIMITS.diagnosis),
    operation: clampStr(evalRecord.operation, FIELD_LIMITS.operation),
    asaClass: evalRecord.asaClass,
    asaEmergency: Boolean(evalRecord.asaEmergency),
    expectedDifficultAirway: expectedDiff,
    hasComplication: hasComp,
    anesthesiaType: deriveAnesthesiaType(sanitizedPlan),
    formData: {
      history: {
        presentIllness: clampStr(fd.history.presentIllness, 1000),
        pastIllness: clampStr(fd.history.pastIllness, 1000),
        allergyStatus: fd.history.allergyStatus,
        allergyDetail: clampStr(fd.history.allergyDetail, 300),
        underlyingStatus: fd.history.underlyingStatus,
        dm: Boolean(fd.history.dm),
        dmYears: clampStr(fd.history.dmYears, 20),
        ht: Boolean(fd.history.ht),
        htYears: clampStr(fd.history.htYears, 20),
        dlp: Boolean(fd.history.dlp),
        dlpYears: clampStr(fd.history.dlpYears, 20),
        ckd: Boolean(fd.history.ckd),
        ckdYears: clampStr(fd.history.ckdYears, 20),
        heartDisease: Boolean(fd.history.heartDisease),
        heartDiseaseYears: clampStr(fd.history.heartDiseaseYears, 20),
        otherUnderlying: clampStrArray(fd.history.otherUnderlying, 8, 120),
        medication: clampStr(fd.history.medication, 1000),
        previousOps: clampStrArray(fd.history.previousOps, 8, 250),
        previousOpComplication: clampStr(fd.history.previousOpComplication, 500),
        drinkingStatus: fd.history.drinkingStatus,
        drinkingDaysPerWeek: clampStr(fd.history.drinkingDaysPerWeek, 20),
        drinkingYears: clampStr(fd.history.drinkingYears, 20),
        drinkingDurationUnit: fd.history.drinkingDurationUnit === 'months' ? 'months' : 'years',
        drinkingQuit: Boolean(fd.history.drinkingQuit),
        drinkingQuitDuration: clampStr(fd.history.drinkingQuitDuration, 20),
        drinkingQuitUnit: fd.history.drinkingQuitUnit === 'months' ? 'months' : 'years',
        smokingStatus: fd.history.smokingStatus,
        smokingCigsPerDay: clampStr(fd.history.smokingCigsPerDay, 20),
        smokingYears: clampStr(fd.history.smokingYears, 20),
        smokingDurationUnit: fd.history.smokingDurationUnit === 'months' ? 'months' : 'years',
        smokingQuit: Boolean(fd.history.smokingQuit),
        smokingQuitDuration: clampStr(fd.history.smokingQuitDuration, 20),
        smokingQuitUnit: fd.history.smokingQuitUnit === 'months' ? 'months' : 'years',
        drugAddictionStatus: fd.history.drugAddictionStatus,
        drugAddictionTypes: clampStrArray(fd.history.drugAddictionTypes, 10, 60),
        drugAddictionOther: clampStr(fd.history.drugAddictionOther, 120),
        drugAddictionAmount: clampStr(fd.history.drugAddictionAmount, 120),
        drugAddictionYears: clampStr(fd.history.drugAddictionYears, 20),
        drugAddictionDurationUnit:
          fd.history.drugAddictionDurationUnit === 'months' ? 'months' : 'years',
        drugAddictionQuit: Boolean(fd.history.drugAddictionQuit),
        drugAddictionQuitDuration: clampStr(fd.history.drugAddictionQuitDuration, 20),
        drugAddictionQuitUnit: fd.history.drugAddictionQuitUnit === 'months' ? 'months' : 'years',
      },
      physicalExam: {
        bw: clampStr(fd.physicalExam.bw, 20),
        ht: clampStr(fd.physicalExam.ht, 20),
        bmi: clampStr(fd.physicalExam.bmi, 20),
        bp: clampStr(fd.physicalExam.bp, 30),
        pulse: clampStr(fd.physicalExam.pulse, 20),
        rr: clampStr(fd.physicalExam.rr, 20),
        temp: clampStr(fd.physicalExam.temp, 20),
        spo2: clampStr(fd.physicalExam.spo2, 20),
        oxygenSupport: (() => {
          const ox = fd.physicalExam.oxygenSupport;
          if (!ox || typeof ox !== 'object') return createEmptyOxygenSupport();
          const modeAllow: OxygenSupportMode[] = ['', 'cannula', 'mask_bag', 'ett', 'other'];
          const ventAllow: VentilatorMode[] = ['', 'vcv', 'pcv'];
          return {
            mode: modeAllow.includes(ox.mode) ? ox.mode : '',
            cannulaLpm: clampStr(ox.cannulaLpm, 20),
            maskBagLpm: clampStr(ox.maskBagLpm, 20),
            ettSize: clampStr(ox.ettSize, 20),
            ettDeep: clampStr(ox.ettDeep, 20),
            ventMode: ventAllow.includes(ox.ventMode) ? ox.ventMode : '',
            tv: clampStr(ox.tv, 20),
            rr: clampStr(ox.rr, 20),
            fio2: clampStr(ox.fio2, 20),
            peep: clampStr(ox.peep, 20),
            pins: clampStr(ox.pins, 20),
            otherItems: clampStrArray(ox.otherItems, 10, 150)
              .map((s) => s.trim())
              .filter(Boolean),
          };
        })(),
        toothStatus: fd.physicalExam.toothStatus.filter((t): t is ToothCondition => toothAllow.includes(t)).slice(0, 4),
        toothDetail: clampStr(fd.physicalExam.toothDetail, 200),
        missingTeeth: (() => {
          const allow = new Set<string>(TOOTH_IDS);
          const raw = Array.isArray(fd.physicalExam.missingTeeth) ? fd.physicalExam.missingTeeth : [];
          return Array.from(new Set(raw.filter((id): id is string => typeof id === 'string' && allow.has(id)))).slice(0, 18);
        })(),
        looseTeeth: (() => {
          const allow = new Set<string>(TOOTH_IDS);
          const missingSet = new Set<string>(
            Array.isArray(fd.physicalExam.missingTeeth) ? fd.physicalExam.missingTeeth : [],
          );
          const raw = Array.isArray(fd.physicalExam.looseTeeth) ? fd.physicalExam.looseTeeth : [];
          return Array.from(
            new Set(
              raw.filter(
                (id): id is string =>
                  typeof id === 'string' && allow.has(id) && !missingSet.has(id),
              ),
            ),
          ).slice(0, 18);
        })(),
        mouthOpening: fd.physicalExam.mouthOpening,
        mouthOpeningDetail: clampStr(fd.physicalExam.mouthOpeningDetail ?? '', 200),
        neckMovement: fd.physicalExam.neckMovement,
        neckMovementDetail: clampStr(fd.physicalExam.neckMovementDetail ?? '', 200),
        thyromentalDistance: fd.physicalExam.thyromentalDistance,
        thyromentalDistanceDetail: clampStr(fd.physicalExam.thyromentalDistanceDetail ?? '', 200),
        mallampatiClass: fd.physicalExam.mallampatiClass,
        expectedDifficultAirway: fd.physicalExam.expectedDifficultAirway,
        breathSound: fd.physicalExam.breathSound,
        breathSoundDetail: clampStr(fd.physicalExam.breathSoundDetail, 300),
        heartSound: fd.physicalExam.heartSound,
        heartSoundDetail: clampStr(fd.physicalExam.heartSoundDetail, 300),
        functionalCapacity: clampStr(fd.physicalExam.functionalCapacity, 200),
      },
      investigation: {
        cxrStatus: fd.investigation.cxrStatus,
        cxrDetail: clampStr(fd.investigation.cxrDetail, 400),
        ekgStatus: fd.investigation.ekgStatus,
        ekgDetail: clampStr(fd.investigation.ekgDetail, 400),
        other: clampStr(fd.investigation.other, 600),
      },
      laboratory: {
        hb: clampStr(fd.laboratory.hb, 20),
        hct: clampStr(fd.laboratory.hct, 20),
        wbc: clampStr(fd.laboratory.wbc, 20),
        plt: clampStr(fd.laboratory.plt, 20),
        neutrophil: clampStr(fd.laboratory.neutrophil, 20),
        lymphocyte: clampStr(fd.laboratory.lymphocyte, 20),
        na: clampStr(fd.laboratory.na, 20),
        k: clampStr(fd.laboratory.k, 20),
        cl: clampStr(fd.laboratory.cl, 20),
        co2: clampStr(fd.laboratory.co2, 20),
        bun: clampStr(fd.laboratory.bun, 20),
        cr: clampStr(fd.laboratory.cr, 20),
        pt: clampStr(fd.laboratory.pt, 20),
        ptt: clampStr(fd.laboratory.ptt, 20),
        inr: clampStr(fd.laboratory.inr, 20),
        sgot: clampStr(fd.laboratory.sgot, 20),
        sgpt: clampStr(fd.laboratory.sgpt, 20),
        alp: clampStr(fd.laboratory.alp, 20),
        alb: clampStr(fd.laboratory.alb, 20),
        glucose: clampStr(fd.laboratory.glucose, 20),
        hba1c: clampStr(fd.laboratory.hba1c, 20),
        other: clampStr(fd.laboratory.other, 400),
        prepTs: Boolean(fd.laboratory.prepTs),
        prepPrc: clampStr(fd.laboratory.prepPrc, 20),
        prepFfp: clampStr(fd.laboratory.prepFfp, 20),
        prepPlt: clampStr(fd.laboratory.prepPlt, 20),
        prepStatuses: (() => {
          const allow: BloodPrepStatus[] = ['no_blood', 'ready', 'not_ready', 'waiting_red_cross', 'other'];
          const raw = Array.isArray(fd.laboratory.prepStatuses) ? fd.laboratory.prepStatuses : [];
          return Array.from(
            new Set(raw.filter((s): s is BloodPrepStatus => allow.includes(s))),
          ).slice(0, 5);
        })(),
        prepStatusDetail: clampStr(fd.laboratory.prepStatusDetail ?? '', 300),
      },
      premedication: {
        items: clampStrArray(fd.premedication.items, 10, 200),
        npoTime: clampStr(fd.premedication.npoTime, 100),
        onIvf: clampStr(fd.premedication.onIvf, 150),
      },
      consult: clampStr(fd.consult, 1500),
      problemList: clampStrArray(fd.problemList, 12, 250),
      anestheticPlan: sanitizedPlan,
      preparationOrders: clampStrArray(fd.preparationOrders, 12, 250),
      postAnesthesia: {
        summarizedBy: clampStr(fd.postAnesthesia.summarizedBy, 120),
        summarizedDate: clampStr(fd.postAnesthesia.summarizedDate, 32),
        bp: clampStr(fd.postAnesthesia.bp, 30),
        pulse: clampStr(fd.postAnesthesia.pulse, 20),
        rr: clampStr(fd.postAnesthesia.rr, 20),
        temp: clampStr(fd.postAnesthesia.temp, 20),
        spo2: clampStr(fd.postAnesthesia.spo2, 20),
        painScore: clampStr(fd.postAnesthesia.painScore, 20),
        complicationStatus: fd.postAnesthesia.complicationStatus,
        complicationDetail: clampStr(fd.postAnesthesia.complicationDetail, 500),
        visitBy: clampStr(fd.postAnesthesia.visitBy, 120),
        visitDate: clampStr(fd.postAnesthesia.visitDate, 32),
      },
    },
  };
}

export function formatDurationLabel(value: string, unit: DurationUnit = 'years'): string {
  const v = value.trim();
  const unitLabel = unit === 'months' ? 'เดือน' : 'ปี';
  return `${v || '___'} ${unitLabel}`;
}

export function formatDrinkingDetail(h: HistoryData): string {
  const base = `${h.drinkingDaysPerWeek || '___'} วัน/wk จำนวน ${formatDurationLabel(h.drinkingYears, h.drinkingDurationUnit)}`;
  if (h.drinkingQuit || h.drinkingQuitDuration?.trim()) {
    return `${base} · เลิก ${formatDurationLabel(h.drinkingQuitDuration || '', h.drinkingQuitUnit)}`;
  }
  return base;
}

export function formatSmokingDetail(h: HistoryData): string {
  const base = `จำนวน ${h.smokingCigsPerDay || '___'} มวน/วัน จำนวน ${formatDurationLabel(h.smokingYears, h.smokingDurationUnit)}`;
  if (h.smokingQuit || h.smokingQuitDuration?.trim()) {
    return `${base} · เลิก ${formatDurationLabel(h.smokingQuitDuration || '', h.smokingQuitUnit)}`;
  }
  return base;
}

export function formatDrugAddictionDetail(h: HistoryData): string {
  const types = [...(h.drugAddictionTypes || [])];
  if (h.drugAddictionOther?.trim()) {
    types.push(h.drugAddictionOther.trim());
  }
  const parts: string[] = [];
  if (types.length > 0) parts.push(types.join(', '));
  if (h.drugAddictionAmount?.trim()) parts.push(`ปริมาณ ${h.drugAddictionAmount.trim()}`);
  if (h.drugAddictionYears?.trim()) {
    parts.push(`ระยะเวลา ${formatDurationLabel(h.drugAddictionYears, h.drugAddictionDurationUnit)}`);
  }
  if (h.drugAddictionQuit || h.drugAddictionQuitDuration?.trim()) {
    parts.push(`เลิก ${formatDurationLabel(h.drugAddictionQuitDuration || '', h.drugAddictionQuitUnit)}`);
  }
  return parts.join(' · ');
}

export function formatOxygenSupportSummary(ox?: OxygenSupportData): string {
  if (!ox) return '';
  const parts: string[] = [];

  if (ox.mode === 'cannula') {
    parts.push(`on cannula${ox.cannulaLpm.trim() ? ` ${ox.cannulaLpm.trim()} LPM` : ''}`);
  } else if (ox.mode === 'mask_bag') {
    parts.push(`on mask c̄ bag${ox.maskBagLpm.trim() ? ` ${ox.maskBagLpm.trim()} LPM` : ''}`);
  } else if (ox.mode === 'ett') {
    const ettHeader = [
      'on ETT',
      ox.ettSize.trim() ? `No. ${ox.ettSize.trim()}` : '',
      ox.ettDeep.trim() ? `deep ${ox.ettDeep.trim()} cm` : '',
    ]
      .filter(Boolean)
      .join(' ');

    const isPcv = ox.ventMode === 'pcv' || (!ox.ventMode && Boolean(ox.pins.trim()) && !ox.tv.trim());
    const ventParams: string[] = [];
    if (isPcv) {
      if (ox.pins.trim()) ventParams.push(`Pins ${ox.pins.trim()}`);
    } else if (ox.tv.trim()) {
      ventParams.push(`TV ${ox.tv.trim()}`);
    }
    if (ox.rr.trim()) ventParams.push(`RR ${ox.rr.trim()}`);
    if (ox.fio2.trim()) ventParams.push(`FiO2 ${ox.fio2.trim()}`);
    if (ox.peep.trim()) ventParams.push(`PEEP ${ox.peep.trim()}`);

    const settingLabel =
      ventParams.length > 0
        ? ` (${isPcv ? 'PCV: ' : 'Setting: '}${ventParams.join(', ')})`
        : isPcv
        ? ' (PCV)'
        : ox.ventMode === 'vcv'
        ? ' (TV)'
        : '';

    parts.push(`${ettHeader}${settingLabel}`);
  }

  const others = (ox.otherItems || []).map((s) => s.trim()).filter(Boolean);
  if (others.length > 0) {
    parts.push(...others);
  }

  return parts.join(' · ');
}

export function formatToothMarksSummary(missingTeeth?: string[], looseTeeth?: string[]): string {
  const missing = (missingTeeth || []).filter((id): id is ToothId => id in TOOTH_LABELS);
  const loose = (looseTeeth || []).filter((id): id is ToothId => id in TOOTH_LABELS);
  const parts: string[] = [];
  if (missing.length > 0) {
    parts.push(`ฟันหลอ (สีดำ) ${missing.length} ซี่: ${missing.map((id) => TOOTH_LABELS[id]).join(', ')}`);
  }
  if (loose.length > 0) {
    parts.push(`ฟันโยก (X) ${loose.length} ซี่: ${loose.map((id) => TOOTH_LABELS[id]).join(', ')}`);
  }
  return parts.join(' · ');
}

export function formatBloodPrepSummary(lab: LaboratoryData): string {
  const parts: string[] = [];
  if (lab.prepTs) parts.push('T&S');
  if (lab.prepPrc.trim()) parts.push(`PRC ${lab.prepPrc.trim()}u`);
  if (lab.prepFfp.trim()) parts.push(`FFP ${lab.prepFfp.trim()}u`);
  if (lab.prepPlt.trim()) parts.push(`Plt ${lab.prepPlt.trim()}u`);

  const statusLabels: string[] = [];
  const statuses = Array.isArray(lab.prepStatuses) ? lab.prepStatuses : [];
  for (const opt of BLOOD_PREP_STATUS_OPTIONS) {
    if (statuses.includes(opt.value)) {
      if (opt.value === 'other' && lab.prepStatusDetail?.trim()) {
        statusLabels.push(`${opt.label}: ${lab.prepStatusDetail.trim()}`);
      } else {
        statusLabels.push(opt.label);
      }
    }
  }
  if (!statuses.includes('other') && lab.prepStatusDetail?.trim()) {
    statusLabels.push(lab.prepStatusDetail.trim());
  }

  const head = parts.join(' · ');
  const tail = statusLabels.join(', ');
  if (head && tail) return `${head} (${tail})`;
  return head || tail;
}

export interface ClinicalAlert {
  level: 'critical' | 'warning' | 'nominal';
  category: string;
  message: string;
}

export interface ClinicalSummary {
  bmiLabel: string;
  asaLabel: string;
  airwayRiskLevel: 'high' | 'moderate' | 'low' | 'pending';
  airwayReasons: string[];
  labAlerts: ClinicalAlert[];
  allergyFlag: string | null;
  underlyingTags: string[];
  planSummary: string;
  bloodPrepSummary: string;
  completenessPercent: number;
  clinicalBrief: string;
}

export function computeClinicalSummary(record: PreAnestheticEvaluation): ClinicalSummary {
  const { history, physicalExam, laboratory, investigation, premedication, anestheticPlan, problemList, preparationOrders } =
    record.formData;

  const bmiVal = parseFloat(physicalExam.bmi);
  let bmiLabel = '—';
  if (Number.isFinite(bmiVal)) {
    const cat = bmiVal < 18.5 ? 'Underweight' : bmiVal < 25 ? 'Normal' : bmiVal < 30 ? 'Overweight' : 'Obese';
    bmiLabel = `${bmiVal.toFixed(1)} (${cat})`;
  }

  const asaLabel = record.asaClass
    ? `ASA ${record.asaClass}${record.asaEmergency ? 'E' : ''}`
    : 'ยังไม่ระบุ ASA';

  // Airway assessment
  const airwayReasons: string[] = [];
  if (physicalExam.expectedDifficultAirway === 'yes') airwayReasons.push('Expected difficult airway');
  if (physicalExam.mallampatiClass === 'III' || physicalExam.mallampatiClass === 'IV') {
    airwayReasons.push(`Mallampati ${physicalExam.mallampatiClass}`);
  }
  if (physicalExam.mouthOpening === 'limited') airwayReasons.push('Mouth opening limited');
  if (physicalExam.neckMovement === 'limited') airwayReasons.push('Neck movement limited');
  if (physicalExam.thyromentalDistance === '<6') airwayReasons.push('TMD < 6 cm');
  if (physicalExam.toothStatus.includes('Loose') || (physicalExam.looseTeeth?.length ?? 0) > 0) {
    airwayReasons.push('ฟันโยก (Loose tooth)');
  }
  if (physicalExam.toothStatus.includes('Denture')) airwayReasons.push('ฟันปลอม (Denture)');
  if ((physicalExam.missingTeeth?.length ?? 0) > 0 && !physicalExam.toothStatus.includes('Avulsion')) {
    airwayReasons.push('ฟันหลอ (Avulsion)');
  }

  let airwayRiskLevel: ClinicalSummary['airwayRiskLevel'] = 'pending';
  if (
    physicalExam.expectedDifficultAirway === 'yes' ||
    physicalExam.mallampatiClass === 'IV' ||
    airwayReasons.length >= 2
  ) {
    airwayRiskLevel = 'high';
  } else if (airwayReasons.length === 1) {
    airwayRiskLevel = 'moderate';
  } else if (physicalExam.mallampatiClass || physicalExam.mouthOpening === 'normal') {
    airwayRiskLevel = 'low';
  }

  // Lab alerts
  const labAlerts: ClinicalAlert[] = [];
  const hb = parseFloat(laboratory.hb);
  const hct = parseFloat(laboratory.hct);
  const plt = parseFloat(laboratory.plt);
  const k = parseFloat(laboratory.k);
  const na = parseFloat(laboratory.na);
  const cr = parseFloat(laboratory.cr);
  const inr = parseFloat(laboratory.inr);
  const glucose = parseFloat(laboratory.glucose);

  if (Number.isFinite(hb) && hb < 10) {
    labAlerts.push({ level: hb < 8 ? 'critical' : 'warning', category: 'CBC', message: `Hb ต่ำ (${hb} g/dL)` });
  }
  if (Number.isFinite(hct) && hct < 30) {
    labAlerts.push({ level: hct < 24 ? 'critical' : 'warning', category: 'CBC', message: `Hct ต่ำ (${hct}%)` });
  }
  if (Number.isFinite(plt) && plt < 100000) {
    labAlerts.push({ level: plt < 50000 ? 'critical' : 'warning', category: 'CBC', message: `Plt ต่ำ (${plt.toLocaleString()})` });
  }
  if (Number.isFinite(k) && (k < 3.5 || k > 5.0)) {
    labAlerts.push({ level: k < 3.0 || k > 5.5 ? 'critical' : 'warning', category: 'E-lyte', message: `K ผิดปกติ (${k} mEq/L)` });
  }
  if (Number.isFinite(na) && (na < 135 || na > 145)) {
    labAlerts.push({ level: na < 128 || na > 152 ? 'critical' : 'warning', category: 'E-lyte', message: `Na ผิดปกติ (${na} mEq/L)` });
  }
  if (Number.isFinite(cr) && cr > 1.5) {
    labAlerts.push({ level: cr > 2.5 ? 'critical' : 'warning', category: 'Renal', message: `Cr สูง (${cr} mg/dL)` });
  }
  if (Number.isFinite(inr) && inr > 1.4) {
    labAlerts.push({ level: inr > 1.8 ? 'critical' : 'warning', category: 'Coag', message: `INR สูง (${inr})` });
  }
  if (Number.isFinite(glucose) && (glucose < 70 || glucose > 200)) {
    labAlerts.push({ level: glucose < 60 || glucose > 300 ? 'critical' : 'warning', category: 'Glucose', message: `DTX/Glucose ${glucose} mg/dL` });
  }
  if (investigation.cxrStatus === 'abnormal') {
    labAlerts.push({ level: 'warning', category: 'CXR', message: `CXR ผิดปกติ${investigation.cxrDetail ? `: ${investigation.cxrDetail}` : ''}` });
  }
  if (investigation.ekgStatus === 'abnormal') {
    labAlerts.push({ level: 'warning', category: 'EKG', message: `EKG ผิดปกติ${investigation.ekgDetail ? `: ${investigation.ekgDetail}` : ''}` });
  }

  // Underlying & Allergy
  const allergyFlag =
    history.allergyStatus === 'yes'
      ? `แพ้ยา/อาหาร: ${history.allergyDetail || 'ระบุว่ามีประวัติแพ้'}`
      : null;

  const underlyingTags: string[] = [];
  if (history.dm) underlyingTags.push(`DM${history.dmYears ? ` (${history.dmYears} yr)` : ''}`);
  if (history.ht) underlyingTags.push(`HT${history.htYears ? ` (${history.htYears} yr)` : ''}`);
  if (history.dlp) underlyingTags.push(`DLP${history.dlpYears ? ` (${history.dlpYears} yr)` : ''}`);
  if (history.ckd) underlyingTags.push(`โรคไต${history.ckdYears ? ` (${history.ckdYears} yr)` : ''}`);
  if (history.heartDisease) {
    underlyingTags.push(
      `โรคหัวใจ${history.heartDiseaseYears ? ` (${history.heartDiseaseYears} yr)` : ''}`,
    );
  }
  history.otherUnderlying.filter((x) => x.trim()).forEach((x) => underlyingTags.push(x.trim()));

  // Plan summary
  const planParts: string[] = [];
  if (anestheticPlan.gaSelected) {
    const subs: string[] = anestheticPlan.gaMethods.filter((m) => m !== 'Other');
    if (anestheticPlan.gaMethods.includes('Other') && anestheticPlan.gaOther.trim()) {
      subs.push(anestheticPlan.gaOther.trim());
    }
    planParts.push(`GA${subs.length ? ` (${subs.join(', ')})` : ''}`);
  }
  if (anestheticPlan.raSelected) {
    const subs: string[] = anestheticPlan.raMethods.filter((m) => m !== 'Other');
    if (anestheticPlan.raMethods.includes('Other') && anestheticPlan.raOther.trim()) {
      subs.push(anestheticPlan.raOther.trim());
    }
    planParts.push(`RA${subs.length ? ` (${subs.join(', ')})` : ''}`);
  }
  const planSummary = planParts.length ? planParts.join(' + ') : 'ยังไม่ระบุแผนระงับความรู้สึก';

  // Blood prep
  const bloodPrepSummary = formatBloodPrepSummary(laboratory) || 'ไม่มีการจองเลือด';

  // Completeness score across key clinical domains
  const checkpoints = [
    Boolean(record.patientName.trim()),
    Boolean(record.hn.trim()),
    Boolean(record.diagnosis.trim() && record.operation.trim()),
    history.allergyStatus !== 'none',
    history.underlyingStatus !== 'none',
    Boolean(physicalExam.bw.trim() && physicalExam.bp.trim()),
    Boolean(physicalExam.mallampatiClass),
    physicalExam.expectedDifficultAirway !== 'none',
    Boolean(laboratory.hb.trim() || laboratory.hct.trim() || laboratory.cr.trim()),
    Boolean(record.asaClass),
    Boolean(anestheticPlan.gaSelected || anestheticPlan.raSelected),
    Boolean(premedication.npoTime.trim()),
  ];
  const filledCount = checkpoints.filter(Boolean).length;
  const completenessPercent = Math.round((filledCount / checkpoints.length) * 100);

  const activeProblems = problemList.filter((p) => p.trim()).length;
  const activeOrders = preparationOrders.filter((o) => o.trim()).length;

  const clinicalBrief = [
    record.patientName.trim() ? `${record.patientName.trim()}${record.age ? ` (${record.age} ปี)` : ''}` : 'ผู้ป่วยใหม่',
    record.operation.trim() ? `ผ่าตัด ${record.operation.trim()}` : '',
    asaLabel,
    planSummary,
    activeProblems > 0 ? `${activeProblems} ปัญหา` : '',
    activeOrders > 0 ? `${activeOrders} คำสั่งเตรียม` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    bmiLabel,
    asaLabel,
    airwayRiskLevel,
    airwayReasons,
    labAlerts,
    allergyFlag,
    underlyingTags,
    planSummary,
    bloodPrepSummary,
    completenessPercent,
    clinicalBrief,
  };
}

export function createSampleEvaluations(ownerId: string): PreAnestheticEvaluation[] {
  const today = getTodayIsoDate();
  const tomorrow = addDaysToIsoDate(today, 1);
  const dayAfterTomorrow = addDaysToIsoDate(today, 2);

  const makeCase = (
    suffix: string,
    patch: Partial<PreAnestheticEvaluation>,
    formPatch: {
      history?: Partial<HistoryData>;
      physicalExam?: Partial<PhysicalExamData>;
      investigation?: Partial<InvestigationData>;
      laboratory?: Partial<LaboratoryData>;
      premedication?: Partial<PremedicationData>;
      consult?: string;
      problemList?: string[];
      anestheticPlan?: Partial<AnestheticPlanData>;
      preparationOrders?: string[];
      postAnesthesia?: Partial<PostAnesthesiaData>;
    },
  ): PreAnestheticEvaluation => {
    const base = createEmptyEvaluation(ownerId);
    const merged: PreAnestheticEvaluation = {
      ...base,
      ...patch,
      id: `sample_${suffix}_${Date.now().toString().slice(-4)}`,
      ownerId,
      formData: {
        ...base.formData,
        history: { ...base.formData.history, ...formPatch.history },
        physicalExam: { ...base.formData.physicalExam, ...formPatch.physicalExam },
        investigation: { ...base.formData.investigation, ...formPatch.investigation },
        laboratory: { ...base.formData.laboratory, ...formPatch.laboratory },
        premedication: { ...base.formData.premedication, ...formPatch.premedication },
        consult: formPatch.consult ?? base.formData.consult,
        problemList: formPatch.problemList ?? base.formData.problemList,
        anestheticPlan: { ...base.formData.anestheticPlan, ...formPatch.anestheticPlan },
        preparationOrders: formPatch.preparationOrders ?? base.formData.preparationOrders,
        postAnesthesia: { ...base.formData.postAnesthesia, ...formPatch.postAnesthesia },
      },
    };
    return sanitizeEvaluationForFirestore(merged, ownerId);
  };

  return [
    makeCase(
      '01',
      {
        patientName: 'นายสมชาย ใจดี',
        hn: '67014521',
        an: '67-008912',
        age: '64',
        ward: 'ศัลยกรรมชาย',
        dateOfVisit: today,
        dateOfOperation: tomorrow,
        operationTime: '08:30',
        scheduleType: 'elective',
        orRoom: 'OR 1',
        caseOrder: '1',
        surgeon: 'นพ.คริส ผลประเสริฐ',
        diagnosis: 'Calculous cholecystitis',
        operation: 'Laparoscopic cholecystectomy',
        asaClass: 'III',
        asaEmergency: false,
      },
      {
        history: {
          presentIllness: 'ปวดท้องใต้ชายโครงขวาเป็นๆ หายๆ 2 สัปดาห์ ไม่มีไข้ ไม่ตัวเหลือง',
          pastIllness: 'รักษา DM และ HT ต่อเนื่องที่ OPD อายุรกรรม',
          allergyStatus: 'no',
          underlyingStatus: 'yes',
          dm: true,
          dmYears: '8',
          ht: true,
          htYears: '10',
          dlp: true,
          dlpYears: '5',
          otherUnderlying: [''],
          medication: 'Amlodipine (5) 1x1, MFM (500) 1x1, Simvastatin (10) 1x1',
          previousOps: ['Appendectomy (2550) - Spinal block no complication', '', ''],
          drinkingStatus: 'no',
          smokingStatus: 'yes',
          smokingCigsPerDay: '10',
          smokingYears: '20',
          drugAddictionStatus: 'no',
        },
        physicalExam: {
          bw: '74',
          ht: '166',
          bmi: '26.9',
          bp: '146/86',
          pulse: '78',
          rr: '18',
          temp: '36.7',
          spo2: '98',
          toothStatus: ['Normal'],
          mouthOpening: 'normal',
          neckMovement: 'normal',
          thyromentalDistance: '>=6',
          mallampatiClass: 'II',
          expectedDifficultAirway: 'no',
          breathSound: 'normal',
          heartSound: 'normal',
          functionalCapacity: '>= 4 METs (เดินขึ้นบันได 2 ชั้นได้ไม่เหนื่อย)',
        },
        investigation: {
          cxrStatus: 'normal',
          cxrDetail: 'No active pulmonary infiltration',
          ekgStatus: 'normal',
          ekgDetail: 'NSR, rate 76 bpm, no ST-T change',
        },
        laboratory: {
          hb: '13.2',
          hct: '39.8',
          wbc: '8400',
          plt: '245000',
          neutrophil: '62',
          lymphocyte: '29',
          na: '139',
          k: '4.1',
          cl: '102',
          co2: '24',
          bun: '15',
          cr: '1.1',
          pt: '11.4',
          ptt: '27.2',
          inr: '1.01',
          sgot: '34',
          sgpt: '41',
          alp: '112',
          alb: '4.0',
          glucose: '148',
          hba1c: '7.1',
          prepPrc: '1',
        },
        premedication: {
          items: ['Omeprazole 40 mg IV ก่อนผ่าตัด', 'Off Metformin เช้าวันผ่าตัด', 'Amlodipine (5 mg) เวลา 06.00 น. เช้าวันผ่าตัด', ''],
          npoTime: 'หลัง 24.00 น.',
          onIvf: '0.9% NSS 1000 ml IV rate 80 ml/hr',
        },
        consult: 'Med cleared for surgery, monitor perioperative DTX q 4 hr',
        problemList: ['DM type 2 on oral hypoglycemic drug', 'Hypertension (controlled)', 'Ex-smoker 10 pack-years', '', '', ''],
        anestheticPlan: {
          gaSelected: true,
          gaMethods: ['Intubation'],
        },
        preparationOrders: ['เจาะ DTX เช้าวันผ่าตัด 06.00 น.', 'จอง PRC 1 unit', 'เตรียม ET-tube No. 7.5, 8.0', ''],
        postAnesthesia: {
          summarizedBy: 'พญ.วชิราภรณ์',
          summarizedDate: today,
          bp: '128/76',
          pulse: '74',
          rr: '16',
          temp: '36.6',
          spo2: '99',
          painScore: '3',
          complicationStatus: 'no',
          visitBy: 'พญ.วชิราภรณ์',
          visitDate: today,
        },
      },
    ),
    makeCase(
      '02',
      {
        patientName: 'นางสาวกัญญา รักชาติ',
        hn: '67028934',
        an: '67-009104',
        age: '29',
        ward: 'ห้องคลอด',
        dateOfVisit: today,
        dateOfOperation: today,
        operationTime: '13:30',
        scheduleType: 'emergency',
        orRoom: 'OR 4',
        caseOrder: '1',
        surgeon: 'พญ.ปวีณา อมรเพชรกุล',
        diagnosis: 'CPD (Cephalopelvic disproportion) at 39 wks GA',
        operation: 'Emergency Cesarean Section',
        asaClass: 'II',
        asaEmergency: true,
      },
      {
        history: {
          presentIllness: 'เจ็บครรภ์คลอด 6 ชม. ปากมดลูกเปิด 5 cm ไม่ก้าวหน้า',
          allergyStatus: 'yes',
          allergyDetail: 'Penicillin (ผื่นลมพิษ)',
          underlyingStatus: 'no',
          previousOps: ['', '', ''],
          drinkingStatus: 'no',
          smokingStatus: 'no',
          drugAddictionStatus: 'no',
        },
        physicalExam: {
          bw: '71',
          ht: '155',
          bmi: '29.6',
          bp: '124/78',
          pulse: '92',
          rr: '20',
          temp: '36.9',
          spo2: '99',
          toothStatus: ['Normal'],
          mouthOpening: 'normal',
          neckMovement: 'normal',
          thyromentalDistance: '>=6',
          mallampatiClass: 'III',
          expectedDifficultAirway: 'no',
          breathSound: 'normal',
          heartSound: 'normal',
          functionalCapacity: '>= 4 METs',
        },
        laboratory: {
          hb: '11.4',
          hct: '34.5',
          wbc: '11200',
          plt: '218000',
          prepPrc: '1',
        },
        premedication: {
          items: ['Ranitidine 50 mg IV stat', 'Metoclopramide 10 mg IV stat', '0.3 M Sodium citrate 30 ml PO', ''],
          npoTime: '6 ชั่วโมง (งดอาหารล่าสุด 02.00 น.)',
          onIvf: 'LRS 1000 ml IV rate 120 ml/hr',
        },
        problemList: ['Emergency C/S (Full stomach precaution)', 'Allergy to Penicillin', 'Mallampati III (pregnancy airway edema)', '', '', ''],
        anestheticPlan: {
          raSelected: true,
          raMethods: ['Spinal block'],
        },
        preparationOrders: ['แจ้งหลีกเลี่ยง Penicillin group', 'เตรียม Ephedrine / Norepinephrine', 'เตรียม Video laryngoscope สำรอง', ''],
      },
    ),
    makeCase(
      '03',
      {
        patientName: 'นายประสิทธิ์ มั่นคง',
        hn: '66091205',
        an: '67-008770',
        age: '72',
        ward: 'ศัลยกรรมชาย',
        dateOfVisit: today,
        dateOfOperation: tomorrow,
        operationTime: '10:30',
        scheduleType: 'elective',
        orRoom: 'OR 2',
        caseOrder: '2',
        surgeon: 'นพ.วรภพ ไตรรัตนาภิกุล',
        diagnosis: 'Closed fracture Rt. neck of femur',
        operation: 'Rt. Bipolar hemiarthroplasty',
        asaClass: 'III',
        asaEmergency: false,
      },
      {
        history: {
          presentIllness: 'หกล้มในห้องน้ำ 2 วันก่อน ปวดสะโพกขวาเดินลงน้ำหนักไม่ได้',
          allergyStatus: 'no',
          underlyingStatus: 'yes',
          ht: true,
          htYears: '15',
          ckd: true,
          ckdYears: '3',
          heartDisease: true,
          heartDiseaseYears: '4',
          otherUnderlying: ['CKD stage 3', 'AF on Warfarin (held 5 days)'],
          medication: 'Isordil, Warfarin 3 mg (Off 5 วันแล้ว), Atenolol (50) 1x1',
          drinkingStatus: 'no',
          smokingStatus: 'no',
          drugAddictionStatus: 'no',
        },
        physicalExam: {
          bw: '58',
          ht: '164',
          bmi: '21.6',
          bp: '152/82',
          pulse: '84',
          rr: '18',
          temp: '36.8',
          spo2: '97',
          toothStatus: ['Denture', 'Loose'],
          toothDetail: 'ฟันปลอมถอดได้บน + ฟันล่างหน้าโยก 1 ซี่',
          mouthOpening: 'limited',
          neckMovement: 'limited',
          thyromentalDistance: '<6',
          mallampatiClass: 'IV',
          expectedDifficultAirway: 'yes',
          breathSound: 'normal',
          heartSound: 'abnormal',
          heartSoundDetail: 'Irregularly irregular rhythm',
          functionalCapacity: '< 4 METs',
        },
        investigation: {
          cxrStatus: 'abnormal',
          cxrDetail: 'Mild cardiomegaly, no pulmonary congestion',
          ekgStatus: 'abnormal',
          ekgDetail: 'Atrial fibrillation with controlled ventricular rate 82 bpm',
        },
        laboratory: {
          hb: '9.6',
          hct: '29.2',
          wbc: '7600',
          plt: '175000',
          na: '136',
          k: '4.4',
          cl: '101',
          co2: '22',
          bun: '28',
          cr: '1.8',
          pt: '13.2',
          ptt: '30.5',
          inr: '1.18',
          prepPrc: '2',
          prepFfp: '2',
        },
        premedication: {
          items: ['Paracetamol 500 mg 2 tabs PO', '', '', ''],
          npoTime: 'หลัง 24.00 น.',
          onIvf: '0.9% NSS 1000 ml rate 60 ml/hr',
        },
        consult: 'Cardio & Med cleared: INR < 1.2 proceed RA if feasible; avoid fluid overload',
        problemList: ['Expected difficult airway (Mallampati IV, TMD < 6)', 'Mild Anemia (Hb 9.6)', 'CKD stage 3 (Cr 1.8)', 'AF off Warfarin', 'Loose tooth', ''],
        anestheticPlan: {
          raSelected: true,
          raMethods: ['Spinal block', 'Nerve block'],
        },
        preparationOrders: ['ถอดฟันปลอมก่อนเข้า OR', 'เตรียม Video laryngoscope + Difficult airway cart', 'จอง PRC 2u + FFP 2u', 'Repeated INR เช้าวันผ่าตัด'],
      },
    ),
    makeCase(
      '04',
      {
        patientName: 'ด.ช.ธนกฤต แสงทอง',
        hn: '67044190',
        an: '67-009201',
        age: '7',
        ward: 'กุมาร',
        dateOfVisit: today,
        dateOfOperation: today,
        operationTime: '15:00',
        scheduleType: 'emergency',
        orRoom: 'OR 3',
        caseOrder: '2',
        surgeon: 'นพ.ชัชวาล สืบนุการณ์',
        diagnosis: 'Acute appendicitis',
        operation: 'Appendectomy',
        asaClass: 'I',
        asaEmergency: true,
      },
      {
        history: {
          presentIllness: 'ปวดท้องด้านขวาล่าง 12 ชม. มีไข้ต่ำ คลื่นไส้อาเจียน 2 ครั้ง',
          allergyStatus: 'no',
          underlyingStatus: 'no',
          drinkingStatus: 'no',
          smokingStatus: 'no',
          drugAddictionStatus: 'no',
        },
        physicalExam: {
          bw: '24',
          ht: '122',
          bmi: '16.1',
          bp: '102/64',
          pulse: '104',
          rr: '22',
          temp: '37.8',
          spo2: '99',
          toothStatus: ['Normal'],
          mouthOpening: 'normal',
          neckMovement: 'normal',
          thyromentalDistance: '>=6',
          mallampatiClass: 'I',
          expectedDifficultAirway: 'no',
          breathSound: 'normal',
          heartSound: 'normal',
          functionalCapacity: 'Active child',
        },
        laboratory: {
          hb: '12.5',
          hct: '37.4',
          wbc: '15400',
          plt: '310000',
          neutrophil: '80',
          lymphocyte: '14',
          na: '137',
          k: '3.9',
          cl: '100',
          co2: '21',
          bun: '12',
          cr: '0.5',
        },
        premedication: {
          items: ['5% DN/2 500 ml IV hydration', '', '', ''],
          npoTime: 'NPO since 06.00 น.',
          onIvf: '5% D/N/2 rate 65 ml/hr',
        },
        problemList: ['Pediatric patient (24 kg)', 'Emergency full stomach risk', '', '', '', ''],
        anestheticPlan: {
          gaSelected: true,
          gaMethods: ['Intubation'],
        },
        preparationOrders: ['เตรียม ET-tube No. 5.5 cuffed & 5.0', 'คำนวณขนาดยาตามน้ำหนัก 24 kg', 'Bair hugger warming blanket', ''],
        postAnesthesia: {
          summarizedBy: 'นพ.ธีรพงษ์',
          summarizedDate: today,
          bp: '100/62',
          pulse: '92',
          rr: '20',
          temp: '36.8',
          spo2: '99',
          painScore: '2',
          complicationStatus: 'no',
          visitBy: 'นพ.ธีรพงษ์',
          visitDate: today,
        },
      },
    ),
    makeCase(
      '05',
      {
        patientName: 'นางสุภาพร วงศ์ใหญ่',
        hn: '65088213',
        an: '67-008551',
        age: '54',
        ward: 'ศัลยกรรมหญิง',
        dateOfVisit: today,
        dateOfOperation: dayAfterTomorrow,
        operationTime: '08:30',
        scheduleType: 'elective',
        orRoom: 'OR 2',
        caseOrder: '1',
        surgeon: 'พญ.ตรีรินทร์ ยิ่งยงวัฒนวิทยา',
        diagnosis: 'Myoma uteri with AUB',
        operation: 'TAH with BSO',
        asaClass: 'II',
        asaEmergency: false,
      },
      {
        history: {
          presentIllness: 'ประจำเดือนมามากและซีด 6 เดือน',
          allergyStatus: 'no',
          underlyingStatus: 'yes',
          ht: true,
          htYears: '3',
          medication: 'Amlodipine (5) 1x1, Ferrous fumarate 1x2',
          drinkingStatus: 'no',
          smokingStatus: 'no',
          drugAddictionStatus: 'no',
        },
        physicalExam: {
          bw: '62',
          ht: '158',
          bmi: '24.8',
          bp: '132/80',
          pulse: '80',
          rr: '18',
          temp: '36.5',
          spo2: '99',
          toothStatus: ['Normal'],
          mouthOpening: 'normal',
          neckMovement: 'normal',
          thyromentalDistance: '>=6',
          mallampatiClass: 'II',
          expectedDifficultAirway: 'no',
          breathSound: 'normal',
          heartSound: 'normal',
          functionalCapacity: '>= 4 METs',
        },
        investigation: {
          cxrStatus: 'normal',
          ekgStatus: 'normal',
        },
        laboratory: {
          hb: '10.8',
          hct: '33.0',
          wbc: '6900',
          plt: '260000',
          na: '140',
          k: '4.0',
          cl: '103',
          co2: '25',
          bun: '11',
          cr: '0.7',
          prepPrc: '1',
        },
        premedication: {
          items: ['Diazepam 5 mg PO hs', 'Hold Enalapril เช้าวันผ่าตัด', '', ''],
          npoTime: 'หลัง 24.00 น.',
          onIvf: 'LRS 1000 ml rate 80 ml/hr',
        },
        problemList: ['Mild anemia secondary to AUB', 'HT on ACEI', '', '', '', ''],
        anestheticPlan: {
          gaSelected: true,
          gaMethods: ['Intubation'],
          raSelected: true,
          raMethods: ['Epidural'],
        },
        preparationOrders: ['เตรียม Epidural set สำหรับ post-op pain', 'จอง PRC 1 unit', '', ''],
        postAnesthesia: {
          summarizedBy: 'พญ.วชิราภรณ์',
          summarizedDate: today,
          bp: '118/72',
          pulse: '76',
          rr: '16',
          temp: '36.6',
          spo2: '99',
          painScore: '4',
          complicationStatus: 'yes',
          complicationDetail: 'Mild PONV หลังผ่าตัด ให้ Ondansetron 4 mg IV อาการดีขึ้น',
          visitBy: 'พญ.วชิราภรณ์',
          visitDate: today,
        },
      },
    ),
  ];
}
