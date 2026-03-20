/**
 * Download all media from S3 referenced in rerum-notes-dump.json.
 *
 * Usage:
 *   pnpm --filter @lrda/api tsx scripts/download-media.ts [--webp] [--concurrency 10]
 *
 * Options:
 *   --webp          Convert downloaded JPEGs to WebP (requires cwebp on PATH)
 *   --concurrency   Max parallel downloads (default: 10)
 *   --dry-run       List files without downloading
 *
 * Output structure:
 *   media-download/
 *     images/        Original JPEGs (or WebP if --webp)
 *     videos/        MP4 and 3GP files
 *     audio/         MP3 files
 *     manifest.json  Mapping of original URL -> local path
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// --- Config ---

const DUMP_PATH = path.resolve(import.meta.dirname, '..', 'rerum-notes-dump.json');
const OUTPUT_DIR = path.resolve(import.meta.dirname, '..', 'media-download');

const args = process.argv.slice(2);
const convertWebp = args.includes('--webp');
const dryRun = args.includes('--dry-run');
const concurrencyIdx = args.indexOf('--concurrency');
const concurrency = concurrencyIdx !== -1 ? parseInt(args[concurrencyIdx + 1], 10) : 10;

// --- Extract URLs from dump ---

interface MediaEntry {
  url: string;
  type: 'image' | 'video' | 'audio';
  ext: string;
}

function extractMediaUrls(): MediaEntry[] {
  const raw = fs.readFileSync(DUMP_PATH, 'utf-8');
  const notes: any[] = JSON.parse(raw);
  const seen = new Set<string>();
  const entries: MediaEntry[] = [];

  for (const note of notes) {
    const media = Array.isArray(note.media) ? note.media : [];
    for (const m of media) {
      if (typeof m === 'object' && m !== null) {
        for (const key of ['uri', 'url', 'thumbnailUri', 'thumbnail']) {
          const v = m[key];
          if (typeof v === 'string' && v.startsWith('http') && !seen.has(v)) {
            seen.add(v);
            const ext = v.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
            let type: MediaEntry['type'] = 'image';
            if (['mp4', '3gp', 'gp3', 'webm', 'mov'].includes(ext)) type = 'video';
            else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) type = 'audio';
            entries.push({ url: v, type, ext });
          }
        }
      }
    }

    const audio = Array.isArray(note.audio) ? note.audio : [];
    for (const a of audio) {
      if (typeof a === 'object' && a !== null) {
        for (const key of ['uri', 'url']) {
          const v = a[key];
          if (typeof v === 'string' && v.startsWith('http') && !seen.has(v)) {
            seen.add(v);
            const ext = v.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
            entries.push({ url: v, type: 'audio', ext: ext || 'mp3' });
          }
        }
      }
    }
  }

  return entries;
}

// --- Download with concurrency ---

interface DownloadResult {
  url: string;
  localPath: string;
  originalSize: number;
  finalSize: number;
  converted: boolean;
  error?: string;
}

async function downloadFile(entry: MediaEntry): Promise<DownloadResult> {
  const filename = entry.url.split('/').pop()!.split('?')[0];
  const subdir = entry.type === 'image' ? 'images' : entry.type === 'video' ? 'videos' : 'audio';
  const dir = path.join(OUTPUT_DIR, subdir);

  const result: DownloadResult = {
    url: entry.url,
    localPath: '',
    originalSize: 0,
    finalSize: 0,
    converted: false,
  };

  try {
    const resp = await fetch(entry.url);
    if (!resp.ok) {
      result.error = `HTTP ${resp.status}`;
      return result;
    }

    const buffer = Buffer.from(await resp.arrayBuffer());
    result.originalSize = buffer.length;

    const originalPath = path.join(dir, filename);
    fs.writeFileSync(originalPath, buffer);
    result.localPath = originalPath;
    result.finalSize = buffer.length;

    // Convert JPEG to WebP if requested
    if (convertWebp && entry.type === 'image' && ['jpg', 'jpeg'].includes(entry.ext)) {
      const webpFilename = filename.replace(/\.jpe?g$/i, '.webp');
      const webpPath = path.join(dir, webpFilename);
      try {
        execFileSync('cwebp', ['-q', '80', originalPath, '-o', webpPath], {
          stdio: 'pipe',
        });
        const webpStats = fs.statSync(webpPath);
        result.finalSize = webpStats.size;
        result.converted = true;
        result.localPath = webpPath;
        // Remove original JPEG
        fs.unlinkSync(originalPath);
      } catch {
        // Keep original if conversion fails
        result.converted = false;
      }
    }
  } catch (err: any) {
    result.error = err.message;
  }

  return result;
}

async function downloadAll(entries: MediaEntry[]): Promise<DownloadResult[]> {
  const results: DownloadResult[] = [];
  let completed = 0;
  const total = entries.length;
  const startTime = Date.now();

  // Process in batches
  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(downloadFile));
    results.push(...batchResults);
    completed += batch.length;

    const elapsed = (Date.now() - startTime) / 1000;
    const rate = completed / elapsed;
    const eta = Math.round((total - completed) / rate);
    const errors = results.filter(r => r.error).length;

    process.stdout.write(
      `\r  ${completed}/${total} files | ${errors} errors | ${formatBytes(results.reduce((s, r) => s + r.finalSize, 0))} downloaded | ETA: ${eta}s`,
    );
  }
  process.stdout.write('\n');

  return results;
}

// --- Helpers ---

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// --- Main ---

async function main() {
  console.log('Extracting media URLs from dump...');
  const entries = extractMediaUrls();

  const images = entries.filter(e => e.type === 'image');
  const videos = entries.filter(e => e.type === 'video');
  const audio = entries.filter(e => e.type === 'audio');

  console.log(`Found ${entries.length} unique media files:`);
  console.log(`  Images: ${images.length}`);
  console.log(`  Videos: ${videos.length}`);
  console.log(`  Audio:  ${audio.length}`);
  console.log();

  if (dryRun) {
    console.log('Dry run -- not downloading.');
    return;
  }

  // Create output dirs
  for (const sub of ['images', 'videos', 'audio']) {
    fs.mkdirSync(path.join(OUTPUT_DIR, sub), { recursive: true });
  }

  console.log(`Downloading to ${OUTPUT_DIR}`);
  console.log(`Concurrency: ${concurrency}`);
  if (convertWebp) console.log('Converting JPEGs to WebP (quality 80)');
  console.log();

  const results = await downloadAll(entries);

  // Summary
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  const originalTotal = successful.reduce((s, r) => s + r.originalSize, 0);
  const finalTotal = successful.reduce((s, r) => s + r.finalSize, 0);
  const converted = successful.filter(r => r.converted).length;

  console.log();
  console.log('--- Summary ---');
  console.log(`Downloaded: ${successful.length}/${entries.length}`);
  console.log(`Failed:     ${failed.length}`);
  if (convertWebp) {
    console.log(`Converted:  ${converted} images to WebP`);
    console.log(`Original:   ${formatBytes(originalTotal)}`);
    console.log(`Final:      ${formatBytes(finalTotal)} (${Math.round((1 - finalTotal / originalTotal) * 100)}% reduction)`);
  } else {
    console.log(`Total size: ${formatBytes(finalTotal)}`);
  }

  // Write manifest
  const manifest: Record<string, string> = {};
  for (const r of successful) {
    manifest[r.url] = path.relative(OUTPUT_DIR, r.localPath);
  }
  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Manifest:   ${manifestPath}`);

  // Log failures
  if (failed.length > 0) {
    const failLog = path.join(OUTPUT_DIR, 'failures.json');
    fs.writeFileSync(failLog, JSON.stringify(failed.map(f => ({ url: f.url, error: f.error })), null, 2));
    console.log(`Failures:   ${failLog}`);
  }
}

main().catch(console.error);
