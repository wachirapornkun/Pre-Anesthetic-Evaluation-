import React, { useState } from 'react';

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  color: string;
  subtext?: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  total: number;
  centerLabel: string;
  emptyText?: string;
}

export function DonutChart({
  segments,
  total,
  centerLabel,
  emptyText = 'ยังไม่มีข้อมูล',
}: DonutChartProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const visibleSegments = segments.filter((s) => s.value > 0);
  const radius = 56;
  const strokeWidth = 20;
  const size = 152;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const activeSegment = hoveredKey
    ? segments.find((s) => s.key === hoveredKey) ?? null
    : null;

  let cumulativeFraction = 0;
  const arcs = visibleSegments.map((seg) => {
    const fraction = total > 0 ? seg.value / total : 0;
    const dashLength = Math.max(0, fraction * circumference - (visibleSegments.length > 1 ? 2.2 : 0));
    const dashOffset = -cumulativeFraction * circumference;
    cumulativeFraction += fraction;
    return {
      ...seg,
      fraction,
      dashLength,
      dashOffset,
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      {/* SVG Donut */}
      <div className="relative w-[152px] h-[152px] shrink-0">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full -rotate-90"
          role="img"
          aria-label={centerLabel}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {arcs.map((arc) => {
            const isDimmed = hoveredKey !== null && hoveredKey !== arc.key;
            const isFocused = hoveredKey === arc.key;
            return (
              <circle
                key={arc.key}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={isFocused ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={`${arc.dashLength} ${circumference}`}
                strokeDashoffset={arc.dashOffset}
                strokeLinecap="butt"
                opacity={isDimmed ? 0.35 : 1}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredKey(arc.key)}
                onMouseLeave={() => setHoveredKey(null)}
              />
            );
          })}
        </svg>

        {/* Center Readout */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-3">
          {activeSegment ? (
            <>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-900 leading-tight">
                {activeSegment.value}
              </span>
              <span className="text-[11px] font-mono tabular-nums font-semibold text-slate-600">
                {total > 0 ? ((activeSegment.value / total) * 100).toFixed(1) : '0.0'}%
              </span>
              <span className="text-[10px] font-medium text-slate-500 truncate max-w-[92px] mt-0.5">
                {activeSegment.label}
              </span>
            </>
          ) : (
            <>
              <span className="text-xl font-bold font-mono tabular-nums text-slate-900 leading-tight">
                {total}
              </span>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5">
                {total > 0 ? centerLabel : emptyText}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend & Share Bars */}
      <div className="flex-1 w-full space-y-2.5 min-w-0">
        {segments.map((seg) => {
          const pct = total > 0 ? (seg.value / total) * 100 : 0;
          const isFocused = hoveredKey === seg.key;
          return (
            <div
              key={seg.key}
              onMouseEnter={() => setHoveredKey(seg.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className={`rounded-lg px-2 py-1.5 -mx-2 transition-colors ${
                isFocused ? 'bg-slate-50' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="font-medium text-slate-800 truncate">{seg.label}</span>
                  {seg.subtext && (
                    <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                      {seg.subtext}
                    </span>
                  )}
                </div>
                <span className="font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap shrink-0">
                  {seg.value} ราย{' '}
                  <span className="font-normal text-slate-500">({pct.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, pct)}%`,
                    backgroundColor: seg.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface MonthlyElectiveVisitPoint {
  monthKey: string;
  label: string;
  fullLabel: string;
  year: string;
  totalElective: number;
  preOpVisited: number;
  postOpVisited: number;
  preOpPct: number;
  postOpPct: number;
}

interface ElectiveMonthlyVisitChartProps {
  monthlyData: MonthlyElectiveVisitPoint[];
  availableYears: string[];
  selectedYear: string;
  onSelectYear: (year: string) => void;
}

function formatYearBe(yearStr: string): string {
  const num = parseInt(yearStr, 10);
  if (Number.isNaN(num)) return yearStr;
  return `พ.ศ. ${num + 543}`;
}

function formatPctCompact(pct: number): string {
  if (pct === 0 || pct === 100 || Math.abs(pct - Math.round(pct)) < 0.05) {
    return `${Math.round(pct)}%`;
  }
  return `${pct.toFixed(1)}%`;
}

export function ElectiveMonthlyVisitChart({
  monthlyData,
  availableYears,
  selectedYear,
  onSelectYear,
}: ElectiveMonthlyVisitChartProps) {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  const totals = monthlyData.reduce(
    (acc, item) => {
      acc.elective += item.totalElective;
      acc.pre += item.preOpVisited;
      acc.post += item.postOpVisited;
      return acc;
    },
    { elective: 0, pre: 0, post: 0 },
  );

  const overallPrePct = totals.elective > 0 ? (totals.pre / totals.elective) * 100 : 0;
  const overallPostPct = totals.elective > 0 ? (totals.post / totals.elective) * 100 : 0;

  const activePoint = hoveredMonth
    ? monthlyData.find((d) => d.monthKey === hoveredMonth) ?? null
    : null;

  // Chart geometry
  const chartHeight = 254;
  const padTop = 34;
  const padRight = 20;
  const padBottom = 50;
  const padLeft = 44;
  const plotHeight = chartHeight - padTop - padBottom;
  const groupSlotWidth = Math.max(82, Math.min(120, Math.floor(680 / Math.max(1, monthlyData.length))));
  const chartWidth = Math.max(520, padLeft + padRight + monthlyData.length * groupSlotWidth);
  const plotWidth = chartWidth - padLeft - padRight;
  const barWidth = Math.min(26, Math.max(16, Math.floor((groupSlotWidth - 28) / 2)));
  const barGap = 6;

  const yTicks = [0, 25, 50, 75, 100];
  const yForPct = (pct: number) => padTop + plotHeight * (1 - Math.max(0, Math.min(100, pct)) / 100);
  const target100Y = yForPct(100);

  return (
    <div className="bg-white border border-pborder rounded-xl p-5 space-y-4">
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-pborder">
        <div>
          <h3 className="text-sm font-semibold text-[#243040]">
            อัตราการเยี่ยมผู้ป่วย Elective Case รายเดือน (% เยี่ยม Pre-op และ % เยี่ยม Post-op)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            คำนวณเฉพาะเคส Elective แยกตามเดือนผ่าตัด เปรียบเทียบสัดส่วนการเยี่ยมก่อนผ่าตัด (Pre-op) และหลังผ่าตัด (Post-op)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {availableYears.length > 1 && (
            <label className="no-print inline-flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">ปี:</span>
              <select
                value={selectedYear}
                onChange={(e) => onSelectYear(e.target.value)}
                className="bg-white border border-pborder rounded-lg px-2.5 py-1 text-xs text-[#243040] focus:outline-none focus:border-pblue-400"
              >
                <option value="ALL">ทุกปี</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {formatYearBe(yr)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3.5 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-pblue-400 inline-block" />
              <span>เยี่ยม Pre-op (%)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-pgreen-400 inline-block" />
              <span>เยี่ยม Post-op (%)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-prose-700 font-medium">
              <span className="w-4 border-t-[1.5px] border-dashed border-prose-400 inline-block" />
              <span>เกณฑ์ 100%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 font-mono tabular-nums text-slate-700">
          <span>
            Elective ทั้งหมด:{' '}
            <strong className="text-[#243040] text-sm">{totals.elective}</strong> ราย
          </span>
          <span className="text-slate-300" aria-hidden="true">|</span>
          <span>
            เยี่ยม Pre-op รวม:{' '}
            <strong className="text-pblue-800 text-sm">{overallPrePct.toFixed(1)}%</strong>{' '}
            <span className="text-slate-500">({totals.pre}/{totals.elective})</span>
            {totals.elective > 0 && (
              <span
                className={`ml-1.5 font-sans text-[11px] font-semibold ${
                  overallPrePct >= 100 ? 'text-pgreen-800' : 'text-prose-700'
                }`}
              >
                {overallPrePct >= 100 ? '✓ ผ่านเกณฑ์ 100%' : '(เกณฑ์ 100%)'}
              </span>
            )}
          </span>
          <span className="text-slate-300" aria-hidden="true">|</span>
          <span>
            เยี่ยม Post-op รวม:{' '}
            <strong className="text-pgreen-800 text-sm">{overallPostPct.toFixed(1)}%</strong>{' '}
            <span className="text-slate-500">({totals.post}/{totals.elective})</span>
            {totals.elective > 0 && (
              <span
                className={`ml-1.5 font-sans text-[11px] font-semibold ${
                  overallPostPct >= 100 ? 'text-pgreen-800' : 'text-prose-700'
                }`}
              >
                {overallPostPct >= 100 ? '✓ ผ่านเกณฑ์ 100%' : '(เกณฑ์ 100%)'}
              </span>
            )}
          </span>
        </div>

        {activePoint && (
          <div className="text-xs font-mono tabular-nums text-slate-700 bg-pblue-50/70 border border-pblue-200 rounded-lg px-3 py-1">
            <strong className="font-sans text-[#243040]">{activePoint.fullLabel}:</strong>{' '}
            Elective {activePoint.totalElective} ราย · Pre-op{' '}
            <span className="text-pblue-800 font-semibold">
              {activePoint.preOpVisited}/{activePoint.totalElective} ({activePoint.preOpPct.toFixed(1)}%)
            </span>{' '}
            · Post-op{' '}
            <span className="text-pgreen-800 font-semibold">
              {activePoint.postOpVisited}/{activePoint.totalElective} ({activePoint.postOpPct.toFixed(1)}%)
            </span>
          </div>
        )}
      </div>

      {monthlyData.length === 0 ? (
        <div className="py-10 px-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50 space-y-1">
          <p className="text-xs font-medium text-slate-700">
            ยังไม่มีข้อมูลผู้ป่วย Elective Case ในช่วงที่เลือก
          </p>
          <p className="text-[11px] text-slate-500">
            บันทึกเคส Elective พร้อมวันที่ผ่าตัดหรือวันที่เยี่ยมเพื่อแสดงกราฟรายเดือน
          </p>
        </div>
      ) : (
        <>
          {/* Responsive SVG Grouped Column Chart */}
          <div className="overflow-x-auto pb-1">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[460px] max-h-[270px]"
              role="img"
              aria-label="กราฟสรุปอัตราการเยี่ยม Elective Case รายเดือน"
            >
              {/* Horizontal Gridlines & Y-Axis Labels */}
              {yTicks.map((tick) => {
                const y = yForPct(tick);
                return (
                  <g key={tick}>
                    {tick !== 100 && (
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={padLeft + plotWidth}
                        y2={y}
                        stroke={tick === 0 ? '#cbd5e1' : '#e2e8f0'}
                        strokeWidth={tick === 0 ? 1.2 : 1}
                      />
                    )}
                    <text
                      x={padLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontSize={10.5}
                      fontWeight={tick === 100 ? 700 : 400}
                      fill={tick === 100 ? '#944b5c' : '#64748b'}
                      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    >
                      {tick}%
                    </text>
                  </g>
                );
              })}

              {/* 100% Benchmark Dashed Line */}
              <line
                x1={padLeft}
                y1={target100Y}
                x2={padLeft + plotWidth}
                y2={target100Y}
                stroke="#c98392"
                strokeWidth={1.35}
                strokeDasharray="5 4"
              />
              <text
                x={padLeft + plotWidth - 2}
                y={target100Y - 8}
                textAnchor="end"
                fontSize={10}
                fill="#944b5c"
                fontWeight={700}
              >
                เกณฑ์ 100%
              </text>

              {/* Grouped Month Columns */}
              {monthlyData.map((point, idx) => {
                const slotStart =
                  padLeft +
                  (plotWidth - monthlyData.length * groupSlotWidth) / 2 +
                  idx * groupSlotWidth;
                const slotCenter = slotStart + groupSlotWidth / 2;
                const preX = slotCenter - barGap / 2 - barWidth;
                const postX = slotCenter + barGap / 2;

                const preBarTop = yForPct(point.preOpPct);
                const postBarTop = yForPct(point.postOpPct);
                const baseY = yForPct(0);
                const preBarHeight = Math.max(0, baseY - preBarTop);
                const postBarHeight = Math.max(0, baseY - postBarTop);
                const isHovered = hoveredMonth === point.monthKey;

                return (
                  <g
                    key={point.monthKey}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredMonth(point.monthKey)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  >
                    {/* Hover Highlight Band */}
                    <rect
                      x={slotStart + 4}
                      y={padTop - 8}
                      width={groupSlotWidth - 8}
                      height={plotHeight + 12}
                      rx={8}
                      fill={isHovered ? '#f0f7fd' : 'transparent'}
                      stroke={isHovered ? '#c5e2f8' : 'transparent'}
                      strokeWidth={1}
                    />

                    {/* Pre-op Bar (Pastel Sky Blue) */}
                    <rect
                      x={preX}
                      y={preBarHeight > 0 ? preBarTop : baseY - 2}
                      width={barWidth}
                      height={preBarHeight > 0 ? preBarHeight : 2}
                      rx={4}
                      fill={preBarHeight > 0 ? '#72b1e4' : '#e2e8f0'}
                      opacity={hoveredMonth && !isHovered ? 0.55 : 1}
                    />
                    <text
                      x={preX + barWidth / 2}
                      y={Math.max(13, preBarTop - 6)}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={700}
                      fill="#255b87"
                      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    >
                      {formatPctCompact(point.preOpPct)}
                    </text>

                    {/* Post-op Bar (Pastel Mint Green) */}
                    <rect
                      x={postX}
                      y={postBarHeight > 0 ? postBarTop : baseY - 2}
                      width={barWidth}
                      height={postBarHeight > 0 ? postBarHeight : 2}
                      rx={4}
                      fill={postBarHeight > 0 ? '#75c69f' : '#e2e8f0'}
                      opacity={hoveredMonth && !isHovered ? 0.55 : 1}
                    />
                    <text
                      x={postX + barWidth / 2}
                      y={Math.max(13, postBarTop - 6)}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={700}
                      fill="#23684c"
                      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    >
                      {formatPctCompact(point.postOpPct)}
                    </text>

                    {/* X-Axis Month Label & Case Denominator */}
                    <text
                      x={slotCenter}
                      y={baseY + 18}
                      textAnchor="middle"
                      fontSize={11.5}
                      fontWeight={600}
                      fill="#1e293b"
                    >
                      {point.label}
                    </text>
                    <text
                      x={slotCenter}
                      y={baseY + 34}
                      textAnchor="middle"
                      fontSize={10}
                      fill="#64748b"
                      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    >
                      ({point.totalElective} ราย)
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Compact Monthly Breakdown Table */}
          <div className="overflow-x-auto border-t border-slate-100 pt-3">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-500 border-b border-pborder">
                  <th className="py-1.5 pr-3 font-semibold">เดือน</th>
                  <th className="py-1.5 px-3 font-semibold text-right whitespace-nowrap">
                    Elective ทั้งหมด
                  </th>
                  <th className="py-1.5 px-3 font-semibold text-right whitespace-nowrap text-pblue-800">
                    เยี่ยม Pre-op (ราย / %)
                  </th>
                  <th className="py-1.5 pl-3 font-semibold text-right whitespace-nowrap text-pgreen-800">
                    เยี่ยม Post-op (ราย / %)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pborder/60 font-mono tabular-nums">
                {monthlyData.map((m) => (
                  <tr
                    key={m.monthKey}
                    onMouseEnter={() => setHoveredMonth(m.monthKey)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className={`transition-colors ${
                      hoveredMonth === m.monthKey ? 'bg-pblue-50/60' : ''
                    }`}
                  >
                    <td className="py-1.5 pr-3 font-sans font-medium text-[#243040] whitespace-nowrap">
                      {m.fullLabel}
                    </td>
                    <td className="py-1.5 px-3 text-right text-[#243040] font-semibold">
                      {m.totalElective} ราย
                    </td>
                    <td className="py-1.5 px-3 text-right whitespace-nowrap">
                      <span className="text-slate-600">
                        {m.preOpVisited}/{m.totalElective}
                      </span>{' '}
                      <strong className="text-pblue-800">({m.preOpPct.toFixed(1)}%)</strong>
                    </td>
                    <td className="py-1.5 pl-3 text-right whitespace-nowrap">
                      <span className="text-slate-600">
                        {m.postOpVisited}/{m.totalElective}
                      </span>{' '}
                      <strong className="text-pgreen-800">({m.postOpPct.toFixed(1)}%)</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export interface AsaSplitRow {
  cls: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'Unspecified';
  label: string;
  shortLabel: string;
  elective: number;
  emergency: number;
  total: number;
}

interface AsaElectiveEmergencyChartProps {
  rows: AsaSplitRow[];
  totalCases: number;
  totalElective: number;
  totalEmergency: number;
  activeAsaFilter: string;
  onSelectAsa: (cls: string) => void;
}

export function AsaElectiveEmergencyChart({
  rows,
  totalCases,
  totalElective,
  totalEmergency,
  activeAsaFilter,
  onSelectAsa,
}: AsaElectiveEmergencyChartProps) {
  const [hoveredCls, setHoveredCls] = useState<string | null>(null);

  const classRows = rows.filter((r) => r.cls !== 'Unspecified');
  const unspecifiedRow = rows.find((r) => r.cls === 'Unspecified');
  const maxBarValue = Math.max(
    1,
    ...classRows.map((r) => Math.max(r.elective, r.emergency)),
  );

  // SVG grouped column chart dimensions for ASA I-VI
  const chartWidth = 460;
  const chartHeight = 196;
  const padTop = 24;
  const padRight = 14;
  const padBottom = 36;
  const padLeft = 32;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;
  const slotW = plotW / classRows.length;
  const barW = 18;
  const barGap = 4;

  const yVal = (val: number) => padTop + plotH * (1 - val / maxBarValue);
  const baseY = padTop + plotH;
  const midTick = Math.ceil(maxBarValue / 2);
  const yTicks = Array.from(new Set([0, midTick, maxBarValue]));

  return (
    <div className="bg-white border border-pborder rounded-xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[#243040]">
            ASA Class I–VI แยก Elective กับ Emergency
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            คลิกที่ ASA Class เพื่อกรองเคส · Elective {totalElective} ราย · Emergency {totalEmergency} ราย
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-pblue-400 inline-block" />
            <span>Elective</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-prose-400 inline-block" />
            <span>Emergency (E)</span>
          </span>
        </div>
      </div>

      {/* Grouped Bar SVG */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[320px] max-h-[210px]"
          role="img"
          aria-label="กราฟ ASA Class I ถึง VI แยก Elective และ Emergency"
        >
          {yTicks.map((tick) => {
            const y = yVal(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + plotW}
                  y2={y}
                  stroke={tick === 0 ? '#cbd5e1' : '#e2e8f0'}
                  strokeWidth={tick === 0 ? 1.2 : 1}
                  strokeDasharray={tick === 0 ? undefined : '3 3'}
                />
                <text
                  x={padLeft - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize={10}
                  fill="#64748b"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {classRows.map((row, idx) => {
            const slotLeft = padLeft + idx * slotW;
            const cx = slotLeft + slotW / 2;
            const eX = cx - barGap / 2 - barW;
            const emX = cx + barGap / 2;
            const eTop = yVal(row.elective);
            const emTop = yVal(row.emergency);
            const eH = Math.max(0, baseY - eTop);
            const emH = Math.max(0, baseY - emTop);
            const isSelected = activeAsaFilter === row.cls;
            const isHovered = hoveredCls === row.cls;

            return (
              <g
                key={row.cls}
                className="cursor-pointer"
                onClick={() => onSelectAsa(isSelected ? 'ALL' : row.cls)}
                onMouseEnter={() => setHoveredCls(row.cls)}
                onMouseLeave={() => setHoveredCls(null)}
              >
                <rect
                  x={slotLeft + 4}
                  y={padTop - 8}
                  width={slotW - 8}
                  height={plotH + 38}
                  rx={8}
                  fill={isSelected ? '#f0f7fd' : isHovered ? '#faf5f7' : 'transparent'}
                  stroke={isSelected ? '#9bcbf0' : 'transparent'}
                  strokeWidth={1}
                />

                {/* Elective bar (Pastel Sky Blue) */}
                <rect
                  x={eX}
                  y={eH > 0 ? eTop : baseY - 2}
                  width={barW}
                  height={eH > 0 ? eH : 2}
                  rx={3.5}
                  fill={eH > 0 ? '#72b1e4' : '#e2e8f0'}
                />
                {row.elective > 0 && (
                  <text
                    x={eX + barW / 2}
                    y={Math.max(12, eTop - 5)}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={700}
                    fill="#255b87"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  >
                    {row.elective}
                  </text>
                )}

                {/* Emergency bar (Pastel Old Rose) */}
                <rect
                  x={emX}
                  y={emH > 0 ? emTop : baseY - 2}
                  width={barW}
                  height={emH > 0 ? emH : 2}
                  rx={3.5}
                  fill={emH > 0 ? '#c98392' : '#e2e8f0'}
                />
                {row.emergency > 0 && (
                  <text
                    x={emX + barW / 2}
                    y={Math.max(12, emTop - 5)}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={700}
                    fill="#7f3849"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  >
                    {row.emergency}
                  </text>
                )}

                {/* X-axis label */}
                <text
                  x={cx}
                  y={baseY + 17}
                  textAnchor="middle"
                  fontSize={11.5}
                  fontWeight={isSelected ? 700 : 600}
                  fill={isSelected ? '#255b87' : '#243040'}
                >
                  {row.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Exact Breakdown Table */}
      <div className="overflow-x-auto border-t border-pborder/60 pt-2">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-slate-500 border-b border-pborder">
              <th className="py-1.5 pr-2 font-semibold">ASA Class</th>
              <th className="py-1.5 px-2 font-semibold text-right text-pblue-800">Elective</th>
              <th className="py-1.5 px-2 font-semibold text-right text-prose-800">Emergency</th>
              <th className="py-1.5 pl-2 font-semibold text-right">รวม (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pborder/60 font-mono tabular-nums">
            {classRows.map((row) => {
              const pct = totalCases > 0 ? (row.total / totalCases) * 100 : 0;
              const isSelected = activeAsaFilter === row.cls;
              return (
                <tr
                  key={row.cls}
                  onClick={() => onSelectAsa(isSelected ? 'ALL' : row.cls)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-pblue-50 text-pblue-800' : 'hover:bg-pblue-50/40'
                  }`}
                >
                  <td className="py-1.5 pr-2 font-sans font-medium text-[#243040]">
                    {row.label}
                  </td>
                  <td className="py-1.5 px-2 text-right font-semibold text-pblue-800">
                    {row.elective}
                  </td>
                  <td className="py-1.5 px-2 text-right font-semibold text-prose-800">
                    {row.emergency}
                  </td>
                  <td className="py-1.5 pl-2 text-right font-semibold text-[#243040]">
                    {row.total}{' '}
                    <span className="font-normal text-slate-500">({pct.toFixed(1)}%)</span>
                  </td>
                </tr>
              );
            })}
            {unspecifiedRow && unspecifiedRow.total > 0 && (
              <tr className="text-slate-500">
                <td className="py-1.5 pr-2 font-sans">ยังไม่ระบุ ASA</td>
                <td className="py-1.5 px-2 text-right">{unspecifiedRow.elective}</td>
                <td className="py-1.5 px-2 text-right">{unspecifiedRow.emergency}</td>
                <td className="py-1.5 pl-2 text-right">
                  {unspecifiedRow.total} (
                  {totalCases > 0 ? ((unspecifiedRow.total / totalCases) * 100).toFixed(1) : '0.0'}%)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface AgeBracketItem {
  key: string;
  label: string;
  subtitle: string;
  count: number;
  color: string;
}

interface AgeBracketChartProps {
  brackets: AgeBracketItem[];
  unspecifiedCount: number;
  total: number;
}

export function AgeBracketChart({
  brackets,
  unspecifiedCount,
  total,
}: AgeBracketChartProps) {
  const maxCount = Math.max(1, ...brackets.map((b) => b.count));

  return (
    <div className="space-y-3.5">
      {brackets.map((item) => {
        const sharePct = total > 0 ? (item.count / total) * 100 : 0;
        const barPct = Math.round((item.count / maxCount) * 100);
        return (
          <div key={item.key} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <div className="flex items-baseline gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0 self-center"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-slate-900 whitespace-nowrap">
                  {item.label}
                </span>
                <span className="text-[11px] text-slate-500 truncate">{item.subtitle}</span>
              </div>
              <span className="font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap shrink-0">
                {item.count} ราย{' '}
                <span className="font-normal text-slate-500">({sharePct.toFixed(1)}%)</span>
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${item.count > 0 ? Math.max(3, barPct) : 0}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        );
      })}

      {unspecifiedCount > 0 && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>ไม่ระบุอายุ</span>
          <span className="font-mono tabular-nums">
            {unspecifiedCount} ราย ({total > 0 ? ((unspecifiedCount / total) * 100).toFixed(1) : '0.0'}%)
          </span>
        </div>
      )}
    </div>
  );
}
