import { db } from '../db';
import { note } from '../db/schema';
import { reverseGeocode } from '../lib/geocode';
import { eq, and, isNotNull, isNull } from 'drizzle-orm';

async function run() {
  console.log('Starting backfill of location names...');
  const rows = await db.query.note.findMany({
    where: and(isNotNull(note.latitude), isNotNull(note.longitude), isNull(note.locationName)),
  });

  for (const row of rows) {
    const lat = row.latitude;
    const lng = row.longitude;
    if (lat == null || lng == null) continue;
    const addr = await reverseGeocode(lat, lng);
    if (addr) {
      await db.update(note).set({ locationName: addr }).where(eq(note.id, row.id));
      console.log(`Updated note ${row.id}: ${addr}`);
    }
  }
  console.log('Backfill complete.');
}

run().catch(err => {
  console.error('Backfill failed', err);
  process.exit(1);
});
