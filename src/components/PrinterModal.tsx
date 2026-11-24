import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Info,
  Laptop,
  Printer,
  RefreshCw,
  Settings,
  Smartphone,
  Unplug,
  Usb,
  Wifi,
  X,
} from 'lucide-react';
import { PUBLISHED_APP_URL } from '../firebase';
import { PreAnestheticEvaluation } from '../types/evaluation';
import {
  HospitalPrintMode,
  isEmbeddedIframeEnvironment,
  isRestrictedInAppBrowser,
} from '../utils/hospitalPrintEngine';

export type PrinterSheetChoice = 'pre_op' | 'post_op' | 'both';
export type PrinterPaperSize = 'A4' | 'A5';
export type PrinterMarginMode = 'normal' | 'narrow';
export type PrinterColorMode = 'bw' | 'color';
export type PrinterScalePercent = 90 | 95 | 100;

export interface PrinterSettings {
  printerLabel: string;
  defaultSheet: PrinterSheetChoice;
  paperSize: PrinterPaperSize;
  marginMode: PrinterMarginMode;
  colorMode: PrinterColorMode;
  scalePercent: PrinterScalePercent;
  lastPrintedAt: string;
}

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  printerLabel: 'เครื่องพิมพ์เริ่มต้นของระบบ (LAN / Wi-Fi / USB / AirPrint)',
  defaultSheet: 'pre_op',
  paperSize: 'A4',
  marginMode: 'normal',
  colorMode: 'bw',
  scalePercent: 100,
  lastPrintedAt: '',
};

const PRINTER_SETTINGS_STORAGE_KEY = 'bph_printer_settings_v1';

