/**
 * Backfill location names for notes that have lat/lng but no locationName.
 *
 * Usage:
 *   node --import tsx src/scripts/backfill-location-names.ts
 *
 * Environment variables:
 *   GOOGLE_MAPS_API_KEY - API key for reverse geocoding (Geocoding API).
 *   GEOCODE_DELAY_MS    - (optional) Delay between calls in ms.
 *                         Default 500 (~10 min for ~1,200 notes).
 *   GEOCODE_MAX_NOTES   - (optional) Cap notes processed this run.
 */

import { note } from '../db/schema';
import { reverseGeocode } from '../lib/geocode';
import { eq, and, isNotNull, isNull } from 'drizzle-orm';
import { openLocalDb } from './local-db';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  const { db, pool } = openLocalDb();

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('Error: GOOGLE_MAPS_API_KEY environment variable is required');
    process.exit(1);
  }

  const delayMs = Number(process.env.GEOCODE_DELAY_MS ?? 500);
  const maxNotes = process.env.GEOCODE_MAX_NOTES
    ? Number(process.env.GEOCODE_MAX_NOTES)
    : Infinity;

  console.log('Starting backfill of location names...');
  const rows = await db.query.note.findMany({
    where: and(isNotNull(note.latitude), isNotNull(note.longitude), isNull(note.locationName)),
  });

  const target = Math.min(rows.length, maxNotes);
  console.log(
    `Found ${rows.length} notes to backfill; processing ${target} (delay ${delayMs}ms between calls)`,
  );

  let processed = 0;
  let updated = 0;
  let noResult = 0;

  for (const row of rows) {
    if (processed >= maxNotes) {
      console.log(`Reached GEOCODE_MAX_NOTES cap (${maxNotes}); stopping.`);
      break;
    }

    const lat = row.latitude;
    const lng = row.longitude;
    if (lat == null || lng == null) continue;

    const addr = await reverseGeocode(lat, lng, apiKey);
    processed++;

    if (addr) {
      await db.update(note).set({ locationName: addr }).where(eq(note.id, row.id));
      updated++;
      console.log(`[${processed}/${target}] Updated note ${row.id}: ${addr}`);
    } else {
      noResult++;
      console.warn(`[${processed}/${target}] No address for note ${row.id} (${lat}, ${lng})`);
    }

    if (processed < target) {
      await sleep(delayMs);
    }
  }

  console.log(
    `Backfill complete. Processed ${processed}, updated ${updated}, no-result ${noResult}.`,
  );
  await pool.end();
}

run().catch(err => {
  console.error('Backfill failed', err);
  process.exit(1);
});
