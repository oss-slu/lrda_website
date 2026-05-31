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
