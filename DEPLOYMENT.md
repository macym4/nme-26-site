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

## Shared account recovery password

1. Run `npm run recovery-password` in an interactive terminal. Choose and confirm
   a private password; input is hidden and only its bcrypt hash is printed.
2. In Vercel, open Project Settings > Environment Variables. Set
   `ACCOUNT_RECOVERY_PASSWORD_HASH` to that hash for Production, then redeploy.
3. Use the normal sign-in form with an existing account's email and your recovery
   password. Normal account passwords continue to work. Approval, suspension,
   and role checks still apply. This is for member accounts, including the owner
   account, not the separate legacy `/admin/login` username/password form.

Recovery logins create `ACCOUNT_RECOVERY_LOGIN` audit records. The actor is marked
as shared recovery, since the password alone cannot identify who used it.
Removing or replacing the hash and redeploying revokes recovery sessions as well
as the old recovery password. Normal sign-in sessions are unaffected.

The feature is disabled when the variable is absent or empty. It requires no
database schema update. Do not commit the password or hash, or configure the
hash under a `NEXT_PUBLIC_` name.

## Admin password resets

Before deploying this feature, run `prisma/admin-password-reset-postgresql.sql`
in the production database SQL editor. It adds `mustChangePassword` and
`sessionVersion` with defaults; it does not change any existing password.
Do not run the SQLite migration history on PostgreSQL.

For local SQLite, apply the two statements in
`prisma/migrations/20260914000000_add_admin_password_reset/migration.sql`
once to your local database, then regenerate the SQLite client.

In Administration > Profile Management, choose another member and use Reset
password. Enter and confirm a temporary password, then share it privately.
The member must replace it at next sign-in before accessing member pages or
member actions. A reset ends that account's existing sessions, including
recovery-password sessions. Completing the change ends temporary-password
sessions. New recovery logins remain available if configured, but are also
required to finish a pending password change. Roles and approval status are
not changed. Self-reset is intentionally excluded from this admin workflow.

Run the isolated reset integration tests with:

```powershell
npx prisma generate --schema prisma/schema.sqlite.prisma
npx tsx --test lib/password-reset.test.ts lib/login-password.test.ts
```

Tests create a temporary database with test accounts and remove it afterward.
