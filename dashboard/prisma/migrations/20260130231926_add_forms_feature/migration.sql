/*
  Warnings:

  - You are about to drop the column `permissions` on the `Role` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Member" ADD COLUMN "discordId" TEXT;

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "trigger" TEXT NOT NULL,
    "conditions" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "lastRunAt" DATETIME,
    "serverId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Automation_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BotQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    CONSTRAINT "BotQueue_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" DATETIME,
    "rateLimit" INTEGER NOT NULL DEFAULT 5,
    "dailyLimit" INTEGER NOT NULL DEFAULT 500,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "resetAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BannedIp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ip" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userId" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CommandQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sourceServerId" TEXT,
    "relatedUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Form" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "bannerUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "requiresAuth" BOOLEAN NOT NULL DEFAULT false,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT true,
    "maxResponses" INTEGER,
    "expiresAt" DATETIME,
    "notifyChannelId" TEXT,
    "publicShareId" TEXT NOT NULL,
    "editorShareId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "Form_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FormSection_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "config" TEXT NOT NULL DEFAULT '{}',
    "conditions" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "FormQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FormSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formId" TEXT NOT NULL,
    "respondentId" TEXT,
    "respondentEmail" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'completed',
    CONSTRAINT "FormResponse_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "responseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "FormAnswer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "FormResponse" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FormAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "FormQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormEditorAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormEditorAccess_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#ffffff',
    "quotaMinutes" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "discordRoleId" TEXT,
    "canShift" BOOLEAN NOT NULL DEFAULT true,
    "canViewOtherShifts" BOOLEAN NOT NULL DEFAULT true,
    "canViewLogs" BOOLEAN NOT NULL DEFAULT true,
    "canViewPunishments" BOOLEAN NOT NULL DEFAULT true,
    "canIssueWarnings" BOOLEAN NOT NULL DEFAULT true,
    "canKick" BOOLEAN NOT NULL DEFAULT true,
    "canBan" BOOLEAN NOT NULL DEFAULT true,
    "canBanBolo" BOOLEAN NOT NULL DEFAULT true,
    "canUseToolbox" BOOLEAN NOT NULL DEFAULT true,
    "canManageBolos" BOOLEAN NOT NULL DEFAULT true,
    "canRequestLoa" BOOLEAN NOT NULL DEFAULT true,
    "canViewQuota" BOOLEAN NOT NULL DEFAULT true,
    "canUseAdminCommands" BOOLEAN NOT NULL DEFAULT false,
    "serverId" TEXT NOT NULL,
    CONSTRAINT "Role_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Role" ("color", "id", "isDefault", "name", "quotaMinutes", "serverId") SELECT "color", "id", "isDefault", "name", "quotaMinutes", "serverId" FROM "Role";
DROP TABLE "Role";
ALTER TABLE "new_Role" RENAME TO "Role";
CREATE TABLE "new_Server" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "bannerUrl" TEXT,
    "customName" TEXT,
    "onDutyRoleId" TEXT,
    "discordGuildId" TEXT,
    "autoSyncRoles" BOOLEAN NOT NULL DEFAULT false,
    "suspendedRoleId" TEXT,
    "terminatedRoleId" TEXT,
    "staffRoleId" TEXT,
    "permLogChannelId" TEXT,
    "staffRequestChannelId" TEXT,
    "raidAlertChannelId" TEXT,
    "commandLogChannelId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Server" ("api_key", "bannerUrl", "createdAt", "customName", "id", "name", "raidAlertChannelId") SELECT "api_key", "bannerUrl", "createdAt", "customName", "id", "name", "raidAlertChannelId" FROM "Server";
DROP TABLE "Server";
ALTER TABLE "new_Server" RENAME TO "Server";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Automation_serverId_idx" ON "Automation"("serverId");

-- CreateIndex
CREATE INDEX "BotQueue_serverId_status_idx" ON "BotQueue"("serverId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "BannedIp_ip_key" ON "BannedIp"("ip");

-- CreateIndex
CREATE INDEX "SecurityLog_ip_idx" ON "SecurityLog"("ip");

-- CreateIndex
CREATE INDEX "SecurityLog_createdAt_idx" ON "SecurityLog"("createdAt");

-- CreateIndex
CREATE INDEX "CommandQueue_serverId_status_idx" ON "CommandQueue"("serverId", "status");

-- CreateIndex
CREATE INDEX "CommandQueue_status_createdAt_idx" ON "CommandQueue"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Form_publicShareId_key" ON "Form"("publicShareId");

-- CreateIndex
CREATE UNIQUE INDEX "Form_editorShareId_key" ON "Form"("editorShareId");

-- CreateIndex
CREATE INDEX "Form_serverId_idx" ON "Form"("serverId");

-- CreateIndex
CREATE INDEX "Form_publicShareId_idx" ON "Form"("publicShareId");

-- CreateIndex
CREATE INDEX "Form_editorShareId_idx" ON "Form"("editorShareId");

-- CreateIndex
CREATE INDEX "FormSection_formId_idx" ON "FormSection"("formId");

-- CreateIndex
CREATE INDEX "FormQuestion_sectionId_idx" ON "FormQuestion"("sectionId");

-- CreateIndex
CREATE INDEX "FormResponse_formId_idx" ON "FormResponse"("formId");

-- CreateIndex
CREATE INDEX "FormResponse_respondentId_idx" ON "FormResponse"("respondentId");

-- CreateIndex
CREATE INDEX "FormAnswer_responseId_idx" ON "FormAnswer"("responseId");

-- CreateIndex
CREATE INDEX "FormAnswer_questionId_idx" ON "FormAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "FormAnswer_responseId_questionId_key" ON "FormAnswer"("responseId", "questionId");

-- CreateIndex
CREATE INDEX "FormEditorAccess_userId_idx" ON "FormEditorAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FormEditorAccess_formId_userId_key" ON "FormEditorAccess"("formId", "userId");

-- CreateIndex
CREATE INDEX "Log_serverId_type_prcTimestamp_idx" ON "Log"("serverId", "type", "prcTimestamp");

-- CreateIndex
CREATE INDEX "Member_userId_idx" ON "Member"("userId");

-- CreateIndex
CREATE INDEX "Member_discordId_serverId_idx" ON "Member"("discordId", "serverId");

-- CreateIndex
CREATE INDEX "Punishment_serverId_userId_createdAt_idx" ON "Punishment"("serverId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "Shift_userId_startTime_idx" ON "Shift"("userId", "startTime");

-- CreateIndex
CREATE INDEX "Shift_serverId_startTime_idx" ON "Shift"("serverId", "startTime");
