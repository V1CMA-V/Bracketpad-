-- AlterTable
ALTER TABLE "tournament_category" ADD COLUMN     "advancePerGroup" SMALLINT,
ADD COLUMN     "goldenPoint" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "prize" TEXT,
ADD COLUMN     "teamsPerGroup" SMALLINT,
ADD COLUMN     "tiebreakAt" SMALLINT NOT NULL DEFAULT 6;
