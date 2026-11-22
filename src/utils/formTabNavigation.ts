import type React from 'react';

const DATA_FIELD_SELECTOR = [
  'input:not([type="hidden"]):not([type="file"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
].join(', ');

const SELECTABLE_INPUT_TYPES = new Set(['text', 'number', 'search', 'tel', 'url', 'email']);

type FormDataField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isFieldVisible(el: HTMLElement): boolean {
  if (el.tabIndex < 0) return false;
  if (el.offsetParent === null) {
    const style = window.getComputedStyle(el);
    if (style.position !== 'fixed' || style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * Enables smooth, continuous Tab / Shift+Tab navigation across all visible data entry fields
 * (input, select, textarea) inside a form container without getting trapped on helper buttons,
 * clear icons, quick-pick chips, or SVG diagrams.
 */
export function handleFormTabNavigation(e: React.KeyboardEvent<HTMLElement>): void {
  if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) {
    return;
  }

  const container = e.currentTarget;
  const target = e.target as HTMLElement | null;
  if (!container || !target) return;

  const fields = Array.from(container.querySelectorAll<FormDataField>(DATA_FIELD_SELECTOR)).filter(
    isFieldVisible,
  );
  if (fields.length === 0) return;

  const currentIdx = fields.indexOf(target as FormDataField);
  let nextField: FormDataField | null = null;

  if (currentIdx !== -1) {
    const nextIdx = e.shiftKey ? currentIdx - 1 : currentIdx + 1;
    if (nextIdx >= 0 && nextIdx < fields.length) {
      nextField = fields[nextIdx];
    } else {
      // Allow natural Tab exit at the very start / end of the form
      return;
    }
  } else if (!e.shiftKey) {
    nextField =
      fields.find(
        (field) =>
          (target.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
      ) ?? null;
  } else {
    for (let i = fields.length - 1; i >= 0; i -= 1) {
      if ((target.compareDocumentPosition(fields[i]) & Node.DOCUMENT_POSITION_PRECEDING) !== 0) {
        nextField = fields[i];
        break;
      }
    }
  }

  if (!nextField) return;

  e.preventDefault();
  nextField.focus();
  nextField.scrollIntoView({ block: 'nearest', inline: 'nearest' });

  if (nextField instanceof HTMLInputElement && SELECTABLE_INPUT_TYPES.has(nextField.type)) {
    try {
      nextField.select();
    } catch {
      // ignore inputs that don't support select()
    }
  }
}

/**
 * Enables 2D keyboard arrow (↑ ↓ ← →) and Enter / Shift+Enter navigation across
 * visible text inputs within a structured form section (e.g., Physical Examination,
 * Laboratory Evaluation). Preserves normal caret editing inside non-empty text inputs
 * until the caret reaches a boundary or all text is selected, and lets arrow keys
 * jump from section toggle buttons directly to the neighboring text input.
 */
export function handleSectionArrowNavigation(
  e: React.KeyboardEvent<HTMLElement>,
  container: HTMLElement | null,
): void {
  if (e.defaultPrevented || e.nativeEvent.isComposing || e.altKey || e.ctrlKey || e.metaKey) {
    return;
  }

  const key = e.key;
  const isArrow =
    key === 'ArrowRight' ||
    key === 'ArrowLeft' ||
    key === 'ArrowDown' ||
    key === 'ArrowUp';
  const isEnter = key === 'Enter';

  if (!isArrow && !isEnter) return;
  if (!container) return;

  const target = e.target;
  const isTextInput =
    target instanceof HTMLInputElement &&
    target.dataset.thaiDateInput !== 'true' &&
    (target.type === 'text' || target.type === 'number' || target.type === 'search');
  const isButton = target instanceof HTMLButtonElement;

  // Keep native Enter/Space click activation on buttons; only arrow keys jump to inputs
  if (isButton && !isArrow) return;
  if (!isTextInput && !isButton) return;

  if (isTextInput) {
    const valLen = target.value.length;
    const selStart = target.selectionStart ?? valLen;
    const selEnd = target.selectionEnd ?? valLen;
    const isAllSelected = valLen > 0 && selStart === 0 && selEnd === valLen;

    // Allow caret movement inside non-empty text unless at boundary or all text is selected
    if (key === 'ArrowLeft' && !isAllSelected && selStart > 0) return;
    if (key === 'ArrowRight' && !isAllSelected && selEnd < valLen) return;
  }

  const rawInputs = Array.from(
    container.querySelectorAll<HTMLInputElement>(
      'input[type="text"]:not([data-thai-date-input="true"]), input[type="number"], input[type="search"]',
    ),
  ).filter((el) => !el.disabled && isFieldVisible(el));

  if (rawInputs.length === 0) return;
  if (isTextInput && rawInputs.length <= 1) return;

  const measured = rawInputs.map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      el,
      cx: (rect.left + rect.right) / 2,
      cy: (rect.top + rect.bottom) / 2,
      left: rect.left,
      height: rect.height,
    };
  });

  // Cluster inputs into visual rows by center-Y, sorted left-to-right within each row
  const byY = [...measured].sort((a, b) => a.cy - b.cy || a.left - b.left);
  const rows: (typeof measured)[] = [];
  for (const item of byY) {
    const lastRow = rows[rows.length - 1];
    if (!lastRow) {
      rows.push([item]);
      continue;
    }
    const rowAvgY = lastRow.reduce((sum, it) => sum + it.cy, 0) / lastRow.length;
    const rowThreshold = Math.max(16, item.height * 0.65);
    if (Math.abs(item.cy - rowAvgY) <= rowThreshold) {
      lastRow.push(item);
    } else {
      rows.push([item]);
    }
  }
  rows.forEach((row) => row.sort((a, b) => a.left - b.left));

  const flatVisual = rows.flat();
  let nextEl: HTMLInputElement | null = null;

  if (isTextInput) {
    const flatIdx = flatVisual.findIndex((item) => item.el === target);
    if (flatIdx === -1) return;

    let rowIdx = -1;
    for (let r = 0; r < rows.length; r += 1) {
      if (rows[r].some((item) => item.el === target)) {
        rowIdx = r;
        break;
      }
    }
    if (rowIdx === -1) return;

    const currentItem = flatVisual[flatIdx];

    if (key === 'ArrowRight' || (isEnter && !e.shiftKey)) {
      if (flatIdx + 1 < flatVisual.length) {
        nextEl = flatVisual[flatIdx + 1].el;
      }
    } else if (key === 'ArrowLeft' || (isEnter && e.shiftKey)) {
      if (flatIdx - 1 >= 0) {
        nextEl = flatVisual[flatIdx - 1].el;
      }
    } else if (key === 'ArrowDown') {
      if (rowIdx + 1 < rows.length) {
        const targetRow = rows[rowIdx + 1];
        nextEl = targetRow.reduce((best, cand) =>
          Math.abs(cand.cx - currentItem.cx) < Math.abs(best.cx - currentItem.cx) ? cand : best,
        ).el;
      }
    } else if (key === 'ArrowUp') {
      if (rowIdx - 1 >= 0) {
        const targetRow = rows[rowIdx - 1];
        nextEl = targetRow.reduce((best, cand) =>
          Math.abs(cand.cx - currentItem.cx) < Math.abs(best.cx - currentItem.cx) ? cand : best,
        ).el;
      }
    }
  } else if (isButton) {
    const rect = target.getBoundingClientRect();
    const cx = (rect.left + rect.right) / 2;
    const cy = (rect.top + rect.bottom) / 2;
    const sameRowThreshold = Math.max(20, rect.height * 0.85);

    if (key === 'ArrowRight') {
      const sameRowRight = flatVisual.filter(
        (item) => Math.abs(item.cy - cy) <= sameRowThreshold && item.left >= rect.left,
      );
      if (sameRowRight.length > 0) {
        nextEl = sameRowRight[0].el;
      } else {
        const below = flatVisual.find((item) => item.cy > cy + sameRowThreshold);
        nextEl = below?.el ?? null;
      }
    } else if (key === 'ArrowLeft') {
      const sameRowLeft = flatVisual.filter(
        (item) => Math.abs(item.cy - cy) <= sameRowThreshold && item.cx < rect.left,
      );
      if (sameRowLeft.length > 0) {
        nextEl = sameRowLeft[sameRowLeft.length - 1].el;
      } else {
        const above = [...flatVisual].reverse().find((item) => item.cy < cy - sameRowThreshold);
        nextEl = above?.el ?? null;
      }
    } else if (key === 'ArrowDown') {
      const targetRow = rows.find((row) => {
        const avgY = row.reduce((sum, it) => sum + it.cy, 0) / row.length;
        return avgY > cy + sameRowThreshold * 0.5;
      });
      if (targetRow) {
        nextEl = targetRow.reduce((best, cand) =>
          Math.abs(cand.cx - cx) < Math.abs(best.cx - cx) ? cand : best,
        ).el;
      }
    } else if (key === 'ArrowUp') {
      const targetRow = [...rows].reverse().find((row) => {
        const avgY = row.reduce((sum, it) => sum + it.cy, 0) / row.length;
        return avgY < cy - sameRowThreshold * 0.5;
      });
      if (targetRow) {
        nextEl = targetRow.reduce((best, cand) =>
          Math.abs(cand.cx - cx) < Math.abs(best.cx - cx) ? cand : best,
        ).el;
      }
    }
  }

  if (nextEl) {
    e.preventDefault();
    nextEl.focus();
    nextEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    try {
      nextEl.select();
    } catch {
      // ignore inputs that don't support select()
    }
  }
}
