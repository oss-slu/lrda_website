-- Production data cleanup: 2026-05
--
-- 1. Demote every admin EXCEPT jacobamaynard@proton.me to role 'user'.
--    (Touches only `role`; is_instructor / instructor_id are untouched.)
-- 2. Delete 15 junk zero-note accounts (numeric / @example.com / @email.com / a few known
--    junk addrs) that are NOT instructors or students. Cascades their auth/session rows.
-- 3. Delete "crappy" notes -- R2-refined:
--      a. RERUM import orphans  (creator email like %@rerum.orphan)
--      b. Junk/test accounts    (numeric local-part, *@example.com, a few known junk addrs)
--      c. Near-empty drafts     (unpublished, text<20 chars, no media, no audio) created by
--                               accounts that have NEVER published a note (i.e. test/dev
--                               accounts) -- protects all real contributors' drafts.
--    Deleting a note cascades to its media + audio rows.
--
-- SAFETY: single transaction, ROLLS BACK by default (dry run).
--   Dry run:   psql -d lrda_production -f prod-cleanup-2026-05.sql
--   Commit:    psql -d lrda_production -v commit=1 -f prod-cleanup-2026-05.sql
-- Run the commit pass when no other writers are active to avoid lock contention.

\set ON_ERROR_STOP on
\timing on

BEGIN;

\echo '================ BEFORE ================'
SELECT
  (SELECT count(*) FROM "user")                                              AS users,
  (SELECT count(*) FROM "user" WHERE role = 'admin')                         AS admins,
  (SELECT count(*) FROM note)                                                AS notes,
  (SELECT count(*) FROM note WHERE is_published)                             AS published,
  (SELECT count(*) FROM media)                                               AS media,
  (SELECT count(*) FROM audio)                                               AS audio,
  (SELECT count(*) FILTER (WHERE is_instructor) FROM "user")                 AS instructors,
  (SELECT count(*) FILTER (WHERE instructor_id IS NOT NULL) FROM "user")     AS students;

-- ============ 1. ADMIN DEMOTION ============
WITH demoted AS (
  UPDATE "user" SET role = 'user', updated_at = now()
  WHERE role = 'admin' AND lower(email) <> lower('jacobamaynard@proton.me')
  RETURNING 1
)
SELECT count(*) AS admins_demoted FROM demoted;

-- ============ 2. JUNK ACCOUNT DELETION (15 expected) ============
\echo '---- junk zero-note accounts to delete ----'
SELECT email, name FROM "user" u
WHERE NOT EXISTS (SELECT 1 FROM note n WHERE n.creator_id = u.id)
  AND NOT u.is_instructor AND u.instructor_id IS NULL
  AND (u.email ~ '^[0-9]+@' OR u.email LIKE '%@example.com' OR u.email LIKE '%@email.com'
       OR u.email IN ('admin@admin.com','cena@gmail.com','jack@jill.com'))
ORDER BY email;

WITH del_users AS (
  DELETE FROM "user" u
  WHERE NOT EXISTS (SELECT 1 FROM note n WHERE n.creator_id = u.id)
    AND NOT u.is_instructor AND u.instructor_id IS NULL
    AND (u.email ~ '^[0-9]+@' OR u.email LIKE '%@example.com' OR u.email LIKE '%@email.com'
         OR u.email IN ('admin@admin.com','cena@gmail.com','jack@jill.com'))
  RETURNING 1
)
SELECT count(*) AS accounts_deleted FROM del_users;

-- ============ 3. NOTE CLEANUP (R2-refined) ============
\echo '---- note buckets to delete ----'
SELECT
  count(*) FILTER (WHERE u.email LIKE '%@rerum.orphan')                       AS rerum_orphans,
  count(*) FILTER (WHERE u.email ~ '^[0-9]+@' OR u.email LIKE '%@example.com'
                     OR u.email IN ('admin@admin.com','another@email.com','email@email.com')) AS junk_accounts,
  count(*) FILTER (WHERE NOT n.is_published AND length(btrim(coalesce(n.text,''))) < 20
                     AND u.email NOT LIKE '%@rerum.orphan'
                     AND NOT EXISTS (SELECT 1 FROM media m WHERE m.note_id = n.id)
                     AND NOT EXISTS (SELECT 1 FROM audio a WHERE a.note_id = n.id)
                     AND NOT EXISTS (SELECT 1 FROM note p WHERE p.creator_id = u.id AND p.is_published)) AS devtest_near_empty,
  count(*) FILTER (WHERE n.is_published) AS published_among_deleted
FROM note n JOIN "user" u ON u.id = n.creator_id
WHERE u.email LIKE '%@rerum.orphan'
   OR u.email ~ '^[0-9]+@' OR u.email LIKE '%@example.com'
   OR u.email IN ('admin@admin.com','another@email.com','email@email.com')
   OR (NOT n.is_published AND length(btrim(coalesce(n.text,''))) < 20
       AND NOT EXISTS (SELECT 1 FROM media m WHERE m.note_id = n.id)
       AND NOT EXISTS (SELECT 1 FROM audio a WHERE a.note_id = n.id)
       AND NOT EXISTS (SELECT 1 FROM note p WHERE p.creator_id = u.id AND p.is_published));

WITH del AS (
  DELETE FROM note n
  USING "user" u
  WHERE u.id = n.creator_id
    AND (
      u.email LIKE '%@rerum.orphan'
      OR u.email ~ '^[0-9]+@'
      OR u.email LIKE '%@example.com'
      OR u.email IN ('admin@admin.com','another@email.com','email@email.com')
      OR (
        NOT n.is_published
        AND length(btrim(coalesce(n.text,''))) < 20
        AND NOT EXISTS (SELECT 1 FROM media m WHERE m.note_id = n.id)
        AND NOT EXISTS (SELECT 1 FROM audio a WHERE a.note_id = n.id)
        AND NOT EXISTS (SELECT 1 FROM note p WHERE p.creator_id = u.id AND p.is_published)
      )
    )
  RETURNING 1
)
SELECT count(*) AS notes_deleted FROM del;

\echo '================ AFTER ================'
SELECT
  (SELECT count(*) FROM "user")                                              AS users,
  (SELECT count(*) FROM "user" WHERE role = 'admin')                         AS admins,
  (SELECT count(*) FROM note)                                                AS notes,
  (SELECT count(*) FROM note WHERE is_published)                             AS published,
  (SELECT count(*) FROM media)                                               AS media,
  (SELECT count(*) FROM audio)                                               AS audio,
  (SELECT count(*) FILTER (WHERE is_instructor) FROM "user")                 AS instructors,
  (SELECT count(*) FILTER (WHERE instructor_id IS NOT NULL) FROM "user")     AS students;

\if :{?commit}
  COMMIT;
  \echo '*** COMMITTED ***'
\else
  ROLLBACK;
  \echo '*** DRY RUN -- rolled back, nothing persisted ***'
\endif
