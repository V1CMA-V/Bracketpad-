/*
  Warnings:

  - You are about to drop the column `pointsDraw` on the `league_scoring_config` table. All the data in the column will be lost.
  - You are about to drop the column `pointsLoss` on the `league_scoring_config` table. All the data in the column will be lost.
  - You are about to drop the column `pointsWalkover` on the `league_scoring_config` table. All the data in the column will be lost.
  - You are about to drop the column `pointsWin` on the `league_scoring_config` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `league_standing` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "league_standing_leagueId_division_points_idx";

-- AlterTable
ALTER TABLE "league_scoring_config" DROP COLUMN "pointsDraw",
DROP COLUMN "pointsLoss",
DROP COLUMN "pointsWalkover",
DROP COLUMN "pointsWin",
ALTER COLUMN "tiebreaker1" SET DEFAULT 'set_diff',
ALTER COLUMN "tiebreaker2" SET DEFAULT 'sets_won';

-- AlterTable
ALTER TABLE "league_standing" DROP COLUMN "points";

-- CreateIndex
CREATE INDEX "league_standing_leagueId_division_setsFor_idx" ON "league_standing"("leagueId", "division", "setsFor");
