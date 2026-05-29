# Admin Logs UI

## Goal

Expose persistent, queryable application logs through the admin UI in the web app. Currently logs are only accessible via SSH (`docker logs lrda-api-blue`), which is inconvenient for monitoring sync operations, password resets, and other background processes.

## Requirements

- Persist structured log entries (timestamp, level, category, message, metadata) to PostgreSQL
- Admin UI page to browse, filter, and search logs
- Categories should include at minimum: `auth`, `sync`, `email`
- Retention policy to prevent unbounded growth (e.g. 30 days)

## Motivation

Several background processes produce important operational output that is currently only visible in container stdout:

- Firebase password sync on reset (`[auth] Synced password reset to Firebase for ...`)
- RERUM note sync results
- Firebase user sync results
- Email delivery failures

Surfacing these in the admin UI removes the need to SSH into Lightsail to diagnose issues.
