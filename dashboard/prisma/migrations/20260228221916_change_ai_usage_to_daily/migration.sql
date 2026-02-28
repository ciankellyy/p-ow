/*
  Warnings:

  - Added the required column `day` to the `UserAiUsage` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserAiUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_UserAiUsage" ("count", "id", "month", "userId", "year") SELECT "count", "id", "month", "userId", "year" FROM "UserAiUsage";
DROP TABLE "UserAiUsage";
ALTER TABLE "new_UserAiUsage" RENAME TO "UserAiUsage";
CREATE INDEX "UserAiUsage_userId_idx" ON "UserAiUsage"("userId");
CREATE UNIQUE INDEX "UserAiUsage_userId_day_month_year_key" ON "UserAiUsage"("userId", "day", "month", "year");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
