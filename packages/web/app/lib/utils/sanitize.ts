import DOMPurify from 'dompurify';

/**
 * Configuration options for HTML sanitization
 */
export interface SanitizeOptions {
  /** Allow iframe elements (for embedded videos) */
  allowIframes?: boolean;
  /** Allow video elements */
  allowVideo?: boolean;
  /** Allow audio elements */
  allowAudio?: boolean;
  /** Strip blob: and data: URLs from media elements */
  stripBlobUrls?: boolean;
  /** List of trusted domains for iframes (e.g., youtube.com, vimeo.com) */
  trustedIframeDomains?: string[];
}

/**
 * Default allowed HTML tags for note content
 */
const DEFAULT_ALLOWED_TAGS = [
  // Text formatting
  'p',
  'br',
  'b',
  'i',
  'u',
  's',
  'strong',
  'em',
  'mark',
  'small',
  'del',
  'ins',
  'sub',
  'sup',
  // Headings
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  // Lists
  'ul',
  'ol',
  'li',
  // Links and media
  'a',
  'img',
  // Tables
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  // Block elements
  'div',
  'span',
  'blockquote',
  'pre',
  'code',
  'hr',
];

/**
 * Default allowed HTML attributes
 */
const DEFAULT_ALLOWED_ATTR = [
  'href',
  'src',
  'alt',
  'title',
  'class',
  'id',
  'style',
  'target',
  'rel',
  'width',
  'height',
  'colspan',
  'rowspan',
];

/**
 * Trusted domains for iframe embedding
 */
const DEFAULT_TRUSTED_IFRAME_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
];

/**
 * Checks if a URL belongs to a trusted domain
 */
function isTrustedDomain(url: string, trustedDomains: string[]): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return trustedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

/**
 * Removes blob: and data: URLs from HTML content
 */
function stripBlobAndDataUrls(html: string): string {
  let cleaned = html;

  // Remove img tags with blob: or data: URLs
  const imgBlobDataRegex = /<img[^>]*src\s*=\s*["'](blob:|data:)[^"']*["'][^>]*>/gi;
  cleaned = cleaned.replace(imgBlobDataRegex, '');

  // Remove blob:, data:, and javascript: from href attributes
  const hrefBlobDataRegex = /href=["'](blob:|data:|javascript:)[^"']*["']/gi;
  cleaned = cleaned.replace(hrefBlobDataRegex, 'href="#"');

  // Remove blob: and data: from src attributes (for any element)
  const srcBlobDataRegex = /src=["'](blob:|data:)[^"']*["']/gi;
  cleaned = cleaned.replace(srcBlobDataRegex, 'src=""');

  return cleaned;
}

/**
 * Sanitizes HTML content to prevent XSS attacks.
 *
 * This is the centralized sanitization utility for the application.
 * All user-generated HTML content should be passed through this function
 * before being rendered with dangerouslySetInnerHTML.
 *
 * @param dirty - The untrusted HTML string to sanitize
 * @param options - Optional configuration for sanitization behavior
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * ```tsx
 * import { sanitizeHtml } from '@/app/lib/utils/sanitize';
 *
 * // Basic usage
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
 *
 * // With options
 * const clean = sanitizeHtml(content, { allowVideo: true, stripBlobUrls: true });
 * ```
 */
export function sanitizeHtml(dirty: string, options: SanitizeOptions = {}): string {
  // Return empty string for falsy input
  if (!dirty) {
    return '';
  }

  // SSR safety check - return the input if window is undefined
  // DOMPurify requires a DOM environment
  if (typeof window === 'undefined') {
    console.warn('sanitizeHtml called during SSR - returning unsanitized content');
    return dirty;
  }

  const {
    allowIframes = false,
    allowVideo = false,
    allowAudio = false,
    stripBlobUrls = true,
    trustedIframeDomains = DEFAULT_TRUSTED_IFRAME_DOMAINS,
  } = options;

  // Pre-process: strip blob/data URLs if requested
  let processed = stripBlobUrls ? stripBlobAndDataUrls(dirty) : dirty;

  // Build allowed tags list based on options
  const allowedTags = [...DEFAULT_ALLOWED_TAGS];
  if (allowVideo) {
    allowedTags.push('video', 'source');
  }
  if (allowAudio) {
    allowedTags.push('audio', 'source');
  }
  if (allowIframes) {
    allowedTags.push('iframe');
  }

  // Build allowed attributes list based on options
  const allowedAttr = [...DEFAULT_ALLOWED_ATTR];
  if (allowVideo || allowAudio) {
    allowedAttr.push('controls', 'autoplay', 'loop', 'muted', 'preload', 'poster');
  }
  if (allowIframes) {
    allowedAttr.push('src', 'frameborder', 'allow', 'allowfullscreen', 'loading', 'referrerpolicy');
  }

  // Configure DOMPurify
  const config = {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttr,
    ALLOW_DATA_ATTR: false, // Disable data-* attributes for security
    FORBID_TAGS: ['script', 'style', 'noscript', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    RETURN_TRUSTED_TYPE: false, // Return string instead of TrustedHTML
  };

  // Sanitize the HTML
  let sanitized = DOMPurify.sanitize(processed, config) as string;

  // Post-process: validate iframe sources if iframes are allowed
  if (allowIframes && sanitized.includes('<iframe')) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitized;

    const iframes = tempDiv.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      const src = iframe.getAttribute('src');
      if (src && !isTrustedDomain(src, trustedIframeDomains)) {
        // Remove untrusted iframes
        iframe.remove();
      }
    });

    sanitized = tempDiv.innerHTML;
  }

  return sanitized;
}

/**
 * Extracts plain text from HTML content.
 * Useful for previews, summaries, or search indexing.
 *
 * @param html - HTML string to extract text from
 * @returns Plain text content without HTML tags
 *
 * @example
 * ```tsx
 * const preview = extractTextFromHtml(note.text).slice(0, 100) + '...';
 * ```
 */
export function extractTextFromHtml(html: string): string {
  if (!html) {
    return '';
  }

  // SSR safety check
  if (typeof window === 'undefined') {
    // Basic tag stripping for SSR - not perfect but functional
    return html.replace(/<[^>]*>/g, '').trim();
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}

/**
 * Sanitizes HTML and returns both sanitized HTML and plain text.
 * Convenient when you need both versions.
 *
 * @param dirty - The untrusted HTML string
 * @param options - Sanitization options
 * @returns Object with both sanitized HTML and extracted text
 */
export function sanitizeAndExtract(
  dirty: string,
  options: SanitizeOptions = {},
): { html: string; text: string } {
  const html = sanitizeHtml(dirty, options);
  const text = extractTextFromHtml(html);
  return { html, text };
}

export default sanitizeHtml;
