import React, { useRef, useState } from 'react';
import { Check, Edit2, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import {
  addDaysToIsoDate,
  applyMissingAutoPremeds,
  AsaClass,
  BLOOD_PREP_STATUS_OPTIONS,
  BloodPrepStatus,
  calculateBmi,
  createEmptyOxygenSupport,
  DEFAULT_OXYGEN_OTHER_PRESETS,
  DEFAULT_SUMMARIZER_LIST,
  DEFAULT_SURGEON_LIST,
  DEFAULT_WARD_LIST,
  deriveAnesthesiaType,
  DRUG_ADDICTION_OPTIONS,
  DurationUnit,
  EvaluationFormData,
  formatOxygenSupportSummary,
  formatThaiScheduleDate,
  formatToothMarksSummary,
  GaMethod,
  getEffectiveScheduleType,
  getMissingAutoPremedEntries,
  getTodayIsoDate,
  MedicationGroup,
  OR_ROOM_OPTIONS,
  OxygenSupportData,
  PreAnestheticEvaluation,
  RaMethod,
  syncPremedicationWithMedications,
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

interface PreAnestheticFormProps {
  value: PreAnestheticEvaluation;
  onChange: (next: PreAnestheticEvaluation) => void;
  medicationGroups: MedicationGroup[];
  onUpdateMedicationGroups: (nextGroups: MedicationGroup[]) => void;
  wardOptions: string[];
  onUpdateWardOptions: (nextWards: string[]) => void;
  surgeonOptions: string[];
  onUpdateSurgeonOptions: (nextSurgeons: string[]) => void;
  oxygenPresets: string[];
  onUpdateOxygenPresets: (nextPresets: string[]) => void;
  summarizerOptions: string[];
  onUpdateSummarizerOptions: (nextSummarizers: string[]) => void;
  visitorOptions: string[];
  onUpdateVisitorOptions: (nextVisitors: string[]) => void;
}

export function PreAnestheticForm({
  value,
  onChange,
  medicationGroups,
  onUpdateMedicationGroups,
  wardOptions,
  onUpdateWardOptions,
  surgeonOptions,
  onUpdateSurgeonOptions,
  oxygenPresets,
  onUpdateOxygenPresets,
  summarizerOptions,
  onUpdateSummarizerOptions,
  visitorOptions,
  onUpdateVisitorOptions,
}: PreAnestheticFormProps) {
  const [isManagingWards, setIsManagingWards] = useState(false);
  const [newWardName, setNewWardName] = useState('');
  const [isManagingSurgeons, setIsManagingSurgeons] = useState(false);
  const [newSurgeonName, setNewSurgeonName] = useState('');
  const [editingSurgeon, setEditingSurgeon] = useState<{
    original: string;
    text: string;
  } | null>(null);
  const [isManagingSummarizers, setIsManagingSummarizers] = useState(false);
  const [newSummarizerName, setNewSummarizerName] = useState('');
  const [editingSummarizer, setEditingSummarizer] = useState<{
    original: string;
    text: string;
  } | null>(null);
  const [isManagingVisitors, setIsManagingVisitors] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [editingVisitor, setEditingVisitor] = useState<{
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

  const handleAddSummarizerOption = (rawName: string) => {
    const trimmed = rawName.trim().slice(0, 120);
    if (!trimmed || trimmed === 'อื่นๆ') return;
    if (!summarizerOptions.includes(trimmed)) {
      onUpdateSummarizerOptions([...summarizerOptions, trimmed]);
    }
    updatePostOp({ summarizedBy: trimmed });
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
    if (pa.summarizedBy === editingSummarizer.original) {
      updatePostOp({ summarizedBy: trimmed });
    }
    setEditingSummarizer(null);
  };

  const handleRemoveSummarizerOption = (name: string) => {
    onUpdateSummarizerOptions(summarizerOptions.filter((s) => s !== name));
    if (pa.summarizedBy === name) {
      updatePostOp({ summarizedBy: '' });
    }
    if (editingSummarizer?.original === name) {
      setEditingSummarizer(null);
    }
  };

  const handleClearAllSummarizers = () => {
    onUpdateSummarizerOptions([]);
    if (summarizerOptions.includes(pa.summarizedBy ?? '')) {
      updatePostOp({ summarizedBy: '' });
    }
    setEditingSummarizer(null);
  };

  const handleResetSummarizerOptions = () => {
    onUpdateSummarizerOptions([...DEFAULT_SUMMARIZER_LIST]);
    setEditingSummarizer(null);
  };

  const handleAddVisitorOption = (rawName: string) => {
    const trimmed = rawName.trim().slice(0, 120);
    if (!trimmed || trimmed === 'อื่นๆ') return;
    if (!visitorOptions.includes(trimmed)) {
      onUpdateVisitorOptions([...visitorOptions, trimmed]);
    }
    updatePostOp({ visitBy: trimmed });
    setNewVisitorName('');
  };

  const handleSaveEditedVisitor = () => {
    if (!editingVisitor) return;
    const trimmed = editingVisitor.text.trim().slice(0, 120);
    if (!trimmed || trimmed === 'อื่นๆ') return;
    const nextList = visitorOptions.map((v) =>
      v === editingVisitor.original ? trimmed : v,
    );
    onUpdateVisitorOptions(nextList);
    if (pa.visitBy === editingVisitor.original) {
      updatePostOp({ visitBy: trimmed });
    }
    setEditingVisitor(null);
  };

  const handleRemoveVisitorOption = (name: string) => {
    onUpdateVisitorOptions(visitorOptions.filter((v) => v !== name));
    if (pa.visitBy === name) {
      updatePostOp({ visitBy: '' });
    }
    if (editingVisitor?.original === name) {
      setEditingVisitor(null);
    }
  };

  const handleClearAllVisitors = () => {
    onUpdateVisitorOptions([]);
    if (visitorOptions.includes(pa.visitBy ?? '')) {
      updatePostOp({ visitBy: '' });
    }
    setEditingVisitor(null);
  };

  const handleResetVisitorOptions = () => {
    onUpdateVisitorOptions([...DEFAULT_SUMMARIZER_LIST]);
    setEditingVisitor(null);
  };

  const fd = value.formData;
  const h = fd.history;
  const p = fd.physicalExam;
  const inv = fd.investigation;
  const lab = fd.laboratory;
  const pm = fd.premedication;
  const ap = fd.anestheticPlan;
  const pa = fd.postAnesthesia;

  const updateTop = <K extends keyof PreAnestheticEvaluation>(
    key: K,
    val: PreAnestheticEvaluation[K],
  ) => {
    onChange({ ...value, [key]: val });
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

  const labSectionRef = useRef<HTMLDivElement>(null);

  const handleLabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.nativeEvent.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    const key = e.key;
    if (
      key !== 'ArrowRight' &&
      key !== 'ArrowLeft' &&
      key !== 'ArrowDown' &&
      key !== 'ArrowUp' &&
      key !== 'Enter'
    ) {
      return;
    }

    const target = e.target;
    if (!(target instanceof HTMLInputElement) || target.type !== 'text') return;

    const container = labSectionRef.current;
    if (!container) return;

    const valLen = target.value.length;
    const selStart = target.selectionStart ?? valLen;
    const selEnd = target.selectionEnd ?? valLen;
    const isAllSelected = valLen > 0 && selStart === 0 && selEnd === valLen;

    // Allow caret movement inside non-empty text unless at boundary or all text is selected
    if (key === 'ArrowLeft' && !isAllSelected && selStart > 0) return;
    if (key === 'ArrowRight' && !isAllSelected && selEnd < valLen) return;

    const rawInputs = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    ).filter((el) => !el.disabled && el.offsetParent !== null);

    if (rawInputs.length <= 1) return;

    const measured = rawInputs.map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        el,
        cx: (rect.left + rect.right) / 2,
        cy: (rect.top + rect.bottom) / 2,
        left: rect.left,
        height: rect.height,
      };
    });

    // Cluster inputs into visual rows by center-Y, sorted left-to-right within each row
    const byY = [...measured].sort((a, b) => a.cy - b.cy || a.left - b.left);
    const rows: (typeof measured)[] = [];
    for (const item of byY) {
      const lastRow = rows[rows.length - 1];
      if (!lastRow) {
        rows.push([item]);
        continue;
      }
      const rowAvgY = lastRow.reduce((sum, it) => sum + it.cy, 0) / lastRow.length;
      const rowThreshold = Math.max(16, item.height * 0.65);
      if (Math.abs(item.cy - rowAvgY) <= rowThreshold) {
        lastRow.push(item);
      } else {
        rows.push([item]);
      }
    }
    rows.forEach((row) => row.sort((a, b) => a.left - b.left));

    const flatVisual = rows.flat();
    const flatIdx = flatVisual.findIndex((item) => item.el === target);
    if (flatIdx === -1) return;

    let rowIdx = -1;
    for (let r = 0; r < rows.length; r += 1) {
      if (rows[r].some((item) => item.el === target)) {
        rowIdx = r;
        break;
      }
    }
    if (rowIdx === -1) return;

    const currentItem = flatVisual[flatIdx];
    let nextEl: HTMLInputElement | null = null;

    if (key === 'ArrowRight' || (key === 'Enter' && !e.shiftKey)) {
      if (flatIdx + 1 < flatVisual.length) {
        nextEl = flatVisual[flatIdx + 1].el;
      }
    } else if (key === 'ArrowLeft' || (key === 'Enter' && e.shiftKey)) {
      if (flatIdx - 1 >= 0) {
        nextEl = flatVisual[flatIdx - 1].el;
      }
    } else if (key === 'ArrowDown') {
      if (rowIdx + 1 < rows.length) {
        const targetRow = rows[rowIdx + 1];
        nextEl = targetRow.reduce((best, cand) =>
          Math.abs(cand.cx - currentItem.cx) < Math.abs(best.cx - currentItem.cx) ? cand : best,
        ).el;
      }
    } else if (key === 'ArrowUp') {
      if (rowIdx - 1 >= 0) {
        const targetRow = rows[rowIdx - 1];
        nextEl = targetRow.reduce((best, cand) =>
          Math.abs(cand.cx - currentItem.cx) < Math.abs(best.cx - currentItem.cx) ? cand : best,
        ).el;
      }
    }

    if (nextEl) {
      e.preventDefault();
      nextEl.focus();
      nextEl.select();
    }
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

  const updateBloodPrepUnit = (field: 'prepPrc' | 'prepFfp' | 'prepPlt', val: string) => {
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

  const updatePostOp = (patch: Partial<EvaluationFormData['postAnesthesia']>) => {
    const nextPa = { ...pa, ...patch };
    onChange({
      ...value,
      hasComplication: nextPa.complicationStatus === 'yes',
      formData: { ...fd, postAnesthesia: nextPa },
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
    'bg-white border border-slate-300 rounded px-2 py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800 transition-colors';

  const radioBtn = (active: boolean, tone: 'default' | 'danger' = 'default') =>
    `inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
      active
        ? tone === 'danger'
          ? 'bg-red-50 border-red-600 text-red-800'
          : 'bg-blue-50 border-blue-800 text-blue-900'
        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
    }`;

  return (
    <div className="no-print bg-white border border-slate-300 rounded-xl overflow-hidden">
      {/* Hospital Header */}
      <div className="px-5 py-3 border-b border-slate-300 bg-slate-50/70 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BphLogo className="w-10 h-10 shrink-0" />
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Bangplee Hospital
            </h1>
            <p className="text-sm font-semibold text-slate-700 leading-tight">
              Pre Anesthetic Evaluation form
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500 font-mono hidden sm:block">
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
              onChange={(e) => updateTop('patientName', e.target.value)}
              placeholder="ชื่อ-นามสกุล ผู้ป่วย"
              className={inputBase}
              required
            />
          </label>
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
          <label className="lg:col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">AN</span>
            <input
              type="text"
              value={value.an}
              onChange={(e) => updateTop('an', e.target.value)}
              placeholder="เช่น 67-008912"
              className={`${inputBase} font-mono tabular-nums`}
            />
          </label>
          <div className="lg:col-span-2 flex flex-col gap-1">
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
          <label className="lg:col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Date of visit</span>
            <input
              type="date"
              value={value.dateOfVisit}
              onChange={(e) => updateTop('dateOfVisit', e.target.value)}
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
          <label className="lg:col-span-6 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Diagnosis</span>
            <input
              type="text"
              value={value.diagnosis}
              onChange={(e) => updateTop('diagnosis', e.target.value)}
              placeholder="การวินิจฉัยโรค"
              className={inputBase}
            />
          </label>
          <label className="lg:col-span-6 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Operation</span>
            <input
              type="text"
              value={value.operation}
              onChange={(e) => updateTop('operation', e.target.value)}
              placeholder="หัตถการ / การผ่าตัดที่วางแผน"
              className={inputBase}
            />
          </label>
        </div>

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
            <input
              type="date"
              aria-label="Date of operation (วันที่ทำผ่าตัด)"
              value={value.dateOfOperation}
              onChange={(e) => updateTop('dateOfOperation', e.target.value)}
              className={`${inputBase} font-mono tabular-nums`}
            />
            {value.dateOfOperation && (
              <span className="text-[11px] text-blue-900 truncate">
                {formatThaiScheduleDate(value.dateOfOperation).label}
              </span>
            )}
          </div>
          <label className="lg:col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">เวลาทำผ่าตัด (Time)</span>
            <input
              type="time"
              value={value.operationTime ?? ''}
              onChange={(e) => updateTop('operationTime', e.target.value)}
              className={`${inputBase} font-mono tabular-nums`}
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
      </div>

      {/* Main 2-Column Clinical Grid (Mirroring Paper Form Left & Right Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-slate-300">
        {/* LEFT COLUMN: 1. History, 3. Investigation, 5. Premedication */}
        <div className="lg:border-r border-slate-300 divide-y divide-slate-300">
          {/* 1. History */}
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
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
              </div>

              <div className="space-y-3 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 cursor-pointer min-w-[105px]">
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
                        className={`${inputBase} w-16 text-center font-mono tabular-nums text-xs`}
                      />
                      <span className="text-xs text-slate-500">ปี</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 cursor-pointer min-w-[105px]">
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
                        className={`${inputBase} w-16 text-center font-mono tabular-nums text-xs`}
                      />
                      <span className="text-xs text-slate-500">ปี</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 cursor-pointer min-w-[105px]">
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
                        className={`${inputBase} w-16 text-center font-mono tabular-nums text-xs`}
                      />
                      <span className="text-xs text-slate-500">ปี</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 cursor-pointer min-w-[105px]">
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
                        className={`${inputBase} w-16 text-center font-mono tabular-nums text-xs`}
                      />
                      <span className="text-xs text-slate-500">ปี</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 cursor-pointer min-w-[105px]">
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
                        className={`${inputBase} w-16 text-center font-mono tabular-nums text-xs`}
                      />
                      <span className="text-xs text-slate-500">ปี</span>
                    </div>
                  </div>

                  {/* Additional underlying rows */}
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
                          placeholder="เช่น Asthma, COPD, Stroke, Thyroid"
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
                        เพิ่มโรคประจำตัวอื่นๆ
                      </button>
                    )}
                  </div>
                </div>

                {/* Full-width Grouped Medication Selector */}
                <div className="pt-2 border-t border-slate-200">
                  <MedicationGroupSelector
                    groups={medicationGroups}
                    medicationText={h.medication}
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
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
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

            <label className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 w-24 shrink-0">
                3.3 Other (ex. CT)
              </span>
              <input
                type="text"
                value={inv.other}
                onChange={(e) => updateInvestigation({ other: e.target.value })}
                placeholder="Echo, PFT, CT หรือผลตรวจเพิ่มเติม..."
                className={`${inputBase} flex-1 text-xs`}
              />
            </label>
          </div>

          {/* 5. Premedication */}
          <div className="p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-1">
              <h2 className="text-sm font-bold text-slate-900">5. Premedication</h2>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <label className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 shrink-0">NPO time</span>
                <input
                  type="text"
                  value={pm.npoTime}
                  onChange={(e) => updatePremed({ npoTime: e.target.value })}
                  placeholder="เช่น หลัง 24.00 น."
                  className={`${inputBase} flex-1 text-xs`}
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 shrink-0">on IVF</span>
                <input
                  type="text"
                  value={pm.onIvf}
                  onChange={(e) => updatePremed({ onIvf: e.target.value })}
                  placeholder="เช่น 0.9% NSS 80 ml/hr"
                  className={`${inputBase} flex-1 text-xs`}
                />
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 2. Physical examination, 4. Laboratory Evaluation, 6. Consult Med/Cardio */}
        <div className="divide-y divide-slate-300">
          {/* 2. Physical examination */}
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
              2. Physical examination
            </h2>

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

              <label className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 w-36 shrink-0">
                  2.6 Functional Capacity
                </span>
                <input
                  type="text"
                  value={p.functionalCapacity}
                  onChange={(e) => updatePhysical({ functionalCapacity: e.target.value })}
                  className={`${inputBase} flex-1 text-xs`}
                />
              </label>
            </div>
          </div>

          {/* 4. Laboratory Evaluation */}
          <div
            ref={labSectionRef}
            onKeyDown={handleLabKeyDown}
            className="p-4 space-y-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-1">
              <h2 className="text-sm font-bold text-slate-900">
                4. Laboratory Evaluation
              </h2>
              <span className="text-[11px] text-slate-500">
                ใช้ลูกศร ↑ ↓ ← → หรือ Enter เลื่อนช่องกรอกได้
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/60 border border-slate-200 rounded-lg p-3">
              <CbcFishbone lab={lab} onChange={updateLab} />
              <ChemFishbone lab={lab} onChange={updateLab} />
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

            {/* Glucose, HbA1C, Other */}
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
              <label className="col-span-2 flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">Other Lab</span>
                <input
                  type="text"
                  value={lab.other}
                  onChange={(e) => updateLab('other', e.target.value)}
                  placeholder="Anti-HIV, HBsAg, UA, etc."
                  className={`${inputBase} text-xs`}
                />
              </label>
            </div>

            {/* Blood component prepare */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
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
          <div className="p-4 space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
              6. Consult Med/Cardio
            </h2>
            <textarea
              rows={3}
              value={fd.consult}
              onChange={(e) => updateFormData({ consult: e.target.value })}
              placeholder="ความเห็นจากแพทย์อายุรกรรม / โรคหัวใจ (Med/Cardio clearance)..."
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">8. Problem list</span>
            {fd.problemList.length < 12 && (
              <button
                type="button"
                onClick={() => updateFormData({ problemList: [...fd.problemList, ''] })}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-800 hover:text-blue-900"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่ม Problem
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {fd.problemList.map((prob, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="font-mono text-xs text-slate-500 w-5">{idx + 1}.</span>
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
      </div>

      {/* Post Anesthesia Evaluation */}
      <div className="p-4 bg-slate-50/70 space-y-3">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="px-3 py-1 border border-slate-400 bg-white rounded text-sm font-bold text-slate-900">
              Post Anesthesia Evaluation
            </div>
            <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-600 font-medium">Summarized by</span>
                {(() => {
                  const currentSummarizer = pa.summarizedBy ?? '';
                  const isListedSummarizer = summarizerOptions.includes(currentSummarizer);
                  return (
                    <>
                      <select
                        aria-label="เลือกผู้สรุป (Summarized by)"
                        value={isListedSummarizer ? currentSummarizer : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            updatePostOp({ summarizedBy: e.target.value });
                          } else if (isListedSummarizer) {
                            updatePostOp({ summarizedBy: '' });
                          }
                        }}
                        className={`${inputBase} w-48 text-xs`}
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
                        onChange={(e) => updatePostOp({ summarizedBy: e.target.value })}
                        placeholder="หรือพิมพ์ชื่อเพิ่มเติม..."
                        maxLength={120}
                        className={`${inputBase} w-44 text-xs`}
                      />
                      {currentSummarizer.trim() && (
                        <button
                          type="button"
                          onClick={() => updatePostOp({ summarizedBy: '' })}
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
                <span className="text-slate-600 font-medium">date</span>
                <input
                  type="date"
                  value={pa.summarizedDate}
                  onChange={(e) => updatePostOp({ summarizedDate: e.target.value })}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
            </div>
          </div>

          {isManagingSummarizers && (
            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  จัดการรายชื่อผู้สรุป Summarized by (เพิ่ม แก้ไข หรือลบรายชื่อได้ · {summarizerOptions.length} รายชื่อ)
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
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-800"
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-600">BP (mm Hg)</span>
            <input
              type="text"
              value={pa.bp}
              onChange={(e) => updatePostOp({ bp: e.target.value })}
              className={`${inputBase} font-mono tabular-nums text-xs`}
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-600">P (bpm)</span>
            <input
              type="text"
              value={pa.pulse}
              onChange={(e) => updatePostOp({ pulse: e.target.value })}
              className={`${inputBase} font-mono tabular-nums text-xs`}
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-600">RR (bpm)</span>
            <input
              type="text"
              value={pa.rr}
              onChange={(e) => updatePostOp({ rr: e.target.value })}
              className={`${inputBase} font-mono tabular-nums text-xs`}
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-600">T (°C)</span>
            <input
              type="text"
              value={pa.temp}
              onChange={(e) => updatePostOp({ temp: e.target.value })}
              className={`${inputBase} font-mono tabular-nums text-xs`}
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-600">SpO2 (%)</span>
            <input
              type="text"
              value={pa.spo2}
              onChange={(e) => updatePostOp({ spo2: e.target.value })}
              className={`${inputBase} font-mono tabular-nums text-xs`}
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-600">PS (คะแนน)</span>
            <input
              type="text"
              value={pa.painScore}
              onChange={(e) => updatePostOp({ painScore: e.target.value })}
              className={`${inputBase} font-mono tabular-nums text-xs`}
            />
          </label>
        </div>

        <div className="space-y-2.5 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              <span className="text-xs font-semibold text-slate-700">
                Post anesthesia complication
              </span>
              <button
                type="button"
                onClick={() =>
                  updatePostOp({
                    complicationStatus: toggleTri(pa.complicationStatus, 'no'),
                  })
                }
                className={radioBtn(pa.complicationStatus === 'no')}
              >
                {pa.complicationStatus === 'no' ? '●' : '○'} No
              </button>
              <button
                type="button"
                onClick={() =>
                  updatePostOp({
                    complicationStatus: toggleTri(pa.complicationStatus, 'yes'),
                  })
                }
                className={radioBtn(pa.complicationStatus === 'yes', 'danger')}
              >
                {pa.complicationStatus === 'yes' ? '●' : '○'} Yes
              </button>
              {pa.complicationStatus === 'yes' && (
                <input
                  type="text"
                  value={pa.complicationDetail}
                  onChange={(e) => updatePostOp({ complicationDetail: e.target.value })}
                  placeholder="ระบุภาวะแทรกซ้อนและการดูแลแก้ไข"
                  className={`${inputBase} flex-1 min-w-[200px] text-xs border-red-300`}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-600 font-medium">visit by</span>
                {(() => {
                  const currentVisitor = pa.visitBy ?? '';
                  const isListedVisitor = visitorOptions.includes(currentVisitor);
                  return (
                    <>
                      <select
                        aria-label="เลือกผู้เยี่ยม (visit by)"
                        value={isListedVisitor ? currentVisitor : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            updatePostOp({ visitBy: e.target.value });
                          } else if (isListedVisitor) {
                            updatePostOp({ visitBy: '' });
                          }
                        }}
                        className={`${inputBase} w-48 text-xs`}
                      >
                        <option value="">-- เลือกรายชื่อผู้เยี่ยม --</option>
                        {visitorOptions.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        aria-label="พิมพ์ชื่อผู้เยี่ยมเพิ่มเติม"
                        value={currentVisitor}
                        onChange={(e) => updatePostOp({ visitBy: e.target.value })}
                        placeholder="หรือพิมพ์ชื่อเพิ่มเติม..."
                        maxLength={120}
                        className={`${inputBase} w-44 text-xs`}
                      />
                      {currentVisitor.trim() && (
                        <button
                          type="button"
                          onClick={() => updatePostOp({ visitBy: '' })}
                          title="ล้างชื่อผู้เยี่ยมในช่องนี้"
                          aria-label="ล้างชื่อผู้เยี่ยมในช่องนี้"
                          className="p-1 text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {currentVisitor.trim() && !isListedVisitor && (
                        <button
                          type="button"
                          onClick={() => handleAddVisitorOption(currentVisitor)}
                          title="เพิ่มชื่อนี้เข้าตัวเลือก visit by"
                          className="px-2 py-1 text-[11px] font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 whitespace-nowrap"
                        >
                          + บันทึก
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsManagingVisitors((prev) => !prev)}
                        className="inline-flex items-center gap-0.5 text-[11px] font-medium text-blue-800 hover:text-blue-950 whitespace-nowrap ml-1"
                      >
                        <Plus className="w-3 h-3" />
                        {isManagingVisitors ? 'ปิด' : 'เพิ่ม/ลดรายชื่อ'}
                      </button>
                    </>
                  );
                })()}
              </div>
              <label className="inline-flex items-center gap-1.5 text-xs">
                <span className="text-slate-600 font-medium">date</span>
                <input
                  type="date"
                  value={pa.visitDate}
                  onChange={(e) => updatePostOp({ visitDate: e.target.value })}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
            </div>
          </div>

          {isManagingVisitors && (
            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  จัดการรายชื่อผู้เยี่ยม visit by (เพิ่ม แก้ไข หรือลบรายชื่อได้ · {visitorOptions.length} รายชื่อ)
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {visitorOptions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllVisitors}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-700 bg-white border border-red-200 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      ล้างทั้งหมด
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetVisitorOptions}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
                  >
                    <RotateCcw className="w-3 h-3" />
                    รีเซ็ตค่าเริ่มต้น
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsManagingVisitors(false)}
                    className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900"
                  >
                    ปิด
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newVisitorName}
                  onChange={(e) => setNewVisitorName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddVisitorOption(newVisitorName);
                    }
                  }}
                  placeholder="พิมพ์ชื่อผู้เยี่ยมใหม่ เช่น พว.สมหญิง ใจดี"
                  maxLength={120}
                  className="flex-1 min-w-[220px] bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
                />
                <button
                  type="button"
                  onClick={() => handleAddVisitorOption(newVisitorName)}
                  disabled={!newVisitorName.trim() || newVisitorName.trim() === 'อื่นๆ'}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-800 rounded-md hover:bg-blue-900 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มรายชื่อ
                </button>
              </div>

              {visitorOptions.length === 0 ? (
                <p className="text-xs text-slate-500 py-1">
                  ยังไม่มีรายชื่อผู้เยี่ยมในตัวเลือก (สามารถพิมพ์เพิ่มด้านบน หรือกดรีเซ็ตค่าเริ่มต้น)
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                  {visitorOptions.map((v) => {
                    const isEditing = editingVisitor?.original === v;
                    return isEditing ? (
                      <span
                        key={v}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-white border border-blue-800 rounded-md"
                      >
                        <input
                          type="text"
                          value={editingVisitor.text}
                          onChange={(e) =>
                            setEditingVisitor({ original: v, text: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditedVisitor();
                            } else if (e.key === 'Escape') {
                              setEditingVisitor(null);
                            }
                          }}
                          maxLength={120}
                          autoFocus
                          className="w-44 text-xs text-slate-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSaveEditedVisitor}
                          aria-label="บันทึกชื่อที่แก้ไข"
                          className="p-0.5 text-emerald-700 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingVisitor(null)}
                          aria-label="ยกเลิกการแก้ไข"
                          className="p-0.5 text-slate-400 hover:text-slate-700 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ) : (
                      <span
                        key={v}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-800"
                      >
                        <span>{v}</span>
                        <button
                          type="button"
                          onClick={() => setEditingVisitor({ original: v, text: v })}
                          aria-label={`แก้ไข ${v}`}
                          title="แก้ไขชื่อ"
                          className="p-0.5 text-slate-400 hover:text-blue-800 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveVisitorOption(v)}
                          aria-label={`ลบ ${v}`}
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

        <div className="text-right text-[11px] text-slate-500 pt-1">
          ANE-FM-002-03 อนุมัติใช้วันที่ 21 มิถุนายน 2564
        </div>
      </div>
    </div>
  );
}
