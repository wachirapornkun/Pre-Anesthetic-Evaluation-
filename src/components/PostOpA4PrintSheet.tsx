import React from 'react';
import {
  createEmptyPostOpComplication,
  formatThaiDateBE,
  formatWardWithBed,
  getEffectiveNoneProblemFlags,
  POST_OP_ADMIN_ERROR_OPTIONS,
  POST_OP_INCIDENT_OPTIONS,
  POST_OP_LEFT_COMPLICATIONS,
  POST_OP_OUTCOME_OPTIONS,
  POST_OP_RIGHT_COMPLICATIONS,
  POST_OP_SEVERITY_LEVELS,
  PreAnestheticEvaluation,
} from '../types/evaluation';

interface PostOpA4PrintSheetProps {
  evaluation: PreAnestheticEvaluation;
  previewMode?: boolean;
  pageBreakBefore?: boolean;
}

export function PostOpA4PrintSheet({
  evaluation,
  previewMode = false,
  pageBreakBefore = false,
}: PostOpA4PrintSheetProps) {
  const fd = evaluation.formData;
  const pa = fd.postAnesthesia;
  const pc = fd.postOpComplication ?? createEmptyPostOpComplication();
  const noneProblemFlags = getEffectiveNoneProblemFlags(pc);
  const unifiedPostOpVisitor = (pa.visitBy || pc.postOpRecorder || '').trim();
  const unifiedPostOpDate = (pa.visitDate || pc.postOpDate || '').trim();

  const mark = (active: boolean, text: string, keyProp?: string) => (
    <span key={keyProp} className="inline-flex items-center gap-1 mr-2.5 whitespace-nowrap">
      <span className="font-mono text-[11.5px]">{active ? '●' : '○'}</span>
      <span className={active ? 'font-bold underline' : ''}>{text}</span>
    </span>
  );

  const box = (active: boolean, text: string, keyProp?: string) => (
    <span key={keyProp} className="inline-flex items-center gap-1 mr-3 whitespace-nowrap">
      <span className="font-mono text-[11.5px]">{active ? '☑' : '☐'}</span>
      <span className={active ? 'font-bold' : ''}>{text}</span>
    </span>
  );

  const renderRow = (
    item: (typeof POST_OP_LEFT_COMPLICATIONS)[number] | (typeof POST_OP_RIGHT_COMPLICATIONS)[number],
    cellPadding = 'py-[2.5px]',
  ) => {
    const peri = pc.periOpComplications.includes(item.key);
    const post = pc.postOpComplications.includes(item.key);
    let labelText: string = item.label;
    if (item.key === 'difficult_intubation') {
      labelText = `Difficult intubation LV gr ${pc.difficultIntubationGrade || '...........'}`;
    } else if (item.key === 'pain_score_gt4') {
      labelText = `Pain score >4 / PS= ${pc.painScoreDetail || '.......'}`;
    } else if (item.key === 'other_complication') {
      labelText = pc.otherComplicationDetail?.trim()
        ? `อื่นๆ : ${pc.otherComplicationDetail.trim()}`
        : 'อื่นๆ ........................................';
    }
    const isLongHypotension = item.key === 'hypotension';

    return (
      <tr key={item.key} className="border-b border-slate-700 last:border-b-0">
        <td
          className={`px-1.5 ${cellPadding} ${
            isLongHypotension
              ? 'text-[9px] leading-[1.12]'
              : 'leading-[1.22]'
          }`}
        >
          {labelText}
        </td>
        <td className={`w-[48px] border-l border-slate-700 text-center font-mono font-bold text-[12px] ${cellPadding}`}>
          {peri ? '✓' : ''}
        </td>
        <td className={`w-[48px] border-l border-slate-700 text-center font-mono font-bold text-[12px] ${cellPadding}`}>
          {post ? '✓' : ''}
        </td>
      </tr>
    );
  };

  return (
    <div
      style={pageBreakBefore ? { breakBefore: 'page', pageBreakBefore: 'always' } : undefined}
      className={
        previewMode
          ? `a4-single-page post-op-single-a4 flex flex-col bg-white border border-slate-300 shadow-sm mx-auto w-full max-w-[794px] min-h-[1123px] p-5 text-[11px] leading-[1.24] text-slate-950 print:border-0 print:shadow-none print:max-w-none print:min-h-0 print:p-0 ${pageBreakBefore ? 'a4-page-break-before' : ''}`
          : `hidden print-only-sheet a4-single-page post-op-single-a4 flex-col text-[10.8px] leading-[1.22] text-black ${pageBreakBefore ? 'a4-page-break-before' : ''}`
      }
    >
      {/* Top Title */}
      <div className="text-center font-bold text-[16px] leading-tight mb-1.5 shrink-0">
        รายงาน Complication งานวิสัญญี โรงพยาบาลบางพลี
      </div>

      {/* Patient Reference Line */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[11px] leading-[1.3] mb-1.5 px-1 shrink-0">
        <span>
          <strong>Name:</strong> {evaluation.patientName || '___________________'}
        </span>
        <span>
          <strong>Age:</strong>{' '}
          <span className="font-mono">{evaluation.age || '___'}</span> ปี
        </span>
        <span>
          <strong>HN:</strong> <span className="font-mono">{evaluation.hn || '_________'}</span>
        </span>
        <span>
          <strong>AN:</strong> <span className="font-mono">{evaluation.an || '_________'}</span>
        </span>
        <span>
          <strong>Ward:</strong> {formatWardWithBed(evaluation.ward, evaluation.bed) || '________'}
        </span>
        <span>
          <strong>Op:</strong> {evaluation.operation || '______________'}
        </span>
        <span>
          <strong>Date of Op:</strong>{' '}
          <span className="font-mono">{formatThaiDateBE(evaluation.dateOfOperation) || '__________'}</span>
        </span>
      </div>

      {/* Main Bordered Table matching ANE-FM-006-01 (Fills 1 Full A4 Page) */}
      <div className="border-[1.5px] border-slate-900 flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-2 border-b border-slate-900 flex-1 min-h-0">
          {/* Left 35 Complication rows — stretches cleanly to fill full column height */}
          <div className="border-r border-slate-900 flex flex-col h-full">
            <table className="w-full h-full border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-100 font-bold text-[11px]">
                  <th className="px-1.5 py-1 text-center">Complication</th>
                  <th className="w-[48px] border-l border-slate-900 py-1 text-center whitespace-nowrap">
                    Peri op
                  </th>
                  <th className="w-[48px] border-l border-slate-900 py-1 text-center whitespace-nowrap">
                    Post op
                  </th>
                </tr>
              </thead>
              <tbody>{POST_OP_LEFT_COMPLICATIONS.map((item) => renderRow(item, 'py-[2.5px]'))}</tbody>
            </table>
          </div>

          {/* Right column */}
          <div className="flex flex-col h-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-100 font-bold text-[11px]">
                  <th className="px-1.5 py-1 text-center">Complication</th>
                  <th className="w-[48px] border-l border-slate-900 py-1 text-center whitespace-nowrap">
                    Peri op
                  </th>
                  <th className="w-[48px] border-l border-slate-900 py-1 text-center whitespace-nowrap">
                    Post op
                  </th>
                </tr>
              </thead>
              <tbody>
                {POST_OP_RIGHT_COMPLICATIONS.map((item) => renderRow(item, 'py-[2.8px]'))}
                <tr className="border-t border-b border-slate-900 font-semibold">
                  <td className="px-1.5 py-[3.5px] leading-[1.22]">None problem</td>
                  <td className="w-[48px] border-l border-slate-700 text-center font-mono font-bold text-[12px] py-[3.5px]">
                    {noneProblemFlags.periOp ? '✓' : ''}
                  </td>
                  <td className="w-[48px] border-l border-slate-700 text-center font-mono font-bold text-[12px] py-[3.5px]">
                    {noneProblemFlags.postOp ? '✓' : ''}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* OUT COME */}
            <div className="border-b border-slate-900">
              <div className="text-center font-bold bg-slate-100 border-b border-slate-700 py-1 text-[11px]">
                OUT COME
              </div>
              <div className="divide-y divide-slate-400">
                {POST_OP_OUTCOME_OPTIONS.slice(0, 6).map((opt) => (
                  <div key={opt.key} className="px-2 py-[2.8px] flex items-center gap-1.5 leading-[1.24]">
                    <span className="font-mono text-[11.5px]">
                      {pc.outcomes.includes(opt.key) ? '☑' : '☐'}
                    </span>
                    <span>
                      {opt.number}.{' '}
                      <span className={pc.outcomes.includes(opt.key) ? 'font-bold underline' : ''}>
                        {opt.label}
                      </span>
                    </span>
                  </div>
                ))}
                <div className="px-2 py-[2.8px] flex items-center gap-2 leading-[1.24]">
                  <span>7.</span>
                  {POST_OP_OUTCOME_OPTIONS.slice(6).map((opt) =>
                    box(pc.outcomes.includes(opt.key), opt.label, opt.key),
                  )}
                </div>
              </div>
            </div>

            {/* Incident report */}
            <div className="border-b border-slate-900">
              <div className="text-center font-bold bg-slate-100 border-b border-slate-700 py-1 text-[11px]">
                Incident report
              </div>
              <div className="px-2 py-1.5 text-center">
                {POST_OP_INCIDENT_OPTIONS.map((opt) =>
                  box(pc.incidentTypes.includes(opt.key), opt.label, opt.key),
                )}
              </div>
            </div>

            {/* ระดับความรุนแรง */}
            <div className="border-b border-slate-900">
              <div className="text-center font-bold bg-slate-100 border-b border-slate-700 py-1 text-[11px]">
                ระดับความรุนแรง
              </div>
              <div className="px-2 py-1.5 text-center font-mono text-[11.5px]">
                {POST_OP_SEVERITY_LEVELS.map((lvl) => (
                  <span
                    key={lvl}
                    className={`inline-block mx-1.5 px-1.5 ${
                      pc.severityLevel === lvl
                        ? 'font-bold border border-slate-900 rounded-full'
                        : ''
                    }`}
                  >
                    {lvl}
                  </span>
                ))}
              </div>
            </div>

            {/* Administration error */}
            <div className="border-b border-slate-900">
              <div className="text-center font-bold bg-slate-100 border-b border-slate-700 py-1 text-[11px]">
                Administration error
              </div>
              <div className="px-2 py-1.5 grid grid-cols-2 gap-x-2 gap-y-1 leading-[1.25]">
                {POST_OP_ADMIN_ERROR_OPTIONS.map((opt) => (
                  <div key={opt.key}>
                    <span className="font-mono text-[11.5px] mr-1">
                      {pc.administrationErrors.includes(opt.key) ? '☑' : '☐'}
                    </span>
                    <span
                      className={
                        pc.administrationErrors.includes(opt.key) ? 'font-bold underline' : ''
                      }
                    >
                      {opt.number}. {opt.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Remark — stretches naturally to align both columns flush at bottom */}
            <div className="px-2 py-1.5 border-b border-slate-900 flex-1 min-h-[110px] overflow-hidden">
              <div className="font-bold leading-[1.24]">Remark :</div>
              <div className="whitespace-pre-wrap pt-1 leading-[1.3]">{pc.remark || ''}</div>
            </div>

            {/* Peri op Recorder */}
            <div className="px-2 py-1.5 text-[10.5px] leading-[1.28] shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span>
                  ผู้บันทึกข้อมูล Peri op:{' '}
                  <strong>{pc.periOpRecorder || '_________________'}</strong>
                </span>
                <span>
                  วันที่ <strong className="font-mono">{formatThaiDateBE(pc.periOpDate) || '________'}</strong> เวลา{' '}
                  <strong className="font-mono">{pc.periOpTime || '______'}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Post Anesthesia Evaluation */}
        <div className="px-2.5 py-2 space-y-1.5 text-[11px] leading-[1.35] shrink-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-bold border border-slate-800 px-2 py-0.5 shrink-0">
              Post Anesthesia Evaluation
            </span>
            <span className="font-semibold">Vital signs:</span>
            <span>
              BP{' '}
              <span className="inline-block min-w-[68px] border-b border-dotted border-slate-600 px-1 text-center font-mono">
                {pa.bp?.trim() ? <strong>{pa.bp.trim()}</strong> : '\u00A0'}
              </span>{' '}
              mmHg
            </span>
            <span>
              P{' '}
              <span className="inline-block min-w-[42px] border-b border-dotted border-slate-600 px-1 text-center font-mono">
                {pa.pulse?.trim() ? <strong>{pa.pulse.trim()}</strong> : '\u00A0'}
              </span>{' '}
              /min
            </span>
            <span>
              RR{' '}
              <span className="inline-block min-w-[40px] border-b border-dotted border-slate-600 px-1 text-center font-mono">
                {pa.rr?.trim() ? <strong>{pa.rr.trim()}</strong> : '\u00A0'}
              </span>{' '}
              /min
            </span>
            <span>
              T{' '}
              <span className="inline-block min-w-[42px] border-b border-dotted border-slate-600 px-1 text-center font-mono">
                {pa.temp?.trim() ? <strong>{pa.temp.trim()}</strong> : '\u00A0'}
              </span>{' '}
              °C
            </span>
            <span>
              SpO2{' '}
              <span className="inline-block min-w-[42px] border-b border-dotted border-slate-600 px-1 text-center font-mono">
                {pa.spo2?.trim() ? <strong>{pa.spo2.trim()}</strong> : '\u00A0'}
              </span>{' '}
              %
            </span>
            <span>
              PS{' '}
              <span className="inline-block min-w-[38px] border-b border-dotted border-slate-600 px-1 text-center font-mono">
                {pa.painScore?.trim() ? <strong>{pa.painScore.trim()}</strong> : '\u00A0'}
              </span>{' '}
              คะแนน
            </span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-2.5 gap-y-1">
            <span>
              <span className="font-semibold">Post anesthesia complication:</span>{' '}
              {mark(pa.complicationStatus === 'no', 'No')}
              {mark(pa.complicationStatus === 'yes', 'Yes')}
              <span className="inline-block min-w-[115px] border-b border-dotted border-slate-600 px-1">
                {pa.complicationDetail?.trim() || '\u00A0'}
              </span>
            </span>
            <span>
              ผู้บันทึกข้อมูล Post op / visit by:{' '}
              <span className="inline-block min-w-[115px] border-b border-dotted border-slate-600 px-1 text-center">
                {unifiedPostOpVisitor ? <strong>{unifiedPostOpVisitor}</strong> : '\u00A0'}
              </span>{' '}
              วันที่{' '}
              <span className="inline-block min-w-[68px] border-b border-dotted border-slate-600 px-1 text-center font-mono">
                {formatThaiDateBE(unifiedPostOpDate) ? (
                  <strong>{formatThaiDateBE(unifiedPostOpDate)}</strong>
                ) : (
                  '\u00A0'
                )}
              </span>
              {pc.postOpTime ? (
                <>
                  {' '}
                  เวลา <strong className="font-mono">{pc.postOpTime}</strong>
                </>
              ) : null}
            </span>
          </div>
        </div>
      </div>

      <div className="text-right text-[9.5px] text-slate-600 mt-1 leading-none shrink-0">
        ANE-FM-006-01 อนุมัติใช้วันที่ 1 ก.พ.65
      </div>
    </div>
  );
}
