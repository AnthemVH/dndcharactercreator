/*
  Warnings:

  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `isSubscribed` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `paystackCustomerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionPlan` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Subscription_userId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Subscription";
PRAGMA foreign_keys=on;

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
    "portrait" TEXT,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "autoSave" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Character_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Character" ("alignment", "armorClass", "background", "backstory", "campaignId", "class", "createdAt", "features", "hitPoints", "id", "initiative", "level", "name", "personalityTraits", "portrait", "proficiencies", "quote", "race", "speed", "stats", "uniqueTrait", "updatedAt", "userId") SELECT "alignment", "armorClass", "background", "backstory", "campaignId", "class", "createdAt", "features", "hitPoints", "id", "initiative", "level", "name", "personalityTraits", "portrait", "proficiencies", "quote", "race", "speed", "stats", "uniqueTrait", "updatedAt", "userId" FROM "Character";
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
    "autoSave" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Encounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Encounter_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Encounter" ("campaignId", "createdAt", "difficulty", "enemies", "environment", "estimatedDuration", "hazards", "id", "levelRange", "name", "objectives", "reinforcements", "rewards", "tactics", "terrain", "updatedAt", "userId") SELECT "campaignId", "createdAt", "difficulty", "enemies", "environment", "estimatedDuration", "hazards", "id", "levelRange", "name", "objectives", "reinforcements", "rewards", "tactics", "terrain", "updatedAt", "userId" FROM "Encounter";
DROP TABLE "Encounter";
ALTER TABLE "new_Encounter" RENAME TO "Encounter";
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "properties" TEXT,
    "magicalEffects" TEXT,
    "history" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "weight" TEXT NOT NULL,
    "requirements" TEXT,
    "attunement" BOOLEAN NOT NULL,
    "quote" TEXT NOT NULL,
    "uniqueTrait" TEXT NOT NULL,
    "craftingMaterials" TEXT,
    "enchantments" TEXT,
    "restrictions" TEXT,
    "portrait" TEXT,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "autoSave" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Item_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("attunement", "campaignId", "craftingMaterials", "createdAt", "description", "enchantments", "history", "id", "itemType", "magicalEffects", "name", "portrait", "properties", "quote", "rarity", "requirements", "restrictions", "theme", "uniqueTrait", "updatedAt", "userId", "value", "weight") SELECT "attunement", "campaignId", "craftingMaterials", "createdAt", "description", "enchantments", "history", "id", "itemType", "magicalEffects", "name", "portrait", "properties", "quote", "rarity", "requirements", "restrictions", "theme", "uniqueTrait", "updatedAt", "userId", "value", "weight" FROM "Item";
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
    "portrait" TEXT,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "autoSave" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NPC_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NPC_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_NPC" ("appearance", "backstory", "campaignId", "createdAt", "equipment", "goals", "id", "location", "mood", "motivations", "name", "personality", "personalityTraits", "portrait", "quote", "race", "relationships", "role", "secrets", "skills", "stats", "uniqueTrait", "updatedAt", "userId") SELECT "appearance", "backstory", "campaignId", "createdAt", "equipment", "goals", "id", "location", "mood", "motivations", "name", "personality", "personalityTraits", "portrait", "quote", "race", "relationships", "role", "secrets", "skills", "stats", "uniqueTrait", "updatedAt", "userId" FROM "NPC";
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
    "autoSave" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Quest_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Quest" ("campaignId", "consequences", "createdAt", "description", "difficulty", "estimatedDuration", "id", "levelRange", "location", "npcs", "objectives", "questType", "rewards", "timeline", "title", "updatedAt", "userId") SELECT "campaignId", "consequences", "createdAt", "description", "difficulty", "estimatedDuration", "id", "levelRange", "location", "npcs", "objectives", "questType", "rewards", "timeline", "title", "updatedAt", "userId" FROM "Quest";
DROP TABLE "Quest";
ALTER TABLE "new_Quest" RENAME TO "Quest";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "tokens" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "name", "password", "role", "tokens", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", "password", "role", "tokens", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_World" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "landName" TEXT NOT NULL,
    "geography" TEXT NOT NULL,
    "politics" TEXT NOT NULL,
    "culture" TEXT NOT NULL,
    "notableEvents" TEXT,
    "majorFactions" TEXT,
    "landmarks" TEXT,
    "climate" TEXT NOT NULL,
    "resources" TEXT,
    "population" TEXT NOT NULL,
    "government" TEXT NOT NULL,
    "religion" TEXT NOT NULL,
    "economy" TEXT NOT NULL,
    "conflicts" TEXT,
    "legends" TEXT,
    "quote" TEXT NOT NULL,
    "uniqueFeature" TEXT NOT NULL,
    "history" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "autoSave" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "World_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "World_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_World" ("campaignId", "climate", "conflicts", "createdAt", "culture", "economy", "geography", "government", "history", "id", "landName", "landmarks", "legends", "majorFactions", "name", "notableEvents", "politics", "population", "quote", "religion", "resources", "theme", "uniqueFeature", "updatedAt", "userId") SELECT "campaignId", "climate", "conflicts", "createdAt", "culture", "economy", "geography", "government", "history", "id", "landName", "landmarks", "legends", "majorFactions", "name", "notableEvents", "politics", "population", "quote", "religion", "resources", "theme", "uniqueFeature", "updatedAt", "userId" FROM "World";
DROP TABLE "World";
ALTER TABLE "new_World" RENAME TO "World";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
