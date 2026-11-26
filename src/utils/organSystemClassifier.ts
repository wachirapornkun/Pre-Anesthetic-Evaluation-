import {
  generateAutoProblemEntries,
  PreAnestheticEvaluation,
} from '../types/evaluation';

export type OrganSystemKey =
  | 'cardiovascular'
  | 'respiratory'
  | 'neurologic'
  | 'renal'
  | 'hepatobiliary_gi'
  | 'endocrine'
  | 'hematologic'
  | 'allergy_infectious'
  | 'other';

export interface OrganSystemMeta {
  key: OrganSystemKey;
  code: string;
  title: string;
  shortThai: string;
  thaiSubtitle: string;
  hexColor: string;
  accentBg: string;
  accentBorder: string;
  accentHeaderText: string;
  accentBar: string;
  accentSelectedRing: string;
}

/**
 * International Pre-Anesthetic Organ-System Taxonomy
 * Aligned with ASA Preanesthesia Evaluation Guidelines & Miller's / Morgan & Mikhail Review of Systems.
 */
export const ORGAN_SYSTEMS: OrganSystemMeta[] = [
  {
    key: 'cardiovascular',
    code: 'CVS',
    title: 'Cardiovascular',
    shortThai: 'หัวใจ/หลอดเลือด',
    thaiSubtitle: 'ระบบหัวใจและหลอดเลือด',
    hexColor: '#e11d48',
    accentBg: 'bg-rose-50/70',
    accentBorder: 'border-rose-200',
    accentHeaderText: 'text-rose-900',
    accentBar: 'bg-rose-500',
    accentSelectedRing: 'ring-2 ring-rose-500 border-rose-400',
  },
  {
    key: 'respiratory',
    code: 'RESP',
    title: 'Respiratory & Airway',
    shortThai: 'ทางเดินหายใจ',
    thaiSubtitle: 'ระบบทางเดินหายใจและ Airway',
    hexColor: '#0284c7',
    accentBg: 'bg-sky-50/70',
    accentBorder: 'border-sky-200',
    accentHeaderText: 'text-sky-900',
    accentBar: 'bg-sky-500',
    accentSelectedRing: 'ring-2 ring-sky-500 border-sky-400',
  },
  {
    key: 'neurologic',
    code: 'NEURO',
    title: 'Neurologic',
    shortThai: 'ประสาท/สมอง',
    thaiSubtitle: 'ระบบประสาทและสมอง',
    hexColor: '#7c3aed',
    accentBg: 'bg-violet-50/70',
    accentBorder: 'border-violet-200',
    accentHeaderText: 'text-violet-900',
    accentBar: 'bg-violet-500',
    accentSelectedRing: 'ring-2 ring-violet-500 border-violet-400',
  },
  {
    key: 'renal',
    code: 'RENAL',
    title: 'Renal & Electrolyte',
    shortThai: 'ไต/เกลือแร่',
    thaiSubtitle: 'ระบบไตและเกลือแร่',
    hexColor: '#0d9488',
    accentBg: 'bg-teal-50/70',
    accentBorder: 'border-teal-200',
    accentHeaderText: 'text-teal-900',
    accentBar: 'bg-teal-500',
    accentSelectedRing: 'ring-2 ring-teal-500 border-teal-400',
  },
  {
    key: 'hepatobiliary_gi',
    code: 'GI/HEP',
    title: 'Hepatobiliary & GI',
    shortThai: 'ตับ/GI',
    thaiSubtitle: 'ระบบตับ ทางเดินน้ำดี และ GI',
    hexColor: '#d97706',
    accentBg: 'bg-amber-50/70',
    accentBorder: 'border-amber-200',
    accentHeaderText: 'text-amber-900',
    accentBar: 'bg-amber-500',
    accentSelectedRing: 'ring-2 ring-amber-500 border-amber-400',
  },
  {
    key: 'endocrine',
    code: 'ENDO',
    title: 'Endocrine & Metabolic',
    shortThai: 'ต่อมไร้ท่อ/DM',
    thaiSubtitle: 'ระบบต่อมไร้ท่อและเมตาบอลิซึม',
    hexColor: '#ea580c',
    accentBg: 'bg-orange-50/70',
    accentBorder: 'border-orange-200',
    accentHeaderText: 'text-orange-900',
    accentBar: 'bg-orange-500',
    accentSelectedRing: 'ring-2 ring-orange-500 border-orange-400',
  },
  {
    key: 'hematologic',
    code: 'HEME',
    title: 'Hematologic & Coagulation',
    shortThai: 'เลือด/แข็งตัว',
    thaiSubtitle: 'ระบบเลือดและการแข็งตัวของเลือด',
    hexColor: '#dc2626',
    accentBg: 'bg-red-50/70',
    accentBorder: 'border-red-200',
    accentHeaderText: 'text-red-900',
    accentBar: 'bg-red-500',
    accentSelectedRing: 'ring-2 ring-red-500 border-red-400',
  },
  {
    key: 'allergy_infectious',
    code: 'ID/ALL',
    title: 'Allergy, Immune & Infectious',
    shortThai: 'แพ้ยา/ติดเชื้อ',
    thaiSubtitle: 'การแพ้ยา ภูมิคุ้มกัน และการติดเชื้อ',
    hexColor: '#059669',
    accentBg: 'bg-emerald-50/70',
    accentBorder: 'border-emerald-200',
    accentHeaderText: 'text-emerald-900',
    accentBar: 'bg-emerald-500',
    accentSelectedRing: 'ring-2 ring-emerald-500 border-emerald-400',
  },
  {
    key: 'other',
    code: 'OTHER',
    title: 'Obstetric, Functional & Other',
    shortThai: 'สูติฯ/อื่นๆ',
    thaiSubtitle: 'สูติกรรม · สมรรถภาพ · กระดูก · อื่นๆ',
    hexColor: '#475569',
    accentBg: 'bg-slate-50/85',
    accentBorder: 'border-slate-200',
    accentHeaderText: 'text-slate-900',
    accentBar: 'bg-slate-500',
    accentSelectedRing: 'ring-2 ring-slate-500 border-slate-400',
  },
];

