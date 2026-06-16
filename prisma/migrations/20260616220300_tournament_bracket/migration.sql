-- AlterTable
ALTER TABLE "match" ADD COLUMN     "bracketSlot" SMALLINT;

-- AlterTable
ALTER TABLE "tournament_category" ADD COLUMN     "thirdPlaceMatch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wildcardSlots" SMALLINT DEFAULT 0;

-- AlterTable
ALTER TABLE "tournament_team" ADD COLUMN     "eliminatedInRound" TEXT;

-- CreateIndex
CREATE INDEX "match_categoryId_bracketRound_idx" ON "match"("categoryId", "bracketRound");
