# SQLite database

The CRM uses a local SQLite database at `data/app.db`. Its `DATABASE_URL` is `file:../data/app.db`, relative to `prisma/schema.prisma`.

## Initialize

```bash
npm install
npm run db:migrate
npm run db:generate
```

`db:migrate` creates the database and applies the `sohar_leads` schema. It does not connect to, import from, or modify any hosted database.

## Reset the local database

```bash
npm run db:reset
```

This permanently deletes and recreates **only** `data/app.db`. The database, WAL, and SHM files are ignored by Git.

The schema retains the unique phone-number constraint and the `(status, created_at)` index. SQLite stores timestamps without PostgreSQL's `TIMESTAMPTZ` type; Prisma continues to expose these fields as `DateTime` values.