export interface OrganSystemConditionCount {
  label: string;
  count: number;
}

export interface OrganSystemBucket {
  meta: OrganSystemMeta;
  patientCount: number;
  patientIds: Set<string>;
  conditions: OrganSystemConditionCount[];
}

interface ClassificationRule {
  system: OrganSystemKey;
  label: string;
  re: RegExp;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  // ---- 1. CARDIOVASCULAR ----
  {
    system: 'cardiovascular',
    label: 'Hypertension (HT)',
    re: /\b(?:ht|htn|hypertension|uncontrolled\s+ht|high\s+bp)\b|ความดัน(?:โลหิต)?สูง/i,
  },
  {
    system: 'cardiovascular',
    label: 'Heart Failure / Low EF',
    re: /\b(?:chf|hfref|hfpef|heart\s+failure|low\s+ef|lvef\s*[<≤]?\s*\d+|ef\s*[<≤]\s*50|cardiomyopathy)\b|หัวใจล้มเหลว|หัวใจวาย/i,
  },
  {
    system: 'cardiovascular',
    label: 'CAD / IHD / ACS / Heart Disease',
    re: /\b(?:cad|ihd|acs|nstemi|stemi|mi\b|myocardial\s+infarction|old\s+mi|angina|cabg|pci|coronary|stent|heart\s+disease|ischemic\s+heart)\b|โรคหัวใจ|หลอดเลือดหัวใจ/i,
  },
  {
    system: 'cardiovascular',
    label: 'Arrhythmia / AF',
    re: /\b(?:af|a\.?\s*fib|atrial\s+fibrillation|arrhythmia|svt|vt\b|pvc|av\s+block|bradycardia|tachycardia|pacemaker|aicd|lbbb|rbbb|af\s+with\s+rvr)\b|หัวใจเต้นผิดจังหวะ/i,
  },
  {
    system: 'cardiovascular',
    label: 'Chest Pain',
    re: /\bchest\s+pain\b|เจ็บหน้าอก|แน่นหน้าอก/i,
  },
  {
    system: 'cardiovascular',
    label: 'Valvular Heart Disease / Murmur',
    re: /\b(?:valvular|aortic\s+stenosis|mitral\s+regurgitation|mitral\s+stenosis|aortic\s+regurgitation|tricuspid\s+regurgitation|severe\s+(?:as|mr|ms|ar|tr)|murmur)\b|ลิ้นหัวใจ/i,
  },
  {
    system: 'cardiovascular',
    label: 'Vascular / PE / Aortic / EKG Abnormality',
    re: /\b(?:aortic\s+aneurysm|aortic\s+dissection|aaa\b|tamponade|pericardial\s+effusion|cardiomegaly|pulmonary\s+embolism|dvt\b|abnormal\s+ekg|ekg\b|lvh\b|st\s*(?:elevat|depress|change)|shock|hypotension)\b|เส้นเลือดใหญ่โป่งพอง|ลิ่มเลือดอุดตัน/i,
  },

