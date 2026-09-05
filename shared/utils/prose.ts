import type { HDocument, HElement } from '../types/harbor.js';

/**
 * Common regex patterns for watermarks, bot-traps, and non-prose boilerplate
 * frequently injected into web fiction and novel chapters.
 */
const WATERMARK_PATTERNS = [
  /find\s+authorized\s+novels\s+in/i,
  /support\s+the\s+author\s+by/i,
  /if\s+you\s+find\s+any\s+errors\s+\(broken\s+links/i,
  /please\s+report\s+them\s+at/i,
  /visit\s+.*\s+for\s+more\s+chapters/i,
  /this\s+chapter\s+is\s+updated\s+by/i,
  /read\s+at\s+.*\.(?:com|org|net|me)/i,
  /hosted\s+on\s+royal\s*road/i,
  /report\s+any\s+pirated\s+fiction\s+to/i,
];

/**
 * Strips known watermarks and normalizes a paragraph of prose.
 */
export function cleanParagraph(text: string): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';

  for (const pattern of WATERMARK_PATTERNS) {
    if (pattern.test(trimmed)) {
      return '';
    }
  }

  return trimmed;
}

/**
 * Extracts and formats prose paragraphs from an HDocument using given selectors.
 * Preserves strict DOM/document order as required by Harbor rules.
 *
 * @param doc The parsed HDocument from harbor.parseHtml
 * @param containerSelector CSS selector for the chapter content container
 * @param blockSelector CSS selector for paragraph blocks within the container (default: 'p, blockquote')
 * @returns Clean prose string with paragraphs separated by double newline
 */
export function extractProse(
  doc: HDocument,
  containerSelector: string,
  blockSelector: string = 'p, blockquote'
): string {
  const container = doc.querySelector(containerSelector);
  if (!container) return '';

  const blocks = container.querySelectorAll(blockSelector);
  const paragraphs: string[] = [];

  for (const block of blocks) {
    const rawText = block.text();
    const cleaned = cleanParagraph(rawText);
    if (cleaned) {
      paragraphs.push(cleaned);
    }
  }

  // Fallback: if no <p> or <blockquote> tags matched, try reading text from container directly
  if (paragraphs.length === 0) {
    const rawContainer = container.text().trim();
    if (rawContainer) {
      return rawContainer
        .split(/\n\s*\n/)
        .map(cleanParagraph)
        .filter(Boolean)
        .join('\n\n');
    }
  }

  return paragraphs.join('\n\n');
}
