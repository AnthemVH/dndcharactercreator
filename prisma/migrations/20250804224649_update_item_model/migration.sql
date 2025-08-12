/*
  Warnings:

  - You are about to drop the column `type` on the `Item` table. All the data in the column will be lost.
  - Added the required column `attunement` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `history` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemType` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quote` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `theme` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uniqueTrait` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rarity` on table `Item` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Item_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("campaignId", "createdAt", "description", "id", "name", "rarity", "updatedAt", "userId") SELECT "campaignId", "createdAt", "description", "id", "name", "rarity", "updatedAt", "userId" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
