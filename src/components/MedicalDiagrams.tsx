import React, { useId } from 'react';
import { LaboratoryData, MallampatiClass, TOOTH_LABELS, ToothId } from '../types/evaluation';

export function BphLogo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-label="Bangplee Hospital Logo"
      role="img"
    >
      <rect x="2" y="2" width="44" height="44" rx="4" fill="#1E3A8A" />
      <rect x="19" y="8" width="10" height="24" rx="1.5" fill="#FFFFFF" />
      <rect x="12" y="15" width="24" height="10" rx="1.5" fill="#FFFFFF" />
      <text
        x="24"
        y="22.5"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="#1E3A8A"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        BPH
      </text>
      <text
        x="24"
        y="41"
        textAnchor="middle"
        fontSize="5"
        fontWeight="600"
        fill="#E2E8F0"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        BANGPLEE
      </text>
    </svg>
  );
}

interface MallampatiProps {
  value: MallampatiClass;
  onChange?: (val: MallampatiClass) => void;
  compact?: boolean;
}

export function MallampatiSelector({ value, onChange, compact = false }: MallampatiProps) {
  const classes: {
    id: Exclude<MallampatiClass, ''>;
    label: string;
    desc: string;
    uvulaHeight: number;
    pillarsVisible: boolean;
    softPalateVisible: boolean;
  }[] = [
    {
      id: 'I',
      label: 'I',
      desc: 'Soft palate, fauces, uvula, pillars',
      uvulaHeight: 22,
      pillarsVisible: true,
      softPalateVisible: true,
    },
    {
      id: 'II',
      label: 'II',
      desc: 'Soft palate, fauces, uvula',
      uvulaHeight: 16,
      pillarsVisible: false,
      softPalateVisible: true,
    },
    {
      id: 'III',
      label: 'III',
      desc: 'Soft palate, base of uvula',
      uvulaHeight: 8,
      pillarsVisible: false,
      softPalateVisible: true,
    },
    {
      id: 'IV',
      label: 'IV',
      desc: 'Hard palate only',
      uvulaHeight: 0,
      pillarsVisible: false,
      softPalateVisible: false,
    },
  ];

  return (
    <div className={`grid grid-cols-4 ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {classes.map((item) => {
        const selected = value === item.id;
        const InteractiveTag = onChange ? 'button' : 'div';
        return (
          <InteractiveTag
            key={item.id}
            type={onChange ? 'button' : undefined}
            onClick={onChange ? () => onChange(selected ? '' : item.id) : undefined}
            title={`Class ${item.label}: ${item.desc}`}
            className={`group flex flex-col items-center rounded-md border transition-colors ${
              compact ? 'p-1' : 'p-1.5'
            } ${
              selected
                ? 'border-blue-800 bg-blue-50 text-blue-950'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <span
              className={`font-mono text-xs font-semibold leading-none mb-1 ${
                selected ? 'text-blue-900' : 'text-slate-700'
              }`}
            >
              {item.label}
            </span>
            <svg
              viewBox="0 0 60 54"
              className={compact ? 'w-10 h-9' : 'w-12 h-11'}
              aria-hidden="true"
            >
              {/* Oral cavity outer lips */}
              <ellipse
                cx="30"
                cy="27"
                rx="24"
                ry="22"
                fill="#F8D7DA"
                stroke={selected ? '#1E3A8A' : '#94A3B8'}
                strokeWidth="1.8"
              />
              {/* Dark pharyngeal back */}
              <ellipse cx="30" cy="25" rx="18" ry="15" fill="#4A1D24" />
              {/* Hard palate arch */}
              <path
                d="M12 22 Q30 7 48 22 L48 15 Q30 4 12 15 Z"
                fill="#F3B4B8"
              />
              {/* Soft palate & pillars */}
              {item.softPalateVisible && (
                <path
                  d="M14 22 Q23 15 30 19 Q37 15 46 22 L46 14 Q30 8 14 14 Z"
                  fill="#E88D96"
                />
              )}
              {item.pillarsVisible && (
                <>
                  <path d="M16 20 Q18 30 15 38" stroke="#E5989B" strokeWidth="2.2" fill="none" />
                  <path d="M44 20 Q42 30 45 38" stroke="#E5989B" strokeWidth="2.2" fill="none" />
                </>
              )}
              {/* Uvula */}
              {item.uvulaHeight > 0 && (
                <path
                  d={`M26.5 18 Q30 ${18 + item.uvulaHeight} 33.5 18 Z`}
                  fill="#D96B78"
                />
              )}
              {/* Tongue */}
              <path
                d={
                  item.id === 'IV'
                    ? 'M11 26 Q30 15 49 26 Q49 45 30 46 Q11 45 11 26 Z'
                    : item.id === 'III'
                    ? 'M12 31 Q30 22 48 31 Q47 45 30 46 Q13 45 12 31 Z'
                    : 'M13 35 Q30 28 47 35 Q45 45 30 46 Q15 45 13 35 Z'
                }
                fill="#D97B86"
                stroke="#B55863"
                strokeWidth="0.9"
              />
            </svg>
            {!compact && (
              <span className="mt-1 text-[10px] leading-tight text-slate-500 text-center line-clamp-2">
                {item.desc}
              </span>
            )}
          </InteractiveTag>
        );
      })}
    </div>
  );
}

