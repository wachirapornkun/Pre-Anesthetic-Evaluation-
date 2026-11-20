import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Edit2,
  Link2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  AdministrationErrorKey,
  createEmptyPostOpComplication,
  DEFAULT_SUMMARIZER_LIST,
  EvaluationFormData,
  getPostOpVisitCompleteness,
  inferPatientGender,
  PatientGender,
  POST_OP_ADMIN_ERROR_OPTIONS,
  POST_OP_INCIDENT_OPTIONS,
  POST_OP_LEFT_COMPLICATIONS,
  POST_OP_OUTCOME_OPTIONS,
  POST_OP_RIGHT_COMPLICATIONS,
  POST_OP_SEVERITY_LEVELS,
  PostOpComplicationData,
  PostOpComplicationKey,
  PostOpIncidentType,
  PostOpOutcomeKey,
  PostOpSeverityLevel,
  PreAnestheticEvaluation,
  summarizePostOpComplications,
  TriStatus,
} from '../types/evaluation';
import { BphLogo } from './MedicalDiagrams';

interface PostOpEvaluationFormProps {
  value: PreAnestheticEvaluation;
  onChange: (next: PreAnestheticEvaluation) => void;
  records?: PreAnestheticEvaluation[];
  onSelectPatient?: (record: PreAnestheticEvaluation) => void;
  wardOptions?: string[];
  summarizerOptions: string[];
  onUpdateSummarizerOptions: (nextSummarizers: string[]) => void;
  visitorOptions: string[];
  onUpdateVisitorOptions: (nextVisitors: string[]) => void;
  onGoToPreOp?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export function PostOpEvaluationForm({
  value,
  onChange,
  records = [],
  onSelectPatient,
  wardOptions = [],
  summarizerOptions,
  onUpdateSummarizerOptions,
  visitorOptions,
  onUpdateVisitorOptions,
  onGoToPreOp,
  onSave,
  isSaving = false,
}: PostOpEvaluationFormProps) {
  const [isEditingPatientInfo, setIsEditingPatientInfo] = useState(true);
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

  const fd = value.formData;
  const pa = fd.postAnesthesia;
  const pc: PostOpComplicationData = fd.postOpComplication ?? createEmptyPostOpComplication();

  const recorderSuggestions = useMemo(() => {
    const merged = [...visitorOptions, ...summarizerOptions];
    return Array.from(new Set(merged.filter(Boolean)));
  }, [visitorOptions, summarizerOptions]);

  const computeHasComplication = (
    nextPa: EvaluationFormData['postAnesthesia'],
    nextPc: PostOpComplicationData,
  ) =>
    nextPa.complicationStatus === 'yes' ||
    nextPc.periOpComplications.length > 0 ||
    nextPc.postOpComplications.length > 0;

  const updatePostOpComp = (patch: Partial<PostOpComplicationData>) => {
    const nextPc: PostOpComplicationData = { ...pc, ...patch };
    onChange({
      ...value,
      hasComplication: computeHasComplication(pa, nextPc),
      formData: {
        ...fd,
        postOpComplication: nextPc,
      },
    });
  };

  const updatePostAnesthesia = (patch: Partial<EvaluationFormData['postAnesthesia']>) => {
    const nextPa = { ...pa, ...patch };
    onChange({
      ...value,
      hasComplication: computeHasComplication(nextPa, pc),
      formData: {
        ...fd,
        postAnesthesia: nextPa,
      },
    });
  };

  const toggleComplication = (phase: 'peri' | 'post', key: PostOpComplicationKey) => {
    const field = phase === 'peri' ? 'periOpComplications' : 'postOpComplications';
    const current = pc[field];
    const exists = current.includes(key);
    const nextList = exists ? current.filter((k) => k !== key) : [...current, key];
    updatePostOpComp({
      [field]: nextList,
      ...(exists ? {} : { noneProblem: false }),
    });
  };

  const toggleNoneProblem = () => {
    if (!pc.noneProblem) {
      updatePostOpComp({
        noneProblem: true,
        periOpComplications: [],
        postOpComplications: [],
      });
    } else {
      updatePostOpComp({ noneProblem: false });
    }
  };

  const toggleOutcome = (key: PostOpOutcomeKey) => {
    const exists = pc.outcomes.includes(key);
    const next = exists ? pc.outcomes.filter((k) => k !== key) : [...pc.outcomes, key];
    updatePostOpComp({ outcomes: next });
  };

  const toggleIncident = (key: PostOpIncidentType) => {
    const exists = pc.incidentTypes.includes(key);
    const next = exists ? pc.incidentTypes.filter((k) => k !== key) : [...pc.incidentTypes, key];
    updatePostOpComp({ incidentTypes: next });
  };

  const toggleSeverity = (level: Exclude<PostOpSeverityLevel, ''>) => {
    updatePostOpComp({ severityLevel: pc.severityLevel === level ? '' : level });
  };

  const toggleAdminError = (key: AdministrationErrorKey) => {
    const exists = pc.administrationErrors.includes(key);
    const next = exists
      ? pc.administrationErrors.filter((k) => k !== key)
      : [...pc.administrationErrors, key];
    updatePostOpComp({ administrationErrors: next });
  };

  const toggleTri = (current: TriStatus, target: 'no' | 'yes'): TriStatus =>
    current === target ? 'none' : target;

  const handleAddSummarizerOption = (rawName: string) => {
    const trimmed = rawName.trim().slice(0, 120);
    if (!trimmed || trimmed === 'อื่นๆ') return;
    if (!summarizerOptions.includes(trimmed)) {
      onUpdateSummarizerOptions([...summarizerOptions, trimmed]);
    }
    updatePostAnesthesia({ summarizedBy: trimmed });
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
      updatePostAnesthesia({ summarizedBy: trimmed });
    }
    setEditingSummarizer(null);
  };