  // ---- 2. RESPIRATORY & AIRWAY ----
  {
    system: 'respiratory',
    label: 'Asthma (หอบหืด)',
    re: /\basthma\b|หอบหืด/i,
  },
  {
    system: 'respiratory',
    label: 'COPD / Emphysema',
    re: /\b(?:copd|emphysema|chronic\s+bronchitis)\b|ถุงลมโป่งพอง|ปอดอุดกั้น/i,
  },
  {
    system: 'respiratory',
    label: 'OSA (Sleep Apnea)',
    re: /\b(?:osa|obstructive\s+sleep\s+apnea|sleep\s+apnea)\b|หยุดหายใจขณะหลับ/i,
  },
  {
    system: 'respiratory',
    label: 'Pneumonia (ปอดอักเสบ)',
    re: /\b(?:pneumonia|pneumonitis|lung\s+infection|aspiration\s+pneumonia)\b|ปอดอักเสบ|ปอดติดเชื้อ/i,
  },
  {
    system: 'respiratory',
    label: 'Tuberculosis (TB)',
    re: /\b(?:pulmonary\s+tb|tb\b|tuberculosis)\b|วัณโรค/i,
  },
  {
    system: 'respiratory',
    label: 'Pleural Effusion / Pneumothorax',
    re: /\b(?:pleural\s+effusion|pneumothorax|hemothorax|hydropneumothorax)\b|น้ำใน(?:ช่อง)?เยื่อหุ้มปอด|ลมรั่วในปอด/i,
  },
  {
    system: 'respiratory',
    label: 'Respiratory Failure / O2 / Ventilator',
    re: /\b(?:respiratory\s+failure|ards\b|pulmonary\s+edema|hypoxia|desat|spo2\s*<|on\s+ett|intubat|ventilator|tracheostomy|o2\s+(?:cannula|mask|support)|oxygen)\b|น้ำท่วมปอด|หายใจล้มเหลว|ใส่ท่อช่วยหายใจ|เจาะคอ/i,
  },
  {
    system: 'respiratory',
    label: 'Dyspnea (หายใจเหนื่อย)',
    re: /\b(?:dyspnea|orthopnea|tachypnea|shortness\s+of\s+breath)\b|หายใจเหนื่อย|หอบเหนื่อย|หายใจลำบาก/i,
  },
  {
    system: 'respiratory',
    label: 'Difficult Airway / Airway Risk',
    re: /\b(?:difficult\s+airway|mallampati\s*(?:iii|iv|3|4)|tmd\s*<|limited\s+mouth|airway\s+compression|tracheal\s+deviation|loose\s+tooth|upper\s+airway)\b|ใส่ท่อยาก|ทางเดินหายใจ/i,
  },
  {
    system: 'respiratory',
    label: 'Abnormal Lung / CXR',
    re: /\b(?:wheezing|crepitation|rhonchi|stridor|atelectasis|bronchiectasis|ild\b|lung\s+mass|ca\s+lung|infiltration|abnormal\s+cxr|cxr\b|breath\s+sound)\b|ปอดผิดปกติ|ก้อนที่ปอด|มะเร็งปอด/i,
  },
  {
    system: 'respiratory',
    label: 'Active Smoking',
    re: /\b(?:smoking|smoker)\b|สูบบุหรี่/i,
  },

