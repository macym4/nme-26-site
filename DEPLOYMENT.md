# Database setup

Vercel uses `prisma/schema.prisma`, which targets PostgreSQL. Set DATABASE_URL
to the PostgreSQL connection string supplied by your database provider.
The build regenerates Prisma Client before compiling Next.js.

For a new, empty PostgreSQL database, create the tables once with:

```powershell
npx prisma db push --schema prisma/schema.prisma
```

Run this with DATABASE_URL pointing to the intended PostgreSQL database.
This creates the schema; it does not copy local accounts, roster, or assignments.
Do not run the sample seed to transfer real chapter data.
Existing production data needs review before applying schema changes.

The checked-in `prisma/migrations` history is SQLite-specific. Do not run it
against PostgreSQL or change its migration lock to PostgreSQL. A PostgreSQL
migration baseline must be established before adopting `prisma migrate deploy`.

For the existing local SQLite database, keep DATABASE_URL="file:./dev.db" and run:

```powershell
npx prisma generate --schema prisma/schema.sqlite.prisma
npm run dev
```

The SQLite schema preserves the local development setup. Keep its models in sync
with the production schema when adding fields. `npm run build` and `npm install`
generate the PostgreSQL client; regenerate the SQLite client afterward before
resuming local SQLite development.

The local database has not been changed or migrated by this deployment fix.