  const handleRemoveSummarizerOption = (name: string) => {
    onUpdateSummarizerOptions(summarizerOptions.filter((s) => s !== name));
    if (pa.summarizedBy === name) {
      updatePostAnesthesia({ summarizedBy: '' });
    }
    if (editingSummarizer?.original === name) {
      setEditingSummarizer(null);
    }
  };

  const handleClearAllSummarizers = () => {
    onUpdateSummarizerOptions([]);
    if (summarizerOptions.includes(pa.summarizedBy ?? '')) {
      updatePostAnesthesia({ summarizedBy: '' });
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
    updatePostAnesthesia({ visitBy: trimmed });
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
      updatePostAnesthesia({ visitBy: trimmed });
    }
    setEditingVisitor(null);
  };

  const handleRemoveVisitorOption = (name: string) => {
    onUpdateVisitorOptions(visitorOptions.filter((v) => v !== name));
    if (pa.visitBy === name) {
      updatePostAnesthesia({ visitBy: '' });
    }
    if (editingVisitor?.original === name) {
      setEditingVisitor(null);
    }
  };

  const handleClearAllVisitors = () => {
    onUpdateVisitorOptions([]);
    if (visitorOptions.includes(pa.visitBy ?? '')) {
      updatePostAnesthesia({ visitBy: '' });
    }
    setEditingVisitor(null);
  };

  const handleResetVisitorOptions = () => {
    onUpdateVisitorOptions([...DEFAULT_SUMMARIZER_LIST]);
    setEditingVisitor(null);
  };

  const inputBase =
    'bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800';

  const radioBtn = (active: boolean, variant: 'default' | 'danger' = 'default') =>
    `inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
      active
        ? variant === 'danger'
          ? 'bg-red-700 text-white border-red-700'
          : 'bg-blue-800 text-white border-blue-800'
        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
    }`;

  const postOpCheck = getPostOpVisitCompleteness(pa);
  const missingHighlight = (filled: boolean) =>
    postOpCheck.hasAnyInput && !filled ? 'border-amber-400 bg-amber-50/40' : '';

  const complicationSummaryText = summarizePostOpComplications(pc);
  const periCount = pc.periOpComplications.length;
  const postCount = pc.postOpComplications.length;

