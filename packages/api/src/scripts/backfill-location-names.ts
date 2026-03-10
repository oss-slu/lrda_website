/**
 * Backfill location names for notes that have lat/lng but no locationName.
 *
 * Usage:
 *   bun run src/scripts/backfill-location-names.ts
 *
 * Environment variables:
 *   GOOGLE_MAPS_API_KEY - Required for reverse geocoding
 *   D1_DB_PATH          - (optional) Override path to local D1 SQLite file
 */

import { note } from '../db/schema';
import { reverseGeocode } from '../lib/geocode';
import { eq, and, isNotNull, isNull } from 'drizzle-orm';
import { openLocalDb } from './local-db';

async function run() {
  const { db, sqlite } = openLocalDb();

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('Error: GOOGLE_MAPS_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log('Starting backfill of location names...');
  const rows = await db.query.note.findMany({
    where: and(isNotNull(note.latitude), isNotNull(note.longitude), isNull(note.locationName)),
  });

  console.log(`Found ${rows.length} notes to backfill`);

  for (const row of rows) {
    const lat = row.latitude;
    const lng = row.longitude;
    if (lat == null || lng == null) continue;
    const addr = await reverseGeocode(lat, lng, apiKey);
    if (addr) {
      await db.update(note).set({ locationName: addr }).where(eq(note.id, row.id));
      console.log(`Updated note ${row.id}: ${addr}`);
    }
  }

  console.log('Backfill complete.');
  sqlite.close();
}

run().catch(err => {
  console.error('Backfill failed', err);
  process.exit(1);
});
