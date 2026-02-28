-- CreateTable
CREATE TABLE "UserAiUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE INDEX "UserAiUsage_userId_idx" ON "UserAiUsage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAiUsage_userId_month_year_key" ON "UserAiUsage"("userId", "month", "year");
