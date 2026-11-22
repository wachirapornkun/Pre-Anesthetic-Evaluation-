import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  QrCode,
  RotateCcw,
  Share2,
  Smartphone,
  X,
} from 'lucide-react';

import { PUBLISHED_APP_URL } from '../firebase';

const DEFAULT_SHARED_APP_URL = PUBLISHED_APP_URL;

export function resolveDefaultShareUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_SHARED_APP_URL;
  const origin = window.location.origin || '';
  if (
    !origin ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.startsWith('https://ais-dev-') ||
    origin.startsWith('https://ais-pre-')
  ) {
    return DEFAULT_SHARED_APP_URL;
  }
  return origin;
}

interface ShareQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (type: 'success' | 'error', text: string) => void;
}

export function ShareQrModal({ isOpen, onClose, onNotify }: ShareQrModalProps) {
  const defaultUrl = useMemo(() => resolveDefaultShareUrl(), []);
  const [targetUrl, setTargetUrl] = useState<string>(defaultUrl);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrError, setQrError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const normalizedUrl = targetUrl.trim() || defaultUrl;
  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const generateQr = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(normalizedUrl, {
          width: 480,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#1f3348',
            light: '#ffffff',
          },
        });
        if (!cancelled) {
          setQrDataUrl(dataUrl);
          setQrError(null);
        }
      } catch {
        if (!cancelled) {
          setQrError('ไม่สามารถสร้าง QR Code จากลิงก์นี้ได้ กรุณาตรวจสอบรูปแบบ URL');
        }
      }
    };

    void generateQr();
    return () => {
      cancelled = true;
    };
  }, [isOpen, normalizedUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(normalizedUrl);
      setCopied(true);
      onNotify?.('success', 'คัดลอกลิงก์เข้าใช้งานแอปเรียบร้อยแล้ว');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onNotify?.('error', 'ไม่สามารถคัดลอกอัตโนมัติได้ กรุณาคัดลอกจากช่องลิงก์ด้านล่าง');
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) {
      await handleCopyUrl();
      return;
    }
    try {
      await navigator.share({
        title: 'Bangplee Pre-Anesthetic — โรงพยาบาลบางพลี',
        text: 'ลิงก์เข้าใช้งานระบบประเมินผู้ป่วยก่อนและหลังให้ยาระงับความรู้สึก (เปิดใน Chrome / Safari และเข้าสู่ระบบด้วยบัญชี Google)',
        url: normalizedUrl,
      });
    } catch (error) {
      // Ignore user cancellation; fallback to copy only on real errors
      if (error instanceof Error && error.name === 'AbortError') return;
      await handleCopyUrl();
    }
  };

  const handleDownloadPosterPng = async () => {
    if (!qrDataUrl || isDownloading) return;
    setIsDownloading(true);
    try {
      const width = 900;
      const height = 1140;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      // Soft pastel backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#eef7fd');
      bgGrad.addColorStop(0.5, '#fdf2f7');
      bgGrad.addColorStop(1, '#eefaf4');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // White inner poster card
      const pad = 44;
      const cardX = pad;
      const cardY = pad;
      const cardW = width - pad * 2;
      const cardH = height - pad * 2;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d4e9fa';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 32);
      ctx.fill();
      ctx.stroke();

      // Top 5-color pastel ribbon
      const ribbonGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
      ribbonGrad.addColorStop(0, '#72b1e4');
      ribbonGrad.addColorStop(0.25, '#e898ba');
      ribbonGrad.addColorStop(0.5, '#75c69f');
      ribbonGrad.addColorStop(0.75, '#e4be5b');
      ribbonGrad.addColorStop(1, '#c98392');
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 32);
      ctx.clip();
      ctx.fillStyle = ribbonGrad;
      ctx.fillRect(cardX, cardY, cardW, 14);
      ctx.restore();

      // Header text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#255b87';
      ctx.font = '600 24px "Sarabun", "Noto Sans Thai", sans-serif';
      ctx.fillText('โรงพยาบาลบางพลี · งานวิสัญญีพยาบาล', width / 2, 125);

      ctx.fillStyle = '#243040';
      ctx.font = '700 42px "Sarabun", "Noto Sans Thai", sans-serif';
      ctx.fillText('Bangplee Pre-Anesthetic', width / 2, 182);

      ctx.fillStyle = '#526275';
      ctx.font = '500 23px "Sarabun", "Noto Sans Thai", sans-serif';
      ctx.fillText('สแกน QR Code เพื่อเข้าใช้งานระบบ Pre-op / Post-op', width / 2, 226);

      // QR frame
      const qrSize = 510;
      const qrX = (width - qrSize) / 2;
      const qrY = 272;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#b4daf6';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48, 28);
      ctx.fill();
      ctx.stroke();

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('QR image load failed'));
        img.src = qrDataUrl;
      });
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // Instructions box
      const tipX = cardX + 48;
      const tipY = 852;
      const tipW = cardW - 96;
      const tipH = 126;
      ctx.fillStyle = '#eef7fd';
      ctx.strokeStyle = '#d4e9fa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(tipX, tipY, tipW, tipH, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#255b87';
      ctx.font = '700 22px "Sarabun", "Noto Sans Thai", sans-serif';
      ctx.fillText('วิธีเข้าใช้งานร่วมกับทีมแบบ Real-time', width / 2, tipY + 42);

      ctx.fillStyle = '#334155';
      ctx.font = '500 20px "Sarabun", "Noto Sans Thai", sans-serif';
      ctx.fillText('1. สแกนด้วยกล้องมือถือ แล้วเปิดใน Chrome หรือ Safari', width / 2, tipY + 76);
      ctx.fillText('2. กด "เข้าสู่ระบบด้วยบัญชี Google" เพื่อซิงค์ข้อมูล Cloud ทันที', width / 2, tipY + 106);

      // URL footer
      ctx.fillStyle = '#64748b';
      ctx.font = '500 17px monospace';
      const urlDisplay =
        normalizedUrl.length > 74 ? `${normalizedUrl.slice(0, 71)}...` : normalizedUrl;
      ctx.fillText(urlDisplay, width / 2, 1036);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = 'Bangplee-PreAnesthetic-QR.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onNotify?.('success', 'ดาวน์โหลดภาพการ์ด QR Code (PNG) เรียบร้อยแล้ว');
    } catch {
      // Fallback: download raw QR PNG directly
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = 'Bangplee-PreAnesthetic-QR.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onNotify?.('success', 'ดาวน์โหลดภาพ QR Code เรียบร้อยแล้ว');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="QR Code สำหรับเข้าใช้งานและแชร์แอป"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="no-print fixed inset-0 z-50 bg-[#243040]/45 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white border border-pblue-200/80 rounded-2xl shadow-xl w-full max-w-md overflow-hidden my-auto">
        <div className="h-[3px] w-full pastel-top-ribbon" aria-hidden="true" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-pborder bg-gradient-to-r from-pblue-50/80 via-white to-ppink-50/70 flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-pblue-800">
              <QrCode className="w-4 h-4 text-pblue-600" />
              QR Code เข้าใช้งาน / แชร์ให้ทีม
            </div>
            <h2 className="text-base font-bold text-[#243040] mt-0.5">
              Bangplee Pre-Anesthetic
            </h2>
            <p className="text-[11px] text-slate-500">
              สแกนเพื่อเปิดใช้งานบนมือถือ แท็บเล็ต หรือส่งภาพ QR ให้เพื่อนร่วมงาน
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง QR"
            className="p-1.5 text-slate-400 hover:text-prose-800 hover:bg-prose-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* QR Card Display */}
          <div className="rounded-2xl bg-gradient-to-br from-pblue-50/80 via-ppink-50/40 to-pgreen-50/70 border border-pblue-200/80 p-5 flex flex-col items-center text-center">
            <div className="bg-white p-3.5 rounded-2xl border-2 border-pblue-200 shadow-xs">
              {qrError ? (
                <div className="w-52 h-52 flex items-center justify-center text-xs text-prose-800 px-3">
                  {qrError}
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code สำหรับเข้าใช้งาน Bangplee Pre-Anesthetic"
                  className="w-52 h-52 sm:w-56 sm:h-56 block select-none"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                  กำลังสร้าง QR Code...
                </div>
              )}
            </div>
            <div className="mt-3 text-xs font-semibold text-[#243040]">
              โรงพยาบาลบางพลี · งานวิสัญญีพยาบาล
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              สแกนด้วยกล้องมือถือเพื่อเปิดระบบ Pre-op / Post-op
            </div>
          </div>

          {/* Primary Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!qrDataUrl || isDownloading}
              onClick={() => void handleDownloadPosterPng()}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-white bg-pblue-600 rounded-xl hover:bg-pblue-700 disabled:opacity-60 transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? 'กำลังสร้างไฟล์ภาพ...' : 'ดาวน์โหลดการ์ด QR (PNG)'}
            </button>

            <button
              type="button"
              onClick={() => void handleCopyUrl()}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-pgreen-800 bg-pgreen-50 border border-pgreen-300 rounded-xl hover:bg-pgreen-100 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-pgreen-700" />
                  คัดลอกลิงก์แล้ว
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-pgreen-700" />
                  คัดลอกลิงก์แอป
                </>
              )}
            </button>
          </div>

          {canNativeShare && (
            <button
              type="button"
              onClick={() => void handleNativeShare()}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-ppink-800 bg-ppink-50 border border-ppink-200 rounded-xl hover:bg-ppink-100 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-ppink-700" />
              แชร์ลิงก์ไปยังแอปอื่น (LINE / AirDrop / อีเมล)
            </button>
          )}

          {/* Share URL Input (Editable if user wants custom URL) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="share-qr-url-input" className="text-[11px] font-semibold text-slate-700">
                ลิงก์ปลายทางของ QR Code (Shared App URL)
              </label>
              {targetUrl.trim() !== defaultUrl && (
                <button
                  type="button"
                  onClick={() => setTargetUrl(defaultUrl)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-pblue-800 hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  ใช้ลิงก์มาตรฐาน
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                id="share-qr-url-input"
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder={defaultUrl}
                className="flex-1 min-w-0 px-2.5 py-1.5 text-[11px] font-mono text-[#243040] bg-pcanvas border border-pborder rounded-lg focus:outline-none focus:ring-2 focus:ring-pblue-300/40 focus:border-pblue-400"
              />
              <a
                href={normalizedUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="เปิดลิงก์ในแท็บใหม่"
                className="p-2 text-slate-500 hover:text-pblue-800 bg-white border border-pborder rounded-lg hover:bg-pblue-50 transition-colors shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Helpful Clinical Team Tip */}
          <div className="rounded-xl bg-pyellow-50 border border-pyellow-200 px-3.5 py-2.5 text-[11px] text-pyellow-800 flex items-start gap-2 leading-relaxed">
            <Smartphone className="w-4 h-4 text-pyellow-600 shrink-0 mt-0.5" />
            <div>
              <strong>คำแนะนำสำหรับทีม:</strong> หลังสแกน QR แนะนำให้เปิดใน{' '}
              <strong>Chrome หรือ Safari</strong> (หลีกเลี่ยงการเปิดค้างในเบราว์เซอร์ของ LINE)
              แล้วกด <strong>เข้าสู่ระบบด้วยบัญชี Google</strong> เพื่อเชื่อมต่อข้อมูล Cloud แบบ Real-time ทันที
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