  // ---- 3. NEUROLOGIC ----
  {
    system: 'neurologic',
    label: 'ICH / SDH / EDH / SAH / TBI',
    re: /\b(?:ich\b|sdh\b|edh\b|sah\b|ivh\b|subdural|epidural\s+hematoma|subarachnoid|intracranial\s+hemorrhage|intraparenchymal|cerebral\s+hemorrhage|head\s+injury|tbi\b)\b|เลือดออกในสมอง|บาดเจ็บศีรษะ/i,
  },
  {
    system: 'neurologic',
    label: 'Stroke / CVA / TIA',
    re: /\b(?:cva\b|stroke|tia\b|cerebral\s+infarct|ischemic\s+stroke|hemiparesis|hemiplegia)\b|อัมพฤกษ์|อัมพาต|หลอดเลือดสมอง|เส้นเลือดสมอง/i,
  },
  {
    system: 'neurologic',
    label: 'Brain Edema / Midline Shift / ICP',
    re: /\b(?:brain\s+edema|cerebral\s+edema|midline\s+shift|increased\s+icp|icp\b|herniation|hydrocephalus)\b|สมองบวม|ความดันในกะโหลก/i,
  },
  {
    system: 'neurologic',
    label: 'Seizure / Epilepsy',
    re: /\b(?:seizure|epilepsy|status\s+epilepticus|convulsion)\b|ลมชัก|อาการชัก/i,
  },
  {
    system: 'neurologic',
    label: 'Brain Tumor / Mass',
    re: /\b(?:brain\s+tumor|brain\s+mass|intracranial\s+mass|glioma|meningioma|pituitary)\b|เนื้องอกสมอง|ก้อนในสมอง/i,
  },
  {
    system: 'neurologic',
    label: 'C-Spine / Spinal Cord Injury',
    re: /\b(?:c-?spine|cervical\s+spine|spinal\s+cord|myelopathy|cord\s+compression|paraplegia|quadriplegia)\b|กระดูกคอ|ไขสันหลัง/i,
  },
  {
    system: 'neurologic',
    label: 'Neuromuscular / Altered Consciousness',
    re: /\b(?:parkinson|dementia|alzheimer|myasthenia\s+gravis|gbs\b|neuropathy|gcs\s*[<≤]?\s*\d+|drowsy|stupor|coma|alteration\s+of\s+consciousness|delirium)\b|พาร์กินสัน|สมองเสื่อม|กล้ามเนื้ออ่อนแรง|ซึม|ไม่รู้สึกตัว|ระบบประสาท/i,
  },

  // ---- 4. RENAL & ELECTROLYTE ----
  {
    system: 'renal',
    label: 'CKD / ESRD / Dialysis',
    re: /\b(?:ckd\b|esrd\b|dialysis|hemodialysis|hd\b|capd\b|chronic\s+kidney)\b|โรคไต(?:เรื้อรัง)?|ไตวายเรื้อรัง|ฟอกไต/i,
  },
  {
    system: 'renal',
    label: 'AKI / Elevated Cr / Low eGFR',
    re: /\b(?:aki\b|acute\s+kidney|renal\s+impairment|renal\s+failure|egfr|creatinine|\bcr\s*[>≥]|bun\s*[>≥])/i,
  },
  {
    system: 'renal',
    label: 'AKI / Elevated Cr / Low eGFR',
    re: /ไตวายเฉียบพลัน|ค่าไตสูง/i,
  },
  {
    system: 'renal',
    label: 'Hydronephrosis / Obstructive Uropathy',
    re: /\b(?:hydronephrosis|hydroureter|obstructive\s+uropathy|renal\s+stone|urolithiasis)\b|กรวยไตบวมน้ำ|นิ่วในไต/i,
  },
  {
    system: 'renal',
    label: 'Electrolyte Imbalance (K / Na / Ca)',
    re: /\b(?:hypokalemia|hyperkalemia|hypo\s*k|hyper\s*k|hyponatremia|hypernatremia|hypocalcemia|hypercalcemia|electrolyte)\b|เกลือแร่ผิดปกติ|โพแทสเซียม/i,
  },
  {
    system: 'renal',
    label: 'Acid-Base Imbalance / Acidosis',
    re: /\b(?:acidosis|alkalosis|hco3\s*[<≤]|low\s+hco3|lactate)\b|เลือดเป็นกรด/i,
  },

