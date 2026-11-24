export type EvaluationStatus = 'draft' | 'evaluated' | 'post_op_completed' | 'locked';
export type ScheduleType = 'elective' | 'emergency';
export type AsaClass = '' | 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
export type AnesthesiaSummaryType = '' | 'GA' | 'RA' | 'GA+RA' | 'MAC';
export type PatientGender = '' | 'male' | 'female';

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
export type SelfCareStatus = '' | 'independent' | 'dependent';
export type DyspneaStatus = '' | 'no' | 'yes';
export type FunctionalCapacityLevel = '' | '>4' | '<4';
export type UnderlyingControlStatus = '' | 'good' | 'poor';
export type OxygenSupportMode = '' | 'cannula' | 'mask_bag' | 'ett' | 'other';
export type VentilatorMode = '' | 'vcv' | 'pcv';
export type AntiHivStatus = '' | 'negative' | 'positive';
export type HbsAgStatus = '' | 'negative' | 'positive';
export type BloodGasType = '' | 'ABG' | 'VBG';
export type BloodGroup = '' | 'A' | 'B' | 'AB' | 'O';
export type BloodRh = '' | 'positive' | 'negative';
export type BloodPrepStatus = 'no_blood' | 'ready' | 'not_ready' | 'waiting_red_cross' | 'other';

export const BLOOD_GROUP_OPTIONS: readonly Exclude<BloodGroup, ''>[] = ['A', 'B', 'AB', 'O'] as const;

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

export const DEFAULT_SPECIALTY_LIST = [
  'Sx',
  'Obs',
  'Ortho',
  'Med',
  'Maxillo',
  'Plastic',
  'GI med',
  'Chest med',
  'Neuro',
  'Eye',
  'ENT',
  'Uro',
] as const;

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
  underlyingControl?: UnderlyingControlStatus;
  dm: boolean;
  dmYears: string;
  dmControl?: UnderlyingControlStatus;
  dmDetail: string;
  ht: boolean;
  htYears: string;
  htControl?: UnderlyingControlStatus;
  htDetail: string;
  dlp: boolean;
  dlpYears: string;
  dlpControl?: UnderlyingControlStatus;
  dlpDetail: string;
  ckd: boolean;
  ckdYears: string;
  ckdControl?: UnderlyingControlStatus;
  ckdDetail: string;
  heartDisease: boolean;
  heartDiseaseYears: string;
  heartDiseaseControl?: UnderlyingControlStatus;
  heartDiseaseDetail: string;
  otherUnderlying: string[];
  underlyingDetail: string;
  medication: string;
  previousOps: string[];
  previousOpComplication: string;
  drinkingStatus: TriStatus;
  drinkingAmount?: string;
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
  gcsE?: string;
  gcsV?: string;
  gcsM?: string;
  selfCareStatus?: SelfCareStatus;
  dyspneaStatus?: DyspneaStatus;
  currentStatusDetail?: string;
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
  functionalCapacityLevel?: FunctionalCapacityLevel;
  functionalCapacity: string;
}

export interface InvestigationData {
  cxrStatus: NormalAbnormal;
  cxrDetail: string;
  ekgStatus: NormalAbnormal;
  ekgDetail: string;
  other: string;
}

export interface CustomLabItem {
  name: string;
  value: string;
}

export interface LaboratoryData {
  labDate?: string;
  cbcDate?: string;
  chemDate?: string;
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
  antiHiv: AntiHivStatus;
  hbsAg?: HbsAgStatus;
  lactate: string;
  tropI: string;
  ft3?: string;
  ft4?: string;
  tsh?: string;
  bgType?: BloodGasType;
  bgPh?: string;
  bgPco2?: string;
  bgPo2?: string;
  bgHco3?: string;
  bgBe?: string;
  bgSao2?: string;
  bgFio2?: string;
  other: string;
  customLabs?: CustomLabItem[];
  bloodGroup?: BloodGroup;
  bloodRh?: BloodRh;
  prepTs: boolean;
  prepPrc: string;
  prepFfp: string;
  prepPlt: string;
  prepCryo?: string;
  prepStatuses: BloodPrepStatus[];
  prepStatusDetail: string;
}

export interface PremedicationData {
  items: string[];
  npoTime: string;
  lastMealTime?: string;
  lastWaterTime?: string;
  onIvf: string;
}

export interface AnestheticPlanData {
  gaSelected: boolean;
  gaMethods: GaMethod[];
  gaOther: string;
  raSelected: boolean;
  raMethods: RaMethod[];
  raOther: string;
  macSelected?: boolean;
  macDetail?: string;
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

export const POST_OP_LEFT_COMPLICATIONS = [
  { key: 'airway_dental_injury', label: 'Air way / dental injury' },
  { key: 'anaphylaxis', label: 'Anaphylaxis' },
  { key: 'awareness', label: 'Awareness' },
  { key: 'blood_mismatch_transfusion_reaction', label: 'Blood mismatch /Transfusion reaction' },
  { key: 'bradycardia', label: 'Bradycardia' },
  { key: 'bronchospasm', label: 'Bronchospasm' },
  { key: 'burn', label: 'Burn' },
  { key: 'cardiac_arrhythmia', label: 'Cardiac arrhythmia ( ต้อง Rx.)' },
  { key: 'cardiac_arrest', label: 'Cardiac arrest' },
  { key: 'delayed_emergence', label: 'Delayed emergence 30-60 นาที' },
  { key: 'delirium_agitation', label: 'Delirium / agitation' },
  { key: 'desaturation', label: 'Desaturation < 90% 3 นาที / PaO2/Fio2 < 300' },
  { key: 'difficult_intubation', label: 'Difficult intubation', detailField: 'difficultIntubationGrade' as const },
  { key: 'drug_error', label: 'Drug error' },
  { key: 'equipment_malfunction', label: 'Equipment malfunction' },
  { key: 'esophageal_intubation', label: 'Esophageal intubation' },
  { key: 'eye_injury', label: 'Eye injury' },
  { key: 'failed_intubation', label: 'Failed intubation' },
  { key: 'hoarseness_of_voice', label: 'Hoarsness of voice' },
  { key: 'hypertension', label: 'Hypertension' },
  {
    key: 'hypotension',
    label:
      'Hypotension (BP<90/60 mm.Hg และให้การรักษาด้วย Ephedrine>30 mg หรือ Levophed > 30 mcgหรือต้อง drip vassopressor /Inotrop drug เพิ่มจากระยะแรกที่ไม่ได้ drip )',
  },
  { key: 'malignant_hyperthermia', label: 'Malignant Hyperthermia' },
  { key: 'massive_blood_loss', label: 'Massive blood loss' },
  { key: 'narcotic_overdose', label: 'Narcotic overdose' },
  { key: 'nerve_injury', label: 'Nerve injury' },
  { key: 'oliguria', label: 'Oliguria' },
  { key: 'hypothermia', label: 'Hypothermia ( T<36 °c )' },
  { key: 'hypovolemic_shock', label: 'Hypovolemic shock' },
  { key: 'itching', label: 'Itching' },
  { key: 'laryngospasm', label: 'Laryngospasm' },
  { key: 'myocardial_ischemia', label: 'Myocardial ishemia' },
  { key: 'nausea_vomiting', label: 'Nausea & vomitting' },
  { key: 'one_lung_intubation', label: 'One lung intubation' },
  { key: 'pain_score_gt4', label: 'Pain score >4', detailField: 'painScoreDetail' as const },
  { key: 'pdph', label: 'PDPH' },
] as const;

export const POST_OP_RIGHT_COMPLICATIONS = [
  { key: 'pneumothorax', label: 'Pneumothorax' },
  { key: 'prolong_nmb', label: 'Prolong NMB' },
  { key: 'pulmonary_aspiration', label: 'Pulmonary aspiration' },
  { key: 'pulmonary_edema', label: 'Pulmonary edema' },
  { key: 'pulmonary_embolism', label: 'Pulmonary embolism' },
  { key: 'reintubation', label: 'Reintubation' },
  { key: 'shivering', label: 'Shivering' },
  { key: 'sore_throat', label: 'Sore throat' },
  { key: 'tachycardia', label: 'Tachycardia' },
  { key: 'total_spinal_block', label: 'Total spinal block' },
  { key: 'volume_overload', label: 'Volume overload' },
  { key: 'other_complication', label: 'อื่นๆ', detailField: 'otherComplicationDetail' as const },
] as const;

export const POST_OP_ALL_COMPLICATIONS = [
  ...POST_OP_LEFT_COMPLICATIONS,
  ...POST_OP_RIGHT_COMPLICATIONS,
] as const;

export type PostOpComplicationKey = (typeof POST_OP_ALL_COMPLICATIONS)[number]['key'];

export const POST_OP_COMPLICATION_KEY_LIST: PostOpComplicationKey[] = POST_OP_ALL_COMPLICATIONS.map(
  (c) => c.key,
);

export const POST_OP_OUTCOME_OPTIONS = [
  { key: 'cancelled_before_start', number: '1', label: 'Cancelled case ก่อนเริ่มเคส' },
  { key: 'cancelled_after_start', number: '2', label: 'Cancelled เคส หลังเริ่มเคส' },
  { key: 'dead_in_24hr', number: '3', label: 'Dead in 24 hr' },
  { key: 'dot', number: '4', label: 'DOT' },
  { key: 'refer', number: '5', label: 'Refer' },
  { key: 'reintubation', number: '6', label: 'Reintubation' },
  { key: 'plan_icu', number: '7', label: 'Plan ICU' },
  { key: 'unplan_icu', number: '7', label: 'Unplan ICU' },
] as const;

export type PostOpOutcomeKey = (typeof POST_OP_OUTCOME_OPTIONS)[number]['key'];

export const POST_OP_OUTCOME_KEY_LIST: PostOpOutcomeKey[] = POST_OP_OUTCOME_OPTIONS.map(
  (o) => o.key,
);

export const POST_OP_INCIDENT_OPTIONS = [
  { key: 'clinical_risk', label: 'Clinical risk' },
  { key: 'non_clinical_risk', label: 'Non clinical risk' },
] as const;

export type PostOpIncidentType = (typeof POST_OP_INCIDENT_OPTIONS)[number]['key'];

export const POST_OP_SEVERITY_LEVELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const;
export type PostOpSeverityLevel = '' | (typeof POST_OP_SEVERITY_LEVELS)[number];

export const POST_OP_ADMIN_ERROR_OPTIONS = [
  { key: 'right_patient', number: '1', label: 'Right Patient' },
  { key: 'right_route', number: '4', label: 'Right Route' },
  { key: 'right_drug', number: '2', label: 'Right Drug' },
  { key: 'right_time', number: '5', label: 'Right Time' },
  { key: 'right_dose', number: '3', label: 'Right Dose' },
  { key: 'right_documentation', number: '6', label: 'Right Documentation' },
] as const;

export type AdministrationErrorKey = (typeof POST_OP_ADMIN_ERROR_OPTIONS)[number]['key'];

export const POST_OP_ADMIN_ERROR_KEY_LIST: AdministrationErrorKey[] =
  POST_OP_ADMIN_ERROR_OPTIONS.map((a) => a.key);

export interface PostOpComplicationData {
  periOpComplications: PostOpComplicationKey[];
  postOpComplications: PostOpComplicationKey[];
  difficultIntubationGrade: string;
  painScoreDetail: string;
  otherComplicationDetail?: string;
  noneProblem: boolean;
  noneProblemPeriOp?: boolean;
  noneProblemPostOp?: boolean;
  outcomes: PostOpOutcomeKey[];
  incidentTypes: PostOpIncidentType[];
  severityLevel: PostOpSeverityLevel;
  administrationErrors: AdministrationErrorKey[];
  remark: string;
  periOpRecorder: string;
  periOpDate: string;
  periOpTime: string;
  postOpRecorder: string;
  postOpDate: string;
  postOpTime: string;
}

export function getEffectiveNoneProblemFlags(
  comp?: Partial<PostOpComplicationData> | null,
): { periOp: boolean; postOp: boolean; any: boolean } {
  if (!comp) return { periOp: false, postOp: false, any: false };
  const periComps = Array.isArray(comp.periOpComplications) ? comp.periOpComplications : [];
  const postComps = Array.isArray(comp.postOpComplications) ? comp.postOpComplications : [];
  const hasExplicit =
    typeof comp.noneProblemPeriOp === 'boolean' ||
    typeof comp.noneProblemPostOp === 'boolean';
  const periOp =
    (hasExplicit ? Boolean(comp.noneProblemPeriOp) : Boolean(comp.noneProblem)) &&
    periComps.length === 0;
  const postOp =
    (hasExplicit ? Boolean(comp.noneProblemPostOp) : Boolean(comp.noneProblem)) &&
    postComps.length === 0;
  return { periOp, postOp, any: periOp || postOp };
}

export function createEmptyPostOpComplication(): PostOpComplicationData {
  return {
    periOpComplications: [],
    postOpComplications: [],
    difficultIntubationGrade: '',
    painScoreDetail: '',
    otherComplicationDetail: '',
    noneProblem: false,
    noneProblemPeriOp: false,
    noneProblemPostOp: false,
    outcomes: [],
    incidentTypes: [],
    severityLevel: '',
    administrationErrors: [],
    remark: '',
    periOpRecorder: '',
    periOpDate: '',
    periOpTime: '',
    postOpRecorder: '',
    postOpDate: '',
    postOpTime: '',
  };
}

export function summarizePostOpComplications(
  comp?: Partial<PostOpComplicationData> | null,
): string {
  if (!comp) return '';
  const periSet = new Set(comp.periOpComplications ?? []);
  const postSet = new Set(comp.postOpComplications ?? []);
  const items: string[] = [];

  for (const item of POST_OP_ALL_COMPLICATIONS) {
    const inPeri = periSet.has(item.key);
    const inPost = postSet.has(item.key);
    if (!inPeri && !inPost) continue;

    let label: string = item.label;
    if (item.key === 'difficult_intubation' && comp.difficultIntubationGrade?.trim()) {
      label = `Difficult intubation LV gr ${comp.difficultIntubationGrade.trim()}`;
    } else if (item.key === 'pain_score_gt4' && comp.painScoreDetail?.trim()) {
      label = `Pain score >4 (PS=${comp.painScoreDetail.trim()})`;
    } else if (item.key === 'hypotension') {
      label = 'Hypotension';
    } else if (item.key === 'other_complication') {
      const detail = comp.otherComplicationDetail?.trim();
      label = detail ? `อื่นๆ (${detail})` : 'อื่นๆ';
    }

    const phase = inPeri && inPost ? 'Peri/Post-op' : inPeri ? 'Peri-op' : 'Post-op';
    items.push(`${label} [${phase}]`);
  }

  return items.join(', ');
}

export type ConsultType =
  | 'none'
  | 'med'
  | 'cardio'
  | 'neuro'
  | 'chest'
  | 'nephro'
  | 'other';

export const CONSULT_TYPE_OPTIONS: readonly { value: ConsultType; label: string; shortLabel: string }[] = [
  { value: 'none', label: 'ไม่มี / ไม่ได้ Consult', shortLabel: 'ไม่มี' },
  { value: 'med', label: 'Consult Med', shortLabel: 'Med' },
  { value: 'cardio', label: 'Consult Cardio', shortLabel: 'Cardio' },
  { value: 'neuro', label: 'Consult Neuro', shortLabel: 'Neuro' },
  { value: 'chest', label: 'Consult Chest', shortLabel: 'Chest' },
  { value: 'nephro', label: 'Consult Nephro', shortLabel: 'Nephro' },
  { value: 'other', label: 'อื่นๆ', shortLabel: 'อื่นๆ' },
];

export function formatWardWithBed(ward?: string, bed?: string): string {
  const w = (ward || '').trim();
  const b = (bed || '').trim();
  if (w && b) return `${w} เตียง ${b}`;
  if (w) return w;
  if (b) return `เตียง ${b}`;
  return '';
}

export function formatConsultSummary(
  consultTypes?: ConsultType[],
  consultDetail?: string,
): string {
  const types = Array.isArray(consultTypes) ? consultTypes : [];
  const detail = (consultDetail || '').trim();
  const labels = types
    .map((t) => CONSULT_TYPE_OPTIONS.find((opt) => opt.value === t)?.label)
    .filter((v): v is string => Boolean(v));
  if (labels.length > 0 && detail) {
    return `${labels.join(', ')} — ${detail}`;
  }
  if (labels.length > 0) return labels.join(', ');
  return detail;
}

export type SurgeryPostponementReasonKey =
  | 'no_blood'
  | 'abnormal_pe'
  | 'dyspnea'
  | 'need_investigation'
  | 'need_consult'
  | 'uncontrolled_underlying'
  | 'patient_not_ready'
  | 'or_schedule'
  | 'other';

export interface SurgeryPostponementReasonOption {
  key: SurgeryPostponementReasonKey;
  label: string;
  shortLabel: string;
}

export const SURGERY_POSTPONEMENT_REASON_OPTIONS: SurgeryPostponementReasonOption[] = [
  { key: 'no_blood', label: 'ไม่มีเลือด / เลือดไม่พร้อม', shortLabel: 'ไม่มีเลือด' },
  { key: 'abnormal_pe', label: 'พบ PE ผิดปกติ (ตรวจร่างกายผิดปกติ)', shortLabel: 'พบ PE ผิดปกติ' },
  { key: 'dyspnea', label: 'หายใจเหนื่อย / ปัญหาระบบหายใจ', shortLabel: 'หายใจเหนื่อย' },
  { key: 'need_investigation', label: 'รอ Investigation เพิ่มเติม', shortLabel: 'Investigation เพิ่ม' },
  { key: 'need_consult', label: 'รอ Consult แพทย์เฉพาะทางเพิ่มเติม', shortLabel: 'Consult เพิ่ม' },
  {
    key: 'uncontrolled_underlying',
    label: 'โรคประจำตัวยังคุมไม่ได้ (HT/DM/หัวใจ ฯลฯ)',
    shortLabel: 'โรคประจำตัวคุมไม่ได้',
  },
  {
    key: 'patient_not_ready',
    label: 'ผู้ป่วยไม่พร้อม / ไม่ NPO / ผู้ป่วยขอเลื่อน',
    shortLabel: 'ผู้ป่วยไม่พร้อม / ไม่ NPO',
  },
  {
    key: 'or_schedule',
    label: 'คิวห้องผ่าตัด / ทีมผ่าตัดเลื่อน',
    shortLabel: 'คิว OR / ทีมผ่าตัดเลื่อน',
  },
  { key: 'other', label: 'อื่นๆ (ระบุ)', shortLabel: 'อื่นๆ' },
];

export const SURGERY_POSTPONEMENT_REASON_KEYS: SurgeryPostponementReasonKey[] =
  SURGERY_POSTPONEMENT_REASON_OPTIONS.map((o) => o.key);

export interface SurgeryPostponementData {
  isPostponed: boolean;
  originalDateOfOperation: string;
  postponedToDate: string;
  reasons: SurgeryPostponementReasonKey[];
  otherReasonDetail: string;
  note: string;
}

export function createEmptySurgeryPostponement(): SurgeryPostponementData {
  return {
    isPostponed: false,
    originalDateOfOperation: '',
    postponedToDate: '',
    reasons: [],
    otherReasonDetail: '',
    note: '',
  };
}

export function isSurgeryPostponed(record: PreAnestheticEvaluation): boolean {
  return Boolean(record.formData?.surgeryPostponement?.isPostponed);
}

export function formatPostponementReasons(
  data?: Partial<SurgeryPostponementData> | null,
  short = false,
): string {
  if (!data?.isPostponed) return '';
  const reasons = Array.isArray(data.reasons) ? data.reasons : [];
  const otherDetail = (data.otherReasonDetail ?? '').trim();
  const note = (data.note ?? '').trim();
  const labels = reasons
    .map((key) => {
      const opt = SURGERY_POSTPONEMENT_REASON_OPTIONS.find((o) => o.key === key);
      if (!opt) return '';
      if (key === 'other' && otherDetail) {
        return `อื่นๆ: ${otherDetail}`;
      }
      return short ? opt.shortLabel : opt.label;
    })
    .filter(Boolean);
  if (labels.length === 0 && otherDetail) {
    labels.push(otherDetail);
  }
  if (note && !labels.includes(note)) {
    labels.push(note);
  }
  return labels.join(', ');
}

export type PreOpNotVisitedReasonKey =
  | 'patient_no_show'
  | 'case_cancelled'
  | 'patient_not_admitted'
  | 'emergency_direct_or'
  | 'patient_unavailable'
  | 'referred_or_discharged'
  | 'other';

export interface PreOpNotVisitedReasonOption {
  key: PreOpNotVisitedReasonKey;
  label: string;
  shortLabel: string;
}

export const PRE_OP_NOT_VISITED_REASON_OPTIONS: PreOpNotVisitedReasonOption[] = [
  {
    key: 'patient_no_show',
    label: 'ผู้ป่วยไม่มาตามนัด / เลื่อนนัด',
    shortLabel: 'ผู้ป่วยไม่มาตามนัด',
  },
  {
    key: 'case_cancelled',
    label: 'ยกเลิกผ่าตัด (Cancel case)',
    shortLabel: 'ยกเลิกผ่าตัด',
  },
  {
    key: 'patient_not_admitted',
    label: 'ผู้ป่วยยังไม่ Admit / ยังไม่ถึงหอผู้ป่วย',
    shortLabel: 'ยังไม่ Admit',
  },
  {
    key: 'emergency_direct_or',
    label: 'เคสฉุกเฉินเข้าห้องผ่าตัดทันที',
    shortLabel: 'ฉุกเฉินเข้า OR ทันที',
  },
  {
    key: 'patient_unavailable',
    label: 'ไม่พบผู้ป่วยที่หอผู้ป่วย (ไปตรวจพิเศษ / ทำหัตถการ)',
    shortLabel: 'ไม่พบผู้ป่วยที่หอผู้ป่วย',
  },
  {
    key: 'referred_or_discharged',
    label: 'ส่งต่อ (Refer) / จำหน่าย (D/C) ก่อนผ่าตัด',
    shortLabel: 'Refer / D/C ก่อนผ่าตัด',
  },
  { key: 'other', label: 'อื่นๆ (ระบุ)', shortLabel: 'อื่นๆ' },
];

export const PRE_OP_NOT_VISITED_REASON_KEYS: PreOpNotVisitedReasonKey[] =
  PRE_OP_NOT_VISITED_REASON_OPTIONS.map((o) => o.key);

export interface PreOpNotVisitedData {
  isNotVisited: boolean;
  reasons: PreOpNotVisitedReasonKey[];
  otherReasonDetail: string;
  note: string;
}

export function createEmptyPreOpNotVisited(): PreOpNotVisitedData {
  return {
    isNotVisited: false,
    reasons: [],
    otherReasonDetail: '',
    note: '',
  };
}

export function isPreOpDraftNotVisited(record: PreAnestheticEvaluation): boolean {
  return Boolean(record.formData?.preOpNotVisited?.isNotVisited);
}

export function formatPreOpNotVisitedReasons(
  data?: Partial<PreOpNotVisitedData> | null,
  short = false,
): string {
  if (!data?.isNotVisited) return '';
  const reasons = Array.isArray(data.reasons) ? data.reasons : [];
  const otherDetail = (data.otherReasonDetail ?? '').trim();
  const note = (data.note ?? '').trim();
  const labels = reasons
    .map((key) => {
      const opt = PRE_OP_NOT_VISITED_REASON_OPTIONS.find((o) => o.key === key);
      if (!opt) return '';
      if (key === 'other' && otherDetail) {
        return `อื่นๆ: ${otherDetail}`;
      }
      return short ? opt.shortLabel : opt.label;
    })
    .filter(Boolean);
  if (labels.length === 0 && otherDetail) {
    labels.push(otherDetail);
  }
  if (note && !labels.includes(note)) {
    labels.push(note);
  }
  return labels.join(', ');
}

export interface EvaluationFormData {
  history: HistoryData;
  physicalExam: PhysicalExamData;
  investigation: InvestigationData;
  laboratory: LaboratoryData;
  premedication: PremedicationData;
  consult: string;
  consultTypes?: ConsultType[];
  problemList: string[];
  anestheticPlan: AnestheticPlanData;
  preparationOrders: string[];
  postAnesthesia: PostAnesthesiaData;
  postOpComplication?: PostOpComplicationData;
  surgeryPostponement?: SurgeryPostponementData;
  preOpNotVisited?: PreOpNotVisitedData;
}

export interface PreAnestheticEvaluation {
  id: string;
  ownerId: string;
  status: EvaluationStatus;
  patientName: string;
  hn: string;
  an: string;
  age: string;
  gender?: PatientGender;
  ward: string;
  bed?: string;
  specialty?: string;
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

export const DEFAULT_HT_ITEMS: string[] = [
  'Amlodipine (5) 1x1',
  'Amlodipine (10) 1x1',
  'Nifedipine SR (20) 1x1',
  'Manidipine (10) 1x1',
  'Enalapril (5) 1x1',
  'Enalapril (20) 1x1',
  'Losartan (50) 1x1',
  'Losartan (100) 1x1',
  'Atenolol (50) 1x1',
  'Metoprolol (50) 1x1',
  'Bisoprolol (2.5) 1x1',
  'Carvedilol (6.25) 1x1',
  'Propranolol (10) 1x2',
  'HCTZ (25) 1x1',
  'Furosemide (40) 1x1',
  'Hydralazine (25) 1x2',
  'Doxazosin (2) 1x1',
  'Methyldopa (250) 1x2',
];

export const DEFAULT_THYROID_ITEMS: string[] = [
  'Methimazole (5) 1x1',
  'PTU (50) 1x1',
  'Levothyroxine (50 mcg) 1x1',
  'Levothyroxine (100 mcg) 1x1',
  'Eltroxin (50 mcg) 1x1',
  'Eltroxin (100 mcg) 1x1',
];

const DEFAULT_ANTICOAGULANT_ITEMS: string[] = [
  'Warfarin',
  'Enoxaparin',
  'Heparin',
  'Rivaroxaban',
  'Apixaban',
  'Dabigatran',
  'Edoxaban',
];

const DEFAULT_ANTIPLATELET_ITEMS: string[] = [
  'ASA (81) 1x1',
  'Clopidogrel (75) 1x1',
  'Ticagrelor',
  'Prasugrel',
  'Cilostazol',
];

export const DEFAULT_MEDICATION_GROUPS: MedicationGroup[] = [
  {
    id: 'ht',
    label: '1. HT',
    items: [...DEFAULT_HT_ITEMS],
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
    items: [...DEFAULT_ANTICOAGULANT_ITEMS],
  },
  {
    id: 'antiplatelet',
    label: '6. Antiplatelet',
    items: [...DEFAULT_ANTIPLATELET_ITEMS],
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
    id: 'thyroid',
    label: '10. ยาไทรอยด์ (Thyroid)',
    items: [...DEFAULT_THYROID_ITEMS],
  },
  {
    id: 'other',
    label: '11. ยาอื่นๆ',
    items: [],
  },
];

const ANTIPLATELET_TOKEN_RE =
  /\b(?:asa|aspirin|aspent|clopidogrel|plavix|apolets|ticagrelor|brilinta|prasugrel|effient|cilostazol|pletaal|ticlopidine|ticlid)\b/i;

const ANTICOAGULANT_TOKEN_RE =
  /\b(?:warfarin|coumadin|orfarin|enoxaparin|clexane|lmwh|heparin|ufh|rivaroxaban|xarelto|apixaban|eliquis|dabigatran|pradaxa|edoxaban|lixiana|fondaparinux|arixtra)\b/i;

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

