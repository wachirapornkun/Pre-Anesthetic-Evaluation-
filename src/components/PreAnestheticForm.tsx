import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Edit2,
  FileText,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import {
  handleFormTabNavigation,
  handleSectionArrowNavigation,
} from '../utils/formTabNavigation';
import {
  addDaysToIsoDate,
  applyAutoProblems,
  applyMissingAutoPremeds,
  AsaClass,
  BLOOD_GROUP_OPTIONS,
  BLOOD_PREP_STATUS_OPTIONS,
  BloodPrepStatus,
  calculateBmi,
  computeBloodGasPfRatio,
  CONSULT_TYPE_OPTIONS,
  ConsultType,
  createEmptyOxygenSupport,
  createEmptyPreOpNotVisited,
  createEmptySurgeryPostponement,
  DEFAULT_OXYGEN_OTHER_PRESETS,
  DEFAULT_SPECIALTY_LIST,
  DEFAULT_SUMMARIZER_LIST,
  DEFAULT_SURGEON_LIST,
  DEFAULT_WARD_LIST,
  deriveAnesthesiaType,
  DRUG_ADDICTION_OPTIONS,
  DurationUnit,
  evaluateNpoStatus,
  EvaluationFormData,
  formatFastingHours,
  formatOxygenSupportSummary,
  formatPostponementReasons,
  formatPreOpNotVisitedReasons,
  formatShortThaiDate,
  formatThaiDateBE,
  formatThaiScheduleDate,
  formatToothMarksSummary,
  GaMethod,
  generateAutoProblemEntries,
  getEffectiveScheduleType,
  getMissingAutoPremedEntries,
  getMissingAutoProblems,
  getPostOpVisitCompleteness,
  getTodayIsoDate,
  inferPatientGender,
  isProblemListSortedBySeverity,
  MedicationGroup,
  OR_ROOM_OPTIONS,
  OxygenSupportData,
  PatientGender,
  PRE_OP_NOT_VISITED_REASON_OPTIONS,
  PreAnestheticEvaluation,
  PreOpNotVisitedData,
  PreOpNotVisitedReasonKey,
  RaMethod,
  refreshAutoProblems,
  sortProblemListBySeverity,
  SURGERY_POSTPONEMENT_REASON_OPTIONS,
  SurgeryPostponementData,
  SurgeryPostponementReasonKey,
  syncPremedicationWithMedications,
  syncProblemListWithPatientData,
  ToothCondition,
  ToothId,
  ToothMarkMode,
  TriStatus,
} from '../types/evaluation';
import {
  BphLogo,
  CbcFishbone,
  ChemFishbone,
  DentalArchBadge,
  MallampatiSelector,
} from './MedicalDiagrams';
import { MedicationGroupSelector } from './MedicationGroupSelector';
import { OperationInput } from './OperationInput';
import { ThaiDateInput } from './ThaiDateInput';
import { Time24Input } from './Time24Input';

interface PreAnestheticFormProps {
  value: PreAnestheticEvaluation;
  onChange: (next: PreAnestheticEvaluation) => void;
  medicationGroups: MedicationGroup[];
  onUpdateMedicationGroups: (nextGroups: MedicationGroup[]) => void;
  wardOptions: string[];
  onUpdateWardOptions: (nextWards: string[]) => void;
  specialtyOptions: string[];
  onUpdateSpecialtyOptions: (nextSpecialties: string[]) => void;
  surgeonOptions: string[];
  onUpdateSurgeonOptions: (nextSurgeons: string[]) => void;
  oxygenPresets: string[];
  onUpdateOxygenPresets: (nextPresets: string[]) => void;
  summarizerOptions: string[];
  onUpdateSummarizerOptions: (nextSummarizers: string[]) => void;
  onGoToPostOp?: () => void;
}