  // ---- 5. HEPATOBILIARY & GI ----
  {
    system: 'hepatobiliary_gi',
    label: 'Cirrhosis (ตับแข็ง)',
    re: /\b(?:cirrhosis|child-?pugh|child\s*[abc]|portal\s+hypertension|esophageal\s+varices)\b|ตับแข็ง/i,
  },
  {
    system: 'hepatobiliary_gi',
    label: 'Hepatitis (HBV / HCV)',
    re: /\b(?:hepatitis|hbv|hcv|hbsag|anti-?hcv)\b|ตับอักเสบ|ไวรัสตับ/i,
  },
  {
    system: 'hepatobiliary_gi',
    label: 'Liver / Biliary Mass (HCC / CCA)',
    re: /\b(?:hcc\b|hepatoma|liver\s+mass|hepatic\s+mass|ca\s+liver|cholangiocarcinoma|cca\b)\b|มะเร็งตับ|ก้อนที่ตับ|มะเร็งท่อน้ำดี/i,
  },
  {
    system: 'hepatobiliary_gi',
    label: 'Gallstone / Cholecystitis / Cholangitis',
    re: /\b(?:gallstone|gs\b|cholecystitis|cholangitis|cbd\s+stone|choledocholithiasis|biliary|obstructive\s+jaundice)\b|นิ่ว(?:ใน)?ถุงน้ำดี|ถุงน้ำดีอักเสบ|ท่อน้ำดี/i,
  },
  {
    system: 'hepatobiliary_gi',
    label: 'Fatty Liver (NAFLD)',
    re: /\b(?:fatty\s+liver|nafld|nash)\b|ไขมันพอกตับ/i,
  },
  {
    system: 'hepatobiliary_gi',
    label: 'Hepatic Dysfunction / Abnormal LFT',
    re: /\b(?:jaundice|hyperbilirubinemia|bilirubin|transaminitis|lft\b|ast\b|alt\b|liver\s+failure|hepatic\s+encephalopathy|hepatic|ascites|hepatomegaly)\b|ดีซ่าน|โรคตับ|ตับวาย|ค่าตับ/i,
  },
  {
    system: 'hepatobiliary_gi',
    label: 'GI / Aspiration Risk (GERD / UGIB / Obstruction)',
    re: /\b(?:gerd\b|ugib\b|lgib\b|gi\s+bleed|peptic\s+ulcer|bowel\s+obstruction|gut\s+obstruction|pneumoperitoneum|bowel\s+ischemia|perforated|full\s+stomach|aspiration\s+risk|pancreatitis|npo)\b|กรดไหลย้อน|เลือดออกในทางเดินอาหาร|ลำไส้อุดตัน|ลำไส้ทะลุ|ตับอ่อนอักเสบ/i,
  },

  // ---- 6. ENDOCRINE & METABOLIC ----
  {
    system: 'endocrine',
    label: 'Diabetes Mellitus (DM)',
    re: /\b(?:dm\b|diabetes|dka\b|hhs\b|hyperglycemia|hypoglycemia|dtx|fbs|hba1c)\b|เบาหวาน/i,
  },
  {
    system: 'endocrine',
    label: 'Dyslipidemia (DLP)',
    re: /\b(?:dlp\b|dyslipidemia|hyperlipidemia)\b|ไขมันในเลือดสูง/i,
  },
  {
    system: 'endocrine',
    label: 'Thyroid Disease',
    re: /\b(?:thyroid|hyperthyroid|hypothyroid|graves|goiter|thyrotoxicosis)\b|ไทรอยด์/i,
  },
  {
    system: 'endocrine',
    label: 'Obesity / High BMI',
    re: /\b(?:obesity|obese|morbid\s+obesity|bmi\s*[>≥])\b|โรคอ้วน/i,
  },
  {
    system: 'endocrine',
    label: 'Adrenal / Steroid / Metabolic',
    re: /\b(?:adrenal|cushing|pheochromocytoma|steroid\s+use|gout|hyperuricemia|malnutrition)\b|เกาต์|สเตียรอยด์/i,
  },

