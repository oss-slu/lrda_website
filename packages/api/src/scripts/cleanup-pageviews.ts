/**
 * Cleanup script for analytics data retention
 * Deletes page views older than 90 days to manage storage
 *
 * Run: npx ts-node packages/api/src/scripts/cleanup-pageviews.ts
 * Or add as a cron job: 0 2 * * * npx ts-node packages/api/src/scripts/cleanup-pageviews.ts
 */

import { pageView } from '../db/schema';
import { lt } from 'drizzle-orm';
import { openLocalDb } from './local-db';

const RETENTION_DAYS = 90;

async function cleanup() {
  const { db, pool } = openLocalDb();
  try {
    console.log(`Starting cleanup of page views older than ${RETENTION_DAYS} days...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    const result = await db.delete(pageView).where(lt(pageView.createdAt, cutoffDate));

    console.log(`Cleanup completed. Deleted old analytics records.`);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    await pool.end();
    process.exit(1);
  }
}

cleanup();
