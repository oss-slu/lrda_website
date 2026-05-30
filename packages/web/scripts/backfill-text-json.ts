/**
 * Backfill text_json for all notes that have HTML in `text` but no `text_json`.
 *
 * Uses happy-dom to provide a headless DOM for TipTap's generateJSON, then
 * connects to PostgreSQL and updates each note in place.
 *
 * Usage (from packages/web):
 *   node --env-file=../api/.env --import tsx scripts/backfill-text-json.ts [--dry-run]
 */

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// -- Headless DOM (must come before any TipTap imports) --
const { Window } = require('happy-dom');
const win = new Window();
const g = globalThis as Record<string, unknown>;
for (const key of [
  'window', 'document', 'navigator', 'DOMParser', 'Node', 'Element', 'HTMLElement',
  'HTMLAnchorElement', 'HTMLImageElement', 'HTMLVideoElement', 'HTMLAudioElement',
  'Text', 'Document', 'NodeList', 'customElements', 'getComputedStyle',
]) {
  const val = key === 'window' ? win : (win as Record<string, unknown>)[key];
  if (g[key] === undefined && val !== undefined) g[key] = val;
}

// -- TipTap extensions (same set as the editor, minus editor-only ones) --
import { Blockquote } from '@tiptap/extension-blockquote';
import { Bold } from '@tiptap/extension-bold';
import { BulletList } from '@tiptap/extension-bullet-list';
import { Code } from '@tiptap/extension-code';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Color } from '@tiptap/extension-color';
import { Document } from '@tiptap/extension-document';
import { FontFamily } from '@tiptap/extension-font-family';
import { HardBreak } from '@tiptap/extension-hard-break';
import { Highlight } from '@tiptap/extension-highlight';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Italic } from '@tiptap/extension-italic';
import { Link } from '@tiptap/extension-link';
import { ListItem } from '@tiptap/extension-list-item';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Strike } from '@tiptap/extension-strike';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { Text } from '@tiptap/extension-text';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';

// Use browser build of generateJSON (the node export uses zeed-dom which drops <img>).
const { generateJSON } = require('@tiptap/html');
const { FontSize, HeadingWithAnchor, ResizableImage, TableImproved } = require('mui-tiptap');

import { VideoNode } from '../src/utils/tiptap-video';
import { AudioNode } from '../src/utils/tiptap-audio';

const extensions = [
  TableImproved.configure({ resizable: true }),
  TableRow, TableHeader, TableCell,
  BulletList, CodeBlock, Document, HardBreak, ListItem, OrderedList,
  Paragraph, Subscript, Superscript, Text,
  Bold, Blockquote, Code, Italic, Underline, Strike,
  Link.configure({ autolink: true, linkOnPaste: true, openOnClick: false }),
  HeadingWithAnchor,
  TextAlign.configure({ types: ['heading', 'paragraph', 'image'], defaultAlignment: 'left' }),
  TextStyle, Color, FontFamily, FontSize,
  Highlight.configure({ multicolor: true }),
  HorizontalRule, ResizableImage,
  TaskList, TaskItem.configure({ nested: true }),
  VideoNode, AudioNode,
];

// -- Database --
import { Pool } from 'pg';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set. Pass --env-file=../api/.env');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url, max: 5 });

  try {
    const { rows } = await pool.query<{ id: string; title: string | null; text: string }>(
      `SELECT id, title, text FROM note WHERE text_json IS NULL AND text != '' ORDER BY created_at`,
    );

    console.log(`Found ${rows.length} notes to backfill${dryRun ? ' (dry run)' : ''}\n`);

    let ok = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        const json = generateJSON(row.text, extensions as any);

        if (!dryRun) {
          await pool.query('UPDATE note SET text_json = $1 WHERE id = $2', [JSON.stringify(json), row.id]);
        }

        ok++;
        const label = row.title?.slice(0, 40) || row.id;
        console.log(`  [ok] ${label}`);
      } catch (e) {
        failed++;
        console.error(`  [FAIL] ${row.id}: ${(e as Error).message}`);
      }
    }

    console.log(`\nDone. ${ok} converted, ${failed} failed.`);
    if (dryRun) console.log('(dry run -- no writes applied)');
  } finally {
    await pool.end();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