  // ---- 7. HEMATOLOGIC & COAGULATION ----
  {
    system: 'hematologic',
    label: 'Anemia / Low Hb–Hct / Thalassemia',
    re: /\b(?:anemia|anaemia|low\s+hb|low\s+hct|hb\s*[<≤]|hct\s*[<≤]|thalassemia|g6pd)\b|โลหิตจาง|ภาวะซีด|ธาลัสซีเมีย/i,
  },
  {
    system: 'hematologic',
    label: 'Thrombocytopenia / Low Platelet',
    re: /\b(?:thrombocytopenia|low\s+plt|low\s+platelet|plt\s*[<≤]|itp\b)\b|เกล็ดเลือดต่ำ/i,
  },
  {
    system: 'hematologic',
    label: 'Coagulopathy / High INR',
    re: /\b(?:coagulopathy|dic\b|hemophilia|inr\s*[>≥]|prolonged\s+(?:pt|ptt|aptt))\b|การแข็งตัวของเลือดผิดปกติ/i,
  },
  {
    system: 'hematologic',
    label: 'Anticoagulant / Antiplatelet Use',
    re: /\b(?:warfarin|aspirin|asa\s+drug|clopidogrel|plavix|ticagrelor|antiplatelet|anticoagulant|noac|doac|rivaroxaban|apixaban|dabigatran|enoxaparin|heparin)\b|ยาละลายลิ่มเลือด|ยาต้านเกล็ดเลือด/i,
  },

  // ---- 8. ALLERGY, IMMUNE & INFECTIOUS ----
  {
    system: 'allergy_infectious',
    label: 'Drug / Food Allergy',
    re: /\ballerg(?:y|ic)\b|anaphylaxis|แพ้ยา|แพ้อาหาร/i,
  },
  {
    system: 'allergy_infectious',
    label: 'Sepsis / Septic Shock',
    re: /\b(?:sepsis|septic\s+shock|septicemia|bacteremia)\b|ติดเชื้อในกระแสเลือด/i,
  },
  {
    system: 'allergy_infectious',
    label: 'HIV / Immunocompromised',
    re: /\b(?:hiv\b|anti-?hiv|aids\b|immunocompromised|neutropenia|chemotherapy)\b/i,
  },
  {
    system: 'allergy_infectious',
    label: 'Active Infection / Abscess / Necrotizing',
    re: /\b(?:infection|abscess|cellulitis|necrotizing|gangrene|osteomyelitis|febrile|fever)\b|ติดเชื้อ|ฝีหนอง|เนื้อตาย/i,
  },
  {
    system: 'allergy_infectious',
    label: 'Autoimmune (SLE / RA)',
    re: /\b(?:sle\b|lupus|rheumatoid|autoimmune|vasculitis|scleroderma)\b|ภูมิคุ้มกันทำลายตนเอง|พุ่มพวง/i,
  },

  // ---- 9. OBSTETRIC, FUNCTIONAL & OTHER ----
  {
    system: 'other',
    label: 'Pregnancy / Obstetric Risk',
    re: /\b(?:pregnan|preeclampsia|eclampsia|ght\b|gdm\b|placenta\s+previa|hellp)\b|ตั้งครรภ์|ครรภ์เป็นพิษ/i,
  },
  {
    system: 'other',
    label: 'Poor Functional Capacity (< 4 METs)',
    re: /\b(?:poor\s+fc|fc\s*<\s*4|<\s*4\s*met|bedridden)\b|ติดเตียง|ช่วยเหลือตัวเองไม่ได้/i,
  },
  {
    system: 'other',
    label: 'Alcohol / Substance Dependence',
    re: /\b(?:alcohol(?:ism)?|cirrhotic|drug\s+addict|substance|amphetamine|opioid\s+depend)\b|ติดสุรา|ติดเหล้า|สารเสพติด/i,
  },
  {
    system: 'other',
    label: 'Malignancy / Intra-abdominal Mass',
    re: /\b(?:malignancy|cancer|carcinoma|ca\s+\w+|tumor|intra-?abdominal|pelvic\s+mass|metastasis)\b|มะเร็ง|ก้อนในช่องท้อง/i,
  },
  {
    system: 'other',
    label: 'Psychiatric / Cognitive',
    re: /\b(?:schizophrenia|depression|bipolar|psychiatric|anxiety)\b|จิตเวช|ซึมเศร้า/i,
  },
];

