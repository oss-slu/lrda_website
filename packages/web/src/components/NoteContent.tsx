import React from 'react';
import { renderJSONContentToReactElement } from '@tiptap/static-renderer/json/react';

type JSONMark = { type: string; attrs?: Record<string, unknown> };

type JSONNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: JSONMark[];
  content?: JSONNode[];
  forEach?: (cb: (node: JSONNode) => void) => void;
};

const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

function safeUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw.length === 0) return undefined;
  const trimmed = raw.trim();
  if (/^[^a-zA-Z]/.test(trimmed) || !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed;
  try {
    const scheme = new URL(trimmed).protocol;
    return SAFE_SCHEMES.has(scheme) ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

function alignStyle(attrs?: Record<string, unknown>): React.CSSProperties | undefined {
  const a = attrs?.textAlign;
  return typeof a === 'string' && a !== 'left' ? { textAlign: a as React.CSSProperties['textAlign'] } : undefined;
}

type NodeProps = { node: JSONNode; children?: React.ReactNode };
type MarkProps = { mark: { attrs?: Record<string, unknown> }; children?: React.ReactNode };

const nodeMapping: Record<string, (p: NodeProps) => React.ReactNode> = {
  doc: ({ children }) => <>{children}</>,
  text: ({ node }) => node.text ?? '',
  paragraph: ({ node, children }) => <p style={alignStyle(node.attrs)}>{children}</p>,
  heading: ({ node, children }) => {
    const level = Math.min(6, Math.max(1, Number(node.attrs?.level) || 1));
    const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
    return <Tag style={alignStyle(node.attrs)}>{children}</Tag>;
  },
  bulletList: ({ children }) => <ul>{children}</ul>,
  orderedList: ({ children }) => <ol>{children}</ol>,
  listItem: ({ children }) => <li>{children}</li>,
  taskList: ({ children }) => <ul data-type="taskList">{children}</ul>,
  taskItem: ({ node, children }) => (
    <li data-type="taskItem" data-checked={node.attrs?.checked ? 'true' : 'false'}>
      <label>
        <input type="checkbox" checked={Boolean(node.attrs?.checked)} readOnly />
      </label>
      <div>{children}</div>
    </li>
  ),
  blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  codeBlock: ({ children }) => (
    <pre>
      <code>{children}</code>
    </pre>
  ),
  horizontalRule: () => <hr />,
  hardBreak: () => <br />,
  table: ({ children }) => (
    <table>
      <tbody>{children}</tbody>
    </table>
  ),
  tableRow: ({ children }) => <tr>{children}</tr>,
  tableHeader: ({ node, children }) => (
    <th colSpan={Number(node.attrs?.colspan) || undefined} rowSpan={Number(node.attrs?.rowspan) || undefined}>
      {children}
    </th>
  ),
  tableCell: ({ node, children }) => (
    <td colSpan={Number(node.attrs?.colspan) || undefined} rowSpan={Number(node.attrs?.rowspan) || undefined}>
      {children}
    </td>
  ),
  image: ({ node }) => {
    const src = safeUrl(node.attrs?.src);
    if (!src) return null;
    const width = node.attrs?.width;
    return (
      <img
        src={src}
        alt={typeof node.attrs?.alt === 'string' ? node.attrs.alt : ''}
        style={typeof width === 'number' ? { width: `${width}%` } : undefined}
      />
    );
  },
  video: ({ node }) => {
    const src = safeUrl(node.attrs?.src);
    if (!src) return null;
    const width = node.attrs?.width;
    return (
      <video controls preload="metadata" src={src} style={typeof width === 'number' ? { width: `${width}%` } : undefined} />
    );
  },
  audio: ({ node }) => {
    const src = safeUrl(node.attrs?.src);
    if (!src) return null;
    return <audio controls preload="metadata" src={src} style={{ width: '100%' }} />;
  },
};

const markMapping: Record<string, (p: MarkProps) => React.ReactNode> = {
  bold: ({ children }) => <strong>{children}</strong>,
  italic: ({ children }) => <em>{children}</em>,
  underline: ({ children }) => <u>{children}</u>,
  strike: ({ children }) => <s>{children}</s>,
  code: ({ children }) => <code>{children}</code>,
  subscript: ({ children }) => <sub>{children}</sub>,
  superscript: ({ children }) => <sup>{children}</sup>,
  highlight: ({ mark, children }) => {
    const color = mark.attrs?.color;
    return <mark style={typeof color === 'string' ? { backgroundColor: color } : undefined}>{children}</mark>;
  },
  textStyle: ({ mark, children }) => {
    const { color, fontFamily, fontSize } = (mark.attrs ?? {}) as Record<string, string | undefined>;
    const style: React.CSSProperties = {};
    if (color) style.color = color;
    if (fontFamily) style.fontFamily = fontFamily;
    if (fontSize) style.fontSize = fontSize;
    return Object.keys(style).length ? <span style={style}>{children}</span> : <>{children}</>;
  },
  link: ({ mark, children }) => {
    const href = safeUrl(mark.attrs?.href);
    if (!href) return <>{children}</>;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer nofollow">
        {children}
      </a>
    );
  },
};

const render = renderJSONContentToReactElement<JSONMark, JSONNode>({
  nodeMapping,
  markMapping,
  unhandledNode: () => null,
  unhandledMark: ({ children }: MarkProps) => <>{children}</>,
});

export function NoteContent({ doc, className }: { doc: unknown; className?: string }) {
  return <div className={className ?? 'note-content prose max-w-none'}>{render({ content: doc as JSONNode })}</div>;
}
