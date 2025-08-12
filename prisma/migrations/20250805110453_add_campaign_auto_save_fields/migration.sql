-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "theme" TEXT,
    "difficulty" TEXT,
    "playerCount" INTEGER,
    "characterSlots" INTEGER DEFAULT 4,
    "levelRange" TEXT,
    "estimatedDuration" TEXT,
    "setting" TEXT,
    "mainPlot" TEXT,
    "subPlots" TEXT,
    "majorNPCs" TEXT,
    "locations" TEXT,
    "items" TEXT,
    "quests" TEXT,
    "encounters" TEXT,
    "characters" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "userId" TEXT NOT NULL,
    "autoSave" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("characterSlots", "characters", "createdAt", "description", "difficulty", "encounters", "estimatedDuration", "id", "items", "levelRange", "locations", "mainPlot", "majorNPCs", "name", "notes", "playerCount", "quests", "setting", "status", "subPlots", "theme", "updatedAt", "userId") SELECT "characterSlots", "characters", "createdAt", "description", "difficulty", "encounters", "estimatedDuration", "id", "items", "levelRange", "locations", "mainPlot", "majorNPCs", "name", "notes", "playerCount", "quests", "setting", "status", "subPlots", "theme", "updatedAt", "userId" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
