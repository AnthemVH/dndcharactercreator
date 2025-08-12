-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "race" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "background" TEXT,
    "alignment" TEXT,
    "backstory" TEXT,
    "personalityTraits" TEXT,
    "stats" TEXT,
    "quote" TEXT,
    "uniqueTrait" TEXT,
    "hitPoints" INTEGER,
    "armorClass" INTEGER,
    "initiative" INTEGER,
    "speed" INTEGER,
    "proficiencies" TEXT,
    "features" TEXT,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Character_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Character" ("alignment", "armorClass", "background", "backstory", "class", "createdAt", "features", "hitPoints", "id", "initiative", "level", "name", "personalityTraits", "proficiencies", "quote", "race", "speed", "stats", "uniqueTrait", "updatedAt", "userId") SELECT "alignment", "armorClass", "background", "backstory", "class", "createdAt", "features", "hitPoints", "id", "initiative", "level", "name", "personalityTraits", "proficiencies", "quote", "race", "speed", "stats", "uniqueTrait", "updatedAt", "userId" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
CREATE TABLE "new_Encounter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "difficulty" TEXT,
    "enemies" TEXT,
    "environment" TEXT,
    "objectives" TEXT,
    "rewards" TEXT,
    "terrain" TEXT,
    "hazards" TEXT,
    "reinforcements" TEXT,
    "levelRange" TEXT,
    "estimatedDuration" TEXT,
    "tactics" TEXT,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Encounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Encounter_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Encounter" ("createdAt", "difficulty", "enemies", "environment", "estimatedDuration", "hazards", "id", "levelRange", "name", "objectives", "reinforcements", "rewards", "tactics", "terrain", "updatedAt", "userId") SELECT "createdAt", "difficulty", "enemies", "environment", "estimatedDuration", "hazards", "id", "levelRange", "name", "objectives", "reinforcements", "rewards", "tactics", "terrain", "updatedAt", "userId" FROM "Encounter";
DROP TABLE "Encounter";
ALTER TABLE "new_Encounter" RENAME TO "Encounter";
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rarity" TEXT,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Item_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("createdAt", "description", "id", "name", "rarity", "type", "updatedAt", "userId") SELECT "createdAt", "description", "id", "name", "rarity", "type", "updatedAt", "userId" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE TABLE "new_NPC" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "race" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "personality" TEXT,
    "location" TEXT,
    "backstory" TEXT,
    "personalityTraits" TEXT,
    "appearance" TEXT,
    "motivations" TEXT,
    "relationships" TEXT,
    "secrets" TEXT,
    "quote" TEXT,
    "uniqueTrait" TEXT,
    "stats" TEXT,
    "skills" TEXT,
    "equipment" TEXT,
    "goals" TEXT,
    "mood" TEXT,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NPC_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NPC_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_NPC" ("appearance", "backstory", "createdAt", "equipment", "goals", "id", "location", "mood", "motivations", "name", "personality", "personalityTraits", "quote", "race", "relationships", "role", "secrets", "skills", "stats", "uniqueTrait", "updatedAt", "userId") SELECT "appearance", "backstory", "createdAt", "equipment", "goals", "id", "location", "mood", "motivations", "name", "personality", "personalityTraits", "quote", "race", "relationships", "role", "secrets", "skills", "stats", "uniqueTrait", "updatedAt", "userId" FROM "NPC";
DROP TABLE "NPC";
ALTER TABLE "new_NPC" RENAME TO "NPC";
CREATE TABLE "new_Quest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" TEXT,
    "objectives" TEXT,
    "rewards" TEXT,
    "location" TEXT,
    "npcs" TEXT,
    "timeline" TEXT,
    "consequences" TEXT,
    "questType" TEXT,
    "levelRange" TEXT,
    "estimatedDuration" TEXT,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Quest_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Quest" ("consequences", "createdAt", "description", "difficulty", "estimatedDuration", "id", "levelRange", "location", "npcs", "objectives", "questType", "rewards", "timeline", "title", "updatedAt", "userId") SELECT "consequences", "createdAt", "description", "difficulty", "estimatedDuration", "id", "levelRange", "location", "npcs", "objectives", "questType", "rewards", "timeline", "title", "updatedAt", "userId" FROM "Quest";
DROP TABLE "Quest";
ALTER TABLE "new_Quest" RENAME TO "Quest";
CREATE TABLE "new_World" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "lore" TEXT,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "World_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "World_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_World" ("createdAt", "description", "id", "lore", "name", "updatedAt", "userId") SELECT "createdAt", "description", "id", "lore", "name", "updatedAt", "userId" FROM "World";
DROP TABLE "World";
ALTER TABLE "new_World" RENAME TO "World";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
