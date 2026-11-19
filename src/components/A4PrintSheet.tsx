import React from 'react';
import {
  BLOOD_PREP_STATUS_OPTIONS,
  formatDrinkingDetail,
  formatDrugAddictionDetail,
  formatOxygenSupportSummary,
  formatSmokingDetail,
  formatToothMarksSummary,
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
  const pa = fd.postAnesthesia;

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

  return (
    <div
      className={
        previewMode
          ? 'bg-white border border-slate-300 shadow-sm mx-auto max-w-[820px] p-4 text-[11px] leading-[1.32] text-slate-950'
          : 'hidden print-only-sheet text-[10.5px] leading-[1.28] text-black'
      }
    >
      <div className="border-[1.5px] border-slate-900">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 py-1.5 px-3 border-b-[1.5px] border-slate-900">
          <BphLogo className="w-8 h-8 shrink-0" />
          <div className="text-center">
            <div className="text-[13px] font-bold leading-tight">Bangplee Hospital</div>
            <div className="text-[11.5px] font-semibold leading-tight">
              Pre Anesthetic Evaluation form
            </div>
          </div>
        </div>

        {/* Demographics */}
        <div className="px-2.5 py-1.5 border-b border-slate-900 space-y-1">
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            <span>
              Name: <strong className="underline decoration-dotted">{evaluation.patientName || '________________'}</strong>
            </span>
            <span>
              Age: <strong className="font-mono">{evaluation.age || '____'}</strong> yr
            </span>
            <span>
              HN: <strong className="font-mono">{evaluation.hn || '________'}</strong>
            </span>
            <span>
              AN: <strong className="font-mono">{evaluation.an || '________'}</strong>
            </span>
            <span>
              Ward: <strong>{evaluation.ward || '________'}</strong>
            </span>
            <span>
              Date of visit: <strong className="font-mono">{evaluation.dateOfVisit || '________'}</strong>
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            <span>
              Diagnosis: <strong>{evaluation.diagnosis || '________________________'}</strong>
            </span>
            <span>
              Operation: <strong>{evaluation.operation || '________________________'}</strong>
            </span>
            <span>
              Surgeon: <strong>{evaluation.surgeon || '____________________'}</strong>
            </span>
            <span>
              Date of operation: <strong className="font-mono">{evaluation.dateOfOperation || '________'}</strong>
            </span>
            <span>
              Time: <strong className="font-mono">{evaluation.operationTime || '______'}</strong>
            </span>
            {(evaluation.orRoom || evaluation.caseOrder) && (
              <span>
                OR: <strong className="font-mono">{evaluation.orRoom || '—'}{evaluation.caseOrder ? ` #${evaluation.caseOrder}` : ''}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Two Columns */}
        <div className="grid grid-cols-2 border-b border-slate-900">
          {/* Left Column */}
          <div className="border-r border-slate-900 divide-y divide-slate-900">
            {/* 1. History */}
            <div className="p-2 space-y-1">
              <div className="font-bold text-[11px]">1. History</div>
              <div>
                <span className="font-semibold">1.1 Present illness:</span>{' '}
                <span>{h.presentIllness || '—'}</span>
              </div>
              <div>
                <span className="font-semibold">1.2 Past illness:</span>{' '}
                <span>{h.pastIllness || '—'}</span>
              </div>
              <div>
                <span className="font-semibold">1.3 Allergy:</span>{' '}
                {mark(h.allergyStatus === 'no', 'No')}
                {mark(h.allergyStatus === 'yes', 'Yes')}
                {h.allergyDetail && <strong className="underline">{h.allergyDetail}</strong>}
              </div>
              <div className="space-y-0.5">
                <div>
                  <span className="font-semibold">1.4 Underlying:</span>{' '}
                  {mark(h.underlyingStatus === 'no', 'No')}
                  {mark(h.underlyingStatus === 'yes', 'Yes')}
                </div>
                <div className="grid grid-cols-2 gap-1.5 border border-slate-400 p-1">
                  <div className="space-y-0.5">
                    <div>
                      {mark(h.dm, `DM ${h.dmYears ? `${h.dmYears} ปี` : ''}`)}
                    </div>
                    <div>
                      {mark(h.ht, `HT ${h.htYears ? `${h.htYears} ปี` : ''}`)}
                    </div>
                    <div>
                      {mark(Boolean(h.dlp), `DLP ${h.dlpYears ? `${h.dlpYears} ปี` : ''}`)}
                    </div>
                    <div>
                      {mark(Boolean(h.ckd), `โรคไต ${h.ckdYears ? `${h.ckdYears} ปี` : ''}`)}
                    </div>
                    <div>
                      {mark(
                        h.heartDisease,
                        `โรคหัวใจ ${h.heartDiseaseYears ? `${h.heartDiseaseYears} ปี` : ''}`,
                      )}
                    </div>
                    {h.otherUnderlying.filter(Boolean).map((u, idx) => (
                      <div key={idx}>● {u}</div>
                    ))}
                  </div>
                  <div className="border-l border-slate-400 pl-1.5">
                    <div className="font-semibold">Medication:</div>
                    <div className="whitespace-pre-wrap">{h.medication || '—'}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold">1.5 Previous operation / anesthesia</div>
                {h.previousOps.filter(Boolean).length > 0 ? (
                  h.previousOps.filter(Boolean).map((op, i) => (
                    <div key={i}>
                      {i + 1}. {op}
                    </div>
                  ))
                ) : (
                  <div>—</div>
                )}
                <div>
                  <span className="font-semibold">complication:</span>{' '}
                  {h.previousOpComplication || '—'}
                </div>
              </div>

              <div>
                <span className="font-semibold">1.6 Drinking:</span>{' '}
                {mark(h.drinkingStatus === 'no', 'No')}
                {mark(h.drinkingStatus === 'yes', `Yes (${formatDrinkingDetail(h)})`)}
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

            {/* 3. Investigation */}
            <div className="p-2 space-y-0.5">
              <div className="font-bold text-[11px]">3. Investigation</div>
              <div>
                <span className="font-semibold">3.1 Chest x-ray:</span>{' '}
                {mark(inv.cxrStatus === 'normal', 'Normal')}
                {mark(inv.cxrStatus === 'abnormal', 'Abnormal')}
                {inv.cxrDetail}
              </div>
              <div>
                <span className="font-semibold">3.2 EKG:</span>{' '}
                {mark(inv.ekgStatus === 'normal', 'Normal')}
                {mark(inv.ekgStatus === 'abnormal', 'Abnormal')}
                {inv.ekgDetail}
              </div>
              <div>
                <span className="font-semibold">3.3 Other (ex. CT):</span> {inv.other || '—'}
              </div>
            </div>

            {/* 5. Premedication */}
            <div className="p-2 space-y-0.5">
              <div className="font-bold text-[11px]">5. Premedication</div>
              {pm.items.filter(Boolean).length > 0 ? (
                pm.items.filter(Boolean).map((it, idx) => (
                  <div key={idx}>
                    {idx + 1}. {it}
                  </div>
                ))
              ) : (
                <div>—</div>
              )}
              <div className="pt-0.5">
                <span className="font-semibold">NPO time:</span> {pm.npoTime || '—'} &nbsp;
                <span className="font-semibold">on IVF:</span> {pm.onIvf || '—'}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="divide-y divide-slate-900">
            {/* 2. Physical examination */}
            <div className="p-2 space-y-1">
              <div className="font-bold text-[11px]">2. Physical examination</div>
              <div className="font-mono">
                BW: <strong>{p.bw || '___'}</strong> kg &nbsp; HT:{' '}
                <strong>{p.ht || '___'}</strong> cm &nbsp; BMI:{' '}
                <strong>{p.bmi || '___'}</strong>
              </div>
              <div className="font-mono">
                Vital signs: BP=<strong>{p.bp || '_____'}</strong>mmHg · P=
                <strong>{p.pulse || '___'}</strong>bpm · RR=<strong>{p.rr || '__'}</strong>bpm ·
                T=<strong>{p.temp || '__._'}</strong>°C · SpO2=<strong>{p.spo2 || '__'}</strong>%
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
                  className="w-[76px] h-[48px] shrink-0"
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
              <div>
                <span className="font-semibold">2.4 Breath sound:</span>{' '}
                {mark(p.breathSound === 'normal', 'Normal')}
                {mark(p.breathSound === 'abnormal', 'Abnormal')}
                {p.breathSoundDetail}
              </div>
              <div>
                <span className="font-semibold">2.5 Heart sound:</span>{' '}
                {mark(p.heartSound === 'normal', 'Normal')}
                {mark(p.heartSound === 'abnormal', 'Abnormal')}
                {p.heartSoundDetail}
              </div>
              <div>
                <span className="font-semibold">2.6 Functional Capacity:</span>{' '}
                {p.functionalCapacity || '—'}
              </div>
            </div>

            {/* 4. Laboratory Evaluation */}
            <div className="p-2 space-y-1">
              <div className="font-bold text-[11px]">4. Laboratory Evaluation</div>
              <div className="grid grid-cols-2 gap-2">
                <CbcFishbone lab={lab} readOnly />
                <ChemFishbone lab={lab} readOnly />
              </div>
              <div className="font-mono">
                Coag: PT=<strong>{lab.pt || '—'}</strong>s · PTT=<strong>{lab.ptt || '—'}</strong>s · INR=
                <strong>{lab.inr || '—'}</strong>
              </div>
              <div className="font-mono">
                LFT: SGOT=<strong>{lab.sgot || '—'}</strong> · SGPT=<strong>{lab.sgpt || '—'}</strong> · ALP=
                <strong>{lab.alp || '—'}</strong> · Alb=<strong>{lab.alb || '—'}</strong>
              </div>
              <div>
                Glucose: <strong className="font-mono">{lab.glucose || '—'}</strong> mg/dl · HbA1C:{' '}
                <strong className="font-mono">{lab.hba1c || '—'}</strong> · Other: {lab.other || '—'}
              </div>
              <div className="space-y-0.5">
                <div className="font-mono">
                  Blood component prepare: {box(Boolean(lab.prepTs), 'T&S')} PRC=
                  <strong>{lab.prepPrc || '—'}</strong>u · FFP=
                  <strong>{lab.prepFfp || '—'}</strong>u · Plt=<strong>{lab.prepPlt || '—'}</strong>u
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

            {/* 6. Consult Med/Cardio */}
            <div className="p-2">
              <div className="font-bold text-[11px]">6. Consult Med/Cardio</div>
              <div className="whitespace-pre-wrap">{fd.consult || '—'}</div>
            </div>
          </div>
        </div>

        {/* Lower Sections 7-10 */}
        <div className="p-2 space-y-1 border-b border-slate-900">
          <div>
            <span className="font-bold">7. ASA Classification:</span>{' '}
            {(['I', 'II', 'III', 'IV', 'V', 'VI'] as const).map((cls) =>
              mark(evaluation.asaClass === cls, `Class ${cls}`, `asa_${cls}`),
            )}
            {mark(evaluation.asaEmergency, 'E')}
          </div>
          <div>
            <span className="font-bold">8. Problem list:</span>{' '}
            {fd.problemList.filter(Boolean).length > 0
              ? fd.problemList
                  .filter(Boolean)
                  .map((prob, i) => `${i + 1}) ${prob}`)
                  .join(' · ')
              : '—'}
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
          </div>
          <div>
            <span className="font-bold">10. สิ่งที่ต้องเตรียม (ตาม order วิสัญญีแพทย์):</span>{' '}
            {fd.preparationOrders.filter(Boolean).length > 0
              ? fd.preparationOrders
                  .filter(Boolean)
                  .map((ord, i) => `${i + 1}) ${ord}`)
                  .join(' · ')
              : '—'}
          </div>
        </div>

        {/* Post Anesthesia Evaluation */}
        <div className="p-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold border border-slate-800 px-2 py-0.5">
              Post Anesthesia Evaluation
            </span>
            <span>
              Summarized by: <strong>{pa.summarizedBy || '________________'}</strong> &nbsp; date:{' '}
              <strong className="font-mono">{pa.summarizedDate || '________'}</strong>
            </span>
          </div>
          <div className="font-mono">
            Vital signs: BP=<strong>{pa.bp || '_____'}</strong>mmHg · P=
            <strong>{pa.pulse || '___'}</strong>bpm · RR=<strong>{pa.rr || '__'}</strong>bpm · T=
            <strong>{pa.temp || '__._'}</strong>°C · SpO2=<strong>{pa.spo2 || '__'}</strong>% · PS=
            <strong>{pa.painScore || '__'}</strong> คะแนน
          </div>
          <div className="flex items-center justify-between">
            <span>
              <span className="font-semibold">Post anesthesia complication:</span>{' '}
              {mark(pa.complicationStatus === 'no', 'No')}
              {mark(pa.complicationStatus === 'yes', 'Yes')}
              {pa.complicationDetail}
            </span>
            <span>
              visit by: <strong>{pa.visitBy || '________________'}</strong> &nbsp; date:{' '}
              <strong className="font-mono">{pa.visitDate || '________'}</strong>
            </span>
          </div>
        </div>
      </div>
      <div className="text-right text-[9.5px] text-slate-600 mt-1">
        ANE-FM-002-03 อนุมัติใช้วันที่ 21 มิถุนายน 2564
      </div>
    </div>
  );
}
