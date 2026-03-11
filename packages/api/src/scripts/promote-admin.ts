/**
 * Promote an existing user to admin role.
 *
 * Usage:
 *   bun run src/scripts/promote-admin.ts <email>
 *
 * From project root:
 *   pnpm --filter api promote-admin <email>
 */

import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { openLocalDb } from './local-db';

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: bun run src/scripts/promote-admin.ts <email>');
    process.exit(1);
  }

  const { db, pool } = openLocalDb();

  try {
    const existing = await db.query.user.findFirst({
      where: eq(schema.user.email, email),
    });

    if (!existing) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    if (existing.role === 'admin') {
      console.log(`${email} is already an admin.`);
      process.exit(0);
    }

    await db
      .update(schema.user)
      .set({ role: 'admin', updatedAt: new Date() })
      .where(eq(schema.user.email, email));

    console.log(`Promoted ${email} (${existing.name}) to admin.`);
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
