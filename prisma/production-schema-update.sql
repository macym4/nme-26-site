-- Add missing objects to the August 2026 PostgreSQL deployment without changing existing accounts.
DO $repair$ BEGIN
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileImage" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pledgeClass" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "rosterMemberId" TEXT;
CREATE TABLE IF NOT EXISTS "RosterMember" (
  "id" TEXT PRIMARY KEY, "canonicalName" TEXT NOT NULL, "pledgeClass" TEXT NOT NULL,
  "aliases" TEXT NOT NULL DEFAULT '[]', "dateSheetName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "RosterMember_canonicalName_key" ON "RosterMember"("canonicalName");
CREATE UNIQUE INDEX IF NOT EXISTS "User_rosterMemberId_key" ON "User"("rosterMemberId");
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_rosterMemberId_fkey' AND conrelid = '"User"'::regclass) THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_rosterMemberId_fkey" FOREIGN KEY ("rosterMemberId") REFERENCES "RosterMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
CREATE TABLE IF NOT EXISTS "TodoTask" (
  "key" TEXT PRIMARY KEY, "label" TEXT NOT NULL, "href" TEXT, "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "DateFeedbackCompletion" (
  "id" TEXT PRIMARY KEY, "assignmentId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "DateFeedbackCompletion_assignmentId_userId_key" ON "DateFeedbackCompletion"("assignmentId", "userId");
CREATE TABLE IF NOT EXISTS "Announcement" (
  "id" TEXT PRIMARY KEY, "title" TEXT NOT NULL DEFAULT '', "body" TEXT NOT NULL, "authorName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
END $repair$;
