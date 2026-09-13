CREATE TABLE "DateFeedbackCompletion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "assignmentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "DateFeedbackCompletion_assignmentId_userId_key" ON "DateFeedbackCompletion"("assignmentId", "userId");
CREATE TABLE "Announcement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "body" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
