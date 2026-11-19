import React, { useMemo, useState } from 'react';
import { Download, FilePlus2, Printer, Sparkles } from 'lucide-react';
import { AsaClass, PreAnestheticEvaluation } from '../types/evaluation';
import { exportEvaluationsCsv } from '../utils/exportReports';

interface DashboardViewProps {
  records: PreAnestheticEvaluation[];
  wardOptions: string[];
  onCreateNew: () => void;
  onLoadSamples: () => void;
  onSelectRecord: (record: PreAnestheticEvaluation) => void;
  isLoading: boolean;
}

export function DashboardView({
  records,
  wardOptions,
  onCreateNew,
  onLoadSamples,
  onSelectRecord,
  isLoading,
}: DashboardViewProps) {
  const [wardFilter, setWardFilter] = useState<string>('ALL');
  const [asaFilter, setAsaFilter] = useState<string>('ALL');

  const wards = useMemo(() => {
    const set = new Set<string>([...wardOptions, 'อื่นๆ']);
    records.forEach((r) => {
      if (r.ward.trim()) set.add(r.ward.trim());
    });
    return Array.from(set);
  }, [records, wardOptions]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (wardFilter !== 'ALL' && r.ward.trim() !== wardFilter) return false;
      if (asaFilter !== 'ALL' && r.asaClass !== asaFilter) return false;
      return true;
    });
  }, [records, wardFilter, asaFilter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const emergencyCount = filtered.filter((r) => r.asaEmergency).length;
    const highRiskAsa = filtered.filter((r) =>
      ['III', 'IV', 'V', 'VI'].includes(r.asaClass),
    ).length;
    const difficultAirway = filtered.filter((r) => r.expectedDifficultAirway).length;
    const mallampatiHigh = filtered.filter((r) =>
      ['III', 'IV'].includes(r.formData.physicalExam.mallampatiClass),
    ).length;
    const postOpDone = filtered.filter((r) => r.status === 'post_op_completed').length;
    const complications = filtered.filter((r) => r.hasComplication).length;

    let prcUnits = 0;
    let ffpUnits = 0;
    let pltUnits = 0;
    filtered.forEach((r) => {
      prcUnits += parseInt(r.formData.laboratory.prepPrc || '0', 10) || 0;
      ffpUnits += parseInt(r.formData.laboratory.prepFfp || '0', 10) || 0;
      pltUnits += parseInt(r.formData.laboratory.prepPlt || '0', 10) || 0;
    });

    const asaCounts: Record<Exclude<AsaClass, ''> | 'Unspecified', number> = {
      I: 0,
      II: 0,
      III: 0,
      IV: 0,
      V: 0,
      VI: 0,
      Unspecified: 0,
    };
    filtered.forEach((r) => {
      if (r.asaClass) asaCounts[r.asaClass] += 1;
      else asaCounts.Unspecified += 1;
    });

    const planCounts = {
      GA_Intubation: 0,
      GA_LMA: 0,
      GA_TIVA_Mask: 0,
      RA_Spinal: 0,
      RA_Epidural_Nerve: 0,
    };
    filtered.forEach((r) => {
      const ap = r.formData.anestheticPlan;
      if (ap.gaMethods.includes('Intubation')) planCounts.GA_Intubation += 1;
      if (ap.gaMethods.includes('LMA')) planCounts.GA_LMA += 1;
      if (ap.gaMethods.includes('TIVA') || ap.gaMethods.includes('Mask')) {
        planCounts.GA_TIVA_Mask += 1;
      }
      if (ap.raMethods.includes('Spinal block')) planCounts.RA_Spinal += 1;
      if (ap.raMethods.includes('Epidural') || ap.raMethods.includes('Nerve block')) {
        planCounts.RA_Epidural_Nerve += 1;
      }
    });

    const comorbidityCounts = [
      { label: 'Diabetes Mellitus (DM)', count: filtered.filter((r) => r.formData.history.dm).length },
      { label: 'Hypertension (HT)', count: filtered.filter((r) => r.formData.history.ht).length },
      { label: 'Dyslipidemia (DLP)', count: filtered.filter((r) => r.formData.history.dlp).length },
      { label: 'โรคไต (CKD / Renal)', count: filtered.filter((r) => r.formData.history.ckd).length },
      { label: 'โรคหัวใจ (Heart Disease)', count: filtered.filter((r) => r.formData.history.heartDisease).length },
      { label: 'Drug/Food Allergy', count: filtered.filter((r) => r.formData.history.allergyStatus === 'yes').length },
      { label: 'Active Smoking', count: filtered.filter((r) => r.formData.history.smokingStatus === 'yes').length },
      { label: 'Mallampati III–IV', count: mallampatiHigh },
    ];

    const wardCounts = new Map<string, number>();
    filtered.forEach((r) => {
      const w = r.ward.trim() || 'ไม่ระบุหอผู้ป่วย';
      wardCounts.set(w, (wardCounts.get(w) || 0) + 1);
    });

    return {
      total,
      emergencyCount,
      highRiskAsa,
      difficultAirway,
      postOpDone,
      complications,
      prcUnits,
      ffpUnits,
      pltUnits,
      asaCounts,
      planCounts,
      comorbidityCounts,
      wardList: Array.from(wardCounts.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          ยังไม่มีข้อมูลการเยี่ยมผู้ป่วยก่อนผ่าตัดในระบบ
        </h2>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          เริ่มบันทึกแบบประเมินผู้ป่วยรายใหม่ หรือโหลดข้อมูลตัวอย่าง 5 เคสเพื่อทดสอบการแสดงผล Dashboard และรายงานสรุป
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors"
          >
            <FilePlus2 className="w-4 h-4" />
            สร้างแบบประเมินใหม่
          </button>
          <button
            type="button"
            onClick={onLoadSamples}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-blue-800" />
            โหลดข้อมูลตัวอย่าง (5 เคส)
          </button>
        </div>
      </div>
    );
  }

  const maxAsa = Math.max(1, ...Object.values(stats.asaCounts));
  const maxPlan = Math.max(1, ...Object.values(stats.planCounts));

  return (
    <div className="space-y-5">
      {/* Filter & Export Bar */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-600">หอผู้ป่วย (Ward)</span>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
            >
              <option value="ALL">ทุกหอผู้ป่วย</option>
              {wards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-600">ASA Class</span>
            <select
              value={asaFilter}
              onChange={(e) => setAsaFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
            >
              <option value="ALL">ทุก ASA Class</option>
              {(['I', 'II', 'III', 'IV', 'V', 'VI'] as const).map((cls) => (
                <option key={cls} value={cls}>
                  ASA Class {cls}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportEvaluationsCsv(filtered)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-blue-800" />
            ส่งออก CSV (Excel)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            พิมพ์สรุป Dashboard
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">จำนวนผู้ป่วยประเมินทั้งหมด</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {stats.total}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            กรณีฉุกเฉิน (E): {stats.emergencyCount} ราย
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">กลุ่มเสี่ยงสูง (ASA III–VI)</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-amber-700">
            {stats.highRiskAsa}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {stats.total > 0 ? Math.round((stats.highRiskAsa / stats.total) * 100) : 0}% ของผู้ป่วย
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">Expected Difficult Airway</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-red-700">
            {stats.difficultAirway}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            ควรเตรียม Video laryngoscope
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">Post-Op &amp; Complication</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {stats.postOpDone}
            <span className="text-sm font-normal text-slate-500"> / {stats.total}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            พบภาวะแทรกซ้อน: {stats.complications} ราย
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">การจองเลือดรวม (Units)</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-blue-900">
            {stats.prcUnits + stats.ffpUnits + stats.pltUnits}
          </div>
          <div className="mt-1 text-xs font-mono tabular-nums text-slate-500">
            PRC {stats.prcUnits} · FFP {stats.ffpUnits} · Plt {stats.pltUnits}
          </div>
        </div>
      </div>

      {/* Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ASA Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              สัดส่วน ASA Physical Status Classification
            </h3>
            <span className="text-xs text-slate-500 tabular-nums">{stats.total} ราย</span>
          </div>
          <div className="space-y-2.5">
            {(['I', 'II', 'III', 'IV', 'V', 'VI', 'Unspecified'] as const).map((cls) => {
              const count = stats.asaCounts[cls];
              const pct = Math.round((count / maxAsa) * 100);
              const barColor =
                cls === 'IV' || cls === 'V' || cls === 'VI'
                  ? 'bg-red-600'
                  : cls === 'III'
                  ? 'bg-amber-500'
                  : cls === 'Unspecified'
                  ? 'bg-slate-300'
                  : 'bg-blue-800';
              return (
                <div key={cls} className="grid grid-cols-[100px_1fr_48px] items-center gap-3 text-xs">
                  <span className="font-medium text-slate-700">
                    {cls === 'Unspecified' ? 'ยังไม่ระบุ' : `ASA Class ${cls}`}
                  </span>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-right font-mono tabular-nums font-semibold text-slate-900">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Anesthetic Plan Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              แผนการระงับความรู้สึก (Anesthetic Plan)
            </h3>
            <span className="text-xs text-slate-500">GA vs RA</span>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'GA — Intubation', count: stats.planCounts.GA_Intubation },
              { label: 'GA — LMA', count: stats.planCounts.GA_LMA },
              { label: 'GA — TIVA / Mask', count: stats.planCounts.GA_TIVA_Mask },
              { label: 'RA — Spinal block', count: stats.planCounts.RA_Spinal },
              { label: 'RA — Epidural / Nerve', count: stats.planCounts.RA_Epidural_Nerve },
            ].map((item) => {
              const pct = Math.round((item.count / maxPlan) * 100);
              return (
                <div
                  key={item.label}
                  className="grid grid-cols-[150px_1fr_48px] items-center gap-3 text-xs"
                >
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-800 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-right font-mono tabular-nums font-semibold text-slate-900">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comorbidities & Airway Findings */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            โรคประจำตัวและปัจจัยเสี่ยงทางคลินิกที่พบบ่อย
          </h3>
          <div className="divide-y divide-slate-100">
            {stats.comorbidityCounts.map((item) => (
              <div
                key={item.label}
                className="py-2 flex items-center justify-between text-xs"
              >
                <span className="text-slate-700 font-medium">{item.label}</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {item.count} ราย (
                  {stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ward Breakdown & Quick Case Links */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            สรุปจำนวนผู้ป่วยแยกตามหอผู้ป่วย (Ward)
          </h3>
          <div className="divide-y divide-slate-100">
            {stats.wardList.map(([ward, count]) => (
              <div key={ward} className="py-2 flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">{ward}</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {count} ราย
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High-Priority Cases Quick List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            รายการผู้ป่วยเรียงตามวันที่ทำผ่าตัด (คลิกเพื่อเปิดแก้ไขในแบบฟอร์ม)
          </h3>
          <span className="text-xs text-slate-500 tabular-nums">
            แสดง {Math.min(8, filtered.length)} รายการ
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2.5 px-4 font-semibold">HN / AN</th>
                <th className="py-2.5 px-4 font-semibold">ชื่อผู้ป่วย</th>
                <th className="py-2.5 px-4 font-semibold">หอผู้ป่วย · การผ่าตัด</th>
                <th className="py-2.5 px-4 font-semibold">ASA</th>
                <th className="py-2.5 px-4 font-semibold">ความเสี่ยงสำคัญ</th>
                <th className="py-2.5 px-4 font-semibold text-right">วันที่ผ่าตัด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.slice(0, 8).map((r) => {
                const flags: string[] = [];
                if (r.expectedDifficultAirway) flags.push('Difficult Airway');
                if (r.formData.history.allergyStatus === 'yes') flags.push('Allergy');
                if (r.hasComplication) flags.push('Post-Op Complication');
                return (
                  <tr
                    key={r.id}
                    onClick={() => onSelectRecord(r)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-4 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {r.hn || '—'}
                      {r.an ? ` · ${r.an}` : ''}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {r.patientName} {r.age ? `(${r.age} ปี)` : ''}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 max-w-xs truncate">
                      {r.ward || '—'} · {r.operation || '—'}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {r.asaClass ? `ASA ${r.asaClass}${r.asaEmergency ? 'E' : ''}` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {flags.length > 0 ? (
                        <span className="text-red-700 font-medium">{flags.join(' · ')}</span>
                      ) : (
                        <span className="text-slate-500">ปกติตามแผน</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {r.dateOfOperation || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
