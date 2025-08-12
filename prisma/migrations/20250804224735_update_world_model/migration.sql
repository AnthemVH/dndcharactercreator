/*
  Warnings:

  - You are about to drop the column `description` on the `World` table. All the data in the column will be lost.
  - You are about to drop the column `lore` on the `World` table. All the data in the column will be lost.
  - Added the required column `climate` to the `World` table without a default value. This is not possible if the table is not empty.
  - Added the required column `culture` to the `World` table without a default value. This is not possible if the table is not empty.
  - Added the required column `economy` to the `World` table without a default value. This is not possible if the table is not empty.
  - Added the required column `geography` to the `World` table without a default value. This is not possible if the table is not empty.
  - Added the required column `government` to the `World` table without a default value. This is not possible if the table is not empty.
  - Added the required column `history` to the `World` table without a default value. This is not possible if the table is not empty.
  - Added the required column `landName` to the `World` table without a default value. This is not possible if the table is not empty.
  - Added the required column `politics` to the `World` table without a default value. This is not possible if the table is not empty.
  - Added the required column `population` to the `World` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quote` to the `World` table without a default value. This is not possible if the table is not empty.
  - Added the required column `religion` to the `World` table without a default value. This is not possible if the table is not empty.
  - Added the required column `theme` to the `World` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uniqueFeature` to the `World` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "World_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "World_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_World" ("campaignId", "createdAt", "id", "name", "updatedAt", "userId") SELECT "campaignId", "createdAt", "id", "name", "updatedAt", "userId" FROM "World";
DROP TABLE "World";
ALTER TABLE "new_World" RENAME TO "World";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
