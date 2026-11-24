import type { PrinterSettings, PrinterSheetChoice } from '../components/PrinterModal';
import type { PreAnestheticEvaluation } from '../types/evaluation';

export type HospitalPrintMode = PrinterSheetChoice | 'test_page';

export interface PrintExecutionResult {
  status: 'printed' | 'blocked';
  method: 'native' | 'iframe' | 'fallback';
  reason?: 'iframe_sandbox' | 'in_app_browser' | 'browser_blocked';
  printableHtml?: string;
  fileName?: string;
  jobTitle: string;
}

export function isEmbeddedIframeEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function isRestrictedInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Line\/|FBAN|FBAV|Instagram|MicroMessenger/i.test(navigator.userAgent || '');
}

export function buildHospitalPrintJobTitle(
  mode: HospitalPrintMode,
  record: PreAnestheticEvaluation,
): string {
  if (mode === 'test_page') {
    return 'Bangplee_Printer_Test_Page';
  }
  const cleanHn = (record.hn || '').trim().replace(/[^\w-]/g, '');
  const cleanName = (record.patientName || '')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 40);
  const prefix = mode === 'post_op' ? 'PostOp' : mode === 'both' ? 'PreOp_PostOp' : 'PreOp';
  return `${prefix}${cleanHn ? `_HN${cleanHn}` : ''}${cleanName ? `_${cleanName}` : ''}`;
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function collectActiveStylesHtml(): string {
  if (typeof document === 'undefined') return '';
  const chunks: string[] = [];

  // 1. Preserve external stylesheet links (e.g., Google Fonts) using absolute URLs
  const linkEls = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  for (const el of linkEls) {
    const href = el.getAttribute('href');
    if (!href) continue;
    try {
      const absoluteHref = new URL(href, window.location.href).href;
      chunks.push(`<link rel="stylesheet" href="${escapeHtmlAttr(absoluteHref)}" />`);
    } catch {
      // ignore malformed URL
    }
  }

  // 2. Extract CSS rules from loaded stylesheets (captures Vite / Tailwind v4 CSS cleanly)
  const collectedRuleTexts: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      if (!rules) continue;
      const css = Array.from(rules)
        .map((r) => r.cssText)
        .join('\n');
      if (css.trim()) {
        collectedRuleTexts.push(css);
      }
    } catch {
      // Cross-origin stylesheet (Google Fonts) is already preserved via <link> above
    }
  }

  if (collectedRuleTexts.length > 0) {
    chunks.push(`<style data-bph-cloned-styles="true">\n${collectedRuleTexts.join('\n')}\n</style>`);
  } else {
    // Fallback: clone raw <style> tags directly
    const styleEls = Array.from(document.querySelectorAll('style'));
    for (const st of styleEls) {
      if (st.textContent?.trim()) {
        chunks.push(`<style>${st.textContent}</style>`);
      }
    }
  }

  return chunks.join('\n');
}

