/**
 * Promote an existing user to admin role.
 *
 * Usage:
 *   bun run src/scripts/promote-admin.ts <email>
 *
 * From project root:
 *   pnpm --filter api promote-admin <email>
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';

const DATABASE_URL = process.env.DATABASE_URL || '';

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: bun run src/scripts/promote-admin.ts <email>');
    process.exit(1);
  }

  if (!DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool, { schema });

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