const IGNORE_TOKEN_RE =
  /^(?:none|nil|no|n\/a|na|normal|wnl|clear|negative|ok|ไม่มี|ปกติ|-+|—+)$/i;

function stripLeadingPrefix(raw: string): string {
  return raw
    .replace(/^\s*(?:\d+[.)]\s*|[-•*]\s*)/, '')
    .replace(
      /^(?:underlying|u\/d|ud|risk(?:\s*\([^)]*\))?|airway|cardiopulm(?:\/inv)?|lab|ct|neuro|problem|other|inv|investigation)\s*:\s*/i,
      '',
    )
    .trim();
}

function splitClinicalTokens(raw: string): string[] {
  const cleaned = stripLeadingPrefix(raw);
  if (!cleaned) return [];

  // Split on semicolons, newlines, or commas outside parentheses
  const tokens: string[] = [];
  let buf = '';
  let parenDepth = 0;
  for (let i = 0; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    if (ch === '(') parenDepth += 1;
    else if (ch === ')' && parenDepth > 0) parenDepth -= 1;

    if ((ch === '\n' || ch === ';' || (ch === ',' && parenDepth === 0)) && buf.trim()) {
      tokens.push(buf.trim());
      buf = '';
    } else if (ch !== '\n' && ch !== ';' && !(ch === ',' && parenDepth === 0)) {
      buf += ch;
    }
  }
  if (buf.trim()) tokens.push(buf.trim());

  return tokens
    .map((t) => stripLeadingPrefix(t))
    .filter((t) => t.length >= 2 && !IGNORE_TOKEN_RE.test(t));
}

function classifySingleToken(token: string): { system: OrganSystemKey; label: string } {
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.re.test(token)) {
      return { system: rule.system, label: rule.label };
    }
  }
  const compact = token.replace(/\s+/g, ' ').trim();
  return {
    system: 'other',
    label: compact.length > 48 ? `${compact.slice(0, 45)}...` : compact,
  };
}

export interface PatientOrganProfile {
  systems: Set<OrganSystemKey>;
  itemsBySystem: Record<OrganSystemKey, Set<string>>;
}

function createEmptySystemMap<T>(factory: () => T): Record<OrganSystemKey, T> {
  return {
    cardiovascular: factory(),
    respiratory: factory(),
    neurologic: factory(),
    renal: factory(),
    hepatobiliary_gi: factory(),
    endocrine: factory(),
    hematologic: factory(),
    allergy_infectious: factory(),
    other: factory(),
  };
}