  const renderComplicationRow = (
    item: (typeof POST_OP_LEFT_COMPLICATIONS)[number] | (typeof POST_OP_RIGHT_COMPLICATIONS)[number],
  ) => {
    const periChecked = pc.periOpComplications.includes(item.key);
    const postChecked = pc.postOpComplications.includes(item.key);
    const rowHighlighted = periChecked || postChecked;

    return (
      <tr
        key={item.key}
        className={`border-b border-slate-200 transition-colors ${
          rowHighlighted ? 'bg-red-50/50' : 'hover:bg-slate-50/80'
        }`}
      >
        <td className="px-2.5 py-1.5 text-xs text-slate-900 align-middle leading-snug">
          {'detailField' in item && item.detailField === 'difficultIntubationGrade' ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span>Difficult intubation LV gr</span>
              <input
                type="text"
                value={pc.difficultIntubationGrade}
                onChange={(e) =>
                  updatePostOpComp({ difficultIntubationGrade: e.target.value })
                }
                maxLength={30}
                placeholder="เช่น III, IV"
                aria-label="Difficult intubation LV grade"
                className="w-24 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-800"
              />
            </div>
          ) : 'detailField' in item && item.detailField === 'painScoreDetail' ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span>Pain score &gt;4 / PS=</span>
              <input
                type="text"
                value={pc.painScoreDetail}
                onChange={(e) => updatePostOpComp({ painScoreDetail: e.target.value })}
                maxLength={30}
                placeholder="0-10"
                aria-label="Pain score value"
                className="w-16 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-800"
              />
            </div>
          ) : 'detailField' in item && item.detailField === 'otherComplicationDetail' ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="shrink-0">อื่นๆ</span>
              <input
                type="text"
                value={pc.otherComplicationDetail ?? ''}
                onChange={(e) =>
                  updatePostOpComp({
                    otherComplicationDetail: e.target.value,
                    ...(e.target.value.trim() ? { noneProblem: false } : {}),
                  })
                }
                maxLength={200}
                placeholder="ระบุภาวะแทรกซ้อนอื่นๆ..."
                aria-label="ภาวะแทรกซ้อนอื่นๆ"
                className="flex-1 min-w-[140px] bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
              />
            </div>
          ) : (
            <span>{item.label}</span>
          )}
        </td>
        <td className="w-[70px] border-l border-slate-200 p-0 text-center align-middle">
          <button
            type="button"
            onClick={() => toggleComplication('peri', item.key)}
            aria-label={`${item.label} - Peri op`}
            aria-pressed={periChecked}
            className={`w-full h-full min-h-[34px] flex items-center justify-center transition-colors ${
              periChecked ? 'bg-amber-100/80 text-amber-900' : 'hover:bg-slate-100/80 text-slate-400'
            }`}
          >
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center ${
                periChecked
                  ? 'bg-amber-700 border-amber-700 text-white'
                  : 'bg-white border-slate-300'
              }`}
            >
              {periChecked && <Check className="w-3 h-3 stroke-[3]" />}
            </span>
          </button>
        </td>
        <td className="w-[70px] border-l border-slate-200 p-0 text-center align-middle">
          <button
            type="button"
            onClick={() => toggleComplication('post', item.key)}
            aria-label={`${item.label} - Post op`}
            aria-pressed={postChecked}
            className={`w-full h-full min-h-[34px] flex items-center justify-center transition-colors ${
              postChecked ? 'bg-red-100/80 text-red-900' : 'hover:bg-slate-100/80 text-slate-400'
            }`}
          >
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center ${
                postChecked
                  ? 'bg-red-700 border-red-700 text-white'
                  : 'bg-white border-slate-300'
              }`}
            >
              {postChecked && <Check className="w-3 h-3 stroke-[3]" />}
            </span>
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header matching Bangplee Hospital ANE-FM-006-01 */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <BphLogo className="w-11 h-11 shrink-0" />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                รายงาน Complication งานวิสัญญี โรงพยาบาลบางพลี
              </h1>
              <p className="text-xs text-slate-600">
                Post-op Evaluation &amp; Post Anesthesia Evaluation · เอกสารหมายเลข ANE-FM-006-01
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="text-slate-600 font-mono tabular-nums">
              Peri op: <strong className="text-slate-900">{periCount}</strong>
              <span className="mx-1.5 text-slate-300">·</span>
              Post op: <strong className="text-slate-900">{postCount}</strong>
            </div>
            {onGoToPreOp && (
              <button
                type="button"
                onClick={onGoToPreOp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-blue-800" />
                กลับหน้า Pre-op Evaluation
              </button>
            )}
          </div>
        </div>

        {/* Linked & Editable Patient Information (Same record as Pre-op Evaluation) */}
        <div className="pt-3 border-t border-slate-200 space-y-2.5">
          {/* Pre-op Patient Linker Bar */}
          {records.length > 0 && onSelectPatient && (
            <div className="no-print flex flex-wrap items-center gap-2 bg-blue-50/70 border border-blue-200/80 rounded-lg px-3 py-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-blue-950 whitespace-nowrap shrink-0">
                <Link2 className="w-3.5 h-3.5 text-blue-800" />
                เชื่อมข้อมูลผู้ป่วยจาก Pre-op:
              </span>
              <select
                aria-label="เลือกผู้ป่วยจากหน้า Pre-op เพื่อเชื่อมข้อมูล"
                value={records.some((r) => r.id === value.id) ? value.id : ''}
                onChange={(e) => {
                  const found = records.find((r) => r.id === e.target.value);
                  if (found) onSelectPatient(found);
                }}
                className="flex-1 min-w-[220px] max-w-xl bg-white border border-blue-300 rounded-md px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
              >
                <option value="">
                  {value.patientName.trim()
                    ? `ผู้ป่วยปัจจุบัน (ยังไม่บันทึก): ${value.patientName} ${value.hn ? `· HN ${value.hn}` : ''}`
                    : '-- เลือกผู้ป่วยจาก Pre-op เพื่อดึง ชื่อ · อายุ · HN · Operation --'}
                </option>
                {records.map((rec) => (
                  <option key={rec.id} value={rec.id}>
                    {rec.patientName || 'ไม่ระบุชื่อ'}
                    {rec.age ? ` (${rec.age} ปี)` : ''}
                    {rec.hn ? ` · HN ${rec.hn}` : ''}
                    {rec.operation ? ` · ${rec.operation}` : ''}
                    {rec.dateOfOperation ? ` [${rec.dateOfOperation}]` : ''}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-blue-900/80">
                ชื่อ · อายุ · เพศ · HN · Operation เชื่อมต่ออัตโนมัติกับ Pre-op
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700">
              <span>
                ผู้ป่วย:{' '}
                <strong className="text-slate-900 font-semibold">
                  {value.patientName.trim() || 'ยังไม่ระบุชื่อผู้ป่วย'}
                </strong>
              </span>
              {(() => {
                const g = inferPatientGender(value.patientName, value.gender);
                return g ? (
                  <span>
                    เพศ:{' '}
                    <strong className="text-slate-900">
                      {g === 'male' ? 'ชาย' : 'หญิง'}
                    </strong>
                  </span>
                ) : null;
              })()}
              <span>
                อายุ:{' '}
                <strong className="text-slate-900 font-mono tabular-nums">
                  {value.age || '—'}
                </strong>{' '}
                ปี
              </span>
              <span className="font-mono tabular-nums">
                HN: <strong className="text-slate-900">{value.hn || '—'}</strong>
              </span>
              <span className="font-mono tabular-nums">
                AN: <strong className="text-slate-900">{value.an || '—'}</strong>
              </span>
              <span>
                Operation: <strong className="text-slate-900">{value.operation || '—'}</strong>
              </span>
              {value.asaClass && (
                <span className="font-mono tabular-nums">
                  ASA:{' '}
                  <strong className="text-slate-900">
                    {value.asaClass}
                    {value.asaEmergency ? 'E' : ''}
                  </strong>
                </span>
              )}
            </div>

            <div className="no-print flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditingPatientInfo((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                  isEditingPatientInfo
                    ? 'bg-blue-50 text-blue-900 border-blue-300'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-800" />
                {isEditingPatientInfo ? 'ซ่อนช่องแก้ไขข้อมูล' : 'แก้ไขข้อมูล'}
              </button>
              {onSave && (
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-800 hover:bg-blue-900 disabled:opacity-60 rounded-md transition-colors whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              )}
            </div>
          </div>

          {isEditingPatientInfo && (
            <div className="no-print bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">
                  แก้ไขข้อมูลผู้ป่วย (เชื่อมต่อข้อมูลชุดเดียวกับ Pre-op Evaluation)
                </span>
                <span>แก้ไขแล้วกดบันทึกข้อมูลเพื่ออัปเดตทั้งหน้า Pre-op และ Post-op</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
                <label className="flex flex-col gap-1 lg:col-span-3">
                  <span className="text-[11px] font-medium text-slate-600">
                    ชื่อ-นามสกุลผู้ป่วย (Name) <span className="text-red-600">*</span>
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
                    maxLength={120}
                    placeholder="ระบุชื่อ-นามสกุลผู้ป่วย"
                    className={inputBase}
                  />
                </label>

                <label className="flex flex-col gap-1 lg:col-span-1">
                  <span className="text-[11px] font-medium text-slate-600">เพศ</span>
                  <select
                    aria-label="เพศผู้ป่วย"
                    value={inferPatientGender(value.patientName, value.gender)}
                    onChange={(e) =>
                      onChange({ ...value, gender: e.target.value as PatientGender })
                    }
                    className={inputBase}
                  >
                    <option value="">ระบุ</option>
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 lg:col-span-1">
                  <span className="text-[11px] font-medium text-slate-600">อายุ (ปี)</span>
                  <input
                    type="text"
                    value={value.age}
                    onChange={(e) => onChange({ ...value, age: e.target.value })}
                    maxLength={16}
                    placeholder="อายุ"
                    className={`${inputBase} font-mono tabular-nums`}
                  />
                </label>

                <label className="flex flex-col gap-1 lg:col-span-2">
                  <span className="text-[11px] font-medium text-slate-600">HN</span>
                  <input
                    type="text"
                    value={value.hn}
                    onChange={(e) => onChange({ ...value, hn: e.target.value })}
                    maxLength={40}
                    placeholder="HN"
                    className={`${inputBase} font-mono tabular-nums`}
                  />
                </label>

                <label className="flex flex-col gap-1 lg:col-span-1">
                  <span className="text-[11px] font-medium text-slate-600">AN</span>
                  <input
                    type="text"
                    value={value.an}
                    onChange={(e) => onChange({ ...value, an: e.target.value })}
                    maxLength={40}
                    placeholder="AN"
                    className={`${inputBase} font-mono tabular-nums`}
                  />
                </label>

                <label className="flex flex-col gap-1 lg:col-span-4">
                  <span className="text-[11px] font-medium text-slate-600">
                    การผ่าตัด (Operation)
                  </span>
                  <input
                    type="text"
                    value={value.operation}
                    onChange={(e) => onChange({ ...value, operation: e.target.value })}
                    maxLength={300}
                    placeholder="ระบุชื่อหัตถการ / Operation"
                    className={inputBase}
                  />
                </label>

                <label className="flex flex-col gap-1 lg:col-span-3">
                  <span className="text-[11px] font-medium text-slate-600">หอผู้ป่วย (Ward)</span>
                  <input
                    type="text"
                    list="post-op-ward-suggestions"
                    value={value.ward}
                    onChange={(e) => onChange({ ...value, ward: e.target.value })}
                    maxLength={80}
                    placeholder="ระบุหรือเลือกหอผู้ป่วย"
                    className={inputBase}
                  />
                  <datalist id="post-op-ward-suggestions">
                    {wardOptions.map((w) => (
                      <option key={w} value={w} />
                    ))}
                  </datalist>
                </label>

                <label className="flex flex-col gap-1 lg:col-span-3">
                  <span className="text-[11px] font-medium text-slate-600">
                    วันที่ทำผ่าตัด (Date of Op)
                  </span>
                  <input
                    type="date"
                    value={value.dateOfOperation}
                    onChange={(e) => onChange({ ...value, dateOfOperation: e.target.value })}
                    className={`${inputBase} font-mono tabular-nums`}
                  />
                </label>

                <label className="flex flex-col gap-1 lg:col-span-6">
                  <span className="text-[11px] font-medium text-slate-600">
                    การวินิจฉัย (Diagnosis)
                  </span>
                  <input
                    type="text"
                    value={value.diagnosis}
                    onChange={(e) => onChange({ ...value, diagnosis: e.target.value })}
                    maxLength={300}
                    placeholder="ระบุ Diagnosis (ถ้ามี)"
                    className={inputBase}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column Paper-Matched Complication Form (ANE-FM-006-01) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 border-b border-slate-300">
        {/* LEFT COLUMN: 34 Complication items */}
        <div className="xl:border-r border-slate-300">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-800">
                <th className="px-2.5 py-2 text-center">Complication</th>
                <th className="w-[70px] border-l border-slate-300 py-2 text-center whitespace-nowrap">
                  Peri op
                </th>
                <th className="w-[70px] border-l border-slate-300 py-2 text-center whitespace-nowrap">
                  Post op
                </th>
              </tr>
            </thead>
            <tbody>{POST_OP_LEFT_COMPLICATIONS.map((item) => renderComplicationRow(item))}</tbody>
          </table>
        </div>

        {/* RIGHT COLUMN: 11 Complication items + None problem + OUT COME + Incident + Severity + Admin Error + Remark + Recorders */}
        <div className="flex flex-col">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-800">
                <th className="px-2.5 py-2 text-center">Complication</th>
                <th className="w-[70px] border-l border-slate-300 py-2 text-center whitespace-nowrap">
                  Peri op
                </th>
                <th className="w-[70px] border-l border-slate-300 py-2 text-center whitespace-nowrap">
                  Post op
                </th>
              </tr>
            </thead>
            <tbody>{POST_OP_RIGHT_COMPLICATIONS.map((item) => renderComplicationRow(item))}</tbody>
          </table>

          {/* None problem row */}
          <div className="px-3.5 py-2.5 border-b border-slate-300 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={toggleNoneProblem}
              aria-pressed={pc.noneProblem}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-900"
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  pc.noneProblem
                    ? 'bg-emerald-700 border-emerald-700 text-white'
                    : 'bg-white border-slate-400'
                }`}
              >
                {pc.noneProblem && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
              <span>None problem</span>
            </button>
            <span className="text-[11px] text-slate-500">
              {pc.noneProblem
                ? 'ไม่พบภาวะแทรกซ้อน'
                : periCount + postCount > 0
                ? `เลือกแล้ว ${periCount + postCount} รายการ`
                : 'ติ๊กหากไม่มีภาวะแทรกซ้อน'}
            </span>
          </div>

          {/* OUT COME */}
          <div className="border-b border-slate-300">
            <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-center text-xs font-bold tracking-wide text-slate-900">
              OUT COME
            </div>
            <div className="divide-y divide-slate-200">
              {POST_OP_OUTCOME_OPTIONS.slice(0, 6).map((opt) => {
                const active = pc.outcomes.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => toggleOutcome(opt.key)}
                    aria-pressed={active}
                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center gap-2.5 transition-colors ${
                      active
                        ? 'bg-blue-50/80 text-blue-950 font-semibold'
                        : 'bg-white text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        active
                          ? 'bg-blue-800 border-blue-800 text-white'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className="font-mono text-slate-500 w-4">{opt.number}.</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}

              {/* Item 7: Plan ICU / Unplan ICU */}
              <div className="px-3.5 py-2 flex flex-wrap items-center gap-4 text-xs bg-white">
                <span className="font-mono text-slate-500">7.</span>
                {POST_OP_OUTCOME_OPTIONS.slice(6).map((opt) => {
                  const active = pc.outcomes.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => toggleOutcome(opt.key)}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-2 px-2 py-1 rounded border transition-colors ${
                        active
                          ? 'bg-blue-50 border-blue-700 text-blue-950 font-semibold'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          active
                            ? 'bg-blue-800 border-blue-800 text-white'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Incident report */}
          <div className="border-b border-slate-300">
            <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-center text-xs font-bold text-slate-900">
              Incident report
            </div>
            <div className="px-3.5 py-2.5 flex flex-wrap items-center justify-center gap-6">
              {POST_OP_INCIDENT_OPTIONS.map((opt) => {
                const active = pc.incidentTypes.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => toggleIncident(opt.key)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded border text-xs transition-colors ${
                      active
                        ? 'bg-red-50 border-red-700 text-red-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        active
                          ? 'bg-red-700 border-red-700 text-white'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ระดับความรุนแรง A - I */}
          <div className="border-b border-slate-300">
            <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-center text-xs font-bold text-slate-900">
              ระดับความรุนแรง
            </div>
            <div className="px-3 py-2.5 flex flex-wrap items-center justify-center gap-1.5">
              {POST_OP_SEVERITY_LEVELS.map((lvl) => {
                const active = pc.severityLevel === lvl;
                const isHigh = lvl >= 'E';
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => toggleSeverity(lvl)}
                    aria-pressed={active}
                    className={`w-8 h-8 rounded-md border font-mono text-xs font-bold transition-colors ${
                      active
                        ? isHigh
                          ? 'bg-red-700 border-red-700 text-white'
                          : 'bg-blue-800 border-blue-800 text-white'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Administration error */}
          <div className="border-b border-slate-300">
            <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-center text-xs font-bold text-slate-900">
              Administration error
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POST_OP_ADMIN_ERROR_OPTIONS.map((opt) => {
                const active = pc.administrationErrors.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => toggleAdminError(opt.key)}
                    aria-pressed={active}
                    className={`px-2.5 py-1.5 rounded border text-left text-xs flex items-center gap-2 transition-colors ${
                      active
                        ? 'bg-red-50 border-red-700 text-red-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        active
                          ? 'bg-red-700 border-red-700 text-white'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className="font-mono text-slate-500">{opt.number}.</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Remark */}
          <div className="p-3 border-b border-slate-300 flex-1 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="post-op-remark"
                className="text-xs font-bold text-slate-800"
              >
                Remark :
              </label>
              <span className="text-[11px] font-mono tabular-nums text-slate-400">
                {pc.remark.length}/1000
              </span>
            </div>
            <textarea
              id="post-op-remark"
              rows={5}
              maxLength={1000}
              value={pc.remark}
              onChange={(e) => updatePostOpComp({ remark: e.target.value })}
              placeholder="บันทึกรายละเอียดเพิ่มเติม การแก้ไข หรือเหตุการณ์ที่พบ..."
              className={`${inputBase} w-full text-xs resize-y flex-1`}
            />
          </div>

          {/* ผู้บันทึกข้อมูล Peri op & Post op */}
          <div className="p-3 space-y-2.5 bg-slate-50/50">
            <datalist id="bph-postop-recorder-list">
              {recorderSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_132px_104px] gap-2 items-end">
              <label className="flex flex-col gap-0.5 text-xs">
                <span className="text-[11px] font-semibold text-slate-700">
                  ผู้บันทึกข้อมูล Peri op
                </span>
                <input
                  type="text"
                  list="bph-postop-recorder-list"
                  maxLength={120}
                  value={pc.periOpRecorder}
                  onChange={(e) => updatePostOpComp({ periOpRecorder: e.target.value })}
                  placeholder="ชื่อผู้บันทึก Peri op"
                  className={`${inputBase} text-xs`}
                />
              </label>
              <label className="flex flex-col gap-0.5 text-xs">
                <span className="text-[11px] font-medium text-slate-600">วันที่</span>
                <input
                  type="date"
                  value={pc.periOpDate}
                  onChange={(e) => updatePostOpComp({ periOpDate: e.target.value })}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
              <label className="flex flex-col gap-0.5 text-xs">
                <span className="text-[11px] font-medium text-slate-600">เวลา</span>
                <input
                  type="time"
                  value={pc.periOpTime}
                  onChange={(e) => updatePostOpComp({ periOpTime: e.target.value })}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_132px_104px] gap-2 items-end">
              <label className="flex flex-col gap-0.5 text-xs">
                <span className="text-[11px] font-semibold text-slate-700">
                  ผู้บันทึกข้อมูล Post op
                </span>
                <input
                  type="text"
                  list="bph-postop-recorder-list"
                  maxLength={120}
                  value={pc.postOpRecorder}
                  onChange={(e) => updatePostOpComp({ postOpRecorder: e.target.value })}
                  placeholder="ชื่อผู้บันทึก Post op"
                  className={`${inputBase} text-xs`}
                />
              </label>
              <label className="flex flex-col gap-0.5 text-xs">
                <span className="text-[11px] font-medium text-slate-600">วันที่</span>
                <input
                  type="date"
                  value={pc.postOpDate}
                  onChange={(e) => updatePostOpComp({ postOpDate: e.target.value })}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
              <label className="flex flex-col gap-0.5 text-xs">
                <span className="text-[11px] font-medium text-slate-600">เวลา</span>
                <input
                  type="time"
                  value={pc.postOpTime}
                  onChange={(e) => updatePostOpComp({ postOpTime: e.target.value })}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
            </div>

            <div className="text-right text-[11px] text-slate-500 pt-0.5">
              ANE-FM-006-01 อนุมัติใช้วันที่ 1 ก.พ.65
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Moved Post Anesthesia Evaluation */}
      <div className="p-4 bg-slate-50/70 space-y-3">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="px-3 py-1 border border-slate-400 bg-white rounded text-sm font-bold text-slate-900">
                Post Anesthesia Evaluation
              </div>
              {postOpCheck.isComplete ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  เยี่ยมหลังผ่าตัดแล้ว (ลงข้อมูลครบถ้วน)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  ยังไม่ได้เยี่ยมหลังผ่าตัด
                  {postOpCheck.hasAnyInput
                    ? ` (ลงข้อมูลไม่ครบ ${postOpCheck.filledCount}/${postOpCheck.totalRequired})`
                    : ''}
                </span>
              )}
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
                            updatePostAnesthesia({ summarizedBy: e.target.value });
                          } else if (isListedSummarizer) {
                            updatePostAnesthesia({ summarizedBy: '' });
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
                        onChange={(e) => updatePostAnesthesia({ summarizedBy: e.target.value })}
                        placeholder="หรือพิมพ์ชื่อเพิ่มเติม..."
                        maxLength={120}
                        className={`${inputBase} w-44 text-xs`}
                      />
                      {currentSummarizer.trim() && (
                        <button
                          type="button"
                          onClick={() => updatePostAnesthesia({ summarizedBy: '' })}
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
                  onChange={(e) => updatePostAnesthesia({ summarizedDate: e.target.value })}
                  className={`${inputBase} font-mono tabular-nums text-xs`}
                />
              </label>
            </div>
          </div>

          {isManagingSummarizers && (
            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
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

        {!postOpCheck.isComplete && (
          <div className="px-3 py-2 rounded-lg border border-amber-200 bg-amber-50/70 text-xs text-amber-900">
            {postOpCheck.hasAnyInput ? (
              <span>
                <strong>ยังลงข้อมูลการเยี่ยมหลังผ่าตัดไม่ครบ:</strong> ขาด{' '}
                {postOpCheck.missingFields.join(', ')} — ระบบจึงแสดงสถานะว่า{' '}
                <strong>ยังไม่ได้เยี่ยมหลังผ่าตัด</strong> จนกว่าจะกรอกครบทุกช่อง
              </span>
            ) : (
              <span>
                กรุณากรอกข้อมูลการเยี่ยมหลังผ่าตัดให้ครบ (BP, P, RR, T, SpO2, PS, Post anesthesia
                complication, ผู้เยี่ยม และวันที่เยี่ยม) จึงจะเปลี่ยนสถานะเป็น{' '}
                <strong>เยี่ยมหลังผ่าตัดแล้ว</strong>
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-600">
              BP (mm Hg) <span className="text-red-600">*</span>
            </span>
            <input
              type="text"
              value={pa.bp}
              onChange={(e) => updatePostAnesthesia({ bp: e.target.value })}
              className={`${inputBase} font-mono tabular-nums text-xs ${missingHighlight(Boolean(pa.bp.trim()))}`}
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-600">
              P (bpm) <span className="text-red-600">*</span>
            </span>
            <input
              type="text"
              value={pa.pulse}
              onChange={(e) => updatePostAnesthesia({ pulse: e.target.value })}
              className={`${inputBase} font-mono tabular-nums text-xs ${missingHighlight(Boolean(pa.pulse.trim()))}`}
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-600">
              RR (bpm) <span className="text-red-600">*</span>
            </span>
            <input
              type="text"
              value={pa.rr}
              onChange={(e) => updatePostAnesthesia({ rr: e.target.value })}
              className={`${inputBase} font-mono tabular-nums text-xs ${missingHighlight(Boolean(pa.rr.trim()))}`}
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-600">
              T (°C) <span className="text-red-600">*</span>
            </span>
            <input
              type="text"
              value={pa.temp}
              onChange={(e) => updatePostAnesthesia({ temp: e.target.value })}
              className={`${inputBase} font-mono tabular-nums text-xs ${missingHighlight(Boolean(pa.temp.trim()))}`}
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-600">
              SpO2 (%) <span className="text-red-600">*</span>
            </span>
            <input
              type="text"
              value={pa.spo2}
              onChange={(e) => updatePostAnesthesia({ spo2: e.target.value })}
              className={`${inputBase} font-mono tabular-nums text-xs ${missingHighlight(Boolean(pa.spo2.trim()))}`}
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-600">
              PS (คะแนน) <span className="text-red-600">*</span>
            </span>
            <input
              type="text"
              value={pa.painScore}
              onChange={(e) => updatePostAnesthesia({ painScore: e.target.value })}
              className={`${inputBase} font-mono tabular-nums text-xs ${missingHighlight(Boolean(pa.painScore.trim()))}`}
            />
          </label>
        </div>

        <div className="space-y-2.5 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              <span className="text-xs font-semibold text-slate-700">
                Post anesthesia complication <span className="text-red-600">*</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  updatePostAnesthesia({
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
                  updatePostAnesthesia({
                    complicationStatus: toggleTri(pa.complicationStatus, 'yes'),
                  })
                }
                className={radioBtn(pa.complicationStatus === 'yes', 'danger')}
              >
                {pa.complicationStatus === 'yes' ? '●' : '○'} Yes
              </button>
              {complicationSummaryText && (
                <button
                  type="button"
                  onClick={() =>
                    updatePostAnesthesia({
                      complicationStatus: 'yes',
                      complicationDetail: complicationSummaryText.slice(0, 500),
                    })
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 whitespace-nowrap"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  ดึง Complication ด้านบนมาใส่
                </button>
              )}
              {pa.complicationStatus === 'yes' && (
                <input
                  type="text"
                  value={pa.complicationDetail}
                  onChange={(e) => updatePostAnesthesia({ complicationDetail: e.target.value })}
                  placeholder="ระบุภาวะแทรกซ้อนและการดูแลแก้ไข *"
                  maxLength={500}
                  className={`${inputBase} flex-1 min-w-[200px] text-xs border-red-300 ${missingHighlight(Boolean(pa.complicationDetail.trim()))}`}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-600 font-medium">
                  visit by <span className="text-red-600">*</span>
                </span>
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
                            updatePostAnesthesia({ visitBy: e.target.value });
                          } else if (isListedVisitor) {
                            updatePostAnesthesia({ visitBy: '' });
                          }
                        }}
                        className={`${inputBase} w-48 text-xs ${missingHighlight(Boolean(currentVisitor.trim()))}`}
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
                        onChange={(e) => updatePostAnesthesia({ visitBy: e.target.value })}
                        placeholder="หรือพิมพ์ชื่อเพิ่มเติม..."
                        maxLength={120}
                        className={`${inputBase} w-44 text-xs ${missingHighlight(Boolean(currentVisitor.trim()))}`}
                      />
                      {currentVisitor.trim() && (
                        <button
                          type="button"
                          onClick={() => updatePostAnesthesia({ visitBy: '' })}
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
                <span className="text-slate-600 font-medium">
                  date <span className="text-red-600">*</span>
                </span>
                <input
                  type="date"
                  value={pa.visitDate}
                  onChange={(e) => updatePostAnesthesia({ visitDate: e.target.value })}
                  className={`${inputBase} font-mono tabular-nums text-xs ${missingHighlight(Boolean(pa.visitDate.trim()))}`}
                />
              </label>
            </div>
          </div>

          {isManagingVisitors && (
            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  จัดการรายชื่อผู้เยี่ยม visit by (เพิ่ม แก้ไข หรือลบรายชื่อได้ ·{' '}
                  {visitorOptions.length} รายชื่อ)
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
      </div>
    </div>
  );
}
