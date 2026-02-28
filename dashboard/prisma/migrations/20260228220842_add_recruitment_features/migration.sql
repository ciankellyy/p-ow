-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Form" (
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
    "isApplication" BOOLEAN NOT NULL DEFAULT false,
    "notifyChannelId" TEXT,
    "thankYouMessage" TEXT,
    "requiredRoleIds" TEXT,
    "ignoredRoleIds" TEXT,
    "publicShareId" TEXT NOT NULL,
    "editorShareId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "Form_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Form" ("allowMultiple", "bannerUrl", "createdAt", "createdBy", "description", "editorShareId", "expiresAt", "id", "ignoredRoleIds", "isAnonymous", "maxResponses", "notifyChannelId", "publicShareId", "requiredRoleIds", "requiresAuth", "serverId", "status", "thankYouMessage", "title", "updatedAt") SELECT "allowMultiple", "bannerUrl", "createdAt", "createdBy", "description", "editorShareId", "expiresAt", "id", "ignoredRoleIds", "isAnonymous", "maxResponses", "notifyChannelId", "publicShareId", "requiredRoleIds", "requiresAuth", "serverId", "status", "thankYouMessage", "title", "updatedAt" FROM "Form";
DROP TABLE "Form";
ALTER TABLE "new_Form" RENAME TO "Form";
CREATE UNIQUE INDEX "Form_publicShareId_key" ON "Form"("publicShareId");
CREATE UNIQUE INDEX "Form_editorShareId_key" ON "Form"("editorShareId");
CREATE INDEX "Form_serverId_idx" ON "Form"("serverId");
CREATE INDEX "Form_publicShareId_idx" ON "Form"("publicShareId");
CREATE INDEX "Form_editorShareId_idx" ON "Form"("editorShareId");
CREATE TABLE "new_Server" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "bannerUrl" TEXT,
    "customName" TEXT,
    "discordGuildId" TEXT,
    "suspendedRoleId" TEXT,
    "terminatedRoleId" TEXT,
    "staffRoleId" TEXT,
    "permLogChannelId" TEXT,
    "staffRequestChannelId" TEXT,
    "raidAlertChannelId" TEXT,
    "commandLogChannelId" TEXT,
    "onDutyRoleId" TEXT,
    "autoSyncRoles" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriberUserId" TEXT,
    "subscriptionPlan" TEXT,
    "customBotToken" TEXT,
    "customBotEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxUploadSize" INTEGER,
    "staffRequestRateLimit" INTEGER,
    "logCacheTtl" INTEGER,
    "automationCacheTtl" INTEGER,
    "recruitmentChannelId" TEXT,
    "congratsChannelId" TEXT,
    "applicationAiThreshold" INTEGER NOT NULL DEFAULT 70,
    "autoStaffRoleId" TEXT
);
INSERT INTO "new_Server" ("api_key", "autoSyncRoles", "automationCacheTtl", "bannerUrl", "commandLogChannelId", "createdAt", "customBotEnabled", "customBotToken", "customName", "discordGuildId", "id", "logCacheTtl", "maxUploadSize", "name", "onDutyRoleId", "permLogChannelId", "raidAlertChannelId", "staffRequestChannelId", "staffRequestRateLimit", "staffRoleId", "subscriberUserId", "subscriptionPlan", "suspendedRoleId", "terminatedRoleId") SELECT "api_key", "autoSyncRoles", "automationCacheTtl", "bannerUrl", "commandLogChannelId", "createdAt", "customBotEnabled", "customBotToken", "customName", "discordGuildId", "id", "logCacheTtl", "maxUploadSize", "name", "onDutyRoleId", "permLogChannelId", "raidAlertChannelId", "staffRequestChannelId", "staffRequestRateLimit", "staffRoleId", "subscriberUserId", "subscriptionPlan", "suspendedRoleId", "terminatedRoleId" FROM "Server";
DROP TABLE "Server";
ALTER TABLE "new_Server" RENAME TO "Server";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
