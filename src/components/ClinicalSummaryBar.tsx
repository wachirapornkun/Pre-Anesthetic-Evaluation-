import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import {
  computeClinicalSummary,
  formatDrinkingDetail,
  formatDrugAddictionDetail,
  formatOxygenSupportSummary,
  formatSmokingDetail,
  getMedicationLines,
  getPostOpVisitCompleteness,
  PreAnestheticEvaluation,
} from '../types/evaluation';

interface ClinicalSummaryBarProps {
  evaluation: PreAnestheticEvaluation;
}

export function ClinicalSummaryBar({ evaluation }: ClinicalSummaryBarProps) {
  const summary = computeClinicalSummary(evaluation);
  const postOpStatus = getPostOpVisitCompleteness(
    evaluation.formData.postAnesthesia,
    evaluation.formData.postOpComplication,
  );
  const medicationLines = getMedicationLines(evaluation.formData.history.medication);

  const airwayColor =
    summary.airwayRiskLevel === 'high'
      ? 'text-prose-800 bg-prose-50 border-prose-200'
      : summary.airwayRiskLevel === 'moderate'
      ? 'text-pyellow-800 bg-pyellow-50 border-pyellow-200'
      : summary.airwayRiskLevel === 'low'
      ? 'text-pgreen-800 bg-pgreen-50 border-pgreen-200'
      : 'text-slate-600 bg-slate-50 border-pborder';

  const airwayLabel =
    summary.airwayRiskLevel === 'high'
      ? 'ความเสี่ยง Airway สูง'
      : summary.airwayRiskLevel === 'moderate'
      ? 'เฝ้าระวัง Airway'
      : summary.airwayRiskLevel === 'low'
      ? 'Airway ปกติ'
      : 'รอประเมิน Airway';

  const asaHighRisk =
    evaluation.asaClass === 'III' ||
    evaluation.asaClass === 'IV' ||
    evaluation.asaClass === 'V' ||
    evaluation.asaClass === 'VI' ||
    evaluation.asaEmergency;

  return (
    <section
      aria-label="สรุปผลทางคลินิกทันที"
      className="no-print bg-white border border-pborder rounded-xl p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-pblue-800/80">
            สรุปผลทางคลินิกทันที (Real-time Pre-Op Summary)
          </div>
          <p className="text-sm font-semibold text-[#243040] truncate mt-0.5">
            {summary.clinicalBrief}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-xs text-slate-500">การเยี่ยมหลังผ่าตัด</div>
            <div
              className={`mt-0.5 text-xs font-semibold inline-flex items-center gap-1 ${
                postOpStatus.isComplete ? 'text-pgreen-800' : 'text-pyellow-800'
              }`}
            >
              {postOpStatus.isComplete ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-pgreen-600" />
                  <span>เยี่ยมหลังผ่าตัดแล้ว</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-pyellow-600" />
                  <span>
                    ยังไม่ได้เยี่ยมหลังผ่าตัด
                    {postOpStatus.hasAnyInput
                      ? ` (ลงข้อมูลไม่ครบ ${postOpStatus.filledCount}/${postOpStatus.totalRequired})`
                      : ''}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500">ความครบถ้วนของแบบฟอร์ม</div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-24 h-2 bg-pblue-50 border border-pblue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pblue-400 to-pgreen-400 transition-all duration-200 rounded-full"
                  style={{ width: `${summary.completenessPercent}%` }}
                />
              </div>
              <span className="font-mono tabular-nums text-xs font-semibold text-pblue-800">
                {summary.completenessPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Key Instant Metrics with delicate pastel surface accents */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2.5 border-t border-pborder/70">
        <div className="rounded-lg bg-pblue-50/60 border border-pblue-100 px-3 py-2">
          <div className="text-xs text-pblue-800/80">ASA Classification</div>
          <div
            className={`mt-0.5 text-sm font-semibold tabular-nums ${
              asaHighRisk ? 'text-prose-800' : 'text-[#243040]'
            }`}
          >
            {summary.asaLabel}
          </div>
        </div>

        <div className="rounded-lg bg-pgreen-50/60 border border-pgreen-100 px-3 py-2">
          <div className="text-xs text-pgreen-800/80">BMI (น้ำหนัก/ส่วนสูง)</div>
          <div className="mt-0.5 text-sm font-semibold font-mono tabular-nums text-[#243040]">
            {summary.bmiLabel}
          </div>
        </div>

        <div className="rounded-lg bg-pyellow-50/55 border border-pyellow-100 px-3 py-2">
          <div className="text-xs text-pyellow-800/80">ประเมิน Airway</div>
          <div
            className={`mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded border ${airwayColor}`}
          >
            {summary.airwayRiskLevel === 'high' ? (
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            ) : summary.airwayRiskLevel === 'moderate' ? (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{airwayLabel}</span>
          </div>
        </div>

        <div className="rounded-lg bg-prose-50/75 border border-prose-200 px-3 py-2">
          <div className="text-xs font-bold text-prose-800">NPO (งดน้ำและอาหาร)</div>
          <div
            className={`mt-0.5 leading-snug ${
              evaluation.formData.premedication.npoTime.trim()
                ? 'text-base font-extrabold text-prose-800'
                : 'text-xs font-medium text-slate-500'
            }`}
          >
            {evaluation.formData.premedication.npoTime.trim() || 'ยังไม่ระบุ NPO'}
          </div>
          {evaluation.formData.premedication.onIvf.trim() && (
            <div className="mt-0.5 text-[11px] text-slate-600 truncate">
              IVF: {evaluation.formData.premedication.onIvf.trim()}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-ppink-50/65 border border-ppink-100 px-3 py-2">
          <div className="text-xs text-ppink-800/85">การจองเลือด (Blood Prep)</div>
          <div className="mt-0.5 text-xs font-semibold font-mono tabular-nums text-[#243040] truncate">
            {summary.bloodPrepSummary}
          </div>
        </div>
      </div>

      {/* Clinical Alerts Row */}
      {(summary.allergyFlag ||
        summary.airwayReasons.length > 0 ||
        Boolean(formatOxygenSupportSummary(evaluation.formData.physicalExam.oxygenSupport)) ||
        summary.labAlerts.length > 0 ||
        summary.underlyingTags.length > 0 ||
        medicationLines.length > 0 ||
        evaluation.formData.history.smokingStatus === 'yes' ||
        evaluation.formData.history.drinkingStatus === 'yes' ||
        evaluation.formData.history.drugAddictionStatus === 'yes') && (
        <div className="pt-2 border-t border-pborder/70 flex flex-wrap items-start gap-x-4 gap-y-1.5 text-xs">
          {summary.allergyFlag && (
            <span className="inline-flex items-center gap-1 font-semibold text-prose-800">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-prose-600" />
              {summary.allergyFlag}
            </span>
          )}
          {summary.airwayReasons.length > 0 && (
            <span className="text-pyellow-800 font-medium">
              Airway findings: {summary.airwayReasons.join(', ')}
            </span>
          )}
          {formatOxygenSupportSummary(evaluation.formData.physicalExam.oxygenSupport) && (
            <span className="text-pblue-800 font-medium">
              O2/Vent:{' '}
              <strong className="font-semibold">
                {formatOxygenSupportSummary(evaluation.formData.physicalExam.oxygenSupport)}
              </strong>
            </span>
          )}
          {summary.underlyingTags.length > 0 && (
            <span className="text-slate-700">
              โรคประจำตัว: <strong className="font-semibold">{summary.underlyingTags.join(', ')}</strong>
            </span>
          )}
          {medicationLines.length > 0 && (
            <div className="text-slate-700 inline-flex items-start gap-1">
              <span className="shrink-0">ยาประจำ:</span>
              <div className="font-semibold leading-snug">
                {medicationLines.map((med, idx) => (
                  <div key={idx}>{med}</div>
                ))}
              </div>
            </div>
          )}
          {evaluation.formData.history.smokingStatus === 'yes' && (
            <span className="text-slate-700">
              สูบบุหรี่:{' '}
              <strong className="font-semibold">
                {formatSmokingDetail(evaluation.formData.history)}
              </strong>
            </span>
          )}
          {evaluation.formData.history.drinkingStatus === 'yes' && (
            <span className="text-slate-700">
              ดื่มสุรา:{' '}
              <strong className="font-semibold">
                {formatDrinkingDetail(evaluation.formData.history)}
              </strong>
            </span>
          )}
          {evaluation.formData.history.drugAddictionStatus === 'yes' && (
            <span className="text-prose-800">
              ยาเสพติด:{' '}
              <strong className="font-semibold">
                {formatDrugAddictionDetail(evaluation.formData.history) || 'มีประวัติใช้สารเสพติด'}
              </strong>
            </span>
          )}
          {summary.labAlerts.map((alert, idx) => (
            <span
              key={idx}
              className={`font-medium ${
                alert.level === 'critical' ? 'text-prose-800' : 'text-pyellow-800'
              }`}
            >
              [{alert.category}] {alert.message}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