export function loadPrinterSettings(): PrinterSettings {
  try {
    const raw = localStorage.getItem(PRINTER_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_PRINTER_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<PrinterSettings>;
    return {
      printerLabel:
        typeof parsed.printerLabel === 'string' && parsed.printerLabel.trim()
          ? parsed.printerLabel.slice(0, 120)
          : DEFAULT_PRINTER_SETTINGS.printerLabel,
      defaultSheet:
        parsed.defaultSheet === 'post_op' || parsed.defaultSheet === 'both'
          ? parsed.defaultSheet
          : 'pre_op',
      paperSize: parsed.paperSize === 'A5' ? 'A5' : 'A4',
      marginMode: parsed.marginMode === 'narrow' ? 'narrow' : 'normal',
      colorMode: parsed.colorMode === 'color' ? 'color' : 'bw',
      scalePercent:
        parsed.scalePercent === 90 || parsed.scalePercent === 95 ? parsed.scalePercent : 100,
      lastPrintedAt: typeof parsed.lastPrintedAt === 'string' ? parsed.lastPrintedAt : '',
    };
  } catch {
    return DEFAULT_PRINTER_SETTINGS;
  }
}

export function savePrinterSettings(settings: PrinterSettings): void {
  try {
    localStorage.setItem(PRINTER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage quota errors
  }
}

interface UsbPrinterInfo {
  name: string;
  manufacturer: string;
  vendorId: string;
  productId: string;
  serialNumber: string;
}

interface WebUsbDeviceLike {
  productName?: string;
  manufacturerName?: string;
  vendorId: number;
  productId: number;
  serialNumber?: string;
  opened?: boolean;
  close?: () => Promise<void>;
  forget?: () => Promise<void>;
}

interface WebUsbNavigatorLike {
  usb?: {
    getDevices: () => Promise<WebUsbDeviceLike[]>;
    requestDevice: (options: {
      filters: Array<{ classCode?: number }>;
    }) => Promise<WebUsbDeviceLike>;
  };
}

function formatHexId(val: number): string {
  return `0x${val.toString(16).toUpperCase().padStart(4, '0')}`;
}

function toUsbPrinterInfo(device: WebUsbDeviceLike): UsbPrinterInfo {
  const manufacturer = (device.manufacturerName || '').trim();
  const product = (device.productName || '').trim();
  const displayName =
    [manufacturer, product].filter(Boolean).join(' ') ||
    `USB Printer (${formatHexId(device.vendorId)}:${formatHexId(device.productId)})`;
  return {
    name: displayName,
    manufacturer: manufacturer || 'ไม่ระบุผู้ผลิต',
    vendorId: formatHexId(device.vendorId),
    productId: formatHexId(device.productId),
    serialNumber: (device.serialNumber || '').trim(),
  };
}

interface PrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: PreAnestheticEvaluation;
  settings: PrinterSettings;
  onChangeSettings: (next: PrinterSettings) => void;
  onTriggerPrint: (mode: HospitalPrintMode) => void;
  onDownloadPrintable: (mode: HospitalPrintMode) => void;
  onNotify?: (type: 'success' | 'error', text: string) => void;
}

export function PrinterModal({
  isOpen,
  onClose,
  evaluation,
  settings,
  onChangeSettings,
  onTriggerPrint,
  onDownloadPrintable,
  onNotify,
}: PrinterModalProps) {
  const [selectedSheet, setSelectedSheet] = useState<PrinterSheetChoice>(settings.defaultSheet);
  const [usbSupported, setUsbSupported] = useState(false);
  const [connectedUsb, setConnectedUsb] = useState<UsbPrinterInfo | null>(null);
  const [usbDevices, setUsbDevices] = useState<WebUsbDeviceLike[]>([]);
  const [isPairingUsb, setIsPairingUsb] = useState(false);
  const [usbStatusMsg, setUsbStatusMsg] = useState<string | null>(null);
  const [showGuideTab, setShowGuideTab] = useState<'pc' | 'mobile'>('pc');

  const inEmbeddedFrame = isEmbeddedIframeEnvironment();
  const inRestrictedWebView = isRestrictedInAppBrowser();

  useEffect(() => {
    setSelectedSheet(settings.defaultSheet);
  }, [settings.defaultSheet, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as WebUsbNavigatorLike) : null;
    const hasUsb = Boolean(nav?.usb && typeof nav.usb.getDevices === 'function');
    setUsbSupported(hasUsb);
    if (!hasUsb || !nav?.usb) return;

    let cancelled = false;
    nav.usb
      .getDevices()
      .then((devices) => {
        if (cancelled) return;
        setUsbDevices(devices);
        if (devices.length > 0) {
          setConnectedUsb(toUsbPrinterInfo(devices[0]));
        } else {
          setConnectedUsb(null);
        }
      })
      .catch(() => {
        // Ignore restricted iframe/permission environments
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePairUsbPrinter = async () => {
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as WebUsbNavigatorLike) : null;
    if (inEmbeddedFrame) {
      setUsbStatusMsg(
        'หน้าต่าง Preview แบบฝังกรอบ (Iframe) จำกัดสิทธิ์ WebUSB — หากเครื่องพิมพ์ติดตั้งใน Windows/Mac แล้ว ให้เปิดแอปในแท็บเต็มจอแล้วกด "สั่งพิมพ์ออกเครื่องพิมพ์ทันที" ได้เลย',
      );
      return;
    }
    if (!nav?.usb) {
      setUsbStatusMsg(
        'เบราว์เซอร์นี้ไม่รองรับการจับคู่ WebUSB โดยตรง — สามารถกด "สั่งพิมพ์ออกเครื่องพิมพ์ทันที" เพื่อเลือกเครื่องพิมพ์ USB / LAN / Wi-Fi / AirPrint ของระบบได้เลย',
      );
      return;
    }
    setIsPairingUsb(true);
    setUsbStatusMsg(null);
    try {
      const device = await nav.usb.requestDevice({
        filters: [{ classCode: 7 }],
      });
      const info = toUsbPrinterInfo(device);
      setConnectedUsb(info);
      setUsbDevices((prev) => {
        const filtered = prev.filter(
          (d) => !(d.vendorId === device.vendorId && d.productId === device.productId),
        );
        return [device, ...filtered];
      });
      onChangeSettings({
        ...settings,
        printerLabel: info.name,
      });
      setUsbStatusMsg(`เชื่อมต่อเครื่องพิมพ์ USB สำเร็จ: ${info.name}`);
      onNotify?.('success', `เชื่อมต่อเครื่องพิมพ์ ${info.name} เรียบร้อยแล้ว`);
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      if (name === 'NotFoundError') {
        setUsbStatusMsg(
          'เครื่องพิมพ์ที่ติดตั้งไดรเวอร์ใน Windows / Mac แล้ว (ทั้งสาย USB และ LAN/Wi-Fi) จะเชื่อมต่อผ่านระบบของเครื่องโดยอัตโนมัติ — กดปุ่ม "สั่งพิมพ์ออกเครื่องพิมพ์ทันที" ด้านล่างแล้วเลือกชื่อเครื่องพิมพ์ได้เลยครับ',
        );
      } else if (name === 'SecurityError') {
        setUsbStatusMsg(
          'หน้าต่างนี้จำกัดสิทธิ์ WebUSB — แนะนำกด "เปิดในเบราว์เซอร์เต็มจอ" หรือกด "สั่งพิมพ์ออกเครื่องพิมพ์ทันที" เพื่อใช้เครื่องพิมพ์ระบบของ Windows/Mac',
        );
      } else {
        setUsbStatusMsg(
          'แนะนำใช้การสั่งพิมพ์ผ่านเครื่องพิมพ์ระบบ (USB / LAN / Wi-Fi / AirPrint) ด้วยปุ่ม "สั่งพิมพ์ออกเครื่องพิมพ์ทันที" ด้านล่าง',
        );
      }
    } finally {
      setIsPairingUsb(false);
    }
  };

  const handleDisconnectUsb = async () => {
    for (const dev of usbDevices) {
      try {
        if (typeof dev.forget === 'function') {
          await dev.forget();
        } else if (typeof dev.close === 'function' && dev.opened) {
          await dev.close();
        }
      } catch {
        // ignore disconnect error
      }
    }
    setUsbDevices([]);
    setConnectedUsb(null);
    onChangeSettings({
      ...settings,
      printerLabel: DEFAULT_PRINTER_SETTINGS.printerLabel,
    });
    setUsbStatusMsg('ยกเลิกการจับคู่เครื่องพิมพ์ USB แล้ว (กลับไปใช้เครื่องพิมพ์เริ่มต้นของระบบ)');
  };

  const handlePrintNow = (target: HospitalPrintMode) => {
    const nowLabel = new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
    onChangeSettings({
      ...settings,
      defaultSheet: target === 'test_page' ? settings.defaultSheet : target,
      lastPrintedAt: nowLabel,
    });
    // Trigger synchronously inside the click gesture (App flushes modal close + print sheet together)
    onTriggerPrint(target);
  };

  const handleDownloadNow = (target: HospitalPrintMode) => {
    onDownloadPrintable(target);
  };

  const patientSummary = evaluation.patientName.trim()
    ? `${evaluation.patientName.trim()}${evaluation.hn.trim() ? ` (HN ${evaluation.hn.trim()})` : ''}`
    : 'ยังไม่ได้ระบุชื่อผู้ป่วยในฟอร์มปัจจุบัน';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="เชื่อมต่อเครื่องพิมพ์และตั้งค่าการพิมพ์"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="no-print fixed inset-0 z-50 bg-[#243040]/45 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white border border-pblue-200/80 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden my-auto">
        <div className="h-[3px] w-full pastel-top-ribbon" aria-hidden="true" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-pborder bg-gradient-to-r from-pblue-50/80 via-white to-ppink-50/70 flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-pblue-800">
              <Printer className="w-4 h-4 text-pblue-600" />
              ศูนย์เชื่อมต่อเครื่องพิมพ์ (Printer Center)
            </div>
            <h2 className="text-base font-bold text-[#243040] mt-0.5">
              เชื่อมต่อเครื่องพิมพ์และสั่งพิมพ์แบบฟอร์ม A4
            </h2>
            <p className="text-[11px] text-slate-500">
              รองรับเครื่องพิมพ์โรงพยาบาลผ่านสาย USB, เครือข่าย LAN/Wi-Fi, AirPrint (iOS) และ Android Print
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างเครื่องพิมพ์"
            className="p-1.5 text-slate-400 hover:text-prose-800 hover:bg-prose-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Embedded Preview / In-App Browser Notice */}
          {(inEmbeddedFrame || inRestrictedWebView) && (
            <div className="rounded-xl border border-prose-300 bg-prose-50/80 p-3.5 space-y-2.5 text-xs text-prose-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-prose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">
                    {inRestrictedWebView
                      ? 'กำลังเปิดแอปผ่านเบราว์เซอร์ในแชต (LINE / Facebook) ซึ่งบล็อกหน้าต่างเครื่องพิมพ์'
                      : 'กำลังเปิดแอปในหน้าต่าง Preview แบบฝังกรอบ ซึ่งอาจบล็อกหน้าต่างเครื่องพิมพ์ของเบราว์เซอร์'}
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    หากกดสั่งพิมพ์แล้วหน้าต่างเครื่องพิมพ์ไม่เด้งขึ้น ให้เลือกวิธีใดวิธีหนึ่งด้านล่าง — พิมพ์ออกเครื่องพิมพ์โรงพยาบาลได้ 100%:
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-6">
                <a
                  href={PUBLISHED_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-pblue-600 rounded-lg hover:bg-pblue-700 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  เปิดแอปในแท็บเบราว์เซอร์เต็มจอ (Chrome / Safari)
                </a>
                <button
                  type="button"
                  onClick={() => handleDownloadNow(selectedSheet)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-prose-800 bg-white border border-prose-300 rounded-lg hover:bg-prose-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-prose-600" />
                  ดาวน์โหลดไฟล์พร้อมพิมพ์ A4
                </button>
              </div>
            </div>
          )}

          {/* Section 1: Printer Connection Status & USB Pairing */}
          <div className="rounded-xl border border-pblue-200/80 bg-pblue-50/45 p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    connectedUsb ? 'bg-pgreen-600' : 'bg-pblue-600'
                  }`}
                />
                <span className="text-xs font-semibold text-[#243040]">
                  สถานะการเชื่อมต่อเครื่องพิมพ์
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-pgreen-50 text-pgreen-800 border border-pgreen-200">
                <CheckCircle2 className="w-3 h-3 text-pgreen-600" />
                {connectedUsb
                  ? 'เชื่อมต่อ USB แล้ว'
                  : inEmbeddedFrame
                    ? 'โหมด Preview (รองรับดาวน์โหลดไฟล์พร้อมพิมพ์)'
                    : 'พร้อมพิมพ์ผ่านระบบ / LAN / Wi-Fi'}
              </span>
            </div>

            {connectedUsb && (
              <div className="rounded-lg bg-white border border-pgreen-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-pgreen-800 flex items-center gap-1.5">
                    <Usb className="w-3.5 h-3.5 text-pgreen-600" />
                    {connectedUsb.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    VID {connectedUsb.vendorId} · PID {connectedUsb.productId}
                    {connectedUsb.serialNumber ? ` · SN ${connectedUsb.serialNumber}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDisconnectUsb()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-prose-800 bg-prose-50 border border-prose-200 rounded-lg hover:bg-prose-100"
                >
                  <Unplug className="w-3 h-3" />
                  ตัดการเชื่อมต่อ USB
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="bph-printer-label-input"
                className="block text-[11px] font-semibold text-slate-700"
              >
                ชื่อเครื่องพิมพ์ประจำจุดใช้งาน (บันทึกไว้บนเครื่องนี้)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="bph-printer-label-input"
                  type="text"
                  maxLength={120}
                  value={settings.printerLabel}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      printerLabel: e.target.value,
                    })
                  }
                  placeholder="เช่น HP LaserJet เคาน์เตอร์วิสัญญี OR"
                  className="flex-1 min-w-[200px] px-3 py-1.5 text-xs text-[#243040] bg-white border border-pborder rounded-lg focus:outline-none focus:ring-2 focus:ring-pblue-300/40 focus:border-pblue-400"
                />
                <button
                  type="button"
                  disabled={isPairingUsb}
                  onClick={() => void handlePairUsbPrinter()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pblue-800 bg-white border border-pblue-300 rounded-lg hover:bg-pblue-50 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
                  title="ค้นหาและจับคู่เครื่องพิมพ์ที่เสียบสาย USB โดยตรง (รองรับ Chrome / Edge)"
                >
                  {isPairingUsb ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Usb className="w-3.5 h-3.5 text-pblue-600" />
                  )}
                  {usbSupported ? 'ค้นหาเครื่องพิมพ์ USB' : 'ตรวจสอบ USB'}
                </button>
              </div>
              <p className="text-[10.5px] text-slate-500">
                * เครื่องพิมพ์ที่ติดตั้งใน Windows / Mac (USB, LAN, Wi-Fi) ไม่จำเป็นต้องกดจับคู่ WebUSB สามารถกดปุ่ม <strong>สั่งพิมพ์ออกเครื่องพิมพ์ทันที</strong> ด้านล่างเพื่อเลือกเครื่องพิมพ์ได้เลย
              </p>
            </div>

            {usbStatusMsg && (
              <div className="rounded-lg bg-white/90 border border-pblue-200 px-3 py-2 text-[11px] text-slate-700 flex items-start gap-2 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-pblue-600 shrink-0 mt-0.5" />
                <span>{usbStatusMsg}</span>
              </div>
            )}
          </div>

          {/* Section 2: Select Document to Print */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#243040] inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-ppink-600" />
                เลือกเอกสารที่ต้องการพิมพ์
              </span>
              <span className="text-[11px] text-slate-500 truncate max-w-[260px]" title={patientSummary}>
                ผู้ป่วย: <strong className="text-[#243040]">{patientSummary}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  {
                    key: 'pre_op',
                    title: 'ใบ Pre-op',
                    desc: 'ANE-FM-002-03 (1 หน้า A4)',
                  },
                  {
                    key: 'post_op',
                    title: 'ใบ Post-op',
                    desc: 'ANE-FM-006-01 (1 หน้า A4)',
                  },
                  {
                    key: 'both',
                    title: 'พิมพ์ทั้ง 2 หน้า',
                    desc: 'Pre-op + Post-op ต่อเนื่อง',
                  },
                ] as const
              ).map((item) => {
                const active = selectedSheet === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedSheet(item.key)}
                    className={`text-left p-2.5 rounded-xl border transition-colors ${
                      active
                        ? 'bg-ppink-50 border-ppink-400 text-prose-800 shadow-2xs'
                        : 'bg-white border-pborder text-slate-700 hover:bg-pblue-50/50'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.title}</div>
                    <div className="text-[10.5px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Paper & Print Quality Settings */}
          <div className="rounded-xl border border-pborder bg-pcanvas/70 p-3.5 space-y-3">
            <div className="text-xs font-semibold text-[#243040] inline-flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              ตั้งค่าหน้ากระดาษและโหมดหมึกพิมพ์
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <label className="space-y-1">
                <span className="text-[11px] font-medium text-slate-600">ขนาดกระดาษ</span>
                <select
                  value={settings.paperSize}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      paperSize: e.target.value === 'A5' ? 'A5' : 'A4',
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-pborder rounded-lg text-[#243040] focus:outline-none focus:border-pblue-400"
                >
                  <option value="A4">A4 (มาตรฐาน)</option>
                  <option value="A5">A5 (ครึ่งแผ่น)</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[11px] font-medium text-slate-600">ขอบกระดาษ</span>
                <select
                  value={settings.marginMode}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      marginMode: e.target.value === 'narrow' ? 'narrow' : 'normal',
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-pborder rounded-lg text-[#243040] focus:outline-none focus:border-pblue-400"
                >
                  <option value="normal">ปกติ (7-8 มม.)</option>
                  <option value="narrow">แคบ (4-5 มม.)</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[11px] font-medium text-slate-600">โหมดสี</span>
                <select
                  value={settings.colorMode}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      colorMode: e.target.value === 'color' ? 'color' : 'bw',
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-pborder rounded-lg text-[#243040] focus:outline-none focus:border-pblue-400"
                >
                  <option value="bw">ขาว-ดำคมชัด</option>
                  <option value="color">สีปกติ</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[11px] font-medium text-slate-600">ปรับขนาดพอดีหน้า</span>
                <select
                  value={String(settings.scalePercent)}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    onChangeSettings({
                      ...settings,
                      scalePercent: num === 90 ? 90 : num === 95 ? 95 : 100,
                    });
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-pborder rounded-lg text-[#243040] focus:outline-none focus:border-pblue-400"
                >
                  <option value="100">100% (ปกติ)</option>
                  <option value="95">95% (กันล้นหน้า)</option>
                  <option value="90">90% (กระชับ)</option>
                </select>
              </label>
            </div>
          </div>

          {/* Primary Print Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handlePrintNow('test_page')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-pgreen-800 bg-pgreen-50 border border-pgreen-300 rounded-xl hover:bg-pgreen-100 transition-colors"
              >
                <Wifi className="w-3.5 h-3.5 text-pgreen-600" />
                พิมพ์หน้าทดสอบ
              </button>
              <button
                type="button"
                onClick={() => handleDownloadNow(selectedSheet)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-pblue-800 bg-pblue-50 border border-pblue-300 rounded-xl hover:bg-pblue-100 transition-colors"
                title="ดาวน์โหลดไฟล์ HTML A4 พร้อมปุ่มสั่งพิมพ์ กรณีหน้าต่างพิมพ์ถูกบล็อก"
              >
                <Download className="w-3.5 h-3.5 text-pblue-600" />
                ดาวน์โหลดไฟล์พร้อมพิมพ์
              </button>
            </div>

            <button
              type="button"
              onClick={() => handlePrintNow(selectedSheet)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-prose-600 rounded-xl hover:bg-prose-700 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              สั่งพิมพ์ออกเครื่องพิมพ์ทันที
            </button>
          </div>

          {/* Section 4: Hospital Printer Setup Quick Guide */}
          <div className="rounded-xl border border-pyellow-200 bg-pyellow-50/60 p-3 space-y-2 text-[11px] text-pyellow-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">วิธีเลือกเครื่องพิมพ์โรงพยาบาลให้พิมพ์ออกพอดี 1 หน้า A4</span>
              <div className="inline-flex rounded-lg border border-pyellow-300 bg-white p-0.5 text-[10.5px]">
                <button
                  type="button"
                  onClick={() => setShowGuideTab('pc')}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${
                    showGuideTab === 'pc'
                      ? 'bg-pyellow-100 text-pyellow-800 font-semibold'
                      : 'text-slate-600'
                  }`}
                >
                  <Laptop className="w-3 h-3" />
                  คอมพิวเตอร์ (LAN/USB)
                </button>
                <button
                  type="button"
                  onClick={() => setShowGuideTab('mobile')}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${
                    showGuideTab === 'mobile'
                      ? 'bg-pyellow-100 text-pyellow-800 font-semibold'
                      : 'text-slate-600'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  iPad / มือถือ (Wi-Fi)
                </button>
              </div>
            </div>

            {showGuideTab === 'pc' ? (
              <ul className="list-disc pl-4 space-y-0.5 leading-relaxed">
                <li>
                  เมื่อกด <strong>สั่งพิมพ์ออกเครื่องพิมพ์ทันที</strong> หน้าต่างเลือกเครื่องพิมพ์ของ Windows/Mac จะเปิดขึ้น ให้เลือกเครื่องพิมพ์ของหอผู้ป่วย/ห้องผ่าตัด (USB หรือ Network Printer) ที่ช่อง <strong>Destination / ปลายทาง</strong>
                </li>
                <li>
                  ตั้งค่า <strong>ขนาดกระดาษ: A4</strong>, <strong>ระยะขอบ: ไม่มี/ค่าเริ่มต้น</strong> และปิดช่อง <strong>หัวกระดาษและท้ายกระดาษ (Headers and footers)</strong> เพื่อให้ได้ใบประเมินโรงพยาบาลที่สะอาดพอดี 1 หน้า
                </li>
              </ul>
            ) : (
              <ul className="list-disc pl-4 space-y-0.5 leading-relaxed">
                <li>
                  <strong>iPhone / iPad (AirPrint):</strong> เชื่อมต่อ Wi-Fi เดียวกับเครื่องพิมพ์โรงพยาบาล แล้วเปิดผ่าน Safari → กด <strong>สั่งพิมพ์ออกเครื่องพิมพ์ทันที</strong> → แตะ <strong>เลือกเครื่องพิมพ์ (Select Printer)</strong>
                </li>
                <li>
                  <strong>Android (Mopria / Wi-Fi Print):</strong> เปิดผ่าน Chrome → กดสั่งพิมพ์ → เลือกเครื่องพิมพ์ Wi-Fi ในแถบด้านบน (หากยังไม่พบให้เปิด Default Print Service ในการตั้งค่ามือถือ)
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

