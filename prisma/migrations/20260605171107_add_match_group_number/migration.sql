-- AlterTable
ALTER TABLE "match" ADD COLUMN     "groupNumber" SMALLINT;

-- CreateIndex
CREATE INDEX "match_leagueRoundId_groupNumber_idx" ON "match"("leagueRoundId", "groupNumber");
