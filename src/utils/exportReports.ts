import {
  BLOOD_PREP_STATUS_OPTIONS,
  computeClinicalSummary,
  formatDrinkingDetail,
  formatDrugAddictionDetail,
  formatOxygenSupportSummary,
  formatSmokingDetail,
  formatToothMarksSummary,
  PreAnestheticEvaluation,
} from '../types/evaluation';

function escapeCsvCell(val: string | number | boolean): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportEvaluationsCsv(records: PreAnestheticEvaluation[], filenamePrefix = 'bangplee_pre_op_report') {
  const headers = [
    'HN',
    'AN',
    'Name',
    'Age (yr)',
    'Ward',
    'Date of Visit',
    'Date of Operation',
    'Operation Time',
    'Surgeon',
    'Diagnosis',
    'Operation',
    'ASA Class',
    'Emergency (E)',
    'BW (kg)',
    'HT (cm)',
    'BMI',
    'BP (mmHg)',
    'SpO2 (%)',
    'Oxygen / Ventilator Support',
    'Mallampati',
    'Expected Difficult Airway',
    'Allergy',
    'Underlying Diseases',
    'Drinking (วัน/wk · ระยะเวลา)',
    'Smoking (มวน/วัน · ระยะเวลา)',
    'Drug Addiction (ชนิด · ปริมาณ · ระยะเวลา)',
    'Hb',
    'Hct',
    'WBC',
    'Plt',
    'Na',
    'K',
    'BUN',
    'Cr',
    'INR',
    'Anesthetic Plan',
    'Blood Prep (PRC/FFP/Plt)',
    'Post-Op Complication',
    'Status',
  ];

  const rows = records.map((r) => {
    const fd = r.formData;
    const summary = computeClinicalSummary(r);
    return [
      r.hn,
      r.an,
      r.patientName,
      r.age,
      r.ward,
      r.dateOfVisit,
      r.dateOfOperation,
      r.operationTime || '',
      r.surgeon || '',
      r.diagnosis,
      r.operation,
      r.asaClass,
      r.asaEmergency ? 'E' : '',
      fd.physicalExam.bw,
      fd.physicalExam.ht,
      fd.physicalExam.bmi,
      fd.physicalExam.bp,
      fd.physicalExam.spo2,
      formatOxygenSupportSummary(fd.physicalExam.oxygenSupport),
      fd.physicalExam.mallampatiClass,
      r.expectedDifficultAirway ? 'Yes' : 'No',
      fd.history.allergyStatus === 'yes' ? fd.history.allergyDetail || 'Yes' : fd.history.allergyStatus === 'no' ? 'No' : '',
      summary.underlyingTags.join('; '),
      fd.history.drinkingStatus === 'yes'
        ? formatDrinkingDetail(fd.history)
        : fd.history.drinkingStatus === 'no'
        ? 'No'
        : '',
      fd.history.smokingStatus === 'yes'
        ? formatSmokingDetail(fd.history)
        : fd.history.smokingStatus === 'no'
        ? 'No'
        : '',
      fd.history.drugAddictionStatus === 'yes'
        ? formatDrugAddictionDetail(fd.history) || 'Yes'
        : fd.history.drugAddictionStatus === 'no'
        ? 'No'
        : '',
      fd.laboratory.hb,
      fd.laboratory.hct,
      fd.laboratory.wbc,
      fd.laboratory.plt,
      fd.laboratory.na,
      fd.laboratory.k,
      fd.laboratory.bun,
      fd.laboratory.cr,
      fd.laboratory.inr,
      summary.planSummary,
      summary.bloodPrepSummary,
      fd.postAnesthesia.complicationStatus === 'yes'
        ? fd.postAnesthesia.complicationDetail || 'Yes'
        : fd.postAnesthesia.complicationStatus === 'no'
        ? 'No'
        : '',
      r.status,
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${filenamePrefix}_${dateStamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportEvaluationJson(record: PreAnestheticEvaluation) {
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeHn = (record.hn || 'record').replace(/[^a-zA-Z0-9_-]/g, '');
  a.href = url;
  a.download = `ANE-FM-002-03_${safeHn}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function esc(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function radioMark(active: boolean, label: string): string {
  return `<span style="margin-right:8px;white-space:nowrap;">${active ? '&#9679;' : '&#9675;'} ${esc(label)}</span>`;
}

function checkMark(active: boolean, label: string): string {
  return `<span style="margin-right:10px;white-space:nowrap;">${active ? '&#9745;' : '&#9744;'} ${esc(label)}</span>`;
}

export function exportSingleHtmlReport(record: PreAnestheticEvaluation) {
  const fd = record.formData;
  const h = fd.history;
  const p = fd.physicalExam;
  const inv = fd.investigation;
  const lab = fd.laboratory;
  const pm = fd.premedication;
  const ap = fd.anestheticPlan;
  const pa = fd.postAnesthesia;

  const html = `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>ANE-FM-002-03 - ${esc(record.patientName || 'Patient')}</title>
  <style>
    @page { size: A4 portrait; margin: 7mm 8mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Sarabun', 'Segoe UI', Tahoma, sans-serif; font-size: 11px; color: #111827; margin: 0; padding: 12px; background: #fff; }
    .sheet { width: 100%; max-width: 794px; margin: 0 auto; border: 1.5px solid #1e293b; }
    .header { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 6px 10px; border-bottom: 1.5px solid #1e293b; }
    .bph-box { width: 32px; height: 32px; background: #1e3a8a; color: #fff; font-weight: 700; font-size: 10px; display: flex; align-items: center; justify-content: center; border-radius: 3px; }
    .title { text-align: center; }
    .title h1 { margin: 0; font-size: 14px; }
    .title p { margin: 0; font-size: 12px; font-weight: 600; }
    .row { border-bottom: 1px solid #334155; padding: 4px 8px; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #334155; }
    .col-left { border-right: 1px solid #334155; padding: 5px 8px; }
    .col-right { padding: 5px 8px; }
    .sec-title { font-weight: 700; font-size: 11.5px; border-bottom: 1px solid #94a3b8; margin-bottom: 4px; padding-bottom: 1px; }
    .field { margin-bottom: 3px; line-height: 1.35; }
    .val { font-weight: 600; border-bottom: 1px dotted #64748b; padding: 0 3px; }
    table.fish { border-collapse: collapse; width: 100%; margin: 3px 0; font-size: 10px; }
    table.fish td { border: 1px solid #475569; padding: 2px 4px; text-align: center; }
    .footer-code { text-align: right; font-size: 9.5px; padding: 3px 8px; color: #334155; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="bph-box">BPH</div>
      <div class="title">
        <h1>Bangplee Hospital</h1>
        <p>Pre Anesthetic Evaluation form</p>
      </div>
    </div>
    <div class="row">
      <div class="field">
        Name: <span class="val">${esc(record.patientName || '-')}</span> &nbsp;
        Age: <span class="val">${esc(record.age || '-')}</span> yr &nbsp;
        HN: <span class="val">${esc(record.hn || '-')}</span> &nbsp;
        AN: <span class="val">${esc(record.an || '-')}</span> &nbsp;
        Ward: <span class="val">${esc(record.ward || '-')}</span> &nbsp;
        Date of visit: <span class="val">${esc(record.dateOfVisit || '-')}</span>
      </div>
      <div class="field">
        Diagnosis: <span class="val">${esc(record.diagnosis || '-')}</span> &nbsp;
        Operation: <span class="val">${esc(record.operation || '-')}</span> &nbsp;
        Surgeon: <span class="val">${esc(record.surgeon || '-')}</span> &nbsp;
        Date of operation: <span class="val">${esc(record.dateOfOperation || '-')}</span> &nbsp;
        Time: <span class="val">${esc(record.operationTime || '-')}</span>
      </div>
    </div>

    <div class="cols">
      <div class="col-left">
        <div class="sec-title">1. History</div>
        <div class="field"><strong>1.1 Present illness:</strong> ${esc(h.presentIllness || '-')}</div>
        <div class="field"><strong>1.2 Past illness:</strong> ${esc(h.pastIllness || '-')}</div>
        <div class="field"><strong>1.3 Allergy:</strong> ${radioMark(h.allergyStatus === 'no', 'No')} ${radioMark(h.allergyStatus === 'yes', 'Yes')} <span class="val">${esc(h.allergyDetail)}</span></div>
        <div class="field"><strong>1.4 Underlying:</strong> ${radioMark(h.underlyingStatus === 'no', 'No')} ${radioMark(h.underlyingStatus === 'yes', 'Yes')}</div>
        <div class="field">
          ${checkMark(h.dm, `DM ${h.dmYears ? `(${h.dmYears} ปี)` : ''}`)}
          ${checkMark(h.ht, `HT ${h.htYears ? `(${h.htYears} ปี)` : ''}`)}
          ${checkMark(Boolean(h.dlp), `DLP ${h.dlpYears ? `(${h.dlpYears} ปี)` : ''}`)}
          ${checkMark(Boolean(h.ckd), `โรคไต ${h.ckdYears ? `(${h.ckdYears} ปี)` : ''}`)}
          ${checkMark(h.heartDisease, `โรคหัวใจ ${h.heartDiseaseYears ? `(${h.heartDiseaseYears} ปี)` : ''}`)}
          ${h.otherUnderlying.filter(Boolean).map((u) => esc(u)).join(', ')}
        </div>
        <div class="field"><strong>Medication:</strong> ${esc(h.medication || '-')}</div>
        <div class="field"><strong>1.5 Previous operation / anesthesia:</strong> ${h.previousOps.filter(Boolean).map((op, i) => `${i + 1}) ${esc(op)}`).join(' ; ') || '-'}</div>
        <div class="field"><strong>Complication:</strong> ${esc(h.previousOpComplication || '-')}</div>
        <div class="field"><strong>1.6 Drinking:</strong> ${radioMark(h.drinkingStatus === 'no', 'No')} ${radioMark(h.drinkingStatus === 'yes', `Yes (${esc(formatDrinkingDetail(h))})`)}</div>
        <div class="field"><strong>1.7 Smoking:</strong> ${radioMark(h.smokingStatus === 'no', 'No')} ${radioMark(h.smokingStatus === 'yes', `Yes (${esc(formatSmokingDetail(h))})`)}</div>
        <div class="field"><strong>1.8 Drug addiction:</strong> ${radioMark(h.drugAddictionStatus === 'no', 'No')} ${radioMark(h.drugAddictionStatus === 'yes', `Yes${h.drugAddictionStatus === 'yes' && formatDrugAddictionDetail(h) ? ` (${esc(formatDrugAddictionDetail(h))})` : ''}`)}</div>

        <div class="sec-title" style="margin-top:6px;">3. Investigation</div>
        <div class="field"><strong>3.1 Chest x-ray:</strong> ${radioMark(inv.cxrStatus === 'normal', 'Normal')} ${radioMark(inv.cxrStatus === 'abnormal', 'Abnormal')} ${esc(inv.cxrDetail)}</div>
        <div class="field"><strong>3.2 EKG:</strong> ${radioMark(inv.ekgStatus === 'normal', 'Normal')} ${radioMark(inv.ekgStatus === 'abnormal', 'Abnormal')} ${esc(inv.ekgDetail)}</div>
        <div class="field"><strong>3.3 Other:</strong> ${esc(inv.other || '-')}</div>

        <div class="sec-title" style="margin-top:6px;">5. Premedication</div>
        <div class="field">${pm.items.filter(Boolean).map((item, i) => `${i + 1}. ${esc(item)}`).join('<br/>') || '-'}</div>
        <div class="field"><strong>NPO time:</strong> ${esc(pm.npoTime || '-')} &nbsp; <strong>on IVF:</strong> ${esc(pm.onIvf || '-')}</div>
      </div>

      <div class="col-right">
        <div class="sec-title">2. Physical examination</div>
        <div class="field">BW: <span class="val">${esc(p.bw || '-')}</span> kg &nbsp; HT: <span class="val">${esc(p.ht || '-')}</span> cm &nbsp; BMI: <span class="val">${esc(p.bmi || '-')}</span></div>
        <div class="field">BP: <span class="val">${esc(p.bp || '-')}</span> mmHg &nbsp; P: <span class="val">${esc(p.pulse || '-')}</span> bpm &nbsp; RR: <span class="val">${esc(p.rr || '-')}</span> bpm &nbsp; T: <span class="val">${esc(p.temp || '-')}</span> °C &nbsp; SpO2: <span class="val">${esc(p.spo2 || '-')}</span>%</div>
        ${
          formatOxygenSupportSummary(p.oxygenSupport)
            ? `<div class="field"><strong>Oxygen / Support:</strong> <span class="val">${esc(formatOxygenSupportSummary(p.oxygenSupport))}</span></div>`
            : ''
        }
        <div class="field"><strong>2.1 Tooth:</strong> ${(['Normal', 'Denture', 'Loose', 'Avulsion'] as const).map((t) => radioMark(p.toothStatus.includes(t), t)).join('')} ${esc(p.toothDetail)}${
          formatToothMarksSummary(p.missingTeeth, p.looseTeeth)
            ? ` · ${esc(formatToothMarksSummary(p.missingTeeth, p.looseTeeth))}`
            : ''
        }</div>
        <div class="field"><strong>2.2 Airway:</strong> Mouth opening ${radioMark(p.mouthOpening === 'normal', 'Normal')} ${radioMark(p.mouthOpening === 'limited', 'Limited')} ${p.mouthOpeningDetail ? `(${esc(p.mouthOpeningDetail)})` : ''}</div>
        <div class="field">Neck movement ${radioMark(p.neckMovement === 'normal', 'Normal')} ${radioMark(p.neckMovement === 'limited', 'Limited')} ${p.neckMovementDetail ? `(${esc(p.neckMovementDetail)})` : ''} · TMD ${radioMark(p.thyromentalDistance === '<6', '<6 cm')} ${radioMark(p.thyromentalDistance === '>=6', '>=6 cm')} ${p.thyromentalDistanceDetail ? `(${esc(p.thyromentalDistanceDetail)})` : ''}</div>
        <div class="field"><strong>2.3 Mallampati class:</strong> ${(['I', 'II', 'III', 'IV'] as const).map((m) => radioMark(p.mallampatiClass === m, m)).join('')} · Expected difficult airway: ${radioMark(p.expectedDifficultAirway === 'no', 'No')} ${radioMark(p.expectedDifficultAirway === 'yes', 'Yes')}</div>
        <div class="field"><strong>2.4 Breath sound:</strong> ${radioMark(p.breathSound === 'normal', 'Normal')} ${radioMark(p.breathSound === 'abnormal', 'Abnormal')} ${esc(p.breathSoundDetail)}</div>
        <div class="field"><strong>2.5 Heart sound:</strong> ${radioMark(p.heartSound === 'normal', 'Normal')} ${radioMark(p.heartSound === 'abnormal', 'Abnormal')} ${esc(p.heartSoundDetail)}</div>
        <div class="field"><strong>2.6 Functional Capacity:</strong> ${esc(p.functionalCapacity || '-')}</div>

        <div class="sec-title" style="margin-top:6px;">4. Laboratory Evaluation</div>
        <table class="fish">
          <tr>
            <td>Hb: ${esc(lab.hb || '-')}</td><td>WBC: ${esc(lab.wbc || '-')}</td><td>N: ${esc(lab.neutrophil || '-')}%</td>
            <td>Na: ${esc(lab.na || '-')}</td><td>K: ${esc(lab.k || '-')}</td><td>BUN: ${esc(lab.bun || '-')}</td>
          </tr>
          <tr>
            <td>Hct: ${esc(lab.hct || '-')}</td><td>Plt: ${esc(lab.plt || '-')}</td><td>L: ${esc(lab.lymphocyte || '-')}%</td>
            <td>Cl: ${esc(lab.cl || '-')}</td><td>CO2: ${esc(lab.co2 || '-')}</td><td>Cr: ${esc(lab.cr || '-')}</td>
          </tr>
        </table>
        <div class="field"><strong>Coag:</strong> PT ${esc(lab.pt || '-')} s · PTT ${esc(lab.ptt || '-')} s · INR ${esc(lab.inr || '-')}</div>
        <div class="field"><strong>LFT:</strong> SGOT ${esc(lab.sgot || '-')} · SGPT ${esc(lab.sgpt || '-')} · ALP ${esc(lab.alp || '-')} · Alb ${esc(lab.alb || '-')}</div>
        <div class="field"><strong>Glucose:</strong> ${esc(lab.glucose || '-')} mg/dl · <strong>HbA1C:</strong> ${esc(lab.hba1c || '-')} · <strong>Other:</strong> ${esc(lab.other || '-')}</div>
        <div class="field"><strong>Blood component prepare:</strong> ${checkMark(Boolean(lab.prepTs), 'T&S')} PRC ${esc(lab.prepPrc || '-')} u · FFP ${esc(lab.prepFfp || '-')} u · Plt ${esc(lab.prepPlt || '-')} u<br/>${BLOOD_PREP_STATUS_OPTIONS.map((opt) =>
          checkMark(
            (lab.prepStatuses || []).includes(opt.value),
            opt.value === 'other' && lab.prepStatusDetail
              ? `${opt.label}: ${esc(lab.prepStatusDetail)}`
              : opt.label,
          ),
        ).join(' ')}${!(lab.prepStatuses || []).includes('other') && lab.prepStatusDetail ? ` (${esc(lab.prepStatusDetail)})` : ''}</div>

        <div class="sec-title" style="margin-top:6px;">6. Consult Med/Cardio</div>
        <div class="field">${esc(fd.consult || '-')}</div>
      </div>
    </div>

    <div class="row">
      <div class="field"><strong>7. ASA Classification:</strong> ${(['I', 'II', 'III', 'IV', 'V', 'VI'] as const).map((c) => radioMark(record.asaClass === c, `Class ${c}`)).join('')} ${radioMark(record.asaEmergency, 'E')}</div>
      <div class="field"><strong>8. Problem list:</strong> ${fd.problemList.filter(Boolean).map((item, i) => `${i + 1}) ${esc(item)}`).join(' · ') || '-'}</div>
      <div class="field"><strong>9. Anesthetic plan:</strong>
        ${checkMark(ap.gaSelected, 'General anesthesia')} (${(['Intubation', 'LMA', 'Mask', 'TIVA', 'Other'] as const).map((m) => radioMark(ap.gaMethods.includes(m), m)).join('')} ${esc(ap.gaOther)})<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${checkMark(ap.raSelected, 'Regional anesthesia')} (${(['Spinal block', 'Epidural', 'Nerve block', 'Other'] as const).map((m) => radioMark(ap.raMethods.includes(m), m)).join('')} ${esc(ap.raOther)})
      </div>
      <div class="field"><strong>10. สิ่งที่ต้องเตรียม (ตาม order วิสัญญีแพทย์):</strong> ${fd.preparationOrders.filter(Boolean).map((o, i) => `${i + 1}) ${esc(o)}`).join(' · ') || '-'}</div>
    </div>

    <div class="row" style="border-bottom:none;">
      <div class="field"><strong>Post Anesthesia Evaluation</strong> &nbsp; Summarized by: <span class="val">${esc(pa.summarizedBy || '-')}</span> Date: <span class="val">${esc(pa.summarizedDate || '-')}</span></div>
      <div class="field">Vital signs: BP ${esc(pa.bp || '-')} mmHg · P ${esc(pa.pulse || '-')} bpm · RR ${esc(pa.rr || '-')} bpm · T ${esc(pa.temp || '-')} °C · SpO2 ${esc(pa.spo2 || '-')} % · PS ${esc(pa.painScore || '-')} คะแนน</div>
      <div class="field"><strong>Post anesthesia complication:</strong> ${radioMark(pa.complicationStatus === 'no', 'No')} ${radioMark(pa.complicationStatus === 'yes', 'Yes')} ${esc(pa.complicationDetail)}</div>
      <div class="field" style="text-align:right;">visit by: <span class="val">${esc(pa.visitBy || '-')}</span> Date: <span class="val">${esc(pa.visitDate || '-')}</span></div>
    </div>
  </div>
  <div class="footer-code">ANE-FM-002-03 อนุมัติใช้วันที่ 21 มิถุนายน 2564</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeHn = (record.hn || 'report').replace(/[^a-zA-Z0-9_-]/g, '');
  a.href = url;
  a.download = `ANE-FM-002-03_${safeHn}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