export function extractPatientOrganProfile(record: PreAnestheticEvaluation): PatientOrganProfile {
  const itemsBySystem = createEmptySystemMap(() => new Set<string>());

  const addItem = (system: OrganSystemKey, label: string) => {
    const clean = label.trim();
    if (!clean) return;
    itemsBySystem[system].add(clean);
  };

  const h = record.formData?.history;
  const pe = record.formData?.physicalExam;

  // 1. Structured underlying diseases & clinical risk factors
  if (h?.ht) addItem('cardiovascular', 'Hypertension (HT)');
  if (h?.heartDisease) {
    const detail = (h.heartDiseaseDetail || '').trim();
    if (detail) {
      const tokens = splitClinicalTokens(detail);
      let matchedSpecific = false;
      for (const tok of tokens) {
        const res = classifySingleToken(tok);
        if (res.system === 'cardiovascular') {
          addItem('cardiovascular', res.label);
          matchedSpecific = true;
        }
      }
      if (!matchedSpecific) {
        addItem('cardiovascular', 'CAD / IHD / ACS / Heart Disease');
      }
    } else {
      addItem('cardiovascular', 'CAD / IHD / ACS / Heart Disease');
    }
  }
  if (pe?.chestPainStatus === 'yes') {
    addItem('cardiovascular', 'Chest Pain');
  }

  if (pe?.dyspneaStatus === 'yes') {
    addItem('respiratory', 'Dyspnea (หายใจเหนื่อย)');
  }
  if (h?.smokingStatus === 'yes') {
    addItem('respiratory', 'Active Smoking');
  }
  if (
    record.expectedDifficultAirway ||
    pe?.mallampatiClass === 'III' ||
    pe?.mallampatiClass === 'IV'
  ) {
    addItem('respiratory', 'Difficult Airway / Airway Risk');
  }

  if (h?.ckd) addItem('renal', 'CKD / ESRD / Dialysis');
  if (h?.dm) addItem('endocrine', 'Diabetes Mellitus (DM)');
  if (h?.dlp) addItem('endocrine', 'Dyslipidemia (DLP)');
  if (h?.allergyStatus === 'yes') addItem('allergy_infectious', 'Drug / Food Allergy');

  // 2. Free-text underlying diseases (otherUnderlying + underlyingDetail)
  const rawUnderlyingTexts: string[] = [
    ...(h?.otherUnderlying ?? []),
    h?.underlyingDetail ?? '',
  ];
  for (const text of rawUnderlyingTexts) {
    for (const tok of splitClinicalTokens(text)) {
      const res = classifySingleToken(tok);
      addItem(res.system, res.label);
    }
  }

  // 3. Problem list (user-edited problemList if present, else auto-generated problems)
  const editedProblems = (record.formData?.problemList ?? [])
    .map((p) => p.trim())
    .filter(Boolean);
  const problemLines =
    editedProblems.length > 0
      ? editedProblems
      : generateAutoProblemEntries(record).map((e) => e.text);

  for (const line of problemLines) {
    for (const tok of splitClinicalTokens(line)) {
      const res = classifySingleToken(tok);
      addItem(res.system, res.label);
    }
  }

  const systems = new Set<OrganSystemKey>();
  for (const meta of ORGAN_SYSTEMS) {
    if (itemsBySystem[meta.key].size > 0) {
      systems.add(meta.key);
    }
  }

  return { systems, itemsBySystem };
}

export function buildOrganSystemSummary(records: PreAnestheticEvaluation[]): {
  buckets: OrganSystemBucket[];
  profileById: Map<string, PatientOrganProfile>;
  patientsWithAnyProblem: number;
} {
  const profileById = new Map<string, PatientOrganProfile>();
  const conditionCountsBySystem = createEmptySystemMap(() => new Map<string, number>());
  const patientIdsBySystem = createEmptySystemMap(() => new Set<string>());

  let patientsWithAnyProblem = 0;

  for (const r of records) {
    const profile = extractPatientOrganProfile(r);
    profileById.set(r.id, profile);

    if (profile.systems.size > 0) {
      patientsWithAnyProblem += 1;
    }

    for (const meta of ORGAN_SYSTEMS) {
      const items = profile.itemsBySystem[meta.key];
      if (items.size > 0) {
        patientIdsBySystem[meta.key].add(r.id);
        const map = conditionCountsBySystem[meta.key];
        items.forEach((label) => {
          map.set(label, (map.get(label) || 0) + 1);
        });
      }
    }
  }

  const buckets: OrganSystemBucket[] = ORGAN_SYSTEMS.map((meta) => {
    const conditions = Array.from(conditionCountsBySystem[meta.key].entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'th'));
    return {
      meta,
      patientCount: patientIdsBySystem[meta.key].size,
      patientIds: patientIdsBySystem[meta.key],
      conditions,
    };
  });

  return { buckets, profileById, patientsWithAnyProblem };
}