export function buildStandalonePrintableHtml(params: {
  title: string;
  bodyHtml: string;
  settings: PrinterSettings;
  autoPrintOnOpen?: boolean;
}): string {
  const { title, bodyHtml, settings, autoPrintOnOpen = true } = params;
  const stylesHtml = collectActiveStylesHtml();
  const marginCss = settings.marginMode === 'narrow' ? '4mm 5mm' : '7mm 8mm';
  const colorFilterCss = settings.colorMode === 'bw' ? 'filter: grayscale(100%) contrast(1.08);' : '';
  const scaleCss =
    settings.scalePercent === 95
      ? 'zoom: 0.95;'
      : settings.scalePercent === 90
        ? 'zoom: 0.9;'
        : '';

  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtmlAttr(title)}</title>
  ${stylesHtml}
  <style>
    @page {
      size: ${settings.paperSize} portrait;
      margin: ${marginCss};
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      color: #000000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .bph-standalone-bar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: #ffffff;
      border-bottom: 1px solid #cbd5e1;
      padding: 10px 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      font-family: "Sarabun", system-ui, sans-serif;
    }
    .bph-standalone-btn {
      background: #944b5c;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .bph-standalone-btn:hover {
      background: #7f3849;
    }
    .bph-standalone-sheet-host {
      max-width: 794px;
      margin: 16px auto 28px;
      background: #ffffff;
      padding: 18px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 18px rgba(15, 23, 42, 0.08);
      ${colorFilterCss}
    }
    .bph-standalone-sheet-host .print-only-sheet {
      display: block !important;
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
    .bph-standalone-sheet-host .post-op-single-a4,
    .bph-standalone-sheet-host .print-only-sheet.post-op-single-a4 {
      display: flex !important;
      flex-direction: column !important;
      min-height: 1050px;
    }
    @media print {
      html, body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .no-print,
      .bph-standalone-bar {
        display: none !important;
      }
      .bph-standalone-sheet-host {
        max-width: none !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        ${colorFilterCss}
        ${scaleCss}
      }
      .bph-standalone-sheet-host .post-op-single-a4,
      .bph-standalone-sheet-host .print-only-sheet.post-op-single-a4 {
        height: 277mm !important;
        max-height: 277mm !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }
    }
  </style>
</head>
<body>
  <div class="bph-standalone-bar no-print">
    <div style="font-size:13px;color:#1e293b;">
      <strong>${escapeHtmlAttr(title)}</strong>
      <span style="margin-left:8px;font-size:12px;color:#475569;">
        (${settings.paperSize} · ${settings.colorMode === 'bw' ? 'ขาว-ดำคมชัด' : 'สีปกติ'} · ${settings.scalePercent}%)
      </span>
    </div>
    <button type="button" class="bph-standalone-btn" onclick="window.print()">
      🖨️ สั่งพิมพ์ออกเครื่องพิมพ์ทันที
    </button>
  </div>
  <div class="bph-standalone-sheet-host">
    ${bodyHtml}
  </div>
  ${
    autoPrintOnOpen
      ? `<script>
    window.addEventListener('load', function () {
      if (window.self === window.top) {
        setTimeout(function () {
          try { window.print(); } catch (e) {}
        }, 280);
      }
    });
  </script>`
      : ''
  }
</body>
</html>`;
}

export function downloadPrintableHtmlFile(html: string, fileName: string): void {
  const safeFileName = fileName.endsWith('.html') ? fileName : `${fileName}.html`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeFileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Attempts printing through a clean hidden same-origin iframe when top-level printing
 * is unreliable. Returns true if the print dialog opened.
 */
export function tryPrintViaHiddenIframe(html: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(false);
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.title = 'Hospital Print Spooler Frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-1';

    let settled = false;
    const finish = (opened: boolean, keepMs = 2000) => {
      if (settled) return;
      settled = true;
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, opened ? Math.max(keepMs, 15000) : 300);
      resolve(opened);
    };

    const timeoutId = window.setTimeout(() => finish(false), 3500);

    iframe.onload = () => {
      window.clearTimeout(timeoutId);
      const win = iframe.contentWindow;
      if (!win) {
        finish(false);
        return;
      }

      let beforePrintFired = false;
      const onBeforePrint = () => {
        beforePrintFired = true;
      };
      const onAfterPrint = () => {
        win.removeEventListener('beforeprint', onBeforePrint);
        win.removeEventListener('afterprint', onAfterPrint);
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      };

      try {
        win.addEventListener('beforeprint', onBeforePrint);
        win.addEventListener('afterprint', onAfterPrint);
        win.focus();
        const t0 = performance.now();
        win.print();
        const elapsed = performance.now() - t0;
        const opened = beforePrintFired || elapsed >= 80;
        finish(opened, 30000);
      } catch {
        finish(false);
      }
    };

    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    } else {
      iframe.srcdoc = html;
    }
  });
}

/**
 * Triggers native browser printing synchronously inside the user click gesture
 * (after the caller has flushed print DOM via flushSync), and detects whether
 * the browser/iframe sandbox actually opened the print dialog.
 */
export function attemptNativePrintSync(): {
  opened: boolean;
  onCleanupReady: (cleanup: () => void) => void;
} {
  let beforePrintFired = false;
  let printMediaMatched = false;
  let afterPrintCallback: (() => void) | null = null;
  let cleaned = false;

  const runCleanup = () => {
    if (cleaned) return;
    cleaned = true;
    window.removeEventListener('beforeprint', handleBeforePrint);
    window.removeEventListener('afterprint', handleAfterPrint);
    if (mql && handleMediaChange) {
      try {
        mql.removeEventListener('change', handleMediaChange);
      } catch {
        // Safari legacy fallback
      }
    }
    afterPrintCallback?.();
  };

  const handleBeforePrint = () => {
    beforePrintFired = true;
  };

  const handleAfterPrint = () => {
    runCleanup();
  };

  const mql =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('print')
      : null;

  const handleMediaChange = (e: MediaQueryListEvent) => {
    if (e.matches) {
      printMediaMatched = true;
    } else if (printMediaMatched) {
      runCleanup();
    }
  };

  window.addEventListener('beforeprint', handleBeforePrint);
  window.addEventListener('afterprint', handleAfterPrint);
  if (mql) {
    try {
      mql.addEventListener('change', handleMediaChange);
    } catch {
      // ignore older Safari
    }
  }

  let elapsed = 0;
  let threw = false;
  try {
    const t0 = performance.now();
    window.print();
    elapsed = performance.now() - t0;
  } catch {
    threw = true;
  }

  const opened = !threw && (beforePrintFired || printMediaMatched || elapsed >= 80);

  return {
    opened,
    onCleanupReady: (cleanup: () => void) => {
      afterPrintCallback = cleanup;
      if (cleaned) {
        cleanup();
        return;
      }
      if (!opened) {
        runCleanup();
        return;
      }
      // If browser blocked synchronously during window.print() (Desktop Chrome/Edge/Firefox)
      // and already finished, schedule quick cleanup in case afterprint didn't fire.
      if (elapsed >= 250) {
        window.setTimeout(runCleanup, 400);
        return;
      }
      // For non-blocking mobile/Safari print dialogs, never tear down in 1.5s!
      // Clean up once user returns focus to the tab or after 60s safety window.
      const onFocusReturn = () => {
        window.removeEventListener('focus', onFocusReturn);
        window.setTimeout(runCleanup, 500);
      };
      window.addEventListener('focus', onFocusReturn);
      window.setTimeout(runCleanup, 60000);
    },
  };
}
