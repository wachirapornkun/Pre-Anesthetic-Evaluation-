import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import {
  computeClinicalSummary,
  formatDrinkingDetail,
  formatDrugAddictionDetail,
  formatOxygenSupportSummary,
  formatSmokingDetail,
  PreAnestheticEvaluation,
} from '../types/evaluation';

interface ClinicalSummaryBarProps {
  evaluation: PreAnestheticEvaluation;
}

export function ClinicalSummaryBar({ evaluation }: ClinicalSummaryBarProps) {
  const summary = computeClinicalSummary(evaluation);

  const airwayColor =
    summary.airwayRiskLevel === 'high'
      ? 'text-red-700 bg-red-50 border-red-200'
      : summary.airwayRiskLevel === 'moderate'
      ? 'text-amber-800 bg-amber-50 border-amber-200'
      : summary.airwayRiskLevel === 'low'
      ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
      : 'text-slate-600 bg-slate-100 border-slate-200';

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
      className="no-print bg-white border border-slate-200 rounded-xl p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500">
            สรุปผลทางคลินิกทันที (Real-time Pre-Op Summary)
          </div>
          <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">
            {summary.clinicalBrief}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-xs text-slate-500">ความครบถ้วนของแบบฟอร์ม</div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-800 transition-all duration-200"
                  style={{ width: `${summary.completenessPercent}%` }}
                />
              </div>
              <span className="font-mono tabular-nums text-xs font-semibold text-slate-900">
                {summary.completenessPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Key Instant Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
        <div>
          <div className="text-xs text-slate-500">ASA Classification</div>
          <div
            className={`mt-0.5 text-sm font-semibold tabular-nums ${
              asaHighRisk ? 'text-red-700' : 'text-slate-900'
            }`}
          >
            {summary.asaLabel}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500">BMI (น้ำหนัก/ส่วนสูง)</div>
          <div className="mt-0.5 text-sm font-semibold font-mono tabular-nums text-slate-900">
            {summary.bmiLabel}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500">ประเมิน Airway</div>
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

        <div>
          <div className="text-xs text-slate-500">NPO &amp; สารน้ำ (IVF)</div>
          <div className="mt-0.5 text-xs font-medium text-slate-800 truncate">
            {evaluation.formData.premedication.npoTime || 'ยังไม่ระบุ NPO'}
            {evaluation.formData.premedication.onIvf
              ? ` · ${evaluation.formData.premedication.onIvf}`
              : ''}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500">การจองเลือด (Blood Prep)</div>
          <div className="mt-0.5 text-xs font-semibold font-mono tabular-nums text-slate-900 truncate">
            {summary.bloodPrepSummary}
          </div>
        </div>
      </div>

      {/* Clinical Alerts Row (if any allergy, airway details, oxygen support, underlying, medication, substance, or abnormal labs) */}
      {(summary.allergyFlag ||
        summary.airwayReasons.length > 0 ||
        Boolean(formatOxygenSupportSummary(evaluation.formData.physicalExam.oxygenSupport)) ||
        summary.labAlerts.length > 0 ||
        summary.underlyingTags.length > 0 ||
        evaluation.formData.history.medication.trim().length > 0 ||
        evaluation.formData.history.smokingStatus === 'yes' ||
        evaluation.formData.history.drinkingStatus === 'yes' ||
        evaluation.formData.history.drugAddictionStatus === 'yes') && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          {summary.allergyFlag && (
            <span className="inline-flex items-center gap-1 font-semibold text-red-700">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {summary.allergyFlag}
            </span>
          )}
          {summary.airwayReasons.length > 0 && (
            <span className="text-amber-800 font-medium">
              Airway findings: {summary.airwayReasons.join(', ')}
            </span>
          )}
          {formatOxygenSupportSummary(evaluation.formData.physicalExam.oxygenSupport) && (
            <span className="text-blue-900 font-medium">
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
          {evaluation.formData.history.medication.trim() && (
            <span className="text-slate-700">
              ยาประจำ: <strong className="font-semibold">{evaluation.formData.history.medication.trim()}</strong>
            </span>
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
            <span className="text-red-700">
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
                alert.level === 'critical' ? 'text-red-700' : 'text-amber-700'
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
