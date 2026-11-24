import React from 'react';
import {
  BLOOD_PREP_STATUS_OPTIONS,
  computeBloodGasPfRatio,
  CONSULT_TYPE_OPTIONS,
  formatBloodGroup,
  formatDrugAddictionDetail,
  formatDurationLabel,
  formatOxygenSupportSummary,
  formatPostponementReasons,
  formatPreOpNotVisitedReasons,
  formatShortThaiDate,
  formatSmokingDetail,
  formatThaiDateBE,
  formatToothMarksSummary,
  formatWardWithBed,
  getMedicationLines,
  PreAnestheticEvaluation,
} from '../types/evaluation';
import {
  BphLogo,
  CbcFishbone,
  ChemFishbone,
  DentalArchBadge,
  MallampatiSelector,
} from './MedicalDiagrams';

interface A4PrintSheetProps {
  evaluation: PreAnestheticEvaluation;
  previewMode?: boolean;
}

export function A4PrintSheet({ evaluation, previewMode = false }: A4PrintSheetProps) {
  const fd = evaluation.formData;
  const h = fd.history;
  const p = fd.physicalExam;
  const inv = fd.investigation;
  const lab = fd.laboratory;
  const pm = fd.premedication;
  const ap = fd.anestheticPlan;
  const medicationLines = getMedicationLines(h.medication);

  const mark = (active: boolean, text: string, keyProp?: string) => (
    <span key={keyProp} className="inline-flex items-center gap-0.5 mr-2 whitespace-nowrap">
      <span className="font-mono">{active ? '●' : '○'}</span>
      <span className={active ? 'font-bold underline' : ''}>{text}</span>
    </span>
  );

  const box = (active: boolean, text: string) => (
    <span className="inline-flex items-center gap-1 mr-2 whitespace-nowrap">
      <span className="font-mono">{active ? '☑' : '☐'}</span>
      <span className={active ? 'font-bold' : ''}>{text}</span>
    </span>
  );

  /** Pen-writable inline blank: displays bold value when filled, or a generous dotted writing line when empty */
  const writeBlank = (
    val: string | undefined | null,
    minWidthClass: string,
    opts?: { mono?: boolean },
  ) => {
    const cleaned = (val ?? '').trim();
    return (
      <span
        className={`inline-block border-b border-dotted border-slate-600 px-1 text-center align-baseline leading-[1.2] ${minWidthClass} ${
          opts?.mono ? 'font-mono' : ''
        }`}
      >
        {cleaned ? <strong>{cleaned}</strong> : '\u00A0'}
      </span>
    );
  };

  /** Full-width dotted writing line(s) for handwritten notes */
  const renderDottedLines = (
    lines: string[],
    minLines: number,
    opts?: { numbered?: boolean; rowHeightClass?: string; keyPrefix?: string },
  ) => {
    const rowCount = Math.max(minLines, lines.length);
    const heightCls = opts?.rowHeightClass ?? 'min-h-[17px]';
    const prefix = opts?.keyPrefix ?? 'line';
    return (
      <div className="space-y-0.5">
        {Array.from({ length: rowCount }).map((_, idx) => {
          const text = (lines[idx] ?? '').trim();
          return (
            <div key={`${prefix}_${idx}`} className={`flex items-end gap-1 ${heightCls}`}>
              {opts?.numbered && (
                <span className="font-mono text-[10px] text-slate-700 shrink-0 leading-[1.2]">
                  {idx + 1}.
                </span>
              )}
              <span className="flex-1 border-b border-dotted border-slate-600 px-0.5 leading-[1.22] break-words">
                {text || '\u00A0'}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const filledPreviousOps = h.previousOps.map((s) => s.trim()).filter(Boolean);
  const filledPremeds = pm.items.map((s) => s.trim()).filter(Boolean);
  const consultTextLines = (fd.consult || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const filledProblems = fd.problemList.map((s) => s.trim()).filter(Boolean);
  const filledPrepOrders = fd.preparationOrders.map((s) => s.trim()).filter(Boolean);

  return (
    <div
      className={
        previewMode
          ? 'a4-single-page pre-op-single-a4 flex flex-col bg-white border border-slate-300 shadow-sm mx-auto w-full max-w-[794px] min-h-[1123px] p-5 text-[10.5px] leading-[1.26] text-slate-950 print:border-0 print:shadow-none print:max-w-none print:min-h-0 print:p-0'
          : 'hidden print-only-sheet a4-single-page pre-op-single-a4 flex-col text-[10.3px] leading-[1.24] text-black'
      }
    >
      <div className="border-[1.5px] border-slate-900 flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 py-1.5 px-3 border-b-[1.5px] border-slate-900 shrink-0">
          <BphLogo className="w-8 h-8 shrink-0" />
          <div className="text-center">
            <div className="text-[14px] font-bold leading-tight">Bangplee Hospital</div>
            <div className="text-[12px] font-semibold leading-tight">
              Pre Anesthetic Evaluation form
            </div>
          </div>
        </div>

        {/* Demographics */}
        <div className="px-2.5 py-1.5 border-b border-slate-900 space-y-1 shrink-0">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <span>
              Name: {writeBlank(evaluation.patientName, 'min-w-[135px]')}
            </span>
            <span>
              Age: {writeBlank(evaluation.age, 'min-w-[34px]', { mono: true })} yr
            </span>
            <span>
              HN: {writeBlank(evaluation.hn, 'min-w-[74px]', { mono: true })}
            </span>
            <span>
              AN: {writeBlank(evaluation.an, 'min-w-[74px]', { mono: true })}
            </span>
            <span>
              Ward: {writeBlank(formatWardWithBed(evaluation.ward, evaluation.bed), 'min-w-[68px]')}
            </span>
            <span>
              สาขา: {writeBlank(evaluation.specialty, 'min-w-[62px]')}
            </span>
            <span>
              Date of visit: {writeBlank(formatThaiDateBE(evaluation.dateOfVisit), 'min-w-[72px]', { mono: true })}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <span>
              Diagnosis: {writeBlank(evaluation.diagnosis, 'min-w-[140px]')}
            </span>
            <span>
              Operation: {writeBlank(evaluation.operation, 'min-w-[155px]')}
            </span>
            <span>
              Surgeon: {writeBlank(evaluation.surgeon, 'min-w-[110px]')}
            </span>
            <span>
              Date of operation: {writeBlank(formatThaiDateBE(evaluation.dateOfOperation), 'min-w-[74px]', { mono: true })}
            </span>
            <span>
              Time: {writeBlank(evaluation.operationTime, 'min-w-[48px]', { mono: true })}
            </span>
            {(evaluation.orRoom || evaluation.caseOrder) && (
              <span>
                OR: <strong className="font-mono">{evaluation.orRoom || '—'}{evaluation.caseOrder ? ` #${evaluation.caseOrder}` : ''}</strong>
              </span>
            )}
          </div>
          {fd.surgeryPostponement?.isPostponed && (
            <div className="text-[10px] text-amber-950 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-xs">
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
            </div>
          )}
          {fd.preOpNotVisited?.isNotVisited && (
            <div className="text-[10px] text-rose-950 bg-rose-50 border border-rose-300 px-1.5 py-0.5 rounded-xs">
              <strong>ฉบับร่าง (ไม่ได้เยี่ยม Pre-op):</strong>{' '}
              {formatPreOpNotVisitedReasons(fd.preOpNotVisited) || 'ยังไม่ระบุเหตุผล'}
            </div>
          )}
        </div>

        {/* Two Columns — Stretches evenly to fill full A4 height */}
        <div className="grid grid-cols-2 border-b border-slate-900 flex-1 min-h-0">
          {/* Left Column */}
          <div className="border-r border-slate-900 flex flex-col divide-y divide-slate-900 h-full min-h-0">
            {/* 1. History */}
            <div className="p-2 space-y-1 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="font-bold text-[11px]">1. History</div>
                {/* 1.1 Present illness — Always 4 dotted writing lines */}
                <div className="space-y-0.5">
                  <div className="font-semibold">1.1 Present illness:</div>
                  {renderDottedLines(
                    (h.presentIllness || '')
                      .split(/\r?\n/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                    4,
                    { rowHeightClass: 'min-h-[14px]', keyPrefix: 'pi' },
                  )}
                </div>
                {/* 1.2 Past illness — Always 4 dotted writing lines */}
                <div className="space-y-0.5">
                  <div className="font-semibold">1.2 Past illness:</div>
                  {renderDottedLines(
                    (h.pastIllness || '')
                      .split(/\r?\n/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                    4,
                    { rowHeightClass: 'min-h-[14px]', keyPrefix: 'past' },
                  )}
                </div>
                <div className="flex flex-wrap items-baseline gap-x-1">
                  <span className="font-semibold">1.3 Allergy:</span>
                  {mark(h.allergyStatus === 'no', 'No')}
                  {mark(h.allergyStatus === 'yes', 'Yes')}
                  {writeBlank(h.allergyDetail, 'min-w-[110px] flex-1')}
                </div>
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-baseline gap-x-1">
                    <span className="font-semibold">1.4 Underlying:</span>
                    {mark(h.underlyingStatus === 'no', 'No')}
                    {mark(h.underlyingStatus === 'yes', 'Yes')}
                    <span className="inline-flex items-baseline">
                      {mark(h.underlyingControl === 'good', 'Good control')}
                      {mark(h.underlyingControl === 'poor', 'Poor control')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 border border-slate-400 p-1">
                    <div className="space-y-0.5">
                      <div>
                        {mark(
                          h.dm,
                          `DM ${h.dmYears ? `${h.dmYears} ปี` : ''}${
                            h.dmControl === 'good'
                              ? ' [Good]'
                              : h.dmControl === 'poor'
                              ? ' [Poor]'
                              : ''
                          }${h.dmDetail?.trim() ? ` (${h.dmDetail.trim()})` : ''}`.trim(),
                        )}
                      </div>
                      <div>
                        {mark(
                          h.ht,
                          `HT ${h.htYears ? `${h.htYears} ปี` : ''}${
                            h.htControl === 'good'
                              ? ' [Good]'
                              : h.htControl === 'poor'
                              ? ' [Poor]'
                              : ''
                          }${h.htDetail?.trim() ? ` (${h.htDetail.trim()})` : ''}`.trim(),
                        )}
                      </div>
                      <div>
                        {mark(
                          Boolean(h.dlp),
                          `DLP ${h.dlpYears ? `${h.dlpYears} ปี` : ''}${
                            h.dlpControl === 'good'
                              ? ' [Good]'
                              : h.dlpControl === 'poor'
                              ? ' [Poor]'
                              : ''
                          }${h.dlpDetail?.trim() ? ` (${h.dlpDetail.trim()})` : ''}`.trim(),
                        )}
                      </div>
                      <div>
                        {mark(
                          Boolean(h.ckd),
                          `โรคไต ${h.ckdYears ? `${h.ckdYears} ปี` : ''}${
                            h.ckdControl === 'good'
                              ? ' [Good]'
                              : h.ckdControl === 'poor'
                              ? ' [Poor]'
                              : ''
                          }${h.ckdDetail?.trim() ? ` (${h.ckdDetail.trim()})` : ''}`.trim(),
                        )}
                      </div>
                      <div>
                        {mark(
                          h.heartDisease,
                          `โรคหัวใจ ${h.heartDiseaseYears ? `${h.heartDiseaseYears} ปี` : ''}${
                            h.heartDiseaseControl === 'good'
                              ? ' [Good]'
                              : h.heartDiseaseControl === 'poor'
                              ? ' [Poor]'
                              : ''
                          }${h.heartDiseaseDetail?.trim() ? ` (${h.heartDiseaseDetail.trim()})` : ''}`.trim(),
                        )}
                      </div>
                      {/* 3 dotted writing lines below heart disease */}
                      {renderDottedLines(
                        h.otherUnderlying.map((u) => u.trim()).filter(Boolean),
                        3,
                        { rowHeightClass: 'min-h-[14px]', keyPrefix: 'other_ud' },
                      )}
                      {h.underlyingDetail?.trim() && (
                        <div className="pt-0.5 text-[9.5px] whitespace-pre-wrap">
                          <span className="font-semibold">รายละเอียด:</span> {h.underlyingDetail.trim()}
                        </div>
                      )}
                    </div>
                    <div className="border-l border-slate-400 pl-1.5">
                      <div className="font-semibold">Medication:</div>
                      {renderDottedLines(medicationLines, 8, {
                        rowHeightClass: 'min-h-[14px]',
                        keyPrefix: 'med',
                      })}
                    </div>
                  </div>
                </div>

                {/* 1.5 Previous operation / anesthesia — Always 4 dotted writing lines */}
                <div className="pt-0.5 space-y-0.5">
                  <div className="font-semibold">1.5 Previous operation / anesthesia</div>
                  {renderDottedLines(filledPreviousOps, 4, {
                    numbered: true,
                    rowHeightClass: 'min-h-[15px]',
                    keyPrefix: 'prev_op',
                  })}
                  <div className="flex items-end gap-1 pt-0.5">
                    <span className="font-semibold shrink-0">complication:</span>
                    <span className="flex-1 border-b border-dotted border-slate-600 px-0.5 leading-[1.22]">
                      {h.previousOpComplication?.trim() || '\u00A0'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-0.5 pt-1">
                <div className="flex flex-wrap items-baseline gap-x-1">
                  <span className="font-semibold">1.6 Drinking:</span>
                  {mark(h.drinkingStatus === 'no', 'No')}
                  {mark(h.drinkingStatus === 'yes', 'Yes')}
                  <span>ปริมาณ</span>
                  {writeBlank(h.drinkingAmount, 'min-w-[74px]')}
                  {writeBlank(h.drinkingDaysPerWeek, 'min-w-[26px] text-center')}
                  <span>วัน/wk</span>
                  <span>จำนวน</span>
                  {writeBlank(h.drinkingYears, 'min-w-[26px] text-center')}
                  <span>{h.drinkingDurationUnit === 'months' ? 'เดือน' : 'ปี'}</span>
                  {(h.drinkingQuit || h.drinkingQuitDuration?.trim()) && (
                    <span>
                      · เลิก {formatDurationLabel(h.drinkingQuitDuration || '', h.drinkingQuitUnit)}
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-semibold">1.7 Smoking:</span>{' '}
                  {mark(h.smokingStatus === 'no', 'No')}
                  {mark(h.smokingStatus === 'yes', `Yes (${formatSmokingDetail(h)})`)}
                </div>
                <div>
                  <span className="font-semibold">1.8 Drug addiction:</span>{' '}
                  {mark(h.drugAddictionStatus === 'no', 'No')}
                  {mark(
                    h.drugAddictionStatus === 'yes',
                    `Yes${
                      h.drugAddictionStatus === 'yes' && formatDrugAddictionDetail(h)
                        ? ` (${formatDrugAddictionDetail(h)})`
                        : ''
                    }`,
                  )}
                </div>
              </div>
            </div>

            {/* 3. Investigation */}
            <div className="p-2 space-y-1 shrink-0">
              <div className="font-bold text-[11px]">3. Investigation</div>
              <div className="flex flex-wrap items-baseline gap-x-1">
                <span className="font-semibold">3.1 Chest x-ray:</span>
                {mark(inv.cxrStatus === 'normal', 'Normal')}
                {mark(inv.cxrStatus === 'abnormal', 'Abnormal')}
                {writeBlank(inv.cxrDetail, 'min-w-[90px] flex-1')}
              </div>
              <div className="flex flex-wrap items-baseline gap-x-1">
                <span className="font-semibold">3.2 EKG:</span>
                {mark(inv.ekgStatus === 'normal', 'Normal')}
                {mark(inv.ekgStatus === 'abnormal', 'Abnormal')}
                {writeBlank(inv.ekgDetail, 'min-w-[100px] flex-1')}
              </div>
              <div className="flex items-end gap-1">
                <span className="font-semibold shrink-0">3.3 Other (ex. CT):</span>
                <span className="flex-1 border-b border-dotted border-slate-600 px-0.5 leading-[1.22]">
                  {inv.other?.trim() || '\u00A0'}
                </span>
              </div>
            </div>

            {/* 5. Premedication — Always 5 numbered dotted writing lines */}
            <div className="p-2 space-y-1 shrink-0">
              <div className="font-bold text-[11px]">5. Premedication</div>
              {renderDottedLines(filledPremeds, 5, {
                numbered: true,
                rowHeightClass: 'min-h-[17px]',
                keyPrefix: 'premed',
              })}
              <div className="mt-1 px-2 py-1 border-[1.5px] border-slate-900 bg-amber-50/70">
                <div className="text-[13.5px] font-extrabold tracking-wide text-red-800 flex items-baseline gap-1.5">
                  <span className="shrink-0">NPO:</span>
                  <span className="flex-1 border-b border-dotted border-red-800/70 px-1 leading-[1.2]">
                    {pm.npoTime?.trim() || '\u00A0'}
                  </span>
                </div>
                {(pm.lastMealTime || pm.lastWaterTime) && (
                  <div className="text-[9.5px] font-semibold text-slate-800 mt-0.5">
                    {pm.lastMealTime ? `อาหารล่าสุด ${pm.lastMealTime} น.` : ''}
                    {pm.lastMealTime && pm.lastWaterTime ? ' · ' : ''}
                    {pm.lastWaterTime ? `น้ำเปล่าล่าสุด ${pm.lastWaterTime} น.` : ''}
                  </div>
                )}
              </div>
              {pm.onIvf?.trim() ? (
                <div className="flex items-end gap-1 pt-0.5">
                  <span className="font-semibold shrink-0">on IVF:</span>
                  <span className="flex-1 border-b border-dotted border-slate-600 px-0.5 leading-[1.22] font-semibold">
                    {pm.onIvf.trim()}
                  </span>
                </div>
              ) : (
                <div className="pt-0.5 space-y-0.5 text-[9.5px] leading-[1.3]">
                  <div className="flex flex-wrap items-baseline gap-x-1">
                    <span className="font-semibold text-[10.5px]">on IVF:</span>
                    {mark(false, 'LSR 1000 ml')}
                    {mark(false, 'Acetar 1000 ml')}
                    {mark(false, 'NSS 1000 ml')}
                    {mark(false, '5%D/N/2 1000 ml')}
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-1 pl-1">
                    <span>○ NSS</span>
                    {writeBlank('', 'min-w-[30px]')}
                    <span>ml + KCl</span>
                    {writeBlank('', 'min-w-[24px]')}
                    <span>mEq</span>
                    <span className="ml-1">IV rate</span>
                    {writeBlank('', 'min-w-[36px]')}
                    <span>ml/hr</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col divide-y divide-slate-900 h-full min-h-0">
            {/* 2. Physical examination — Spacious pen-writable Vital Signs & Anthropometrics */}
            <div className="p-2 space-y-1 flex-1">
              <div className="font-bold text-[11px]">2. Physical examination</div>
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 leading-[1.35]">
                <span>
                  <span className="font-semibold">BW:</span>{' '}
                  {writeBlank(p.bw, 'min-w-[48px]', { mono: true })} kg
                </span>
                <span>
                  <span className="font-semibold">HT:</span>{' '}
                  {writeBlank(p.ht, 'min-w-[50px]', { mono: true })} cm
                </span>
                <span>
                  <span className="font-semibold">BMI:</span>{' '}
                  {writeBlank(p.bmi, 'min-w-[48px]', { mono: true })}
                </span>
              </div>
              <div className="space-y-1 leading-[1.35]">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-semibold">Vital signs:</span>
                  <span>
                    BP {writeBlank(p.bp, 'min-w-[74px]', { mono: true })} mmHg
                  </span>
                  <span>
                    P {writeBlank(p.pulse, 'min-w-[46px]', { mono: true })} /min
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 pl-1">
                  <span>
                    RR {writeBlank(p.rr, 'min-w-[44px]', { mono: true })} /min
                  </span>
                  <span>
                    T {writeBlank(p.temp, 'min-w-[46px]', { mono: true })} °C
                  </span>
                  <span>
                    SpO2 {writeBlank(p.spo2, 'min-w-[46px]', { mono: true })} %
                  </span>
                </div>
              </div>
              <div className="space-y-0.5 leading-[1.3] pt-0.5 border-t border-dotted border-slate-300">
                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-semibold">Status ปัจจุบัน:</span>
                  <span>
                    GCS E{writeBlank(p.gcsE, 'min-w-[22px] text-center', { mono: true })}
                    V{writeBlank(p.gcsV, 'min-w-[22px] text-center', { mono: true })}
                    M{writeBlank(p.gcsM, 'min-w-[22px] text-center', { mono: true })}
                  </span>
                  <span className="inline-flex flex-wrap items-baseline">
                    {mark(p.selfCareStatus === 'independent', 'ช่วยเหลือตัวเองได้')}
                    {mark(p.selfCareStatus === 'dependent', 'ช่วยเหลือตัวเองไม่ได้')}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-1.5 pl-1">
                  <span className="font-semibold">อาการ:</span>
                  {mark(p.dyspneaStatus === 'no', 'ไม่เหนื่อยหอบ')}
                  {mark(p.dyspneaStatus === 'yes', 'เหนื่อยหอบ')}
                  {writeBlank(p.currentStatusDetail, 'min-w-[115px] flex-1')}
                </div>
              </div>
              {formatOxygenSupportSummary(p.oxygenSupport) && (
                <div>
                  <span className="font-semibold">O2 / Airway support:</span>{' '}
                  <strong>{formatOxygenSupportSummary(p.oxygenSupport)}</strong>
                </div>
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="font-semibold">2.1 Tooth:</span>{' '}
                  {(['Normal', 'Denture', 'Loose', 'Avulsion'] as const).map((t) =>
                    mark(p.toothStatus.includes(t), t, `tooth_${t}`),
                  )}
                  {p.toothDetail && <span>({p.toothDetail})</span>}
                  {formatToothMarksSummary(p.missingTeeth, p.looseTeeth) && (
                    <div className="text-[9.5px] text-slate-700 mt-0.5">
                      {formatToothMarksSummary(p.missingTeeth, p.looseTeeth)}
                    </div>
                  )}
                </div>
                <DentalArchBadge
                  className="w-[74px] h-[46px] shrink-0"
                  missingTeeth={p.missingTeeth || []}
                  looseTeeth={p.looseTeeth || []}
                />
              </div>
              <div>
                <span className="font-semibold">2.2 Airway:</span> Mouth opening{' '}
                {mark(p.mouthOpening === 'normal', 'Normal')}
                {mark(p.mouthOpening === 'limited', 'Limited')}
                {p.mouthOpeningDetail && <span>({p.mouthOpeningDetail})</span>}
                <br />
                Neck movement {mark(p.neckMovement === 'normal', 'Normal')}
                {mark(p.neckMovement === 'limited', 'Limited')}
                {p.neckMovementDetail && <span>({p.neckMovementDetail}) </span>}
                · TMD {mark(p.thyromentalDistance === '<6', '<6 cm')}
                {mark(p.thyromentalDistance === '>=6', '>=6 cm')}
                {p.thyromentalDistanceDetail && <span>({p.thyromentalDistanceDetail})</span>}
              </div>
              <div>
                <div className="font-semibold mb-0.5">2.3 Mallampati class</div>
                <MallampatiSelector value={p.mallampatiClass} compact />
                <div className="mt-0.5">
                  Expected difficult airway:{' '}
                  {mark(p.expectedDifficultAirway === 'no', 'No')}
                  {mark(p.expectedDifficultAirway === 'yes', 'Yes')}
                </div>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-1">
                <span className="font-semibold">2.4 Breath sound:</span>
                {mark(p.breathSound === 'normal', 'Normal')}
                {mark(p.breathSound === 'abnormal', 'Abnormal')}
                {writeBlank(p.breathSoundDetail, 'min-w-[80px] flex-1')}
              </div>
              <div className="flex flex-wrap items-baseline gap-x-1">
                <span className="font-semibold">2.5 Heart sound:</span>
                {mark(p.heartSound === 'normal', 'Normal')}
                {mark(p.heartSound === 'abnormal', 'Abnormal')}
                {writeBlank(p.heartSoundDetail, 'min-w-[80px] flex-1')}
              </div>
              <div className="flex flex-wrap items-baseline gap-x-1">
                <span className="font-semibold shrink-0">2.6 FC:</span>
                {mark(p.functionalCapacityLevel === '>4', '> 4 METS')}
                {mark(p.functionalCapacityLevel === '<4', '< 4 METS')}
                {writeBlank(p.functionalCapacity, 'min-w-[110px] flex-1')}
              </div>
            </div>

            {/* 4. Laboratory Evaluation */}
            <div className="p-2 space-y-1 shrink-0">
              {(() => {
                const effectiveCbcDate = lab.cbcDate || (!lab.chemDate ? lab.labDate : '');
                const effectiveChemDate = lab.chemDate || (!lab.cbcDate ? lab.labDate : '');
                return (
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="font-bold text-[11px]">4. Laboratory Evaluation</div>
                    {(effectiveCbcDate || effectiveChemDate) && (
                      <div className="text-[9.5px] font-mono flex flex-wrap gap-x-2">
                        {effectiveCbcDate && (
                          <span>
                            วันที่ CBC: <strong>{formatShortThaiDate(effectiveCbcDate)}</strong>
                          </span>
                        )}
                        {effectiveChemDate && (
                          <span>
                            วันที่ Chem: <strong>{formatShortThaiDate(effectiveChemDate)}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-2">
                <CbcFishbone lab={lab} readOnly />
                <ChemFishbone lab={lab} readOnly />
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-semibold">Coag:</span>
                <span>PT {writeBlank(lab.pt, 'min-w-[34px]', { mono: true })}s</span>
                <span>PTT {writeBlank(lab.ptt, 'min-w-[34px]', { mono: true })}s</span>
                <span>INR {writeBlank(lab.inr, 'min-w-[34px]', { mono: true })}</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span className="font-semibold">LFT:</span>
                <span>SGOT {writeBlank(lab.sgot, 'min-w-[30px]', { mono: true })}</span>
                <span>SGPT {writeBlank(lab.sgpt, 'min-w-[30px]', { mono: true })}</span>
                <span>ALP {writeBlank(lab.alp, 'min-w-[30px]', { mono: true })}</span>
                <span>Alb {writeBlank(lab.alb, 'min-w-[30px]', { mono: true })}</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span>DTX/Glu {writeBlank(lab.glucose, 'min-w-[36px]', { mono: true })}</span>
                <span>HbA1C {writeBlank(lab.hba1c, 'min-w-[30px]', { mono: true })}</span>
                <span>Lactate {writeBlank(lab.lactate, 'min-w-[30px]', { mono: true })}</span>
                <span>Trop I {writeBlank(lab.tropI, 'min-w-[30px]', { mono: true })}</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-semibold">TFT:</span>
                <span>FT3 {writeBlank(lab.ft3, 'min-w-[36px]', { mono: true })}</span>
                <span>FT4 {writeBlank(lab.ft4, 'min-w-[36px]', { mono: true })}</span>
                <span>TSH {writeBlank(lab.tsh, 'min-w-[36px]', { mono: true })}</span>
              </div>
              {(() => {
                const isVbg = lab.bgType === 'VBG';
                const isAbg = lab.bgType === 'ABG';
                const pco2Label = isVbg ? 'PvCO2' : isAbg ? 'PaCO2' : 'pCO2';
                const po2Label = isVbg ? 'PvO2' : isAbg ? 'PaO2' : 'pO2';
                const satLabel = isVbg ? 'SvO2' : isAbg ? 'SaO2' : 'O2Sat';
                const pfRatio = computeBloodGasPfRatio(lab);
                return (
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                    <span className="font-semibold">Blood Gas:</span>
                    {mark(isAbg, 'ABG')}
                    {mark(isVbg, 'VBG')}
                    <span>pH {writeBlank(lab.bgPh, 'min-w-[28px]', { mono: true })}</span>
                    <span>
                      {pco2Label} {writeBlank(lab.bgPco2, 'min-w-[28px]', { mono: true })}
                    </span>
                    <span>
                      {po2Label} {writeBlank(lab.bgPo2, 'min-w-[28px]', { mono: true })}
                    </span>
                    <span>HCO3 {writeBlank(lab.bgHco3, 'min-w-[28px]', { mono: true })}</span>
                    <span>BE {writeBlank(lab.bgBe, 'min-w-[26px]', { mono: true })}</span>
                    <span>
                      {satLabel} {writeBlank(lab.bgSao2, 'min-w-[26px]', { mono: true })}%
                    </span>
                    <span>FiO2 {writeBlank(lab.bgFio2, 'min-w-[26px]', { mono: true })}</span>
                    {pfRatio !== null && (
                      <span className="font-mono">
                        · P/F=<strong>{pfRatio}</strong>
                      </span>
                    )}
                  </div>
                );
              })()}
              <div>
                Anti-HIV:{' '}
                {mark(lab.antiHiv === 'negative', 'Negative')}
                {mark(lab.antiHiv === 'positive', 'Positive')} · HBsAg:{' '}
                {mark(lab.hbsAg === 'negative', 'Negative')}
                {mark(lab.hbsAg === 'positive', 'Positive')}
                {lab.other ? <> · Other: {lab.other}</> : ''}
              </div>
              {(lab.customLabs || []).some((c) => c.name.trim() || c.value.trim()) && (
                <div className="font-mono">
                  {(lab.customLabs || [])
                    .filter((c) => c.name.trim() || c.value.trim())
                    .map((c, i) => (
                      <span key={i}>
                        {i > 0 ? ' · ' : ''}
                        {c.name.trim() || 'Lab'}: <strong>{c.value.trim() || '—'}</strong>
                      </span>
                    ))}
                </div>
              )}
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  <span>
                    Group เลือด {writeBlank(formatBloodGroup(lab.bloodGroup, lab.bloodRh), 'min-w-[34px]', { mono: true })}
                  </span>
                  <span>· {box(Boolean(lab.prepTs), 'T&S')}</span>
                  <span>PRC {writeBlank(lab.prepPrc, 'min-w-[24px]', { mono: true })}u</span>
                  <span>FFP {writeBlank(lab.prepFfp, 'min-w-[24px]', { mono: true })}u</span>
                  <span>Plt {writeBlank(lab.prepPlt, 'min-w-[24px]', { mono: true })}u</span>
                  <span>Cryo {writeBlank(lab.prepCryo, 'min-w-[24px]', { mono: true })}u</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-1">
                  {BLOOD_PREP_STATUS_OPTIONS.map((opt) => (
                    <React.Fragment key={opt.value}>
                      {box(
                        (lab.prepStatuses || []).includes(opt.value),
                        opt.value === 'other' && lab.prepStatusDetail
                          ? `${opt.label}: ${lab.prepStatusDetail}`
                          : opt.label,
                      )}
                    </React.Fragment>
                  ))}
                  {!(lab.prepStatuses || []).includes('other') && lab.prepStatusDetail && (
                    <span>({lab.prepStatusDetail})</span>
                  )}
                </div>
              </div>
            </div>

            {/* 6. Consult Med/Cardio — Always 6 full-width dotted writing lines */}
            <div className="p-2 space-y-1 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                <div className="font-bold text-[11px]">6. Consult Med/Cardio</div>
                <div className="flex flex-wrap items-center gap-x-0.5">
                  {CONSULT_TYPE_OPTIONS.filter(
                    (opt) =>
                      opt.value === 'none' ||
                      opt.value === 'med' ||
                      opt.value === 'cardio' ||
                      (fd.consultTypes || []).includes(opt.value),
                  ).map((opt) => (
                    <React.Fragment key={opt.value}>
                      {box((fd.consultTypes || []).includes(opt.value), opt.shortLabel)}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              {renderDottedLines(consultTextLines, 6, {
                rowHeightClass: 'min-h-[17px]',
                keyPrefix: 'consult',
              })}
            </div>
          </div>
        </div>

        {/* Lower Sections 7-10 */}
        <div className="p-2 space-y-1 shrink-0">
          <div>
            <span className="font-bold">7. ASA Classification:</span>{' '}
            {(['I', 'II', 'III', 'IV', 'V', 'VI'] as const).map((cls) =>
              mark(evaluation.asaClass === cls, `Class ${cls}`, `asa_${cls}`),
            )}
            {mark(evaluation.asaEmergency, 'E')}
          </div>
          <div>
            <span className="font-bold">8. Problem list:</span>{' '}
            {filledProblems.length > 0 ? (
              <span>
                {filledProblems.map((prob, i) => `${i + 1}) ${prob}`).join(' · ')}
              </span>
            ) : (
              <span className="inline-block w-[82%] border-b border-dotted border-slate-600 align-baseline">
                {'\u00A0'}
              </span>
            )}
          </div>
          <div>
            <span className="font-bold">9. Anesthetic plan:</span>{' '}
            {box(ap.gaSelected, 'General anesthesia')}{' '}
            {(['Intubation', 'LMA', 'Mask', 'TIVA', 'Other'] as const).map((m) =>
              mark(ap.gaMethods.includes(m), m, `ga_${m}`),
            )}
            {ap.gaOther && <span>({ap.gaOther})</span>}
            <br />
            <span className="pl-24 inline-block">
              {box(ap.raSelected, 'Regional anesthesia')}{' '}
              {(['Spinal block', 'Epidural', 'Nerve block', 'Other'] as const).map((m) =>
                mark(ap.raMethods.includes(m), m, `ra_${m}`),
              )}
              {ap.raOther && <span>({ap.raOther})</span>}
            </span>
            {ap.macSelected && (
              <>
                <br />
                <span className="pl-24 inline-block">
                  {box(Boolean(ap.macSelected), 'MAC (Monitored Anesthesia Care)')}
                  {ap.macDetail && <span>({ap.macDetail})</span>}
                </span>
              </>
            )}
          </div>
          <div>
            <span className="font-bold">10. สิ่งที่ต้องเตรียม (ตาม order วิสัญญีแพทย์):</span>{' '}
            {filledPrepOrders.length > 0 ? (
              <span>
                {filledPrepOrders.map((ord, i) => `${i + 1}) ${ord}`).join(' · ')}
              </span>
            ) : (
              <span className="inline-block w-[66%] border-b border-dotted border-slate-600 align-baseline">
                {'\u00A0'}
              </span>
            )}
          </div>
          <div className="pt-1.5 mt-1 border-t border-slate-400 flex items-center justify-end gap-4">
            <span>
              <strong>Summarized by:</strong>{' '}
              {writeBlank(fd.postAnesthesia.summarizedBy, 'min-w-[155px]')}
            </span>
            <span>
              <strong>date:</strong>{' '}
              {writeBlank(formatThaiDateBE(fd.postAnesthesia.summarizedDate), 'min-w-[85px]', { mono: true })}
            </span>
          </div>
        </div>
      </div>
      <div className="text-right text-[9.5px] text-slate-600 mt-1 leading-none shrink-0">
        ANE-FM-002-03 อนุมัติใช้วันที่ 21 มิถุนายน 2564
      </div>
    </div>
  );
}
