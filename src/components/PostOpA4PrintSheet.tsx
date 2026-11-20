import React from 'react';
import {
  createEmptyPostOpComplication,
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

  const mark = (active: boolean, text: string, keyProp?: string) => (
    <span key={keyProp} className="inline-flex items-center gap-0.5 mr-2 whitespace-nowrap">
      <span className="font-mono">{active ? '●' : '○'}</span>
      <span className={active ? 'font-bold underline' : ''}>{text}</span>
    </span>
  );

  const box = (active: boolean, text: string, keyProp?: string) => (
    <span key={keyProp} className="inline-flex items-center gap-1 mr-3 whitespace-nowrap">
      <span className="font-mono">{active ? '☑' : '☐'}</span>
      <span className={active ? 'font-bold' : ''}>{text}</span>
    </span>
  );

  const renderRow = (
    item: (typeof POST_OP_LEFT_COMPLICATIONS)[number] | (typeof POST_OP_RIGHT_COMPLICATIONS)[number],
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

    return (
      <tr key={item.key} className="border-b border-slate-700">
        <td className="px-1.5 py-[1.5px] leading-[1.2]">{labelText}</td>
        <td className="w-[46px] border-l border-slate-700 text-center font-mono font-bold">
          {peri ? '✓' : ''}
        </td>
        <td className="w-[46px] border-l border-slate-700 text-center font-mono font-bold">
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
          ? 'bg-white border border-slate-300 shadow-sm mx-auto max-w-[820px] p-4 text-[10px] leading-[1.25] text-slate-950'
          : 'hidden print-only-sheet text-[9.5px] leading-[1.22] text-black'
      }
    >
      {/* Top Title */}
      <div className="text-center font-bold text-[13px] mb-1">
        รายงาน Complication งานวิสัญญี โรงพยาบาลบางพลี
      </div>

      {/* Patient Reference Line */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[9.5px] mb-1 px-0.5">
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
          <strong>Ward:</strong> {evaluation.ward || '________'}
        </span>
        <span>
          <strong>Op:</strong> {evaluation.operation || '______________'}
        </span>
        <span>
          <strong>Date of Op:</strong>{' '}
          <span className="font-mono">{evaluation.dateOfOperation || '__________'}</span>
        </span>
      </div>

      {/* Main Bordered Table matching ANE-FM-006-01 */}
      <div className="border-[1.5px] border-slate-900">
        <div className="grid grid-cols-2 border-b border-slate-900">
          {/* Left 34 Complication rows */}
          <div className="border-r border-slate-900">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-100 font-bold">
                  <th className="px-1.5 py-1 text-center">Complication</th>
                  <th className="w-[46px] border-l border-slate-900 py-1 text-center">Peri op</th>
                  <th className="w-[46px] border-l border-slate-900 py-1 text-center">Post op</th>
                </tr>
              </thead>
              <tbody>{POST_OP_LEFT_COMPLICATIONS.map((item) => renderRow(item))}</tbody>
            </table>
          </div>

          {/* Right column */}
          <div className="flex flex-col">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-100 font-bold">
                  <th className="px-1.5 py-1 text-center">Complication</th>
                  <th className="w-[46px] border-l border-slate-900 py-1 text-center">Peri op</th>
                  <th className="w-[46px] border-l border-slate-900 py-1 text-center">Post op</th>
                </tr>
              </thead>
              <tbody>{POST_OP_RIGHT_COMPLICATIONS.map((item) => renderRow(item))}</tbody>
            </table>

            {/* None problem */}
            <div className="px-2 py-1 border-b border-slate-900 font-semibold">
              {box(pc.noneProblem, 'None problem')}
            </div>

            {/* OUT COME */}
            <div className="border-b border-slate-900">
              <div className="text-center font-bold bg-slate-100 border-b border-slate-700 py-0.5">
                OUT COME
              </div>
              <div className="divide-y divide-slate-400">
                {POST_OP_OUTCOME_OPTIONS.slice(0, 6).map((opt) => (
                  <div key={opt.key} className="px-2 py-[2px] flex items-center gap-1.5">
                    <span className="font-mono">{pc.outcomes.includes(opt.key) ? '☑' : '☐'}</span>
                    <span>
                      {opt.number}.{' '}
                      <span className={pc.outcomes.includes(opt.key) ? 'font-bold underline' : ''}>
                        {opt.label}
                      </span>
                    </span>
                  </div>
                ))}
                <div className="px-2 py-[2px] flex items-center gap-2">
                  <span>7.</span>
                  {POST_OP_OUTCOME_OPTIONS.slice(6).map((opt) =>
                    box(pc.outcomes.includes(opt.key), opt.label, opt.key),
                  )}
                </div>
              </div>
            </div>

            {/* Incident report */}
            <div className="border-b border-slate-900">
              <div className="text-center font-bold bg-slate-100 border-b border-slate-700 py-0.5">
                Incident report
              </div>
              <div className="px-2 py-1 text-center">
                {POST_OP_INCIDENT_OPTIONS.map((opt) =>
                  box(pc.incidentTypes.includes(opt.key), opt.label, opt.key),
                )}
              </div>
            </div>

            {/* ระดับความรุนแรง */}
            <div className="border-b border-slate-900">
              <div className="text-center font-bold bg-slate-100 border-b border-slate-700 py-0.5">
                ระดับความรุนแรง
              </div>
              <div className="px-2 py-1 text-center font-mono">
                {POST_OP_SEVERITY_LEVELS.map((lvl) => (
                  <span
                    key={lvl}
                    className={`inline-block mx-1.5 px-1 ${
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
              <div className="text-center font-bold bg-slate-100 border-b border-slate-700 py-0.5">
                Administration error
              </div>
              <div className="px-2 py-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
                {POST_OP_ADMIN_ERROR_OPTIONS.map((opt) => (
                  <div key={opt.key}>
                    <span className="font-mono mr-1">
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

            {/* Remark */}
            <div className="px-2 py-1 border-b border-slate-900 flex-1 min-h-[72px]">
              <div className="font-bold">Remark :</div>
              <div className="whitespace-pre-wrap pt-0.5">{pc.remark || ''}</div>
            </div>

            {/* Recorders */}
            <div className="px-2 py-1 space-y-1 text-[9.5px]">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span>
                  ผู้บันทึกข้อมูล Peri op:{' '}
                  <strong>{pc.periOpRecorder || '_________________'}</strong>
                </span>
                <span>
                  วันที่ <strong className="font-mono">{pc.periOpDate || '________'}</strong> เวลา{' '}
                  <strong className="font-mono">{pc.periOpTime || '______'}</strong>
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span>
                  ผู้บันทึกข้อมูล Post op:{' '}
                  <strong>{pc.postOpRecorder || '_________________'}</strong>
                </span>
                <span>
                  วันที่ <strong className="font-mono">{pc.postOpDate || '________'}</strong> เวลา{' '}
                  <strong className="font-mono">{pc.postOpTime || '______'}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Moved Post Anesthesia Evaluation */}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
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

      <div className="text-right text-[9px] text-slate-600 mt-0.5">
        ANE-FM-006-01 อนุมัติใช้วันที่ 1 ก.พ.65
      </div>
    </div>
  );
}
