-- CreateEnum
CREATE TYPE "LeagueRankingBasis" AS ENUM ('sets', 'games');

-- AlterTable
ALTER TABLE "league" ADD COLUMN     "prizes" TEXT;

-- AlterTable
ALTER TABLE "league_scoring_config" ADD COLUMN     "rankingBy" "LeagueRankingBasis" NOT NULL DEFAULT 'sets';