interface DentalArchBadgeProps {
  className?: string;
  missingTeeth?: string[];
  looseTeeth?: string[];
  interactive?: boolean;
  onToggleTooth?: (toothId: ToothId) => void;
}

interface ToothShape {
  id: ToothId;
  d: string;
  fill: string;
  hi: string;
  cx: number;
  cy: number;
  r: number;
}

export function DentalArchBadge({
  className = 'w-28 h-[72px]',
  missingTeeth = [],
  looseTeeth = [],
  interactive = false,
  onToggleTooth,
}: DentalArchBadgeProps) {
  const uid = useId().replace(/:/g, '');
  const clipId = `mouthApertureClip_${uid}`;
  const oralGradId = `oralBgGrad_${uid}`;
  const upperLipGradId = `upperLipGrad_${uid}`;
  const lowerLipGradId = `lowerLipGrad_${uid}`;
  const upperGumGradId = `upperGumGrad_${uid}`;
  const lowerGumGradId = `lowerGumGrad_${uid}`;
  const toothUpperGradId = `toothUpperGrad_${uid}`;
  const toothLowerGradId = `toothLowerGrad_${uid}`;
  const toothDepthGradId = `toothDepthGrad_${uid}`;

  const missingSet = new Set(missingTeeth);
  const looseSet = new Set(looseTeeth);

  const upperTeeth: ToothShape[] = [
    // Left (patient's right): premolar -> canine -> lateral -> central
    {
      id: 'u1',
      d: 'M18 27 C18 22.5, 22.5 21.5, 24.5 24.5 L24.5 32.5 C21.5 34, 19 32, 18 27 Z',
      fill: `url(#${toothDepthGradId})`,
      hi: 'M20 25.5 Q21.2 24.5 22 29',
      cx: 21.4,
      cy: 28,
      r: 2.1,
    },
    {
      id: 'u2',
      d: 'M25 24 C26 19.5, 31.5 19, 33.5 22.5 L33 33.2 Q29.2 37.5 25 32.2 Z',
      fill: `url(#${toothUpperGradId})`,
      hi: 'M27.8 23 Q28.8 27 28.2 31.5',
      cx: 29.2,
      cy: 27.6,
      r: 2.6,
    },
    {
      id: 'u3',
      d: 'M34 21.5 C35.5 17.5, 41.5 17, 43 20.8 L42.7 34 C40 35.3, 36.2 35, 34 33 Z',
      fill: `url(#${toothUpperGradId})`,
      hi: 'M37.2 21 Q38.2 25.5 37.7 31',
      cx: 38.5,
      cy: 27.2,
      r: 2.9,
    },
    {
      id: 'u4',
      d: 'M43.5 20 C46 16.2, 57.2 16.2, 59.5 19.8 L59.5 35 C54.8 36.4, 47.5 36.4, 43.5 34.6 Z',
      fill: `url(#${toothUpperGradId})`,
      hi: 'M48.5 21 Q49.5 26.5 49 32',
      cx: 51.5,
      cy: 27.5,
      r: 3.8,
    },
    // Right (midline outward): central -> lateral -> canine -> premolar
    {
      id: 'u5',
      d: 'M60.5 19.8 C62.8 16.2, 74 16.2, 76.5 20 L76.5 34.6 C72.5 36.4, 65.2 36.4, 60.5 35 Z',
      fill: `url(#${toothUpperGradId})`,
      hi: 'M65.5 21 Q66.5 26.5 66 32',
      cx: 68.5,
      cy: 27.5,
      r: 3.8,
    },
    {
      id: 'u6',
      d: 'M77 20.8 C78.5 17, 84.5 17.5, 86 21.5 L86 33 C83.8 35, 80 35.3, 77.3 34 Z',
      fill: `url(#${toothUpperGradId})`,
      hi: 'M80.5 21 Q81.5 25.5 81 31',
      cx: 81.5,
      cy: 27.2,
      r: 2.9,
    },
    {
      id: 'u7',
      d: 'M86.5 22.5 C88.5 19, 94 19.5, 95 24 L95 32.2 Q90.8 37.5 87 33.2 Z',
      fill: `url(#${toothUpperGradId})`,
      hi: 'M90.2 23 Q91.2 27 90.7 31.5',
      cx: 90.8,
      cy: 27.6,
      r: 2.6,
    },
    {
      id: 'u8',
      d: 'M95.5 24.5 C97.5 21.5, 102 22.5, 102 27 C101 32, 98.5 34, 95.5 32.5 Z',
      fill: `url(#${toothDepthGradId})`,
      hi: 'M98 25.5 Q99.2 27.5 98.5 30',
      cx: 98.6,
      cy: 28,
      r: 2.1,
    },
  ];

  const lowerTeeth: ToothShape[] = [
    // Left (patient's right): 2nd premolar -> 1st premolar -> canine -> lateral -> central
    {
      id: 'l1',
      d: 'M19 46 C19.5 49.8, 23 50.2, 24.5 47.5 L24.5 41.5 C22.2 40.6, 20 42, 19 46 Z',
      fill: `url(#${toothDepthGradId})`,
      hi: 'M21 47 Q22 44.5 22.2 43',
      cx: 21.8,
      cy: 44.5,
      r: 1.9,
    },
    {
      id: 'l2',
      d: 'M25 48 C26 52, 30.8 52, 32.2 49 L32.2 40.8 Q28.5 39, 25 41.5 Z',
      fill: `url(#${toothLowerGradId})`,
      hi: 'M27.8 48.5 Q28.8 45 28.2 42.5',
      cx: 28.6,
      cy: 45,
      r: 2.3,
    },
    {
      id: 'l3',
      d: 'M32.8 49.5 C34.2 53.5, 39.8 53.5, 41.2 50.5 L41.2 40.2 Q37 37.2 32.8 41 Z',
      fill: `url(#${toothLowerGradId})`,
      hi: 'M36 50 Q37 45.5 36.5 41.2',
      cx: 37,
      cy: 45,
      r: 2.6,
    },
    {
      id: 'l4',
      d: 'M41.8 51 C43.2 54.5, 48.8 54.5, 50.2 51.5 L50.2 39.5 C47.5 39, 44.5 39.2, 41.8 39.8 Z',
      fill: `url(#${toothLowerGradId})`,
      hi: 'M45 51 Q46 46 45.5 41.8',
      cx: 46,
      cy: 45.2,
      r: 2.7,
    },
    {
      id: 'l5',
      d: 'M50.8 51.8 C52.2 55.2, 58 55.2, 59.5 52 L59.5 39.3 C56.5 38.8, 53.5 38.8, 50.8 39.4 Z',
      fill: `url(#${toothLowerGradId})`,
      hi: 'M54.2 51.5 Q55.2 46 54.7 41.8',
      cx: 55.2,
      cy: 45.2,
      r: 2.8,
    },
    // Right (midline outward): central -> lateral -> canine -> 1st premolar -> 2nd premolar
    {
      id: 'l6',
      d: 'M60.5 52 C62 55.2, 67.8 55.2, 69.2 51.8 L69.2 39.4 C66.5 38.8, 63.5 38.8, 60.5 39.3 Z',
      fill: `url(#${toothLowerGradId})`,
      hi: 'M63.8 51.5 Q64.8 46 64.3 41.8',
      cx: 64.8,
      cy: 45.2,
      r: 2.8,
    },
    {
      id: 'l7',
      d: 'M69.8 51.5 C71.2 54.5, 76.8 54.5, 78.2 51 L78.2 39.8 C75.5 39.2, 72.5 39, 69.8 39.5 Z',
      fill: `url(#${toothLowerGradId})`,
      hi: 'M73 51 Q74 46 73.5 41.8',
      cx: 74,
      cy: 45.2,
      r: 2.7,
    },
    {
      id: 'l8',
      d: 'M78.8 50.5 C80.2 53.5, 85.8 53.5, 87.2 49.5 L87.2 41 Q83 37.2 78.8 40.2 Z',
      fill: `url(#${toothLowerGradId})`,
      hi: 'M82 50 Q83 45.5 82.5 41.2',
      cx: 83,
      cy: 45,
      r: 2.6,
    },
    {
      id: 'l9',
      d: 'M87.8 49 C89.2 52, 94 52, 95 48 L95 41.5 Q91.5 39, 87.8 40.8 Z',
      fill: `url(#${toothLowerGradId})`,
      hi: 'M90.5 48.5 Q91.5 45 91 42.5',
      cx: 91.4,
      cy: 45,
      r: 2.3,
    },
    {
      id: 'l10',
      d: 'M95.5 47.5 C97 50.2, 100.5 49.8, 101 46 C100 42, 97.8 40.6, 95.5 41.5 Z',
      fill: `url(#${toothDepthGradId})`,
      hi: 'M97.5 47 Q98.5 44.5 98.2 43',
      cx: 98.2,
      cy: 44.5,
      r: 1.9,
    },
  ];

  const mouthAperturePath =
    'M13 34 C26 25.5, 44 21.5, 60 21.5 C76 21.5, 94 25.5, 107 34 C94 44.5, 77 52, 60 52 C43 52, 26 44.5, 13 34 Z';

  const renderTooth = (tooth: ToothShape, hiStrokeWidth: number) => {
    const isMissing = missingSet.has(tooth.id);
    const isLoose = !isMissing && looseSet.has(tooth.id);
    const label = TOOTH_LABELS[tooth.id];
    const statusDesc = isMissing ? 'ฟันหลอ (สีดำ)' : isLoose ? 'ฟันโยก (X)' : 'ปกติ';

    return (
      <g
        key={tooth.id}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? `ฟัน${label}: ${statusDesc} (แตะเพื่อ mark)` : undefined}
        onClick={interactive ? () => onToggleTooth?.(tooth.id) : undefined}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleTooth?.(tooth.id);
                }
              }
            : undefined
        }
        className={interactive ? 'cursor-pointer hover:opacity-85 focus:outline-none' : undefined}
      >
        <title>{`${label}: ${statusDesc}`}</title>
        <path
          d={tooth.d}
          fill={isMissing ? '#090D16' : isLoose ? '#FEF3C7' : tooth.fill}
          stroke={isMissing ? '#000000' : isLoose ? '#D97706' : '#8B7E6F'}
          strokeWidth={isMissing ? '0.9' : '0.7'}
          strokeLinejoin="round"
        />
        {!isMissing && (
          <path
            d={tooth.hi}
            stroke="#FFFFFF"
            strokeWidth={hiStrokeWidth}
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
        )}
        {isLoose && (
          <g pointerEvents="none">
            <path
              d={`M${tooth.cx - tooth.r} ${tooth.cy - tooth.r} L${tooth.cx + tooth.r} ${tooth.cy + tooth.r} M${tooth.cx + tooth.r} ${tooth.cy - tooth.r} L${tooth.cx - tooth.r} ${tooth.cy + tooth.r}`}
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
              opacity="0.92"
            />
            <path
              d={`M${tooth.cx - tooth.r} ${tooth.cy - tooth.r} L${tooth.cx + tooth.r} ${tooth.cy + tooth.r} M${tooth.cx + tooth.r} ${tooth.cy - tooth.r} L${tooth.cx - tooth.r} ${tooth.cy + tooth.r}`}
              stroke="#DC2626"
              strokeWidth="1.35"
              strokeLinecap="round"
            />
          </g>
        )}
      </g>
    );
  };

  return (
    <svg viewBox="0 0 120 76" className={className} aria-hidden={!interactive}>
      <defs>
        <clipPath id={clipId}>
          <path d={mouthAperturePath} />
        </clipPath>
        <linearGradient id={oralGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#351017" />
          <stop offset="50%" stopColor="#541C26" />
          <stop offset="100%" stopColor="#351017" />
        </linearGradient>
        <linearGradient id={upperLipGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EC8796" />
          <stop offset="55%" stopColor="#DB6377" />
          <stop offset="100%" stopColor="#BF495E" />
        </linearGradient>
        <linearGradient id={lowerLipGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CA566B" />
          <stop offset="40%" stopColor="#E67A8B" />
          <stop offset="85%" stopColor="#F198A6" />
          <stop offset="100%" stopColor="#D7677B" />
        </linearGradient>
        <linearGradient id={upperGumGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E38B99" />
          <stop offset="100%" stopColor="#F5BAC3" />
        </linearGradient>
        <linearGradient id={lowerGumGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5BAC3" />
          <stop offset="100%" stopColor="#E38B99" />
        </linearGradient>
        <linearGradient id={toothUpperGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E9E3D6" />
          <stop offset="35%" stopColor="#FAF8F4" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
        <linearGradient id={toothLowerGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#FAF8F4" />
          <stop offset="100%" stopColor="#E9E3D6" />
        </linearGradient>
        <linearGradient id={toothDepthGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D8D1C3" />
          <stop offset="50%" stopColor="#EFEBE2" />
          <stop offset="100%" stopColor="#DFD8CA" />
        </linearGradient>
      </defs>

      {/* Clean outer card */}
      <rect x="1" y="1" width="118" height="74" rx="7" fill="#FFFDFD" stroke="#CBD5E1" />

      {/* Oral cavity & teeth clipped cleanly inside smiling lip opening */}
      <g clipPath={`url(#${clipId})`}>
        <rect x="10" y="18" width="100" height="40" fill={`url(#${oralGradId})`} />

        {/* Soft tongue shadow inside lower cavity */}
        <path
          d="M28 45 Q60 36 92 45 Q84 56 60 56 Q36 56 28 45 Z"
          fill="#9E4856"
          opacity="0.55"
        />

        {/* Upper gingiva */}
        <path
          d="M12 29 Q36 15 60 15 Q84 15 108 29 L106 23 Q82 14 60 14 Q38 14 14 23 Z"
          fill={`url(#${upperGumGradId})`}
        />

        {/* Lower gingiva */}
        <path
          d="M14 45 Q37 56 60 56 Q83 56 106 45 L107 52 Q84 60 60 60 Q36 60 13 52 Z"
          fill={`url(#${lowerGumGradId})`}
        />

        {/* Upper anatomical teeth */}
        {upperTeeth.map((tooth) => renderTooth(tooth, 1.05))}

        {/* Lower anatomical teeth */}
        {lowerTeeth.map((tooth) => renderTooth(tooth, 0.95))}
      </g>

      {/* Sculpted Upper Lip with Cupid's Bow */}
      <path
        d="M9 34 C22 22, 36 10.5, 47.5 10.5 C53 10.5, 56.5 14, 60 14 C63.5 14, 67 10.5, 72.5 10.5 C84 10.5, 98 22, 111 34 C109 34.4, 108 34.2, 107 34 C94 25.5, 76 21.5, 60 21.5 C44 21.5, 26 25.5, 13 34 C12 34.2, 11 34.4, 9 34 Z"
        fill={`url(#${upperLipGradId})`}
        stroke="#B34458"
        strokeWidth="0.8"
        strokeLinejoin="round"
        pointerEvents="none"
      />

      {/* Cupid's bow delicate highlight */}
      <path
        d="M36 16.5 C41.5 12.5, 45 11.4, 47.5 11.4 C52.5 11.4, 56 14.8, 60 14.8 C64 14.8, 67.5 11.4, 72.5 11.4 C75 11.4, 78.5 12.5, 84 16.5"
        stroke="#FFDCE2"
        strokeWidth="1.15"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
        pointerEvents="none"
      />

      {/* Graceful Plump Lower Lip */}
      <path
        d="M9 34 C11 33.8, 12 33.8, 13 34 C26 44.5, 43 52, 60 52 C77 52, 94 44.5, 107 34 C108 33.8, 109 33.8, 111 34 C100 52.5, 82 66.5, 60 66.5 C38 66.5, 20 52.5, 9 34 Z"
        fill={`url(#${lowerLipGradId})`}
        stroke="#B34458"
        strokeWidth="0.8"
        strokeLinejoin="round"
        pointerEvents="none"
      />

      {/* Lower lip natural gloss highlight */}
      <path
        d="M44 58.5 Q60 63 76 58.5"
        stroke="#FFE5E9"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.65"
        pointerEvents="none"
      />
      <path
        d="M52 57.5 Q60 59.5 68 57.5"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
        pointerEvents="none"
      />

      {/* Mouth corner dimple accents */}
      <path
        d="M8.5 34.2 Q10.5 34 12.5 34.2"
        stroke="#9A3649"
        strokeWidth="0.9"
        strokeLinecap="round"
        pointerEvents="none"
      />
      <path
        d="M107.5 34.2 Q109.5 34 111.5 34.2"
        stroke="#9A3649"
        strokeWidth="0.9"
        strokeLinecap="round"
        pointerEvents="none"
      />
    </svg>
  );
}

interface LabFishboneProps {
  lab: LaboratoryData;
  onChange?: (field: keyof LaboratoryData, val: string) => void;
  readOnly?: boolean;
}

type StringLabField = {
  [K in keyof LaboratoryData]: LaboratoryData[K] extends string ? K : never;
}[keyof LaboratoryData];

export function CbcFishbone({ lab, onChange, readOnly = false }: LabFishboneProps) {
  const renderInput = (field: StringLabField, title: string) => {
    if (readOnly) {
      return (
        <span className="font-mono tabular-nums text-[11px] font-medium text-slate-900">
          {lab[field] || '—'}
        </span>
      );
    }
    return (
      <input
        type="text"
        value={lab[field]}
        onChange={(e) => onChange?.(field, e.target.value)}
        title={title}
        aria-label={title}
        className="w-full text-center font-mono tabular-nums text-xs bg-white border border-slate-300 rounded px-1 py-0.5 text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
      />
    );
  };

  return (
    <div className="relative">
      <div className="text-[11px] font-semibold text-slate-700 mb-1">CBC</div>
      <div className="grid grid-cols-[54px_1fr_54px] items-center gap-0.5">
        {/* Left: Hb / Hct */}
        <div className="flex flex-col gap-1 pr-1">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-slate-500 leading-none mb-0.5">Hb</span>
            {renderInput('hb', 'Hemoglobin (g/dL)')}
          </div>
          <div className="flex flex-col items-center">
            {renderInput('hct', 'Hematocrit (%)')}
            <span className="text-[9px] text-slate-500 leading-none mt-0.5">Hct</span>
          </div>
        </div>

        {/* Center Fishbone Spine: WBC top / Plt bottom */}
        <div className="relative flex flex-col items-center justify-center py-0.5">
          <div className="w-full px-1 pb-1 border-b-2 border-slate-700 flex flex-col items-center">
            <span className="text-[9px] text-slate-500 leading-none mb-0.5">WBC</span>
            {renderInput('wbc', 'WBC (/uL)')}
          </div>
          <div className="w-full px-1 pt-1 flex flex-col items-center">
            {renderInput('plt', 'Platelet (/uL)')}
            <span className="text-[9px] text-slate-500 leading-none mt-0.5">Plt</span>
          </div>
          {/* Diagonal forks matching paper diagram */}
          <div className="pointer-events-none absolute inset-y-1 left-0 w-px bg-slate-700" />
          <div className="pointer-events-none absolute inset-y-1 right-0 w-px bg-slate-700" />
        </div>

        {/* Right: N / L */}
        <div className="flex flex-col gap-1 pl-1">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-slate-500 leading-none mb-0.5">N%</span>
            {renderInput('neutrophil', 'Neutrophil (%)')}
          </div>
          <div className="flex flex-col items-center">
            {renderInput('lymphocyte', 'Lymphocyte (%)')}
            <span className="text-[9px] text-slate-500 leading-none mt-0.5">L%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChemFishbone({ lab, onChange, readOnly = false }: LabFishboneProps) {
  const renderInput = (field: StringLabField, title: string) => {
    if (readOnly) {
      return (
        <span className="font-mono tabular-nums text-[11px] font-medium text-slate-900">
          {lab[field] || '—'}
        </span>
      );
    }
    return (
      <input
        type="text"
        value={lab[field]}
        onChange={(e) => onChange?.(field, e.target.value)}
        title={title}
        aria-label={title}
        className="w-full text-center font-mono tabular-nums text-xs bg-white border border-slate-300 rounded px-1 py-0.5 text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
      />
    );
  };

  return (
    <div className="relative">
      <div className="text-[11px] font-semibold text-slate-700 mb-1">Blood chemistry</div>
      <div className="grid grid-cols-3 border-collapse">
        {/* Top Row: Na | K | BUN */}
        <div className="border-b-2 border-r-2 border-slate-700 p-1 flex flex-col items-center">
          <span className="text-[9px] text-slate-500 leading-none mb-0.5">Na</span>
          {renderInput('na', 'Sodium (mEq/L)')}
        </div>
        <div className="border-b-2 border-r-2 border-slate-700 p-1 flex flex-col items-center">
          <span className="text-[9px] text-slate-500 leading-none mb-0.5">K</span>
          {renderInput('k', 'Potassium (mEq/L)')}
        </div>
        <div className="border-b-2 border-slate-700 p-1 flex flex-col items-center">
          <span className="text-[9px] text-slate-500 leading-none mb-0.5">BUN</span>
          {renderInput('bun', 'BUN (mg/dL)')}
        </div>
        {/* Bottom Row: Cl | CO2 | Cr */}
        <div className="border-r-2 border-slate-700 p-1 flex flex-col items-center">
          {renderInput('cl', 'Chloride (mEq/L)')}
          <span className="text-[9px] text-slate-500 leading-none mt-0.5">Cl</span>
        </div>
        <div className="border-r-2 border-slate-700 p-1 flex flex-col items-center">
          {renderInput('co2', 'CO2 / HCO3- (mEq/L)')}
          <span className="text-[9px] text-slate-500 leading-none mt-0.5">CO2</span>
        </div>
        <div className="p-1 flex flex-col items-center">
          {renderInput('cr', 'Creatinine (mg/dL)')}
          <span className="text-[9px] text-slate-500 leading-none mt-0.5">Cr</span>
        </div>
      </div>
    </div>
  );
}