export function PreAnestheticForm({
  value,
  onChange: emitChange,
  medicationGroups,
  onUpdateMedicationGroups,
  wardOptions,
  onUpdateWardOptions,
  specialtyOptions,
  onUpdateSpecialtyOptions,
  surgeonOptions,
  onUpdateSurgeonOptions,
  oxygenPresets,
  onUpdateOxygenPresets,
  summarizerOptions,
  onUpdateSummarizerOptions,
  onGoToPostOp,
}: PreAnestheticFormProps) {
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

  const [isManagingWards, setIsManagingWards] = useState(false);
  const [newWardName, setNewWardName] = useState('');
  const [isManagingSpecialties, setIsManagingSpecialties] = useState(false);
  const [newSpecialtyName, setNewSpecialtyName] = useState('');
  const [isManagingSurgeons, setIsManagingSurgeons] = useState(false);
  const [newSurgeonName, setNewSurgeonName] = useState('');
  const [editingSurgeon, setEditingSurgeon] = useState<{
    original: string;
    text: string;
  } | null>(null);
  const [isManagingOxygenPresets, setIsManagingOxygenPresets] = useState(false);
  const [newOxygenPreset, setNewOxygenPreset] = useState('');
  const [editingOxygenPreset, setEditingOxygenPreset] = useState<{
    original: string;
    text: string;
  } | null>(null);
  const [newOxygenOtherItem, setNewOxygenOtherItem] = useState('');
  const [editingOxygenOther, setEditingOxygenOther] = useState<{
    index: number;
    text: string;
  } | null>(null);
  const [toothMarkMode, setToothMarkMode] = useState<ToothMarkMode>('cycle');
  const [isManagingSummarizers, setIsManagingSummarizers] = useState(false);
  const [newSummarizerName, setNewSummarizerName] = useState('');
  const [editingSummarizer, setEditingSummarizer] = useState<{
    original: string;
    text: string;
  } | null>(null);

  const updatePreOpSummarizer = (
    patch: Partial<Pick<EvaluationFormData['postAnesthesia'], 'summarizedBy' | 'summarizedDate'>>,
  ) => {
    onChange({
      ...value,
      formData: {
        ...value.formData,
        postAnesthesia: {
          ...value.formData.postAnesthesia,
          ...patch,
        },
      },
    });
  };

  const handleAddSummarizerOption = (rawName: string) => {
    const trimmed = rawName.trim().slice(0, 120);
    if (!trimmed || trimmed === 'อื่นๆ') return;
    if (!summarizerOptions.includes(trimmed)) {
      onUpdateSummarizerOptions([...summarizerOptions, trimmed]);
    }
    updatePreOpSummarizer({ summarizedBy: trimmed });
    setNewSummarizerName('');
  };

  const handleSaveEditedSummarizer = () => {
    if (!editingSummarizer) return;
    const trimmed = editingSummarizer.text.trim().slice(0, 120);
    if (!trimmed || trimmed === 'อื่นๆ') return;
    const nextList = summarizerOptions.map((s) =>
      s === editingSummarizer.original ? trimmed : s,
    );
    onUpdateSummarizerOptions(nextList);
    if (value.formData.postAnesthesia.summarizedBy === editingSummarizer.original) {
      updatePreOpSummarizer({ summarizedBy: trimmed });
    }
    setEditingSummarizer(null);
  };

  const handleRemoveSummarizerOption = (name: string) => {
    onUpdateSummarizerOptions(summarizerOptions.filter((s) => s !== name));
    if (value.formData.postAnesthesia.summarizedBy === name) {
      updatePreOpSummarizer({ summarizedBy: '' });
    }
    if (editingSummarizer?.original === name) {
      setEditingSummarizer(null);
    }
  };

  const handleClearAllSummarizers = () => {
    onUpdateSummarizerOptions([]);
    if (summarizerOptions.includes(value.formData.postAnesthesia.summarizedBy ?? '')) {
      updatePreOpSummarizer({ summarizedBy: '' });
    }
    setEditingSummarizer(null);
  };

  const handleResetSummarizerOptions = () => {
    onUpdateSummarizerOptions([...DEFAULT_SUMMARIZER_LIST]);
    setEditingSummarizer(null);
  };

  const handleAddWardOption = (rawName: string) => {
    const trimmed = rawName.trim().slice(0, 80);
    if (!trimmed || trimmed === 'อื่นๆ') return;
    if (!wardOptions.includes(trimmed)) {
      onUpdateWardOptions([...wardOptions, trimmed]);
    }
    onChange({ ...value, ward: trimmed });
    setNewWardName('');
  };

  const handleRemoveWardOption = (wardName: string) => {
    onUpdateWardOptions(wardOptions.filter((w) => w !== wardName));
    if (value.ward === wardName) {
      onChange({ ...value, ward: '' });
    }
  };

  const handleResetWardOptions = () => {
    onUpdateWardOptions([...DEFAULT_WARD_LIST]);
  };

  const handleAddSpecialtyOption = (rawName: string) => {
    const trimmed = rawName.trim().slice(0, 80);
    if (!trimmed || trimmed === 'อื่นๆ') return;
    if (!specialtyOptions.includes(trimmed)) {
      onUpdateSpecialtyOptions([...specialtyOptions, trimmed]);
    }
    onChange({ ...value, specialty: trimmed });
    setNewSpecialtyName('');
  };

  const handleRemoveSpecialtyOption = (specialtyName: string) => {
    onUpdateSpecialtyOptions(specialtyOptions.filter((s) => s !== specialtyName));
    if ((value.specialty ?? '') === specialtyName) {
      onChange({ ...value, specialty: '' });
    }
  };

  const handleResetSpecialtyOptions = () => {
    onUpdateSpecialtyOptions([...DEFAULT_SPECIALTY_LIST]);
  };

  const handleAddSurgeonOption = (rawName: string) => {
    const trimmed = rawName.trim().slice(0, 120);
    if (!trimmed || trimmed === 'อื่นๆ') return;
    if (!surgeonOptions.includes(trimmed)) {
      onUpdateSurgeonOptions([...surgeonOptions, trimmed]);
    }
    onChange({ ...value, surgeon: trimmed });
    setNewSurgeonName('');
  };

  const handleSaveEditedSurgeon = () => {
    if (!editingSurgeon) return;
    const trimmed = editingSurgeon.text.trim().slice(0, 120);
    if (!trimmed || trimmed === 'อื่นๆ') return;
    const nextList = surgeonOptions.map((s) =>
      s === editingSurgeon.original ? trimmed : s,
    );
    onUpdateSurgeonOptions(nextList);
    if (value.surgeon === editingSurgeon.original) {
      onChange({ ...value, surgeon: trimmed });
    }
    setEditingSurgeon(null);
  };

  const handleRemoveSurgeonOption = (surgeonName: string) => {
    onUpdateSurgeonOptions(surgeonOptions.filter((s) => s !== surgeonName));
    if (value.surgeon === surgeonName) {
      onChange({ ...value, surgeon: '' });
    }
    if (editingSurgeon?.original === surgeonName) {
      setEditingSurgeon(null);
    }
  };

  const handleClearAllSurgeons = () => {
    onUpdateSurgeonOptions([]);
    if (surgeonOptions.includes(value.surgeon ?? '')) {
      onChange({ ...value, surgeon: '' });
    }
    setEditingSurgeon(null);
  };

  const handleResetSurgeonOptions = () => {
    onUpdateSurgeonOptions([...DEFAULT_SURGEON_LIST]);
    setEditingSurgeon(null);
  };

  const fd = value.formData;
  const h = fd.history;
  const p = fd.physicalExam;
  const inv = fd.investigation;
  const lab = fd.laboratory;
  const pm = fd.premedication;
  const ap = fd.anestheticPlan;
  const sp = fd.surgeryPostponement ?? createEmptySurgeryPostponement();
  const nv = fd.preOpNotVisited ?? createEmptyPreOpNotVisited();

  const updateTop = <K extends keyof PreAnestheticEvaluation>(
    key: K,
    val: PreAnestheticEvaluation[K],
  ) => {
    onChange({ ...value, [key]: val });
  };

  const updatePostponement = (patch: Partial<SurgeryPostponementData>) => {
    const nextSp: SurgeryPostponementData = {
      ...sp,
      ...patch,
    };
    onChange({
      ...value,
      formData: {
        ...fd,
        surgeryPostponement: nextSp,
      },
    });
  };

  const togglePostponementReason = (reasonKey: SurgeryPostponementReasonKey) => {
    const exists = sp.reasons.includes(reasonKey);
    const nextReasons = exists
      ? sp.reasons.filter((k) => k !== reasonKey)
      : [...sp.reasons, reasonKey];
    updatePostponement({
      isPostponed: true,
      originalDateOfOperation: sp.originalDateOfOperation || value.dateOfOperation || '',
      reasons: nextReasons,
    });
  };

  const handleApplyPostponedDateAsMain = () => {
    if (!sp.postponedToDate) return;
    const preservedOriginal = sp.originalDateOfOperation || value.dateOfOperation || '';
    onChange({
      ...value,
      dateOfOperation: sp.postponedToDate,
      formData: {
        ...fd,
        surgeryPostponement: {
          ...sp,
          isPostponed: true,
          originalDateOfOperation: preservedOriginal,
        },
      },
    });
  };

  const updateNotVisited = (patch: Partial<PreOpNotVisitedData>) => {
    const nextNv: PreOpNotVisitedData = {
      ...nv,
      ...patch,
    };
    onChange({
      ...value,
      status: nextNv.isNotVisited && value.status !== 'locked' ? 'draft' : value.status,
      formData: {
        ...fd,
        preOpNotVisited: nextNv,
      },
    });
  };

  const toggleNotVisitedReason = (reasonKey: PreOpNotVisitedReasonKey) => {
    const exists = nv.reasons.includes(reasonKey);
    const nextReasons = exists
      ? nv.reasons.filter((k) => k !== reasonKey)
      : [...nv.reasons, reasonKey];
    updateNotVisited({
      isNotVisited: true,
      reasons: nextReasons,
    });
  };

  const updateFormData = (patch: Partial<EvaluationFormData>) => {
    onChange({
      ...value,
      formData: { ...fd, ...patch },
    });
  };

  const updateHistory = (patch: Partial<EvaluationFormData['history']>) => {
    updateFormData({ history: { ...h, ...patch } });
  };

  const updatePhysical = (patch: Partial<EvaluationFormData['physicalExam']>) => {
    const nextP = { ...p, ...patch };
    if ('bw' in patch || 'ht' in patch) {
      const autoBmi = calculateBmi(nextP.bw, nextP.ht);
      if (autoBmi) nextP.bmi = autoBmi;
    }
    const nextExpectedDiff = nextP.expectedDifficultAirway === 'yes';
    onChange({
      ...value,
      expectedDifficultAirway: nextExpectedDiff,
      formData: { ...fd, physicalExam: nextP },
    });
  };

  const ox: OxygenSupportData = p.oxygenSupport || createEmptyOxygenSupport();

  const updateOxygen = (patch: Partial<OxygenSupportData>) => {
    updatePhysical({
      oxygenSupport: {
        ...ox,
        ...patch,
      },
    });
  };

  const handleAddOxygenPreset = (raw: string) => {
    const trimmed = raw.trim().slice(0, 120);
    if (!trimmed) return;
    if (!oxygenPresets.includes(trimmed)) {
      onUpdateOxygenPresets([...oxygenPresets, trimmed]);
    }
    setNewOxygenPreset('');
  };

  const handleSaveEditedOxygenPreset = () => {
    if (!editingOxygenPreset) return;
    const trimmed = editingOxygenPreset.text.trim().slice(0, 120);
    if (!trimmed) return;
    onUpdateOxygenPresets(
      oxygenPresets.map((item) => (item === editingOxygenPreset.original ? trimmed : item)),
    );
    setEditingOxygenPreset(null);
  };

  const handleRemoveOxygenPreset = (presetName: string) => {
    onUpdateOxygenPresets(oxygenPresets.filter((item) => item !== presetName));
    if (editingOxygenPreset?.original === presetName) {
      setEditingOxygenPreset(null);
    }
  };

  const handleResetOxygenPresets = () => {
    onUpdateOxygenPresets([...DEFAULT_OXYGEN_OTHER_PRESETS]);
    setEditingOxygenPreset(null);
  };

  const handleAddOxygenOtherItem = (raw: string) => {
    const trimmed = raw.trim().slice(0, 150);
    if (!trimmed) return;
    const currentItems = ox.otherItems || [];
    if (currentItems.length >= 10) return;
    if (!currentItems.includes(trimmed)) {
      updateOxygen({
        mode: ox.mode || 'other',
        otherItems: [...currentItems, trimmed],
      });
    }
    setNewOxygenOtherItem('');
  };

  const handleToggleOxygenPresetItem = (presetName: string) => {
    const currentItems = ox.otherItems || [];
    const exists = currentItems.includes(presetName);
    const nextItems = exists
      ? currentItems.filter((item) => item !== presetName)
      : currentItems.length < 10
      ? [...currentItems, presetName]
      : currentItems;
    updateOxygen({
      mode: nextItems.length > 0 ? (ox.mode || 'other') : ox.mode === 'other' ? '' : ox.mode,
      otherItems: nextItems,
    });
  };

  const handleSaveEditedOxygenOther = () => {
    if (!editingOxygenOther) return;
    const trimmed = editingOxygenOther.text.trim().slice(0, 150);
    if (!trimmed) return;
    const nextItems = (ox.otherItems || []).map((item, idx) =>
      idx === editingOxygenOther.index ? trimmed : item,
    );
    updateOxygen({ otherItems: nextItems });
    setEditingOxygenOther(null);
  };

  const handleRemoveOxygenOther = (index: number) => {
    const nextItems = (ox.otherItems || []).filter((_, idx) => idx !== index);
    updateOxygen({
      mode: ox.mode === 'other' && nextItems.length === 0 ? '' : ox.mode,
      otherItems: nextItems,
    });
    if (editingOxygenOther?.index === index) {
      setEditingOxygenOther(null);
    }
  };

  const updateInvestigation = (patch: Partial<EvaluationFormData['investigation']>) => {
    updateFormData({ investigation: { ...inv, ...patch } });
  };

  const physicalExamSectionRef = useRef<HTMLDivElement>(null);
  const labSectionRef = useRef<HTMLDivElement>(null);

  const handlePhysicalExamKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    handleSectionArrowNavigation(e, physicalExamSectionRef.current);
  };

  const handleLabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    handleSectionArrowNavigation(e, labSectionRef.current);
  };

  const updateLab = (field: keyof EvaluationFormData['laboratory'], val: string) => {
    updateFormData({ laboratory: { ...lab, [field]: val } });
  };

  const updateLabPatch = (patch: Partial<EvaluationFormData['laboratory']>) => {
    updateFormData({ laboratory: { ...lab, ...patch } });
  };

  const toggleBloodPrepStatus = (status: BloodPrepStatus) => {
    const current = Array.isArray(lab.prepStatuses) ? lab.prepStatuses : [];
    const exists = current.includes(status);
    if (exists) {
      updateLabPatch({ prepStatuses: current.filter((s) => s !== status) });
      return;
    }

    if (status === 'no_blood') {
      const preserved = current.filter((s) => s === 'other');
      updateLabPatch({
        prepTs: false,
        prepPrc: '',
        prepFfp: '',
        prepPlt: '',
        prepCryo: '',
        prepStatuses: ['no_blood', ...preserved],
      });
      return;
    }

    let next: BloodPrepStatus[] = [...current, status];
    if (status === 'ready') {
      next = next.filter((s) => s !== 'not_ready' && s !== 'no_blood');
    } else if (status === 'not_ready') {
      next = next.filter((s) => s !== 'ready' && s !== 'no_blood');
    } else if (status === 'waiting_red_cross') {
      next = next.filter((s) => s !== 'no_blood');
    }
    updateLabPatch({ prepStatuses: next });
  };

  const updateBloodPrepUnit = (
    field: 'prepPrc' | 'prepFfp' | 'prepPlt' | 'prepCryo',
    val: string,
  ) => {
    const current = Array.isArray(lab.prepStatuses) ? lab.prepStatuses : [];
    const nextStatuses = val.trim() ? current.filter((s) => s !== 'no_blood') : current;
    updateLabPatch({ [field]: val, prepStatuses: nextStatuses });
  };

  const updatePremed = (patch: Partial<EvaluationFormData['premedication']>) => {
    updateFormData({ premedication: { ...pm, ...patch } });
  };

  const updatePlan = (patch: Partial<EvaluationFormData['anestheticPlan']>) => {
    const nextPlan = { ...ap, ...patch };
    onChange({
      ...value,
      anesthesiaType: deriveAnesthesiaType(nextPlan),
      formData: { ...fd, anestheticPlan: nextPlan },
    });
  };

  const toggleTri = (current: TriStatus, target: 'no' | 'yes'): TriStatus =>
    current === target ? 'none' : target;

  const toggleTooth = (cond: ToothCondition) => {
    const exists = p.toothStatus.includes(cond);
    let next: ToothCondition[];
    if (cond === 'Normal') {
      next = exists ? [] : ['Normal'];
    } else {
      const withoutNormal = p.toothStatus.filter((c) => c !== 'Normal');
      next = exists ? withoutNormal.filter((c) => c !== cond) : [...withoutNormal, cond];
    }
    updatePhysical({ toothStatus: next });
  };

  const handleToggleToothMark = (toothId: ToothId) => {
    const missing = p.missingTeeth || [];
    const loose = p.looseTeeth || [];
    const isMissing = missing.includes(toothId);
    const isLoose = loose.includes(toothId);

    let nextMissing = missing.filter((id) => id !== toothId);
    let nextLoose = loose.filter((id) => id !== toothId);

    if (toothMarkMode === 'cycle') {
      if (!isMissing && !isLoose) {
        nextMissing = [...nextMissing, toothId];
      } else if (isMissing) {
        nextLoose = [...nextLoose, toothId];
      }
      // if isLoose -> cleared (neither)
    } else if (toothMarkMode === 'missing') {
      if (!isMissing) {
        nextMissing = [...nextMissing, toothId];
      }
    } else if (toothMarkMode === 'loose') {
      if (!isLoose) {
        nextLoose = [...nextLoose, toothId];
      }
    }

    let nextStatus = [...p.toothStatus];
    if (nextMissing.length > 0) {
      nextStatus = nextStatus.filter((c) => c !== 'Normal');
      if (!nextStatus.includes('Avulsion')) nextStatus.push('Avulsion');
    }
    if (nextLoose.length > 0) {
      nextStatus = nextStatus.filter((c) => c !== 'Normal');
      if (!nextStatus.includes('Loose')) nextStatus.push('Loose');
    }

    updatePhysical({
      missingTeeth: nextMissing,
      looseTeeth: nextLoose,
      toothStatus: nextStatus,
    });
  };

  const toggleGaMethod = (method: GaMethod) => {
    const exists = ap.gaMethods.includes(method);
    const nextMethods = exists
      ? ap.gaMethods.filter((m) => m !== method)
      : [...ap.gaMethods, method];
    updatePlan({
      gaMethods: nextMethods,
      gaSelected: nextMethods.length > 0 ? true : ap.gaSelected,
    });
  };

  const toggleRaMethod = (method: RaMethod) => {
    const exists = ap.raMethods.includes(method);
    const nextMethods = exists
      ? ap.raMethods.filter((m) => m !== method)
      : [...ap.raMethods, method];
    updatePlan({
      raMethods: nextMethods,
      raSelected: nextMethods.length > 0 ? true : ap.raSelected,
    });
  };

  const inputBase =
    'bg-white border border-pborder rounded-md px-2 py-1 text-sm text-[#243040] placeholder:text-slate-400 focus:outline-none focus:border-pblue-400 focus:ring-2 focus:ring-pblue-200/60 transition-colors';

  const radioBtn = (active: boolean, tone: 'default' | 'danger' = 'default') =>
    `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
      active
        ? tone === 'danger'
          ? 'bg-prose-50 border-prose-400 text-prose-800 font-semibold'
          : 'bg-pblue-50 border-pblue-400 text-pblue-800 font-semibold'
        : 'bg-white border-pborder text-slate-700 hover:bg-pblue-50/40'
    }`;

  return (
    <div
      onKeyDown={handleFormTabNavigation}
      className="no-print bg-white border border-pborder rounded-xl overflow-hidden shadow-2xs"
    >
      {/* Hospital Header */}
      <div className="px-5 py-3 border-b border-pblue-200/80 bg-gradient-to-r from-pblue-50/90 via-ppink-50/55 to-pgreen-50/75 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BphLogo className="w-10 h-10 shrink-0" />
          <div>
            <h1 className="text-base font-bold text-pblue-800 leading-tight">
              Bangplee Hospital
            </h1>
            <p className="text-sm font-semibold text-prose-800 leading-tight">
              Pre Anesthetic Evaluation form
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-pblue-800/80 font-mono hidden sm:block">
          ANE-FM-002-03
        </div>
      </div>

      {/* Demographics Block */}
      <div className="px-5 py-3.5 border-b border-slate-300 bg-white space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          <label className="lg:col-span-3 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">
              Name <span className="text-red-600">*</span>
            </span>
            <input
              type="text"
              value={value.patientName}
              onChange={(e) => {
                const nextName = e.target.value;
                const autoGender = value.gender || inferPatientGender(nextName);
                onChange({
                  ...value,
                  patientName: nextName,
                  ...(autoGender && autoGender !== value.gender ? { gender: autoGender } : {}),
                });
              }}
              placeholder="ชื่อ-นามสกุล ผู้ป่วย"
              className={inputBase}
              required
            />
          </label>
          <div className="lg:col-span-1 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">เพศ</span>
            <select
              aria-label="เพศผู้ป่วย"
              value={inferPatientGender(value.patientName, value.gender)}
              onChange={(e) => updateTop('gender', e.target.value as PatientGender)}
              className={inputBase}
            >
              <option value="">ระบุ</option>
              <option value="male">ชาย</option>
              <option value="female">หญิง</option>
            </select>
          </div>
          <label className="lg:col-span-1 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Age (yr)</span>
            <input
              type="text"
              value={value.age}
              onChange={(e) => updateTop('age', e.target.value)}
              placeholder="ปี"
              className={`${inputBase} font-mono tabular-nums`}
            />
          </label>
          <label className="lg:col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">HN</span>
            <input
              type="text"
              value={value.hn}
              onChange={(e) => updateTop('hn', e.target.value)}
              placeholder="เช่น 67014521"
              className={`${inputBase} font-mono tabular-nums`}
            />
          </label>
          <label className="lg:col-span-1 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">AN</span>
            <input
              type="text"
              value={value.an}
              onChange={(e) => updateTop('an', e.target.value)}
              placeholder="AN"
              className={`${inputBase} font-mono tabular-nums`}
            />
          </label>
          <div className="lg:col-span-3 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-slate-600">Ward (หอผู้ป่วย)</span>
              <button
                type="button"
                onClick={() => setIsManagingWards((prev) => !prev)}
                className="inline-flex items-center gap-0.5 text-[11px] font-medium text-blue-800 hover:text-blue-950 whitespace-nowrap"
              >
                <Plus className="w-3 h-3" />
                {isManagingWards ? 'ปิด' : 'เพิ่ม/จัดการ'}
              </button>
            </div>
            {(() => {
              const isListedWard = wardOptions.includes(value.ward);
              const isOtherSelected = value.ward !== '' && !isListedWard;
              return (
                <>
                  <select
                    aria-label="หอผู้ป่วย (Ward)"
                    value={isOtherSelected ? 'อื่นๆ' : value.ward}
                    onChange={(e) => updateTop('ward', e.target.value)}
                    className={inputBase}
                  >
                    <option value="">-- เลือกหอผู้ป่วย --</option>
                    {wardOptions.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                  {isOtherSelected && (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        aria-label="ระบุหอผู้ป่วยอื่นๆ"
                        value={value.ward === 'อื่นๆ' ? '' : value.ward}
                        onChange={(e) => updateTop('ward', e.target.value || 'อื่นๆ')}
                        placeholder="ระบุหอผู้ป่วย..."
                        maxLength={80}
                        className={`${inputBase} min-w-0 flex-1`}
                      />
                      {value.ward !== 'อื่นๆ' && value.ward.trim() && (
                        <button
                          type="button"
                          onClick={() => handleAddWardOption(value.ward)}
                          title="เพิ่มเข้าตัวเลือกหอผู้ป่วย"
                          className="shrink-0 px-2 py-1.5 text-[11px] font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 whitespace-nowrap"
                        >
                          + บันทึก
                        </button>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          <label className="lg:col-span-1 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">เตียง (Bed)</span>
            <input
              type="text"
              value={value.bed ?? ''}
              onChange={(e) => updateTop('bed', e.target.value)}
              placeholder="เตียง"
              maxLength={32}
              className={`${inputBase} font-mono tabular-nums`}
            />
          </label>
        </div>

        {isManagingWards && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">
                จัดการรายการหอผู้ป่วย (เพิ่มหรือลบตัวเลือกได้)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetWardOptions}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
                >
                  <RotateCcw className="w-3 h-3" />
                  รีเซ็ตค่าเริ่มต้น
                </button>
                <button
                  type="button"
                  onClick={() => setIsManagingWards(false)}
                  className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900"
                >
                  ปิด
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={newWardName}
                onChange={(e) => setNewWardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddWardOption(newWardName);
                  }
                }}
                placeholder="พิมพ์ชื่อหอผู้ป่วยใหม่ เช่น OR, ศัลยกรรมกระดูก, สงฆ์อาพาธ"
                maxLength={80}
                className="flex-1 min-w-[220px] bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
              />
              <button
                type="button"
                onClick={() => handleAddWardOption(newWardName)}
                disabled={!newWardName.trim() || newWardName.trim() === 'อื่นๆ'}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-800 rounded-md hover:bg-blue-900 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มหอผู้ป่วย
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {wardOptions.map((w) => (
                <span
                  key={w}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white border border-slate-300 rounded-md text-slate-800"
                >
                  <span>{w}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWardOption(w)}
                    aria-label={`ลบ ${w}`}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
          <label className="lg:col-span-4 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Diagnosis</span>
            <input
              type="text"
              value={value.diagnosis}
              onChange={(e) => updateTop('diagnosis', e.target.value)}
              placeholder="การวินิจฉัยโรค"
              className={inputBase}
            />
          </label>
          <div className="lg:col-span-4">
            <OperationInput
              value={value.operation}
              onChange={(nextOp) => updateTop('operation', nextOp)}
              label="Operation"
              placeholder="พิมพ์หรือเลือกหัตถการ เช่น Appendectomy, C/S, ORIF c PFNA..."
              inputClassName={inputBase}
            />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-slate-600">สาขา (Specialty)</span>
              <button
                type="button"
                onClick={() => setIsManagingSpecialties((prev) => !prev)}
                className="inline-flex items-center gap-0.5 text-[11px] font-medium text-blue-800 hover:text-blue-950 whitespace-nowrap"
              >
                <Plus className="w-3 h-3" />
                {isManagingSpecialties ? 'ปิด' : 'จัดการ'}
              </button>
            </div>
            {(() => {
              const currentSpecialty = value.specialty ?? '';
              const isListedSpecialty = specialtyOptions.includes(currentSpecialty);
              const isOtherSelected = currentSpecialty !== '' && !isListedSpecialty;
              return (
                <>
                  <select
                    aria-label="สาขา (Specialty)"
                    value={isOtherSelected ? 'อื่นๆ' : currentSpecialty}
                    onChange={(e) => updateTop('specialty', e.target.value)}
                    className={inputBase}
                  >
                    <option value="">-- เลือกสาขา --</option>
                    {specialtyOptions.map((sp) => (
                      <option key={sp} value={sp}>
                        {sp}
                      </option>
                    ))}
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                  {isOtherSelected && (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        aria-label="ระบุสาขาอื่นๆ"
                        value={currentSpecialty === 'อื่นๆ' ? '' : currentSpecialty}
                        onChange={(e) => updateTop('specialty', e.target.value || 'อื่นๆ')}
                        placeholder="ระบุชื่อสาขา..."
                        maxLength={80}
                        className={`${inputBase} min-w-0 flex-1`}
                      />
                      {currentSpecialty !== 'อื่นๆ' && currentSpecialty.trim() && (
                        <button
                          type="button"
                          onClick={() => handleAddSpecialtyOption(currentSpecialty)}
                          title="เพิ่มเข้าตัวเลือกสาขา"
                          className="shrink-0 px-2 py-1.5 text-[11px] font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 whitespace-nowrap"
                        >
                          + บันทึก
                        </button>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          <label className="lg:col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Date of visit (พ.ศ.)</span>
            <ThaiDateInput
              ariaLabel="Date of visit (วันที่เยี่ยม พ.ศ.)"
              value={value.dateOfVisit}
              onChange={(next) => updateTop('dateOfVisit', next)}
              wrapperClassName="w-full"
              className={`${inputBase} w-full font-mono tabular-nums`}
            />
          </label>
        </div>

        {isManagingSpecialties && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">
                จัดการรายการสาขา (เพิ่มหรือลบตัวเลือกได้ · {specialtyOptions.length} สาขา)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetSpecialtyOptions}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
                >
                  <RotateCcw className="w-3 h-3" />
                  รีเซ็ตค่าเริ่มต้น
                </button>
                <button
                  type="button"
                  onClick={() => setIsManagingSpecialties(false)}
                  className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900"
                >
                  ปิด
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={newSpecialtyName}
                onChange={(e) => setNewSpecialtyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSpecialtyOption(newSpecialtyName);
                  }
                }}
                placeholder="พิมพ์ชื่อสาขาใหม่ เช่น CVT, Ped, Gyn, Spine"
                maxLength={80}
                className="flex-1 min-w-[220px] bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
              />
              <button
                type="button"
                onClick={() => handleAddSpecialtyOption(newSpecialtyName)}
                disabled={!newSpecialtyName.trim() || newSpecialtyName.trim() === 'อื่นๆ'}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-800 rounded-md hover:bg-blue-900 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มสาขา
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {specialtyOptions.map((sp) => (
                <span
                  key={sp}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white border border-slate-300 rounded-md text-slate-800"
                >
                  <span>{sp}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecialtyOption(sp)}
                    aria-label={`ลบสาขา ${sp}`}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          <div className="sm:col-span-2 lg:col-span-6 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-slate-600">
                Surgeon (แพทย์ผ่าตัด)
              </span>
              <button
                type="button"
                onClick={() => setIsManagingSurgeons((prev) => !prev)}
                className="inline-flex items-center gap-0.5 text-[11px] font-medium text-blue-800 hover:text-blue-950 whitespace-nowrap"
              >
                <Plus className="w-3 h-3" />
                {isManagingSurgeons ? 'ปิด' : 'เพิ่ม/ลดรายชื่อ'}
              </button>
            </div>
            {(() => {
              const currentSurgeon = value.surgeon ?? '';
              const isListedSurgeon = surgeonOptions.includes(currentSurgeon);
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div className="flex items-center gap-1 min-w-0">
                    <select
                      aria-label="เลือกแพทย์ผ่าตัด (Surgeon)"
                      value={isListedSurgeon ? currentSurgeon : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          updateTop('surgeon', e.target.value);
                        } else if (isListedSurgeon) {
                          updateTop('surgeon', '');
                        }
                      }}
                      className={`${inputBase} min-w-0 flex-1`}
                    >
                      <option value="">-- เลือกรายชื่อแพทย์ --</option>
                      {surgeonOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {isListedSurgeon && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSurgeonOption(currentSurgeon)}
                        title={`ลบ ${currentSurgeon} ออกจากตัวเลือก`}
                        aria-label={`ลบ ${currentSurgeon} ออกจากตัวเลือก`}
                        className="shrink-0 p-1.5 text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    <input
                      type="text"
                      aria-label="พิมพ์ชื่อแพทย์ผ่าตัดเพิ่มเติม"
                      value={currentSurgeon === 'อื่นๆ' ? '' : currentSurgeon}
                      onChange={(e) => updateTop('surgeon', e.target.value)}
                      placeholder="หรือพิมพ์ชื่อแพทย์เพิ่มเติม..."
                      maxLength={120}
                      className={`${inputBase} min-w-0 flex-1`}
                    />
                    {currentSurgeon.trim() && currentSurgeon !== 'อื่นๆ' && (
                      <button
                        type="button"
                        onClick={() => updateTop('surgeon', '')}
                        title="ล้างชื่อแพทย์ในช่องนี้"
                        aria-label="ล้างชื่อแพทย์ในช่องนี้"
                        className="shrink-0 p-1 text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {currentSurgeon.trim() &&
                      currentSurgeon !== 'อื่นๆ' &&
                      !isListedSurgeon && (
                        <button
                          type="button"
                          onClick={() => handleAddSurgeonOption(currentSurgeon)}
                          title="เพิ่มชื่อนี้เข้าตัวเลือกแพทย์ผ่าตัด"
                          className="shrink-0 px-2 py-1 text-[11px] font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 whitespace-nowrap"
                        >
                          + บันทึก
                        </button>
                      )}
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="lg:col-span-2 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-slate-600">Date of operation</span>
              <div className="flex items-center gap-0.5">
                {(() => {
                  const todayIso = getTodayIsoDate();
                  return [
                    { label: 'วันนี้', val: todayIso },
                    { label: 'พรุ่งนี้', val: addDaysToIsoDate(todayIso, 1) },
                    { label: 'มะรืน', val: addDaysToIsoDate(todayIso, 2) },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => updateTop('dateOfOperation', opt.val)}
                      className={`px-1 py-0.5 text-[10px] font-medium rounded border transition-colors ${
                        value.dateOfOperation === opt.val
                          ? 'bg-blue-800 text-white border-blue-800'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ));
                })()}
              </div>
            </div>
            <ThaiDateInput
              ariaLabel="Date of operation (วันที่ทำผ่าตัด พ.ศ.)"
              value={value.dateOfOperation}
              onChange={(next) => updateTop('dateOfOperation', next)}
              wrapperClassName="w-full"
              className={`${inputBase} w-full font-mono tabular-nums`}
            />
            {value.dateOfOperation && (
              <span className="text-[11px] text-blue-900 truncate">
                {formatThaiScheduleDate(value.dateOfOperation).label}
              </span>
            )}
          </div>
          <label className="lg:col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">เวลาทำผ่าตัด (24 ชม.)</span>
            <Time24Input
              ariaLabel="เวลาทำผ่าตัด (24 ชั่วโมง)"
              value={value.operationTime ?? ''}
              onChange={(next) => updateTop('operationTime', next)}
              wrapperClassName="w-full"
              className={`${inputBase} w-full font-mono tabular-nums`}
            />
          </label>
          <div className="lg:col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">ตารางผ่าตัด / ห้อง OR / คิว</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    scheduleType: 'elective',
                    asaEmergency: false,
                  })
                }
                className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                  getEffectiveScheduleType(value) === 'elective'
                    ? 'bg-blue-50 border-blue-800 text-blue-900'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Elective
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    scheduleType: 'emergency',
                    asaEmergency: true,
                  })
                }
                className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                  getEffectiveScheduleType(value) === 'emergency'
                    ? 'bg-red-50 border-red-600 text-red-800'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Emerg
              </button>
            </div>
            <div className="flex items-center gap-1">
              <select
                aria-label="ห้องผ่าตัด (OR Room)"
                value={OR_ROOM_OPTIONS.includes((value.orRoom ?? '') as (typeof OR_ROOM_OPTIONS)[number]) ? value.orRoom : ''}
                onChange={(e) => updateTop('orRoom', e.target.value)}
                className={`${inputBase} min-w-0 flex-1`}
              >
                <option value="">ห้อง OR</option>
                {OR_ROOM_OPTIONS.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
              <input
                type="text"
                aria-label="ลำดับคิวผ่าตัด"
                value={value.caseOrder ?? ''}
                onChange={(e) => updateTop('caseOrder', e.target.value)}
                placeholder="คิว#"
                maxLength={16}
                className={`${inputBase} w-14 font-mono tabular-nums`}
              />
            </div>
          </div>
        </div>

        {isManagingSurgeons && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">
                จัดการรายชื่อแพทย์ผ่าตัด (เพิ่ม แก้ไข หรือลบรายชื่อได้ · {surgeonOptions.length} รายชื่อ)
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {surgeonOptions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllSurgeons}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-700 bg-white border border-red-200 rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    ล้างทั้งหมด
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetSurgeonOptions}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
                >
                  <RotateCcw className="w-3 h-3" />
                  รีเซ็ตค่าเริ่มต้น
                </button>
                <button
                  type="button"
                  onClick={() => setIsManagingSurgeons(false)}
                  className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900"
                >
                  ปิด
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={newSurgeonName}
                onChange={(e) => setNewSurgeonName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSurgeonOption(newSurgeonName);
                  }
                }}
                placeholder="พิมพ์ชื่อแพทย์ผ่าตัดใหม่ เช่น นพ.สมชาย ใจดี"
                maxLength={120}
                className="flex-1 min-w-[220px] bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
              />
              <button
                type="button"
                onClick={() => handleAddSurgeonOption(newSurgeonName)}
                disabled={!newSurgeonName.trim() || newSurgeonName.trim() === 'อื่นๆ'}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-800 rounded-md hover:bg-blue-900 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มรายชื่อแพทย์
              </button>
            </div>

            {surgeonOptions.length === 0 ? (
              <p className="text-xs text-slate-500 py-1">
                ยังไม่มีรายชื่อแพทย์ในตัวเลือก (สามารถพิมพ์เพิ่มด้านบน หรือกดรีเซ็ตค่าเริ่มต้น)
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {surgeonOptions.map((s) => {
                  const isEditing = editingSurgeon?.original === s;
                  return isEditing ? (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-white border border-blue-800 rounded-md"
                    >
                      <input
                        type="text"
                        value={editingSurgeon.text}
                        onChange={(e) =>
                          setEditingSurgeon({ original: s, text: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveEditedSurgeon();
                          } else if (e.key === 'Escape') {
                            setEditingSurgeon(null);
                          }
                        }}
                        maxLength={120}
                        autoFocus
                        className="w-44 text-xs text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEditedSurgeon}
                        aria-label="บันทึกชื่อที่แก้ไข"
                        className="p-0.5 text-emerald-700 hover:bg-emerald-50 rounded"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSurgeon(null)}
                        aria-label="ยกเลิกการแก้ไข"
                        className="p-0.5 text-slate-400 hover:text-slate-700 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ) : (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white border border-slate-300 rounded-md text-slate-800"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => setEditingSurgeon({ original: s, text: s })}
                        aria-label={`แก้ไข ${s}`}
                        title="แก้ไขชื่อ"
                        className="p-0.5 text-slate-400 hover:text-blue-800 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSurgeonOption(s)}
                        aria-label={`ลบ ${s}`}
                        title="ลบรายชื่อ"
                        className="p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Surgery Postponement & Pre-op Draft / Not-Visited Status Controls */}
        <div className="pt-2.5 border-t border-slate-200 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <label
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                sp.isPostponed
                  ? 'bg-amber-50 border-amber-400 text-amber-950'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={sp.isPostponed}
                onChange={(e) => {
                  const checked = e.target.checked;
                  updatePostponement({
                    isPostponed: checked,
                    originalDateOfOperation:
                      checked && !sp.originalDateOfOperation
                        ? value.dateOfOperation || ''
                        : sp.originalDateOfOperation,
                  });
                }}
                className="rounded border-slate-300 text-amber-700 focus:ring-amber-600"
              />
              <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>เลื่อนวันผ่าตัด</span>
              {sp.isPostponed && sp.postponedToDate && (
                <span className="font-mono tabular-nums text-[11px] text-amber-800">
                  → {formatThaiDateBE(sp.postponedToDate)}
                </span>
              )}
            </label>

            <label
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                nv.isNotVisited
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={nv.isNotVisited}
                onChange={(e) => updateNotVisited({ isNotVisited: e.target.checked })}
                className="rounded border-slate-300 text-rose-700 focus:ring-rose-600"
              />
              <FileText className="w-3.5 h-3.5 text-rose-700 shrink-0" />
              <span>ใบเยี่ยม Pre-op ฉบับร่าง (ไม่ได้เยี่ยม)</span>
            </label>

            {sp.isPostponed && formatPostponementReasons(sp, true) && (
              <span className="text-[11px] text-amber-900 truncate max-w-md">
                เหตุผลเลื่อน: {formatPostponementReasons(sp, true)}
              </span>
            )}
            {nv.isNotVisited && formatPreOpNotVisitedReasons(nv, true) && (
              <span className="text-[11px] text-rose-800 truncate max-w-md">
                ไม่ได้เยี่ยม: {formatPreOpNotVisitedReasons(nv, true)}
              </span>
            )}
          </div>

          {sp.isPostponed && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-amber-950">
                  บันทึกการเลื่อนวันผ่าตัด (ข้อมูลจะถูกสรุปอัตโนมัติในหน้าแดชบอร์ด)
                </div>
                <button
                  type="button"
                  onClick={() => updatePostponement(createEmptySurgeryPostponement())}
                  className="text-[11px] font-medium text-amber-800 hover:text-amber-950 hover:underline"
                >
                  ยกเลิกการเลื่อน
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <label className="sm:col-span-4 flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-amber-950">
                    วันผ่าตัดเดิม (พ.ศ.)
                  </span>
                  <ThaiDateInput
                    ariaLabel="วันผ่าตัดเดิม (พ.ศ.)"
                    value={sp.originalDateOfOperation}
                    onChange={(next) => updatePostponement({ originalDateOfOperation: next })}
                    wrapperClassName="w-full"
                    className={`${inputBase} w-full font-mono tabular-nums`}
                  />
                </label>

                <label className="sm:col-span-4 flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-amber-950">
                    เลื่อนไปวันที่ผ่าตัดใหม่ (พ.ศ. · เว้นว่างได้หากยังไม่กำหนด)
                  </span>
                  <ThaiDateInput
                    ariaLabel="เลื่อนไปวันที่ผ่าตัดใหม่ (พ.ศ.)"
                    value={sp.postponedToDate}
                    onChange={(next) => updatePostponement({ postponedToDate: next })}
                    wrapperClassName="w-full"
                    className={`${inputBase} w-full font-mono tabular-nums`}
                  />
                </label>

                <div className="sm:col-span-4 flex items-center gap-2">
                  {sp.postponedToDate && sp.postponedToDate !== value.dateOfOperation && (
                    <button
                      type="button"
                      onClick={handleApplyPostponedDateAsMain}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-950 bg-white border border-amber-300 rounded-md hover:bg-amber-100 transition-colors whitespace-nowrap"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      อัปเดตเป็นวันผ่าตัดหลัก
                    </button>
                  )}
                  {sp.postponedToDate && sp.postponedToDate === value.dateOfOperation && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      อัปเดตวันผ่าตัดหลักแล้ว
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-amber-950">
                  เหตุผลที่เลื่อนผ่าตัด (เลือกได้มากกว่า 1 ข้อ)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                  {SURGERY_POSTPONEMENT_REASON_OPTIONS.map((opt) => {
                    const checked = sp.reasons.includes(opt.key);
                    return (
                      <label
                        key={opt.key}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'bg-amber-100/90 border-amber-400 text-amber-950 font-medium'
                            : 'bg-white border-amber-200/80 text-slate-700 hover:bg-amber-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePostponementReason(opt.key)}
                          className="rounded border-slate-300 text-amber-700 focus:ring-amber-600"
                        />
                        <span className="truncate">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sp.reasons.includes('other') && (
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-amber-950">
                      ระบุเหตุผลอื่นๆ ที่เลื่อนผ่าตัด
                    </span>
                    <input
                      type="text"
                      value={sp.otherReasonDetail}
                      onChange={(e) => updatePostponement({ otherReasonDetail: e.target.value })}
                      placeholder="เช่น มีไข้ / ติดเชื้อเฉียบพลัน / รอปรับยา..."
                      maxLength={300}
                      className={inputBase}
                    />
                  </label>
                )}
                <label
                  className={`flex flex-col gap-1 ${
                    sp.reasons.includes('other') ? '' : 'sm:col-span-2'
                  }`}
                >
                  <span className="text-[11px] font-medium text-amber-950">
                    รายละเอียดเพิ่มเติม / แผนติดตาม (เช่น จอง PRC 2 u, รอ Echo, Consult Med)
                  </span>
                  <input
                    type="text"
                    value={sp.note}
                    onChange={(e) => updatePostponement({ note: e.target.value })}
                    placeholder="ระบุรายละเอียดประกอบการเลื่อนผ่าตัด (ไม่บังคับ)..."
                    maxLength={500}
                    className={inputBase}
                  />
                </label>
              </div>
            </div>
          )}

          {nv.isNotVisited && (
            <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-rose-950">
                    ใบเยี่ยม Pre-op ฉบับร่าง — ไม่ได้เยี่ยมผู้ป่วย
                  </div>
                  <p className="text-[11px] text-rose-800/90 mt-0.5">
                    บันทึกนี้จะคงสถานะเป็นฉบับร่าง (Draft) และเก็บสถิติเหตุผลที่ไม่ได้เยี่ยมไว้ในหน้าแดชบอร์ด
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateNotVisited(createEmptyPreOpNotVisited())}
                  className="text-[11px] font-medium text-rose-800 hover:text-rose-950 hover:underline"
                >
                  ยกเลิก (กลับมาเยี่ยมตามปกติ)
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-rose-950">
                  เหตุผลที่ไม่ได้เยี่ยม Pre-op (เลือกได้มากกว่า 1 ข้อ)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                  {PRE_OP_NOT_VISITED_REASON_OPTIONS.map((opt) => {
                    const checked = nv.reasons.includes(opt.key);
                    return (
                      <label
                        key={opt.key}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'bg-rose-100/90 border-rose-400 text-rose-950 font-medium'
                            : 'bg-white border-rose-200/80 text-slate-700 hover:bg-rose-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleNotVisitedReason(opt.key)}
                          className="rounded border-slate-300 text-rose-700 focus:ring-rose-600"
                        />
                        <span className="truncate">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {nv.reasons.includes('other') && (
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-rose-950">
                      ระบุเหตุผลอื่นๆ ที่ไม่ได้เยี่ยม
                    </span>
                    <input
                      type="text"
                      value={nv.otherReasonDetail}
                      onChange={(e) => updateNotVisited({ otherReasonDetail: e.target.value })}
                      placeholder="ระบุเหตุผลอื่นๆ..."
                      maxLength={300}
                      className={inputBase}
                    />
                  </label>
                )}
                <label
                  className={`flex flex-col gap-1 ${
                    nv.reasons.includes('other') ? '' : 'sm:col-span-2'
                  }`}
                >
                  <span className="text-[11px] font-medium text-rose-950">
                    หมายเหตุเพิ่มเติม (ไม่บังคับ)
                  </span>
                  <input
                    type="text"
                    value={nv.note}
                    onChange={(e) => updateNotVisited({ note: e.target.value })}
                    placeholder="ระบุรายละเอียดเพิ่มเติม เช่น แจ้งหอผู้ป่วยแล้ว / นัดตรวจใหม่..."
                    maxLength={500}
                    className={inputBase}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column Clinical Grid (Mirroring Paper Form Left & Right Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-slate-300">
        {/* LEFT COLUMN: 1. History, 3. Investigation, 5. Premedication */}
        <div className="lg:border-r border-slate-300 divide-y divide-slate-300">
          {/* 1. History */}
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-bold text-pblue-800 bg-pblue-50/85 border border-pblue-200/80 rounded-lg px-3 py-1.5">
              1. History
            </h2>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700">1.1 Present illness</span>
              <textarea
                rows={2}
                value={h.presentIllness}
                onChange={(e) => updateHistory({ presentIllness: e.target.value })}
                placeholder="อาการสำคัญและประวัติปัจจุบัน..."
                className={`${inputBase} w-full resize-y`}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700">1.2 Past illness</span>
              <textarea
                rows={2}
                value={h.pastIllness}
                onChange={(e) => updateHistory({ pastIllness: e.target.value })}
                placeholder="ประวัติการเจ็บป่วยในอดีต..."
                className={`${inputBase} w-full resize-y`}
              />
            </label>

            {/* 1.3 Allergy */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">1.3 Allergy</span>
                <button
                  type="button"
                  onClick={() => updateHistory({ allergyStatus: toggleTri(h.allergyStatus, 'no') })}
                  className={radioBtn(h.allergyStatus === 'no')}
                >
                  {h.allergyStatus === 'no' ? '●' : '○'} No
                </button>
                <button
                  type="button"
                  onClick={() => updateHistory({ allergyStatus: toggleTri(h.allergyStatus, 'yes') })}
                  className={radioBtn(h.allergyStatus === 'yes', 'danger')}
                >
                  {h.allergyStatus === 'yes' ? '●' : '○'} Yes
                </button>
                {h.allergyStatus === 'yes' && (
                  <input
                    type="text"
                    value={h.allergyDetail}
                    onChange={(e) => updateHistory({ allergyDetail: e.target.value })}
                    placeholder="ระบุยา/อาหารและอาการที่แพ้"
                    className={`${inputBase} flex-1 min-w-[180px] border-red-300`}
                  />
                )}
              </div>
            </div>

            {/* 1.4 Underlying & Medication */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">1.4 Underlying</span>
                <button
                  type="button"
                  onClick={() =>
                    updateHistory({ underlyingStatus: toggleTri(h.underlyingStatus, 'no') })
                  }
                  className={radioBtn(h.underlyingStatus === 'no')}
                >
                  {h.underlyingStatus === 'no' ? '●' : '○'} No
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateHistory({ underlyingStatus: toggleTri(h.underlyingStatus, 'yes') })
                  }
                  className={radioBtn(h.underlyingStatus === 'yes')}
                >
                  {h.underlyingStatus === 'yes' ? '●' : '○'} Yes
                </button>
                <span className="text-slate-300 select-none">|</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = h.underlyingControl === 'good' ? '' : 'good';
                    updateHistory({
                      underlyingControl: next,
                      underlyingStatus: next ? 'yes' : h.underlyingStatus,
                    });
                  }}
                  className={radioBtn(h.underlyingControl === 'good')}
                >
                  {h.underlyingControl === 'good' ? '●' : '○'} Good control
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = h.underlyingControl === 'poor' ? '' : 'poor';
                    updateHistory({
                      underlyingControl: next,
                      underlyingStatus: next ? 'yes' : h.underlyingStatus,
                    });
                  }}
                  className={radioBtn(h.underlyingControl === 'poor', 'danger')}
                >
                  {h.underlyingControl === 'poor' ? '●' : '○'} Poor control
                </button>
              </div>

              <div className="space-y-3 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <div className="space-y-2">
                  {/* DM */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 cursor-pointer w-[84px] shrink-0">
                      <input
                        type="checkbox"
                        checked={h.dm}
                        onChange={(e) =>
                          updateHistory({
                            dm: e.target.checked,
                            underlyingStatus: e.target.checked ? 'yes' : h.underlyingStatus,
                          })
                        }
                        className="rounded border-slate-400 text-blue-800 focus:ring-blue-800"
                      />
                      DM
                    </label>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="text"
                        value={h.dmYears}
                        onChange={(e) =>
                          updateHistory({
                            dmYears: e.target.value,
                            dm: e.target.value.trim() ? true : h.dm,
                            underlyingStatus: e.target.value.trim() ? 'yes' : h.underlyingStatus,
                          })
                        }
                        placeholder="จำนวน"
                        className={`${inputBase} w-12 text-center font-mono tabular-nums text-xs`}
                      />
                      <span className="text-xs text-slate-500">ปี</span>
                    </div>
                    <div className="inline-flex rounded border border-slate-300 overflow-hidden text-[11px] shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const next = h.dmControl === 'good' ? '' : 'good';
                          updateHistory({
                            dmControl: next,
                            dm: next ? true : h.dm,
                            underlyingStatus: next ? 'yes' : h.underlyingStatus,
                          });
                        }}
                        className={`px-2 py-0.5 font-medium transition-colors ${
                          h.dmControl === 'good'
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Good
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = h.dmControl === 'poor' ? '' : 'poor';
                          updateHistory({
                            dmControl: next,
                            dm: next ? true : h.dm,
                            underlyingStatus: next ? 'yes' : h.underlyingStatus,
                          });
                        }}
                        className={`px-2 py-0.5 font-medium border-l border-slate-300 transition-colors ${
                          h.dmControl === 'poor'
                            ? 'bg-red-700 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Poor
                      </button>
                    </div>
                    <input
                      type="text"
                      value={h.dmDetail ?? ''}
                      onChange={(e) =>
                        updateHistory({
                          dmDetail: e.target.value,
                          dm: e.target.value.trim() ? true : h.dm,
                          underlyingStatus: e.target.value.trim() ? 'yes' : h.underlyingStatus,
                        })
                      }
                      maxLength={200}
                      placeholder="รายละเอียด DM (เช่น ฉีด Insulin / HbA1c / ขาดยา)"
                      className={`${inputBase} flex-1 min-w-[150px] text-xs`}
                    />
                  </div>

                  {/* HT */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 cursor-pointer w-[84px] shrink-0">
                      <input
                        type="checkbox"
                        checked={h.ht}
                        onChange={(e) =>
                          updateHistory({
                            ht: e.target.checked,
                            underlyingStatus: e.target.checked ? 'yes' : h.underlyingStatus,
                          })
                        }
                        className="rounded border-slate-400 text-blue-800 focus:ring-blue-800"
                      />
                      HT
                    </label>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="text"
                        value={h.htYears}
                        onChange={(e) =>
                          updateHistory({
                            htYears: e.target.value,
                            ht: e.target.value.trim() ? true : h.ht,
                            underlyingStatus: e.target.value.trim() ? 'yes' : h.underlyingStatus,
                          })
                        }
                        placeholder="จำนวน"
                        className={`${inputBase} w-12 text-center font-mono tabular-nums text-xs`}
                      />
                      <span className="text-xs text-slate-500">ปี</span>
                    </div>
                    <div className="inline-flex rounded border border-slate-300 overflow-hidden text-[11px] shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const next = h.htControl === 'good' ? '' : 'good';
                          updateHistory({
                            htControl: next,
                            ht: next ? true : h.ht,
                            underlyingStatus: next ? 'yes' : h.underlyingStatus,
                          });
                        }}
                        className={`px-2 py-0.5 font-medium transition-colors ${
                          h.htControl === 'good'
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Good
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = h.htControl === 'poor' ? '' : 'poor';
                          updateHistory({
                            htControl: next,
                            ht: next ? true : h.ht,
                            underlyingStatus: next ? 'yes' : h.underlyingStatus,
                          });
                        }}
                        className={`px-2 py-0.5 font-medium border-l border-slate-300 transition-colors ${
                          h.htControl === 'poor'
                            ? 'bg-red-700 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Poor
                      </button>
                    </div>
                    <input
                      type="text"
                      value={h.htDetail ?? ''}
                      onChange={(e) =>
                        updateHistory({
                          htDetail: e.target.value,
                          ht: e.target.value.trim() ? true : h.ht,
                          underlyingStatus: e.target.value.trim() ? 'yes' : h.underlyingStatus,
                        })
                      }
                      maxLength={200}
                      placeholder="รายละเอียด HT (เช่น BP ประจำ / ขาดยา)"
                      className={`${inputBase} flex-1 min-w-[150px] text-xs`}
                    />
                  </div>

                  {/* DLP */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 cursor-pointer w-[84px] shrink-0">
                      <input
                        type="checkbox"
                        checked={Boolean(h.dlp)}
                        onChange={(e) =>
                          updateHistory({
                            dlp: e.target.checked,
                            underlyingStatus: e.target.checked ? 'yes' : h.underlyingStatus,
                          })
                        }
                        className="rounded border-slate-400 text-blue-800 focus:ring-blue-800"
                      />
                      DLP
                    </label>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="text"
                        value={h.dlpYears ?? ''}
                        onChange={(e) =>
                          updateHistory({
                            dlpYears: e.target.value,
                            dlp: e.target.value.trim() ? true : h.dlp,
                            underlyingStatus: e.target.value.trim() ? 'yes' : h.underlyingStatus,
                          })
                        }
                        placeholder="จำนวน"
                        className={`${inputBase} w-12 text-center font-mono tabular-nums text-xs`}
                      />
                      <span className="text-xs text-slate-500">ปี</span>
                    </div>
                    <div className="inline-flex rounded border border-slate-300 overflow-hidden text-[11px] shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const next = h.dlpControl === 'good' ? '' : 'good';
                          updateHistory({
                            dlpControl: next,
                            dlp: next ? true : h.dlp,
                            underlyingStatus: next ? 'yes' : h.underlyingStatus,
                          });
                        }}
                        className={`px-2 py-0.5 font-medium transition-colors ${
                          h.dlpControl === 'good'
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Good
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = h.dlpControl === 'poor' ? '' : 'poor';
                          updateHistory({
                            dlpControl: next,
                            dlp: next ? true : h.dlp,
                            underlyingStatus: next ? 'yes' : h.underlyingStatus,
                          });
                        }}
                        className={`px-2 py-0.5 font-medium border-l border-slate-300 transition-colors ${
                          h.dlpControl === 'poor'
                            ? 'bg-red-700 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Poor
                      </button>
                    </div>
                    <input
                      type="text"
                      value={h.dlpDetail ?? ''}
                      onChange={(e) =>
                        updateHistory({
                          dlpDetail: e.target.value,
                          dlp: e.target.value.trim() ? true : h.dlp,
                          underlyingStatus: e.target.value.trim() ? 'yes' : h.underlyingStatus,
                        })
                      }
                      maxLength={200}
                      placeholder="รายละเอียด DLP (เช่น ทานยาสม่ำเสมอ)"
                      className={`${inputBase} flex-1 min-w-[150px] text-xs`}
                    />
                  </div>

                  {/* โรคไต */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 cursor-pointer w-[84px] shrink-0">
                      <input
                        type="checkbox"
                        checked={Boolean(h.ckd)}
                        onChange={(e) =>
                          updateHistory({
                            ckd: e.target.checked,
                            underlyingStatus: e.target.checked ? 'yes' : h.underlyingStatus,
                          })
                        }
                        className="rounded border-slate-400 text-blue-800 focus:ring-blue-800"
                      />
                      โรคไต
                    </label>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="text"
                        value={h.ckdYears ?? ''}
                        onChange={(e) =>
                          updateHistory({
                            ckdYears: e.target.value,
                            ckd: e.target.value.trim() ? true : h.ckd,
                            underlyingStatus: e.target.value.trim() ? 'yes' : h.underlyingStatus,
                          })
                        }
                        placeholder="จำนวน"
                        className={`${inputBase} w-12 text-center font-mono tabular-nums text-xs`}
                      />
                      <span className="text-xs text-slate-500">ปี</span>
                    </div>
                    <div className="inline-flex rounded border border-slate-300 overflow-hidden text-[11px] shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const next = h.ckdControl === 'good' ? '' : 'good';
                          updateHistory({
                            ckdControl: next,
                            ckd: next ? true : h.ckd,
                            underlyingStatus: next ? 'yes' : h.underlyingStatus,
                          });
                        }}
                        className={`px-2 py-0.5 font-medium transition-colors ${
                          h.ckdControl === 'good'
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Good
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = h.ckdControl === 'poor' ? '' : 'poor';
                          updateHistory({
                            ckdControl: next,
                            ckd: next ? true : h.ckd,
                            underlyingStatus: next ? 'yes' : h.underlyingStatus,
                          });
                        }}
                        className={`px-2 py-0.5 font-medium border-l border-slate-300 transition-colors ${
                          h.ckdControl === 'poor'
                            ? 'bg-red-700 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Poor
                      </button>
                    </div>
                    <input
                      type="text"
                      value={h.ckdDetail ?? ''}
                      onChange={(e) =>
                        updateHistory({
                          ckdDetail: e.target.value,
                          ckd: e.target.value.trim() ? true : h.ckd,
                          underlyingStatus: e.target.value.trim() ? 'yes' : h.underlyingStatus,
                        })
                      }
                      maxLength={200}
                      placeholder="รายละเอียดโรคไต (เช่น CKD stage 3 / HD วัน จ-พ-ศ / CAPD)"
                      className={`${inputBase} flex-1 min-w-[150px] text-xs`}
                    />
                  </div>

                  {/* โรคหัวใจ */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 cursor-pointer w-[84px] shrink-0">
                      <input
                        type="checkbox"
                        checked={h.heartDisease}
                        onChange={(e) =>
                          updateHistory({
                            heartDisease: e.target.checked,
                            underlyingStatus: e.target.checked ? 'yes' : h.underlyingStatus,
                          })
                        }
                        className="rounded border-slate-400 text-blue-800 focus:ring-blue-800"
                      />
                      โรคหัวใจ
                    </label>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="text"
                        value={h.heartDiseaseYears}
                        onChange={(e) =>
                          updateHistory({
                            heartDiseaseYears: e.target.value,
                            heartDisease: e.target.value.trim() ? true : h.heartDisease,
                            underlyingStatus: e.target.value.trim() ? 'yes' : h.underlyingStatus,
                          })
                        }
                        placeholder="จำนวน"
                        className={`${inputBase} w-12 text-center font-mono tabular-nums text-xs`}
                      />
                      <span className="text-xs text-slate-500">ปี</span>
                    </div>
                    <div className="inline-flex rounded border border-slate-300 overflow-hidden text-[11px] shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const next = h.heartDiseaseControl === 'good' ? '' : 'good';
                          updateHistory({
                            heartDiseaseControl: next,
                            heartDisease: next ? true : h.heartDisease,
                            underlyingStatus: next ? 'yes' : h.underlyingStatus,
                          });
                        }}
                        className={`px-2 py-0.5 font-medium transition-colors ${
                          h.heartDiseaseControl === 'good'
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Good
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = h.heartDiseaseControl === 'poor' ? '' : 'poor';
                          updateHistory({
                            heartDiseaseControl: next,
                            heartDisease: next ? true : h.heartDisease,
                            underlyingStatus: next ? 'yes' : h.underlyingStatus,
                          });
                        }}
                        className={`px-2 py-0.5 font-medium border-l border-slate-300 transition-colors ${
                          h.heartDiseaseControl === 'poor'
                            ? 'bg-red-700 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Poor
                      </button>
                    </div>
                    <input
                      type="text"
                      value={h.heartDiseaseDetail ?? ''}
                      onChange={(e) =>
                        updateHistory({
                          heartDiseaseDetail: e.target.value,
                          heartDisease: e.target.value.trim() ? true : h.heartDisease,
                          underlyingStatus: e.target.value.trim() ? 'yes' : h.underlyingStatus,
                        })
                      }
                      maxLength={200}
                      placeholder="รายละเอียดโรคหัวใจ (เช่น CAD / AF / EF% / ทำ PCI)"
                      className={`${inputBase} flex-1 min-w-[150px] text-xs`}
                    />
                  </div>
                </div>

                {/* Additional underlying rows + General underlying detail */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-600 block">
                      และอื่นๆ
                    </span>
                    {h.otherUnderlying.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const next = [...h.otherUnderlying];
                            next[idx] = e.target.value;
                            updateHistory({
                              otherUnderlying: next,
                              underlyingStatus: e.target.value.trim()
                                ? 'yes'
                                : h.underlyingStatus,
                            });
                          }}
                          placeholder="เช่น Asthma, COPD, Stroke, Thyroid (ระบุรายละเอียดได้)"
                          className={`${inputBase} flex-1 text-xs`}
                        />
                        {h.otherUnderlying.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = h.otherUnderlying.filter((_, i) => i !== idx);
                              updateHistory({ otherUnderlying: next });
                            }}
                            aria-label="ลบโรคประจำตัว"
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {h.otherUnderlying.length < 8 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateHistory({ otherUnderlying: [...h.otherUnderlying, ''] })
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-800 hover:text-blue-900"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        เพิ่มโรคประจำตัว
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 block">
                      รายละเอียดโรคประจำตัวเพิ่มเติม
                    </label>
                    <textarea
                      rows={3}
                      value={h.underlyingDetail ?? ''}
                      onChange={(e) =>
                        updateHistory({
                          underlyingDetail: e.target.value,
                          underlyingStatus: e.target.value.trim()
                            ? 'yes'
                            : h.underlyingStatus,
                        })
                      }
                      maxLength={500}
                      placeholder="เช่น รักษาต่อเนื่องที่ รพ.บางพลี รับประทานยาสม่ำเสมอ / ผล Echo ล่าสุด / ประวัติขาดยา / อาการกำเริบล่าสุด..."
                      className={`${inputBase} w-full text-xs resize-y`}
                    />
                  </div>
                </div>

                {/* Full-width Grouped Medication Selector */}
                <div className="pt-2 border-t border-slate-200">
                  <MedicationGroupSelector
                    groups={medicationGroups}
                    medicationText={h.medication}
                    dateOfOperation={value.dateOfOperation}
                    onChangeMedicationText={(nextText, autoUnderlying) => {
                      const nextPremedItems = syncPremedicationWithMedications(
                        pm.items,
                        h.medication,
                        nextText,
                      );
                      updateFormData({
                        history: {
                          ...h,
                          medication: nextText,
                          ...(autoUnderlying === 'ht' ? { ht: true, underlyingStatus: 'yes' } : {}),
                          ...(autoUnderlying === 'dm' ? { dm: true, underlyingStatus: 'yes' } : {}),
                          ...(autoUnderlying === 'dlp' ? { dlp: true, underlyingStatus: 'yes' } : {}),
                          ...(autoUnderlying === 'heartDisease'
                            ? { heartDisease: true, underlyingStatus: 'yes' }
                            : {}),
                        },
                        premedication: {
                          ...pm,
                          items: nextPremedItems,
                        },
                      });
                    }}
                    onUpdateGroups={onUpdateMedicationGroups}
                  />
                </div>
              </div>
            </div>

            {/* 1.5 Previous operation / anesthesia */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  1.5 Previous operation / anesthesia
                </span>
                {h.previousOps.length < 8 && (
                  <button
                    type="button"
                    onClick={() => updateHistory({ previousOps: [...h.previousOps, ''] })}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-800 hover:text-blue-900"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มรายการ
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {h.previousOps.map((op, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500 w-4">{idx + 1}.</span>
                    <input
                      type="text"
                      value={op}
                      onChange={(e) => {
                        const next = [...h.previousOps];
                        next[idx] = e.target.value;
                        updateHistory({ previousOps: next });
                      }}
                      placeholder="ประวัติผ่าตัด / วิธีระงับความรู้สึก"
                      className={`${inputBase} flex-1 text-xs`}
                    />
                    {h.previousOps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = h.previousOps.filter((_, i) => i !== idx);
                          updateHistory({ previousOps: next });
                        }}
                        aria-label="ลบประวัติผ่าตัด"
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-600 shrink-0">complication</span>
                <input
                  type="text"
                  value={h.previousOpComplication}
                  onChange={(e) => updateHistory({ previousOpComplication: e.target.value })}
                  placeholder="ภาวะแทรกซ้อนจากการดมยาสลบครั้งก่อน (ถ้ามี)"
                  className={`${inputBase} flex-1 text-xs`}
                />
              </div>
            </div>

            {/* 1.6 - 1.8 Substance History */}
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 w-28">
                  1.6 Drinking (ดื่มสุรา)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateHistory({ drinkingStatus: toggleTri(h.drinkingStatus, 'no') })
                  }
                  className={radioBtn(h.drinkingStatus === 'no')}
                >
                  {h.drinkingStatus === 'no' ? '●' : '○'} No
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateHistory({ drinkingStatus: toggleTri(h.drinkingStatus, 'yes') })
                  }
                  className={radioBtn(h.drinkingStatus === 'yes')}
                >
                  {h.drinkingStatus === 'yes' ? '●' : '○'} Yes
                </button>
                <div
                  className={`inline-flex flex-wrap items-center gap-1.5 transition-opacity ${
                    h.drinkingStatus === 'no' ? 'opacity-50' : ''
                  }`}
                >
                  <span className="text-xs text-slate-600">ปริมาณ</span>
                  <input
                    type="text"
                    value={h.drinkingAmount ?? ''}
                    onChange={(e) =>
                      updateHistory({
                        drinkingAmount: e.target.value,
                        drinkingStatus: e.target.value.trim() ? 'yes' : h.drinkingStatus,
                      })
                    }
                    placeholder="เช่น 2 กระป๋อง, 1 แบน"
                    aria-label="ดื่มสุรา ปริมาณ"
                    className={`${inputBase} w-36 text-xs`}
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
                    placeholder="จำนวน"
                    aria-label="ดื่มสุรา วันต่อสัปดาห์"
                    className={`${inputBase} w-14 text-center font-mono tabular-nums text-xs`}
                  />
                  <span className="text-xs text-slate-600">วัน/wk</span>
                  <span className="text-xs text-slate-600 ml-1">จำนวน</span>
                  <input
                    type="text"
                    value={h.drinkingYears}
                    onChange={(e) =>
                      updateHistory({
                        drinkingYears: e.target.value,
                        drinkingStatus: e.target.value.trim() ? 'yes' : h.drinkingStatus,
                      })
                    }
                    placeholder="ระยะเวลา"
                    aria-label="ดื่มสุรา ระยะเวลา"
                    className={`${inputBase} w-14 text-center font-mono tabular-nums text-xs`}
                  />
                  <div className="inline-flex rounded border border-slate-300 overflow-hidden text-[11px]">
                    {(['months', 'years'] as DurationUnit[]).map((unit) => (
                      <button
                        key={`drink_unit_${unit}`}
                        type="button"
                        onClick={() => updateHistory({ drinkingDurationUnit: unit })}
                        className={`px-2 py-0.5 font-medium transition-colors ${
                          (h.drinkingDurationUnit || 'years') === unit
                            ? 'bg-blue-800 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {unit === 'months' ? 'เดือน' : 'ปี'}
                      </button>
                    ))}
                  </div>
                  <label className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 cursor-pointer ml-1">
                    <input
                      type="checkbox"
                      checked={Boolean(h.drinkingQuit)}
                      onChange={(e) =>
                        updateHistory({
                          drinkingQuit: e.target.checked,
                          drinkingStatus: e.target.checked ? 'yes' : h.drinkingStatus,
                        })
                      }
                      className="rounded border-slate-400 text-emerald-700 focus:ring-emerald-700"
                    />
                    เลิก
                  </label>
                  <input
                    type="text"
                    value={h.drinkingQuitDuration ?? ''}
                    onChange={(e) =>
                      updateHistory({
                        drinkingQuitDuration: e.target.value,
                        drinkingQuit: e.target.value.trim() ? true : h.drinkingQuit,
                        drinkingStatus: e.target.value.trim() ? 'yes' : h.drinkingStatus,
                      })
                    }
                    placeholder="เลิกมากี่"
                    aria-label="ดื่มสุรา เลิกมากี่เดือนหรือปี"
                    className={`${inputBase} w-14 text-center font-mono tabular-nums text-xs`}
                  />
                  <div className="inline-flex rounded border border-slate-300 overflow-hidden text-[11px]">
                    {(['months', 'years'] as DurationUnit[]).map((unit) => (
                      <button
                        key={`drink_quit_unit_${unit}`}
                        type="button"
                        onClick={() => updateHistory({ drinkingQuitUnit: unit })}
                        className={`px-2 py-0.5 font-medium transition-colors ${
                          (h.drinkingQuitUnit || 'years') === unit
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {unit === 'months' ? 'เดือน' : 'ปี'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 w-28">
                  1.7 Smoking (สูบบุหรี่)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateHistory({ smokingStatus: toggleTri(h.smokingStatus, 'no') })
                  }
                  className={radioBtn(h.smokingStatus === 'no')}
                >
                  {h.smokingStatus === 'no' ? '●' : '○'} No
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateHistory({ smokingStatus: toggleTri(h.smokingStatus, 'yes') })
                  }
                  className={radioBtn(h.smokingStatus === 'yes')}
                >
                  {h.smokingStatus === 'yes' ? '●' : '○'} Yes
                </button>
                <div
                  className={`inline-flex flex-wrap items-center gap-1.5 transition-opacity ${
                    h.smokingStatus === 'no' ? 'opacity-50' : ''
                  }`}
                >
                  <span className="text-xs text-slate-600">จำนวน</span>
                  <input
                    type="text"
                    value={h.smokingCigsPerDay}
                    onChange={(e) =>
                      updateHistory({
                        smokingCigsPerDay: e.target.value,
                        smokingStatus: e.target.value.trim() ? 'yes' : h.smokingStatus,
                      })
                    }
                    placeholder="จำนวน"
                    aria-label="สูบบุหรี่ มวนต่อวัน"
                    className={`${inputBase} w-14 text-center font-mono tabular-nums text-xs`}
                  />
                  <span className="text-xs text-slate-600">มวน/วัน</span>
                  <span className="text-xs text-slate-600 ml-1">จำนวน</span>
                  <input
                    type="text"
                    value={h.smokingYears}
                    onChange={(e) =>
                      updateHistory({
                        smokingYears: e.target.value,
                        smokingStatus: e.target.value.trim() ? 'yes' : h.smokingStatus,
                      })
                    }
                    placeholder="ระยะเวลา"
                    aria-label="สูบบุหรี่ ระยะเวลา"
                    className={`${inputBase} w-14 text-center font-mono tabular-nums text-xs`}
                  />
                  <div className="inline-flex rounded border border-slate-300 overflow-hidden text-[11px]">
                    {(['months', 'years'] as DurationUnit[]).map((unit) => (
                      <button
                        key={`smoke_unit_${unit}`}
                        type="button"
                        onClick={() => updateHistory({ smokingDurationUnit: unit })}
                        className={`px-2 py-0.5 font-medium transition-colors ${
                          (h.smokingDurationUnit || 'years') === unit
                            ? 'bg-blue-800 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {unit === 'months' ? 'เดือน' : 'ปี'}
                      </button>
                    ))}
                  </div>
                  <label className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 cursor-pointer ml-1">
                    <input
                      type="checkbox"
                      checked={Boolean(h.smokingQuit)}
                      onChange={(e) =>
                        updateHistory({
                          smokingQuit: e.target.checked,
                          smokingStatus: e.target.checked ? 'yes' : h.smokingStatus,
                        })
                      }
                      className="rounded border-slate-400 text-emerald-700 focus:ring-emerald-700"
                    />
                    เลิก
                  </label>
                  <input
                    type="text"
                    value={h.smokingQuitDuration ?? ''}
                    onChange={(e) =>
                      updateHistory({
                        smokingQuitDuration: e.target.value,
                        smokingQuit: e.target.value.trim() ? true : h.smokingQuit,
                        smokingStatus: e.target.value.trim() ? 'yes' : h.smokingStatus,
                      })
                    }
                    placeholder="เลิกมากี่"
                    aria-label="สูบบุหรี่ เลิกมากี่เดือนหรือปี"
                    className={`${inputBase} w-14 text-center font-mono tabular-nums text-xs`}
                  />
                  <div className="inline-flex rounded border border-slate-300 overflow-hidden text-[11px]">
                    {(['months', 'years'] as DurationUnit[]).map((unit) => (
                      <button
                        key={`smoke_quit_unit_${unit}`}
                        type="button"
                        onClick={() => updateHistory({ smokingQuitUnit: unit })}
                        className={`px-2 py-0.5 font-medium transition-colors ${
                          (h.smokingQuitUnit || 'years') === unit
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {unit === 'months' ? 'เดือน' : 'ปี'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 w-28">
                    1.8 Drug addiction
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateHistory({
                        drugAddictionStatus: toggleTri(h.drugAddictionStatus, 'no'),
                      })
                    }
                    className={radioBtn(h.drugAddictionStatus === 'no')}
                  >
                    {h.drugAddictionStatus === 'no' ? '●' : '○'} No
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateHistory({
                        drugAddictionStatus: toggleTri(h.drugAddictionStatus, 'yes'),
                      })
                    }
                    className={radioBtn(h.drugAddictionStatus === 'yes', 'danger')}
                  >
                    {h.drugAddictionStatus === 'yes' ? '●' : '○'} Yes
                  </button>
                </div>

                <div
                  className={`border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 space-y-2 transition-opacity ${
                    h.drugAddictionStatus === 'no' ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    {DRUG_ADDICTION_OPTIONS.map((drug) => {
                      const active = (h.drugAddictionTypes || []).includes(drug);
                      return (
                        <button
                          key={drug}
                          type="button"
                          onClick={() => {
                            const current = h.drugAddictionTypes || [];
                            const nextTypes = active
                              ? current.filter((d) => d !== drug)
                              : [...current, drug];
                            updateHistory({
                              drugAddictionTypes: nextTypes,
                              drugAddictionStatus:
                                !active || nextTypes.length > 0 ? 'yes' : h.drugAddictionStatus,
                            });
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                            active
                              ? 'bg-red-50 border-red-600 text-red-800'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="font-mono text-[10px]">{active ? '☑' : '☐'}</span>
                          <span>{drug}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 flex-1 min-w-[140px]">
                      <span className="text-xs text-slate-600 shrink-0">อื่นๆ</span>
                      <input
                        type="text"
                        value={h.drugAddictionOther}
                        onChange={(e) =>
                          updateHistory({
                            drugAddictionOther: e.target.value,
                            drugAddictionStatus: e.target.value.trim()
                              ? 'yes'
                              : h.drugAddictionStatus,
                          })
                        }
                        placeholder="ระบุสารเสพติดอื่น (ถ้ามี)"
                        aria-label="สารเสพติดอื่นๆ"
                        className={`${inputBase} flex-1 min-w-[100px] text-xs`}
                      />
                    </div>

                    <div className="inline-flex items-center gap-1.5 flex-1 min-w-[150px]">
                      <span className="text-xs text-slate-600 shrink-0">ปริมาณ</span>
                      <input
                        type="text"
                        value={h.drugAddictionAmount}
                        onChange={(e) =>
                          updateHistory({
                            drugAddictionAmount: e.target.value,
                            drugAddictionStatus: e.target.value.trim()
                              ? 'yes'
                              : h.drugAddictionStatus,
                          })
                        }
                        placeholder="เช่น 1 เม็ด/วัน, 1 ขวด/วัน"
                        aria-label="ปริมาณการใช้สารเสพติด"
                        className={`${inputBase} flex-1 min-w-[110px] text-xs`}
                      />
                    </div>

                    <div className="inline-flex flex-wrap items-center gap-1.5 shrink-0">
                      <span className="text-xs text-slate-600">จำนวน</span>
                      <input
                        type="text"
                        value={h.drugAddictionYears}
                        onChange={(e) =>
                          updateHistory({
                            drugAddictionYears: e.target.value,
                            drugAddictionStatus: e.target.value.trim()
                              ? 'yes'
                              : h.drugAddictionStatus,
                          })
                        }
                        placeholder="ระยะเวลา"
                        aria-label="ยาเสพติด ระยะเวลา"
                        className={`${inputBase} w-14 text-center font-mono tabular-nums text-xs`}
                      />
                      <div className="inline-flex rounded border border-slate-300 overflow-hidden text-[11px]">
                        {(['months', 'years'] as DurationUnit[]).map((unit) => (
                          <button
                            key={`drug_unit_${unit}`}
                            type="button"
                            onClick={() => updateHistory({ drugAddictionDurationUnit: unit })}
                            className={`px-2 py-0.5 font-medium transition-colors ${
                              (h.drugAddictionDurationUnit || 'years') === unit
                                ? 'bg-red-700 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {unit === 'months' ? 'เดือน' : 'ปี'}
                          </button>
                        ))}
                      </div>
                      <label className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 cursor-pointer ml-1">
                        <input
                          type="checkbox"
                          checked={Boolean(h.drugAddictionQuit)}
                          onChange={(e) =>
                            updateHistory({
                              drugAddictionQuit: e.target.checked,
                              drugAddictionStatus: e.target.checked ? 'yes' : h.drugAddictionStatus,
                            })
                          }
                          className="rounded border-slate-400 text-emerald-700 focus:ring-emerald-700"
                        />
                        เลิก
                      </label>
                      <input
                        type="text"
                        value={h.drugAddictionQuitDuration ?? ''}
                        onChange={(e) =>
                          updateHistory({
                            drugAddictionQuitDuration: e.target.value,
                            drugAddictionQuit: e.target.value.trim()
                              ? true
                              : h.drugAddictionQuit,
                            drugAddictionStatus: e.target.value.trim()
                              ? 'yes'
                              : h.drugAddictionStatus,
                          })
                        }
                        placeholder="เลิกมากี่"
                        aria-label="ยาเสพติด เลิกมากี่เดือนหรือปี"
                        className={`${inputBase} w-14 text-center font-mono tabular-nums text-xs`}
                      />
                      <div className="inline-flex rounded border border-slate-300 overflow-hidden text-[11px]">
                        {(['months', 'years'] as DurationUnit[]).map((unit) => (
                          <button
                            key={`drug_quit_unit_${unit}`}
                            type="button"
                            onClick={() => updateHistory({ drugAddictionQuitUnit: unit })}
                            className={`px-2 py-0.5 font-medium transition-colors ${
                              (h.drugAddictionQuitUnit || 'years') === unit
                                ? 'bg-emerald-700 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {unit === 'months' ? 'เดือน' : 'ปี'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Investigation */}
          <div className="p-4 space-y-2.5">
            <h2 className="text-sm font-bold text-pyellow-800 bg-pyellow-50/90 border border-pyellow-200/80 rounded-lg px-3 py-1.5">
              3. Investigation
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 w-24">3.1 Chest x-ray</span>
              <button
                type="button"
                onClick={() =>
                  updateInvestigation({
                    cxrStatus: inv.cxrStatus === 'normal' ? '' : 'normal',
                  })
                }
                className={radioBtn(inv.cxrStatus === 'normal')}
              >
                {inv.cxrStatus === 'normal' ? '●' : '○'} Normal
              </button>
              <button
                type="button"
                onClick={() =>
                  updateInvestigation({
                    cxrStatus: inv.cxrStatus === 'abnormal' ? '' : 'abnormal',
                  })
                }
                className={radioBtn(inv.cxrStatus === 'abnormal', 'danger')}
              >
                {inv.cxrStatus === 'abnormal' ? '●' : '○'} Abnormal
              </button>
              <input
                type="text"
                value={inv.cxrDetail}
                onChange={(e) => updateInvestigation({ cxrDetail: e.target.value })}
                placeholder="รายละเอียด CXR"
                className={`${inputBase} flex-1 min-w-[160px] text-xs`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 w-24">3.2 EKG</span>
              <button
                type="button"
                onClick={() =>
                  updateInvestigation({
                    ekgStatus: inv.ekgStatus === 'normal' ? '' : 'normal',
                  })
                }
                className={radioBtn(inv.ekgStatus === 'normal')}
              >
                {inv.ekgStatus === 'normal' ? '●' : '○'} Normal
              </button>
              <button
                type="button"
                onClick={() =>
                  updateInvestigation({
                    ekgStatus: inv.ekgStatus === 'abnormal' ? '' : 'abnormal',
                  })
                }
                className={radioBtn(inv.ekgStatus === 'abnormal', 'danger')}
              >
                {inv.ekgStatus === 'abnormal' ? '●' : '○'} Abnormal
              </button>
              <input
                type="text"
                value={inv.ekgDetail}
                onChange={(e) => updateInvestigation({ ekgDetail: e.target.value })}
                placeholder="รายละเอียด EKG"
                className={`${inputBase} flex-1 min-w-[160px] text-xs`}
              />
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700">
                3.3 Other (ex. CT)
              </span>
              <textarea
                rows={4}
                value={inv.other}
                onChange={(e) => updateInvestigation({ other: e.target.value })}
                placeholder="Echo, PFT, CT brain หรือผลตรวจเพิ่มเติม..."
                className={`${inputBase} w-full text-xs resize-y`}
              />
            </label>
          </div>

          {/* 5. Premedication */}
          <div className="p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-prose-50/85 border border-prose-200/80 rounded-lg px-3 py-1.5">
              <h2 className="text-sm font-bold text-prose-800">5. Premedication</h2>
              <div className="flex items-center gap-3">
                {getMissingAutoPremedEntries(pm.items, h.medication).length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      updatePremed({
                        items: applyMissingAutoPremeds(pm.items, h.medication),
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    ดึงยา CCB / Beta-blocker อัตโนมัติ (
                    {getMissingAutoPremedEntries(pm.items, h.medication).length})
                  </button>
                )}
                {pm.items.length < 10 && (
                  <button
                    type="button"
                    onClick={() => updatePremed({ items: [...pm.items, ''] })}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-800 hover:text-blue-900 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มยาเตรียมก่อนผ่าตัด
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              ยากลุ่ม Calcium Channel Blocker (CCB) และ Beta-blocker ที่ระบุในหัวข้อ 1.4 Medication จะถูกสั่งเป็นยา Premedication อัตโนมัติในรูปแบบ &quot;ชื่อยา เวลา 06.00 น. เช้าวันผ่าตัด&quot;
            </p>

            <div className="space-y-1.5">
              {pm.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500 w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const next = [...pm.items];
                      next[idx] = e.target.value;
                      updatePremed({ items: next });
                    }}
                    placeholder="เช่น ชื่อยา (ขนาด) เวลา 06.00 น. เช้าวันผ่าตัด"
                    className={`${inputBase} flex-1 text-xs`}
                  />
                  {pm.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        updatePremed({ items: pm.items.filter((_, i) => i !== idx) })
                      }
                      aria-label="ลบรายการ Premedication"
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2.5 pt-2">
              {(() => {
                const npoStatus = evaluateNpoStatus(value);
                return (
                  <div
                    className={`rounded-lg p-3 space-y-2 border-2 transition-colors ${
                      npoStatus.isFullStomach
                        ? 'bg-prose-50/85 border-prose-400'
                        : 'bg-pyellow-50/80 border-pyellow-400'
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-lg font-extrabold tracking-wide text-prose-800">
                        NPO
                      </span>
                      <span className="text-xs font-semibold text-pyellow-800">
                        เวลางดน้ำและอาหาร (อาหาร ≥ 8 ชม. · น้ำเปล่า ≥ 2 ชม.)
                      </span>
                    </div>

                    <input
                      type="text"
                      value={pm.npoTime}
                      onChange={(e) => updatePremed({ npoTime: e.target.value })}
                      placeholder="เช่น หลัง 24.00 น. / NPO 6 ชม."
                      aria-label="เวลางดน้ำและอาหาร (NPO time)"
                      className="w-full bg-white border border-pyellow-400 rounded-md px-3 py-2 text-base sm:text-lg font-bold text-slate-950 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:border-prose-600 transition-colors"
                    />

                    {/* Last meal & last water time inputs for exact NPO duration calculation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                      <label className="block space-y-0.5">
                        <span className="text-[11px] font-semibold text-slate-700">
                          เวลารับประทานอาหารล่าสุด (24 ชม.)
                        </span>
                        <Time24Input
                          ariaLabel="เวลารับประทานอาหารล่าสุด (24 ชั่วโมง)"
                          value={pm.lastMealTime ?? ''}
                          onChange={(next) => updatePremed({ lastMealTime: next })}
                          wrapperClassName="w-full"
                          className="w-full bg-white border border-pborder rounded-md px-2.5 py-1.5 text-xs font-mono tabular-nums text-[#243040] focus:outline-none focus:border-pblue-400"
                        />
                      </label>

                      <label className="block space-y-0.5">
                        <span className="text-[11px] font-semibold text-slate-700">
                          เวลาดื่มน้ำเปล่าล่าสุด (24 ชม.)
                        </span>
                        <Time24Input
                          ariaLabel="เวลาดื่มน้ำเปล่าล่าสุด (24 ชั่วโมง)"
                          value={pm.lastWaterTime ?? ''}
                          onChange={(next) => updatePremed({ lastWaterTime: next })}
                          wrapperClassName="w-full"
                          className="w-full bg-white border border-pborder rounded-md px-2.5 py-1.5 text-xs font-mono tabular-nums text-[#243040] focus:outline-none focus:border-pblue-400"
                        />
                      </label>
                    </div>

                    {/* Live fasting duration & Full stomach feedback */}
                    {(npoStatus.foodHours !== null ||
                      npoStatus.waterHours !== null ||
                      npoStatus.isFullStomach) ? (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-0.5">
                        {npoStatus.foodHours !== null && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded font-semibold border ${
                              npoStatus.isFoodFullStomach
                                ? 'bg-prose-100 border-prose-300 text-prose-800'
                                : 'bg-pgreen-50 border-pgreen-300 text-pgreen-800'
                            }`}
                          >
                            อาหาร: {formatFastingHours(npoStatus.foodHours)} ชม.{' '}
                            {npoStatus.isFoodFullStomach ? '(< 8 ชม.)' : '(ครบ ≥ 8 ชม.)'}
                          </span>
                        )}
                        {npoStatus.waterHours !== null && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded font-semibold border ${
                              npoStatus.isWaterFullStomach
                                ? 'bg-prose-100 border-prose-300 text-prose-800'
                                : 'bg-pgreen-50 border-pgreen-300 text-pgreen-800'
                            }`}
                          >
                            น้ำเปล่า: {formatFastingHours(npoStatus.waterHours)} ชม.{' '}
                            {npoStatus.isWaterFullStomach ? '(< 2 ชม.)' : '(ครบ ≥ 2 ชม.)'}
                          </span>
                        )}
                        {npoStatus.isFullStomach && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded font-bold bg-prose-600 text-white">
                            Full stomach · เพิ่มใน Problem List อัตโนมัติแล้ว
                          </span>
                        )}
                      </div>
                    ) : (
                      (Boolean(pm.lastMealTime?.trim()) || Boolean(pm.lastWaterTime?.trim())) &&
                      npoStatus.operationMinutes === null && (
                        <div className="text-[11px] text-pyellow-800">
                          กรุณาระบุ <strong>เวลาผ่าตัด</strong> ด้านบน เพื่อให้ระบบคำนวณชั่วโมง NPO และประเมิน Full stomach อัตโนมัติ
                        </div>
                      )
                    )}
                  </div>
                );
              })()}
              {(() => {
                type IvfPresetKey = 'lsr' | 'acetar' | 'nss' | 'd5n2' | 'nss_kcl';
                const stdPresets: readonly {
                  key: Exclude<IvfPresetKey, 'nss_kcl'>;
                  label: string;
                  prefix: string;
                }[] = [
                  { key: 'lsr', label: 'LSR 1000 ml', prefix: 'LSR 1000 ml' },
                  { key: 'acetar', label: 'Acetar 1000 ml', prefix: 'Acetar 1000 ml' },
                  { key: 'nss', label: 'NSS 1000 ml', prefix: 'NSS 1000 ml' },
                  { key: 'd5n2', label: '5%D/N/2 1000 ml', prefix: '5%D/N/2 1000 ml' },
                ];
                const cleanVal = (v: string) =>
                  v && !/^[._…]+$/.test(v.trim()) ? v.trim() : '';
                const rawIvf = (pm.onIvf || '').trim();
                let activePreset: IvfPresetKey | '' = '';
                let nssMl = '';
                let kclMeq = '';
                let ivRate = '';

                const kclMatch =
                  /^NSS\s+([^\s+]+)\s*ml\s*\+\s*KCl\s+([^\s]+)\s*mEq(?:\s+IV\s+rate\s+([^\s]+)\s*ml\/hr)?/i.exec(
                    rawIvf,
                  );
                if (kclMatch) {
                  activePreset = 'nss_kcl';
                  nssMl = cleanVal(kclMatch[1]);
                  kclMeq = cleanVal(kclMatch[2]);
                  ivRate = cleanVal(kclMatch[3] || '');
                } else {
                  for (const item of stdPresets) {
                    const escaped = item.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const m = new RegExp(
                      `^${escaped}(?:\\s+IV\\s+rate\\s+([^\\s]+)\\s*ml\\/hr)?`,
                      'i',
                    ).exec(rawIvf);
                    if (m) {
                      activePreset = item.key;
                      ivRate = cleanVal(m[1] || '');
                      break;
                    }
                  }
                }

                const buildIvfText = (
                  preset: IvfPresetKey,
                  opts: { nssMl?: string; kclMeq?: string; rate?: string },
                ) => {
                  const r = opts.rate?.trim() || '......';
                  if (preset === 'nss_kcl') {
                    const v = opts.nssMl?.trim() || '......';
                    const k = opts.kclMeq?.trim() || '......';
                    return `NSS ${v} ml + KCl ${k} mEq IV rate ${r} ml/hr`;
                  }
                  const found = stdPresets.find((x) => x.key === preset);
                  return `${found?.prefix || 'NSS 1000 ml'} IV rate ${r} ml/hr`;
                };

                return (
                  <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/60 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700">
                        on IVF (สารน้ำทางหลอดเลือดดำ)
                      </span>
                      {pm.onIvf.trim() && (
                        <button
                          type="button"
                          onClick={() => updatePremed({ onIvf: '' })}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-3 h-3" />
                          ล้าง IVF
                        </button>
                      )}
                    </div>

                    {/* 5 IVF fluid presets */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {stdPresets.map((item) => {
                        const isSelected = activePreset === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() =>
                              updatePremed({
                                onIvf: isSelected
                                  ? ''
                                  : buildIvfText(item.key, { rate: ivRate }),
                              })
                            }
                            className={radioBtn(isSelected)}
                          >
                            {isSelected ? '●' : '○'} {item.label}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() =>
                          updatePremed({
                            onIvf:
                              activePreset === 'nss_kcl'
                                ? ''
                                : buildIvfText('nss_kcl', {
                                    nssMl: nssMl || '1000',
                                    kclMeq,
                                    rate: ivRate,
                                  }),
                          })
                        }
                        className={radioBtn(activePreset === 'nss_kcl')}
                      >
                        {activePreset === 'nss_kcl' ? '●' : '○'} NSS + KCl
                      </button>
                    </div>

                    {/* Inline numeric fields when a preset is active */}
                    {activePreset && (
                      <div className="flex flex-wrap items-center gap-2 bg-white border border-blue-200/80 rounded-md px-2.5 py-1.5 text-xs">
                        {activePreset === 'nss_kcl' && (
                          <>
                            <label className="inline-flex items-center gap-1">
                              <span className="text-slate-600 font-medium">NSS</span>
                              <input
                                type="text"
                                value={nssMl}
                                onChange={(e) =>
                                  updatePremed({
                                    onIvf: buildIvfText('nss_kcl', {
                                      nssMl: e.target.value,
                                      kclMeq,
                                      rate: ivRate,
                                    }),
                                  })
                                }
                                placeholder="1000"
                                aria-label="NSS ปริมาตร ml"
                                className={`${inputBase} w-16 text-center font-mono tabular-nums text-xs`}
                              />
                              <span className="text-slate-600">ml</span>
                            </label>
                            <label className="inline-flex items-center gap-1">
                              <span className="text-slate-600 font-medium">+ KCl</span>
                              <input
                                type="text"
                                value={kclMeq}
                                onChange={(e) =>
                                  updatePremed({
                                    onIvf: buildIvfText('nss_kcl', {
                                      nssMl,
                                      kclMeq: e.target.value,
                                      rate: ivRate,
                                    }),
                                  })
                                }
                                placeholder="20"
                                aria-label="KCl mEq"
                                className={`${inputBase} w-14 text-center font-mono tabular-nums text-xs`}
                              />
                              <span className="text-slate-600">mEq</span>
                            </label>
                          </>
                        )}
                        <label className="inline-flex items-center gap-1">
                          <span className="text-slate-600 font-medium">IV rate</span>
                          <input
                            type="text"
                            value={ivRate}
                            onChange={(e) =>
                              updatePremed({
                                onIvf: buildIvfText(activePreset, {
                                  nssMl,
                                  kclMeq,
                                  rate: e.target.value,
                                }),
                              })
                            }
                            placeholder="80"
                            aria-label="IV rate ml ต่อชั่วโมง"
                            className={`${inputBase} w-16 text-center font-mono tabular-nums text-xs`}
                          />
                          <span className="text-slate-600">ml/hr</span>
                        </label>
                        <div className="inline-flex items-center gap-1 ml-auto">
                          {(['60', '80', '100', '120'] as const).map((presetRate) => (
                            <button
                              key={presetRate}
                              type="button"
                              onClick={() =>
                                updatePremed({
                                  onIvf: buildIvfText(activePreset, {
                                    nssMl,
                                    kclMeq,
                                    rate: presetRate,
                                  }),
                                })
                              }
                              className={`px-1.5 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                                ivRate === presetRate
                                  ? 'bg-blue-800 border-blue-800 text-white font-semibold'
                                  : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {presetRate}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Direct editable summary/custom input */}
                    <input
                      type="text"
                      value={pm.onIvf}
                      onChange={(e) => updatePremed({ onIvf: e.target.value })}
                      placeholder="เลือกสูตรสารน้ำด้านบน หรือพิมพ์เอง เช่น LSR 1000 ml IV rate 80 ml/hr"
                      aria-label="ข้อความ on IVF"
                      className={`${inputBase} w-full text-xs bg-white`}
                    />
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 2. Physical examination, 4. Laboratory Evaluation, 6. Consult Med/Cardio */}
        <div className="divide-y divide-slate-300">
          {/* 2. Physical examination */}
          <div
            ref={physicalExamSectionRef}
            onKeyDown={handlePhysicalExamKeyDown}
            className="p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 bg-pgreen-50/85 border border-pgreen-200/80 rounded-lg px-3 py-1.5">
              <h2 className="text-sm font-bold text-pgreen-800">
                2. Physical examination
              </h2>
              <span className="text-[11px] text-slate-500">
                ใช้ Tab, Enter หรือลูกศร ↑ ↓ ← → เลื่อนช่องกรอกได้
              </span>
            </div>

            {/* Anthropometry */}
            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-600 shrink-0">BW</span>
                <input
                  type="text"
                  value={p.bw}
                  onChange={(e) => updatePhysical({ bw: e.target.value })}
                  className={`${inputBase} w-full font-mono tabular-nums text-center text-xs`}
                />
                <span className="text-xs text-slate-500">kg</span>
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-600 shrink-0">HT</span>
                <input
                  type="text"
                  value={p.ht}
                  onChange={(e) => updatePhysical({ ht: e.target.value })}
                  className={`${inputBase} w-full font-mono tabular-nums text-center text-xs`}
                />
                <span className="text-xs text-slate-500">cm</span>
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-600 shrink-0">BMI</span>
                <input
                  type="text"
                  value={p.bmi}
                  onChange={(e) => updatePhysical({ bmi: e.target.value })}
                  className={`${inputBase} w-full font-mono tabular-nums text-center text-xs bg-slate-50`}
                />
              </label>
            </div>

            {/* Vital signs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">BP (mmHg)</span>
                <input
                  type="text"
                  value={p.bp}
                  onChange={(e) => updatePhysical({ bp: e.target.value })}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">P (bpm)</span>
                <input
                  type="text"
                  value={p.pulse}
                  onChange={(e) => updatePhysical({ pulse: e.target.value })}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">RR (bpm)</span>
                <input
                  type="text"
                  value={p.rr}
                  onChange={(e) => updatePhysical({ rr: e.target.value })}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">T (°C)</span>
                <input
                  type="text"
                  value={p.temp}
                  onChange={(e) => updatePhysical({ temp: e.target.value })}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">SpO2 (%)</span>
                <input
                  type="text"
                  value={p.spo2}
                  onChange={(e) => updatePhysical({ spo2: e.target.value })}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
            </div>

            {/* Status ปัจจุบัน (GCS, ช่วยเหลือตัวเอง, เหนื่อยหอบ) */}
            <div className="border border-slate-200 rounded-lg p-2.5 bg-blue-50/30 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  Status ปัจจุบัน (Current Status)
                </span>
                <button
                  type="button"
                  onClick={() => updatePhysical({ gcsE: '4', gcsV: '5', gcsM: '6' })}
                  className="text-[11px] font-medium text-blue-800 hover:text-blue-950 bg-white border border-blue-200 rounded px-2 py-0.5 transition-colors"
                >
                  ตั้งค่าเร็ว E4V5M6
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {/* Coma score E V M */}
                <div className="inline-flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-700">Coma score (GCS):</span>
                  <label className="inline-flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-700">E</span>
                    <input
                      type="text"
                      value={p.gcsE ?? ''}
                      onChange={(e) => updatePhysical({ gcsE: e.target.value })}
                      placeholder="1-4"
                      maxLength={4}
                      aria-label="GCS Eye opening"
                      className={`${inputBase} w-11 text-center font-mono tabular-nums text-xs`}
                    />
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-700">V</span>
                    <input
                      type="text"
                      value={p.gcsV ?? ''}
                      onChange={(e) => updatePhysical({ gcsV: e.target.value })}
                      placeholder="1-5/T"
                      maxLength={4}
                      aria-label="GCS Verbal response"
                      className={`${inputBase} w-12 text-center font-mono tabular-nums text-xs`}
                    />
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-700">M</span>
                    <input
                      type="text"
                      value={p.gcsM ?? ''}
                      onChange={(e) => updatePhysical({ gcsM: e.target.value })}
                      placeholder="1-6"
                      maxLength={4}
                      aria-label="GCS Motor response"
                      className={`${inputBase} w-11 text-center font-mono tabular-nums text-xs`}
                    />
                  </label>
                  {(() => {
                    const eNum = parseInt((p.gcsE || '').trim(), 10);
                    const vTrim = (p.gcsV || '').trim().toUpperCase();
                    const vNum = parseInt(vTrim, 10);
                    const mNum = parseInt((p.gcsM || '').trim(), 10);
                    if (!Number.isFinite(eNum) || !Number.isFinite(mNum)) return null;
                    const isTube = vTrim === 'T' || vTrim === 'VT';
                    const totalLabel = isTube
                      ? `${eNum + mNum}T`
                      : Number.isFinite(vNum)
                      ? `${eNum + vNum + mNum}`
                      : '';
                    if (!totalLabel) return null;
                    const isLow = isTube ? eNum + mNum <= 8 : eNum + vNum + mNum <= 12;
                    return (
                      <span
                        className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                          isLow
                            ? 'bg-red-50 border-red-300 text-red-700'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        }`}
                      >
                        รวม {totalLabel}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {/* การช่วยเหลือตัวเอง */}
                <div className="inline-flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-700">การช่วยเหลือตัวเอง:</span>
                  <button
                    type="button"
                    onClick={() =>
                      updatePhysical({
                        selfCareStatus: p.selfCareStatus === 'independent' ? '' : 'independent',
                      })
                    }
                    className={radioBtn(p.selfCareStatus === 'independent')}
                  >
                    {p.selfCareStatus === 'independent' ? '●' : '○'} ช่วยเหลือตัวเองได้
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updatePhysical({
                        selfCareStatus: p.selfCareStatus === 'dependent' ? '' : 'dependent',
                      })
                    }
                    className={radioBtn(p.selfCareStatus === 'dependent', 'danger')}
                  >
                    {p.selfCareStatus === 'dependent' ? '●' : '○'} ช่วยเหลือตัวเองไม่ได้
                  </button>
                </div>

                {/* อาการเหนื่อยหอบ */}
                <div className="inline-flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-700">อาการเหนื่อยหอบ:</span>
                  <button
                    type="button"
                    onClick={() =>
                      updatePhysical({
                        dyspneaStatus: p.dyspneaStatus === 'no' ? '' : 'no',
                      })
                    }
                    className={radioBtn(p.dyspneaStatus === 'no')}
                  >
                    {p.dyspneaStatus === 'no' ? '●' : '○'} ไม่เหนื่อยหอบ
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updatePhysical({
                        dyspneaStatus: p.dyspneaStatus === 'yes' ? '' : 'yes',
                      })
                    }
                    className={radioBtn(p.dyspneaStatus === 'yes', 'danger')}
                  >
                    {p.dyspneaStatus === 'yes' ? '●' : '○'} เหนื่อยหอบ
                  </button>
                </div>
              </div>

              <label className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-xs font-medium text-slate-700 shrink-0">
                  รายละเอียดเพิ่มเติม:
                </span>
                <input
                  type="text"
                  value={p.currentStatusDetail ?? ''}
                  onChange={(e) => updatePhysical({ currentStatusDetail: e.target.value })}
                  placeholder="ระบุรายละเอียด status ปัจจุบัน เช่น รู้สึกตัวดี ทำตามคำสั่งได้ / อ่อนแรงซีกขวา..."
                  aria-label="รายละเอียด Status ปัจจุบัน"
                  className={`${inputBase} flex-1 min-w-[200px] text-xs bg-white`}
                />
              </label>
            </div>

            {/* Oxygen / Ventilator Support */}
            <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/40 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  การให้ออกซิเจน / เครื่องช่วยหายใจ (Oxygen &amp; Airway Support)
                </span>
                <div className="flex items-center gap-2">
                  {formatOxygenSupportSummary(ox) && (
                    <button
                      type="button"
                      onClick={() => {
                        updatePhysical({ oxygenSupport: createEmptyOxygenSupport() });
                        setEditingOxygenOther(null);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-3 h-3" />
                      ล้างข้อมูล
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsManagingOxygenPresets((prev) => !prev)}
                    className="inline-flex items-center gap-0.5 text-[11px] font-medium text-blue-800 hover:text-blue-950"
                  >
                    <Plus className="w-3 h-3" />
                    {isManagingOxygenPresets ? 'ปิดจัดการตัวเลือก' : 'จัดการตัวเลือกอื่นๆ'}
                  </button>
                </div>
              </div>

              {/* 1. on cannula & 2. on mask c̄ bag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div
                  className={`flex flex-wrap items-center gap-1.5 rounded-md border p-1.5 transition-colors ${
                    ox.mode === 'cannula'
                      ? 'bg-blue-50/60 border-blue-700'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      updateOxygen({ mode: ox.mode === 'cannula' ? '' : 'cannula' })
                    }
                    className={radioBtn(ox.mode === 'cannula')}
                  >
                    {ox.mode === 'cannula' ? '●' : '○'} 1. on cannula
                  </button>
                  <input
                    type="text"
                    value={ox.cannulaLpm}
                    onChange={(e) =>
                      updateOxygen({
                        cannulaLpm: e.target.value,
                        mode: e.target.value.trim() ? 'cannula' : ox.mode,
                      })
                    }
                    aria-label="on cannula LPM"
                    maxLength={20}
                    className={`${inputBase} w-14 text-center font-mono tabular-nums text-xs`}
                  />
                  <span className="text-xs text-slate-600">LPM</span>
                  {ox.cannulaLpm.trim() && (
                    <button
                      type="button"
                      onClick={() => updateOxygen({ cannulaLpm: '' })}
                      aria-label="ล้างค่า LPM cannula"
                      className="p-0.5 text-slate-400 hover:text-red-600 ml-auto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div
                  className={`flex flex-wrap items-center gap-1.5 rounded-md border p-1.5 transition-colors ${
                    ox.mode === 'mask_bag'
                      ? 'bg-blue-50/60 border-blue-700'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      updateOxygen({ mode: ox.mode === 'mask_bag' ? '' : 'mask_bag' })
                    }
                    className={radioBtn(ox.mode === 'mask_bag')}
                  >
                    {ox.mode === 'mask_bag' ? '●' : '○'} 2. on mask c̄ bag
                  </button>
                  <input
                    type="text"
                    value={ox.maskBagLpm}
                    onChange={(e) =>
                      updateOxygen({
                        maskBagLpm: e.target.value,
                        mode: e.target.value.trim() ? 'mask_bag' : ox.mode,
                      })
                    }
                    aria-label="on mask c bag LPM"
                    maxLength={20}
                    className={`${inputBase} w-14 text-center font-mono tabular-nums text-xs`}
                  />
                  <span className="text-xs text-slate-600">LPM</span>
                  {ox.maskBagLpm.trim() && (
                    <button
                      type="button"
                      onClick={() => updateOxygen({ maskBagLpm: '' })}
                      aria-label="ล้างค่า LPM mask c bag"
                      className="p-0.5 text-slate-400 hover:text-red-600 ml-auto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 3. on ETT + Ventilator Setting (TV / PCV) */}
              <div
                className={`rounded-md border p-2 space-y-2 transition-colors ${
                  ox.mode === 'ett'
                    ? 'bg-blue-50/60 border-blue-700'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateOxygen({
                        mode: ox.mode === 'ett' ? '' : 'ett',
                        ventMode: ox.mode !== 'ett' && !ox.ventMode ? 'vcv' : ox.ventMode,
                      })
                    }
                    className={radioBtn(ox.mode === 'ett')}
                  >
                    {ox.mode === 'ett' ? '●' : '○'} 3. on ETT
                  </button>
                  <label className="inline-flex items-center gap-1">
                    <span className="text-xs text-slate-600">No.</span>
                    <input
                      type="text"
                      value={ox.ettSize}
                      onChange={(e) =>
                        updateOxygen({
                          ettSize: e.target.value,
                          mode: e.target.value.trim() ? 'ett' : ox.mode,
                          ventMode: e.target.value.trim() && !ox.ventMode ? 'vcv' : ox.ventMode,
                        })
                      }
                      aria-label="ขนาด ETT"
                      maxLength={20}
                      className={`${inputBase} w-14 text-center font-mono tabular-nums text-xs`}
                    />
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <span className="text-xs text-slate-600">deep</span>
                    <input
                      type="text"
                      value={ox.ettDeep}
                      onChange={(e) =>
                        updateOxygen({
                          ettDeep: e.target.value,
                          mode: e.target.value.trim() ? 'ett' : ox.mode,
                          ventMode: e.target.value.trim() && !ox.ventMode ? 'vcv' : ox.ventMode,
                        })
                      }
                      aria-label="ความลึก ETT"
                      maxLength={20}
                      className={`${inputBase} w-14 text-center font-mono tabular-nums text-xs`}
                    />
                    <span className="text-xs text-slate-500">cm</span>
                  </label>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[11px] font-medium text-slate-600">Setting:</span>
                    <div className="inline-flex rounded border border-slate-300 overflow-hidden text-[11px]">
                      <button
                        type="button"
                        onClick={() => updateOxygen({ mode: 'ett', ventMode: 'vcv' })}
                        className={`px-2 py-0.5 font-semibold transition-colors ${
                          ox.ventMode !== 'pcv'
                            ? 'bg-blue-800 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        TV (VCV)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOxygen({ mode: 'ett', ventMode: 'pcv' })}
                        className={`px-2 py-0.5 font-semibold transition-colors border-l border-slate-300 ${
                          ox.ventMode === 'pcv'
                            ? 'bg-blue-800 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        PCV
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ventilator parameters */}
                <div
                  className={`grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/80 transition-opacity ${
                    ox.mode && ox.mode !== 'ett' ? 'opacity-55' : ''
                  }`}
                >
                  {ox.ventMode === 'pcv' ? (
                    <label className="flex items-center gap-1">
                      <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                        Pins
                      </span>
                      <input
                        type="text"
                        value={ox.pins}
                        onChange={(e) =>
                          updateOxygen({
                            pins: e.target.value,
                            mode: 'ett',
                            ventMode: 'pcv',
                          })
                        }
                        aria-label="PCV Pins"
                        maxLength={20}
                        className={`${inputBase} w-full font-mono tabular-nums text-center text-xs`}
                      />
                    </label>
                  ) : (
                    <label className="flex items-center gap-1">
                      <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                        TV
                      </span>
                      <input
                        type="text"
                        value={ox.tv}
                        onChange={(e) =>
                          updateOxygen({
                            tv: e.target.value,
                            mode: 'ett',
                            ventMode: 'vcv',
                          })
                        }
                        aria-label="Setting TV"
                        maxLength={20}
                        className={`${inputBase} w-full font-mono tabular-nums text-center text-xs`}
                      />
                    </label>
                  )}
                  <label className="flex items-center gap-1">
                    <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                      RR
                    </span>
                    <input
                      type="text"
                      value={ox.rr}
                      onChange={(e) =>
                        updateOxygen({
                          rr: e.target.value,
                          mode: e.target.value.trim() ? 'ett' : ox.mode,
                          ventMode: ox.ventMode || 'vcv',
                        })
                      }
                      aria-label="Ventilator RR"
                      maxLength={20}
                      className={`${inputBase} w-full font-mono tabular-nums text-center text-xs`}
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                      FiO2
                    </span>
                    <input
                      type="text"
                      value={ox.fio2}
                      onChange={(e) =>
                        updateOxygen({
                          fio2: e.target.value,
                          mode: e.target.value.trim() ? 'ett' : ox.mode,
                          ventMode: ox.ventMode || 'vcv',
                        })
                      }
                      aria-label="Ventilator FiO2"
                      maxLength={20}
                      className={`${inputBase} w-full font-mono tabular-nums text-center text-xs`}
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                      PEEP
                    </span>
                    <input
                      type="text"
                      value={ox.peep}
                      onChange={(e) =>
                        updateOxygen({
                          peep: e.target.value,
                          mode: e.target.value.trim() ? 'ett' : ox.mode,
                          ventMode: ox.ventMode || 'vcv',
                        })
                      }
                      aria-label="Ventilator PEEP"
                      maxLength={20}
                      className={`${inputBase} w-full font-mono tabular-nums text-center text-xs`}
                    />
                  </label>
                </div>
              </div>

              {/* 4. อื่นๆ (เพิ่ม ลบ แก้ไขข้อมูลได้) */}
              <div
                className={`rounded-md border p-2 space-y-2 transition-colors ${
                  ox.mode === 'other' || (ox.otherItems || []).length > 0
                    ? 'bg-blue-50/40 border-blue-600/60'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateOxygen({ mode: ox.mode === 'other' ? '' : 'other' })}
                    className={radioBtn(ox.mode === 'other')}
                  >
                    {ox.mode === 'other' ? '●' : '○'} 4. อื่นๆ
                  </button>
                  {oxygenPresets.map((preset) => {
                    const selected = (ox.otherItems || []).includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleToggleOxygenPresetItem(preset)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                          selected
                            ? 'bg-blue-50 border-blue-700 text-blue-900'
                            : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{selected ? '☑' : '☐'}</span>
                        <span>{preset}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Preset Catalog Manager (Add / Edit / Delete / Reset presets) */}
                {isManagingOxygenPresets && (
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-800">
                        จัดการตัวเลือกด่วน (เพิ่ม แก้ไข หรือลบได้)
                      </span>
                      <button
                        type="button"
                        onClick={handleResetOxygenPresets}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
                      >
                        <RotateCcw className="w-3 h-3" />
                        รีเซ็ตค่าเริ่มต้น
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <input
                        type="text"
                        value={newOxygenPreset}
                        onChange={(e) => setNewOxygenPreset(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddOxygenPreset(newOxygenPreset);
                          }
                        }}
                        placeholder="เพิ่มตัวเลือกใหม่ เช่น On T-piece 5 LPM, Tracheostomy"
                        maxLength={120}
                        className="flex-1 min-w-[180px] bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddOxygenPreset(newOxygenPreset)}
                        disabled={!newOxygenPreset.trim()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-800 rounded hover:bg-blue-900 disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3" />
                        เพิ่มตัวเลือก
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {oxygenPresets.map((preset) => {
                        const isEditing = editingOxygenPreset?.original === preset;
                        if (isEditing) {
                          return (
                            <span
                              key={`edit_ox_preset_${preset}`}
                              className="inline-flex items-center gap-1 bg-white border border-blue-700 rounded px-1.5 py-0.5"
                            >
                              <input
                                type="text"
                                value={editingOxygenPreset.text}
                                onChange={(e) =>
                                  setEditingOxygenPreset({
                                    ...editingOxygenPreset,
                                    text: e.target.value,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveEditedOxygenPreset();
                                  } else if (e.key === 'Escape') {
                                    setEditingOxygenPreset(null);
                                  }
                                }}
                                maxLength={120}
                                className="w-32 text-xs text-slate-900 focus:outline-none"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={handleSaveEditedOxygenPreset}
                                aria-label="บันทึกตัวเลือก"
                                className="text-emerald-700 hover:text-emerald-900"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingOxygenPreset(null)}
                                aria-label="ยกเลิกแก้ไข"
                                className="text-slate-400 hover:text-slate-700"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          );
                        }
                        return (
                          <span
                            key={`ox_preset_${preset}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-white border border-slate-300 rounded text-slate-800"
                          >
                            <span>{preset}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingOxygenPreset({ original: preset, text: preset })
                              }
                              aria-label={`แก้ไข ${preset}`}
                              className="text-slate-400 hover:text-blue-800"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveOxygenPreset(preset)}
                              aria-label={`ลบ ${preset}`}
                              className="text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Patient custom otherItems (Add / Edit / Delete per patient) */}
                {(ox.otherItems || []).length > 0 && (
                  <div className="space-y-1.5">
                    {(ox.otherItems || []).map((item, idx) => {
                      const isEditingRow = editingOxygenOther?.index === idx;
                      return (
                        <div key={`ox_other_${idx}`} className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-slate-400 w-4">
                            {idx + 1}.
                          </span>
                          {isEditingRow ? (
                            <>
                              <input
                                type="text"
                                value={editingOxygenOther.text}
                                onChange={(e) =>
                                  setEditingOxygenOther({
                                    ...editingOxygenOther,
                                    text: e.target.value,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveEditedOxygenOther();
                                  } else if (e.key === 'Escape') {
                                    setEditingOxygenOther(null);
                                  }
                                }}
                                maxLength={150}
                                className={`${inputBase} flex-1 text-xs`}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={handleSaveEditedOxygenOther}
                                aria-label="บันทึกข้อมูลอื่นๆ"
                                className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingOxygenOther(null)}
                                aria-label="ยกเลิก"
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1">
                                {item}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingOxygenOther({ index: idx, text: item })
                                }
                                aria-label={`แก้ไข ${item}`}
                                title="แก้ไข"
                                className="p-1 text-slate-500 hover:text-blue-800 hover:bg-blue-50 rounded"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveOxygenOther(idx)}
                                aria-label={`ลบ ${item}`}
                                title="ลบ"
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="text"
                    value={newOxygenOtherItem}
                    onChange={(e) => setNewOxygenOtherItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOxygenOtherItem(newOxygenOtherItem);
                      }
                    }}
                    placeholder="พิมพ์ข้อมูลเพิ่มเติม เช่น HFNC Flow 40 LPM FiO2 0.5, Tracheostomy..."
                    aria-label="เพิ่มข้อมูลออกซิเจนอื่นๆ"
                    maxLength={150}
                    className={`${inputBase} flex-1 min-w-[200px] text-xs`}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddOxygenOtherItem(newOxygenOtherItem)}
                    disabled={!newOxygenOtherItem.trim() || (ox.otherItems || []).length >= 10}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-blue-800 rounded hover:bg-blue-900 disabled:opacity-50 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มข้อมูล
                  </button>
                </div>
              </div>
            </div>

            {/* 2.1 Tooth */}
            <div className="flex flex-wrap items-start justify-between gap-3 border border-slate-200 rounded-lg p-2.5 bg-slate-50/40">
              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <div className="text-xs font-semibold text-slate-700">2.1 Tooth</div>
                <div className="flex flex-wrap gap-1.5">
                  {(['Normal', 'Denture', 'Loose', 'Avulsion'] as const).map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleTooth(cond)}
                      className={radioBtn(
                        p.toothStatus.includes(cond),
                        cond === 'Loose' || cond === 'Avulsion' ? 'danger' : 'default',
                      )}
                    >
                      {p.toothStatus.includes(cond) ? '●' : '○'} {cond}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={p.toothDetail}
                  onChange={(e) => updatePhysical({ toothDetail: e.target.value })}
                  className={`${inputBase} w-full text-xs`}
                />
                {formatToothMarksSummary(p.missingTeeth, p.looseTeeth) && (
                  <div className="text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded px-2 py-1">
                    {formatToothMarksSummary(p.missingTeeth, p.looseTeeth)}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-1.5 shrink-0 mx-auto sm:mx-0">
                <div className="flex flex-wrap items-center justify-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setToothMarkMode('cycle')}
                    className={`px-1.5 py-0.5 rounded border font-medium transition-colors ${
                      toothMarkMode === 'cycle'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                    title="แตะซ้ำเพื่อสลับ: ปกติ → ดำ (ฟันหลอ) → X (ฟันโยก)"
                  >
                    สลับ ดำ/X
                  </button>
                  <button
                    type="button"
                    onClick={() => setToothMarkMode('missing')}
                    className={`px-1.5 py-0.5 rounded border font-medium transition-colors ${
                      toothMarkMode === 'missing'
                        ? 'bg-slate-950 text-white border-slate-950'
                        : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    ■ ฟันหลอ
                  </button>
                  <button
                    type="button"
                    onClick={() => setToothMarkMode('loose')}
                    className={`px-1.5 py-0.5 rounded border font-medium transition-colors ${
                      toothMarkMode === 'loose'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-red-700 border-slate-300 hover:bg-red-50'
                    }`}
                  >
                    ✕ ฟันโยก
                  </button>
                  {((p.missingTeeth?.length ?? 0) > 0 || (p.looseTeeth?.length ?? 0) > 0) && (
                    <button
                      type="button"
                      onClick={() => updatePhysical({ missingTeeth: [], looseTeeth: [] })}
                      className="px-1.5 py-0.5 rounded border border-slate-300 bg-white text-slate-500 hover:text-red-700 hover:border-red-300"
                      title="ล้างจุดที่ mark บนฟันทั้งหมด"
                    >
                      ล้าง
                    </button>
                  )}
                </div>

                <DentalArchBadge
                  className="w-40 h-[102px] shrink-0"
                  missingTeeth={p.missingTeeth || []}
                  looseTeeth={p.looseTeeth || []}
                  interactive
                  onToggleTooth={handleToggleToothMark}
                />

                <div className="flex items-center gap-2.5 text-[10px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-[2px] bg-slate-950" />
                    ฟันหลอ
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <span className="font-bold text-red-600">✕</span>
                    ฟันโยก
                  </span>
                  <span>(แตะที่ซี่ฟัน)</span>
                </div>
              </div>
            </div>

            {/* 2.2 Airway */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-700">2.2 Airway</div>
              <div className="grid grid-cols-1 gap-1.5 pl-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-600 w-36 shrink-0">• Mouth opening</span>
                  <button
                    type="button"
                    onClick={() =>
                      updatePhysical({
                        mouthOpening: p.mouthOpening === 'normal' ? '' : 'normal',
                      })
                    }
                    className={radioBtn(p.mouthOpening === 'normal')}
                  >
                    {p.mouthOpening === 'normal' ? '●' : '○'} Normal
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updatePhysical({
                        mouthOpening: p.mouthOpening === 'limited' ? '' : 'limited',
                      })
                    }
                    className={radioBtn(p.mouthOpening === 'limited', 'danger')}
                  >
                    {p.mouthOpening === 'limited' ? '●' : '○'} Limited
                  </button>
                  <input
                    type="text"
                    value={p.mouthOpeningDetail || ''}
                    onChange={(e) => updatePhysical({ mouthOpeningDetail: e.target.value })}
                    placeholder="ระบุรายละเอียด"
                    aria-label="รายละเอียด Mouth opening"
                    maxLength={200}
                    className={`${inputBase} flex-1 min-w-[140px] text-xs`}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-600 w-36 shrink-0">• Neck movement</span>
                  <button
                    type="button"
                    onClick={() =>
                      updatePhysical({
                        neckMovement: p.neckMovement === 'normal' ? '' : 'normal',
                      })
                    }
                    className={radioBtn(p.neckMovement === 'normal')}
                  >
                    {p.neckMovement === 'normal' ? '●' : '○'} Normal
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updatePhysical({
                        neckMovement: p.neckMovement === 'limited' ? '' : 'limited',
                      })
                    }
                    className={radioBtn(p.neckMovement === 'limited', 'danger')}
                  >
                    {p.neckMovement === 'limited' ? '●' : '○'} Limited
                  </button>
                  <input
                    type="text"
                    value={p.neckMovementDetail || ''}
                    onChange={(e) => updatePhysical({ neckMovementDetail: e.target.value })}
                    placeholder="ระบุรายละเอียด"
                    aria-label="รายละเอียด Neck movement"
                    maxLength={200}
                    className={`${inputBase} flex-1 min-w-[140px] text-xs`}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-600 w-36 shrink-0">• Thyromental distance</span>
                  <button
                    type="button"
                    onClick={() =>
                      updatePhysical({
                        thyromentalDistance: p.thyromentalDistance === '<6' ? '' : '<6',
                      })
                    }
                    className={radioBtn(p.thyromentalDistance === '<6', 'danger')}
                  >
                    {p.thyromentalDistance === '<6' ? '●' : '○'} &lt; 6 cm
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updatePhysical({
                        thyromentalDistance: p.thyromentalDistance === '>=6' ? '' : '>=6',
                      })
                    }
                    className={radioBtn(p.thyromentalDistance === '>=6')}
                  >
                    {p.thyromentalDistance === '>=6' ? '●' : '○'} &ge; 6 cm
                  </button>
                  <input
                    type="text"
                    value={p.thyromentalDistanceDetail || ''}
                    onChange={(e) => updatePhysical({ thyromentalDistanceDetail: e.target.value })}
                    placeholder="ระบุรายละเอียด"
                    aria-label="รายละเอียด Thyromental distance"
                    maxLength={200}
                    className={`${inputBase} flex-1 min-w-[140px] text-xs`}
                  />
                </div>
              </div>
            </div>

            {/* 2.3 Mallampati class */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">2.3 Mallampati class</div>
              <MallampatiSelector
                value={p.mallampatiClass}
                onChange={(val) => updatePhysical({ mallampatiClass: val })}
              />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-slate-700">
                  Expected difficult airway
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updatePhysical({
                      expectedDifficultAirway: toggleTri(p.expectedDifficultAirway, 'no'),
                    })
                  }
                  className={radioBtn(p.expectedDifficultAirway === 'no')}
                >
                  {p.expectedDifficultAirway === 'no' ? '●' : '○'} No
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updatePhysical({
                      expectedDifficultAirway: toggleTri(p.expectedDifficultAirway, 'yes'),
                    })
                  }
                  className={radioBtn(p.expectedDifficultAirway === 'yes', 'danger')}
                >
                  {p.expectedDifficultAirway === 'yes' ? '●' : '○'} Yes
                </button>
              </div>
            </div>

            {/* 2.4 - 2.6 */}
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 w-28">2.4 Breath sound</span>
                <button
                  type="button"
                  onClick={() =>
                    updatePhysical({ breathSound: p.breathSound === 'normal' ? '' : 'normal' })
                  }
                  className={radioBtn(p.breathSound === 'normal')}
                >
                  {p.breathSound === 'normal' ? '●' : '○'} Normal
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updatePhysical({
                      breathSound: p.breathSound === 'abnormal' ? '' : 'abnormal',
                    })
                  }
                  className={radioBtn(p.breathSound === 'abnormal', 'danger')}
                >
                  {p.breathSound === 'abnormal' ? '●' : '○'} Abnormal
                </button>
                <input
                  type="text"
                  value={p.breathSoundDetail}
                  onChange={(e) => updatePhysical({ breathSoundDetail: e.target.value })}
                  className={`${inputBase} flex-1 min-w-[140px] text-xs`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 w-28">2.5 Heart sound</span>
                <button
                  type="button"
                  onClick={() =>
                    updatePhysical({ heartSound: p.heartSound === 'normal' ? '' : 'normal' })
                  }
                  className={radioBtn(p.heartSound === 'normal')}
                >
                  {p.heartSound === 'normal' ? '●' : '○'} Normal
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updatePhysical({ heartSound: p.heartSound === 'abnormal' ? '' : 'abnormal' })
                  }
                  className={radioBtn(p.heartSound === 'abnormal', 'danger')}
                >
                  {p.heartSound === 'abnormal' ? '●' : '○'} Abnormal
                </button>
                <input
                  type="text"
                  value={p.heartSoundDetail}
                  onChange={(e) => updatePhysical({ heartSoundDetail: e.target.value })}
                  className={`${inputBase} flex-1 min-w-[140px] text-xs`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 w-36 shrink-0">
                  2.6 Functional Capacity (FC)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updatePhysical({
                      functionalCapacityLevel: p.functionalCapacityLevel === '>4' ? '' : '>4',
                    })
                  }
                  className={radioBtn(p.functionalCapacityLevel === '>4')}
                >
                  {p.functionalCapacityLevel === '>4' ? '●' : '○'} &gt; 4 METS
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updatePhysical({
                      functionalCapacityLevel: p.functionalCapacityLevel === '<4' ? '' : '<4',
                    })
                  }
                  className={radioBtn(p.functionalCapacityLevel === '<4', 'danger')}
                >
                  {p.functionalCapacityLevel === '<4' ? '●' : '○'} &lt; 4 METS
                </button>
                <input
                  type="text"
                  value={p.functionalCapacity}
                  onChange={(e) => updatePhysical({ functionalCapacity: e.target.value })}
                  placeholder="รายละเอียด เช่น เดินขึ้นบันได 2 ชั้นได้ / กิจวัตรประจำวัน..."
                  aria-label="รายละเอียด Functional Capacity"
                  className={`${inputBase} flex-1 min-w-[160px] text-xs`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 w-36 shrink-0">
                  Chest pain
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updatePhysical({
                      chestPainStatus: p.chestPainStatus === 'no' ? '' : 'no',
                    })
                  }
                  className={radioBtn(p.chestPainStatus === 'no')}
                >
                  {p.chestPainStatus === 'no' ? '●' : '○'} No chest pain
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updatePhysical({
                      chestPainStatus: p.chestPainStatus === 'yes' ? '' : 'yes',
                    })
                  }
                  className={radioBtn(p.chestPainStatus === 'yes', 'danger')}
                >
                  {p.chestPainStatus === 'yes' ? '●' : '○'} Chest pain
                </button>
                <input
                  type="text"
                  value={p.chestPainDetail ?? ''}
                  onChange={(e) => updatePhysical({ chestPainDetail: e.target.value })}
                  placeholder="รายละเอียดอาการเจ็บหน้าอก (ถ้ามี)..."
                  aria-label="รายละเอียด Chest pain"
                  className={`${inputBase} flex-1 min-w-[160px] text-xs`}
                />
              </div>
            </div>
          </div>

          {/* 4. Laboratory Evaluation */}
          <div
            ref={labSectionRef}
            onKeyDown={handleLabKeyDown}
            className="p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 bg-ppink-50/85 border border-ppink-200/80 rounded-lg px-3 py-1.5">
              <h2 className="text-sm font-bold text-ppink-800">
                4. Laboratory Evaluation
              </h2>
              <span className="text-[11px] text-slate-500">
                ใช้ Tab, Enter หรือลูกศร ↑ ↓ ← → เลื่อนช่องกรอกได้
              </span>
            </div>

            {/* CBC & Chemistry Fishbone with separate Lab Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/60 border border-slate-200 rounded-lg p-3">
              {/* CBC Column */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-200/80">
                  <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                    วันที่ตรวจ CBC :
                  </span>
                  <ThaiDateInput
                    ariaLabel="วันที่ตรวจ CBC (พ.ศ.)"
                    value={lab.cbcDate ?? ''}
                    onChange={(next) => updateLabPatch({ cbcDate: next, labDate: '' })}
                    placeholder="วว/ดด/ปปปป"
                    className={`${inputBase} font-mono tabular-nums text-xs w-36`}
                  />
                  <button
                    type="button"
                    onClick={() => updateLabPatch({ cbcDate: getTodayIsoDate(), labDate: '' })}
                    className="px-2 py-1 text-[11px] font-medium text-blue-900 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 whitespace-nowrap"
                  >
                    วันนี้
                  </button>
                  {lab.cbcDate && (
                    <>
                      <span className="text-[11px] font-mono tabular-nums text-blue-900 font-semibold">
                        ({formatShortThaiDate(lab.cbcDate)})
                      </span>
                      <button
                        type="button"
                        onClick={() => updateLabPatch({ cbcDate: '', labDate: '' })}
                        aria-label="ล้างวันที่ตรวจ CBC"
                        title="ล้างวันที่ตรวจ CBC"
                        className="p-0.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/70"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
                <CbcFishbone lab={lab} onChange={updateLab} />
              </div>

              {/* Chemistry Column */}
              <div className="space-y-2 sm:border-l sm:border-slate-200/80 sm:pl-4">
                <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-200/80">
                  <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                    วันที่ตรวจ Chemistry :
                  </span>
                  <ThaiDateInput
                    ariaLabel="วันที่ตรวจ Chemistry (พ.ศ.)"
                    value={lab.chemDate ?? ''}
                    onChange={(next) => updateLabPatch({ chemDate: next, labDate: '' })}
                    placeholder="วว/ดด/ปปปป"
                    className={`${inputBase} font-mono tabular-nums text-xs w-36`}
                  />
                  <button
                    type="button"
                    onClick={() => updateLabPatch({ chemDate: getTodayIsoDate(), labDate: '' })}
                    className="px-2 py-1 text-[11px] font-medium text-blue-900 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 whitespace-nowrap"
                  >
                    วันนี้
                  </button>
                  {lab.cbcDate && lab.chemDate !== lab.cbcDate && (
                    <button
                      type="button"
                      onClick={() => updateLabPatch({ chemDate: lab.cbcDate, labDate: '' })}
                      title="ใช้วันที่เดียวกับ CBC"
                      className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 whitespace-nowrap"
                    >
                      = วัน CBC
                    </button>
                  )}
                  {lab.chemDate && (
                    <>
                      <span className="text-[11px] font-mono tabular-nums text-blue-900 font-semibold">
                        ({formatShortThaiDate(lab.chemDate)})
                      </span>
                      <button
                        type="button"
                        onClick={() => updateLabPatch({ chemDate: '', labDate: '' })}
                        aria-label="ล้างวันที่ตรวจ Chemistry"
                        title="ล้างวันที่ตรวจ Chemistry"
                        className="p-0.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/70"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
                <ChemFishbone lab={lab} onChange={updateLab} />
              </div>
            </div>

            {/* Coag */}
            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-700">PT</span>
                <input
                  type="text"
                  value={lab.pt}
                  onChange={(e) => updateLab('pt', e.target.value)}
                  className={`${inputBase} w-full font-mono tabular-nums text-xs`}
                />
                <span className="text-[11px] text-slate-500">sec</span>
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-700">PTT</span>
                <input
                  type="text"
                  value={lab.ptt}
                  onChange={(e) => updateLab('ptt', e.target.value)}
                  className={`${inputBase} w-full font-mono tabular-nums text-xs`}
                />
                <span className="text-[11px] text-slate-500">sec</span>
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-700">INR</span>
                <input
                  type="text"
                  value={lab.inr}
                  onChange={(e) => updateLab('inr', e.target.value)}
                  className={`${inputBase} w-full font-mono tabular-nums text-xs`}
                />
              </label>
            </div>

            {/* LFT */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">SGOT (U/L)</span>
                <input
                  type="text"
                  value={lab.sgot}
                  onChange={(e) => updateLab('sgot', e.target.value)}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">SGPT (U/L)</span>
                <input
                  type="text"
                  value={lab.sgpt}
                  onChange={(e) => updateLab('sgpt', e.target.value)}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">ALP (U/L)</span>
                <input
                  type="text"
                  value={lab.alp}
                  onChange={(e) => updateLab('alp', e.target.value)}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">Alb (g/dl)</span>
                <input
                  type="text"
                  value={lab.alb}
                  onChange={(e) => updateLab('alb', e.target.value)}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
            </div>

            {/* Glucose, HbA1C, Lactate, Trop I */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">Glucose (mg/dl)</span>
                <input
                  type="text"
                  value={lab.glucose}
                  onChange={(e) => updateLab('glucose', e.target.value)}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">HbA1C (%)</span>
                <input
                  type="text"
                  value={lab.hba1c}
                  onChange={(e) => updateLab('hba1c', e.target.value)}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">Lactate (mmol/L)</span>
                <input
                  type="text"
                  value={lab.lactate || ''}
                  onChange={(e) => updateLab('lactate', e.target.value)}
                  maxLength={20}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">Trop I</span>
                <input
                  type="text"
                  value={lab.tropI || ''}
                  onChange={(e) => updateLab('tropI', e.target.value)}
                  maxLength={20}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
            </div>

            {/* TFT (Thyroid Function Test): FT3, FT4, TSH */}
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-slate-600">
                TFT (Thyroid Function Test)
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-500">FT3 (pg/mL)</span>
                  <input
                    type="text"
                    value={lab.ft3 || ''}
                    onChange={(e) => updateLab('ft3', e.target.value)}
                    placeholder="2.0–4.4"
                    maxLength={20}
                    className={`${inputBase} font-mono tabular-nums text-xs`}
                  />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-500">FT4 (ng/dL)</span>
                  <input
                    type="text"
                    value={lab.ft4 || ''}
                    onChange={(e) => updateLab('ft4', e.target.value)}
                    placeholder="0.8–1.8"
                    maxLength={20}
                    className={`${inputBase} font-mono tabular-nums text-xs`}
                  />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-500">TSH (mIU/L)</span>
                  <input
                    type="text"
                    value={lab.tsh || ''}
                    onChange={(e) => updateLab('tsh', e.target.value)}
                    placeholder="0.27–4.2"
                    maxLength={20}
                    className={`${inputBase} font-mono tabular-nums text-xs`}
                  />
                </label>
              </div>
            </div>

            {/* Blood Gas (ABG / VBG) */}
            {(() => {
              const isVbg = lab.bgType === 'VBG';
              const isAbg = lab.bgType === 'ABG';
              const pfRatio = computeBloodGasPfRatio(lab);
              return (
                <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-600">
                        Blood Gas (ABG / VBG)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateLabPatch({
                              bgType: lab.bgType === 'ABG' ? '' : 'ABG',
                            })
                          }
                          className={radioBtn(lab.bgType === 'ABG')}
                        >
                          {lab.bgType === 'ABG' ? '●' : '○'} ABG
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateLabPatch({
                              bgType: lab.bgType === 'VBG' ? '' : 'VBG',
                            })
                          }
                          className={radioBtn(lab.bgType === 'VBG')}
                        >
                          {lab.bgType === 'VBG' ? '●' : '○'} VBG
                        </button>
                      </div>
                    </div>
                    {pfRatio !== null && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                          pfRatio < 200
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : pfRatio < 300
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        P/F ratio: {pfRatio}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <label className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-slate-500">pH</span>
                      <input
                        type="text"
                        value={lab.bgPh || ''}
                        onChange={(e) => updateLab('bgPh', e.target.value)}
                        placeholder={isVbg ? '7.31–7.41' : '7.35–7.45'}
                        maxLength={20}
                        className={`${inputBase} font-mono tabular-nums text-xs`}
                      />
                    </label>
                    <label className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-slate-500">
                        {isVbg ? 'PvCO2' : isAbg ? 'PaCO2' : 'pCO2'} (mmHg)
                      </span>
                      <input
                        type="text"
                        value={lab.bgPco2 || ''}
                        onChange={(e) => updateLab('bgPco2', e.target.value)}
                        placeholder={isVbg ? '41–51' : '35–45'}
                        maxLength={20}
                        className={`${inputBase} font-mono tabular-nums text-xs`}
                      />
                    </label>
                    <label className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-slate-500">
                        {isVbg ? 'PvO2' : isAbg ? 'PaO2' : 'pO2'} (mmHg)
                      </span>
                      <input
                        type="text"
                        value={lab.bgPo2 || ''}
                        onChange={(e) => updateLab('bgPo2', e.target.value)}
                        placeholder={isVbg ? '30–40' : '80–100'}
                        maxLength={20}
                        className={`${inputBase} font-mono tabular-nums text-xs`}
                      />
                    </label>
                    <label className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-slate-500">HCO3⁻ (mEq/L)</span>
                      <input
                        type="text"
                        value={lab.bgHco3 || ''}
                        onChange={(e) => updateLab('bgHco3', e.target.value)}
                        placeholder="22–26"
                        maxLength={20}
                        className={`${inputBase} font-mono tabular-nums text-xs`}
                      />
                    </label>
                    <label className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-slate-500">BE (mEq/L)</span>
                      <input
                        type="text"
                        value={lab.bgBe || ''}
                        onChange={(e) => updateLab('bgBe', e.target.value)}
                        placeholder="-2 ถึง +2"
                        maxLength={20}
                        className={`${inputBase} font-mono tabular-nums text-xs`}
                      />
                    </label>
                    <label className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-slate-500">
                        {isVbg ? 'SvO2' : isAbg ? 'SaO2' : 'O2 Sat'} (%)
                      </span>
                      <input
                        type="text"
                        value={lab.bgSao2 || ''}
                        onChange={(e) => updateLab('bgSao2', e.target.value)}
                        placeholder={isVbg ? '70–75' : '95–100'}
                        maxLength={20}
                        className={`${inputBase} font-mono tabular-nums text-xs`}
                      />
                    </label>
                    <label className="flex flex-col gap-0.5 sm:col-span-2">
                      <span className="text-[11px] text-slate-500">FiO2</span>
                      <input
                        type="text"
                        value={lab.bgFio2 || ''}
                        onChange={(e) => updateLab('bgFio2', e.target.value)}
                        placeholder="เช่น 0.21 หรือ 40%"
                        maxLength={20}
                        className={`${inputBase} font-mono tabular-nums text-xs`}
                      />
                    </label>
                  </div>
                </div>
              );
            })()}

            {/* Anti-HIV, HBsAg & Other Lab */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-500">Anti-HIV</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateLabPatch({
                          antiHiv: lab.antiHiv === 'negative' ? '' : 'negative',
                        })
                      }
                      className={radioBtn(lab.antiHiv === 'negative')}
                    >
                      {lab.antiHiv === 'negative' ? '●' : '○'} Negative
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateLabPatch({
                          antiHiv: lab.antiHiv === 'positive' ? '' : 'positive',
                        })
                      }
                      className={radioBtn(lab.antiHiv === 'positive', 'danger')}
                    >
                      {lab.antiHiv === 'positive' ? '●' : '○'} Positive
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-500">HBsAg</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateLabPatch({
                          hbsAg: lab.hbsAg === 'negative' ? '' : 'negative',
                        })
                      }
                      className={radioBtn(lab.hbsAg === 'negative')}
                    >
                      {lab.hbsAg === 'negative' ? '●' : '○'} Negative
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateLabPatch({
                          hbsAg: lab.hbsAg === 'positive' ? '' : 'positive',
                        })
                      }
                      className={radioBtn(lab.hbsAg === 'positive', 'danger')}
                    >
                      {lab.hbsAg === 'positive' ? '●' : '○'} Positive
                    </button>
                  </div>
                </div>
              </div>
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">Other Lab</span>
                <input
                  type="text"
                  value={lab.other}
                  onChange={(e) => updateLab('other', e.target.value)}
                  placeholder="Anti-HCV, UA, etc."
                  className={`${inputBase} text-xs`}
                />
              </label>
            </div>

            {/* Dynamic Additional Labs */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-600">
                  ผล Lab เพิ่มเติม
                  {(lab.customLabs?.length ?? 0) > 0 && (
                    <span className="ml-1 font-mono text-slate-400">
                      ({lab.customLabs?.length}/15)
                    </span>
                  )}
                </span>
                {(lab.customLabs?.length ?? 0) < 15 && (
                  <button
                    type="button"
                    onClick={() =>
                      updateLabPatch({
                        customLabs: [...(lab.customLabs || []), { name: '', value: '' }],
                      })
                    }
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-blue-800 bg-blue-50/70 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่ม Lab
                  </button>
                )}
              </div>

              <datalist id="custom-lab-name-presets">
                <option value="HBsAg" />
                <option value="Anti-HCV" />
                <option value="VDRL" />
                <option value="T.Bil" />
                <option value="D.Bil" />
                <option value="Ca" />
                <option value="Mg" />
                <option value="PO4" />
                <option value="eGFR" />
                <option value="UA" />
                <option value="UPT" />
                <option value="ABG pH" />
                <option value="PaO2" />
                <option value="PaCO2" />
                <option value="HCO3" />
                <option value="TSH" />
                <option value="FT4" />
                <option value="D-dimer" />
                <option value="NT-proBNP" />
                <option value="Procalcitonin" />
                <option value="CRP" />
                <option value="COVID-19 Ag" />
              </datalist>

              {(lab.customLabs || []).length > 0 && (
                <div className="space-y-1.5">
                  {(lab.customLabs || []).map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                      <input
                        type="text"
                        list="custom-lab-name-presets"
                        value={item.name}
                        onChange={(e) => {
                          const next = [...(lab.customLabs || [])];
                          next[idx] = { ...next[idx], name: e.target.value };
                          updateLabPatch({ customLabs: next });
                        }}
                        placeholder="ชื่อ Lab (เช่น HBsAg, Mg, Ca, pH)"
                        maxLength={60}
                        className={`${inputBase} col-span-5 text-xs`}
                      />
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => {
                          const next = [...(lab.customLabs || [])];
                          next[idx] = { ...next[idx], value: e.target.value };
                          updateLabPatch({ customLabs: next });
                        }}
                        placeholder="ค่าผลตรวจ / ผล Lab"
                        maxLength={80}
                        className={`${inputBase} col-span-6 font-mono tabular-nums text-xs`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateLabPatch({
                            customLabs: (lab.customLabs || []).filter((_, i) => i !== idx),
                          })
                        }
                        aria-label={`ลบผล Lab เพิ่มเติมแถวที่ ${idx + 1}`}
                        className="col-span-1 inline-flex items-center justify-center p-1 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Blood group & Blood component prepare */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Group เลือด</span>
                <div className="inline-flex flex-wrap items-center gap-1">
                  {BLOOD_GROUP_OPTIONS.map((grp) => {
                    const active = lab.bloodGroup === grp;
                    return (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => updateLabPatch({ bloodGroup: active ? '' : grp })}
                        className={`${radioBtn(active)} min-w-[2.25rem] justify-center font-mono`}
                      >
                        {grp}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">
                  Blood component prepare
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextTs = !lab.prepTs;
                    const current = Array.isArray(lab.prepStatuses) ? lab.prepStatuses : [];
                    updateLabPatch({
                      prepTs: nextTs,
                      prepStatuses: nextTs ? current.filter((s) => s !== 'no_blood') : current,
                    });
                  }}
                  className={radioBtn(Boolean(lab.prepTs))}
                >
                  {lab.prepTs ? '☑' : '☐'} T&amp;S
                </button>
                <label className="inline-flex items-center gap-1">
                  <span className="text-xs text-slate-600">PRC</span>
                  <input
                    type="text"
                    value={lab.prepPrc}
                    onChange={(e) => updateBloodPrepUnit('prepPrc', e.target.value)}
                    className={`${inputBase} w-12 text-center font-mono tabular-nums text-xs`}
                  />
                  <span className="text-xs text-slate-500">u</span>
                </label>
                <label className="inline-flex items-center gap-1">
                  <span className="text-xs text-slate-600">FFP</span>
                  <input
                    type="text"
                    value={lab.prepFfp}
                    onChange={(e) => updateBloodPrepUnit('prepFfp', e.target.value)}
                    className={`${inputBase} w-12 text-center font-mono tabular-nums text-xs`}
                  />
                  <span className="text-xs text-slate-500">u</span>
                </label>
                <label className="inline-flex items-center gap-1">
                  <span className="text-xs text-slate-600">Plt</span>
                  <input
                    type="text"
                    value={lab.prepPlt}
                    onChange={(e) => updateBloodPrepUnit('prepPlt', e.target.value)}
                    className={`${inputBase} w-12 text-center font-mono tabular-nums text-xs`}
                  />
                  <span className="text-xs text-slate-500">u</span>
                </label>
                <label className="inline-flex items-center gap-1" title="Cryoprecipitate">
                  <span className="text-xs text-slate-600">Cryoprecipitate</span>
                  <input
                    type="text"
                    aria-label="Cryoprecipitate (units)"
                    value={lab.prepCryo || ''}
                    onChange={(e) => updateBloodPrepUnit('prepCryo', e.target.value)}
                    maxLength={20}
                    className={`${inputBase} w-12 text-center font-mono tabular-nums text-xs`}
                  />
                  <span className="text-xs text-slate-500">u</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {BLOOD_PREP_STATUS_OPTIONS.map((opt) => {
                  const active = (lab.prepStatuses || []).includes(opt.value);
                  const variant = opt.value === 'not_ready' ? 'danger' : 'default';
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleBloodPrepStatus(opt.value)}
                      className={radioBtn(active, variant)}
                    >
                      {active ? '☑' : '☐'} {opt.label}
                    </button>
                  );
                })}
                <input
                  type="text"
                  value={lab.prepStatusDetail || ''}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    const current = Array.isArray(lab.prepStatuses) ? lab.prepStatuses : [];
                    updateLabPatch({
                      prepStatusDetail: nextVal,
                      prepStatuses:
                        nextVal.trim() && !current.includes('other')
                          ? [...current, 'other']
                          : current,
                    });
                  }}
                  placeholder="ระบุรายละเอียด"
                  aria-label="รายละเอียด Blood component prepare อื่นๆ"
                  maxLength={300}
                  className={`${inputBase} flex-1 min-w-[150px] text-xs`}
                />
              </div>
            </div>
          </div>

          {/* 6. Consult Med/Cardio */}
          <div className="p-4 space-y-2.5">
            <h2 className="text-sm font-bold text-pblue-800 bg-pblue-50/85 border border-pblue-200/80 rounded-lg px-3 py-1.5">
              6. Consult Med/Cardio
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              {CONSULT_TYPE_OPTIONS.map((opt) => {
                const selectedList: ConsultType[] = Array.isArray(fd.consultTypes)
                  ? fd.consultTypes
                  : [];
                const active = selectedList.includes(opt.value);
                const handleToggleConsult = () => {
                  let nextList: ConsultType[];
                  if (opt.value === 'none') {
                    nextList = active ? [] : ['none'];
                  } else {
                    const withoutNone = selectedList.filter((item) => item !== 'none');
                    nextList = active
                      ? withoutNone.filter((item) => item !== opt.value)
                      : [...withoutNone, opt.value];
                  }
                  updateFormData({ consultTypes: nextList });
                };
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={handleToggleConsult}
                    className={radioBtn(active)}
                  >
                    {active ? '☑' : '☐'} {opt.label}
                  </button>
                );
              })}
            </div>
            <textarea
              rows={4}
              value={fd.consult}
              onChange={(e) => updateFormData({ consult: e.target.value })}
              placeholder="รายละเอียดความเห็นจากแพทย์อายุรกรรม / โรคหัวใจ (Med/Cardio clearance, คำแนะนำก่อนผ่าตัด)..."
              className={`${inputBase} w-full text-xs resize-y`}
            />
          </div>
        </div>
      </div>

      {/* FULL-WIDTH LOWER SECTIONS (7, 8, 9, 10) */}
      <div className="p-4 space-y-4 border-b border-slate-300">
        {/* 7. ASA Classification */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-900 mr-2">7. ASA Classification</span>
          {(['I', 'II', 'III', 'IV', 'V', 'VI'] as const).map((cls) => (
            <button
              key={cls}
              type="button"
              onClick={() => updateTop('asaClass', value.asaClass === cls ? '' : (cls as AsaClass))}
              className={radioBtn(
                value.asaClass === cls,
                cls === 'IV' || cls === 'V' || cls === 'VI' ? 'danger' : 'default',
              )}
            >
              {value.asaClass === cls ? '●' : '○'} Class {cls}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const nextEmerg = !value.asaEmergency;
              onChange({
                ...value,
                asaEmergency: nextEmerg,
                scheduleType: nextEmerg ? 'emergency' : 'elective',
              });
            }}
            className={radioBtn(value.asaEmergency, 'danger')}
          >
            {value.asaEmergency ? '●' : '○'} E (Emergency)
          </button>
        </div>

        {/* 8. Problem list */}
        {(() => {
          const autoProblems = generateAutoProblemEntries(value);
          const missingAutoProblems = getMissingAutoProblems(value);
          const isSorted = isProblemListSortedBySeverity(value);
          return (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-bold text-slate-900">8. Problem list</span>
                  {autoProblems.length > 0 && missingAutoProblems.length === 0 && (
                    <span className="text-[11px] text-emerald-700 font-medium">
                      เรียงลำดับอัตโนมัติแล้ว
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!isSorted && (
                    <button
                      type="button"
                      onClick={() =>
                        updateFormData({
                          problemList: sortProblemListBySeverity(fd.problemList, autoProblems),
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                      <ArrowDownWideNarrow className="w-3.5 h-3.5 text-blue-800" />
                      เรียงลำดับ
                    </button>
                  )}
                  {fd.problemList.some((s) => s.trim().length > 0) && (
                    <button
                      type="button"
                      onClick={() =>
                        updateFormData({
                          problemList: refreshAutoProblems(value),
                        })
                      }
                      title="ตรวจสอบและประมวลผล Problem list ใหม่จากข้อมูลผู้ป่วย (ลบข้อความผิดพลาดที่เกิดจากผลตรวจปกติ/No ... โดยคงข้อความที่พิมพ์เองไว้)"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                      ประมวลผลใหม่
                    </button>
                  )}
                  {missingAutoProblems.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        updateFormData({
                          problemList: applyAutoProblems(value),
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-800 rounded-md hover:bg-blue-900 transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      ดึงข้อมูลลง Problem list (+{missingAutoProblems.length})
                    </button>
                  )}
                  {fd.problemList.length < 12 && (
                    <button
                      type="button"
                      onClick={() => updateFormData({ problemList: [...fd.problemList, ''] })}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-800 hover:text-blue-900 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      เพิ่ม Problem
                    </button>
                  )}
                </div>
              </div>

              {missingAutoProblems.length > 0 && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-2.5 space-y-1.5">
                  <div className="text-[11px] font-medium text-blue-900">
                    พบข้อมูลผู้ป่วยเรียงลำดับแล้ว (คลิกเพื่อเพิ่มทีละข้อ หรือกดดึงทั้งหมดด้านบน):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {missingAutoProblems.map((entry, idx) => (
                      <button
                        key={entry.key}
                        type="button"
                        onClick={() =>
                          updateFormData({
                            problemList: applyAutoProblems(value, [entry]),
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-left text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <Plus className="w-3 h-3 shrink-0 text-blue-700" />
                        <span className="font-mono text-[11px] text-slate-500">{idx + 1}.</span>
                        <span>{entry.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {fd.problemList.map((prob, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-slate-500 w-5 shrink-0">{idx + 1}.</span>
                    <input
                      type="text"
                      value={prob}
                      onChange={(e) => {
                        const next = [...fd.problemList];
                        next[idx] = e.target.value;
                        updateFormData({ problemList: next });
                      }}
                      placeholder={`ปัญหาทางคลินิกข้อ ${idx + 1}`}
                      className={`${inputBase} flex-1 text-xs`}
                    />
                    {prob.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...fd.problemList];
                          next[idx] = '';
                          updateFormData({ problemList: next });
                        }}
                        aria-label={`ล้าง Problem ข้อ ${idx + 1}`}
                        title="ล้างข้อความช่องนี้"
                        className="p-1 text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {fd.problemList.length > 6 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateFormData({
                            problemList: fd.problemList.filter((_, i) => i !== idx),
                          })
                        }
                        aria-label="ลบ Problem"
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* 9. Anesthetic plan */}
        <div className="space-y-2">
          <span className="text-sm font-bold text-slate-900 block">9. Anesthetic plan</span>
          <div className="space-y-2 pl-1">
            {/* GA */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 min-w-[165px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={ap.gaSelected}
                  onChange={(e) => updatePlan({ gaSelected: e.target.checked })}
                  className="rounded border-slate-400 text-blue-800 focus:ring-blue-800"
                />
                General anesthesia
              </label>
              {(['Intubation', 'LMA', 'Mask', 'TIVA', 'Other'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleGaMethod(m)}
                  className={radioBtn(ap.gaMethods.includes(m))}
                >
                  {ap.gaMethods.includes(m) ? '●' : '○'} {m}
                </button>
              ))}
              {ap.gaMethods.includes('Other') && (
                <input
                  type="text"
                  value={ap.gaOther}
                  onChange={(e) => updatePlan({ gaOther: e.target.value })}
                  placeholder="ระบุ GA อื่นๆ"
                  className={`${inputBase} w-44 text-xs`}
                />
              )}
            </div>

            {/* RA */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 min-w-[165px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={ap.raSelected}
                  onChange={(e) => updatePlan({ raSelected: e.target.checked })}
                  className="rounded border-slate-400 text-blue-800 focus:ring-blue-800"
                />
                Regional anesthesia
              </label>
              {(['Spinal block', 'Epidural', 'Nerve block', 'Other'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleRaMethod(m)}
                  className={radioBtn(ap.raMethods.includes(m))}
                >
                  {ap.raMethods.includes(m) ? '●' : '○'} {m}
                </button>
              ))}
              {ap.raMethods.includes('Other') && (
                <input
                  type="text"
                  value={ap.raOther}
                  onChange={(e) => updatePlan({ raOther: e.target.value })}
                  placeholder="ระบุ RA อื่นๆ"
                  className={`${inputBase} w-44 text-xs`}
                />
              )}
            </div>

            {/* MAC */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 min-w-[165px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(ap.macSelected)}
                  onChange={(e) => updatePlan({ macSelected: e.target.checked })}
                  className="rounded border-slate-400 text-blue-800 focus:ring-blue-800"
                />
                MAC (Monitored Anesthesia Care)
              </label>
              {ap.macSelected && (
                <input
                  type="text"
                  value={ap.macDetail ?? ''}
                  onChange={(e) => updatePlan({ macDetail: e.target.value })}
                  maxLength={200}
                  placeholder="รายละเอียด MAC / Sedation (ถ้ามี)"
                  className={`${inputBase} w-64 text-xs`}
                />
              )}
            </div>
          </div>
        </div>

        {/* 10. สิ่งที่ต้องเตรียม (ตาม order วิสัญญีแพทย์) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">
              10. สิ่งที่ต้องเตรียม ( ตาม order วิสัญญีแพทย์ )
            </span>
            {fd.preparationOrders.length < 12 && (
              <button
                type="button"
                onClick={() =>
                  updateFormData({ preparationOrders: [...fd.preparationOrders, ''] })
                }
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-800 hover:text-blue-900"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มคำสั่งเตรียม
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {fd.preparationOrders.map((ord, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="font-mono text-xs text-slate-500 w-5">{idx + 1}.</span>
                <input
                  type="text"
                  value={ord}
                  onChange={(e) => {
                    const next = [...fd.preparationOrders];
                    next[idx] = e.target.value;
                    updateFormData({ preparationOrders: next });
                  }}
                  placeholder={`รายการที่ต้องเตรียม ${idx + 1}`}
                  className={`${inputBase} flex-1 text-xs`}
                />
                {fd.preparationOrders.length > 4 && (
                  <button
                    type="button"
                    onClick={() =>
                      updateFormData({
                        preparationOrders: fd.preparationOrders.filter((_, i) => i !== idx),
                      })
                    }
                    aria-label="ลบรายการที่ต้องเตรียม"
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summarized by (ชื่อผู้สรุป) - ไว้สุดท้ายของหน้า Pre-op */}
        <div className="pt-3 border-t border-slate-200 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-800 font-bold">Summarized by (ชื่อผู้สรุป)</span>
              {(() => {
                const currentSummarizer = fd.postAnesthesia.summarizedBy ?? '';
                const isListedSummarizer = summarizerOptions.includes(currentSummarizer);
                return (
                  <>
                    <select
                      aria-label="เลือกผู้สรุป (Summarized by)"
                      value={isListedSummarizer ? currentSummarizer : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          updatePreOpSummarizer({ summarizedBy: e.target.value });
                        } else if (isListedSummarizer) {
                          updatePreOpSummarizer({ summarizedBy: '' });
                        }
                      }}
                      className={`${inputBase} w-52 text-xs`}
                    >
                      <option value="">-- เลือกรายชื่อผู้สรุป --</option>
                      {summarizerOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      aria-label="พิมพ์ชื่อผู้สรุปเพิ่มเติม"
                      value={currentSummarizer}
                      onChange={(e) => updatePreOpSummarizer({ summarizedBy: e.target.value })}
                      placeholder="หรือพิมพ์ชื่อผู้สรุปเพิ่มเติม..."
                      maxLength={120}
                      className={`${inputBase} w-48 text-xs`}
                    />
                    {currentSummarizer.trim() && (
                      <button
                        type="button"
                        onClick={() => updatePreOpSummarizer({ summarizedBy: '' })}
                        title="ล้างชื่อผู้สรุปในช่องนี้"
                        aria-label="ล้างชื่อผู้สรุปในช่องนี้"
                        className="p-1 text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {currentSummarizer.trim() && !isListedSummarizer && (
                      <button
                        type="button"
                        onClick={() => handleAddSummarizerOption(currentSummarizer)}
                        title="เพิ่มชื่อนี้เข้าตัวเลือก Summarized by"
                        className="px-2 py-1 text-[11px] font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 whitespace-nowrap"
                      >
                        + บันทึก
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsManagingSummarizers((prev) => !prev)}
                      className="inline-flex items-center gap-0.5 text-[11px] font-medium text-blue-800 hover:text-blue-950 whitespace-nowrap ml-1"
                    >
                      <Plus className="w-3 h-3" />
                      {isManagingSummarizers ? 'ปิด' : 'เพิ่ม/ลดรายชื่อ'}
                    </button>
                  </>
                );
              })()}
            </div>
            <label className="inline-flex items-center gap-1.5 text-xs">
              <span className="text-slate-600 font-medium">วันที่สรุป (date)</span>
              <ThaiDateInput
                ariaLabel="วันที่สรุป Summarized date (พ.ศ.)"
                value={fd.postAnesthesia.summarizedDate}
                onChange={(next) => updatePreOpSummarizer({ summarizedDate: next })}
                placeholder="วว/ดด/ปปปป"
                className={`${inputBase} w-36 font-mono tabular-nums text-xs`}
              />
            </label>
          </div>

          {isManagingSummarizers && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  จัดการรายชื่อผู้สรุป Summarized by (เพิ่ม แก้ไข หรือลบรายชื่อได้ ·{' '}
                  {summarizerOptions.length} รายชื่อ)
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {summarizerOptions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllSummarizers}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-700 bg-white border border-red-200 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      ล้างทั้งหมด
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetSummarizerOptions}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
                  >
                    <RotateCcw className="w-3 h-3" />
                    รีเซ็ตค่าเริ่มต้น
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsManagingSummarizers(false)}
                    className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900"
                  >
                    ปิด
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newSummarizerName}
                  onChange={(e) => setNewSummarizerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSummarizerOption(newSummarizerName);
                    }
                  }}
                  placeholder="พิมพ์ชื่อผู้สรุปใหม่ เช่น พว.สมหญิง ใจดี"
                  maxLength={120}
                  className="flex-1 min-w-[220px] bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
                />
                <button
                  type="button"
                  onClick={() => handleAddSummarizerOption(newSummarizerName)}
                  disabled={!newSummarizerName.trim() || newSummarizerName.trim() === 'อื่นๆ'}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-800 rounded-md hover:bg-blue-900 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มรายชื่อ
                </button>
              </div>

              {summarizerOptions.length === 0 ? (
                <p className="text-xs text-slate-500 py-1">
                  ยังไม่มีรายชื่อผู้สรุปในตัวเลือก (สามารถพิมพ์เพิ่มด้านบน หรือกดรีเซ็ตค่าเริ่มต้น)
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                  {summarizerOptions.map((s) => {
                    const isEditing = editingSummarizer?.original === s;
                    return isEditing ? (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-white border border-blue-800 rounded-md"
                      >
                        <input
                          type="text"
                          value={editingSummarizer.text}
                          onChange={(e) =>
                            setEditingSummarizer({ original: s, text: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditedSummarizer();
                            } else if (e.key === 'Escape') {
                              setEditingSummarizer(null);
                            }
                          }}
                          maxLength={120}
                          autoFocus
                          className="w-44 text-xs text-slate-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSaveEditedSummarizer}
                          aria-label="บันทึกชื่อที่แก้ไข"
                          className="p-0.5 text-emerald-700 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSummarizer(null)}
                          aria-label="ยกเลิกการแก้ไข"
                          className="p-0.5 text-slate-400 hover:text-slate-700 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ) : (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white border border-slate-300 rounded-md text-slate-800"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => setEditingSummarizer({ original: s, text: s })}
                          aria-label={`แก้ไข ${s}`}
                          title="แก้ไขชื่อ"
                          className="p-0.5 text-slate-400 hover:text-blue-800 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSummarizerOption(s)}
                          aria-label={`ลบ ${s}`}
                          title="ลบรายชื่อ"
                          className="p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer with link to Post-op Evaluation */}
      {(() => {
        const postOpCheck = getPostOpVisitCompleteness(fd.postAnesthesia, fd.postOpComplication);
        return (
          <div className="px-4 py-3 bg-gradient-to-r from-pgreen-50/60 via-white to-pblue-50/60 border-t border-pborder flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {postOpCheck.isComplete ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-pgreen-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-pgreen-600" />
                  เยี่ยมหลังผ่าตัดแล้ว (ลงข้อมูลครบถ้วน)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-semibold text-pyellow-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-pyellow-600" />
                  ยังไม่ได้เยี่ยมหลังผ่าตัด
                  {postOpCheck.hasAnyInput
                    ? ` (ลงข้อมูลไม่ครบ ${postOpCheck.filledCount}/${postOpCheck.totalRequired})`
                    : ''}
                </span>
              )}
              {onGoToPostOp && (
                <button
                  type="button"
                  onClick={onGoToPostOp}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pgreen-800 bg-pgreen-50 border border-pgreen-200 rounded-lg hover:bg-pgreen-100 transition-colors whitespace-nowrap"
                >
                  เปิดแบบฟอร์ม Post-op Evaluation (ANE-FM-006-01)
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-right text-[11px] text-slate-500">
              ANE-FM-002-03 อนุมัติใช้วันที่ 21 มิถุนายน 2564
            </div>
          </div>
        );
      })()}
    </div>
  );
}
