import React, { useMemo } from 'react';
import {
  ArrowRight,
  FileEdit,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import {
  AsaClass,
  BLOOD_GROUP_OPTIONS,
  BLOOD_PREP_STATUS_OPTIONS,
  BloodPrepStatus,
  calculateBmi,
  computeBloodGasPfRatio,
  CONSULT_TYPE_OPTIONS,
  ConsultType,
  deriveAnesthesiaType,
  DurationUnit,
  formatPostponementReasons,
  formatPreOpNotVisitedReasons,
  formatThaiDateBE,
  formatToothMarksSummary,
  GaMethod,
  inferPatientGender,
  LaboratoryData,
  OR_ROOM_OPTIONS,
  PreAnestheticEvaluation,
  RaMethod,
  refreshAutoProblems,
  syncProblemListWithPatientData,
  ToothCondition,
  ToothId,
  TriStatus,
  UnderlyingControlStatus,
} from '../types/evaluation';
import {
  BphLogo,
  CbcFishbone,
  ChemFishbone,
  DentalArchBadge,
  MallampatiSelector,
} from './MedicalDiagrams';
import { ThaiDateInput } from './ThaiDateInput';
import { Time24Input } from './Time24Input';

interface EditableA4PreOpSheetProps {
  value: PreAnestheticEvaluation;
  onChange: (next: PreAnestheticEvaluation) => void;
  wardOptions: string[];
  specialtyOptions: string[];
  surgeonOptions: string[];
  summarizerOptions: string[];
  onSwitchToDetailedForm: () => void;
  onGoToPostOp: () => void;
  onPrintPreOp: () => void;
  onSave: () => void;
  isSaving: boolean;
  isSaved: boolean;
}

const inlineInputBase =
  'bg-transparent border-b border-dotted border-slate-600 px-1 py-0 text-slate-950 font-semibold leading-[1.25] hover:bg-blue-50/50 focus:bg-blue-50/80 focus:border-solid focus:border-blue-700 focus:outline-none rounded-t-[2px] transition-colors';

const inlineTextareaBase =
  'w-full bg-transparent border border-dotted border-slate-400 rounded-[2px] px-1.5 py-0.5 text-slate-950 leading-[1.38] hover:bg-blue-50/40 focus:bg-blue-50/70 focus:border-solid focus:border-blue-700 focus:outline-none resize-y transition-colors';

export function EditableA4PreOpSheet({
  value,
  onChange: emitChange,
  wardOptions,
  specialtyOptions,
  surgeonOptions,
  summarizerOptions,
  onSwitchToDetailedForm,
  onGoToPostOp,
  onPrintPreOp,
  onSave,
  isSaving,
  isSaved,
}: EditableA4PreOpSheetProps) {
  const onChange = (next: PreAnestheticEvaluation) => {
    const syncedProblems = syncProblemListWithPatientData(value, next);
    if (syncedProblems !== next.formData.problemList) {
      emitChange({
        ...next,
        formData: {
          ...next.formData,
          problemList: syncedProblems,
        },
      });
    } else {
      emitChange(next);
    }
  };

  const fd = value.formData;
  const h = fd.history;
  const p = fd.physicalExam;
  const inv = fd.investigation;
  const lab = fd.laboratory;
  const pm = fd.premedication;
  const ap = fd.anestheticPlan;
  const pa = fd.postAnesthesia;

  const updateTop = (patch: Partial<PreAnestheticEvaluation>) => {
    onChange({ ...value, ...patch });
  };

  const updateFormData = (patch: Partial<PreAnestheticEvaluation['formData']>) => {
    onChange({
      ...value,
      formData: {
        ...fd,
        ...patch,
      },
    });
  };

  const updateHistory = (patch: Partial<typeof h>) => {
    updateFormData({ history: { ...h, ...patch } });
  };

  const updateExam = (patch: Partial<typeof p>) => {
    const nextPe = { ...p, ...patch };
    if ('bw' in patch || 'ht' in patch) {
      nextPe.bmi = calculateBmi(nextPe.bw, nextPe.ht);
    }
    const nextTopDifficult =
      'expectedDifficultAirway' in patch
        ? nextPe.expectedDifficultAirway === 'yes'
        : value.expectedDifficultAirway;
    onChange({
      ...value,
      expectedDifficultAirway: nextTopDifficult,
      formData: {
        ...fd,
        physicalExam: nextPe,
      },
    });
  };

  const updateInvestigation = (patch: Partial<typeof inv>) => {
    updateFormData({ investigation: { ...inv, ...patch } });
  };

  const updateLab = (patch: Partial<LaboratoryData>) => {
    updateFormData({ laboratory: { ...lab, ...patch } });
  };

  const updatePremed = (patch: Partial<typeof pm>) => {
    updateFormData({ premedication: { ...pm, ...patch } });
  };

  const updatePlan = (patch: Partial<typeof ap>) => {
    const nextPlan = { ...ap, ...patch };
    onChange({
      ...value,
      anesthesiaType: deriveAnesthesiaType(nextPlan),
      formData: {
        ...fd,
        anestheticPlan: nextPlan,
      },
    });
  };

  const updatePostAnes = (patch: Partial<typeof pa>) => {
    updateFormData({ postAnesthesia: { ...pa, ...patch } });
  };

  const handleToggleToothMark = (toothId: ToothId) => {
    const missing = p.missingTeeth || [];
    const loose = p.looseTeeth || [];
    const isMissing = missing.includes(toothId);
    const isLoose = loose.includes(toothId);

    let nextMissing = missing.filter((id) => id !== toothId);
    let nextLoose = loose.filter((id) => id !== toothId);

    if (!isMissing && !isLoose) {
      nextMissing = [...nextMissing, toothId];
    } else if (isMissing) {
      nextLoose = [...nextLoose, toothId];
    }
    updateExam({ missingTeeth: nextMissing, looseTeeth: nextLoose });
  };

  const cycleControl = (cur?: UnderlyingControlStatus): UnderlyingControlStatus => {
    if (!cur) return 'good';
    if (cur === 'good') return 'poor';
    return '';
  };

  const radioMark = (
    active: boolean,
    text: string,
    onClick: () => void,
    opts?: { keyProp?: string; danger?: boolean },
  ) => (
    <button
      key={opts?.keyProp}
      type="button"
      onClick={onClick}
      className={`inline-flex items-baseline gap-0.5 mr-1.5 px-0.5 rounded-[2px] cursor-pointer transition-colors hover:bg-blue-100/70 whitespace-nowrap ${
        active && opts?.danger ? 'text-red-700' : 'text-slate-950'
      }`}
    >
      <span className="font-mono shrink-0">{active ? '●' : '○'}</span>
      <span className={active ? 'font-bold underline' : ''}>{text}</span>
    </button>
  );

  const checkBox = (
    active: boolean,
    text: string,
    onClick: () => void,
    keyProp?: string,
  ) => (
    <button
      key={keyProp}
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-0.5 mr-1.5 px-0.5 rounded-[2px] cursor-pointer transition-colors hover:bg-blue-100/70 whitespace-nowrap text-slate-950"
    >
      <span className="font-mono">{active ? '☑' : '☐'}</span>
      <span className={active ? 'font-bold' : ''}>{text}</span>
    </button>
  );

  // Ensure minimum visible dotted rows matching the real A4 paper document
  const otherUdRows = useMemo(() => {
    const arr = Array.isArray(h.otherUnderlying) ? h.otherUnderlying : [];
    const targetLen = Math.max(2, arr.length);
    return Array.from({ length: targetLen }, (_, i) => arr[i] ?? '');
  }, [h.otherUnderlying]);

  const prevOpRows = useMemo(() => {
    const arr = Array.isArray(h.previousOps) ? h.previousOps : [];
    const targetLen = Math.max(4, arr.length);
    return Array.from({ length: targetLen }, (_, i) => arr[i] ?? '');
  }, [h.previousOps]);

  const premedRows = useMemo(() => {
    const arr = Array.isArray(pm.items) ? pm.items : [];
    const targetLen = Math.max(4, arr.length);
    return Array.from({ length: targetLen }, (_, i) => arr[i] ?? '');
  }, [pm.items]);

  const problemRows = useMemo(() => {
    const arr = Array.isArray(fd.problemList) ? fd.problemList : [];
    const targetLen = Math.max(2, arr.length);
    return Array.from({ length: targetLen }, (_, i) => arr[i] ?? '');
  }, [fd.problemList]);

  const prepOrderRows = useMemo(() => {
    const arr = Array.isArray(fd.preparationOrders) ? fd.preparationOrders : [];
    const targetLen = Math.max(2, arr.length);
    return Array.from({ length: targetLen }, (_, i) => arr[i] ?? '');
  }, [fd.preparationOrders]);

  const pfRatio = computeBloodGasPfRatio(lab);
  const isVbg = lab.bgType === 'VBG';
  const isAbg = lab.bgType === 'ABG';
  const pco2Label = isVbg ? 'PvCO2' : isAbg ? 'PaCO2' : 'pCO2';
  const po2Label = isVbg ? 'PvO2' : isAbg ? 'PaO2' : 'pO2';
  const satLabel = isVbg ? 'SvO2' : isAbg ? 'SaO2' : 'O2Sat';

  const underlyingStdConfigs = [
    {
      flagKey: 'dm' as const,
      yearsKey: 'dmYears' as const,
      controlKey: 'dmControl' as const,
      detailKey: 'dmDetail' as const,
      label: 'DM',
    },
    {
      flagKey: 'ht' as const,
      yearsKey: 'htYears' as const,
      controlKey: 'htControl' as const,
      detailKey: 'htDetail' as const,
      label: 'HT',
    },
    {
      flagKey: 'dlp' as const,
      yearsKey: 'dlpYears' as const,
      controlKey: 'dlpControl' as const,
      detailKey: 'dlpDetail' as const,
      label: 'DLP',
    },
    {
      flagKey: 'ckd' as const,
      yearsKey: 'ckdYears' as const,
      controlKey: 'ckdControl' as const,
      detailKey: 'ckdDetail' as const,
      label: 'โรคไต',
    },
    {
      flagKey: 'heartDisease' as const,
      yearsKey: 'heartDiseaseYears' as const,
      controlKey: 'heartDiseaseControl' as const,
      detailKey: 'heartDiseaseDetail' as const,
      label: 'โรคหัวใจ',
    },
  ];

  const effectiveCbcDate = lab.cbcDate || (!lab.chemDate ? lab.labDate || '' : '');
  const effectiveChemDate = lab.chemDate || (!lab.cbcDate ? lab.labDate || '' : '');

  return (
    <div className="space-y-3">
      {/* Compact Utility Bar Above the Live Editable A4 Sheet */}
      <div className="no-print max-w-[860px] mx-auto bg-white border border-pblue-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-pblue-100 text-pblue-800 font-bold text-[11px]">
            เอกสารจริง (แก้ไขได้ทันที)
          </span>
          <span className="text-slate-600">
            คลิกพิมพ์บนเส้นประหรือแตะตัวเลือก ○ / ☐ เพื่อแก้ไขได้โดยตรงบนหน้าเอกสาร
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onSwitchToDetailedForm}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <FileEdit className="w-3.5 h-3.5 text-pblue-600" />
            แบบฟอร์มกรอกละเอียด
          </button>
          <button
            type="button"
            onClick={onPrintPreOp}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-ppink-800 bg-ppink-50 border border-ppink-200 rounded-lg hover:bg-ppink-100 transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5 text-ppink-600" />
            พิมพ์ A4
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-pblue-600 rounded-lg hover:bg-pblue-700 disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'กำลังบันทึก...' : isSaved ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}
          </button>
        </div>
      </div>

      {/* Datalists for Hospital Master Lists */}
      <datalist id="paper-ward-list">
        {wardOptions.map((w) => (
          <option key={w} value={w} />
        ))}
      </datalist>
      <datalist id="paper-specialty-list">
        {specialtyOptions.map((sp) => (
          <option key={sp} value={sp} />
        ))}
      </datalist>
      <datalist id="paper-surgeon-list">
        {surgeonOptions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <datalist id="paper-summarizer-list">
        {summarizerOptions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {/* REAL PRINT-READY A4 PAPER SHEET (FULLY EDITABLE IN PLACE) */}
      <div className="bg-white border border-slate-300 shadow-md mx-auto w-full max-w-[860px] p-4 sm:p-6 text-[11.5px] leading-[1.35] text-slate-950 rounded-xs">
        <div className="border-[1.5px] border-slate-900 flex flex-col">
          {/* Header — Identical to Bangplee Hospital Pre Anesthetic Evaluation form */}
          <div className="flex items-center justify-center gap-3 py-2 px-3 border-b-[1.5px] border-slate-900">
            <BphLogo className="w-9 h-9 shrink-0" />
            <div className="text-center">
              <div className="text-[15px] font-bold leading-tight">Bangplee Hospital</div>
              <div className="text-[12.5px] font-semibold leading-tight">
                Pre Anesthetic Evaluation form
              </div>
            </div>
          </div>

          {/* Demographics — Exact 3 structured rows, editable inline */}
          <div className="px-3 py-2 border-b border-slate-900 space-y-1.5">
            {/* Row 1: Name, Age, HN, AN, Ward, Bed, สาขา */}
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="inline-flex items-baseline gap-1 flex-1 min-w-[180px]">
                <span className="shrink-0">Name:</span>
                <input
                  type="text"
                  value={value.patientName}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    updateTop({
                      patientName: nextName,
                      gender: value.gender || inferPatientGender(nextName),
                    });
                  }}
                  placeholder="ชื่อ-นามสกุลผู้ป่วย"
                  className={`${inlineInputBase} flex-1 min-w-[130px]`}
                />
              </span>
              <span className="inline-flex items-baseline gap-1">
                <span>Age:</span>
                <input
                  type="text"
                  value={value.age}
                  onChange={(e) => updateTop({ age: e.target.value })}
                  className={`${inlineInputBase} w-10 text-center font-mono`}
                />
                <span>yr</span>
              </span>
              <span className="inline-flex items-baseline gap-1">
                <span>HN:</span>
                <input
                  type="text"
                  value={value.hn}
                  onChange={(e) => updateTop({ hn: e.target.value })}
                  className={`${inlineInputBase} w-20 text-center font-mono`}
                />
              </span>
              <span className="inline-flex items-baseline gap-1">
                <span>AN:</span>
                <input
                  type="text"
                  value={value.an}
                  onChange={(e) => updateTop({ an: e.target.value })}
                  className={`${inlineInputBase} w-20 text-center font-mono`}
                />
              </span>
              <span className="inline-flex items-baseline gap-1">
                <span>Ward:</span>
                <input
                  type="text"
                  list="paper-ward-list"
                  value={value.ward}
                  onChange={(e) => updateTop({ ward: e.target.value })}
                  placeholder="หอผู้ป่วย"
                  className={`${inlineInputBase} w-24 text-center`}
                />
              </span>
              <span className="inline-flex items-baseline gap-1">
                <span>เตียง:</span>
                <input
                  type="text"
                  value={value.bed || ''}
                  onChange={(e) => updateTop({ bed: e.target.value })}
                  className={`${inlineInputBase} w-10 text-center font-mono`}
                />
              </span>
              <span className="inline-flex items-baseline gap-1">
                <span>สาขา:</span>
                <input
                  type="text"
                  list="paper-specialty-list"
                  value={value.specialty || ''}
                  onChange={(e) => updateTop({ specialty: e.target.value })}
                  className={`${inlineInputBase} w-16 text-center`}
                />
              </span>
            </div>

            {/* Row 2: Diagnosis & Operation */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="flex-1 min-w-[230px] inline-flex items-baseline gap-1">
                <span className="shrink-0">Diagnosis:</span>
                <input
                  type="text"
                  value={value.diagnosis}
                  onChange={(e) => updateTop({ diagnosis: e.target.value })}
                  placeholder="ระบุการวินิจฉัยโรค"
                  className={`${inlineInputBase} flex-1 min-w-[160px]`}
                />
              </span>
              <span className="flex-1 min-w-[230px] inline-flex items-baseline gap-1">
                <span className="shrink-0">Operation:</span>
                <input
                  type="text"
                  value={value.operation}
                  onChange={(e) => updateTop({ operation: e.target.value })}
                  placeholder="ระบุหัตถการ / การผ่าตัด"
                  className={`${inlineInputBase} flex-1 min-w-[160px]`}
                />
              </span>
            </div>

            {/* Row 3: Date of visit, Date of operation, เวลา, Surgeon, ห้อง */}
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="inline-flex items-baseline gap-1">
                <span className="shrink-0">Date of visit:</span>
                <ThaiDateInput
                  value={value.dateOfVisit}
                  onChange={(next) => updateTop({ dateOfVisit: next })}
                  className={`${inlineInputBase} w-[92px] text-center font-mono text-[11px]`}
                />
              </span>
              <span className="inline-flex items-baseline gap-1">
                <span className="shrink-0">Date of operation:</span>
                <ThaiDateInput
                  value={value.dateOfOperation}
                  onChange={(next) => updateTop({ dateOfOperation: next })}
                  className={`${inlineInputBase} w-[92px] text-center font-mono text-[11px]`}
                />
              </span>
              <span className="inline-flex items-baseline gap-1">
                <span>เวลา:</span>
                <Time24Input
                  value={value.operationTime}
                  onChange={(next) => updateTop({ operationTime: next })}
                  className={`${inlineInputBase} w-[56px] text-center font-mono text-[11px]`}
                />
              </span>
              <span className="flex-1 min-w-[140px] inline-flex items-baseline gap-1">
                <span className="shrink-0">Surgeon:</span>
                <input
                  type="text"
                  list="paper-surgeon-list"
                  value={value.surgeon}
                  onChange={(e) => updateTop({ surgeon: e.target.value })}
                  className={`${inlineInputBase} flex-1 min-w-[90px]`}
                />
              </span>
              <span className="inline-flex items-baseline gap-1 shrink-0">
                <span>ห้อง:</span>
                <select
                  value={value.orRoom || ''}
                  onChange={(e) => updateTop({ orRoom: e.target.value })}
                  className={`${inlineInputBase} w-[68px] text-center font-mono text-[11px] cursor-pointer`}
                >
                  <option value="">—</option>
                  {OR_ROOM_OPTIONS.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
                <span>#</span>
                <input
                  type="text"
                  value={value.caseOrder || ''}
                  onChange={(e) => updateTop({ caseOrder: e.target.value })}
                  placeholder="คิว"
                  className={`${inlineInputBase} w-8 text-center font-mono`}
                />
              </span>
            </div>

            {fd.surgeryPostponement?.isPostponed && (
              <div className="flex items-center justify-between gap-2 text-[10.5px] text-amber-950 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-xs">
                <span>
                  <strong>เลื่อนวันผ่าตัด:</strong>{' '}
                  {fd.surgeryPostponement.originalDateOfOperation
                    ? `เดิม ${formatThaiDateBE(fd.surgeryPostponement.originalDateOfOperation)}`
                    : ''}
                  {fd.surgeryPostponement.postponedToDate
                    ? ` → ใหม่ ${formatThaiDateBE(fd.surgeryPostponement.postponedToDate)}`
                    : ' → ยังไม่ระบุวันใหม่'}
                  {formatPostponementReasons(fd.surgeryPostponement)
                    ? ` · เหตุผล: ${formatPostponementReasons(fd.surgeryPostponement)}`
                    : ''}
                </span>
                <button
                  type="button"
                  onClick={onSwitchToDetailedForm}
                  className="text-amber-900 underline font-semibold shrink-0"
                >
                  แก้ไข
                </button>
              </div>
            )}
            {fd.preOpNotVisited?.isNotVisited && (
              <div className="flex items-center justify-between gap-2 text-[10.5px] text-rose-950 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-xs">
                <span>
                  <strong>ฉบับร่าง (ไม่ได้เยี่ยม Pre-op):</strong>{' '}
                  {formatPreOpNotVisitedReasons(fd.preOpNotVisited) || 'ยังไม่ระบุเหตุผล'}
                </span>
                <button
                  type="button"
                  onClick={onSwitchToDetailedForm}
                  className="text-rose-900 underline font-semibold shrink-0"
                >
                  แก้ไข
                </button>
              </div>
            )}
          </div>

          {/* Two Columns — Exact Bangplee Hospital 2-Column Paper Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-900">
            {/* LEFT COLUMN: 1. History, 3. Investigation, 5. Premedication */}
            <div className="md:border-r border-slate-900 flex flex-col divide-y divide-slate-900 min-w-0">
              {/* 1. History */}
              <div className="p-2.5 space-y-1.5 min-w-0">
                <div className="font-bold text-[12px]">1. History</div>

                {/* 1.1 Present illness */}
                <div className="space-y-0.5">
                  <div className="font-semibold">1.1 Present illness:</div>
                  <textarea
                    rows={2}
                    value={h.presentIllness}
                    onChange={(e) => updateHistory({ presentIllness: e.target.value })}
                    placeholder="อาการสำคัญ / ประวัติการเจ็บป่วยปัจจุบัน..."
                    className={inlineTextareaBase}
                  />
                </div>

                {/* 1.2 Past illness */}
                <div className="space-y-0.5">
                  <div className="font-semibold">1.2 Past illness:</div>
                  <textarea
                    rows={2}
                    value={h.pastIllness}
                    onChange={(e) => updateHistory({ pastIllness: e.target.value })}
                    placeholder="ประวัติการเจ็บป่วยในอดีต..."
                    className={inlineTextareaBase}
                  />
                </div>

                {/* 1.3 Allergy */}
                <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                  <span className="font-semibold">1.3 Allergy:</span>
                  {radioMark(h.allergyStatus === 'no', 'No', () =>
                    updateHistory({
                      allergyStatus: h.allergyStatus === 'no' ? 'none' : 'no',
                      allergyDetail: h.allergyStatus === 'no' ? h.allergyDetail : '',
                    }),
                  )}
                  {radioMark(
                    h.allergyStatus === 'yes',
                    'Yes',
                    () =>
                      updateHistory({
                        allergyStatus: h.allergyStatus === 'yes' ? 'none' : 'yes',
                      }),
                    { danger: true },
                  )}
                  <input
                    type="text"
                    value={h.allergyDetail}
                    onChange={(e) =>
                      updateHistory({
                        allergyDetail: e.target.value,
                        allergyStatus: e.target.value.trim() ? 'yes' : h.allergyStatus,
                      })
                    }
                    placeholder="ระบุยา/อาหารที่แพ้..."
                    className={`${inlineInputBase} flex-1 min-w-[110px] ${
                      h.allergyStatus === 'yes' ? 'text-red-700' : ''
                    }`}
                  />
                </div>

                {/* 1.4 Underlying & Medication Side-by-Side Box */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-baseline gap-x-1">
                    <span className="font-semibold">1.4 Underlying:</span>
                    {radioMark(h.underlyingStatus === 'no', 'No', () =>
                      updateHistory({
                        underlyingStatus: h.underlyingStatus === 'no' ? 'none' : 'no',
                      }),
                    )}
                    {radioMark(h.underlyingStatus === 'yes', 'Yes', () =>
                      updateHistory({
                        underlyingStatus: h.underlyingStatus === 'yes' ? 'none' : 'yes',
                      }),
                    )}
                    {radioMark(h.underlyingControl === 'good', 'Good control', () =>
                      updateHistory({
                        underlyingControl: h.underlyingControl === 'good' ? '' : 'good',
                      }),
                    )}
                    {radioMark(
                      h.underlyingControl === 'poor',
                      'Poor control',
                      () =>
                        updateHistory({
                          underlyingControl: h.underlyingControl === 'poor' ? '' : 'poor',
                        }),
                      { danger: true },
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 border border-slate-400 p-1.5">
                    {/* Underlying checkboxes & details */}
                    <div className="space-y-1 min-w-0">
                      {underlyingStdConfigs.map((cfg) => {
                        const isChecked = Boolean(h[cfg.flagKey]);
                        const ctrl = h[cfg.controlKey];
                        return (
                          <div key={cfg.flagKey} className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-x-1">
                              {radioMark(isChecked, cfg.label, () =>
                                updateHistory({
                                  [cfg.flagKey]: !isChecked,
                                  underlyingStatus: !isChecked ? 'yes' : h.underlyingStatus,
                                }),
                              )}
                              {isChecked && (
                                <>
                                  <input
                                    type="text"
                                    value={h[cfg.yearsKey]}
                                    onChange={(e) =>
                                      updateHistory({ [cfg.yearsKey]: e.target.value })
                                    }
                                    placeholder="ปี"
                                    className={`${inlineInputBase} w-7 text-center font-mono text-[10.5px]`}
                                  />
                                  <span className="text-[10px]">ปี</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateHistory({
                                        [cfg.controlKey]: cycleControl(ctrl),
                                      })
                                    }
                                    title="คลิกเพื่อสลับ Good / Poor control"
                                    className={`text-[10px] px-1 rounded border cursor-pointer ${
                                      ctrl === 'good'
                                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800 font-semibold'
                                        : ctrl === 'poor'
                                        ? 'border-red-400 bg-red-50 text-red-700 font-semibold'
                                        : 'border-slate-300 text-slate-500 hover:bg-slate-100'
                                    }`}
                                  >
                                    {ctrl === 'good' ? 'Good' : ctrl === 'poor' ? 'Poor' : 'Ctrl?'}
                                  </button>
                                </>
                              )}
                            </div>
                            {isChecked && (
                              <input
                                type="text"
                                value={h[cfg.detailKey]}
                                onChange={(e) =>
                                  updateHistory({ [cfg.detailKey]: e.target.value })
                                }
                                placeholder={`รายละเอียด ${cfg.label}...`}
                                className={`${inlineInputBase} w-full text-[10.5px] pl-3 font-normal`}
                              />
                            )}
                          </div>
                        );
                      })}

                      {/* Other underlying lines */}
                      <div className="pt-0.5 space-y-0.5">
                        {otherUdRows.map((udVal, idx) => (
                          <input
                            key={`other_ud_${idx}`}
                            type="text"
                            value={udVal}
                            onChange={(e) => {
                              const next = [...otherUdRows];
                              next[idx] = e.target.value;
                              const trimmed = next.filter(
                                (v, i) => v.trim() !== '' || i < next.length - 1,
                              );
                              updateHistory({
                                otherUnderlying: trimmed,
                                underlyingStatus: e.target.value.trim()
                                  ? 'yes'
                                  : h.underlyingStatus,
                              });
                            }}
                            placeholder={idx === 0 ? 'โรคประจำตัวอื่นๆ...' : ''}
                            className={`${inlineInputBase} w-full text-[10.5px]`}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            updateHistory({
                              otherUnderlying: [...otherUdRows, ''],
                            })
                          }
                          className="text-[10px] text-pblue-700 hover:underline inline-flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          เพิ่มโรคอื่น
                        </button>
                      </div>

                      <div className="flex items-baseline gap-1 pt-0.5">
                        <span className="text-[10px] font-semibold shrink-0">รายละเอียด:</span>
                        <input
                          type="text"
                          value={h.underlyingDetail}
                          onChange={(e) => updateHistory({ underlyingDetail: e.target.value })}
                          className={`${inlineInputBase} flex-1 min-w-0 text-[10.5px] font-normal`}
                        />
                      </div>
                    </div>

                    {/* Medication right cell */}
                    <div className="border-l border-slate-400 pl-1.5 flex flex-col min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-semibold">Medication:</span>
                        <button
                          type="button"
                          onClick={onSwitchToDetailedForm}
                          className="text-[10px] text-pblue-700 hover:underline"
                          title="เปิดแบบฟอร์มละเอียดเพื่อเลือกจากกลุ่มยา"
                        >
                          เลือกจากรายการยา
                        </button>
                      </div>
                      <textarea
                        rows={7}
                        value={h.medication}
                        onChange={(e) => updateHistory({ medication: e.target.value })}
                        placeholder="พิมพ์ยาประจำตัวทีละบรรทัด..."
                        className={`${inlineTextareaBase} flex-1 text-[10.5px]`}
                      />
                    </div>
                  </div>
                </div>

                {/* 1.5 Previous operation / anesthesia */}
                <div className="pt-0.5 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">1.5 Previous operation / anesthesia</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateHistory({ previousOps: [...prevOpRows, ''] })
                      }
                      className="text-[10px] text-pblue-700 hover:underline inline-flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      เพิ่มแถว
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {prevOpRows.map((opVal, idx) => (
                      <div key={`prev_op_${idx}`} className="flex items-baseline gap-1">
                        <span className="font-mono text-[10.5px] text-slate-600 w-4 shrink-0">
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          value={opVal}
                          onChange={(e) => {
                            const next = [...prevOpRows];
                            next[idx] = e.target.value;
                            updateHistory({ previousOps: next });
                          }}
                          className={`${inlineInputBase} flex-1`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-baseline gap-1 pt-0.5">
                    <span className="font-semibold shrink-0">complication:</span>
                    <input
                      type="text"
                      value={h.previousOpComplication}
                      onChange={(e) => updateHistory({ previousOpComplication: e.target.value })}
                      className={`${inlineInputBase} flex-1`}
                    />
                  </div>
                </div>

                {/* 1.6 Drinking, 1.7 Smoking, 1.8 Drug addiction */}
                <div className="space-y-1 pt-1 border-t border-dotted border-slate-300 text-[10.5px]">
                  <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                    <span className="font-semibold">1.6 Drinking:</span>
                    {radioMark(h.drinkingStatus === 'no', 'No', () =>
                      updateHistory({
                        drinkingStatus: h.drinkingStatus === 'no' ? 'none' : 'no',
                      }),
                    )}
                    {radioMark(h.drinkingStatus === 'yes', 'Yes', () =>
                      updateHistory({
                        drinkingStatus: h.drinkingStatus === 'yes' ? 'none' : 'yes',
                      }),
                    )}
                    <span>ปริมาณ</span>
                    <input
                      type="text"
                      value={h.drinkingAmount ?? ''}
                      onChange={(e) =>
                        updateHistory({
                          drinkingAmount: e.target.value,
                          drinkingStatus: e.target.value.trim() ? 'yes' : h.drinkingStatus,
                        })
                      }
                      className={`${inlineInputBase} w-14 text-center`}
                    />
                    <input
                      type="text"
                      value={h.drinkingDaysPerWeek}
                      onChange={(e) =>
                        updateHistory({
                          drinkingDaysPerWeek: e.target.value,
                          drinkingStatus: e.target.value.trim() ? 'yes' : h.drinkingStatus,
                        })
                      }
                      className={`${inlineInputBase} w-7 text-center font-mono`}
                    />
                    <span>วัน/wk</span>
                    <input
                      type="text"
                      value={h.drinkingYears}
                      onChange={(e) =>
                        updateHistory({
                          drinkingYears: e.target.value,
                          drinkingStatus: e.target.value.trim() ? 'yes' : h.drinkingStatus,
                        })
                      }
                      className={`${inlineInputBase} w-7 text-center font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateHistory({
                          drinkingDurationUnit:
                            (h.drinkingDurationUnit === 'months' ? 'years' : 'months') as DurationUnit,
                        })
                      }
                      className="underline decoration-dotted cursor-pointer hover:text-pblue-700"
                    >
                      {h.drinkingDurationUnit === 'months' ? 'เดือน' : 'ปี'}
                    </button>
                    {checkBox(Boolean(h.drinkingQuit), 'เลิก', () =>
                      updateHistory({ drinkingQuit: !h.drinkingQuit }),
                    )}
                    {h.drinkingQuit && (
                      <input
                        type="text"
                        value={h.drinkingQuitDuration}
                        onChange={(e) => updateHistory({ drinkingQuitDuration: e.target.value })}
                        placeholder="กี่ปี"
                        className={`${inlineInputBase} w-10 text-center font-mono`}
                      />
                    )}
                  </div>

                  <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                    <span className="font-semibold">1.7 Smoking:</span>
                    {radioMark(h.smokingStatus === 'no', 'No', () =>
                      updateHistory({
                        smokingStatus: h.smokingStatus === 'no' ? 'none' : 'no',
                      }),
                    )}
                    {radioMark(h.smokingStatus === 'yes', 'Yes', () =>
                      updateHistory({
                        smokingStatus: h.smokingStatus === 'yes' ? 'none' : 'yes',
                      }),
                    )}
                    <input
                      type="text"
                      value={h.smokingCigsPerDay}
                      onChange={(e) =>
                        updateHistory({
                          smokingCigsPerDay: e.target.value,
                          smokingStatus: e.target.value.trim() ? 'yes' : h.smokingStatus,
                        })
                      }
                      className={`${inlineInputBase} w-8 text-center font-mono`}
                    />
                    <span>มวน/วัน</span>
                    <input
                      type="text"
                      value={h.smokingYears}
                      onChange={(e) =>
                        updateHistory({
                          smokingYears: e.target.value,
                          smokingStatus: e.target.value.trim() ? 'yes' : h.smokingStatus,
                        })
                      }
                      className={`${inlineInputBase} w-8 text-center font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateHistory({
                          smokingDurationUnit:
                            (h.smokingDurationUnit === 'months' ? 'years' : 'months') as DurationUnit,
                        })
                      }
                      className="underline decoration-dotted cursor-pointer hover:text-pblue-700"
                    >
                      {h.smokingDurationUnit === 'months' ? 'เดือน' : 'ปี'}
                    </button>
                    {checkBox(Boolean(h.smokingQuit), 'เลิก', () =>
                      updateHistory({ smokingQuit: !h.smokingQuit }),
                    )}
                    {h.smokingQuit && (
                      <input
                        type="text"
                        value={h.smokingQuitDuration}
                        onChange={(e) => updateHistory({ smokingQuitDuration: e.target.value })}
                        placeholder="กี่ปี"
                        className={`${inlineInputBase} w-10 text-center font-mono`}
                      />
                    )}
                  </div>

                  <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                    <span className="font-semibold">1.8 Drug addiction:</span>
                    {radioMark(h.drugAddictionStatus === 'no', 'No', () =>
                      updateHistory({
                        drugAddictionStatus: h.drugAddictionStatus === 'no' ? 'none' : 'no',
                      }),
                    )}
                    {radioMark(
                      h.drugAddictionStatus === 'yes',
                      'Yes',
                      () =>
                        updateHistory({
                          drugAddictionStatus: h.drugAddictionStatus === 'yes' ? 'none' : 'yes',
                        }),
                      { danger: true },
                    )}
                    <input
                      type="text"
                      value={
                        [...(h.drugAddictionTypes || []), h.drugAddictionOther]
                          .filter(Boolean)
                          .join(', ')
                      }
                      onChange={(e) =>
                        updateHistory({
                          drugAddictionTypes: [],
                          drugAddictionOther: e.target.value,
                          drugAddictionStatus: e.target.value.trim()
                            ? 'yes'
                            : h.drugAddictionStatus,
                        })
                      }
                      placeholder="ระบุชนิดสารเสพติด..."
                      className={`${inlineInputBase} flex-1 min-w-[100px]`}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Investigation */}
              <div className="p-2.5 space-y-1.5">
                <div className="font-bold text-[12px]">3. Investigation</div>
                <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                  <span className="font-semibold">3.1 Chest x-ray:</span>
                  {radioMark(inv.cxrStatus === 'normal', 'Normal', () =>
                    updateInvestigation({
                      cxrStatus: inv.cxrStatus === 'normal' ? '' : 'normal',
                    }),
                  )}
                  {radioMark(
                    inv.cxrStatus === 'abnormal',
                    'Abnormal',
                    () =>
                      updateInvestigation({
                        cxrStatus: inv.cxrStatus === 'abnormal' ? '' : 'abnormal',
                      }),
                    { danger: true },
                  )}
                  <input
                    type="text"
                    value={inv.cxrDetail}
                    onChange={(e) => updateInvestigation({ cxrDetail: e.target.value })}
                    placeholder="รายละเอียด CXR..."
                    className={`${inlineInputBase} flex-1 min-w-[100px]`}
                  />
                </div>
                <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                  <span className="font-semibold">3.2 EKG:</span>
                  {radioMark(inv.ekgStatus === 'normal', 'Normal', () =>
                    updateInvestigation({
                      ekgStatus: inv.ekgStatus === 'normal' ? '' : 'normal',
                    }),
                  )}
                  {radioMark(
                    inv.ekgStatus === 'abnormal',
                    'Abnormal',
                    () =>
                      updateInvestigation({
                        ekgStatus: inv.ekgStatus === 'abnormal' ? '' : 'abnormal',
                      }),
                    { danger: true },
                  )}
                  <input
                    type="text"
                    value={inv.ekgDetail}
                    onChange={(e) => updateInvestigation({ ekgDetail: e.target.value })}
                    placeholder="รายละเอียด EKG..."
                    className={`${inlineInputBase} flex-1 min-w-[110px]`}
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="font-semibold">3.3 Other (ex. CT):</div>
                  <textarea
                    rows={3}
                    value={inv.other}
                    onChange={(e) => updateInvestigation({ other: e.target.value })}
                    placeholder="Echo, PFT, CT หรือผลตรวจพิเศษอื่นๆ..."
                    className={inlineTextareaBase}
                  />
                </div>
              </div>

              {/* 5. Premedication */}
              <div className="p-2.5 space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[12px]">5. Premedication</div>
                  <button
                    type="button"
                    onClick={() => updatePremed({ items: [...premedRows, ''] })}
                    className="text-[10px] text-pblue-700 hover:underline inline-flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    เพิ่มยา
                  </button>
                </div>
                <div className="space-y-0.5">
                  {premedRows.map((item, idx) => (
                    <div key={`premed_${idx}`} className="flex items-baseline gap-1">
                      <span className="font-mono text-[10.5px] text-slate-600 w-4 shrink-0">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const next = [...premedRows];
                          next[idx] = e.target.value;
                          updatePremed({ items: next });
                        }}
                        className={`${inlineInputBase} flex-1`}
                      />
                    </div>
                  ))}
                </div>

                {/* Highlighted NPO Box (exact match to paper) */}
                <div className="mt-1 px-2 py-1.5 border border-slate-800 bg-amber-50/70 space-y-1">
                  <div className="flex items-baseline gap-1.5 font-bold text-slate-950">
                    <span className="shrink-0">NPO:</span>
                    <input
                      type="text"
                      value={pm.npoTime}
                      onChange={(e) => updatePremed({ npoTime: e.target.value })}
                      placeholder="เช่น NPO หลัง 24.00 น."
                      className={`${inlineInputBase} flex-1 font-bold`}
                    />
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[10.5px] text-slate-800">
                    <span className="inline-flex items-baseline gap-1">
                      <span>อาหารล่าสุด</span>
                      <Time24Input
                        value={pm.lastMealTime || ''}
                        onChange={(next) => updatePremed({ lastMealTime: next })}
                        className={`${inlineInputBase} w-14 text-center font-mono text-[10.5px]`}
                      />
                      <span>น.</span>
                    </span>
                    <span className="inline-flex items-baseline gap-1">
                      <span>น้ำเปล่าล่าสุด</span>
                      <Time24Input
                        value={pm.lastWaterTime || ''}
                        onChange={(next) => updatePremed({ lastWaterTime: next })}
                        className={`${inlineInputBase} w-14 text-center font-mono text-[10.5px]`}
                      />
                      <span>น.</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 pt-0.5">
                  <span className="font-semibold shrink-0">on IVF:</span>
                  <input
                    type="text"
                    value={pm.onIvf}
                    onChange={(e) => updatePremed({ onIvf: e.target.value })}
                    placeholder="เช่น 0.9% NSS 100 ml/hr"
                    className={`${inlineInputBase} flex-1`}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: 2. Physical Examination, 4. Laboratory, 6. Consult */}
            <div className="flex flex-col divide-y divide-slate-900 min-w-0">
              {/* 2. Physical examination */}
              <div className="p-2.5 space-y-1.5 min-w-0">
                <div className="font-bold text-[12px]">2. Physical examination</div>

                {/* BW, HT, BMI */}
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="inline-flex items-baseline gap-1">
                    <span className="font-semibold">BW:</span>
                    <input
                      type="text"
                      value={p.bw}
                      onChange={(e) => updateExam({ bw: e.target.value })}
                      className={`${inlineInputBase} w-12 text-center font-mono`}
                    />
                    <span>kg</span>
                  </span>
                  <span className="inline-flex items-baseline gap-1">
                    <span className="font-semibold">HT:</span>
                    <input
                      type="text"
                      value={p.ht}
                      onChange={(e) => updateExam({ ht: e.target.value })}
                      className={`${inlineInputBase} w-12 text-center font-mono`}
                    />
                    <span>cm</span>
                  </span>
                  <span className="inline-flex items-baseline gap-1">
                    <span className="font-semibold">BMI:</span>
                    <input
                      type="text"
                      value={p.bmi}
                      onChange={(e) => updateExam({ bmi: e.target.value })}
                      className={`${inlineInputBase} w-12 text-center font-mono`}
                    />
                  </span>
                </div>

                {/* Vital signs */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-semibold">Vital signs:</span>
                    <span className="inline-flex items-baseline gap-1">
                      <span>BP</span>
                      <input
                        type="text"
                        value={p.bp}
                        onChange={(e) => updateExam({ bp: e.target.value })}
                        placeholder="120/80"
                        className={`${inlineInputBase} w-16 text-center font-mono`}
                      />
                      <span>mmHg</span>
                    </span>
                    <span className="inline-flex items-baseline gap-1">
                      <span>P</span>
                      <input
                        type="text"
                        value={p.pulse}
                        onChange={(e) => updateExam({ pulse: e.target.value })}
                        className={`${inlineInputBase} w-10 text-center font-mono`}
                      />
                      <span>/min</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 pl-1">
                    <span className="inline-flex items-baseline gap-1">
                      <span>RR</span>
                      <input
                        type="text"
                        value={p.rr}
                        onChange={(e) => updateExam({ rr: e.target.value })}
                        className={`${inlineInputBase} w-10 text-center font-mono`}
                      />
                      <span>/min</span>
                    </span>
                    <span className="inline-flex items-baseline gap-1">
                      <span>T</span>
                      <input
                        type="text"
                        value={p.temp}
                        onChange={(e) => updateExam({ temp: e.target.value })}
                        className={`${inlineInputBase} w-10 text-center font-mono`}
                      />
                      <span>°C</span>
                    </span>
                    <span className="inline-flex items-baseline gap-1">
                      <span>SpO2</span>
                      <input
                        type="text"
                        value={p.spo2}
                        onChange={(e) => updateExam({ spo2: e.target.value })}
                        className={`${inlineInputBase} w-10 text-center font-mono`}
                      />
                      <span>%</span>
                    </span>
                  </div>
                </div>

                {/* Status ปัจจุบัน */}
                <div className="space-y-1 pt-1 border-t border-dotted border-slate-300">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                    <span className="font-semibold">Status ปัจจุบัน:</span>
                    <span className="inline-flex items-baseline font-mono">
                      E
                      <input
                        type="text"
                        value={p.gcsE || ''}
                        onChange={(e) => updateExam({ gcsE: e.target.value })}
                        className={`${inlineInputBase} w-5 text-center`}
                      />
                      V
                      <input
                        type="text"
                        value={p.gcsV || ''}
                        onChange={(e) => updateExam({ gcsV: e.target.value })}
                        className={`${inlineInputBase} w-5 text-center`}
                      />
                      M
                      <input
                        type="text"
                        value={p.gcsM || ''}
                        onChange={(e) => updateExam({ gcsM: e.target.value })}
                        className={`${inlineInputBase} w-5 text-center`}
                      />
                    </span>
                    {radioMark(p.selfCareStatus === 'independent', 'ช่วยเหลือตัวเองได้', () =>
                      updateExam({
                        selfCareStatus:
                          p.selfCareStatus === 'independent' ? '' : 'independent',
                      }),
                    )}
                    {radioMark(p.selfCareStatus === 'dependent', 'ช่วยเหลือตัวเองไม่ได้', () =>
                      updateExam({
                        selfCareStatus:
                          p.selfCareStatus === 'dependent' ? '' : 'dependent',
                      }),
                    )}
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-1 pl-1">
                    <span className="font-semibold">อาการ:</span>
                    {radioMark(p.dyspneaStatus === 'no', 'ไม่เหนื่อยหอบ', () =>
                      updateExam({
                        dyspneaStatus: p.dyspneaStatus === 'no' ? '' : 'no',
                      }),
                    )}
                    {radioMark(
                      p.dyspneaStatus === 'yes',
                      'เหนื่อยหอบ',
                      () =>
                        updateExam({
                          dyspneaStatus: p.dyspneaStatus === 'yes' ? '' : 'yes',
                        }),
                      { danger: true },
                    )}
                    <input
                      type="text"
                      value={p.currentStatusDetail || ''}
                      onChange={(e) => updateExam({ currentStatusDetail: e.target.value })}
                      placeholder="อาการเพิ่มเติม..."
                      className={`${inlineInputBase} flex-1 min-w-[100px]`}
                    />
                  </div>
                </div>

                {/* 2.1 Tooth + Interactive DentalArchBadge + 2.2 Airway */}
                <div className="pt-1 border-t border-dotted border-slate-300 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-baseline gap-x-0.5">
                        <span className="font-semibold mr-1">2.1 Tooth:</span>
                        {(['Normal', 'Denture', 'Loose', 'Avulsion'] as ToothCondition[]).map(
                          (t) =>
                            radioMark(
                              p.toothStatus.includes(t),
                              t,
                              () => {
                                const exists = p.toothStatus.includes(t);
                                const next = exists
                                  ? p.toothStatus.filter((x) => x !== t)
                                  : [...p.toothStatus, t];
                                updateExam({ toothStatus: next });
                              },
                              { keyProp: `tooth_${t}` },
                            ),
                        )}
                        <input
                          type="text"
                          value={p.toothDetail}
                          onChange={(e) => updateExam({ toothDetail: e.target.value })}
                          placeholder="รายละเอียดฟัน..."
                          className={`${inlineInputBase} w-28 text-[10.5px]`}
                        />
                      </div>
                      {formatToothMarksSummary(p.missingTeeth, p.looseTeeth) && (
                        <div className="text-[10px] text-slate-700">
                          {formatToothMarksSummary(p.missingTeeth, p.looseTeeth)}
                        </div>
                      )}
                      <div className="flex flex-wrap items-baseline gap-x-0.5">
                        <span className="font-semibold mr-1">2.2 Airway:</span>
                        <span className="mr-1">Mouth opening</span>
                        {radioMark(p.mouthOpening === 'normal', 'Normal', () =>
                          updateExam({
                            mouthOpening: p.mouthOpening === 'normal' ? '' : 'normal',
                          }),
                        )}
                        {radioMark(
                          p.mouthOpening === 'limited',
                          'Limited',
                          () =>
                            updateExam({
                              mouthOpening: p.mouthOpening === 'limited' ? '' : 'limited',
                            }),
                          { danger: true },
                        )}
                        <input
                          type="text"
                          value={p.mouthOpeningDetail}
                          onChange={(e) => updateExam({ mouthOpeningDetail: e.target.value })}
                          placeholder="fb"
                          className={`${inlineInputBase} w-14 text-[10.5px]`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center shrink-0">
                      <DentalArchBadge
                        className="w-[74px] h-[46px]"
                        missingTeeth={p.missingTeeth || []}
                        looseTeeth={p.looseTeeth || []}
                        interactive
                        onToggleTooth={handleToggleToothMark}
                      />
                      <span className="text-[9px] text-slate-400">แตะซี่ฟันเพื่อ mark</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                    <span>Neck movement</span>
                    {radioMark(p.neckMovement === 'normal', 'Normal', () =>
                      updateExam({
                        neckMovement: p.neckMovement === 'normal' ? '' : 'normal',
                      }),
                    )}
                    {radioMark(
                      p.neckMovement === 'limited',
                      'Limited',
                      () =>
                        updateExam({
                          neckMovement: p.neckMovement === 'limited' ? '' : 'limited',
                        }),
                      { danger: true },
                    )}
                    <span>· TMD</span>
                    {radioMark(
                      p.thyromentalDistance === '<6',
                      '<6 cm',
                      () =>
                        updateExam({
                          thyromentalDistance:
                            p.thyromentalDistance === '<6' ? '' : '<6',
                        }),
                      { danger: true },
                    )}
                    {radioMark(p.thyromentalDistance === '>=6', '>=6 cm', () =>
                      updateExam({
                        thyromentalDistance:
                          p.thyromentalDistance === '>=6' ? '' : '>=6',
                      }),
                    )}
                  </div>
                </div>

                {/* 2.3 Mallampati class (Interactive!) */}
                <div className="space-y-1">
                  <div className="font-semibold">2.3 Mallampati class</div>
                  <MallampatiSelector
                    value={p.mallampatiClass}
                    onChange={(nextMp) => updateExam({ mallampatiClass: nextMp })}
                    compact
                  />
                  <div className="flex flex-wrap items-baseline gap-x-1">
                    <span>Expected difficult airway:</span>
                    {radioMark(p.expectedDifficultAirway === 'no', 'No', () =>
                      updateExam({
                        expectedDifficultAirway:
                          p.expectedDifficultAirway === 'no' ? 'none' : 'no',
                      }),
                    )}
                    {radioMark(
                      p.expectedDifficultAirway === 'yes',
                      'Yes',
                      () =>
                        updateExam({
                          expectedDifficultAirway:
                            p.expectedDifficultAirway === 'yes' ? 'none' : 'yes',
                        }),
                      { danger: true },
                    )}
                  </div>
                </div>

                {/* 2.4 Breath sound, 2.5 Heart sound, 2.6 FC, Chest pain */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline gap-x-1">
                    <span className="font-semibold">2.4 Breath sound:</span>
                    {radioMark(p.breathSound === 'normal', 'Normal', () =>
                      updateExam({
                        breathSound: p.breathSound === 'normal' ? '' : 'normal',
                      }),
                    )}
                    {radioMark(
                      p.breathSound === 'abnormal',
                      'Abnormal',
                      () =>
                        updateExam({
                          breathSound: p.breathSound === 'abnormal' ? '' : 'abnormal',
                        }),
                      { danger: true },
                    )}
                    <input
                      type="text"
                      value={p.breathSoundDetail}
                      onChange={(e) => updateExam({ breathSoundDetail: e.target.value })}
                      className={`${inlineInputBase} flex-1 min-w-[80px]`}
                    />
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-1">
                    <span className="font-semibold">2.5 Heart sound:</span>
                    {radioMark(p.heartSound === 'normal', 'Normal', () =>
                      updateExam({
                        heartSound: p.heartSound === 'normal' ? '' : 'normal',
                      }),
                    )}
                    {radioMark(
                      p.heartSound === 'abnormal',
                      'Abnormal',
                      () =>
                        updateExam({
                          heartSound: p.heartSound === 'abnormal' ? '' : 'abnormal',
                        }),
                      { danger: true },
                    )}
                    <input
                      type="text"
                      value={p.heartSoundDetail}
                      onChange={(e) => updateExam({ heartSoundDetail: e.target.value })}
                      className={`${inlineInputBase} flex-1 min-w-[80px]`}
                    />
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-1">
                    <span className="font-semibold">2.6 FC:</span>
                    {radioMark(p.functionalCapacityLevel === '>4', '> 4 METS', () =>
                      updateExam({
                        functionalCapacityLevel:
                          p.functionalCapacityLevel === '>4' ? '' : '>4',
                      }),
                    )}
                    {radioMark(
                      p.functionalCapacityLevel === '<4',
                      '< 4 METS',
                      () =>
                        updateExam({
                          functionalCapacityLevel:
                            p.functionalCapacityLevel === '<4' ? '' : '<4',
                        }),
                      { danger: true },
                    )}
                    <input
                      type="text"
                      value={p.functionalCapacity}
                      onChange={(e) => updateExam({ functionalCapacity: e.target.value })}
                      className={`${inlineInputBase} flex-1 min-w-[90px]`}
                    />
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-1">
                    {radioMark(p.chestPainStatus === 'no', 'No chest pain', () =>
                      updateExam({
                        chestPainStatus: p.chestPainStatus === 'no' ? '' : 'no',
                      }),
                    )}
                    {radioMark(
                      p.chestPainStatus === 'yes',
                      'Chest pain',
                      () =>
                        updateExam({
                          chestPainStatus: p.chestPainStatus === 'yes' ? '' : 'yes',
                        }),
                      { danger: true },
                    )}
                    <input
                      type="text"
                      value={p.chestPainDetail || ''}
                      onChange={(e) => updateExam({ chestPainDetail: e.target.value })}
                      className={`${inlineInputBase} flex-1 min-w-[90px]`}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Laboratory Evaluation (Interactive Fishbones + Inline Fields) */}
              <div className="p-2.5 space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-1.5">
                  <div className="font-bold text-[12px]">4. Laboratory Evaluation</div>
                  <div className="flex flex-wrap items-baseline gap-x-2 text-[10px]">
                    <span className="inline-flex items-baseline gap-0.5">
                      <span>CBC:</span>
                      <ThaiDateInput
                        value={effectiveCbcDate}
                        onChange={(next) => updateLab({ cbcDate: next })}
                        className={`${inlineInputBase} w-[76px] text-center font-mono text-[10px]`}
                      />
                    </span>
                    <span className="inline-flex items-baseline gap-0.5">
                      <span>Chem:</span>
                      <ThaiDateInput
                        value={effectiveChemDate}
                        onChange={(next) => updateLab({ chemDate: next })}
                        className={`${inlineInputBase} w-[76px] text-center font-mono text-[10px]`}
                      />
                    </span>
                  </div>
                </div>

                {/* Interactive CBC & Chem Fishbones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <CbcFishbone
                    lab={lab}
                    onChange={(field, val) => updateLab({ [field]: val })}
                  />
                  <ChemFishbone
                    lab={lab}
                    onChange={(field, val) => updateLab({ [field]: val })}
                  />
                </div>

                {/* Coag */}
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-semibold">Coag:</span>
                  <span className="inline-flex items-baseline gap-0.5">
                    PT
                    <input
                      type="text"
                      value={lab.pt}
                      onChange={(e) => updateLab({ pt: e.target.value })}
                      className={`${inlineInputBase} w-10 text-center font-mono`}
                    />
                    s
                  </span>
                  <span className="inline-flex items-baseline gap-0.5">
                    PTT
                    <input
                      type="text"
                      value={lab.ptt}
                      onChange={(e) => updateLab({ ptt: e.target.value })}
                      className={`${inlineInputBase} w-10 text-center font-mono`}
                    />
                    s
                  </span>
                  <span className="inline-flex items-baseline gap-0.5">
                    INR
                    <input
                      type="text"
                      value={lab.inr}
                      onChange={(e) => updateLab({ inr: e.target.value })}
                      className={`${inlineInputBase} w-10 text-center font-mono`}
                    />
                  </span>
                </div>

                {/* LFT */}
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-semibold">LFT:</span>
                  {(
                    [
                      { k: 'sgot', l: 'SGOT' },
                      { k: 'sgpt', l: 'SGPT' },
                      { k: 'alp', l: 'ALP' },
                      { k: 'alb', l: 'Alb' },
                    ] as const
                  ).map((f) => (
                    <span key={f.k} className="inline-flex items-baseline gap-0.5">
                      {f.l}
                      <input
                        type="text"
                        value={lab[f.k]}
                        onChange={(e) => updateLab({ [f.k]: e.target.value })}
                        className={`${inlineInputBase} w-9 text-center font-mono`}
                      />
                    </span>
                  ))}
                </div>

                {/* DTX, HbA1C, Lactate, Trop I */}
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  {(
                    [
                      { k: 'glucose', l: 'DTX/Glu' },
                      { k: 'hba1c', l: 'HbA1C' },
                      { k: 'lactate', l: 'Lactate' },
                      { k: 'tropI', l: 'Trop I' },
                    ] as const
                  ).map((f) => (
                    <span key={f.k} className="inline-flex items-baseline gap-0.5">
                      {f.l}
                      <input
                        type="text"
                        value={lab[f.k]}
                        onChange={(e) => updateLab({ [f.k]: e.target.value })}
                        className={`${inlineInputBase} w-10 text-center font-mono`}
                      />
                    </span>
                  ))}
                </div>

                {/* TFT */}
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-semibold">TFT:</span>
                  {(
                    [
                      { k: 'ft3', l: 'FT3' },
                      { k: 'ft4', l: 'FT4' },
                      { k: 'tsh', l: 'TSH' },
                    ] as const
                  ).map((f) => (
                    <span key={f.k} className="inline-flex items-baseline gap-0.5">
                      {f.l}
                      <input
                        type="text"
                        value={lab[f.k] || ''}
                        onChange={(e) => updateLab({ [f.k]: e.target.value })}
                        className={`${inlineInputBase} w-10 text-center font-mono`}
                      />
                    </span>
                  ))}
                </div>

                {/* Blood Gas */}
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[10.5px]">
                  <span className="font-semibold">Blood Gas:</span>
                  {radioMark(isAbg, 'ABG', () =>
                    updateLab({ bgType: isAbg ? '' : 'ABG' }),
                  )}
                  {radioMark(isVbg, 'VBG', () =>
                    updateLab({ bgType: isVbg ? '' : 'VBG' }),
                  )}
                  {(
                    [
                      { k: 'bgPh', l: 'pH' },
                      { k: 'bgPco2', l: pco2Label },
                      { k: 'bgPo2', l: po2Label },
                      { k: 'bgHco3', l: 'HCO3' },
                      { k: 'bgBe', l: 'BE' },
                      { k: 'bgSao2', l: `${satLabel}%` },
                      { k: 'bgFio2', l: 'FiO2' },
                    ] as const
                  ).map((f) => (
                    <span key={f.k} className="inline-flex items-baseline gap-0.5">
                      {f.l}
                      <input
                        type="text"
                        value={lab[f.k] || ''}
                        onChange={(e) => updateLab({ [f.k]: e.target.value })}
                        className={`${inlineInputBase} w-8 text-center font-mono`}
                      />
                    </span>
                  ))}
                  {pfRatio !== null && (
                    <span className="font-mono font-bold text-pblue-800">
                      · P/F={pfRatio}
                    </span>
                  )}
                </div>

                {/* Serology & Other Lab */}
                <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                  <span>Anti-HIV:</span>
                  {radioMark(lab.antiHiv === 'negative', 'Neg', () =>
                    updateLab({
                      antiHiv: lab.antiHiv === 'negative' ? '' : 'negative',
                    }),
                  )}
                  {radioMark(
                    lab.antiHiv === 'positive',
                    'Pos',
                    () =>
                      updateLab({
                        antiHiv: lab.antiHiv === 'positive' ? '' : 'positive',
                      }),
                    { danger: true },
                  )}
                  <span>· HBsAg:</span>
                  {radioMark(lab.hbsAg === 'negative', 'Neg', () =>
                    updateLab({
                      hbsAg: lab.hbsAg === 'negative' ? '' : 'negative',
                    }),
                  )}
                  {radioMark(
                    lab.hbsAg === 'positive',
                    'Pos',
                    () =>
                      updateLab({
                        hbsAg: lab.hbsAg === 'positive' ? '' : 'positive',
                      }),
                    { danger: true },
                  )}
                  <span className="inline-flex items-baseline gap-1 flex-1 min-w-[90px]">
                    <span>· Other:</span>
                    <input
                      type="text"
                      value={lab.other}
                      onChange={(e) => updateLab({ other: e.target.value })}
                      className={`${inlineInputBase} flex-1 min-w-[60px]`}
                    />
                  </span>
                </div>

                {/* Blood Group & Blood Prep */}
                <div className="space-y-1 pt-1 border-t border-dotted border-slate-300">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                    <span className="inline-flex items-baseline gap-0.5">
                      <span>Group เลือด</span>
                      <select
                        value={lab.bloodGroup || ''}
                        onChange={(e) =>
                          updateLab({
                            bloodGroup: e.target.value as '' | 'A' | 'B' | 'AB' | 'O',
                          })
                        }
                        className={`${inlineInputBase} w-11 text-center font-mono cursor-pointer`}
                      >
                        <option value="">—</option>
                        {BLOOD_GROUP_OPTIONS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </span>
                    {checkBox(lab.prepTs, 'T&S', () =>
                      updateLab({ prepTs: !lab.prepTs }),
                    )}
                    {(
                      [
                        { k: 'prepPrc', l: 'PRC' },
                        { k: 'prepFfp', l: 'FFP' },
                        { k: 'prepPlt', l: 'Plt' },
                        { k: 'prepCryo', l: 'Cryo' },
                      ] as const
                    ).map((b) => (
                      <span key={b.k} className="inline-flex items-baseline gap-0.5">
                        {b.l}
                        <input
                          type="text"
                          value={lab[b.k] || ''}
                          onChange={(e) => updateLab({ [b.k]: e.target.value })}
                          className={`${inlineInputBase} w-7 text-center font-mono`}
                        />
                        u
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-0.5 gap-y-0.5 text-[10.5px]">
                    {BLOOD_PREP_STATUS_OPTIONS.map((opt) => {
                      const active = (lab.prepStatuses || []).includes(opt.value);
                      return checkBox(
                        active,
                        opt.label,
                        () => {
                          const cur = lab.prepStatuses || [];
                          const next: BloodPrepStatus[] = active
                            ? cur.filter((x) => x !== opt.value)
                            : [...cur, opt.value];
                          updateLab({ prepStatuses: next });
                        },
                        opt.value,
                      );
                    })}
                    <input
                      type="text"
                      value={lab.prepStatusDetail}
                      onChange={(e) => updateLab({ prepStatusDetail: e.target.value })}
                      placeholder="หมายเหตุจองเลือด..."
                      className={`${inlineInputBase} flex-1 min-w-[80px] text-[10.5px]`}
                    />
                  </div>
                </div>
              </div>

              {/* 6. Consult Med/Cardio */}
              <div className="p-2.5 space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                  <div className="font-bold text-[12px]">6. Consult Med/Cardio</div>
                  <div className="flex flex-wrap items-center gap-x-0.5 text-[10.5px]">
                    {CONSULT_TYPE_OPTIONS.map((opt) => {
                      const cur = fd.consultTypes || [];
                      const active = cur.includes(opt.value);
                      return checkBox(
                        active,
                        opt.shortLabel,
                        () => {
                          let next: ConsultType[];
                          if (opt.value === 'none') {
                            next = active ? [] : ['none'];
                          } else {
                            const withoutNone = cur.filter((x) => x !== 'none');
                            next = active
                              ? withoutNone.filter((x) => x !== opt.value)
                              : [...withoutNone, opt.value];
                          }
                          updateFormData({ consultTypes: next });
                        },
                        opt.value,
                      );
                    })}
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={fd.consult}
                  onChange={(e) => updateFormData({ consult: e.target.value })}
                  placeholder="บันทึกผลการ Consult แพทย์เฉพาะทาง..."
                  className={inlineTextareaBase}
                />
              </div>
            </div>
          </div>

          {/* LOWER SECTIONS 7–10 */}
          <div className="p-3 space-y-2">
            {/* 7. ASA Classification */}
            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
              <span className="font-bold mr-1">7. ASA Classification:</span>
              {(['I', 'II', 'III', 'IV', 'V', 'VI'] as Exclude<AsaClass, ''>[]).map((cls) =>
                radioMark(
                  value.asaClass === cls,
                  `Class ${cls}`,
                  () => updateTop({ asaClass: value.asaClass === cls ? '' : cls }),
                  {
                    keyProp: `asa_${cls}`,
                    danger: cls === 'III' || cls === 'IV' || cls === 'V' || cls === 'VI',
                  },
                ),
              )}
              {radioMark(
                value.asaEmergency,
                'E (Emergency)',
                () => {
                  const nextE = !value.asaEmergency;
                  updateTop({
                    asaEmergency: nextE,
                    scheduleType: nextE ? 'emergency' : 'elective',
                  });
                },
                { danger: true },
              )}
            </div>

            {/* 8. Problem list */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">8. Problem list:</span>
                <div className="flex items-center gap-2.5 text-[10.5px]">
                  <button
                    type="button"
                    onClick={() =>
                      updateFormData({ problemList: refreshAutoProblems(value) })
                    }
                    className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" />
                    ดึง Problem อัตโนมัติ
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateFormData({ problemList: [...problemRows, ''] })
                    }
                    className="inline-flex items-center gap-0.5 text-pblue-700 font-semibold hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    เพิ่มรายการ
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pl-2">
                {problemRows.map((prob, idx) => (
                  <div key={`prob_${idx}`} className="flex items-center gap-1">
                    <span className="font-mono text-[10.5px] text-slate-600 w-4 shrink-0">
                      {idx + 1})
                    </span>
                    <input
                      type="text"
                      value={prob}
                      onChange={(e) => {
                        const next = [...problemRows];
                        next[idx] = e.target.value;
                        updateFormData({ problemList: next });
                      }}
                      placeholder={idx === 0 ? 'ระบุปัญหาทางคลินิก...' : ''}
                      className={`${inlineInputBase} flex-1`}
                    />
                    {problemRows.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateFormData({
                            problemList: problemRows.filter((_, i) => i !== idx),
                          })
                        }
                        aria-label="ลบ Problem"
                        className="p-0.5 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 9. Anesthetic plan */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                <span className="font-bold mr-1">9. Anesthetic plan:</span>
                {checkBox(ap.gaSelected, 'General anesthesia', () =>
                  updatePlan({ gaSelected: !ap.gaSelected }),
                )}
                {(['Intubation', 'LMA', 'Mask', 'TIVA', 'Other'] as GaMethod[]).map((m) =>
                  radioMark(
                    ap.gaMethods.includes(m),
                    m,
                    () => {
                      const active = ap.gaMethods.includes(m);
                      const next = active
                        ? ap.gaMethods.filter((x) => x !== m)
                        : [...ap.gaMethods, m];
                      updatePlan({
                        gaSelected: next.length > 0 ? true : ap.gaSelected,
                        gaMethods: next,
                      });
                    },
                    { keyProp: `ga_${m}` },
                  ),
                )}
                <input
                  type="text"
                  value={ap.gaOther}
                  onChange={(e) =>
                    updatePlan({
                      gaOther: e.target.value,
                      gaSelected: e.target.value.trim() ? true : ap.gaSelected,
                    })
                  }
                  placeholder="ระบุ GA อื่นๆ..."
                  className={`${inlineInputBase} w-28 text-[10.5px]`}
                />
              </div>

              <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 sm:pl-[108px]">
                {checkBox(ap.raSelected, 'Regional anesthesia', () =>
                  updatePlan({ raSelected: !ap.raSelected }),
                )}
                {(['Spinal block', 'Epidural', 'Nerve block', 'Other'] as RaMethod[]).map(
                  (m) =>
                    radioMark(
                      ap.raMethods.includes(m),
                      m,
                      () => {
                        const active = ap.raMethods.includes(m);
                        const next = active
                          ? ap.raMethods.filter((x) => x !== m)
                          : [...ap.raMethods, m];
                        updatePlan({
                          raSelected: next.length > 0 ? true : ap.raSelected,
                          raMethods: next,
                        });
                      },
                      { keyProp: `ra_${m}` },
                    ),
                )}
                <input
                  type="text"
                  value={ap.raOther}
                  onChange={(e) =>
                    updatePlan({
                      raOther: e.target.value,
                      raSelected: e.target.value.trim() ? true : ap.raSelected,
                    })
                  }
                  placeholder="ระบุ RA อื่นๆ..."
                  className={`${inlineInputBase} w-24 text-[10.5px] mr-2`}
                />
                {checkBox(Boolean(ap.macSelected), 'MAC', () =>
                  updatePlan({ macSelected: !ap.macSelected }),
                )}
                <input
                  type="text"
                  value={ap.macDetail || ''}
                  onChange={(e) =>
                    updatePlan({
                      macDetail: e.target.value,
                      macSelected: e.target.value.trim() ? true : ap.macSelected,
                    })
                  }
                  placeholder="รายละเอียด MAC..."
                  className={`${inlineInputBase} w-28 text-[10.5px]`}
                />
              </div>
            </div>

            {/* 10. สิ่งที่ต้องเตรียม */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">
                  10. สิ่งที่ต้องเตรียม (ตาม order วิสัญญีแพทย์):
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateFormData({ preparationOrders: [...prepOrderRows, ''] })
                  }
                  className="text-[10.5px] text-pblue-700 font-semibold hover:underline inline-flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  เพิ่มรายการเตรียม
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pl-2">
                {prepOrderRows.map((ord, idx) => (
                  <div key={`ord_${idx}`} className="flex items-center gap-1">
                    <span className="font-mono text-[10.5px] text-slate-600 w-4 shrink-0">
                      {idx + 1})
                    </span>
                    <input
                      type="text"
                      value={ord}
                      onChange={(e) => {
                        const next = [...prepOrderRows];
                        next[idx] = e.target.value;
                        updateFormData({ preparationOrders: next });
                      }}
                      placeholder={idx === 0 ? 'เช่น จอง ICU, เตรียมเลือด, A-line...' : ''}
                      className={`${inlineInputBase} flex-1`}
                    />
                    {prepOrderRows.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateFormData({
                            preparationOrders: prepOrderRows.filter((_, i) => i !== idx),
                          })
                        }
                        aria-label="ลบคำสั่งเตรียม"
                        className="p-0.5 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Signature Row */}
            <div className="pt-2 mt-1 border-t border-slate-400 flex flex-wrap items-baseline justify-end gap-4">
              <span className="inline-flex items-baseline gap-1">
                <strong>Summarized by:</strong>
                <input
                  type="text"
                  list="paper-summarizer-list"
                  value={pa.summarizedBy}
                  onChange={(e) => updatePostAnes({ summarizedBy: e.target.value })}
                  placeholder="ชื่อผู้สรุป"
                  className={`${inlineInputBase} w-44 text-center`}
                />
              </span>
              <span className="inline-flex items-baseline gap-1">
                <strong>date:</strong>
                <ThaiDateInput
                  value={pa.summarizedDate}
                  onChange={(next) => updatePostAnes({ summarizedDate: next })}
                  className={`${inlineInputBase} w-28 text-center font-mono text-[11px]`}
                />
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
          <button
            type="button"
            onClick={onGoToPostOp}
            className="no-print inline-flex items-center gap-1 text-xs font-semibold text-pgreen-800 hover:underline"
          >
            ไปแบบฟอร์ม Post-op Evaluation (ANE-FM-006-01)
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <div className="text-right text-[10px] text-slate-600 leading-none">
            ANE-FM-002-03 อนุมัติใช้วันที่ 21 มิถุนายน 2564
          </div>
        </div>
      </div>
    </div>
  );
}
