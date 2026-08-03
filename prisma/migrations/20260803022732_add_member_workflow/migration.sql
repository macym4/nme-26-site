-- CreateTable
CREATE TABLE "TodoCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "taskKey" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TodoCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DateAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberOne" TEXT NOT NULL,
    "memberTwo" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "TodoCompletion_userId_taskKey_key" ON "TodoCompletion"("userId", "taskKey");

-- CreateIndex
CREATE UNIQUE INDEX "DateAssignment_memberOne_memberTwo_week_key" ON "DateAssignment"("memberOne", "memberTwo", "week");
