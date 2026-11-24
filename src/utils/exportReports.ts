import {
  BLOOD_PREP_STATUS_OPTIONS,
  computeClinicalSummary,
  CONSULT_TYPE_OPTIONS,
  formatBloodGasSummary,
  formatBloodGroup,
  formatConsultSummary,
  formatDrinkingDetail,
  formatDrugAddictionDetail,
  formatDurationLabel,
  formatOxygenSupportSummary,
  formatPostponementReasons,
  formatPreOpNotVisitedReasons,
  formatShortThaiDate,
  formatSmokingDetail,
  formatThaiDateBE,
  formatThousandsWithCommas,
  formatToothMarksSummary,
  formatUnderlyingDiseaseTag,
  formatWardWithBed,
  getEffectiveEvaluationStatus,
  getMedicationLines,
  PreAnestheticEvaluation,
  summarizePostOpComplications,
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
    'Bed (เตียง)',
    'Specialty (สาขา)',
    'Date of Visit',
    'Date of Operation',
    'Operation Time',
    'Schedule Type',
    'OR Room',
    'Case Order',
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
    'Drinking (ปริมาณ · วัน/wk · ระยะเวลา)',
    'Smoking (มวน/วัน · ระยะเวลา)',
    'Drug Addiction (ชนิด · ปริมาณ · ระยะเวลา)',
    'CBC Date (วันที่ตรวจ CBC)',
    'Chemistry Date (วันที่ตรวจ Chemistry)',
    'Hb',
    'Hct',
    'WBC',
    'Plt',
    'Na',
    'K',
    'BUN',
    'Cr',
    'INR',
    'FT3',
    'FT4',
    'TSH',
    'HBsAg',
    'Blood Gas (ABG/VBG)',
    'Consult Med/Cardio',
    'Anesthetic Plan',
    'Blood Group',
    'Blood Prep (PRC/FFP/Plt/Cryo)',
    'Post-Op Complication',
    'Surgery Postponed (เลื่อนผ่าตัด)',
    'Original Operation Date (วันผ่าตัดเดิม)',
    'Postponed To Date (วันผ่าตัดใหม่)',
    'Postponement Reasons (เหตุผลที่เลื่อนผ่าตัด)',
    'Pre-op Not Visited (ไม่ได้เยี่ยม Pre-op)',
    'Pre-op Not Visited Reasons (เหตุผลที่ไม่ได้เยี่ยม)',
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
      r.bed || '',
      r.specialty || '',
      formatThaiDateBE(r.dateOfVisit),
      formatThaiDateBE(r.dateOfOperation),
      r.operationTime || '',
      r.scheduleType === 'emergency' || (!r.scheduleType && r.asaEmergency) ? 'Emergency' : 'Elective',
      r.orRoom || '',
      r.caseOrder || '',
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
      formatThaiDateBE(fd.laboratory.cbcDate || (!fd.laboratory.chemDate ? fd.laboratory.labDate : '') || ''),
      formatThaiDateBE(fd.laboratory.chemDate || (!fd.laboratory.cbcDate ? fd.laboratory.labDate : '') || ''),
      fd.laboratory.hb,
      fd.laboratory.hct,
      formatThousandsWithCommas(fd.laboratory.wbc),
      formatThousandsWithCommas(fd.laboratory.plt),
      fd.laboratory.na,
      fd.laboratory.k,
      fd.laboratory.bun,
      fd.laboratory.cr,
      fd.laboratory.inr,
      fd.laboratory.ft3 || '',
      fd.laboratory.ft4 || '',
      fd.laboratory.tsh || '',
      fd.laboratory.hbsAg === 'negative'
        ? 'Negative'
        : fd.laboratory.hbsAg === 'positive'
        ? 'Positive'
        : '',
      formatBloodGasSummary(fd.laboratory),
      formatConsultSummary(fd.consultTypes, fd.consult),
      summary.planSummary,
      formatBloodGroup(fd.laboratory.bloodGroup, fd.laboratory.bloodRh),
      summary.bloodPrepSummary,
      fd.postAnesthesia.complicationStatus === 'yes'
        ? fd.postAnesthesia.complicationDetail || summarizePostOpComplications(fd.postOpComplication) || 'Yes'
        : summarizePostOpComplications(fd.postOpComplication)
        ? summarizePostOpComplications(fd.postOpComplication)
        : fd.postAnesthesia.complicationStatus === 'no'
        ? 'No'
        : '',
      fd.surgeryPostponement?.isPostponed ? 'Yes' : 'No',
      fd.surgeryPostponement?.isPostponed
        ? formatThaiDateBE(fd.surgeryPostponement.originalDateOfOperation || '')
        : '',
      fd.surgeryPostponement?.isPostponed
        ? formatThaiDateBE(fd.surgeryPostponement.postponedToDate || '')
        : '',
      fd.surgeryPostponement?.isPostponed
        ? formatPostponementReasons(fd.surgeryPostponement)
        : '',
      fd.preOpNotVisited?.isNotVisited ? 'Yes' : 'No',
      fd.preOpNotVisited?.isNotVisited
        ? formatPreOpNotVisitedReasons(fd.preOpNotVisited)
        : '',
      getEffectiveEvaluationStatus(r),
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

export function exportAllEvaluationsJson(
  records: PreAnestheticEvaluation[],
  filenamePrefix = 'bangplee_pre_op_backup',
) {
  const payload = {
    app: 'Bangplee Pre-Anesthetic Evaluation',
    version: 1,
    exportedAt: new Date().toISOString(),
    count: records.length,
    records,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${filenamePrefix}_${dateStamp}.json`;
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

function blankSlot(val: string | undefined, minWidthPx: number): string {
  const clean = (val || '').trim();
  if (clean) {
    return `<span class="val" style="min-width:${minWidthPx}px;display:inline-block;">${esc(clean)}</span>`;
  }
  return `<span class="blank-slot" style="min-width:${minWidthPx}px;">&nbsp;</span>`;
}

function dottedRows(lines: string[], minLines: number, numbered = false): string {
  const clean = lines.map((l) => l.trim()).filter(Boolean);
  const count = Math.max(minLines, clean.length);
  return Array.from({ length: count }, (_, idx) => {
    const text = clean[idx] || '';
    return `<div class="dotted-row">${
      numbered ? `<span class="dotted-num">${idx + 1}.</span>` : ''
    }<span class="dotted-line">${text ? esc(text) : '&nbsp;'}</span></div>`;
  }).join('');
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
    @page {
      size: A4 portrait;
      margin: 0 !important;
      @top-left { content: none; }
      @top-center { content: none; }
      @top-right { content: none; }
      @bottom-left { content: none; }
      @bottom-center { content: none; }
      @bottom-right { content: none; }
    }
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
    .blank-slot { display: inline-block; border-bottom: 1px dotted #475569; padding: 0 3px; line-height: 1.25; }
    .dotted-row { display: flex; align-items: flex-end; gap: 4px; min-height: 18px; margin-top: 2px; }
    .dotted-num { width: 14px; flex-shrink: 0; font-size: 10px; color: #475569; }
    .dotted-line { flex: 1; border-bottom: 1px dotted #475569; min-height: 15px; padding: 0 3px; font-weight: 600; }
    table.fish { border-collapse: collapse; width: 100%; margin: 3px 0; font-size: 10px; }
    table.fish td { border: 1px solid #475569; padding: 2px 4px; text-align: center; }
    .footer-code { text-align: right; font-size: 9.5px; padding: 3px 8px; color: #334155; }
    @media print { body { padding: 7mm 8mm; } .sheet { max-width: none; } }
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
        Name: ${blankSlot(record.patientName, 125)} &nbsp;
        Age: ${blankSlot(record.age, 30)} yr &nbsp;
        HN: ${blankSlot(record.hn, 66)} &nbsp;
        AN: ${blankSlot(record.an, 66)} &nbsp;
        Ward: ${blankSlot(formatWardWithBed(record.ward, record.bed), 62)} &nbsp;
        สาขา: ${blankSlot(record.specialty, 56)} &nbsp;
        ห้อง: ${blankSlot(
          record.orRoom
            ? `${record.orRoom}${record.caseOrder ? ` #${record.caseOrder}` : ''}`
            : record.caseOrder
            ? `#${record.caseOrder}`
            : '',
          48,
        )}
      </div>
      <div class="field">
        Diagnosis: ${blankSlot(record.diagnosis, 230)} &nbsp;
        Operation: ${blankSlot(record.operation, 240)}
      </div>
      <div class="field">
        Date of visit: ${blankSlot(formatThaiDateBE(record.dateOfVisit), 76)} &nbsp;
        Date of operation: ${blankSlot(formatThaiDateBE(record.dateOfOperation), 76)} &nbsp;
        เวลา: ${blankSlot(record.operationTime, 52)} &nbsp;
        Surgeon: ${blankSlot(record.surgeon, 130)}
      </div>
      ${
        fd.surgeryPostponement?.isPostponed
          ? `<div class="field" style="background:#fffbeb;border:1px solid #f59e0b;padding:2px 6px;"><strong>เลื่อนวันผ่าตัด:</strong> ${
              fd.surgeryPostponement.originalDateOfOperation
                ? `เดิม ${esc(formatThaiDateBE(fd.surgeryPostponement.originalDateOfOperation))}`
                : ''
            }${
              fd.surgeryPostponement.postponedToDate
                ? ` → ใหม่ ${esc(formatThaiDateBE(fd.surgeryPostponement.postponedToDate))}`
                : ' → ยังไม่ระบุวันใหม่'
            }${
              formatPostponementReasons(fd.surgeryPostponement)
                ? ` · เหตุผล: ${esc(formatPostponementReasons(fd.surgeryPostponement))}`
                : ''
            }</div>`
          : ''
      }
      ${
        fd.preOpNotVisited?.isNotVisited
          ? `<div class="field" style="background:#fff1f2;border:1px solid #fda4af;padding:2px 6px;"><strong>ฉบับร่าง (ไม่ได้เยี่ยม Pre-op):</strong> ${esc(
              formatPreOpNotVisitedReasons(fd.preOpNotVisited) || 'ยังไม่ระบุเหตุผล',
            )}</div>`
          : ''
      }
    </div>

    <div class="cols">
      <div class="col-left">
        <div class="sec-title">1. History</div>
        <div class="field"><strong>1.1 Present illness:</strong>${dottedRows((h.presentIllness || '').split(/\r?\n/), 2, false)}</div>
        <div class="field"><strong>1.2 Past illness:</strong>${dottedRows((h.pastIllness || '').split(/\r?\n/), 2, false)}</div>
        <div class="field"><strong>1.3 Allergy:</strong> ${radioMark(h.allergyStatus === 'no', 'No')} ${radioMark(h.allergyStatus === 'yes', 'Yes')} ${blankSlot(h.allergyDetail, 110)}</div>
        <div class="field"><strong>1.4 Underlying:</strong> ${radioMark(h.underlyingStatus === 'no', 'No')} ${radioMark(h.underlyingStatus === 'yes', 'Yes')} &nbsp; ${radioMark(h.underlyingControl === 'good', 'Good control')} ${radioMark(h.underlyingControl === 'poor', 'Poor control')}</div>
        <div class="field">
          ${checkMark(h.dm, esc(formatUnderlyingDiseaseTag('DM', h.dmYears, h.dmDetail, 'ปี', h.dmControl)))}
          ${checkMark(h.ht, esc(formatUnderlyingDiseaseTag('HT', h.htYears, h.htDetail, 'ปี', h.htControl)))}
          ${checkMark(Boolean(h.dlp), esc(formatUnderlyingDiseaseTag('DLP', h.dlpYears, h.dlpDetail, 'ปี', h.dlpControl)))}
          ${checkMark(Boolean(h.ckd), esc(formatUnderlyingDiseaseTag('โรคไต', h.ckdYears, h.ckdDetail, 'ปี', h.ckdControl)))}
          ${checkMark(h.heartDisease, esc(formatUnderlyingDiseaseTag('โรคหัวใจ', h.heartDiseaseYears, h.heartDiseaseDetail, 'ปี', h.heartDiseaseControl)))}
          ${dottedRows(h.otherUnderlying || [], 2, false)}
        </div>
        ${
          h.underlyingDetail?.trim()
            ? `<div class="field"><strong>รายละเอียดโรคประจำตัว:</strong> ${esc(h.underlyingDetail.trim())}</div>`
            : ''
        }
        <div class="field"><strong>Medication:</strong>${dottedRows(getMedicationLines(h.medication), 7, false)}</div>
        <div class="field">
          <strong>1.5 Previous operation / anesthesia:</strong>
          ${dottedRows(h.previousOps || [], 4, true)}
        </div>
        <div class="field" style="display:flex;align-items:flex-end;gap:4px;"><strong>Complication:</strong><span class="dotted-line">${esc(h.previousOpComplication || '') || '&nbsp;'}</span></div>
        <div class="field" style="white-space:nowrap;font-size:10px;"><strong>1.6 Drinking:</strong> ${radioMark(h.drinkingStatus === 'no', 'No')}${radioMark(h.drinkingStatus === 'yes', 'Yes')}ปริมาณ ${blankSlot(h.drinkingAmount, 54)} ${blankSlot(h.drinkingDaysPerWeek, 20)} วัน/wk จำนวน ${blankSlot(h.drinkingYears, 20)} ${h.drinkingDurationUnit === 'months' ? 'เดือน' : 'ปี'}${
          h.drinkingQuit || h.drinkingQuitDuration?.trim()
            ? ` · เลิก ${esc(formatDurationLabel(h.drinkingQuitDuration || '', h.drinkingQuitUnit))}`
            : ''
        }</div>
        <div class="field"><strong>1.7 Smoking:</strong> ${radioMark(h.smokingStatus === 'no', 'No')} ${radioMark(h.smokingStatus === 'yes', `Yes (${esc(formatSmokingDetail(h))})`)}</div>
        <div class="field"><strong>1.8 Drug addiction:</strong> ${radioMark(h.drugAddictionStatus === 'no', 'No')} ${radioMark(h.drugAddictionStatus === 'yes', `Yes${h.drugAddictionStatus === 'yes' && formatDrugAddictionDetail(h) ? ` (${esc(formatDrugAddictionDetail(h))})` : ''}`)}</div>

        <div class="sec-title" style="margin-top:6px;">3. Investigation</div>
        <div class="field"><strong>3.1 Chest x-ray:</strong> ${radioMark(inv.cxrStatus === 'normal', 'Normal')} ${radioMark(inv.cxrStatus === 'abnormal', 'Abnormal')} ${esc(inv.cxrDetail)}</div>
        <div class="field"><strong>3.2 EKG:</strong> ${radioMark(inv.ekgStatus === 'normal', 'Normal')} ${radioMark(inv.ekgStatus === 'abnormal', 'Abnormal')} ${esc(inv.ekgDetail)}</div>
        <div class="field"><strong>3.3 Other (ex. CT):</strong>${
          inv.other?.trim()
            ? `<div style="margin-top:2px;text-align:left;white-space:pre-wrap;word-break:break-word;border-bottom:1px dotted #475569;padding-bottom:2px;">${esc(inv.other.trim())}</div>`
            : dottedRows([], 2, false)
        }</div>

        <div class="sec-title" style="margin-top:6px;">5. Premedication</div>
        <div class="field">${dottedRows(pm.items || [], 3, true)}</div>
        <div class="field" style="margin-top:3px;padding:2px 6px;border:1px solid #0f172a;background:#fffbeb;font-size:11px;font-weight:700;color:#0f172a;">NPO: ${esc(pm.npoTime || '__________________')}${
          pm.lastMealTime || pm.lastWaterTime
            ? `<div style="font-size:11px;font-weight:600;color:#78350f;margin-top:2px;">${[
                pm.lastMealTime ? `อาหารล่าสุด ${esc(pm.lastMealTime)} น.` : '',
                pm.lastWaterTime ? `น้ำเปล่าล่าสุด ${esc(pm.lastWaterTime)} น.` : '',
              ]
                .filter(Boolean)
                .join(' · ')}</div>`
            : ''
        }</div>
        ${
          pm.onIvf?.trim()
            ? `<div class="field"><strong>on IVF:</strong> <span class="val">${esc(pm.onIvf.trim())}</span></div>`
            : `<div class="field"><strong>on IVF:</strong> ${radioMark(false, 'LSR 1000 ml')} ${radioMark(false, 'Acetar 1000 ml')} ${radioMark(false, 'NSS 1000 ml')} ${radioMark(false, '5%D/N/2 1000 ml')}<br/>&#9675; NSS ${blankSlot('', 32)} ml + KCl ${blankSlot('', 26)} mEq &nbsp; IV rate ${blankSlot('', 38)} ml/hr</div>`
        }
      </div>

      <div class="col-right">
        <div class="sec-title">2. Physical examination</div>
        <div class="field">BW: ${blankSlot(p.bw, 48)} kg &nbsp; HT: ${blankSlot(p.ht, 50)} cm &nbsp; BMI: ${blankSlot(p.bmi, 48)}</div>
        <div class="field"><strong>Vital signs:</strong> BP ${blankSlot(p.bp, 76)} mmHg &nbsp; P ${blankSlot(p.pulse, 48)} /min</div>
        <div class="field">RR ${blankSlot(p.rr, 46)} /min &nbsp; T ${blankSlot(p.temp, 48)} °C &nbsp; SpO2 ${blankSlot(p.spo2, 48)} %</div>
        <div class="field"><strong>Status ปัจจุบัน:</strong> GCS E${blankSlot(p.gcsE, 22)}V${blankSlot(p.gcsV, 22)}M${blankSlot(p.gcsM, 22)} &nbsp; ${radioMark(p.selfCareStatus === 'independent', 'ช่วยเหลือตัวเองได้')} ${radioMark(p.selfCareStatus === 'dependent', 'ช่วยเหลือตัวเองไม่ได้')}</div>
        <div class="field"><strong>อาการ:</strong> ${radioMark(p.dyspneaStatus === 'no', 'ไม่เหนื่อยหอบ')} ${radioMark(p.dyspneaStatus === 'yes', 'เหนื่อยหอบ')} ${blankSlot(p.currentStatusDetail, 125)}</div>
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
        <div class="field"><strong>2.6 FC:</strong> ${radioMark(p.functionalCapacityLevel === '>4', '> 4 METS')} ${radioMark(p.functionalCapacityLevel === '<4', '< 4 METS')} ${blankSlot(p.functionalCapacity, 120)}</div>

        <div class="sec-title" style="margin-top:6px;">4. Laboratory Evaluation${(() => {
          const cbcD = lab.cbcDate || (!lab.chemDate ? lab.labDate : '');
          const chemD = lab.chemDate || (!lab.cbcDate ? lab.labDate : '');
          const parts: string[] = [];
          if (cbcD) parts.push(`วันที่ CBC: ${esc(formatShortThaiDate(cbcD))}`);
          if (chemD) parts.push(`วันที่ Chemistry: ${esc(formatShortThaiDate(chemD))}`);
          return parts.length > 0
            ? ` <span style="font-weight:normal;font-size:10px;">(${parts.join(' · ')})</span>`
            : '';
        })()}</div>
        <table class="fish">
          <tr>
            <td>Hb: ${esc(lab.hb || '-')}</td><td>WBC: ${esc(formatThousandsWithCommas(lab.wbc) || '-')}</td><td>N: ${esc(lab.neutrophil || '-')}%</td>
            <td>Na: ${esc(lab.na || '-')}</td><td>K: ${esc(lab.k || '-')}</td><td>BUN: ${esc(lab.bun || '-')}</td>
          </tr>
          <tr>
            <td>Hct: ${esc(lab.hct || '-')}</td><td>Plt: ${esc(formatThousandsWithCommas(lab.plt) || '-')}</td><td>L: ${esc(lab.lymphocyte || '-')}%</td>
            <td>Cl: ${esc(lab.cl || '-')}</td><td>CO2: ${esc(lab.co2 || '-')}</td><td>Cr: ${esc(lab.cr || '-')}</td>
          </tr>
        </table>
        <div class="field"><strong>Coag:</strong> PT ${blankSlot(lab.pt, 34)} s &nbsp; PTT ${blankSlot(lab.ptt, 34)} s &nbsp; INR ${blankSlot(lab.inr, 34)}</div>
        <div class="field"><strong>LFT:</strong> SGOT ${blankSlot(lab.sgot, 30)} &nbsp; SGPT ${blankSlot(lab.sgpt, 30)} &nbsp; ALP ${blankSlot(lab.alp, 30)} &nbsp; Alb ${blankSlot(lab.alb, 30)}</div>
        <div class="field"><strong>Glucose:</strong> ${blankSlot(lab.glucose, 36)} mg/dl &nbsp; <strong>HbA1C:</strong> ${blankSlot(lab.hba1c, 30)} &nbsp; <strong>Lactate:</strong> ${blankSlot(lab.lactate, 30)} &nbsp; <strong>Trop I:</strong> ${blankSlot(lab.tropI, 30)}</div>
        <div class="field"><strong>TFT:</strong> FT3 ${blankSlot(lab.ft3, 36)} &nbsp; FT4 ${blankSlot(lab.ft4, 36)} &nbsp; TSH ${blankSlot(lab.tsh, 36)}</div>
        <div class="field"><strong>Blood Gas:</strong> ${radioMark(lab.bgType === 'ABG', 'ABG')} ${radioMark(lab.bgType === 'VBG', 'VBG')} pH ${blankSlot(lab.bgPh, 28)} &nbsp; ${lab.bgType === 'VBG' ? 'PvCO2' : lab.bgType === 'ABG' ? 'PaCO2' : 'pCO2'} ${blankSlot(lab.bgPco2, 28)} &nbsp; ${lab.bgType === 'VBG' ? 'PvO2' : lab.bgType === 'ABG' ? 'PaO2' : 'pO2'} ${blankSlot(lab.bgPo2, 28)} &nbsp; HCO3 ${blankSlot(lab.bgHco3, 28)} &nbsp; BE ${blankSlot(lab.bgBe, 26)} &nbsp; ${lab.bgType === 'VBG' ? 'SvO2' : lab.bgType === 'ABG' ? 'SaO2' : 'O2Sat'} ${blankSlot(lab.bgSao2, 26)}% &nbsp; FiO2 ${blankSlot(lab.bgFio2, 26)}</div>
        <div class="field"><strong>Anti-HIV:</strong> ${radioMark(lab.antiHiv === 'negative', 'Negative')} ${radioMark(lab.antiHiv === 'positive', 'Positive')} · <strong>HBsAg:</strong> ${radioMark(lab.hbsAg === 'negative', 'Negative')} ${radioMark(lab.hbsAg === 'positive', 'Positive')}${lab.other ? ` · <strong>Other:</strong> ${esc(lab.other)}` : ''}</div>
        ${
          (lab.customLabs || []).some((c) => c.name.trim() || c.value.trim())
            ? `<div class="field"><strong>Lab เพิ่มเติม:</strong> ${(lab.customLabs || [])
                .filter((c) => c.name.trim() || c.value.trim())
                .map((c) => `${esc(c.name.trim() || 'Lab')}: <span class="val">${esc(c.value.trim() || '-')}</span>`)
                .join(' · ')}</div>`
            : ''
        }
        <div class="field"><strong>Group เลือด:</strong> ${esc(formatBloodGroup(lab.bloodGroup, lab.bloodRh) || '-')} · <strong>Blood component prepare:</strong> ${checkMark(Boolean(lab.prepTs), 'T&S')} PRC ${esc(lab.prepPrc || '-')} u · FFP ${esc(lab.prepFfp || '-')} u · Plt ${esc(lab.prepPlt || '-')} u · Cryo ${esc(lab.prepCryo || '-')} u<br/>${BLOOD_PREP_STATUS_OPTIONS.map((opt) =>
          checkMark(
            (lab.prepStatuses || []).includes(opt.value),
            opt.value === 'other' && lab.prepStatusDetail
              ? `${opt.label}: ${esc(lab.prepStatusDetail)}`
              : opt.label,
          ),
        ).join(' ')}${!(lab.prepStatuses || []).includes('other') && lab.prepStatusDetail ? ` (${esc(lab.prepStatusDetail)})` : ''}</div>

        <div class="sec-title" style="margin-top:6px;">6. Consult Med/Cardio</div>
        <div class="field">${CONSULT_TYPE_OPTIONS.filter(
          (opt) =>
            opt.value === 'none' ||
            opt.value === 'med' ||
            opt.value === 'cardio' ||
            (fd.consultTypes || []).includes(opt.value),
        )
          .map((opt) => checkMark((fd.consultTypes || []).includes(opt.value), opt.shortLabel))
          .join(' ')}</div>
        <div class="field">${dottedRows((fd.consult || '').split(/\r?\n/), 5, false)}</div>
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
      <div class="field" style="text-align:right;"><strong>Summarized by:</strong> <span class="val">${esc(pa.summarizedBy || '-')}</span> &nbsp; Date: <span class="val">${esc(formatThaiDateBE(pa.summarizedDate) || '-')}</span></div>
    </div>

    <div class="row" style="border-bottom:none;">
      <div class="field"><strong>Post-op Evaluation (ANE-FM-006-01):</strong> ${(() => {
        const comp = fd.postOpComplication;
        const hasExplicit =
          typeof comp?.noneProblemPeriOp === 'boolean' ||
          typeof comp?.noneProblemPostOp === 'boolean';
        const nonePeri =
          (hasExplicit ? Boolean(comp?.noneProblemPeriOp) : Boolean(comp?.noneProblem)) &&
          (comp?.periOpComplications?.length ?? 0) === 0;
        const nonePost =
          (hasExplicit ? Boolean(comp?.noneProblemPostOp) : Boolean(comp?.noneProblem)) &&
          (comp?.postOpComplications?.length ?? 0) === 0;
        const parts: string[] = [];
        if (nonePeri && nonePost) {
          parts.push('None problem (Peri op & Post op)');
        } else {
          if (nonePeri) parts.push('None problem (Peri op)');
          if (nonePost) parts.push('None problem (Post op)');
        }
        const compSummary = summarizePostOpComplications(comp);
        if (compSummary) parts.push(compSummary);
        return esc(parts.join(' · ') || '-');
      })()}${fd.postOpComplication?.severityLevel ? ` · ระดับความรุนแรง: ${esc(fd.postOpComplication.severityLevel)}` : ''}${
        fd.postOpComplication?.remark?.trim() ? ` · Remark: ${esc(fd.postOpComplication.remark.trim())}` : ''
      }</div>
      <div class="field"><strong>Post Anesthesia Evaluation</strong></div>
      <div class="field">Vital signs: BP ${blankSlot(pa.bp, 68)} mmHg &nbsp; P ${blankSlot(pa.pulse, 44)} /min &nbsp; RR ${blankSlot(pa.rr, 42)} /min &nbsp; T ${blankSlot(pa.temp, 44)} °C &nbsp; SpO2 ${blankSlot(pa.spo2, 44)} % &nbsp; PS ${blankSlot(pa.painScore, 38)} คะแนน</div>
      <div class="field"><strong>Post anesthesia complication:</strong> ${radioMark(pa.complicationStatus === 'no', 'No')} ${radioMark(pa.complicationStatus === 'yes', 'Yes')} ${blankSlot(pa.complicationDetail, 180)}</div>
      <div class="field" style="text-align:right;">ผู้บันทึกข้อมูล Post op / visit by: ${blankSlot(pa.visitBy || fd.postOpComplication?.postOpRecorder, 130)} วันที่: ${blankSlot(formatThaiDateBE(pa.visitDate || fd.postOpComplication?.postOpDate || ''), 82)}${fd.postOpComplication?.postOpTime ? ` เวลา: <span class="val">${esc(fd.postOpComplication.postOpTime)}</span>` : ''}</div>
    </div>
  </div>
  <div class="footer-code">ANE-FM-002-03 &amp; ANE-FM-006-01</div>
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
