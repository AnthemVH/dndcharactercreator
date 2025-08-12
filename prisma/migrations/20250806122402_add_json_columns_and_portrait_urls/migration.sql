-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN "campaignJson" JSONB;

-- AlterTable
ALTER TABLE "Character" ADD COLUMN "characterJson" JSONB;
ALTER TABLE "Character" ADD COLUMN "portraitUrl" TEXT;

-- AlterTable
ALTER TABLE "Encounter" ADD COLUMN "encounterJson" JSONB;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN "itemJson" JSONB;

-- AlterTable
ALTER TABLE "NPC" ADD COLUMN "npcJson" JSONB;
ALTER TABLE "NPC" ADD COLUMN "portraitUrl" TEXT;

-- AlterTable
ALTER TABLE "Quest" ADD COLUMN "questJson" JSONB;

-- AlterTable
ALTER TABLE "World" ADD COLUMN "worldJson" JSONB;
