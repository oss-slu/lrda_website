import sanitize from 'sanitize-html';

export interface SanitizeOptions {
  /** Allow iframe elements (for embedded videos) */
  allowIframes?: boolean;
  /** Allow video elements */
  allowVideo?: boolean;
  /** Allow audio elements */
  allowAudio?: boolean;
  /** Strip blob: and data: URLs from media elements */
  stripBlobUrls?: boolean;
  /** Hostnames trusted to embed via iframe */
  trustedIframeDomains?: string[];
}

const BASE_TAGS = [
  'p', 'br', 'b', 'i', 'u', 's', 'strong', 'em', 'mark', 'small', 'del', 'ins', 'sub', 'sup',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span', 'blockquote', 'pre', 'code', 'hr',
];

const BASE_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id', 'style',
  'target', 'rel', 'width', 'height', 'colspan', 'rowspan',
];

const MEDIA_ATTR = ['controls', 'autoplay', 'loop', 'muted', 'preload', 'poster'];
const IFRAME_ATTR = ['src', 'frameborder', 'allow', 'allowfullscreen', 'loading', 'referrerpolicy'];

const DEFAULT_TRUSTED_IFRAME_DOMAINS = [
  'youtube.com', 'www.youtube.com', 'youtu.be', 'vimeo.com', 'player.vimeo.com',
];

/**
 * Sanitizes user-generated HTML before it is rendered with
 * `dangerouslySetInnerHTML`. Runs identically on the server and the client
 * (parser-based, no DOM), so sanitized content can be server-rendered.
 */
export function sanitizeHtml(dirty: string, options: SanitizeOptions = {}): string {
  if (!dirty) return '';

  const {
    allowIframes = false,
    allowVideo = false,
    allowAudio = false,
    stripBlobUrls = true,
    trustedIframeDomains = DEFAULT_TRUSTED_IFRAME_DOMAINS,
  } = options;

  const allowedTags = [...BASE_TAGS];
  const allowedAttributes = [...BASE_ATTR];

  if (allowVideo) allowedTags.push('video', 'source');
  if (allowAudio) allowedTags.push('audio', 'source');
  if (allowVideo || allowAudio) allowedAttributes.push(...MEDIA_ATTR);
  if (allowIframes) {
    allowedTags.push('iframe');
    allowedAttributes.push(...IFRAME_ATTR);
  }

  // Omitting data:/blob: from the allowed schemes is what drops those URLs.
  const allowedSchemes = ['http', 'https', 'ftp', 'mailto', 'tel'];
  if (!stripBlobUrls) allowedSchemes.push('data', 'blob');

  return sanitize(dirty, {
    allowedTags,
    allowedAttributes: { '*': allowedAttributes },
    allowedSchemes,
    allowedIframeHostnames: allowIframes ? trustedIframeDomains : [],
    allowIframeRelativeUrls: false,
    disallowedTagsMode: 'discard',
  });
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ',
};

/**
 * Extracts plain text from HTML for previews, summaries, or meta descriptions.
 */
/**
 * Extracts plain text from a ProseMirror JSON document tree.
 */
export function extractTextFromJson(doc: unknown): string {
  if (!doc || typeof doc !== 'object') return '';
  const parts: string[] = [];
  const walk = (node: Record<string, unknown>) => {
    if (typeof node.text === 'string') parts.push(node.text);
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        if (child && typeof child === 'object') walk(child as Record<string, unknown>);
      }
    }
  };
  walk(doc as Record<string, unknown>);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function extractTextFromHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, match => ENTITIES[match] ?? match)
    .replace(/\s+/g, ' ')
    .trim();
}
