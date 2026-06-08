-- CreateEnum
CREATE TYPE "LeagueRoundStatus" AS ENUM ('draft', 'published', 'closed');

-- AlterTable
ALTER TABLE "league_round" ADD COLUMN     "status" "LeagueRoundStatus" NOT NULL DEFAULT 'draft';

-- Las jornadas que ya existían eran visibles públicamente: márcalas como
-- publicadas para no ocultarlas al introducir el nuevo estado por defecto
-- (draft). Las nuevas jornadas sí nacerán como borrador.
UPDATE "league_round" SET "status" = 'published';
