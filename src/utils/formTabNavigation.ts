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
