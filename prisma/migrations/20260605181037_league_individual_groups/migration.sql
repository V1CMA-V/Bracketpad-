-- CreateEnum
CREATE TYPE "LeaguePlayKind" AS ENUM ('individual', 'pairs');

-- CreateEnum
CREATE TYPE "GroupMovement" AS ENUM ('up', 'down', 'stay');

-- AlterTable
ALTER TABLE "league" ADD COLUMN     "playKind" "LeaguePlayKind" NOT NULL DEFAULT 'individual';

-- CreateTable
CREATE TABLE "league_group_slot" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "groupNumber" SMALLINT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "setsWon" SMALLINT,
    "rankInGroup" SMALLINT,
    "movement" "GroupMovement",

    CONSTRAINT "league_group_slot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "league_group_slot_roundId_groupNumber_idx" ON "league_group_slot"("roundId", "groupNumber");

-- CreateIndex
CREATE UNIQUE INDEX "league_group_slot_roundId_registrationId_key" ON "league_group_slot"("roundId", "registrationId");

-- AddForeignKey
ALTER TABLE "league_group_slot" ADD CONSTRAINT "league_group_slot_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "league_round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_group_slot" ADD CONSTRAINT "league_group_slot_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "league_registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
