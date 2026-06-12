-- DropForeignKey
ALTER TABLE "match" DROP CONSTRAINT "match_leagueRoundId_fkey";

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_leagueRoundId_fkey" FOREIGN KEY ("leagueRoundId") REFERENCES "league_round"("id") ON DELETE CASCADE ON UPDATE CASCADE;