  // Auto-upgrade legacy 3-item HT default to expanded antihypertensive list
  const htGroup = cleaned.find((g) => g.id === 'ht');
  if (htGroup) {
    const legacyHt = ['amlodipine (5) 1x1', 'amlodipine (10) 1x1', 'atenolol (50) 1x1'];
    const isExactLegacyHt =
      htGroup.items.length === legacyHt.length &&
      htGroup.items.every((it, idx) => it.trim().toLowerCase() === legacyHt[idx]);
    if (isExactLegacyHt) {
      htGroup.items = [...DEFAULT_HT_ITEMS];
    }
  }

  // Auto-correct legacy/misclassified Anticoagulant vs Antiplatelet groups
  const anticoagGroup = cleaned.find((g) => g.id === 'anticoag');
  const antiplateletGroup = cleaned.find((g) => g.id === 'antiplatelet');

  if (anticoagGroup) {
    const isLegacyAnticoag =
      anticoagGroup.items.length === 1 &&
      /^asa(?:\b|\s|\()/i.test(anticoagGroup.items[0].trim());
    if (isLegacyAnticoag) {
      anticoagGroup.items = [...DEFAULT_ANTICOAGULANT_ITEMS];
    } else {
      const misplacedAntiplatelets = anticoagGroup.items.filter((it) =>
        ANTIPLATELET_TOKEN_RE.test(it),
      );
      if (misplacedAntiplatelets.length > 0) {
        anticoagGroup.items = anticoagGroup.items.filter(
          (it) => !ANTIPLATELET_TOKEN_RE.test(it),
        );
        if (anticoagGroup.items.length === 0) {
          anticoagGroup.items = [...DEFAULT_ANTICOAGULANT_ITEMS];
        }
        if (antiplateletGroup) {
          for (const moved of misplacedAntiplatelets) {
            const normalized = /^asa$/i.test(moved.trim()) ? 'ASA (81) 1x1' : moved;
            if (
              !antiplateletGroup.items.some(
                (it) => it.toLowerCase() === normalized.toLowerCase(),
              )
            ) {
              antiplateletGroup.items.unshift(normalized);
            }
          }
        }
      }
    }
  }

  if (antiplateletGroup) {
    const isLegacyAntiplatelet =
      antiplateletGroup.items.length === 1 &&
      /^clopidogrel$/i.test(antiplateletGroup.items[0].trim());
    if (isLegacyAntiplatelet) {
      antiplateletGroup.items = [...DEFAULT_ANTIPLATELET_ITEMS];
    } else {
      const misplacedAnticoags = antiplateletGroup.items.filter((it) =>
        ANTICOAGULANT_TOKEN_RE.test(it),
      );
      if (misplacedAnticoags.length > 0) {
        antiplateletGroup.items = antiplateletGroup.items.filter(
          (it) => !ANTICOAGULANT_TOKEN_RE.test(it),
        );
        if (anticoagGroup) {
          for (const moved of misplacedAnticoags) {
            if (
              !anticoagGroup.items.some((it) => it.toLowerCase() === moved.toLowerCase())
            ) {
              anticoagGroup.items.push(moved);
            }
          }
        }
      }
    }
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

export function sanitizeSpecialtyList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_SPECIALTY_LIST];
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

export type AntithromboticDrugClass = 'anticoagulant' | 'antiplatelet';
export type AntithromboticHoldStatus = '' | 'stopped' | 'not_stopped';
export type AntithromboticStopUnit = 'วัน' | 'ชั่วโมง' | 'สัปดาห์';

export interface SelectedMedicationEntry {
  name: string;
  dose: string;
  regimen: string;
  holdStatus?: AntithromboticHoldStatus;
  stopped?: boolean;
  stopDate?: string;
  stopDuration?: string;
  stopUnit?: AntithromboticStopUnit;
}

export function detectAntithromboticDrugClass(
  medName: string,
  groups?: readonly MedicationGroup[],
): AntithromboticDrugClass | null {
  const cleaned = medName.trim();
  if (!cleaned) return null;
  if (ANTICOAGULANT_TOKEN_RE.test(cleaned) || /ยาต้านการแข็งตัว|anticoag/i.test(cleaned)) {
    return 'anticoagulant';
  }
  if (ANTIPLATELET_TOKEN_RE.test(cleaned) || /ยาต้านเกล็ดเลือด|antiplatelet/i.test(cleaned)) {
    return 'antiplatelet';
  }
  if (groups && groups.length > 0) {
    const lower = cleaned.toLowerCase();
    for (const grp of groups) {
      if (grp.id !== 'anticoag' && grp.id !== 'antiplatelet') continue;
      const matchesGroup = grp.items.some((item: string) => {
        const parsedName = parseMedicationEntry(item).name.trim().toLowerCase();
        return parsedName && (parsedName === lower || lower.startsWith(`${parsedName} `) || parsedName.startsWith(`${lower} `));
      });
      if (matchesGroup) {
        return grp.id === 'anticoag' ? 'anticoagulant' : 'antiplatelet';
      }
    }
  }
  return null;
}

function normalizeDoseDisplay(rawDose: string): string {
  const trimmed = rawDose.trim();
  if (!trimmed) return '';
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return `${trimmed} mg`;
  }
  return trimmed;
}

function normalizeStopUnit(rawUnit: string | undefined): AntithromboticStopUnit {
  if (rawUnit === 'ชั่วโมง' || rawUnit === 'ชม.' || rawUnit === 'ชม') return 'ชั่วโมง';
  if (rawUnit === 'สัปดาห์') return 'สัปดาห์';
  return 'วัน';
}

const MEDICATION_NOT_STOPPED_BRACKET_RE = /\s*\[ไม่หยุดยา(?:ก่อนผ่าตัด)?\]\s*$/;
const MEDICATION_STOP_BRACKET_RE = /\s*\[หยุดยา([^\]]*)\]\s*$/;

export function parseMedicationEntry(raw: string): SelectedMedicationEntry {
  let text = raw.trim();
  if (!text) return { name: '', dose: '', regimen: '' };

  let holdStatus: AntithromboticHoldStatus = '';
  let stopped = false;
  let stopDate = '';
  let stopDuration = '';
  let stopUnit: AntithromboticStopUnit = 'วัน';

  const notStoppedMatch = text.match(MEDICATION_NOT_STOPPED_BRACKET_RE);
  if (notStoppedMatch) {
    holdStatus = 'not_stopped';
    text = text.slice(0, notStoppedMatch.index).trim();
  } else {
    const stopMatch = text.match(MEDICATION_STOP_BRACKET_RE);
    if (stopMatch) {
      holdStatus = 'stopped';
      stopped = true;
      let inner = (stopMatch[1] ?? '').trim();
      const dateMatch = inner.match(
        /ตั้งแต่\s*(\d{1,2}[/.-]\d{1,2}[/.-]\d{4}|\d{4}-\d{2}-\d{2})/,
      );
      if (dateMatch) {
        stopDate = parseThaiInputToIsoDate(dateMatch[1]) ?? '';
        inner = inner.replace(dateMatch[0], '').trim();
      }
      const durMatch = inner.match(/(\d+(?:\.\d+)?)\s*(วัน|ชั่วโมง|ชม\.?|สัปดาห์)/);
      if (durMatch) {
        stopDuration = durMatch[1];
        stopUnit = normalizeStopUnit(durMatch[2]);
      } else {
        const cleanedRest = inner
          .replace(/[()]/g, '')
          .replace(/ก่อนผ่าตัด/g, '')
          .trim();
        if (cleanedRest) {
          stopDuration = cleanedRest;
        }
      }
      text = text.slice(0, stopMatch.index).trim();
    }
  }

  const stopMeta: Pick<
    SelectedMedicationEntry,
    'holdStatus' | 'stopped' | 'stopDate' | 'stopDuration' | 'stopUnit'
  > =
    holdStatus === 'not_stopped'
      ? { holdStatus: 'not_stopped', stopped: false }
      : stopped
        ? { holdStatus: 'stopped', stopped: true, stopDate, stopDuration, stopUnit }
        : {};

  // Pattern 1: "Name (5) 1x1" or "Name (500 mg) 1x2 pc"
  const parenMatch = text.match(/^([^(]+?)\s*\(([^)]+)\)\s*(.*)$/);
  if (parenMatch) {
    const inside = parenMatch[2].trim();
    if (/^\d+(?:\.\d+)?(?:\s*(?:mg|mcg|g|ml|u|iu|unit|units|%|tab|tabs|เม็ด))?$/i.test(inside) || /\d/.test(inside)) {
      return {
        name: parenMatch[1].trim(),
        dose: normalizeDoseDisplay(inside),
        regimen: parenMatch[3].trim(),
        ...stopMeta,
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
      ...stopMeta,
    };
  }

  // Pattern 3: "Name 1x1 ..."
  const regOnlyMatch = text.match(/^(.+?)\s+(\d+x\d+.*)$/i);
  if (regOnlyMatch) {
    return {
      name: regOnlyMatch[1].trim(),
      dose: '',
      regimen: regOnlyMatch[2].trim(),
      ...stopMeta,
    };
  }

  return { name: text, dose: '', regimen: '', ...stopMeta };
}

export function formatMedicationEntry(entry: SelectedMedicationEntry): string {
  const n = entry.name.trim();
  const d = entry.dose.trim();
  const r = entry.regimen.trim();
  if (!n) return '';
  const base = `${n}${d ? ` (${d})` : ''}${r ? ` ${r}` : ''}`;
  if (entry.holdStatus === 'not_stopped') {
    return `${base} [ไม่หยุดยา]`;
  }
  const isStopped = entry.holdStatus === 'stopped' || Boolean(entry.stopped);
  if (!isStopped) return base;
  const thaiStopDate = entry.stopDate ? formatThaiDateBE(entry.stopDate) : '';
  if (thaiStopDate) {
    return `${base} [หยุดยาตั้งแต่ ${thaiStopDate}]`;
  }
  return `${base} [หยุดยาก่อนผ่าตัด]`;
}

export function getMedicationLines(medicationText: string | undefined): string[] {
  if (!medicationText) return [];
  const trimmed = medicationText.trim();
  if (!trimmed) return [];
  const parts = trimmed.includes('\n') ? trimmed.split(/\r?\n+/) : trimmed.split(/,/);
  return parts.map((item) => item.trim()).filter(Boolean);
}

export function formatMedicationMultiline(medicationText: string | undefined): string {
  return getMedicationLines(medicationText).join('\n');
}

export function parseMedicationList(medicationText: string): SelectedMedicationEntry[] {
  return getMedicationLines(medicationText).map(parseMedicationEntry);
}

export function serializeMedicationList(entries: SelectedMedicationEntry[]): string {
  return entries
    .map(formatMedicationEntry)
    .filter(Boolean)
    .join('\n');
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
  bed: 32,
  specialty: 80,
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
  const rawYear = Number(match[1]);
  const year = rawYear > 2400 ? rawYear - 543 : rawYear;
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

export function formatShortThaiDate(isoDate: string): string {
  const trimmed = (isoDate || '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return trimmed;
  const rawYear = Number(match[1]);
  const beYear = rawYear > 2400 ? rawYear : rawYear + 543;
  const shortBe = String(beYear).slice(-2);
  return `${match[3]}/${match[2]}/${shortBe}`;
}

/**
 * Formats an ISO YYYY-MM-DD date string to Thai Buddhist Era DD/MM/YYYY (e.g. 2026-11-21 -> 21/11/2569).
 */
export function formatThaiDateBE(isoDate: string | undefined): string {
  const trimmed = (isoDate || '').trim();
  if (!trimmed) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return trimmed;
  const rawYear = Number(match[1]);
  const beYear = rawYear > 2400 ? rawYear : rawYear + 543;
  return `${match[3]}/${match[2]}/${beYear}`;
}

/**
 * Parses a user-typed Thai BE (DD/MM/2569, DD/MM/69, DD-MM-2569) or CE/ISO date into YYYY-MM-DD (CE).
 * Returns '' if input is empty, or null if invalid.
 */
export function parseThaiInputToIsoDate(rawInput: string): string | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  let ceYear: number;
  let month: number;
  let day: number;

  const isoMatch = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(trimmed);
  const dmyMatch = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(trimmed);
  const compactMatch = /^(\d{2})(\d{2})(\d{4})$/.exec(trimmed);

  if (isoMatch) {
    const rawY = Number(isoMatch[1]);
    ceYear = rawY > 2400 ? rawY - 543 : rawY;
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else if (dmyMatch) {
    day = Number(dmyMatch[1]);
    month = Number(dmyMatch[2]);
    const rawY = Number(dmyMatch[3]);
    if (dmyMatch[3].length === 2) {
      // 2-digit Thai BE year (e.g. 69 -> 2569 -> 2026)
      ceYear = 2500 + rawY - 543;
    } else if (rawY > 2400) {
      ceYear = rawY - 543;
    } else {
      ceYear = rawY;
    }
  } else if (compactMatch) {
    day = Number(compactMatch[1]);
    month = Number(compactMatch[2]);
    const rawY = Number(compactMatch[3]);
    ceYear = rawY > 2400 ? rawY - 543 : rawY;
  } else {
    return null;
  }

  if (ceYear < 1900 || ceYear > 2200 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const probe = new Date(ceYear, month - 1, day);
  if (
    probe.getFullYear() !== ceYear ||
    probe.getMonth() !== month - 1 ||
    probe.getDate() !== day
  ) {
    return null;
  }

  return `${ceYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getDateSearchTokens(isoDate: string): string {
  const trimmed = (isoDate || '').trim();
  if (!trimmed) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return trimmed.toLowerCase();
  const rawYear = Number(match[1]);
  const ceYear = rawYear > 2400 ? rawYear - 543 : rawYear;
  const beYear = ceYear + 543;
  const shortBe = String(beYear).slice(-2);
  const shortCe = String(ceYear).slice(-2);
  const dd = match[3];
  const mm = match[2];
  const dNum = String(Number(dd));
  const mNum = String(Number(mm));
  const thaiMeta = formatThaiScheduleDate(`${ceYear}-${mm}-${dd}`);
  return [
    trimmed,
    `${ceYear}-${mm}-${dd}`,
    `${beYear}-${mm}-${dd}`,
    `${dd}/${mm}/${shortBe}`,
    `${dNum}/${mNum}/${shortBe}`,
    `${dd}/${mm}/${beYear}`,
    `${dNum}/${mNum}/${beYear}`,
    `${dd}/${mm}/${ceYear}`,
    `${dd}/${mm}/${shortCe}`,
    `${dd}-${mm}-${shortBe}`,
    `${dd}-${mm}-${beYear}`,
    thaiMeta.label,
  ]
    .join(' ')
    .toLowerCase();
}

const THAI_NAME_PREFIX_RE = /^(?:เด็กชาย|เด็กหญิง|นางสาว|นาย|นาง|น\.ส\.|ด\.ช\.|ด\.ญ\.)\s*/i;

export function normalizeSearchCode(val: string | undefined): string {
  return (val || '').replace(/[\s-]/g, '').toLowerCase();
}

export function stripLeadingZeros(val: string): string {
  return val.replace(/^0+(?=\d)/, '');
}

export function matchesEvaluationSearch(
  record: PreAnestheticEvaluation,
  rawQuery: string,
): boolean {
  const trimmed = (rawQuery || '').trim().toLowerCase();
  if (!trimmed) return true;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const hnNorm = normalizeSearchCode(record.hn);
  const hnNoZero = stripLeadingZeros(hnNorm);
  const anNorm = normalizeSearchCode(record.an);
  const anNoZero = stripLeadingZeros(anNorm);
  const nameLower = (record.patientName || '').toLowerCase();
  const nameCompact = nameLower.replace(THAI_NAME_PREFIX_RE, '').replace(/\s+/g, '');

  const dateHaystack = [
    getDateSearchTokens(record.dateOfOperation || ''),
    getDateSearchTokens(record.dateOfVisit || ''),
    getDateSearchTokens(record.formData?.postAnesthesia?.visitDate || ''),
    getDateSearchTokens(record.formData?.postOpComplication?.periOpDate || ''),
    getDateSearchTokens(record.formData?.postOpComplication?.postOpDate || ''),
    getDateSearchTokens(record.formData?.laboratory?.cbcDate || ''),
    getDateSearchTokens(record.formData?.laboratory?.chemDate || ''),
    getDateSearchTokens(record.formData?.laboratory?.labDate || ''),
  ]
    .filter(Boolean)
    .join(' ');

  const textHaystack = [
    nameLower,
    (record.hn || '').toLowerCase(),
    (record.an || '').toLowerCase(),
    (record.ward || '').toLowerCase(),
    (record.bed || '').toLowerCase(),
    (record.specialty || '').toLowerCase(),
    (record.surgeon || '').toLowerCase(),
    (record.orRoom || '').toLowerCase(),
    (record.diagnosis || '').toLowerCase(),
    (record.operation || '').toLowerCase(),
    (record.formData?.history?.presentIllness || '').toLowerCase(),
    (record.formData?.history?.medication || '').toLowerCase(),
    (record.formData?.history?.otherUnderlying || []).join(' ').toLowerCase(),
    (record.formData?.consult || '').toLowerCase(),
    (record.formData?.problemList || []).join(' ').toLowerCase(),
    dateHaystack,
  ]
    .filter(Boolean)
    .join(' ');

  return tokens.every((tok) => {
    if (textHaystack.includes(tok)) return true;
    const tokCode = normalizeSearchCode(tok);
    if (tokCode) {
      if (hnNorm.includes(tokCode) || anNorm.includes(tokCode)) return true;
      const tokNoZero = stripLeadingZeros(tokCode);
      if (tokNoZero && (hnNoZero.includes(tokNoZero) || anNoZero.includes(tokNoZero))) {
        return true;
      }
    }
    const tokCompact = tok.replace(THAI_NAME_PREFIX_RE, '').replace(/\s+/g, '');
    if (tokCompact && nameCompact.includes(tokCompact)) return true;
    return false;
  });
}

export function hydrateEvaluationRecord(
  rawInput: unknown,
  fallbackId?: string,
  fallbackOwnerId = 'local',
): PreAnestheticEvaluation | null {
  if (!rawInput || typeof rawInput !== 'object') return null;
  const raw = rawInput as Partial<PreAnestheticEvaluation> & {
    formData?: Partial<EvaluationFormData>;
  };
  const resolvedId =
    (typeof raw.id === 'string' && raw.id.trim()) ||
    (typeof fallbackId === 'string' && fallbackId.trim()) ||
    '';
  if (!resolvedId) return null;

  const base = createEmptyEvaluation(
    (typeof raw.ownerId === 'string' && raw.ownerId.trim()) || fallbackOwnerId,
  );
  const rawFd: Partial<EvaluationFormData> =
    raw.formData && typeof raw.formData === 'object' ? raw.formData : {};
  const rawHist: Partial<HistoryData> =
    rawFd.history && typeof rawFd.history === 'object' ? rawFd.history : {};
  const rawPhys: Partial<PhysicalExamData> =
    rawFd.physicalExam && typeof rawFd.physicalExam === 'object' ? rawFd.physicalExam : {};
  const rawInv: Partial<InvestigationData> =
    rawFd.investigation && typeof rawFd.investigation === 'object' ? rawFd.investigation : {};
  const rawLab: Partial<LaboratoryData> =
    rawFd.laboratory && typeof rawFd.laboratory === 'object' ? rawFd.laboratory : {};
  const rawPm: Partial<PremedicationData> =
    rawFd.premedication && typeof rawFd.premedication === 'object' ? rawFd.premedication : {};
  const rawAp: Partial<AnestheticPlanData> =
    rawFd.anestheticPlan && typeof rawFd.anestheticPlan === 'object' ? rawFd.anestheticPlan : {};
  const rawPa: Partial<PostAnesthesiaData> =
    rawFd.postAnesthesia && typeof rawFd.postAnesthesia === 'object' ? rawFd.postAnesthesia : {};
  const rawPc: Partial<PostOpComplicationData> =
    rawFd.postOpComplication && typeof rawFd.postOpComplication === 'object'
      ? rawFd.postOpComplication
      : {};
  const rawOx: Partial<OxygenSupportData> | undefined =
    rawPhys.oxygenSupport && typeof rawPhys.oxygenSupport === 'object'
      ? rawPhys.oxygenSupport
      : undefined;

  const normalizeIsoDate = (val: unknown): string => {
    if (typeof val !== 'string') return '';
    const trimmed = val.trim();
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (isoMatch) {
      const y = Number(isoMatch[1]);
      const ceYear = y > 2400 ? y - 543 : y;
      return `${String(ceYear).padStart(4, '0')}-${isoMatch[2]}-${isoMatch[3]}`;
    }
    const dmyMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(trimmed);
    if (dmyMatch) {
      const dd = dmyMatch[1].padStart(2, '0');
      const mm = dmyMatch[2].padStart(2, '0');
      let y = Number(dmyMatch[3]);
      if (dmyMatch[3].length === 2) {
        y = 2500 + y - 543;
      } else if (y > 2400) {
        y = y - 543;
      }
      return `${String(y).padStart(4, '0')}-${mm}-${dd}`;
    }
    return trimmed;
  };

  const merged: PreAnestheticEvaluation = {
    ...base,
    ...raw,
    id: resolvedId,
    ownerId: (typeof raw.ownerId === 'string' && raw.ownerId.trim()) || fallbackOwnerId,
    patientName: typeof raw.patientName === 'string' ? raw.patientName : '',
    hn: typeof raw.hn === 'string' ? raw.hn : '',
    an: typeof raw.an === 'string' ? raw.an : '',
    age: typeof raw.age === 'string' ? raw.age : '',
    ward: typeof raw.ward === 'string' ? raw.ward : '',
    bed: typeof raw.bed === 'string' ? raw.bed : '',
    specialty: typeof raw.specialty === 'string' ? raw.specialty : '',
    dateOfVisit: normalizeIsoDate(raw.dateOfVisit),
    dateOfOperation: normalizeIsoDate(raw.dateOfOperation),
    operationTime: typeof raw.operationTime === 'string' ? raw.operationTime : '',
    scheduleType:
      raw.scheduleType === 'emergency' ||
      (raw.scheduleType !== 'elective' && Boolean(raw.asaEmergency))
        ? 'emergency'
        : 'elective',
    orRoom: typeof raw.orRoom === 'string' ? raw.orRoom : '',
    caseOrder: typeof raw.caseOrder === 'string' ? raw.caseOrder : '',
    surgeon: typeof raw.surgeon === 'string' ? raw.surgeon : '',
    diagnosis: typeof raw.diagnosis === 'string' ? raw.diagnosis : '',
    operation: typeof raw.operation === 'string' ? raw.operation : '',
    asaClass:
      raw.asaClass === 'I' ||
      raw.asaClass === 'II' ||
      raw.asaClass === 'III' ||
      raw.asaClass === 'IV' ||
      raw.asaClass === 'V' ||
      raw.asaClass === 'VI'
        ? raw.asaClass
        : '',
    asaEmergency: Boolean(raw.asaEmergency),
    expectedDifficultAirway: Boolean(raw.expectedDifficultAirway),
    hasComplication: Boolean(raw.hasComplication),
    formData: {
      ...base.formData,
      ...rawFd,
      history: {
        ...base.formData.history,
        ...rawHist,
        otherUnderlying: Array.isArray(rawHist.otherUnderlying)
          ? rawHist.otherUnderlying
          : base.formData.history.otherUnderlying,
        previousOps: Array.isArray(rawHist.previousOps)
          ? rawHist.previousOps
          : base.formData.history.previousOps,
        drugAddictionTypes: Array.isArray(rawHist.drugAddictionTypes)
          ? rawHist.drugAddictionTypes
          : [],
      },
      physicalExam: {
        ...base.formData.physicalExam,
        ...rawPhys,
        oxygenSupport: rawOx
          ? {
              ...createEmptyOxygenSupport(),
              ...rawOx,
              otherItems: Array.isArray(rawOx.otherItems) ? rawOx.otherItems : [],
            }
          : createEmptyOxygenSupport(),
        toothStatus: Array.isArray(rawPhys.toothStatus) ? rawPhys.toothStatus : [],
        missingTeeth: Array.isArray(rawPhys.missingTeeth) ? rawPhys.missingTeeth : [],
        looseTeeth: Array.isArray(rawPhys.looseTeeth) ? rawPhys.looseTeeth : [],
      },
      investigation: {
        ...base.formData.investigation,
        ...rawInv,
      },
      laboratory: {
        ...base.formData.laboratory,
        ...rawLab,
        labDate: normalizeIsoDate(rawLab.labDate),
        cbcDate:
          rawLab.cbcDate !== undefined
            ? normalizeIsoDate(rawLab.cbcDate)
            : rawLab.chemDate === undefined
            ? normalizeIsoDate(rawLab.labDate)
            : '',
        chemDate:
          rawLab.chemDate !== undefined
            ? normalizeIsoDate(rawLab.chemDate)
            : rawLab.cbcDate === undefined
            ? normalizeIsoDate(rawLab.labDate)
            : '',
        customLabs: Array.isArray(rawLab.customLabs)
          ? rawLab.customLabs.map((item) => ({
              name: typeof item?.name === 'string' ? item.name : '',
              value: typeof item?.value === 'string' ? item.value : '',
            }))
          : [],
        bloodGroup:
          rawLab.bloodGroup === 'A' ||
          rawLab.bloodGroup === 'B' ||
          rawLab.bloodGroup === 'AB' ||
          rawLab.bloodGroup === 'O'
            ? rawLab.bloodGroup
            : '',
        bloodRh:
          rawLab.bloodRh === 'positive' || rawLab.bloodRh === 'negative'
            ? rawLab.bloodRh
            : '',
        prepTs: Boolean(rawLab.prepTs),
        prepStatuses: Array.isArray(rawLab.prepStatuses) ? rawLab.prepStatuses : [],
      },
      premedication: {
        ...base.formData.premedication,
        ...rawPm,
        items: Array.isArray(rawPm.items) ? rawPm.items : base.formData.premedication.items,
      },
      consult: typeof rawFd.consult === 'string' ? rawFd.consult : '',
      consultTypes: Array.isArray(rawFd.consultTypes)
        ? rawFd.consultTypes.filter(
            (t): t is ConsultType =>
              t === 'none' ||
              t === 'med' ||
              t === 'cardio' ||
              t === 'neuro' ||
              t === 'chest' ||
              t === 'nephro' ||
              t === 'other',
          )
        : [],
      problemList: Array.isArray(rawFd.problemList)
        ? rawFd.problemList
        : base.formData.problemList,
      anestheticPlan: {
        ...base.formData.anestheticPlan,
        ...rawAp,
        gaMethods: Array.isArray(rawAp.gaMethods) ? rawAp.gaMethods : [],
        raMethods: Array.isArray(rawAp.raMethods) ? rawAp.raMethods : [],
      },
      preparationOrders: Array.isArray(rawFd.preparationOrders)
        ? rawFd.preparationOrders
        : base.formData.preparationOrders,
      postAnesthesia: {
        ...base.formData.postAnesthesia,
        ...rawPa,
        visitBy:
          (typeof rawPa.visitBy === 'string' && rawPa.visitBy.trim() ? rawPa.visitBy : '') ||
          (typeof rawPc.postOpRecorder === 'string' ? rawPc.postOpRecorder : ''),
        visitDate:
          (typeof rawPa.visitDate === 'string' && rawPa.visitDate.trim() ? rawPa.visitDate : '') ||
          (typeof rawPc.postOpDate === 'string' ? rawPc.postOpDate : ''),
      },
      postOpComplication: (() => {
        const hydratedPeriComps = Array.isArray(rawPc.periOpComplications)
          ? rawPc.periOpComplications
          : [];
        const hydratedPostComps = Array.isArray(rawPc.postOpComplications)
          ? rawPc.postOpComplications
          : [];
        const noneFlags = getEffectiveNoneProblemFlags({
          ...rawPc,
          periOpComplications: hydratedPeriComps,
          postOpComplications: hydratedPostComps,
        });
        const unifiedPostOpRecorder =
          (typeof rawPa.visitBy === 'string' && rawPa.visitBy.trim() ? rawPa.visitBy : '') ||
          (typeof rawPc.postOpRecorder === 'string' ? rawPc.postOpRecorder : '');
        const unifiedPostOpDate =
          (typeof rawPa.visitDate === 'string' && rawPa.visitDate.trim() ? rawPa.visitDate : '') ||
          (typeof rawPc.postOpDate === 'string' ? rawPc.postOpDate : '');
        return {
          ...createEmptyPostOpComplication(),
          ...rawPc,
          periOpComplications: hydratedPeriComps,
          postOpComplications: hydratedPostComps,
          noneProblem: noneFlags.any,
          noneProblemPeriOp: noneFlags.periOp,
          noneProblemPostOp: noneFlags.postOp,
          postOpRecorder: unifiedPostOpRecorder,
          postOpDate: unifiedPostOpDate,
          outcomes: Array.isArray(rawPc.outcomes) ? rawPc.outcomes : [],
          incidentTypes: Array.isArray(rawPc.incidentTypes) ? rawPc.incidentTypes : [],
          administrationErrors: Array.isArray(rawPc.administrationErrors)
            ? rawPc.administrationErrors
            : [],
        };
      })(),
      surgeryPostponement: (() => {
        const rawSp = rawFd.surgeryPostponement;
        if (!rawSp || typeof rawSp !== 'object') return createEmptySurgeryPostponement();
        return {
          ...createEmptySurgeryPostponement(),
          ...rawSp,
          isPostponed: Boolean(rawSp.isPostponed),
          originalDateOfOperation: normalizeIsoDate(rawSp.originalDateOfOperation),
          postponedToDate: normalizeIsoDate(rawSp.postponedToDate),
          reasons: Array.isArray(rawSp.reasons)
            ? rawSp.reasons.filter((k): k is SurgeryPostponementReasonKey =>
                SURGERY_POSTPONEMENT_REASON_KEYS.includes(k as SurgeryPostponementReasonKey),
              )
            : [],
        };
      })(),
      preOpNotVisited: (() => {
        const rawNv = rawFd.preOpNotVisited;
        if (!rawNv || typeof rawNv !== 'object') return createEmptyPreOpNotVisited();
        return {
          ...createEmptyPreOpNotVisited(),
          ...rawNv,
          isNotVisited: Boolean(rawNv.isNotVisited),
          reasons: Array.isArray(rawNv.reasons)
            ? rawNv.reasons.filter((k): k is PreOpNotVisitedReasonKey =>
                PRE_OP_NOT_VISITED_REASON_KEYS.includes(k as PreOpNotVisitedReasonKey),
              )
            : [],
        };
      })(),
    },
  };

  const derivedHasComplication =
    merged.formData.postAnesthesia.complicationStatus === 'yes' ||
    (merged.formData.postOpComplication?.periOpComplications?.length ?? 0) > 0 ||
    (merged.formData.postOpComplication?.postOpComplications?.length ?? 0) > 0;

  return {
    ...merged,
    hasComplication: derivedHasComplication,
    status: getEffectiveEvaluationStatus(merged),
  };
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

export function compareByDateAndSurgeon(
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

  const surgA = (a.surgeon || '').trim();
  const surgB = (b.surgeon || '').trim();
  if (surgA !== surgB) {
    if (!surgA) return 1;
    if (!surgB) return -1;
    const surgCmp = surgA.localeCompare(surgB, 'th');
    if (surgCmp !== 0) return surgCmp;
  }

  return compareElectiveSchedule(a, b, direction);
}

export function createEmptyEvaluation(
  ownerId = 'local',
  overrides?: Partial<
    Pick<
      PreAnestheticEvaluation,
      | 'hn'
      | 'patientName'
      | 'gender'
      | 'dateOfOperation'
      | 'dateOfVisit'
      | 'orRoom'
      | 'caseOrder'
      | 'operationTime'
      | 'scheduleType'
      | 'asaEmergency'
      | 'surgeon'
      | 'ward'
      | 'bed'
      | 'specialty'
    >
  >,
): PreAnestheticEvaluation {
  const today = getTodayIsoDate();
  const scheduleType: ScheduleType =
    overrides?.scheduleType ?? (overrides?.asaEmergency ? 'emergency' : 'elective');
  return {
    id: generateEvaluationId(),
    ownerId,
    status: 'draft',
    patientName: overrides?.patientName ?? '',
    hn: overrides?.hn ?? '',
    an: '',
    age: '',
    gender: overrides?.gender ?? '',
    ward: overrides?.ward ?? '',
    bed: overrides?.bed ?? '',
    specialty: overrides?.specialty ?? '',
    dateOfVisit: overrides?.dateOfVisit ?? today,
    dateOfOperation: overrides?.dateOfOperation ?? today,
    operationTime: overrides?.operationTime ?? '',
    scheduleType,
    orRoom: overrides?.orRoom ?? '',
    caseOrder: overrides?.caseOrder ?? '',
    surgeon: overrides?.surgeon ?? '',
    diagnosis: '',
    operation: '',
    asaClass: '',
    asaEmergency: overrides?.asaEmergency ?? false,
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
        underlyingControl: '',
        dm: false,
        dmYears: '',
        dmControl: '',
        dmDetail: '',
        ht: false,
        htYears: '',
        htControl: '',
        htDetail: '',
        dlp: false,
        dlpYears: '',
        dlpControl: '',
        dlpDetail: '',
        ckd: false,
        ckdYears: '',
        ckdControl: '',
        ckdDetail: '',
        heartDisease: false,
        heartDiseaseYears: '',
        heartDiseaseControl: '',
        heartDiseaseDetail: '',
        otherUnderlying: [''],
        underlyingDetail: '',
        medication: '',
        previousOps: ['', '', ''],
        previousOpComplication: '',
        drinkingStatus: 'none',
        drinkingAmount: '',
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
        gcsE: '',
        gcsV: '',
        gcsM: '',
        selfCareStatus: '',
        dyspneaStatus: '',
        currentStatusDetail: '',
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
        functionalCapacityLevel: '',
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
        labDate: '',
        cbcDate: '',
        chemDate: '',
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
        antiHiv: '',
        hbsAg: '',
        lactate: '',
        tropI: '',
        ft3: '',
        ft4: '',
        tsh: '',
        bgType: '',
        bgPh: '',
        bgPco2: '',
        bgPo2: '',
        bgHco3: '',
        bgBe: '',
        bgSao2: '',
        bgFio2: '',
        other: '',
        customLabs: [],
        bloodGroup: '',
        bloodRh: '',
        prepTs: false,
        prepPrc: '',
        prepFfp: '',
        prepPlt: '',
        prepCryo: '',
        prepStatuses: [],
        prepStatusDetail: '',
      },
      premedication: {
        items: ['', '', ''],
        npoTime: '',
        lastMealTime: '',
        lastWaterTime: '',
        onIvf: '',
      },
      consult: '',
      consultTypes: [],
      problemList: ['', '', '', '', '', ''],
      anestheticPlan: {
        gaSelected: false,
        gaMethods: [],
        gaOther: '',
        raSelected: false,
        raMethods: [],
        raOther: '',
        macSelected: false,
        macDetail: '',
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
      postOpComplication: createEmptyPostOpComplication(),
      surgeryPostponement: createEmptySurgeryPostponement(),
      preOpNotVisited: createEmptyPreOpNotVisited(),
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
  if (plan.macSelected) return 'MAC';
  return '';
}

export function inferPatientGender(patientName: string, explicitGender?: PatientGender): PatientGender {
  if (explicitGender === 'male' || explicitGender === 'female') return explicitGender;
  const trimmed = (patientName || '').trim();
  if (!trimmed) return '';
  if (/^(?:นางสาว|น\.ส\.|นาง|ด\.ญ\.|เด็กหญิง|Mrs\.?|Ms\.?|Miss\b)/i.test(trimmed)) {
    return 'female';
  }
  if (/^(?:นาย|ด\.ช\.|เด็กชาย|Mr\.?|Master\b)/i.test(trimmed)) {
    return 'male';
  }
  return '';
}

export function parseAgeInYears(ageRaw: string): number | null {
  const s = (ageRaw || '').trim();
  if (!s) return null;

  // Match compound forms like "1 ปี 6 เดือน" or "2 yr 3 mo"
  const yrMatch = /(\d+(?:\.\d+)?)\s*(?:ปี|y(?:r|ear)?s?)/i.exec(s);
  const moMatch = /(\d+(?:\.\d+)?)\s*(?:เดือน|m(?:o|onth)?s?)/i.exec(s);
  const dayMatch = /(\d+(?:\.\d+)?)\s*(?:วัน|d(?:ay)?s?)/i.exec(s);

  if (yrMatch || moMatch || dayMatch) {
    const years = yrMatch ? parseFloat(yrMatch[1]) : 0;
    const months = moMatch ? parseFloat(moMatch[1]) : 0;
    const days = dayMatch ? parseFloat(dayMatch[1]) : 0;
    const total = years + months / 12 + days / 365;
    return Number.isFinite(total) && total >= 0 && total <= 150 ? total : null;
  }

  const plain = parseFloat(s.replace(/,/g, ''));
  if (!Number.isFinite(plain) || plain < 0 || plain > 150) return null;
  return plain;
}

export function isPreOpVisited(record: PreAnestheticEvaluation): boolean {
  if (record.formData?.preOpNotVisited?.isNotVisited) {
    return false;
  }
  const plan = record.formData?.anestheticPlan;
  return Boolean(
    record.dateOfVisit?.trim() ||
      record.asaClass ||
      plan?.gaSelected ||
      plan?.raSelected ||
      plan?.macSelected ||
      record.status === 'evaluated' ||
      record.status === 'post_op_completed' ||
      record.status === 'locked',
  );
}

export function isPostOpVisited(record: PreAnestheticEvaluation): boolean {
  const pa = record.formData?.postAnesthesia;
  const pc = record.formData?.postOpComplication;
  return Boolean(
    getPostOpVisitCompleteness(pa, pc).isComplete ||
      Boolean(pa?.visitDate?.trim() && pa?.visitBy?.trim()) ||
      Boolean(pc?.postOpDate?.trim() && pc?.postOpRecorder?.trim()) ||
      record.status === 'post_op_completed',
  );
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
    gaSelected: Boolean(fd.anestheticPlan?.gaSelected),
    gaMethods: (Array.isArray(fd.anestheticPlan?.gaMethods) ? fd.anestheticPlan.gaMethods : [])
      .filter((m): m is GaMethod => gaAllow.includes(m))
      .slice(0, 5),
    gaOther: clampStr(fd.anestheticPlan?.gaOther, 200),
    raSelected: Boolean(fd.anestheticPlan?.raSelected),
    raMethods: (Array.isArray(fd.anestheticPlan?.raMethods) ? fd.anestheticPlan.raMethods : [])
      .filter((m): m is RaMethod => raAllow.includes(m))
      .slice(0, 4),
    raOther: clampStr(fd.anestheticPlan?.raOther, 200),
    macSelected: Boolean(fd.anestheticPlan?.macSelected),
    macDetail: clampStr(fd.anestheticPlan?.macDetail ?? '', 200),
  };

  const sanitizedId = /^[a-zA-Z0-9_-]+$/.test(evalRecord.id)
    ? evalRecord.id.slice(0, FIELD_LIMITS.id)
    : generateEvaluationId();

  const rawPostOpComp = fd.postOpComplication ?? createEmptyPostOpComplication();
  const sanitizedPeriOpComps = Array.from(
    new Set(
      (Array.isArray(rawPostOpComp.periOpComplications) ? rawPostOpComp.periOpComplications : []).filter(
        (k): k is PostOpComplicationKey => POST_OP_COMPLICATION_KEY_LIST.includes(k),
      ),
    ),
  ).slice(0, POST_OP_COMPLICATION_KEY_LIST.length);
  const sanitizedPostOpComps = Array.from(
    new Set(
      (Array.isArray(rawPostOpComp.postOpComplications) ? rawPostOpComp.postOpComplications : []).filter(
        (k): k is PostOpComplicationKey => POST_OP_COMPLICATION_KEY_LIST.includes(k),
      ),
    ),
  ).slice(0, POST_OP_COMPLICATION_KEY_LIST.length);
  const sanitizedNoneFlags = getEffectiveNoneProblemFlags({
    ...rawPostOpComp,
    periOpComplications: sanitizedPeriOpComps,
    postOpComplications: sanitizedPostOpComps,
  });
  const unifiedPostOpVisitor = clampStr(
    (fd.postAnesthesia?.visitBy?.trim() ? fd.postAnesthesia.visitBy : '') ||
      (rawPostOpComp.postOpRecorder ?? ''),
    120,
  );
  const unifiedPostOpVisitDate = clampStr(
    (fd.postAnesthesia?.visitDate?.trim() ? fd.postAnesthesia.visitDate : '') ||
      (rawPostOpComp.postOpDate ?? ''),
    32,
  );
  const sanitizedPostOpComplication: PostOpComplicationData = {
    periOpComplications: sanitizedPeriOpComps,
    postOpComplications: sanitizedPostOpComps,
    difficultIntubationGrade: clampStr(rawPostOpComp.difficultIntubationGrade ?? '', 30),
    painScoreDetail: clampStr(rawPostOpComp.painScoreDetail ?? '', 30),
    otherComplicationDetail: clampStr(rawPostOpComp.otherComplicationDetail ?? '', 200),
    noneProblem: sanitizedNoneFlags.any,
    noneProblemPeriOp: sanitizedNoneFlags.periOp,
    noneProblemPostOp: sanitizedNoneFlags.postOp,
    outcomes: Array.from(
      new Set(
        (Array.isArray(rawPostOpComp.outcomes) ? rawPostOpComp.outcomes : []).filter(
          (k): k is PostOpOutcomeKey => POST_OP_OUTCOME_KEY_LIST.includes(k),
        ),
      ),
    ).slice(0, 8),
    incidentTypes: Array.from(
      new Set(
        (Array.isArray(rawPostOpComp.incidentTypes) ? rawPostOpComp.incidentTypes : []).filter(
          (k): k is PostOpIncidentType => k === 'clinical_risk' || k === 'non_clinical_risk',
        ),
      ),
    ).slice(0, 2),
    severityLevel: POST_OP_SEVERITY_LEVELS.includes(
      rawPostOpComp.severityLevel as (typeof POST_OP_SEVERITY_LEVELS)[number],
    )
      ? rawPostOpComp.severityLevel
      : '',
    administrationErrors: Array.from(
      new Set(
        (Array.isArray(rawPostOpComp.administrationErrors) ? rawPostOpComp.administrationErrors : []).filter(
          (k): k is AdministrationErrorKey => POST_OP_ADMIN_ERROR_KEY_LIST.includes(k),
        ),
      ),
    ).slice(0, 6),
    remark: clampStr(rawPostOpComp.remark ?? '', 1000),
    periOpRecorder: clampStr(rawPostOpComp.periOpRecorder ?? '', 120),
    periOpDate: clampStr(rawPostOpComp.periOpDate ?? '', 32),
    periOpTime: clampStr(rawPostOpComp.periOpTime ?? '', 32),
    postOpRecorder: unifiedPostOpVisitor,
    postOpDate: unifiedPostOpVisitDate,
    postOpTime: clampStr(rawPostOpComp.postOpTime ?? '', 32),
  };

  const expectedDiff = fd.physicalExam.expectedDifficultAirway === 'yes';
  const hasComp =
    fd.postAnesthesia.complicationStatus === 'yes' ||
    sanitizedPeriOpComps.length > 0 ||
    sanitizedPostOpComps.length > 0;
  const computedStatus: EvaluationStatus = getEffectiveEvaluationStatus({
    ...evalRecord,
    formData: {
      ...fd,
      anestheticPlan: sanitizedPlan,
    },
  });

  const sanitizeTri = (v: unknown): TriStatus => (v === 'no' || v === 'yes' ? v : 'none');
  const sanitizeNormalLimited = (v: unknown): NormalLimited =>
    v === 'normal' || v === 'limited' ? v : '';
  const sanitizeTmd = (v: unknown): ThyromentalDist => (v === '<6' || v === '>=6' ? v : '');
  const sanitizeMallampati = (v: unknown): MallampatiClass =>
    v === 'I' || v === 'II' || v === 'III' || v === 'IV' ? v : '';
  const sanitizeNormalAbnormal = (v: unknown): NormalAbnormal =>
    v === 'normal' || v === 'abnormal' ? v : '';
  const sanitizeAsa = (v: unknown): AsaClass =>
    v === 'I' || v === 'II' || v === 'III' || v === 'IV' || v === 'V' || v === 'VI' ? v : '';

  return {
    id: sanitizedId,
    ownerId: clampStr(ownerId, FIELD_LIMITS.ownerId),
    status: computedStatus,
    patientName: clampStr((evalRecord.patientName ?? '').trim(), FIELD_LIMITS.patientName),
    hn: clampStr((evalRecord.hn ?? '').trim(), FIELD_LIMITS.hn),
    an: clampStr((evalRecord.an ?? '').trim(), FIELD_LIMITS.an),
    age: clampStr((evalRecord.age ?? '').trim(), FIELD_LIMITS.age),
    gender: inferPatientGender(evalRecord.patientName ?? '', evalRecord.gender),
    ward: clampStr((evalRecord.ward ?? '').trim(), FIELD_LIMITS.ward),
    bed: clampStr((evalRecord.bed ?? '').trim(), FIELD_LIMITS.bed),
    specialty: clampStr((evalRecord.specialty ?? '').trim(), FIELD_LIMITS.specialty),
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
    asaClass: sanitizeAsa(evalRecord.asaClass),
    asaEmergency: Boolean(evalRecord.asaEmergency),
    expectedDifficultAirway: expectedDiff,
    hasComplication: hasComp,
    anesthesiaType: deriveAnesthesiaType(sanitizedPlan),
    formData: {
      history: {
        presentIllness: clampStr(fd.history.presentIllness, 1000),
        pastIllness: clampStr(fd.history.pastIllness, 1000),
        allergyStatus: sanitizeTri(fd.history.allergyStatus),
        allergyDetail: clampStr(fd.history.allergyDetail, 300),
        underlyingStatus: sanitizeTri(fd.history.underlyingStatus),
        underlyingControl:
          fd.history.underlyingControl === 'good' || fd.history.underlyingControl === 'poor'
            ? fd.history.underlyingControl
            : '',
        dm: Boolean(fd.history.dm),
        dmYears: clampStr(fd.history.dmYears, 20),
        dmControl:
          fd.history.dmControl === 'good' || fd.history.dmControl === 'poor'
            ? fd.history.dmControl
            : '',
        dmDetail: clampStr(fd.history.dmDetail ?? '', 200),
        ht: Boolean(fd.history.ht),
        htYears: clampStr(fd.history.htYears, 20),
        htControl:
          fd.history.htControl === 'good' || fd.history.htControl === 'poor'
            ? fd.history.htControl
            : '',
        htDetail: clampStr(fd.history.htDetail ?? '', 200),
        dlp: Boolean(fd.history.dlp),
        dlpYears: clampStr(fd.history.dlpYears, 20),
        dlpControl:
          fd.history.dlpControl === 'good' || fd.history.dlpControl === 'poor'
            ? fd.history.dlpControl
            : '',
        dlpDetail: clampStr(fd.history.dlpDetail ?? '', 200),
        ckd: Boolean(fd.history.ckd),
        ckdYears: clampStr(fd.history.ckdYears, 20),
        ckdControl:
          fd.history.ckdControl === 'good' || fd.history.ckdControl === 'poor'
            ? fd.history.ckdControl
            : '',
        ckdDetail: clampStr(fd.history.ckdDetail ?? '', 200),
        heartDisease: Boolean(fd.history.heartDisease),
        heartDiseaseYears: clampStr(fd.history.heartDiseaseYears, 20),
        heartDiseaseControl:
          fd.history.heartDiseaseControl === 'good' || fd.history.heartDiseaseControl === 'poor'
            ? fd.history.heartDiseaseControl
            : '',
        heartDiseaseDetail: clampStr(fd.history.heartDiseaseDetail ?? '', 200),
        otherUnderlying: clampStrArray(fd.history.otherUnderlying, 8, 120),
        underlyingDetail: clampStr(fd.history.underlyingDetail ?? '', 500),
        medication: clampStr(formatMedicationMultiline(fd.history.medication), 1000),
        previousOps: clampStrArray(fd.history.previousOps, 8, 250),
        previousOpComplication: clampStr(fd.history.previousOpComplication, 500),
        drinkingStatus: sanitizeTri(fd.history.drinkingStatus),
        drinkingAmount: clampStr(fd.history.drinkingAmount ?? '', 120),
        drinkingDaysPerWeek: clampStr(fd.history.drinkingDaysPerWeek, 20),
        drinkingYears: clampStr(fd.history.drinkingYears, 20),
        drinkingDurationUnit: fd.history.drinkingDurationUnit === 'months' ? 'months' : 'years',
        drinkingQuit: Boolean(fd.history.drinkingQuit),
        drinkingQuitDuration: clampStr(fd.history.drinkingQuitDuration, 20),
        drinkingQuitUnit: fd.history.drinkingQuitUnit === 'months' ? 'months' : 'years',
        smokingStatus: sanitizeTri(fd.history.smokingStatus),
        smokingCigsPerDay: clampStr(fd.history.smokingCigsPerDay, 20),
        smokingYears: clampStr(fd.history.smokingYears, 20),
        smokingDurationUnit: fd.history.smokingDurationUnit === 'months' ? 'months' : 'years',
        smokingQuit: Boolean(fd.history.smokingQuit),
        smokingQuitDuration: clampStr(fd.history.smokingQuitDuration, 20),
        smokingQuitUnit: fd.history.smokingQuitUnit === 'months' ? 'months' : 'years',
        drugAddictionStatus: sanitizeTri(fd.history.drugAddictionStatus),
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
        gcsE: clampStr(fd.physicalExam.gcsE ?? '', 10),
        gcsV: clampStr(fd.physicalExam.gcsV ?? '', 10),
        gcsM: clampStr(fd.physicalExam.gcsM ?? '', 10),
        selfCareStatus:
          fd.physicalExam.selfCareStatus === 'independent' ||
          fd.physicalExam.selfCareStatus === 'dependent'
            ? fd.physicalExam.selfCareStatus
            : '',
        dyspneaStatus:
          fd.physicalExam.dyspneaStatus === 'no' || fd.physicalExam.dyspneaStatus === 'yes'
            ? fd.physicalExam.dyspneaStatus
            : '',
        currentStatusDetail: clampStr(fd.physicalExam.currentStatusDetail ?? '', 200),
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
        toothStatus: (Array.isArray(fd.physicalExam?.toothStatus) ? fd.physicalExam.toothStatus : [])
          .filter((t): t is ToothCondition => toothAllow.includes(t))
          .slice(0, 4),
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
        mouthOpening: sanitizeNormalLimited(fd.physicalExam.mouthOpening),
        mouthOpeningDetail: clampStr(fd.physicalExam.mouthOpeningDetail ?? '', 200),
        neckMovement: sanitizeNormalLimited(fd.physicalExam.neckMovement),
        neckMovementDetail: clampStr(fd.physicalExam.neckMovementDetail ?? '', 200),
        thyromentalDistance: sanitizeTmd(fd.physicalExam.thyromentalDistance),
        thyromentalDistanceDetail: clampStr(fd.physicalExam.thyromentalDistanceDetail ?? '', 200),
        mallampatiClass: sanitizeMallampati(fd.physicalExam.mallampatiClass),
        expectedDifficultAirway: sanitizeTri(fd.physicalExam.expectedDifficultAirway),
        breathSound: sanitizeNormalAbnormal(fd.physicalExam.breathSound),
        breathSoundDetail: clampStr(fd.physicalExam.breathSoundDetail, 300),
        heartSound: sanitizeNormalAbnormal(fd.physicalExam.heartSound),
        heartSoundDetail: clampStr(fd.physicalExam.heartSoundDetail, 300),
        functionalCapacityLevel:
          fd.physicalExam.functionalCapacityLevel === '>4' ||
          fd.physicalExam.functionalCapacityLevel === '<4'
            ? fd.physicalExam.functionalCapacityLevel
            : '',
        functionalCapacity: clampStr(fd.physicalExam.functionalCapacity, 200),
      },
      investigation: {
        cxrStatus: sanitizeNormalAbnormal(fd.investigation.cxrStatus),
        cxrDetail: clampStr(fd.investigation.cxrDetail, 400),
        ekgStatus: sanitizeNormalAbnormal(fd.investigation.ekgStatus),
        ekgDetail: clampStr(fd.investigation.ekgDetail, 400),
        other: clampStr(fd.investigation.other, 600),
      },
      laboratory: {
        labDate: clampStr(fd.laboratory.labDate ?? '', FIELD_LIMITS.date),
        cbcDate: clampStr(fd.laboratory.cbcDate ?? '', FIELD_LIMITS.date),
        chemDate: clampStr(fd.laboratory.chemDate ?? '', FIELD_LIMITS.date),
        hb: clampStr(fd.laboratory.hb, 20),
        hct: clampStr(fd.laboratory.hct, 20),
        wbc: clampStr(formatThousandsWithCommas(fd.laboratory.wbc), 20),
        plt: clampStr(formatThousandsWithCommas(fd.laboratory.plt), 20),
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
        antiHiv:
          fd.laboratory.antiHiv === 'negative' || fd.laboratory.antiHiv === 'positive'
            ? fd.laboratory.antiHiv
            : '',
        hbsAg:
          fd.laboratory.hbsAg === 'negative' || fd.laboratory.hbsAg === 'positive'
            ? fd.laboratory.hbsAg
            : '',
        lactate: clampStr(fd.laboratory.lactate ?? '', 20),
        tropI: clampStr(fd.laboratory.tropI ?? '', 20),
        ft3: clampStr(fd.laboratory.ft3 ?? '', 20),
        ft4: clampStr(fd.laboratory.ft4 ?? '', 20),
        tsh: clampStr(fd.laboratory.tsh ?? '', 20),
        bgType:
          fd.laboratory.bgType === 'ABG' || fd.laboratory.bgType === 'VBG'
            ? fd.laboratory.bgType
            : '',
        bgPh: clampStr(fd.laboratory.bgPh ?? '', 20),
        bgPco2: clampStr(fd.laboratory.bgPco2 ?? '', 20),
        bgPo2: clampStr(fd.laboratory.bgPo2 ?? '', 20),
        bgHco3: clampStr(fd.laboratory.bgHco3 ?? '', 20),
        bgBe: clampStr(fd.laboratory.bgBe ?? '', 20),
        bgSao2: clampStr(fd.laboratory.bgSao2 ?? '', 20),
        bgFio2: clampStr(fd.laboratory.bgFio2 ?? '', 20),
        other: clampStr(fd.laboratory.other, 400),
        customLabs: Array.isArray(fd.laboratory.customLabs)
          ? fd.laboratory.customLabs
              .slice(0, 15)
              .map((item) => ({
                name: clampStr(item?.name ?? '', 60),
                value: clampStr(item?.value ?? '', 80),
              }))
              .filter((item) => item.name.length > 0 || item.value.length > 0)
          : [],
        bloodGroup:
          fd.laboratory.bloodGroup === 'A' ||
          fd.laboratory.bloodGroup === 'B' ||
          fd.laboratory.bloodGroup === 'AB' ||
          fd.laboratory.bloodGroup === 'O'
            ? fd.laboratory.bloodGroup
            : '',
        bloodRh:
          fd.laboratory.bloodRh === 'positive' || fd.laboratory.bloodRh === 'negative'
            ? fd.laboratory.bloodRh
            : '',
        prepTs: Boolean(fd.laboratory.prepTs),
        prepPrc: clampStr(fd.laboratory.prepPrc, 20),
        prepFfp: clampStr(fd.laboratory.prepFfp, 20),
        prepPlt: clampStr(fd.laboratory.prepPlt, 20),
        prepCryo: clampStr(fd.laboratory.prepCryo ?? '', 20),
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
        lastMealTime: clampStr(fd.premedication.lastMealTime ?? '', 32),
        lastWaterTime: clampStr(fd.premedication.lastWaterTime ?? '', 32),
        onIvf: clampStr(fd.premedication.onIvf, 250),
      },
      consult: clampStr(fd.consult, 1500),
      consultTypes: (() => {
        const allow: ConsultType[] = ['none', 'med', 'cardio', 'neuro', 'chest', 'nephro', 'other'];
        const raw = Array.isArray(fd.consultTypes) ? fd.consultTypes : [];
        return Array.from(new Set(raw.filter((t): t is ConsultType => allow.includes(t)))).slice(0, 7);
      })(),
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
        complicationStatus: sanitizeTri(fd.postAnesthesia.complicationStatus),
        complicationDetail: clampStr(fd.postAnesthesia.complicationDetail, 500),
        visitBy: unifiedPostOpVisitor,
        visitDate: unifiedPostOpVisitDate,
      },
      postOpComplication: sanitizedPostOpComplication,
      surgeryPostponement: (() => {
        const rawSp = fd.surgeryPostponement ?? createEmptySurgeryPostponement();
        const isPostponed = Boolean(rawSp.isPostponed);
        return {
          isPostponed,
          originalDateOfOperation: clampStr(rawSp.originalDateOfOperation ?? '', FIELD_LIMITS.date),
          postponedToDate: clampStr(rawSp.postponedToDate ?? '', FIELD_LIMITS.date),
          reasons: Array.from(
            new Set(
              (Array.isArray(rawSp.reasons) ? rawSp.reasons : []).filter(
                (k): k is SurgeryPostponementReasonKey =>
                  SURGERY_POSTPONEMENT_REASON_KEYS.includes(k),
              ),
            ),
          ).slice(0, SURGERY_POSTPONEMENT_REASON_KEYS.length),
          otherReasonDetail: clampStr(rawSp.otherReasonDetail ?? '', 300),
          note: clampStr(rawSp.note ?? '', 500),
        };
      })(),
      preOpNotVisited: (() => {
        const rawNv = fd.preOpNotVisited ?? createEmptyPreOpNotVisited();
        const isNotVisited = Boolean(rawNv.isNotVisited);
        return {
          isNotVisited,
          reasons: Array.from(
            new Set(
              (Array.isArray(rawNv.reasons) ? rawNv.reasons : []).filter(
                (k): k is PreOpNotVisitedReasonKey =>
                  PRE_OP_NOT_VISITED_REASON_KEYS.includes(k),
              ),
            ),
          ).slice(0, PRE_OP_NOT_VISITED_REASON_KEYS.length),
          otherReasonDetail: clampStr(rawNv.otherReasonDetail ?? '', 300),
          note: clampStr(rawNv.note ?? '', 500),
        };
      })(),
    },
  };
}

export interface PostOpVisitCompleteness {
  isComplete: boolean;
  hasAnyInput: boolean;
  filledCount: number;
  totalRequired: number;
  missingFields: string[];
}

export function getPostOpVisitCompleteness(
  pa?: Partial<PostAnesthesiaData> | null,
  pc?: Partial<PostOpComplicationData> | null,
): PostOpVisitCompleteness {
  const safe = pa ?? {};
  const missingFields: string[] = [];

  const hasBp = Boolean(safe.bp?.trim());
  const hasPulse = Boolean(safe.pulse?.trim());
  const hasRr = Boolean(safe.rr?.trim());
  const hasTemp = Boolean(safe.temp?.trim());
  const hasSpo2 = Boolean(safe.spo2?.trim());
  const hasPainScore = Boolean(safe.painScore?.trim());
  const compStatus = safe.complicationStatus ?? 'none';
  const hasCompStatus = compStatus === 'no' || compStatus === 'yes';
  const hasTableComp = Boolean(
    (pc?.periOpComplications?.length ?? 0) > 0 ||
      (pc?.postOpComplications?.length ?? 0) > 0,
  );
  const noneFlags = getEffectiveNoneProblemFlags(pc);
  const hasTableDecision = hasTableComp || noneFlags.any;
  const hasComplicationRecorded = hasCompStatus || hasTableDecision;
  const needsCompDetail = compStatus === 'yes' && !hasTableComp;
  const hasCompDetail = !needsCompDetail || Boolean(safe.complicationDetail?.trim());
  const hasVisitBy = Boolean(safe.visitBy?.trim() || pc?.postOpRecorder?.trim());
  const hasVisitDate = Boolean(safe.visitDate?.trim() || pc?.postOpDate?.trim());

  if (!hasComplicationRecorded) {
    missingFields.push('Complication (No/Yes หรือติ๊กในตารางด้านบน)');
  } else if (!hasCompDetail) {
    missingFields.push('รายละเอียดภาวะแทรกซ้อน');
  }
  if (!hasVisitBy) missingFields.push('ผู้เยี่ยม (visit by)');

  const totalRequired = needsCompDetail ? 3 : 2;
  const filledCount = totalRequired - missingFields.length;
  const hasAnyInput =
    hasBp ||
    hasPulse ||
    hasRr ||
    hasTemp ||
    hasSpo2 ||
    hasPainScore ||
    hasComplicationRecorded ||
    Boolean(safe.complicationDetail?.trim()) ||
    hasVisitBy ||
    hasVisitDate;

  return {
    isComplete: missingFields.length === 0,
    hasAnyInput,
    filledCount,
    totalRequired,
    missingFields,
  };
}

export function getEffectiveEvaluationStatus(record: PreAnestheticEvaluation): EvaluationStatus {
  if (record.status === 'locked') return 'locked';
  if (
    getPostOpVisitCompleteness(
      record.formData?.postAnesthesia,
      record.formData?.postOpComplication,
    ).isComplete
  ) {
    return 'post_op_completed';
  }
  if (record.formData?.preOpNotVisited?.isNotVisited) {
    return 'draft';
  }
  const plan = record.formData?.anestheticPlan;
  if (record.asaClass || plan?.gaSelected || plan?.raSelected || plan?.macSelected) {
    return 'evaluated';
  }
  return 'draft';
}

export function formatUnderlyingDiseaseTag(
  name: string,
  years?: string,
  detail?: string,
  unit = 'ปี',
  control?: UnderlyingControlStatus,
): string {
  const y = (years ?? '').trim();
  const d = (detail ?? '').trim();
  const parts: string[] = [];
  if (y) parts.push(`${y} ${unit}`);
  if (control === 'good') parts.push('Good control');
  else if (control === 'poor') parts.push('Poor control');
  if (d) parts.push(d);
  return parts.length > 0 ? `${name} (${parts.join(' · ')})` : name;
}

export function formatDurationLabel(value: string, unit: DurationUnit = 'years'): string {
  const v = value.trim();
  const unitLabel = unit === 'months' ? 'เดือน' : 'ปี';
  return `${v || '___'} ${unitLabel}`;
}

export function formatDrinkingDetail(h: HistoryData): string {
  const amount = h.drinkingAmount?.trim();
  const base = `ปริมาณ ${amount || '______'} · ${h.drinkingDaysPerWeek?.trim() || '___'} วัน/wk จำนวน ${formatDurationLabel(h.drinkingYears, h.drinkingDurationUnit)}`;
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

export function formatGcsTotal(e?: string, v?: string, m?: string): string {
  const eTrim = (e || '').trim();
  const vTrim = (v || '').trim();
  const mTrim = (m || '').trim();
  if (!eTrim && !vTrim && !mTrim) return '';
  const eNum = parseInt(eTrim, 10);
  const mNum = parseInt(mTrim, 10);
  const vUpper = vTrim.toUpperCase();
  const vIsTube = vUpper === 'T' || vUpper === 'VT';
  const vNum = parseInt(vTrim, 10);
  if (Number.isFinite(eNum) && Number.isFinite(mNum)) {
    if (vIsTube) return `${eNum + mNum}T`;
    if (Number.isFinite(vNum)) return `${eNum + vNum + mNum}`;
  }
  return '';
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

export function formatBloodGroup(
  bloodGroup?: BloodGroup,
  bloodRh?: BloodRh,
): string {
  const grp = bloodGroup || '';
  const rh = bloodRh === 'positive' ? 'Rh+' : bloodRh === 'negative' ? 'Rh-' : '';
  if (grp && rh) return `${grp} (${rh})`;
  return grp || rh;
}

export function formatBloodPrepSummary(lab: LaboratoryData): string {
  const parts: string[] = [];
  const bg = formatBloodGroup(lab.bloodGroup, lab.bloodRh);
  if (bg) parts.push(`Gr. ${bg}`);
  if (lab.prepTs) parts.push('T&S');
  if (lab.prepPrc.trim()) parts.push(`PRC ${lab.prepPrc.trim()}u`);
  if (lab.prepFfp.trim()) parts.push(`FFP ${lab.prepFfp.trim()}u`);
  if (lab.prepPlt.trim()) parts.push(`Plt ${lab.prepPlt.trim()}u`);
  if ((lab.prepCryo ?? '').trim()) parts.push(`Cryo ${(lab.prepCryo ?? '').trim()}u`);

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

export function computeBloodGasPfRatio(lab: Partial<LaboratoryData>): number | null {
  if (lab.bgType === 'VBG') return null;
  const po2Raw = (lab.bgPo2 ?? '').trim();
  const fio2Raw = (lab.bgFio2 ?? '').trim();
  if (!po2Raw || !fio2Raw) return null;
  const po2Match = po2Raw.match(/-?\d+(?:\.\d+)?/);
  const fio2Match = fio2Raw.match(/\d+(?:\.\d+)?/);
  if (!po2Match || !fio2Match) return null;
  const po2 = Number(po2Match[0]);
  const fio2Num = Number(fio2Match[0]);
  if (!Number.isFinite(po2) || !Number.isFinite(fio2Num) || po2 <= 0 || fio2Num <= 0) return null;
  const fio2Frac = fio2Num > 1 ? fio2Num / 100 : fio2Num;
  if (fio2Frac < 0.2 || fio2Frac > 1.0) return null;
  return Math.round(po2 / fio2Frac);
}

export function hasBloodGasValues(lab: Partial<LaboratoryData>): boolean {
  return Boolean(
    (lab.bgPh ?? '').trim() ||
      (lab.bgPco2 ?? '').trim() ||
      (lab.bgPo2 ?? '').trim() ||
      (lab.bgHco3 ?? '').trim() ||
      (lab.bgBe ?? '').trim() ||
      (lab.bgSao2 ?? '').trim() ||
      (lab.bgFio2 ?? '').trim(),
  );
}

export function formatBloodGasSummary(lab: Partial<LaboratoryData>): string {
  if (!hasBloodGasValues(lab)) return '';
  const isVbg = lab.bgType === 'VBG';
  const isAbg = lab.bgType === 'ABG';
  const prefix = isVbg ? 'VBG' : isAbg ? 'ABG' : 'Blood Gas';
  const pco2Label = isVbg ? 'PvCO2' : isAbg ? 'PaCO2' : 'pCO2';
  const po2Label = isVbg ? 'PvO2' : isAbg ? 'PaO2' : 'pO2';
  const satLabel = isVbg ? 'SvO2' : isAbg ? 'SaO2' : 'O2Sat';

  const parts: string[] = [];
  if ((lab.bgPh ?? '').trim()) parts.push(`pH ${(lab.bgPh ?? '').trim()}`);
  if ((lab.bgPco2 ?? '').trim()) parts.push(`${pco2Label} ${(lab.bgPco2 ?? '').trim()}`);
  if ((lab.bgPo2 ?? '').trim()) parts.push(`${po2Label} ${(lab.bgPo2 ?? '').trim()}`);
  if ((lab.bgHco3 ?? '').trim()) parts.push(`HCO3 ${(lab.bgHco3 ?? '').trim()}`);
  if ((lab.bgBe ?? '').trim()) parts.push(`BE ${(lab.bgBe ?? '').trim()}`);
  if ((lab.bgSao2 ?? '').trim()) parts.push(`${satLabel} ${(lab.bgSao2 ?? '').trim()}%`);
  if ((lab.bgFio2 ?? '').trim()) parts.push(`FiO2 ${(lab.bgFio2 ?? '').trim()}`);
  const pfRatio = computeBloodGasPfRatio(lab);
  if (pfRatio !== null) parts.push(`P/F ${pfRatio}`);

  return `${prefix}: ${parts.join(' · ')}`;
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
  const hb = parseNumericValue(laboratory.hb);
  const hct = parseNumericValue(laboratory.hct);
  const plt = parseNumericValue(laboratory.plt);
  const k = parseNumericValue(laboratory.k);
  const na = parseNumericValue(laboratory.na);
  const cr = parseNumericValue(laboratory.cr);
  const inr = parseNumericValue(laboratory.inr);
  const glucose = parseNumericValue(laboratory.glucose);

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
  if (history.dm) {
    underlyingTags.push(
      formatUnderlyingDiseaseTag('DM', history.dmYears, history.dmDetail, 'yr', history.dmControl),
    );
  }
  if (history.ht) {
    underlyingTags.push(
      formatUnderlyingDiseaseTag('HT', history.htYears, history.htDetail, 'yr', history.htControl),
    );
  }
  if (history.dlp) {
    underlyingTags.push(
      formatUnderlyingDiseaseTag('DLP', history.dlpYears, history.dlpDetail, 'yr', history.dlpControl),
    );
  }
  if (history.ckd) {
    underlyingTags.push(
      formatUnderlyingDiseaseTag('โรคไต', history.ckdYears, history.ckdDetail, 'yr', history.ckdControl),
    );
  }
  if (history.heartDisease) {
    underlyingTags.push(
      formatUnderlyingDiseaseTag(
        'โรคหัวใจ',
        history.heartDiseaseYears,
        history.heartDiseaseDetail,
        'yr',
        history.heartDiseaseControl,
      ),
    );
  }
  history.otherUnderlying.filter((x) => x.trim()).forEach((x) => underlyingTags.push(x.trim()));
  if (history.underlyingControl === 'good' || history.underlyingControl === 'poor') {
    const hasPerDiseaseCtrl = Boolean(
      history.dmControl ||
        history.htControl ||
        history.dlpControl ||
        history.ckdControl ||
        history.heartDiseaseControl,
    );
    if (!hasPerDiseaseCtrl) {
      underlyingTags.push(
        history.underlyingControl === 'poor' ? 'Poor control' : 'Good control',
      );
    }
  }
  if (history.underlyingDetail?.trim()) {
    underlyingTags.push(history.underlyingDetail.trim());
  }

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
    Boolean(premedication.npoTime.trim()) ||
      Boolean((premedication.lastMealTime ?? '').trim()) ||
      Boolean((premedication.lastWaterTime ?? '').trim()),
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

export type AutoProblemCategory =
  | 'vital'
  | 'respiratory'
  | 'airway'
  | 'lab'
  | 'renal'
  | 'clinical'
  | 'risk'
  | 'bmi'
  | 'underlying';
export type ProblemSeverityLevel = 'critical' | 'high' | 'moderate' | 'mild';

export interface AutoProblemEntry {
  key: string;
  category: AutoProblemCategory;
  categoryLabel: string;
  legacyPrefixes: string[];
  text: string;
  severityScore: number;
  severityLevel: ProblemSeverityLevel;
}

const ANTITHROMBOTIC_DRUG_PATTERNS: readonly {
  label: string;
  drugClass: 'anticoagulant' | 'antiplatelet';
  re: RegExp;
  highRisk: boolean;
}[] = [
  // Anticoagulants
  { label: 'Warfarin', drugClass: 'anticoagulant', re: /\b(?:warfarin|coumadin|orfarin)\b/i, highRisk: true },
  { label: 'Apixaban', drugClass: 'anticoagulant', re: /\b(?:apixaban|eliquis)\b/i, highRisk: true },
  { label: 'Rivaroxaban', drugClass: 'anticoagulant', re: /\b(?:rivaroxaban|xarelto)\b/i, highRisk: true },
  { label: 'Dabigatran', drugClass: 'anticoagulant', re: /\b(?:dabigatran|pradaxa)\b/i, highRisk: true },
  { label: 'Edoxaban', drugClass: 'anticoagulant', re: /\b(?:edoxaban|lixiana)\b/i, highRisk: true },
  { label: 'Heparin', drugClass: 'anticoagulant', re: /\b(?:heparin|ufh)\b/i, highRisk: true },
  { label: 'Enoxaparin', drugClass: 'anticoagulant', re: /\b(?:enoxaparin|clexane|lmwh)\b/i, highRisk: true },
  { label: 'Fondaparinux', drugClass: 'anticoagulant', re: /\b(?:fondaparinux|arixtra)\b/i, highRisk: true },
  // Antiplatelets
  { label: 'ASA', drugClass: 'antiplatelet', re: /\b(?:asa|aspirin|aspent)\b/i, highRisk: false },
  { label: 'Clopidogrel', drugClass: 'antiplatelet', re: /\b(?:clopidogrel|plavix|apolets)\b/i, highRisk: true },
  { label: 'Ticagrelor', drugClass: 'antiplatelet', re: /\b(?:ticagrelor|brilinta)\b/i, highRisk: true },
  { label: 'Prasugrel', drugClass: 'antiplatelet', re: /\b(?:prasugrel|effient)\b/i, highRisk: true },
  { label: 'Cilostazol', drugClass: 'antiplatelet', re: /\b(?:cilostazol|pletaal)\b/i, highRisk: true },
  { label: 'Ticlopidine', drugClass: 'antiplatelet', re: /\b(?:ticlopidine|ticlid)\b/i, highRisk: true },
];

const VASOPRESSOR_DRUG_PATTERNS: readonly {
  label: string;
  re: RegExp;
}[] = [
  { label: 'Norepinephrine/Levophed', re: /\b(?:levophed|norepinephrine|noradrenaline)\b/i },
  { label: 'Adrenaline/Epinephrine', re: /\b(?:adrenaline|epinephrine)\b/i },
  { label: 'Dopamine', re: /\bdopamine\b/i },
  { label: 'Dobutamine', re: /\bdobutamine\b/i },
  { label: 'Vasopressin', re: /\bvasopressin\b/i },
];

export function formatThousandsWithCommas(raw: string | undefined): string {
  if (!raw) return '';
  const stripped = raw.replace(/,/g, '');
  const match = stripped.match(/^(\s*)(\d+)(\.\d*)?(\s*)$/);
  if (!match) return raw;
  const [, lead, intPart, decPart = '', trail] = match;
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${lead}${formattedInt}${decPart}${trail}`;
}

function parseNumericValue(raw: string | undefined): number {
  if (!raw) return Number.NaN;
  const cleaned = raw.replace(/,/g, '').trim();
  if (!cleaned) return Number.NaN;
  return parseFloat(cleaned);
}

function parseBloodPressure(raw: string | undefined): { sbp: number; dbp: number; map: number } | null {
  if (!raw) return null;
  const match = raw.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (!match) return null;
  const sbp = parseInt(match[1], 10);
  const dbp = parseInt(match[2], 10);
  if (!Number.isFinite(sbp) || !Number.isFinite(dbp)) return null;
  if (sbp < 40 || sbp > 320 || dbp < 15 || dbp > 220 || sbp <= dbp) return null;
  return { sbp, dbp, map: Math.round((sbp + 2 * dbp) / 3) };
}

function isMeaningfulClinicalNote(raw: string | undefined): boolean {
  const trimmed = (raw || '').trim();
  if (!trimmed) return false;
  return !/^(?:-|—|no|none|nil|wnl|normal|unremarkable|negative|neg|ไม่มี|ปกติ|ไม่พบ)$/i.test(trimmed);
}

const CLAUSE_NEGATION_PRE_EN_RE =
  /(?:^|[\s(,;:/\-])(?:no(?!\.?\s*\d)(?!\s+(?:change|improvement|progression|interval\s+change)\b)|not|without|w\/o|none|nil|absent|absence\s+of|negative(?:\s+(?:for|of))?|neg(?:\s+(?:for|of))?|denies|denied|deny|free\s+of|ruled\s+out|excluded|unlikely|resolved|unremarkable\s+for)\b/i;

const CLAUSE_NEGATION_PRE_TH_RE =
  /(?:ไม่มี|ไม่พบ|ไม่เห็น|ไม่น่ามี|ปฏิเสธ|ไม่เป็น|ไม่เคยเป็น|ไม่เคยมี|ไม่เคย|ปราศจาก|ปลอดจาก|ไม่เข้าข่าย|ไม่สงสัย)/;

const IMMEDIATE_NON_PREFIX_RE = /(?:^|[\s(,;:/\-])non[\s-]?$/i;

const CLAUSE_CONTRAST_PIVOT_RE = /\b(?:but|however|except|although|yet)\b|แต่|ยกเว้น/gi;

const CLAUSE_NEGATION_POST_RE =
  /^\s*(?:[:=-]|\bis\b|\bwas\b|\bare\b|\bwere\b)?\s*(?:\(\s*-\s*\)|-ve\b|non-?reactive\b|neg(?:ative)?\b|none\b|nil\b|absent\b|normal\b|wnl\b|unremarkable\b|ruled\s+out\b|excluded\b|resolved\b|ไม่พบ|ไม่มี|ปกติ)(?:\b|$)/i;

const ABBREV_DOT_RE = /\b(?:no|dr|st|gr|mr|ms|vs|wt|ht|pt|lt|rt|approx|est|vol|fig|dept)$/i;

function findClauseStart(text: string, idx: number): number {
  const minIdx = Math.max(0, idx - 180);
  for (let i = idx - 1; i >= minIdx; i -= 1) {
    const ch = text[i];
    if (ch === '\n' || ch === '|' || ch === ';' || ch === '!' || ch === '?') {
      return i + 1;
    }
    if (ch === '.') {
      const nextCh = text[i + 1] ?? '';
      const prevCh = text[i - 1] ?? '';
      const isDecimal = /\d/.test(prevCh) && /\d/.test(nextCh);
      const beforeDot = text.slice(Math.max(0, i - 10), i);
      const isAbbrev = ABBREV_DOT_RE.test(beforeDot);
      if (!isDecimal && !isAbbrev && (nextCh === '' || /\s/.test(nextCh))) {
        return i + 1;
      }
    }
  }
  return minIdx;
}

function findClauseEnd(text: string, idx: number): number {
  const maxIdx = Math.min(text.length, idx + 48);
  for (let i = idx; i < maxIdx; i += 1) {
    const ch = text[i];
    if (ch === '\n' || ch === '|' || ch === ';' || ch === ',' || ch === '!' || ch === '?') {
      return i;
    }
    if (ch === '.') {
      const nextCh = text[i + 1] ?? '';
      const prevCh = text[i - 1] ?? '';
      if (!(/\d/.test(prevCh) && /\d/.test(nextCh)) && (nextCh === '' || /\s/.test(nextCh))) {
        return i;
      }
    }
  }
  return maxIdx;
}

function isMatchNegated(text: string, matchStart: number, matchEnd: number): boolean {
  const clauseStart = findClauseStart(text, matchStart);
  const clauseBefore = text.slice(clauseStart, matchStart);

  // If a contrast pivot ("but", "however", "except", "แต่") appears after an earlier negation,
  // only evaluate negation in the sub-clause after the last contrast pivot.
  let activeBefore = clauseBefore;
  let lastPivotEnd = -1;
  CLAUSE_CONTRAST_PIVOT_RE.lastIndex = 0;
  let pivotMatch: RegExpExecArray | null;
  while ((pivotMatch = CLAUSE_CONTRAST_PIVOT_RE.exec(clauseBefore)) !== null) {
    lastPivotEnd = pivotMatch.index + pivotMatch[0].length;
  }
  if (lastPivotEnd !== -1) {
    activeBefore = clauseBefore.slice(lastPivotEnd);
  }

  if (
    IMMEDIATE_NON_PREFIX_RE.test(activeBefore) ||
    CLAUSE_NEGATION_PRE_EN_RE.test(activeBefore) ||
    CLAUSE_NEGATION_PRE_TH_RE.test(activeBefore)
  ) {
    return true;
  }

  const clauseEnd = findClauseEnd(text, matchEnd);
  const clauseAfter = text.slice(matchEnd, clauseEnd);
  if (CLAUSE_NEGATION_POST_RE.test(clauseAfter)) {
    return true;
  }

  return false;
}

function hasPositiveClinicalMatch(text: string, re: RegExp): boolean {
  if (!text) return false;
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
  const globalRe = new RegExp(re.source, flags);
  let match: RegExpExecArray | null;
  while ((match = globalRe.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (!isMatchNegated(text, start, end)) {
      return true;
    }
    if (match[0].length === 0) break;
  }
  return false;
}

const MODALITY_HEADER_PREFIX_RE =
  /^(?:(?:ผล\s*)?(?:ct(?:\s+(?:brain|head|chest|abdomen|abd|whole\s+abdomen|kub|spine|c-?spine|pelvis|scan))?|mri(?:\s+(?:brain|spine|head))?|echo(?:cardiogram)?|us|u\/s|ultrasound|cxr|ekg|ecg|film|x-?ray|lab|abg|vbg|ua|sputum|blood\s+culture|impression|conclusion|result|finding(?:s)?)\s*[:\-–]?\s*)+/i;

const BENIGN_CLAUSE_START_RE =
  /^(?:no(?!\.?\s*\d)(?!\s+(?:change|improvement|progression)\b)|not|without|w\/o|none|nil|normal|wnl|unremarkable|negative|neg|non-?reactive|clear|intact|ปกติ|ไม่พบ|ไม่มี|ไม่เห็น|ปฏิเสธ)\b|^(?:ปกติ|ไม่พบ|ไม่มี|ไม่เห็น|ปฏิเสธ)/i;

const BENIGN_CLAUSE_END_RE =
  /^(?:[\w\s/().-]+?)\s*(?:[:=-]|\bis\b|\bwas\b)?\s*(?:normal|wnl|unremarkable|negative|neg|non-?reactive|\(\s*-\s*\)|-ve|none|nil|ปกติ|ไม่พบ|ไม่มี)$/i;

const NORMAL_LVEF_ONLY_RE = /^(?:lv)?ef\s*(?:=|is|:)?\s*(?:[5-8]\d|90)\s*%?$/i;

function splitClinicalClauses(text: string): string[] {
  const result: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    let isBreak = ch === '\n' || ch === '|' || ch === ';' || ch === '!' || ch === '?';
    if (!isBreak && ch === '.') {
      const nextCh = text[i + 1] ?? '';
      const prevCh = text[i - 1] ?? '';
      const isDecimal = /\d/.test(prevCh) && /\d/.test(nextCh);
      const beforeDot = text.slice(Math.max(0, i - 10), i);
      const isAbbrev = ABBREV_DOT_RE.test(beforeDot);
      if (!isDecimal && !isAbbrev && (nextCh === '' || /\s/.test(nextCh))) {
        isBreak = true;
      }
    }
    if (isBreak) {
      const seg = text.slice(start, i).trim();
      if (seg) result.push(seg);
      start = i + 1;
    }
  }
  const tail = text.slice(start).trim();
  if (tail) result.push(tail);
  return result;
}

/**
 * Returns true if the free-text clinical note (e.g. CT / Echo / Lab other) contains
 * at least one non-negated, non-benign clause worth flagging in the Problem List.
 * Purely negative/normal reports such as "CT : No acute intracranial hemorrhage, mass effect,
 * or calvarial fracture" return false.
 */
function hasAbnormalClinicalClause(note: string): boolean {
  const clauses = splitClinicalClauses(note);
  if (clauses.length === 0) return false;

  for (const rawClause of clauses) {
    const stripped = rawClause.replace(MODALITY_HEADER_PREFIX_RE, '').trim();
    if (!stripped) continue;

    const hasContrastPivot = /\b(?:but|however|except|although|yet)\b|แต่|ยกเว้น/i.test(stripped);
    if (!hasContrastPivot) {
      if (
        BENIGN_CLAUSE_START_RE.test(stripped) ||
        BENIGN_CLAUSE_END_RE.test(stripped) ||
        NORMAL_LVEF_ONLY_RE.test(stripped)
      ) {
        continue;
      }
    }
    return true;
  }

  return false;
}

function severityLevelFromScore(score: number): ProblemSeverityLevel {
  if (score >= 90) return 'critical';
  if (score >= 75) return 'high';
  if (score >= 55) return 'moderate';
  return 'mild';
}

function matchesLegacyPrefix(lowerLine: string, legacyPrefixes: string[]): boolean {
  return legacyPrefixes.some((p) => p.length > 0 && lowerLine.startsWith(p.toLowerCase()));
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function generateAutoProblemEntries(
  record: PreAnestheticEvaluation,
): AutoProblemEntry[] {
  const { history, physicalExam, laboratory, investigation, premedication, consult } =
    record.formData;
  const entries: AutoProblemEntry[] = [];
  const ageVal = parseNumericValue(record.age);
  const isPediatric = Number.isFinite(ageVal) && ageVal > 0 && ageVal < 15;

  const ox = physicalExam.oxygenSupport;
  const oxSummary = formatOxygenSupportSummary(ox);

  const clinicalCorpus = [
    record.diagnosis,
    history.presentIllness,
    history.pastIllness,
    history.underlyingDetail,
    ...history.otherUnderlying,
    history.ckdDetail,
    history.heartDiseaseDetail,
    history.dmDetail,
    history.htDetail,
    history.dlpDetail,
    physicalExam.breathSoundDetail,
    physicalExam.heartSoundDetail,
    physicalExam.functionalCapacity,
    investigation.cxrDetail,
    investigation.ekgDetail,
    investigation.other,
    laboratory.other,
    consult,
    ...(ox?.otherItems || []),
  ]
    .filter(Boolean)
    .join(' | ');

  const medAndIvfText = [
    history.medication,
    premedication.onIvf,
    history.presentIllness,
    consult,
  ]
    .filter(Boolean)
    .join(' | ');

  // Parse core numeric values up front so vital signs, sepsis, and lab checks can coordinate
  const bpParsed = parseBloodPressure(physicalExam.bp);
  const pulseVal = parseNumericValue(physicalExam.pulse);
  const rrVal = parseNumericValue(physicalExam.rr);
  const tempVal = parseNumericValue(physicalExam.temp);
  const spo2Val = parseNumericValue(physicalExam.spo2);
  const wbcVal = parseNumericValue(laboratory.wbc);
  const normalizedWbc = Number.isFinite(wbcVal) && wbcVal > 0 ? (wbcVal >= 100 ? wbcVal : wbcVal * 1000) : Number.NaN;

  // 1. Shock / Sepsis / Hemodynamic Instability (highest priority)
  const shockSepsisItems: { text: string; score: number }[] = [];
  const hasSepticShock = hasPositiveClinicalMatch(
    clinicalCorpus,
    /\bseptic\s+shock\b|ช็อกจากติดเชื้อ/i,
  );
  const hasHypovolemicShock = hasPositiveClinicalMatch(
    clinicalCorpus,
    /\b(?:hypovolemic|hemorrhagic)\s+shock\b/i,
  );
  const hasCardiogenicShock = hasPositiveClinicalMatch(
    clinicalCorpus,
    /\bcardiogenic\s+shock\b/i,
  );
  const hasGenericShock =
    !hasSepticShock &&
    !hasHypovolemicShock &&
    !hasCardiogenicShock &&
    hasPositiveClinicalMatch(clinicalCorpus, /\bshock\b|ภาวะช็อก/i);

  if (hasSepticShock) {
    shockSepsisItems.push({ text: 'Septic shock', score: 100 });
  } else {
    if (hasHypovolemicShock) {
      shockSepsisItems.push({ text: 'Hypovolemic / Hemorrhagic shock', score: 99 });
    }
    if (hasCardiogenicShock) {
      shockSepsisItems.push({ text: 'Cardiogenic shock', score: 99 });
    }
    if (hasGenericShock) {
      shockSepsisItems.push({ text: 'Shock', score: 98 });
    }
  }

  const hasExplicitSepsis =
    !hasSepticShock &&
    hasPositiveClinicalMatch(
      clinicalCorpus,
      /\b(?:sepsis|urosepsis|septicemia|bacteremia|septic)\b|ติดเชื้อในกระแสเลือด/i,
    );
  const isHypotensive = bpParsed
    ? isPediatric
      ? bpParsed.sbp < (ageVal < 1 ? 65 : 70 + 2 * Math.min(ageVal, 10))
      : bpParsed.sbp < 90 || bpParsed.map < 65
    : false;
  const hasSuspectedSepsisTriad =
    !hasSepticShock &&
    !hasExplicitSepsis &&
    Number.isFinite(tempVal) &&
    tempVal >= 38.0 &&
    isHypotensive &&
    Number.isFinite(normalizedWbc) &&
    (normalizedWbc > 12000 || normalizedWbc < 4000);

  if (hasExplicitSepsis) {
    shockSepsisItems.push({ text: 'Sepsis', score: 96 });
  } else if (hasSuspectedSepsisTriad) {
    shockSepsisItems.push({ text: 'Suspected Sepsis', score: 95 });
  }

  const matchedVasopressors = VASOPRESSOR_DRUG_PATTERNS.filter((v) =>
    hasPositiveClinicalMatch(medAndIvfText, v.re),
  );
  if (matchedVasopressors.length > 0) {
    shockSepsisItems.push({
      text: `On Vasopressor/Inotrope (${matchedVasopressors.map((v) => v.label).join(', ')})`,
      score: 97,
    });
  }

  if (shockSepsisItems.length > 0) {
    shockSepsisItems.sort((a, b) => b.score - a.score);
    const maxScore = shockSepsisItems[0].score;
    entries.push({
      key: 'shock_sepsis',
      category: 'clinical',
      categoryLabel: 'Shock / Sepsis',
      legacyPrefixes: [],
      text: shockSepsisItems.map((i) => i.text).join(', ').slice(0, 250),
      severityScore: maxScore,
      severityLevel: severityLevelFromScore(maxScore),
    });
  }

  // 2. Respiratory Failure / On ETT / Oxygen Support
  const respItems: { text: string; score: number }[] = [];
  const hasRespFailureText = hasPositiveClinicalMatch(
    clinicalCorpus,
    /\b(?:respiratory\s+failure|resp\.?\s+failure|acute\s+respiratory\s+distress|ards)\b|ภาวะหายใจล้มเหลว|หายใจล้มเหลว/i,
  );
  if (hasRespFailureText) {
    const isArds = hasPositiveClinicalMatch(clinicalCorpus, /\bards\b/i);
    respItems.push({
      text: isArds ? 'ARDS / Respiratory failure' : 'Respiratory failure',
      score: 97,
    });
  }

  const oxLower = oxSummary.toLowerCase();
  if (oxSummary && oxLower !== 'room air') {
    const oxScore =
      ox?.mode === 'ett'
        ? 97
        : ox?.mode === 'mask_bag' || /\b(?:hfnc|bipap|niv)\b/i.test(oxSummary)
        ? 89
        : /tracheo/i.test(oxSummary)
        ? 90
        : 78;
    respItems.push({ text: capitalizeFirst(oxSummary), score: oxScore });
  }
  if (
    ox?.mode !== 'ett' &&
    !oxLower.includes('ett') &&
    hasPositiveClinicalMatch(
      clinicalCorpus,
      /\b(?:on\s+ett|intubated|endotracheal\s+tube|mechanical\s+ventilat\w*)\b|ใส่ท่อช่วยหายใจ/i,
    )
  ) {
    respItems.push({ text: 'On ETT', score: 96 });
  }
  if (
    !oxLower.includes('tracheo') &&
    hasPositiveClinicalMatch(
      clinicalCorpus,
      /\b(?:tracheostomy|tracheotomy)\b|เจาะคอ/i,
    )
  ) {
    respItems.push({ text: 'On Tracheostomy', score: 90 });
  }

  if (respItems.length > 0) {
    respItems.sort((a, b) => b.score - a.score);
    const maxScore = respItems[0].score;
    entries.push({
      key: 'respiratory_support',
      category: 'respiratory',
      categoryLabel: 'Respiratory / O2',
      legacyPrefixes: ['o2/vent:'],
      text: respItems.map((i) => i.text).join(', ').slice(0, 250),
      severityScore: maxScore,
      severityLevel: severityLevelFromScore(maxScore),
    });
  }

  // 3. Airway risk / findings
  const airwayParts: string[] = [];
  let airwayScore = 0;
  let hardAirwayPredictors = 0;

  if (physicalExam.expectedDifficultAirway === 'yes') {
    airwayParts.push('Expected difficult airway');
    airwayScore = Math.max(airwayScore, 99);
    hardAirwayPredictors += 2;
  }
  if (physicalExam.mallampatiClass === 'IV') {
    airwayParts.push('Mallampati IV');
    airwayScore = Math.max(airwayScore, 94);
    hardAirwayPredictors += 1;
  } else if (physicalExam.mallampatiClass === 'III') {
    airwayParts.push('Mallampati III');
    airwayScore = Math.max(airwayScore, 78);
    hardAirwayPredictors += 1;
  }
  if (physicalExam.mouthOpening === 'limited') {
    airwayParts.push(
      `Mouth opening limited${physicalExam.mouthOpeningDetail?.trim() ? ` (${physicalExam.mouthOpeningDetail.trim()})` : ''}`,
    );
    airwayScore = Math.max(airwayScore, 82);
    hardAirwayPredictors += 1;
  }
  if (physicalExam.neckMovement === 'limited') {
    airwayParts.push(
      `Neck movement limited${physicalExam.neckMovementDetail?.trim() ? ` (${physicalExam.neckMovementDetail.trim()})` : ''}`,
    );
    airwayScore = Math.max(airwayScore, 80);
    hardAirwayPredictors += 1;
  }
  if (physicalExam.thyromentalDistance === '<6') {
    airwayParts.push(
      `TMD < 6 cm${physicalExam.thyromentalDistanceDetail?.trim() ? ` (${physicalExam.thyromentalDistanceDetail.trim()})` : ''}`,
    );
    airwayScore = Math.max(airwayScore, 80);
    hardAirwayPredictors += 1;
  }
  if (hardAirwayPredictors >= 2) {
    airwayScore = Math.max(airwayScore, 95);
  }
  if (physicalExam.toothStatus.includes('Loose') || (physicalExam.looseTeeth?.length ?? 0) > 0) {
    airwayParts.push('ฟันโยก (Loose tooth)');
    airwayScore = Math.max(airwayScore, 46);
  }
  if (physicalExam.toothStatus.includes('Denture')) {
    airwayParts.push('ฟันปลอม (Denture)');
    airwayScore = Math.max(airwayScore, 36);
  }
  if (physicalExam.toothStatus.includes('Avulsion') || (physicalExam.missingTeeth?.length ?? 0) > 0) {
    airwayParts.push('ฟันหลอ (Avulsion)');
    airwayScore = Math.max(airwayScore, 34);
  }

  if (airwayParts.length > 0) {
    entries.push({
      key: 'airway',
      category: 'airway',
      categoryLabel: 'Airway',
      legacyPrefixes: ['airway:'],
      text: airwayParts.join(', ').slice(0, 250),
      severityScore: airwayScore,
      severityLevel: severityLevelFromScore(airwayScore),
    });
  }

  // 4. Vital Signs ผิดปกติ (SpO2, BP, PR, RR, BT/มีไข้) — age-aware thresholds
  const vitalItems: { text: string; score: number }[] = [];

  if (Number.isFinite(spo2Val) && spo2Val > 40 && spo2Val < 95) {
    vitalItems.push({
      text: `Hypoxemia (SpO2 ${spo2Val}%)`,
      score: spo2Val < 90 ? 98 : 88,
    });
  }

  if (bpParsed) {
    const bpText = `${bpParsed.sbp}/${bpParsed.dbp}`;
    if (isHypotensive) {
      vitalItems.push({
        text: `Hypotension (BP ${bpText})`,
        score: bpParsed.sbp < 80 ? 99 : 95,
      });
    } else if (isPediatric) {
      const pediHighSbp = ageVal < 6 ? 120 : 130;
      if (bpParsed.sbp >= pediHighSbp) {
        vitalItems.push({ text: `BP สูง (${bpText})`, score: 75 });
      }
    } else {
      if (bpParsed.sbp >= 180 || bpParsed.dbp >= 110) {
        vitalItems.push({ text: `Hypertension (BP ${bpText})`, score: 89 });
      } else if (bpParsed.sbp >= 160 || bpParsed.dbp >= 100) {
        vitalItems.push({ text: `BP สูง (${bpText})`, score: 78 });
      } else if (bpParsed.sbp >= 140 || bpParsed.dbp >= 90) {
        vitalItems.push({ text: `BP สูง (${bpText})`, score: 62 });
      }
    }
  }

  if (Number.isFinite(pulseVal) && pulseVal > 0) {
    const highHr = isPediatric ? (ageVal < 1 ? 160 : ageVal < 5 ? 140 : 120) : 100;
    const lowHr = isPediatric ? (ageVal < 1 ? 100 : ageVal < 5 ? 70 : 60) : 55;
    if (pulseVal < lowHr) {
      vitalItems.push({
        text: `Bradycardia (PR ${pulseVal})`,
        score: pulseVal < lowHr - 10 ? 92 : 76,
      });
    } else if (pulseVal > highHr) {
      vitalItems.push({
        text: `Tachycardia (PR ${pulseVal})`,
        score: pulseVal >= highHr + 30 ? 91 : pulseVal >= highHr + 15 ? 82 : 71,
      });
    }
  }

  if (Number.isFinite(rrVal) && rrVal > 0) {
    const highRr = isPediatric ? (ageVal < 1 ? 50 : ageVal < 5 ? 36 : 28) : 24;
    const lowRr = isPediatric ? (ageVal < 5 ? 14 : 12) : 10;
    if (rrVal < lowRr) {
      vitalItems.push({ text: `Bradypnea (RR ${rrVal})`, score: 93 });
    } else if (rrVal >= highRr) {
      vitalItems.push({
        text: `Tachypnea (RR ${rrVal})`,
        score: rrVal >= highRr + 4 ? 86 : 75,
      });
    }
  }

  let hasFeverVital = false;
  if (Number.isFinite(tempVal) && tempVal > 30) {
    if (tempVal >= 37.8) {
      hasFeverVital = true;
      vitalItems.push({
        text: `มีไข้ (BT ${tempVal}°C)`,
        score: tempVal >= 39 ? 86 : tempVal >= 38.3 ? 81 : 73,
      });
    } else if (tempVal < 36.0) {
      vitalItems.push({
        text: `Hypothermia (BT ${tempVal}°C)`,
        score: tempVal < 35 ? 86 : 74,
      });
    }
  }
  if (
    !hasFeverVital &&
    hasPositiveClinicalMatch(clinicalCorpus, /\b(?:fever|febrile|high\s+grade\s+fever)\b|มีไข้|ไข้สูง/i)
  ) {
    vitalItems.push({ text: 'มีไข้', score: 74 });
  }

  if (vitalItems.length > 0) {
    vitalItems.sort((a, b) => b.score - a.score);
    const maxScore = vitalItems[0].score;
    entries.push({
      key: 'vital_signs',
      category: 'vital',
      categoryLabel: 'Vital signs',
      legacyPrefixes: ['vital signs:'],
      text: vitalItems.map((i) => i.text).join(', ').slice(0, 250),
      severityScore: maxScore,
      severityLevel: severityLevelFromScore(maxScore),
    });
  }

  // 5. ผล Lab ผิดปกติ (ระบุผล/ภาวะปัญหาโดยตรง ไม่ใส่คำว่า "Lab ผิดปกติ")
  const chemItems: { text: string; score: number }[] = [];
  const k = parseNumericValue(laboratory.k);
  const na = parseNumericValue(laboratory.na);
  const cr = parseNumericValue(laboratory.cr);
  const co2 = parseNumericValue(laboratory.co2);
  const bun = parseNumericValue(laboratory.bun);
  const cl = parseNumericValue(laboratory.cl);

  if (Number.isFinite(k) && k > 0) {
    if (k < 3.0) chemItems.push({ text: `Hypokalemia (K ${k})`, score: 97 });
    else if (k > 5.5) chemItems.push({ text: `Hyperkalemia (K ${k})`, score: 98 });
    else if (k < 3.5) chemItems.push({ text: `Hypokalemia (K ${k})`, score: 76 });
    else if (k > 5.0) chemItems.push({ text: `Hyperkalemia (K ${k})`, score: 77 });
  }
  if (Number.isFinite(na) && na > 0) {
    if (na < 128) chemItems.push({ text: `Hyponatremia (Na ${na})`, score: 92 });
    else if (na > 152) chemItems.push({ text: `Hypernatremia (Na ${na})`, score: 92 });
    else if (na < 135) chemItems.push({ text: `Hyponatremia (Na ${na})`, score: 70 });
    else if (na > 145) chemItems.push({ text: `Hypernatremia (Na ${na})`, score: 70 });
  }
  if (Number.isFinite(cr) && cr > 1.5) {
    chemItems.push({ text: `Cr สูง (${cr})`, score: cr > 2.5 ? 86 : 69 });
  }
  if (Number.isFinite(co2) && co2 > 0) {
    if (co2 < 20) chemItems.push({ text: `CO2 ต่ำ (${co2})`, score: co2 < 15 ? 84 : 66 });
    else if (co2 > 30) chemItems.push({ text: `CO2 สูง (${co2})`, score: co2 > 36 ? 84 : 66 });
  }
  if (Number.isFinite(bun) && bun > 25) {
    chemItems.push({ text: `BUN สูง (${bun})`, score: bun > 50 ? 74 : 58 });
  }
  if (Number.isFinite(cl) && cl > 0) {
    if (cl < 96) chemItems.push({ text: `Cl ต่ำ (${cl})`, score: 54 });
    else if (cl > 108) chemItems.push({ text: `Cl สูง (${cl})`, score: 54 });
  }
  if (chemItems.length > 0) {
    chemItems.sort((a, b) => b.score - a.score);
    const maxScore = chemItems[0].score;
    entries.push({
      key: 'lab_chem',
      category: 'lab',
      categoryLabel: 'E-lyte/Renal',
      legacyPrefixes: ['lab ผิดปกติ (e-lyte/renal):'],
      text: chemItems.map((i) => i.text).join(', ').slice(0, 250),
      severityScore: maxScore,
      severityLevel: severityLevelFromScore(maxScore),
    });
  }

  const cbcItems: { text: string; score: number }[] = [];
  const hb = parseNumericValue(laboratory.hb);
  const hct = parseNumericValue(laboratory.hct);
  const plt = parseNumericValue(laboratory.plt);
  const wbc = wbcVal;
  const neutrophil = parseNumericValue(laboratory.neutrophil);

  if (Number.isFinite(hb) && hb > 0) {
    if (hb < 8) cbcItems.push({ text: `Anemia (Hb ${hb})`, score: 93 });
    else if (hb < 10) cbcItems.push({ text: `Anemia (Hb ${hb})`, score: 73 });
    else if (hb > 18) cbcItems.push({ text: `Hb สูง (${hb})`, score: 66 });
  }
  if (Number.isFinite(plt) && plt > 0) {
    if (plt >= 1000) {
      if (plt < 50000) cbcItems.push({ text: `Thrombocytopenia (Plt ${plt.toLocaleString()})`, score: 93 });
      else if (plt < 100000) cbcItems.push({ text: `Plt ต่ำ (${plt.toLocaleString()})`, score: 75 });
      else if (plt > 450000) cbcItems.push({ text: `Plt สูง (${plt.toLocaleString()})`, score: 56 });
    } else {
      if (plt < 50) cbcItems.push({ text: `Thrombocytopenia (Plt ${plt}k)`, score: 93 });
      else if (plt < 100) cbcItems.push({ text: `Plt ต่ำ (${plt}k)`, score: 75 });
      else if (plt > 450) cbcItems.push({ text: `Plt สูง (${plt}k)`, score: 56 });
    }
  }
  if (Number.isFinite(hct) && hct > 0) {
    if (hct < 24) cbcItems.push({ text: `Hct ต่ำ (${hct}%)`, score: 91 });
    else if (hct < 30) cbcItems.push({ text: `Hct ต่ำ (${hct}%)`, score: 71 });
    else if (hct > 54) cbcItems.push({ text: `Hct สูง (${hct}%)`, score: 64 });
  }
  if (Number.isFinite(wbc) && wbc > 0) {
    if (wbc >= 100) {
      if (wbc < 4000) cbcItems.push({ text: `WBC ต่ำ (${wbc.toLocaleString()})`, score: wbc < 2000 ? 78 : 60 });
      else if (wbc > 12000) cbcItems.push({ text: `WBC สูง (${wbc.toLocaleString()})`, score: wbc > 20000 ? 76 : 58 });
    } else {
      if (wbc < 4) cbcItems.push({ text: `WBC ต่ำ (${wbc})`, score: wbc < 2 ? 78 : 60 });
      else if (wbc > 12) cbcItems.push({ text: `WBC สูง (${wbc})`, score: wbc > 20 ? 76 : 58 });
    }
  }
  if (Number.isFinite(neutrophil) && neutrophil > 80) {
    cbcItems.push({ text: `PMN สูง (${neutrophil}%)`, score: 57 });
  }
  if (cbcItems.length > 0) {
    cbcItems.sort((a, b) => b.score - a.score);
    const maxScore = cbcItems[0].score;
    entries.push({
      key: 'lab_cbc',
      category: 'lab',
      categoryLabel: 'CBC',
      legacyPrefixes: ['lab ผิดปกติ (cbc):'],
      text: cbcItems.map((i) => i.text).join(', ').slice(0, 250),
      severityScore: maxScore,
      severityLevel: severityLevelFromScore(maxScore),
    });
  }

  const otherLabItems: { text: string; score: number }[] = [];
  const inr = parseNumericValue(laboratory.inr);
  const pt = parseNumericValue(laboratory.pt);
  const ptt = parseNumericValue(laboratory.ptt);
  const glucose = parseNumericValue(laboratory.glucose);
  const alb = parseNumericValue(laboratory.alb);
  const sgot = parseNumericValue(laboratory.sgot);
  const sgpt = parseNumericValue(laboratory.sgpt);
  const alp = parseNumericValue(laboratory.alp);
  const hba1c = parseNumericValue(laboratory.hba1c);

  if (Number.isFinite(inr) && inr > 1.4) {
    otherLabItems.push({
      text: inr > 1.8 ? `Coagulopathy (INR ${inr})` : `INR สูง (${inr})`,
      score: inr > 1.8 ? 91 : 74,
    });
  }
  if (Number.isFinite(glucose) && glucose > 0) {
    if (glucose < 60) otherLabItems.push({ text: `Hypoglycemia (DTX/Glu ${glucose})`, score: 94 });
    else if (glucose > 300) otherLabItems.push({ text: `Hyperglycemia (DTX/Glu ${glucose})`, score: 90 });
    else if (glucose < 70) otherLabItems.push({ text: `Hypoglycemia (DTX/Glu ${glucose})`, score: 77 });
    else if (glucose > 200) otherLabItems.push({ text: `Hyperglycemia (DTX/Glu ${glucose})`, score: 69 });
  }
  if (Number.isFinite(pt) && pt > 15) {
    otherLabItems.push({ text: `PT สูง (${pt})`, score: pt > 20 ? 82 : 70 });
  }
  if (Number.isFinite(ptt) && ptt > 40) {
    otherLabItems.push({ text: `PTT สูง (${ptt})`, score: ptt > 55 ? 82 : 70 });
  }
  if (Number.isFinite(alb) && alb > 0 && alb < 3.0) {
    otherLabItems.push({ text: `Alb ต่ำ (${alb})`, score: alb < 2.2 ? 72 : 60 });
  }
  if (Number.isFinite(sgot) && sgot > 80) {
    otherLabItems.push({ text: `SGOT สูง (${sgot})`, score: sgot > 200 ? 74 : 59 });
  }
  if (Number.isFinite(sgpt) && sgpt > 80) {
    otherLabItems.push({ text: `SGPT สูง (${sgpt})`, score: sgpt > 200 ? 74 : 59 });
  }
  if (Number.isFinite(alp) && alp > 150) {
    otherLabItems.push({ text: `ALP สูง (${alp})`, score: 55 });
  }
  if (Number.isFinite(hba1c) && hba1c > 7.5) {
    otherLabItems.push({ text: `HbA1c สูง (${hba1c}%)`, score: hba1c > 9.5 ? 72 : 62 });
  }
  const lactateVal = parseNumericValue(laboratory.lactate);
  if (Number.isFinite(lactateVal) && lactateVal > 2.0) {
    otherLabItems.push({
      text: `Lactate สูง (${lactateVal} mmol/L)`,
      score: lactateVal > 4.0 ? 92 : 80,
    });
  }
  const tropIRaw = (laboratory.tropI ?? '').trim();
  if (tropIRaw && !/^(?:-|—|neg|negative|normal|wnl|ปกติ|<)/i.test(tropIRaw)) {
    const tropNum = parseNumericValue(tropIRaw);
    const hasHighKeyword = /\b(?:pos|positive|high|elevated)\b|สูง|ผิดปกติ|\+/i.test(tropIRaw);
    const isNgMl = /ng\s*\/\s*ml/i.test(tropIRaw);
    const isElevatedNumeric =
      Number.isFinite(tropNum) &&
      (isNgMl ? tropNum > 0.04 : tropNum > 34 || (tropNum > 0.04 && tropNum < 1));
    if (hasHighKeyword || isElevatedNumeric) {
      otherLabItems.push({
        text: `Trop I สูง (${tropIRaw})`,
        score: 90,
      });
    }
  }
  if (laboratory.antiHiv === 'positive') {
    otherLabItems.push({
      text: 'Anti-HIV positive',
      score: 72,
    });
  }
  if (laboratory.hbsAg === 'positive') {
    otherLabItems.push({
      text: 'HBsAg positive',
      score: 72,
    });
  }
  const ft3Val = parseNumericValue(laboratory.ft3 ?? '');
  const ft4Val = parseNumericValue(laboratory.ft4 ?? '');
  const tshVal = parseNumericValue(laboratory.tsh ?? '');
  const tftParts: string[] = [];
  if ((laboratory.ft3 ?? '').trim()) tftParts.push(`FT3 ${(laboratory.ft3 ?? '').trim()}`);
  if ((laboratory.ft4 ?? '').trim()) tftParts.push(`FT4 ${(laboratory.ft4 ?? '').trim()}`);
  if ((laboratory.tsh ?? '').trim()) tftParts.push(`TSH ${(laboratory.tsh ?? '').trim()}`);
  if (tftParts.length > 0) {
    const isTshLow = Number.isFinite(tshVal) && tshVal < 0.27;
    const isTshSuppressed = Number.isFinite(tshVal) && tshVal < 0.1;
    const isTshHigh = Number.isFinite(tshVal) && tshVal > 4.5;
    const isTshVeryHigh = Number.isFinite(tshVal) && tshVal > 10;
    const isFt4High = Number.isFinite(ft4Val) && ft4Val > 1.8;
    const isFt4Low = Number.isFinite(ft4Val) && ft4Val < 0.8;
    const isFt3High = Number.isFinite(ft3Val) && ft3Val > 4.4;
    const isFt3Low = Number.isFinite(ft3Val) && ft3Val < 2.0;

    if ((isTshSuppressed || isTshLow) && (isFt4High || isFt3High)) {
      otherLabItems.push({
        text: `Hyperthyroidism / TFT ผิดปกติ (${tftParts.join(', ')})`,
        score: 82,
      });
    } else if (isTshVeryHigh || (isTshHigh && (isFt4Low || isFt3Low))) {
      otherLabItems.push({
        text: `Hypothyroidism / TFT ผิดปกติ (${tftParts.join(', ')})`,
        score: 74,
      });
    } else if (isTshLow || isTshHigh || isFt4High || isFt4Low || isFt3High || isFt3Low) {
      otherLabItems.push({
        text: `TFT ผิดปกติ (${tftParts.join(', ')})`,
        score: 65,
      });
    }
  }
  if (hasBloodGasValues(laboratory)) {
    const isVbg = laboratory.bgType === 'VBG';
    const bgLabel = isVbg ? 'VBG' : laboratory.bgType === 'ABG' ? 'ABG' : 'Blood Gas';
    const phVal = parseNumericValue(laboratory.bgPh ?? '');
    const pco2Val = parseNumericValue(laboratory.bgPco2 ?? '');
    const po2Val = parseNumericValue(laboratory.bgPo2 ?? '');
    const hco3Val = parseNumericValue(laboratory.bgHco3 ?? '');
    const beVal = parseNumericValue(laboratory.bgBe ?? '');
    const sao2Val = parseNumericValue(laboratory.bgSao2 ?? '');
    const pfRatio = computeBloodGasPfRatio(laboratory);

    const phLowCut = isVbg ? 7.31 : 7.35;
    const phSevereLowCut = isVbg ? 7.2 : 7.25;
    const phHighCut = isVbg ? 7.43 : 7.45;
    const pco2HighCut = isVbg ? 51 : 45;
    const pco2SevereHighCut = isVbg ? 56 : 50;
    const pco2LowCut = isVbg ? 40 : 35;

    const isAcidemic = Number.isFinite(phVal) && phVal < phLowCut;
    const isAlkalemic = Number.isFinite(phVal) && phVal > phHighCut;
    const isHighPco2 = Number.isFinite(pco2Val) && pco2Val > pco2HighCut;
    const isLowPco2 = Number.isFinite(pco2Val) && pco2Val < pco2LowCut;
    const isLowHco3 = Number.isFinite(hco3Val) && hco3Val < 22;
    const isHighHco3 = Number.isFinite(hco3Val) && hco3Val > 26;
    const isLowBe = Number.isFinite(beVal) && beVal <= -5;

    const bgFindings: string[] = [];
    let bgScore = 0;

    if (isAcidemic) {
      if ((isLowHco3 || isLowBe) && isHighPco2) {
        bgFindings.push('Mixed acidosis');
      } else if (isLowHco3 || isLowBe) {
        bgFindings.push('Metabolic acidosis');
      } else if (isHighPco2) {
        bgFindings.push('Respiratory acidosis');
      } else {
        bgFindings.push('Acidemia');
      }
      bgScore = Math.max(bgScore, phVal < phSevereLowCut ? 92 : 82);
    } else if (isAlkalemic) {
      if (isHighHco3 && isLowPco2) {
        bgFindings.push('Mixed alkalosis');
      } else if (isHighHco3) {
        bgFindings.push('Metabolic alkalosis');
      } else if (isLowPco2) {
        bgFindings.push('Respiratory alkalosis');
      } else {
        bgFindings.push('Alkalemia');
      }
      bgScore = Math.max(bgScore, phVal > 7.55 ? 85 : 74);
    } else {
      if (Number.isFinite(pco2Val) && pco2Val > pco2SevereHighCut) {
        bgFindings.push(`Hypercapnia (${isVbg ? 'PvCO2' : 'PaCO2'} ${pco2Val})`);
        bgScore = Math.max(bgScore, 78);
      }
      if ((Number.isFinite(hco3Val) && hco3Val < 18) || (Number.isFinite(beVal) && beVal <= -6)) {
        bgFindings.push('Metabolic acidosis / HCO3 ต่ำ');
        bgScore = Math.max(bgScore, 80);
      }
    }

    // Oxygenation evaluation applies only to ABG (not VBG)
    if (!isVbg) {
      if (pfRatio !== null && pfRatio < 300) {
        bgFindings.push(`Hypoxemia (P/F ${pfRatio})`);
        bgScore = Math.max(bgScore, pfRatio < 200 ? 92 : 84);
      } else if (Number.isFinite(po2Val) && po2Val < 80) {
        bgFindings.push(po2Val < 60 ? `Hypoxemia (PaO2 ${po2Val})` : `PaO2 ต่ำ (${po2Val})`);
        bgScore = Math.max(bgScore, po2Val < 60 ? 92 : 76);
      }
      if (Number.isFinite(sao2Val) && sao2Val < 90) {
        bgFindings.push(`SaO2 ต่ำ (${sao2Val}%)`);
        bgScore = Math.max(bgScore, 90);
      }
    }

    if (bgFindings.length > 0) {
      const detailBits: string[] = [];
      if ((laboratory.bgPh ?? '').trim()) detailBits.push(`pH ${(laboratory.bgPh ?? '').trim()}`);
      if ((laboratory.bgPco2 ?? '').trim()) {
        detailBits.push(`${isVbg ? 'PvCO2' : 'PaCO2'} ${(laboratory.bgPco2 ?? '').trim()}`);
      }
      if ((laboratory.bgPo2 ?? '').trim() && !isVbg) {
        detailBits.push(`PaO2 ${(laboratory.bgPo2 ?? '').trim()}`);
      }
      if ((laboratory.bgHco3 ?? '').trim()) detailBits.push(`HCO3 ${(laboratory.bgHco3 ?? '').trim()}`);
      if ((laboratory.bgBe ?? '').trim()) detailBits.push(`BE ${(laboratory.bgBe ?? '').trim()}`);
      otherLabItems.push({
        text: `${bgLabel}: ${bgFindings.join(', ')}${detailBits.length > 0 ? ` (${detailBits.join(', ')})` : ''}`,
        score: bgScore,
      });
    }
  }
  const customLabs = Array.isArray(laboratory.customLabs) ? laboratory.customLabs : [];
  for (const clItem of customLabs) {
    const cName = (clItem?.name ?? '').trim();
    const cVal = (clItem?.value ?? '').trim();
    if (!cName && !cVal) continue;
    const combined = cName && cVal ? `${cName} ${cVal}` : cName || cVal;
    const isBenignVal =
      /^(?:-|—|neg|negative|non-?reactive|normal|wnl|ปกติ|ไม่พบ|none|no)$/i.test(cVal) ||
      (!cVal && /^(?:-|—|normal|wnl|ปกติ)$/i.test(cName));
    if (isBenignVal) continue;

    const cNum = parseNumericValue(cVal);
    const nameLower = cName.toLowerCase();
    const hasPosOrAbn =
      /\b(?:pos|positive|reactive|high|low|abnormal|elevated|critical|acidosis)\b|สูง|ต่ำ|ผิดปกติ|\+/i.test(
        cVal,
      );

    let customScore: number | null = null;
    if (hasPosOrAbn) {
      customScore = /hiv|hbsag|hcv|covid|tb|vdrl|upt/i.test(nameLower) ? 74 : 80;
    } else if (Number.isFinite(cNum)) {
      if (/\begfr\b/i.test(nameLower) && cNum < 60) customScore = cNum < 30 ? 84 : 72;
      else if (/\bph\b/i.test(nameLower) && (cNum < 7.35 || cNum > 7.45)) customScore = cNum < 7.25 ? 92 : 82;
      else if (/\b(?:ca|calcium)\b/i.test(nameLower) && (cNum < 8.0 || cNum > 10.5)) customScore = cNum < 7.0 || cNum > 12.0 ? 86 : 70;
      else if (/\b(?:mg|magnesium)\b/i.test(nameLower) && (cNum < 1.5 || cNum > 2.6)) customScore = 72;
      else if (/\b(?:t\.?\s*bil|total\s+bil|bilirubin)\b/i.test(nameLower) && cNum > 2.0) customScore = 68;
      else if (/\b(?:procalcitonin|pct)\b/i.test(nameLower) && cNum > 0.5) customScore = cNum > 2.0 ? 84 : 72;
      else if (/\b(?:d-?dimer|bnp|nt-?probnp|ck-?mb)\b/i.test(nameLower) && cNum > 0) customScore = 76;
    }
    if (customScore !== null) {
      otherLabItems.push({ text: combined, score: customScore });
    }
  }
  if (isMeaningfulClinicalNote(laboratory.other)) {
    const labOther = laboratory.other.trim();
    if (hasAbnormalClinicalClause(labOther)) {
      const isCriticalLabOther = hasPositiveClinicalMatch(
        labOther,
        /\b(?:troponin|trop|lactate|acidosis|abg|ph\s*7\.[012]|hyperkal|hypokal|coagul|dic|positive|pos|reactive)\b|สูง|ต่ำ|ผิดปกติ/i,
      );
      otherLabItems.push({
        text: labOther,
        score: isCriticalLabOther ? 83 : 65,
      });
    }
  }
  if (otherLabItems.length > 0) {
    otherLabItems.sort((a, b) => b.score - a.score);
    const maxScore = otherLabItems[0].score;
    entries.push({
      key: 'lab_other',
      category: 'lab',
      categoryLabel: 'Coag/LFT/Glu',
      legacyPrefixes: ['lab ผิดปกติ (coag/lft/glu):'],
      text: otherLabItems.map((i) => i.text).join(', ').slice(0, 250),
      severityScore: maxScore,
      severityLevel: severityLevelFromScore(maxScore),
    });
  }

  // 6. Renal Failure / ESRD / AKI
  const renalItems: { text: string; score: number }[] = [];
  const hasEsrd = hasPositiveClinicalMatch(
    clinicalCorpus,
    /\b(?:esrd|end[\s-]stage\s+renal|on\s+hd|hemodialysis|haemodialysis|capd)\b|ฟอกไต|ไตวายเรื้อรังระยะสุดท้าย/i,
  );
  const hasAkiOrRenalFailure = hasPositiveClinicalMatch(
    clinicalCorpus,
    /\b(?:aki|acute\s+kidney\s+injury|acute\s+renal\s+failure|arf|renal\s+failure|kidney\s+failure)\b|ไตวาย/i,
  );
  if (hasEsrd) {
    const dialysisMode = /\bcapd\b/i.test(clinicalCorpus)
      ? ' (CAPD)'
      : /\b(?:on\s+hd|hemodialysis|haemodialysis)\b|ฟอกไต/i.test(clinicalCorpus)
      ? ' (on HD)'
      : '';
    renalItems.push({ text: `ESRD / Renal failure${dialysisMode}`, score: 88 });
  } else if (hasAkiOrRenalFailure) {
    renalItems.push({ text: 'Renal failure / AKI', score: 87 });
  }
  if (renalItems.length > 0) {
    renalItems.sort((a, b) => b.score - a.score);
    const maxScore = renalItems[0].score;
    entries.push({
      key: 'renal_failure',
      category: 'renal',
      categoryLabel: 'Renal',
      legacyPrefixes: [],
      text: renalItems.map((i) => i.text).join(', ').slice(0, 250),
      severityScore: maxScore,
      severityLevel: severityLevelFromScore(maxScore),
    });
  }

  // 7. Cardiopulmonary / Investigation Findings
  const cardiopulmItems: { text: string; score: number }[] = [];
  if (physicalExam.heartSound === 'abnormal') {
    cardiopulmItems.push({
      text: `Heart sound abnormal${physicalExam.heartSoundDetail.trim() ? ` (${physicalExam.heartSoundDetail.trim()})` : ''}`,
      score: 82,
    });
  }
  if (investigation.ekgStatus === 'abnormal') {
    cardiopulmItems.push({
      text: `EKG abnormal${investigation.ekgDetail.trim() ? ` (${investigation.ekgDetail.trim()})` : ''}`,
      score: 81,
    });
  }
  if (physicalExam.breathSound === 'abnormal') {
    cardiopulmItems.push({
      text: `Breath sound abnormal${physicalExam.breathSoundDetail.trim() ? ` (${physicalExam.breathSoundDetail.trim()})` : ''}`,
      score: 80,
    });
  }
  if (investigation.cxrStatus === 'abnormal') {
    cardiopulmItems.push({
      text: `CXR abnormal${investigation.cxrDetail.trim() ? ` (${investigation.cxrDetail.trim()})` : ''}`,
      score: 68,
    });
  }
  if (isMeaningfulClinicalNote(investigation.other)) {
    const invOther = investigation.other.trim();
    if (hasAbnormalClinicalClause(invOther)) {
      const isCriticalInv = hasPositiveClinicalMatch(
        invOther,
        /\b(?:low\s+ef|ef\s*<?\s*[1-4]\d|ich|sdh|edh|sah|intracranial\s+hemorrhage|subdural\s+hematoma|epidural\s+hematoma|herniation|midline\s+shift|ischemi|infarct|embolism|effusion|edema|pneumothorax|tamponade|stenosis|regurgitation|mass|aneurysm|dissection)\b|เลือดออกในสมอง|น้ำท่วมปอด/i,
      );
      cardiopulmItems.push({
        text: invOther,
        score: isCriticalInv ? 84 : 70,
      });
    }
  }

  if (cardiopulmItems.length > 0) {
    cardiopulmItems.sort((a, b) => b.score - a.score);
    const maxScore = cardiopulmItems[0].score;
    entries.push({
      key: 'risk_cardiopulm',
      category: 'risk',
      categoryLabel: 'ปอด/หัวใจ/CXR/EKG',
      legacyPrefixes: ['risk (cardiopulm/inv):'],
      text: cardiopulmItems.map((i) => i.text).join(', ').slice(0, 250),
      severityScore: maxScore,
      severityLevel: severityLevelFromScore(maxScore),
    });
  }

  // 8. Additional Clinical Conditions discovered from Diagnosis / History / Functional Capacity / Consult
  const conditionItems: { text: string; score: number }[] = [];
  const otherUnderlyingJoined = [
    ...history.otherUnderlying,
    history.underlyingDetail,
    history.heartDiseaseDetail,
    history.ckdDetail,
    history.dmDetail,
    history.htDetail,
    history.dlpDetail,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const clinicalMatchers: readonly {
    label: string;
    re: RegExp;
    score: number;
    skipIfInUnderlying?: RegExp;
  }[] = [
    { label: 'Increased ICP / Brain herniation', re: /\b(?:increased\s+icp|iicp|brain\s+herniation|herniation)\b|ความดันในกะโหลกศีรษะสูง/i, score: 94 },
    { label: 'ACS / MI', re: /\b(?:acs|stemi|nstemi|acute\s+coronary|myocardial\s+infarction)\b|กล้ามเนื้อหัวใจขาดเลือดเฉียบพลัน/i, score: 93 },
    {
      label: 'ICH / SDH / EDH',
      re: /\b(?:ich|sdh|edh|sah|intracranial\s+hemorrhage|intracerebral\s+hemorrhage|subarachnoid\s+hemorrhage|subdural\s+hematoma|epidural\s+hematoma|intraventricular\s+hemorrhage)\b|เลือดออกในสมอง|เลือดออกในกะโหลกศีรษะ/i,
      score: 92,
    },
    { label: 'Pneumothorax', re: /\bpneumothorax\b|ลมรั่วในช่องเยื่อหุ้มปอด/i, score: 92 },
    { label: 'Pulmonary edema', re: /\b(?:pulmonary\s+edema|acute\s+pulmonary\s+edema)\b|น้ำท่วมปอด/i, score: 91 },
    { label: 'DKA / HHS', re: /\b(?:dka|diabetic\s+ketoacidosis|hhs)\b/i, score: 91 },
    {
      label: 'Active bleeding / UGIB',
      re: /\b(?:ugib|ugih|lgib|lgih|gi\s+bleed(?:ing)?|active\s+bleed(?:ing)?|massive\s+bleed(?:ing)?|acute\s+bleed(?:ing)?|active\s+hemorrhage|massive\s+hemorrhage|postpartum\s+hemorrhage|pph|hemoperitoneum|hemothorax|ruptured\s+aaa|ruptured\s+ectopic|hematemesis|melena)\b|เลือดออกในทางเดินอาหาร|เลือดออกมาก|เสียเลือดมาก|ตกเลือด/i,
      score: 90,
    },
    { label: 'Alteration of consciousness / GCS ต่ำ', re: /\b(?:coma|stupor|drowsy|obtunded|alteration\s+of\s+consciousness|gcs\s*(?:<=?|<)?\s*(?:[3-9]|1[0-2])\b)\b|ซึมลง|ไม่รู้สึกตัว/i, score: 90 },
    { label: 'Metabolic acidosis', re: /\b(?:metabolic\s+acidosis|lactic\s+acidosis|acidosis)\b/i, score: 88 },
    { label: 'Eclampsia / Preeclampsia', re: /\b(?:eclampsia|preeclampsia|pre-?eclampsia|hellp|pih)\b|ครรภ์เป็นพิษ/i, score: 88 },
    { label: 'Fetal distress', re: /\bfetal\s+distress\b|ทารกในครรภ์มีภาวะคับขัน/i, score: 88 },
    { label: 'CHF / Heart failure', re: /\b(?:chf|heart\s+failure|congestive\s+heart\s+failure|hfref|hfpef)\b|หัวใจล้มเหลว|หัวใจวาย/i, score: 87 },
    { label: 'Placenta previa / Abruption', re: /\b(?:placenta\s+previa|abruptio\s+placentae|placental\s+abruption)\b|รกเกาะต่ำ|รกลอกตัวก่อนกำหนด/i, score: 86 },
    { label: 'Peritonitis / Perforated viscus', re: /\b(?:peritonitis|perforated|perforation|bowel\s+ischemia|necrotizing\s+fasciitis)\b|เยื่อบุช่องท้องอักเสบ/i, score: 86 },
    { label: 'Gut obstruction (Full stomach risk)', re: /\b(?:gut\s+obstruction|bowel\s+obstruction|intestinal\s+obstruction|gastric\s+outlet\s+obstruction)\b|ลำไส้อุดตัน/i, score: 84 },
    { label: 'Cirrhosis / Liver failure', re: /\b(?:cirrhosis|liver\s+failure|hepatic\s+failure|hepatic\s+encephalopathy)\b|ตับแข็ง|ตับวาย/i, score: 82, skipIfInUnderlying: /cirrhosis|ตับแข็ง/i },
    { label: 'AF / Arrhythmia', re: /\b(?:atrial\s+fibrillation|af\s+with\s+rvr|svt|ventricular\s+tachycardia|arrhythmia|complete\s+heart\s+block|chb)\b/i, score: 82, skipIfInUnderlying: /\baf\b|arrhythmia/i },
    { label: 'Pneumonia', re: /\b(?:pneumonia|aspiration\s+pneumonia|vap|hap)\b|ปอดอักเสบ|ปอดติดเชื้อ/i, score: 80 },
    { label: 'Thyrotoxicosis / Hyperthyroidism', re: /\b(?:thyrotoxicosis|thyroid\s+storm|hyperthyroid\w*)\b|ไทรอยด์เป็นพิษ/i, score: 80, skipIfInUnderlying: /hyperthyroid|thyrotoxicosis|ไทรอยด์/i },
    { label: 'Active TB', re: /\b(?:pulmonary\s+tb|active\s+tb|tuberculosis)\b|วัณโรคปอด/i, score: 80, skipIfInUnderlying: /\btb\b|วัณโรค/i },
    { label: 'COVID-19', re: /\bcovid[\s-]?19\b|โควิด/i, score: 80 },
    { label: 'Stroke / CVA', re: /\b(?:stroke|cva|cerebral\s+infarction|ischemic\s+stroke)\b|หลอดเลือดสมอง/i, score: 78, skipIfInUnderlying: /stroke|cva|หลอดเลือดสมอง/i },
    { label: 'IHD / CAD', re: /\b(?:ihd|cad|coronary\s+artery\s+disease|ischemic\s+heart)\b/i, score: 78, skipIfInUnderlying: /\b(?:ihd|cad)\b/i },
    { label: 'Pleural effusion', re: /\bpleural\s+effusion\b|น้ำในช่องเยื่อหุ้มปอด/i, score: 76 },
    { label: 'COPD', re: /\bcopd\b|ถุงลมโป่งพอง/i, score: 74, skipIfInUnderlying: /copd|ถุงลมโป่งพอง/i },
    { label: 'Pregnancy', re: /\b(?:pregnan\w*|g\d+p\d+|ga\s*\d+\s*wk|cesarean|caesarean)\b|ตั้งครรภ์/i, score: 74 },
    { label: 'OSA', re: /\b(?:osa|obstructive\s+sleep\s+apnea)\b|หยุดหายใจขณะหลับ/i, score: 72, skipIfInUnderlying: /\bosa\b/i },
    { label: 'Seizure / Epilepsy', re: /\b(?:seizure|epilepsy|status\s+epilepticus)\b|ลมชัก/i, score: 72, skipIfInUnderlying: /epilepsy|seizure|ลมชัก/i },
    { label: 'Hypothyroidism', re: /\bhypothyroid\w*\b/i, score: 72, skipIfInUnderlying: /hypothyroid/i },
    { label: 'Asthma', re: /\basthma\b|หอบหืด/i, score: 70, skipIfInUnderlying: /asthma|หอบหืด/i },
    { label: 'HIV', re: /\b(?:hiv|anti-?hiv\s*(?:pos|reactive))\b/i, score: 70, skipIfInUnderlying: /\bhiv\b/i },
    { label: 'HBV / HCV', re: /\b(?:hbv|hcv|hbsag\s*(?:pos|reactive)|hepatitis\s+[bc])\b/i, score: 68, skipIfInUnderlying: /\b(?:hbv|hcv)\b/i },
  ];

  for (const matcher of clinicalMatchers) {
    if (matcher.label === 'HIV' && laboratory.antiHiv === 'positive') {
      continue;
    }
    if (matcher.skipIfInUnderlying && matcher.skipIfInUnderlying.test(otherUnderlyingJoined)) {
      continue;
    }
    if (hasPositiveClinicalMatch(clinicalCorpus, matcher.re)) {
      conditionItems.push({ text: matcher.label, score: matcher.score });
    }
  }

  // Poor functional capacity (< 4 METs, bedridden, NYHA III-IV)
  const fc = physicalExam.functionalCapacity.trim();
  const fcLevel = physicalExam.functionalCapacityLevel || '';
  if (
    fcLevel === '<4' ||
    (fc &&
      /(?:<\s*4|\b[1-3]\s*met|poor|bedridden|nyha\s*(?:iii|iv|3|4)|ติดเตียง|ช่วยเหลือตัวเองไม่ได้)/i.test(
        fc,
      ))
  ) {
    const fcSummary =
      fcLevel === '<4'
        ? fc
          ? `< 4 METS · ${fc}`
          : '< 4 METS'
        : fc;
    conditionItems.push({
      text: `Poor functional capacity (${fcSummary})`,
      score: 76,
    });
  }

  // Current Status: Dyspnea / Dependent / Altered GCS
  if (physicalExam.dyspneaStatus === 'yes') {
    conditionItems.push({
      text: 'Dyspnea (เหนื่อยหอบ)',
      score: 82,
    });
  }
  if (physicalExam.selfCareStatus === 'dependent' && fcLevel !== '<4') {
    conditionItems.push({
      text: 'Dependent status (ช่วยเหลือตัวเองไม่ได้)',
      score: 70,
    });
  }
  const gcsEVal = parseInt((physicalExam.gcsE || '').trim(), 10);
  const gcsVTrim = (physicalExam.gcsV || '').trim().toUpperCase();
  const gcsVVal = parseInt(gcsVTrim, 10);
  const gcsMVal = parseInt((physicalExam.gcsM || '').trim(), 10);
  if (Number.isFinite(gcsEVal) && Number.isFinite(gcsMVal)) {
    const isTube = gcsVTrim === 'T' || gcsVTrim === 'VT';
    const gcsNumeric = isTube ? gcsEVal + gcsMVal : Number.isFinite(gcsVVal) ? gcsEVal + gcsVVal + gcsMVal : NaN;
    const isAltered = isTube ? gcsEVal + gcsMVal <= 8 : Number.isFinite(gcsNumeric) && gcsNumeric <= 12;
    if (isAltered) {
      const gcsLabel = `E${physicalExam.gcsE?.trim()}V${physicalExam.gcsV?.trim()}M${physicalExam.gcsM?.trim()}`;
      conditionItems.push({
        text: `Alteration of consciousness (GCS ${gcsLabel})`,
        score: gcsNumeric <= 8 ? 92 : 84,
      });
    }
  }

  // NPO fasting evaluation: Food < 8 hr or Water < 2 hr (counted from last intake to operationTime) -> Full stomach
  const npoEval = evaluateNpoStatus(record);
  if (npoEval.isFullStomach && npoEval.problemText) {
    entries.push({
      key: 'npo_full_stomach',
      category: 'clinical',
      categoryLabel: 'NPO / Full stomach',
      legacyPrefixes: ['full stomach'],
      text: npoEval.problemText.slice(0, 250),
      severityScore: 86,
      severityLevel: severityLevelFromScore(86),
    });
  }

  if (conditionItems.length > 0) {
    conditionItems.sort((a, b) => b.score - a.score);
    const maxScore = conditionItems[0].score;
    entries.push({
      key: 'clinical_conditions',
      category: 'clinical',
      categoryLabel: 'ภาวะโรค/ปัญหาที่พบ',
      legacyPrefixes: [],
      text: conditionItems.map((i) => i.text).join(', ').slice(0, 250),
      severityScore: maxScore,
      severityLevel: severityLevelFromScore(maxScore),
    });
  }

  // 9. Blood preparation not ready / Rh negative
  const bloodStatuses = Array.isArray(laboratory.prepStatuses) ? laboratory.prepStatuses : [];
  const bloodIssues: string[] = [];
  if (laboratory.bloodRh === 'negative') {
    bloodIssues.push(
      laboratory.bloodGroup ? `เลือดหายาก (Gr. ${laboratory.bloodGroup} Rh-)` : 'เลือดหายาก (Rh-)',
    );
  }
  if (bloodStatuses.includes('not_ready')) bloodIssues.push('จองเลือดยังไม่พร้อมใช้');
  if (bloodStatuses.includes('waiting_red_cross')) bloodIssues.push('รอเลือดจากกาชาด');
  if (bloodIssues.length > 0) {
    const detail = laboratory.prepStatusDetail.trim();
    entries.push({
      key: 'blood_prep',
      category: 'risk',
      categoryLabel: 'การจองเลือด',
      legacyPrefixes: [],
      text: `${bloodIssues.join(', ')}${detail ? ` (${detail})` : ''}`.slice(0, 250),
      severityScore: 85,
      severityLevel: severityLevelFromScore(85),
    });
  }

  // 10. Allergy Risk (anaphylaxis safety critical)
  if (history.allergyStatus === 'yes') {
    const detail = history.allergyDetail.trim();
    const score = 88;
    entries.push({
      key: 'risk_allergy',
      category: 'risk',
      categoryLabel: 'แพ้ยา/อาหาร',
      legacyPrefixes: ['risk (allergy):'],
      text: `แพ้ยา/อาหาร${detail ? ` (${detail})` : ''}`.slice(0, 250),
      severityScore: score,
      severityLevel: severityLevelFromScore(score),
    });
  }

  // 11. General Clinical Risks (Emergency, Prev anesth comp, Anticoag/Antiplatelet, Age, Substance)
  const generalRiskItems: { text: string; score: number }[] = [];
  if (isMeaningfulClinicalNote(history.previousOpComplication)) {
    generalRiskItems.push({
      text: `Prev. anesth. complication (${history.previousOpComplication.trim()})`,
      score: 85,
    });
  }
  if (record.asaEmergency || record.scheduleType === 'emergency') {
    generalRiskItems.push({ text: 'Emergency (Full stomach risk)', score: 84 });
  }
  if (history.medication.trim()) {
    const parsedMeds = parseMedicationList(history.medication);
    const matchedAnti = ANTITHROMBOTIC_DRUG_PATTERNS.filter((item) =>
      item.re.test(history.medication),
    );
    if (matchedAnti.length > 0) {
      const formatAntiLabel = (pattern: (typeof ANTITHROMBOTIC_DRUG_PATTERNS)[number]): string => {
        const entry = parsedMeds.find((e) => pattern.re.test(e.name));
        if (entry?.holdStatus === 'not_stopped') {
          return `${pattern.label} ไม่หยุดยา`;
        }
        if (entry?.holdStatus === 'stopped' || entry?.stopped) {
          const thaiDate = entry.stopDate ? formatThaiDateBE(entry.stopDate) : '';
          return thaiDate ? `${pattern.label} หยุดตั้งแต่ ${thaiDate}` : `${pattern.label} หยุดยาแล้ว`;
        }
        return pattern.label;
      };
      const anticoagMatched = matchedAnti.filter((m) => m.drugClass === 'anticoagulant');
      const antiplateletMatched = matchedAnti.filter((m) => m.drugClass === 'antiplatelet');
      const hasHighRisk = matchedAnti.some((m) => m.highRisk);
      const parts: string[] = [];
      if (anticoagMatched.length > 0) {
        parts.push(`On Anticoagulant (${anticoagMatched.map(formatAntiLabel).join(', ')})`);
      }
      if (antiplateletMatched.length > 0) {
        parts.push(`On Antiplatelet (${antiplateletMatched.map(formatAntiLabel).join(', ')})`);
      }
      generalRiskItems.push({
        text: parts.join(' + '),
        score: hasHighRisk ? 80 : 66,
      });
    }
  }
  if (Number.isFinite(ageVal) && ageVal > 0) {
    if (ageVal < 15) generalRiskItems.push({ text: `Pediatric (อายุ ${ageVal} ปี)`, score: 63 });
    else if (ageVal >= 65) generalRiskItems.push({ text: `Elderly (อายุ ${ageVal} ปี)`, score: ageVal >= 80 ? 68 : 58 });
  }

  if (generalRiskItems.length > 0) {
    generalRiskItems.sort((a, b) => b.score - a.score);
    const maxScore = generalRiskItems[0].score;
    entries.push({
      key: 'risk_general',
      category: 'risk',
      categoryLabel: 'Risk',
      legacyPrefixes: ['risk:'],
      text: generalRiskItems.map((i) => i.text).join(', ').slice(0, 250),
      severityScore: maxScore,
      severityLevel: severityLevelFromScore(maxScore),
    });
  }

  // 11b. Substance Use (Addiction, Smoking, Alcohol use) — dedicated clear entries
  const hasAddictionData =
    history.drugAddictionStatus === 'yes' ||
    (history.drugAddictionStatus !== 'no' &&
      ((history.drugAddictionTypes?.length ?? 0) > 0 ||
        Boolean(history.drugAddictionOther?.trim()))) ||
    (history.drugAddictionStatus !== 'no' &&
      hasPositiveClinicalMatch(
        clinicalCorpus,
        /\b(?:drug\s+addiction|substance\s+abuse|substance\s+use|amphetamine|methamphetamine|opioid\s+dependence|kratom)\b|สารเสพติด|ติดยาเสพติด/i,
      ));
  if (hasAddictionData) {
    const drugDetail = formatDrugAddictionDetail(history);
    const addictionScore = history.drugAddictionQuit ? 45 : 61;
    entries.push({
      key: 'substance_addiction',
      category: 'risk',
      categoryLabel: 'Addiction',
      legacyPrefixes: ['drug addiction'],
      text: (drugDetail ? `Addiction (${drugDetail})` : 'Addiction').slice(0, 250),
      severityScore: addictionScore,
      severityLevel: severityLevelFromScore(addictionScore),
    });
  }

  const hasSmokingData =
    history.smokingStatus === 'yes' ||
    (history.smokingStatus !== 'no' &&
      (Boolean(history.smokingCigsPerDay?.trim()) || Boolean(history.smokingYears?.trim()))) ||
    (history.smokingStatus !== 'no' &&
      hasPositiveClinicalMatch(
        clinicalCorpus,
        /\b(?:smoking|smoker|ex-?smoker|heavy\s+smoker)\b|สูบบุหรี่/i,
      ));
  if (hasSmokingData) {
    const smokeParts: string[] = [];
    if (history.smokingCigsPerDay?.trim()) smokeParts.push(`${history.smokingCigsPerDay.trim()} มวน/วัน`);
    if (history.smokingYears?.trim()) {
      smokeParts.push(
        `${history.smokingYears.trim()} ${history.smokingDurationUnit === 'months' ? 'เดือน' : 'ปี'}`,
      );
    }
    if (history.smokingQuit || history.smokingQuitDuration?.trim()) {
      smokeParts.push(
        history.smokingQuitDuration?.trim()
          ? `เลิก ${history.smokingQuitDuration.trim()} ${history.smokingQuitUnit === 'months' ? 'เดือน' : 'ปี'}`
          : 'Ex-smoker',
      );
    }
    const smokingScore = history.smokingQuit ? 38 : 52;
    entries.push({
      key: 'substance_smoking',
      category: 'risk',
      categoryLabel: 'Smoking',
      legacyPrefixes: ['active smoking', 'ex-smoker'],
      text: (smokeParts.length > 0 ? `Smoking (${smokeParts.join(' · ')})` : 'Smoking').slice(0, 250),
      severityScore: smokingScore,
      severityLevel: severityLevelFromScore(smokingScore),
    });
  }

  const hasAlcoholWithdrawal = hasPositiveClinicalMatch(
    clinicalCorpus,
    /\b(?:alcohol\s+withdrawal|delirium\s+tremens|dt\s+from\s+alcohol)\b|ถอนสุรา|ลงแดง/i,
  );
  const hasAlcoholData =
    history.drinkingStatus === 'yes' ||
    hasAlcoholWithdrawal ||
    (history.drinkingStatus !== 'no' &&
      (Boolean(history.drinkingAmount?.trim()) ||
        Boolean(history.drinkingDaysPerWeek?.trim()) ||
        Boolean(history.drinkingYears?.trim()))) ||
    (history.drinkingStatus !== 'no' &&
      hasPositiveClinicalMatch(
        clinicalCorpus,
        /\b(?:alcohol\s+use|alcoholism|alcoholic|alcohol\s+dependence|heavy\s+drinker)\b|ดื่มสุรา|ดื่มแอลกอฮอล์|ติดสุรา/i,
      ));
  if (hasAlcoholData) {
    const drinkParts: string[] = [];
    if (history.drinkingAmount?.trim()) drinkParts.push(`ปริมาณ ${history.drinkingAmount.trim()}`);
    if (history.drinkingDaysPerWeek?.trim()) drinkParts.push(`${history.drinkingDaysPerWeek.trim()} วัน/wk`);
    if (history.drinkingYears?.trim()) {
      drinkParts.push(
        `${history.drinkingYears.trim()} ${history.drinkingDurationUnit === 'months' ? 'เดือน' : 'ปี'}`,
      );
    }
    if (history.drinkingQuit || history.drinkingQuitDuration?.trim()) {
      drinkParts.push(
        history.drinkingQuitDuration?.trim()
          ? `เลิก ${history.drinkingQuitDuration.trim()} ${history.drinkingQuitUnit === 'months' ? 'เดือน' : 'ปี'}`
          : 'เลิกแล้ว',
      );
    }
    const alcoholScore = hasAlcoholWithdrawal ? 86 : history.drinkingQuit ? 36 : 50;
    const baseLabel = hasAlcoholWithdrawal ? 'Alcohol withdrawal / Alcohol use' : 'Alcohol use';
    entries.push({
      key: 'substance_alcohol',
      category: 'risk',
      categoryLabel: 'Alcohol use',
      legacyPrefixes: ['alcohol drinking', 'history of alcohol use'],
      text: (drinkParts.length > 0 ? `${baseLabel} (${drinkParts.join(' · ')})` : baseLabel).slice(0, 250),
      severityScore: alcoholScore,
      severityLevel: severityLevelFromScore(alcoholScore),
    });
  }

  // 12. BMI
  const rawBmi = physicalExam.bmi.trim() || calculateBmi(physicalExam.bw, physicalExam.ht);
  const bmiVal = parseNumericValue(rawBmi);
  if (Number.isFinite(bmiVal) && bmiVal >= 10 && bmiVal <= 100) {
    let bmiRiskDesc = '';
    let bmiScore = 0;
    if (bmiVal >= 40) {
      bmiRiskDesc = `Morbid Obesity (BMI ${bmiVal.toFixed(1)})`;
      bmiScore = 83;
    } else if (bmiVal >= 35) {
      bmiRiskDesc = `Obesity (BMI ${bmiVal.toFixed(1)})`;
      bmiScore = 73;
    } else if (bmiVal >= 30) {
      bmiRiskDesc = `Obesity (BMI ${bmiVal.toFixed(1)})`;
      bmiScore = 59;
    } else if (bmiVal < 18.5) {
      bmiRiskDesc = `Underweight (BMI ${bmiVal.toFixed(1)})`;
      bmiScore = bmiVal < 16 ? 62 : 44;
    } else if (bmiVal >= 25) {
      bmiRiskDesc = `Overweight (BMI ${bmiVal.toFixed(1)})`;
      bmiScore = 41;
    }

    if (bmiRiskDesc) {
      entries.push({
        key: 'bmi',
        category: 'bmi',
        categoryLabel: 'BMI',
        legacyPrefixes: ['risk bmi:'],
        text: bmiRiskDesc.slice(0, 250),
        severityScore: bmiScore,
        severityLevel: severityLevelFromScore(bmiScore),
      });
    }
  }

  // 13. โรคประจำตัว (ลงชื่อโรคโดยตรง ไม่ใส่คำว่า "โรคประจำตัว:")
  const underlyingItems: { text: string; score: number }[] = [];
  if (history.heartDisease) {
    underlyingItems.push({
      text: formatUnderlyingDiseaseTag(
        'โรคหัวใจ',
        history.heartDiseaseYears,
        history.heartDiseaseDetail,
        'ปี',
        history.heartDiseaseControl,
      ),
      score: history.heartDiseaseControl === 'poor' ? 86 : 79,
    });
  }
  if (history.ckd) {
    underlyingItems.push({
      text: formatUnderlyingDiseaseTag(
        'CKD',
        history.ckdYears,
        history.ckdDetail,
        'ปี',
        history.ckdControl,
      ),
      score: history.ckdControl === 'poor' ? 82 : 75,
    });
  } else if (
    !hasEsrd &&
    !hasAkiOrRenalFailure &&
    hasPositiveClinicalMatch(clinicalCorpus, /\b(?:ckd|chronic\s+kidney\s+disease)\b|โรคไตเรื้อรัง/i)
  ) {
    underlyingItems.push({ text: 'CKD', score: 75 });
  }
  if (history.dm) {
    underlyingItems.push({
      text: formatUnderlyingDiseaseTag(
        'DM',
        history.dmYears,
        history.dmDetail,
        'ปี',
        history.dmControl,
      ),
      score: history.dmControl === 'poor' ? 72 : 60,
    });
  }
  if (history.ht) {
    underlyingItems.push({
      text: formatUnderlyingDiseaseTag(
        'HT',
        history.htYears,
        history.htDetail,
        'ปี',
        history.htControl,
      ),
      score: history.htControl === 'poor' ? 70 : 56,
    });
  }
  history.otherUnderlying
    .map((u) => u.trim())
    .filter(Boolean)
    .forEach((u) => underlyingItems.push({ text: u, score: 57 }));
  if (history.dlp) {
    underlyingItems.push({
      text: formatUnderlyingDiseaseTag(
        'DLP',
        history.dlpYears,
        history.dlpDetail,
        'ปี',
        history.dlpControl,
      ),
      score: history.dlpControl === 'poor' ? 48 : 38,
    });
  }
  if (history.underlyingControl === 'poor') {
    const anyDiseasePoor =
      history.dmControl === 'poor' ||
      history.htControl === 'poor' ||
      history.dlpControl === 'poor' ||
      history.ckdControl === 'poor' ||
      history.heartDiseaseControl === 'poor';
    if (!anyDiseasePoor) {
      underlyingItems.push({ text: 'Underlying: Poor control', score: 74 });
    }
  }
  if (history.underlyingDetail?.trim()) {
    underlyingItems.push({
      text: history.underlyingDetail.trim(),
      score: 37,
    });
  }

  if (underlyingItems.length > 0) {
    underlyingItems.sort((a, b) => b.score - a.score);
    const maxScore = underlyingItems[0].score;
    entries.push({
      key: 'underlying',
      category: 'underlying',
      categoryLabel: 'โรคประจำตัว',
      legacyPrefixes: ['โรคประจำตัว:'],
      text: underlyingItems.map((i) => i.text).join(', ').slice(0, 250),
      severityScore: maxScore,
      severityLevel: severityLevelFromScore(maxScore),
    });
  }

  // Sort all auto-generated Problem List entries strictly by clinical priority
  entries.sort((a, b) => b.severityScore - a.severityScore);
  return entries;
}

function insertProblemLine(items: string[], line: string): void {
  const emptyIdx = items.findIndex((x) => !x.trim());
  if (emptyIdx !== -1) {
    items[emptyIdx] = line;
  } else if (items.length < 12) {
    items.push(line);
  }
}

function normalizeProblemSlots(items: string[], compactNonEmpty: boolean): string[] {
  const list = compactNonEmpty ? items.filter((x) => x.trim().length > 0) : [...items];
  const minSlots = Math.max(6, list.length);
  while (list.length < minSlots && list.length < 12) {
    list.push('');
  }
  return list.slice(0, 12);
}

function getSeverityScoreForLine(line: string, autoEntries: AutoProblemEntry[]): number | null {
  const lower = line.trim().toLowerCase();
  if (!lower) return null;
  const exact = autoEntries.find((e) => e.text.toLowerCase() === lower);
  if (exact) return exact.severityScore;
  const byLegacyPrefix = autoEntries.find((e) => matchesLegacyPrefix(lower, e.legacyPrefixes));
  if (byLegacyPrefix) return byLegacyPrefix.severityScore;
  return null;
}

export function sortProblemListBySeverity(
  items: string[],
  autoEntries: AutoProblemEntry[],
): string[] {
  const nonEmpty = items
    .map((text, idx) => ({
      text: text.trim(),
      idx,
      score: getSeverityScoreForLine(text, autoEntries),
    }))
    .filter((item) => item.text.length > 0);

  if (nonEmpty.length <= 1) {
    return normalizeProblemSlots(items, false);
  }

  nonEmpty.sort((a, b) => {
    const aHasScore = a.score !== null;
    const bHasScore = b.score !== null;
    if (aHasScore && bHasScore && a.score !== b.score) {
      return (b.score as number) - (a.score as number);
    }
    if (aHasScore !== bHasScore) return aHasScore ? -1 : 1;
    return a.idx - b.idx;
  });

  return normalizeProblemSlots(
    nonEmpty.map((item) => item.text),
    false,
  );
}

export function isProblemListSortedBySeverity(record: PreAnestheticEvaluation): boolean {
  const autoEntries = generateAutoProblemEntries(record);
  const currentNonEmpty = record.formData.problemList.map((s) => s.trim()).filter(Boolean);
  if (currentNonEmpty.length <= 1) return true;
  const sortedNonEmpty = sortProblemListBySeverity(
    record.formData.problemList,
    autoEntries,
  )
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    currentNonEmpty.length === sortedNonEmpty.length &&
    currentNonEmpty.every((val, i) => val === sortedNonEmpty[i])
  );
}

export function syncProblemListWithPatientData(
  prevRecord: PreAnestheticEvaluation,
  nextRecord: PreAnestheticEvaluation,
): string[] {
  // Respect explicit direct edits to problemList
  if (prevRecord.formData.problemList !== nextRecord.formData.problemList) {
    return nextRecord.formData.problemList;
  }

  const prevAuto = generateAutoProblemEntries(prevRecord);
  const nextAuto = generateAutoProblemEntries(nextRecord);

  if (prevAuto.length === 0 && nextAuto.length === 0) {
    return nextRecord.formData.problemList;
  }

  const isIdentical =
    prevAuto.length === nextAuto.length &&
    prevAuto.every(
      (entry, i) =>
        entry.key === nextAuto[i].key &&
        entry.text === nextAuto[i].text &&
        entry.severityScore === nextAuto[i].severityScore,
    );
  if (isIdentical) {
    return nextRecord.formData.problemList;
  }

  const items = [...nextRecord.formData.problemList];
  const prevByKey = new Map(prevAuto.map((e) => [e.key, e]));
  const nextByKey = new Map(nextAuto.map((e) => [e.key, e]));
  const handledKeys = new Set<string>();
  let mutated = false;

  // 1. Update in-place or remove previous auto-generated problem lines (also upgrades legacy prefixed lines)
  for (const prevEntry of prevAuto) {
    const prevLower = prevEntry.text.toLowerCase();
    const existingIdx = items.findIndex((it) => {
      const lower = it.trim().toLowerCase();
      return lower === prevLower || matchesLegacyPrefix(lower, prevEntry.legacyPrefixes);
    });
    if (existingIdx === -1) continue;

    const nextEntry = nextByKey.get(prevEntry.key);
    if (nextEntry) {
      if (items[existingIdx] !== nextEntry.text) {
        items[existingIdx] = nextEntry.text;
        mutated = true;
      }
      handledKeys.add(prevEntry.key);
    } else {
      items[existingIdx] = '';
      mutated = true;
    }
  }

  // 2. Insert brand-new auto-detected problems (skip keys the user previously deleted)
  for (const nextEntry of nextAuto) {
    if (handledKeys.has(nextEntry.key)) continue;
    const existedBefore = prevByKey.has(nextEntry.key);
    if (existedBefore) continue;

    const nextLower = nextEntry.text.toLowerCase();
    const legacyIdx = items.findIndex((it) =>
      matchesLegacyPrefix(it.trim().toLowerCase(), nextEntry.legacyPrefixes),
    );
    if (legacyIdx !== -1) {
      items[legacyIdx] = nextEntry.text;
      mutated = true;
      continue;
    }

    const alreadyPresent = items.some((it) => it.trim().toLowerCase() === nextLower);
    if (alreadyPresent) continue;

    insertProblemLine(items, nextEntry.text);
    mutated = true;
  }

  if (!mutated) return nextRecord.formData.problemList;
  return sortProblemListBySeverity(items, nextAuto);
}

export function getMissingAutoProblems(record: PreAnestheticEvaluation): AutoProblemEntry[] {
  const autoEntries = generateAutoProblemEntries(record);
  if (autoEntries.length === 0) return [];
  const lowerItems = record.formData.problemList
    .map((it) => it.trim().toLowerCase())
    .filter(Boolean);

  return autoEntries.filter((entry) => {
    const exactLower = entry.text.toLowerCase();
    return !lowerItems.some((it) => it === exactLower);
  });
}

export function applyAutoProblems(
  record: PreAnestheticEvaluation,
  entriesToApply?: AutoProblemEntry[],
): string[] {
  const allAuto = generateAutoProblemEntries(record);
  const targets = entriesToApply ?? getMissingAutoProblems(record);
  if (targets.length === 0) {
    return sortProblemListBySeverity(record.formData.problemList, allAuto);
  }

  const items = [...record.formData.problemList];
  for (const entry of targets) {
    const exactLower = entry.text.toLowerCase();
    if (items.some((it) => it.trim().toLowerCase() === exactLower)) continue;

    // Replace legacy prefixed slot if present, otherwise insert into empty slot
    const legacyIdx = items.findIndex((it) =>
      matchesLegacyPrefix(it.trim().toLowerCase(), entry.legacyPrefixes),
    );
    if (legacyIdx !== -1) {
      items[legacyIdx] = entry.text;
    } else {
      insertProblemLine(items, entry.text);
    }
  }

  return sortProblemListBySeverity(items, allAuto);
}

const KNOWN_AUTO_CONDITION_TOKENS = new Set([
  'increased icp / brain herniation',
  'acs / mi',
  'ich / sdh / edh',
  'pneumothorax',
  'pulmonary edema',
  'dka / hhs',
  'active bleeding / ugib',
  'alteration of consciousness / gcs ต่ำ',
  'metabolic acidosis',
  'eclampsia / preeclampsia',
  'fetal distress',
  'chf / heart failure',
  'placenta previa / abruption',
  'peritonitis / perforated viscus',
  'gut obstruction (full stomach risk)',
  'cirrhosis / liver failure',
  'af / arrhythmia',
  'pneumonia',
  'thyrotoxicosis / hyperthyroidism',
  'active tb',
  'covid-19',
  'stroke / cva',
  'ihd / cad',
  'pleural effusion',
  'copd',
  'pregnancy',
  'osa',
  'seizure / epilepsy',
  'hypothyroidism',
  'asthma',
  'hiv',
  'hbv / hcv',
  'full stomach / not npo',
  'full stomach',
]);

export interface NpoEvaluationResult {
  operationMinutes: number | null;
  foodHours: number | null;
  waterHours: number | null;
  isFoodFullStomach: boolean;
  isWaterFullStomach: boolean;
  hasExplicitNotNpo: boolean;
  isFullStomach: boolean;
  problemText: string;
}

function parseClockMinutes(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.trim();
  if (!cleaned) return null;
  // Match first HH:MM or HH.MM (including 24:00 / 24.00 for midnight)
  const match = cleaned.match(/\b([01]?\d|2[0-4])[:.]([0-5]\d)\b/);
  if (!match) return null;
  const rawHour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(rawHour) || !Number.isFinite(minute)) return null;
  if (rawHour === 24 && minute === 0) return 0;
  if (rawHour < 0 || rawHour > 23 || minute < 0 || minute > 59) return null;
  return rawHour * 60 + minute;
}

function computeElapsedFastingHours(lastMinutes: number, opMinutes: number): number {
  const diffMin =
    opMinutes >= lastMinutes
      ? opMinutes - lastMinutes
      : 24 * 60 - lastMinutes + opMinutes;
  return Math.round((diffMin / 60) * 10) / 10;
}

export function formatFastingHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

/**
 * Evaluates NPO adequacy against scheduled operationTime:
 * - Solid food fasting < 8 hours -> Full stomach
 * - Clear water fasting < 2 hours -> Full stomach
 * Supports both dedicated lastMealTime/lastWaterTime fields and smart parsing of free-text npoTime.
 */
export function evaluateNpoStatus(record: PreAnestheticEvaluation): NpoEvaluationResult {
  const pm = record.formData.premedication;
  const history = record.formData.history;
  const opMinutes = parseClockMinutes(record.operationTime);
  const npoRaw = (pm.npoTime || '').trim();

  let foodHours: number | null = null;
  let waterHours: number | null = null;

  // 1. Dedicated Last Meal Time vs Operation Time
  const mealMinutes = parseClockMinutes(pm.lastMealTime);
  if (mealMinutes !== null && opMinutes !== null) {
    foodHours = computeElapsedFastingHours(mealMinutes, opMinutes);
  }

  // 2. Dedicated Last Water Time vs Operation Time
  const waterMinutes = parseClockMinutes(pm.lastWaterTime);
  if (waterMinutes !== null && opMinutes !== null) {
    waterHours = computeElapsedFastingHours(waterMinutes, opMinutes);
  }

  // 3. Fallback smart parsing from free-text npoTime if dedicated fields are not filled
  if (npoRaw) {
    if (waterHours === null) {
      const waterDurMatch = npoRaw.match(
        /(?:น้ำเปล่า|น้ำดื่ม|น้ำ|water|clear\s*fluid)\s*(?:ล่าสุด|งด|npo)?\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:ชม\.?|ชั่วโมง|hr|hrs|hour|hours)/i,
      );
      if (waterDurMatch) {
        const val = Number(waterDurMatch[1]);
        if (Number.isFinite(val) && val >= 0 && val <= 72) waterHours = Math.round(val * 10) / 10;
      } else if (opMinutes !== null) {
        const waterTimeMatch = npoRaw.match(
          /(?:น้ำเปล่า|น้ำดื่ม|น้ำ|water|clear\s*fluid)[^\d]{0,16}([01]?\d|2[0-4])[:.]([0-5]\d)/i,
        );
        if (waterTimeMatch) {
          const parsedMin = parseClockMinutes(`${waterTimeMatch[1]}:${waterTimeMatch[2]}`);
          if (parsedMin !== null) {
            waterHours = computeElapsedFastingHours(parsedMin, opMinutes);
          }
        }
      }
    }

    if (foodHours === null) {
      const foodDurMatch = npoRaw.match(
        /(?:อาหาร|ข้าว|meal|food|solid)\s*(?:ล่าสุด|งด|npo)?\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:ชม\.?|ชั่วโมง|hr|hrs|hour|hours)/i,
      );
      if (foodDurMatch) {
        const val = Number(foodDurMatch[1]);
        if (Number.isFinite(val) && val >= 0 && val <= 72) foodHours = Math.round(val * 10) / 10;
      } else {
        const genericDurMatch = npoRaw.match(
          /(?:^|\b)(?:npo|งดน้ำงดอาหาร|งดอาหารและน้ำ|งด)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:ชม\.?|ชั่วโมง|hr|hrs|hour|hours)/i,
        );
        if (genericDurMatch) {
          const val = Number(genericDurMatch[1]);
          if (Number.isFinite(val) && val >= 0 && val <= 72) foodHours = Math.round(val * 10) / 10;
        } else if (opMinutes !== null) {
          const foodTimeMatch = npoRaw.match(
            /(?:อาหาร|ข้าว|meal|food|solid)[^\d]{0,16}([01]?\d|2[0-4])[:.]([0-5]\d)/i,
          );
          if (foodTimeMatch) {
            const parsedMin = parseClockMinutes(`${foodTimeMatch[1]}:${foodTimeMatch[2]}`);
            if (parsedMin !== null) {
              foodHours = computeElapsedFastingHours(parsedMin, opMinutes);
            }
          } else if (!/^(?:น้ำเปล่า|น้ำดื่ม|น้ำ|water)/i.test(npoRaw)) {
            const genericStartMin = parseClockMinutes(npoRaw);
            if (genericStartMin !== null) {
              foodHours = computeElapsedFastingHours(genericStartMin, opMinutes);
            }
          }
        }
      }
    }
  }

  const isFoodFullStomach = foodHours !== null && foodHours < 8;
  const isWaterFullStomach = waterHours !== null && waterHours < 2;

  const npoCheckText = [npoRaw, history.presentIllness].filter(Boolean).join(' | ');
  const hasExplicitNotNpo =
    /\b(?:not\s+npo|non-?npo|full\s+stomach)\b|ไม่\s*npo|ไม่ได้\s*npo|งดน้ำงดอาหารไม่ครบ|เพิ่งทาน|เพิ่งรับประทาน/i.test(
      npoCheckText,
    );

  const isFullStomach = isFoodFullStomach || isWaterFullStomach || hasExplicitNotNpo;

  const detailParts: string[] = [];
  if (isFoodFullStomach && foodHours !== null) {
    detailParts.push(`NPO อาหาร ${formatFastingHours(foodHours)} ชม. (< 8 ชม.)`);
  }
  if (isWaterFullStomach && waterHours !== null) {
    detailParts.push(`NPO น้ำเปล่า ${formatFastingHours(waterHours)} ชม. (< 2 ชม.)`);
  }

  let problemText = '';
  if (detailParts.length > 0) {
    problemText = `Full stomach (${detailParts.join(', ')})`;
  } else if (hasExplicitNotNpo) {
    problemText = 'Full stomach / Not NPO';
  }

  return {
    operationMinutes: opMinutes,
    foodHours,
    waterHours,
    isFoodFullStomach,
    isWaterFullStomach,
    hasExplicitNotNpo,
    isFullStomach,
    problemText,
  };
}

/**
 * Re-evaluates Problem List from current patient data, removing stale or false-positive
 * auto-generated entries (e.g. negated CT findings) while preserving custom manual notes.
 */
export function refreshAutoProblems(record: PreAnestheticEvaluation): string[] {
  const freshAuto = generateAutoProblemEntries(record);
  const freshLowerSet = new Set(freshAuto.map((e) => e.text.toLowerCase()));
  const allLegacyPrefixes = freshAuto.flatMap((e) => e.legacyPrefixes);
  const invOtherLower = record.formData.investigation.other.trim().toLowerCase();
  const labOtherLower = record.formData.laboratory.other.trim().toLowerCase();

  const preservedManual: string[] = [];
  for (const rawLine of record.formData.problemList) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (freshLowerSet.has(lower)) continue;
    if (matchesLegacyPrefix(lower, allLegacyPrefixes)) continue;

    // Drop stale auto-combined clinical condition lines (e.g. "ICH / SDH / EDH, Active bleeding / UGIB")
    const parts = lower.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0 && parts.every((p) => KNOWN_AUTO_CONDITION_TOKENS.has(p))) {
      continue;
    }

    // Drop stale benign investigation.other or laboratory.other lines previously auto-inserted
    if (invOtherLower && lower === invOtherLower && !hasAbnormalClinicalClause(invOtherLower)) {
      continue;
    }
    if (labOtherLower && lower === labOtherLower && !hasAbnormalClinicalClause(labOtherLower)) {
      continue;
    }

    preservedManual.push(trimmed);
  }

  const merged = [...freshAuto.map((e) => e.text), ...preservedManual];
  return sortProblemListBySeverity(merged, freshAuto);
}

const BUILTIN_SAMPLE_CASES: ReadonlyArray<{ hn: string; namePrefix: string }> = [
  { hn: '67014521', namePrefix: 'นายสมชาย ใจดี' },
  { hn: '67028934', namePrefix: 'นางสาวกัญญา รักชาติ' },
  { hn: '66091205', namePrefix: 'นายประสิทธิ์ มั่นคง' },
  { hn: '67044190', namePrefix: 'ด.ช.ธนกฤต แสงทอง' },
  { hn: '65088213', namePrefix: 'นางสุภาพร วงศ์ใหญ่' },
];

export function isSampleEvaluationRecord(
  record: Pick<PreAnestheticEvaluation, 'id' | 'hn' | 'patientName'>,
): boolean {
  const id = (record.id || '').trim();
  if (/^sample_\d{2}_/i.test(id)) return true;

  const hn = (record.hn || '').trim();
  const name = (record.patientName || '').trim();
  if (!hn || !name) return false;

  return BUILTIN_SAMPLE_CASES.some(
    (sample) => sample.hn === hn && name.startsWith(sample.namePrefix),
  );
}

